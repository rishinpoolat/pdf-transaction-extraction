import { Worker, Job } from 'bullmq';
import { createRedisConnection } from '../config/redis.config';
import { QUEUE_NAMES, PdfProcessingJobData } from '../config/queue.config';
import { extractPdfMetadata, parsePdfPagesInBatches } from '../services/pdf-parser.service';
import { translateText } from '../services/translation.service';
import { splitIntoTransactions, parseTransactionText } from '../services/transaction-parser.service';
import { db } from '../db';
import { pdfs, transactions } from '../db/schema';
import { eq } from 'drizzle-orm';

// Processing configuration
const BATCH_SIZE = 5; // Process 5 pages at a time

/**
 * Process a single PDF job
 */
async function processPdfJob(job: Job<PdfProcessingJobData>) {
  const { pdfId, filepath, filename } = job.data;

  try {
    console.log(`🚀 Starting PDF processing for job ${job.id}, PDF ID: ${pdfId}`);

    // Update status to processing
    await db
      .update(pdfs)
      .set({
        processingStatus: 'processing',
        currentStep: 'extracting_metadata',
      })
      .where(eq(pdfs.id, pdfId));

    // Step 1: Extract metadata
    console.log(`📊 Step 1/3: Extracting PDF metadata...`);
    const metadata = await extractPdfMetadata(filepath);
    console.log(`✅ Metadata extracted - PDF has ${metadata.totalPages} pages`);
    console.log(`📈 Progress: 5% - Starting page processing...`);

    await db
      .update(pdfs)
      .set({
        totalPages: metadata.totalPages,
        currentStep: 'parsing_pages',
        progressPercentage: 5,
      })
      .where(eq(pdfs.id, pdfId));

    await job.updateProgress({
      step: 'metadata_extracted',
      totalPages: metadata.totalPages,
      progress: 5,
    });

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📊 Step 2/3: Processing ${metadata.totalPages} pages...`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // Step 2: Process pages in batches
    let processedPages = 0;
    let totalTransactions = 0;

    for await (const pageBatch of parsePdfPagesInBatches(filepath, BATCH_SIZE)) {
      const batchStart = processedPages + 1;
      const batchEnd = processedPages + pageBatch.length;

      console.log(`\n${'='.repeat(60)}`);
      console.log(`📖 Processing batch: Pages ${batchStart} to ${batchEnd}`);
      console.log(`${'='.repeat(60)}`);

      // Update status
      const currentProgress = Math.round(
        ((processedPages + pageBatch.length) / metadata.totalPages) * 80
      );

      await db
        .update(pdfs)
        .set({
          currentStep: 'parsing_and_translating',
          processedPages: processedPages + pageBatch.length,
          progressPercentage: currentProgress,
        })
        .where(eq(pdfs.id, pdfId));

      console.log(`📊 Progress updated: ${currentProgress}% (${processedPages + pageBatch.length}/${metadata.totalPages} pages)`);

      // Process each page in the batch
      for (const page of pageBatch) {
        console.log(`\n${'─'.repeat(60)}`);
        console.log(`📄 Page ${page.pageNumber}/${metadata.totalPages} - Starting processing...`);
        console.log(`${'─'.repeat(60)}`);

        // Split page into individual transactions
        const transactionTexts = splitIntoTransactions(page.text);
        console.log(`📋 Found ${transactionTexts.length} transactions on page ${page.pageNumber}`);

        // Translate page text (translate once for the whole page)
        console.log(`🌐 Translating page ${page.pageNumber}...`);
        let translatedText = '';
        try {
          translatedText = await translateText(page.text, (current, total) => {
            console.log(`  └─ Translating chunk ${current}/${total} for page ${page.pageNumber}`);
          });
          console.log(`✅ Translation completed for page ${page.pageNumber}`);
        } catch (error) {
          console.error(`❌ Translation failed for page ${page.pageNumber}:`, error);
          translatedText = `[Translation failed: ${error}]`;
        }

        // Parse and store each transaction
        console.log(`\n💾 Storing ${transactionTexts.length} transactions from page ${page.pageNumber}...`);

        for (let txnIndex = 0; txnIndex < transactionTexts.length; txnIndex++) {
          const txnText = transactionTexts[txnIndex];

          // Parse transaction to extract structured fields (pass translated text for English extraction)
          const parsedTxn = parseTransactionText(txnText, translatedText);

          console.log(`  [${txnIndex + 1}/${transactionTexts.length}] Doc ${parsedTxn.documentNumber}/${parsedTxn.documentYear} - ${parsedTxn.nature || 'Unknown type'}`);
          console.log(`    ├─ Seller: ${parsedTxn.executantName || 'N/A'}`);
          console.log(`    ├─ Buyer: ${parsedTxn.claimantName || 'N/A'}`);
          console.log(`    ├─ Village: ${parsedTxn.village || 'N/A'}`);
          console.log(`    └─ Survey: ${parsedTxn.surveyNumber || 'N/A'}`);

          await db.insert(transactions).values({
            pdfId: pdfId,
            pageNumber: page.pageNumber,

            // Document details
            documentNumber: parsedTxn.documentNumber,
            documentYear: parsedTxn.documentYear,

            // Dates
            executionDate: parsedTxn.executionDate,
            presentationDate: parsedTxn.presentationDate,
            registrationDate: parsedTxn.registrationDate,

            // Transaction type
            transactionNature: parsedTxn.nature,

            // Parties (English names extracted from translated text)
            sellerName: parsedTxn.executantName,
            buyerName: parsedTxn.claimantName,

            // Property details (English extracted from translated text)
            surveyNumber: parsedTxn.surveyNumber,
            plotNumber: parsedTxn.plotNumber,
            village: parsedTxn.village,
            street: parsedTxn.street,
            propertyType: parsedTxn.propertyType,
            propertyExtent: parsedTxn.propertyExtent,

            // Financial
            considerationValue: parsedTxn.considerationValue,
            marketValue: parsedTxn.marketValue,

            // Reference
            previousDocumentNumber: parsedTxn.previousDocumentNumber,
            volumeNumber: parsedTxn.volumeNumber,
            pageNumberRef: parsedTxn.pageNumber,

            createdAt: new Date(),
            updatedAt: new Date(),
          });

          totalTransactions++;

          // Update total_transactions count immediately in database
          await db
            .update(pdfs)
            .set({ totalTransactions })
            .where(eq(pdfs.id, pdfId));
        }

        console.log(`✅ Stored ${transactionTexts.length} transactions from page ${page.pageNumber}`);
        console.log(`📊 Total transactions so far: ${totalTransactions}`);
      }

      processedPages += pageBatch.length;

      // Update job progress
      const overallProgress = Math.round((processedPages / metadata.totalPages) * 80);
      await job.updateProgress({
        step: 'processing_pages',
        processedPages,
        totalPages: metadata.totalPages,
        totalTransactions,
        progress: overallProgress,
      });

      console.log(`\n${'━'.repeat(60)}`);
      console.log(`📊 Batch completed! Progress: ${overallProgress}% (${processedPages}/${metadata.totalPages} pages, ${totalTransactions} transactions)`);
      console.log(`${'━'.repeat(60)}\n`);
    }

    // Step 3: Finalize
    console.log(`\n${'━'.repeat(60)}`);
    console.log(`🎉 Step 3/3: Finalizing...`);
    console.log(`${'━'.repeat(60)}`);
    console.log(`✅ Completed processing ${processedPages} pages`);
    console.log(`✅ Total transactions extracted: ${totalTransactions}`);

    await db
      .update(pdfs)
      .set({
        processingStatus: 'completed',
        currentStep: 'completed',
        processedPages: metadata.totalPages,
        totalTransactions,
        progressPercentage: 100,
        processedAt: new Date(),
      })
      .where(eq(pdfs.id, pdfId));

    await job.updateProgress({
      step: 'completed',
      processedPages: metadata.totalPages,
      totalPages: metadata.totalPages,
      totalTransactions,
      progress: 100,
    });

    console.log(`\n${'🎉'.repeat(30)}`);
    console.log(`✅ PDF PROCESSING COMPLETE!`);
    console.log(`${'🎉'.repeat(30)}`);
    console.log(`📄 File: ${filename}`);
    console.log(`📊 Total pages: ${metadata.totalPages}`);
    console.log(`💼 Total transactions: ${totalTransactions}`);
    console.log(`⏱️  Processing completed at: ${new Date().toISOString()}`);
    console.log(`${'━'.repeat(60)}\n`);

    return {
      success: true,
      pdfId,
      filename,
      totalPages: metadata.totalPages,
      totalTransactions,
    };
  } catch (error) {
    console.error(`❌ Error processing PDF job ${job.id}:`, error);

    // Update status to failed
    await db
      .update(pdfs)
      .set({
        processingStatus: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      })
      .where(eq(pdfs.id, pdfId));

    throw error;
  }
}

/**
 * Create and start the worker
 */
export function startPdfProcessingWorker() {
  const worker = new Worker<PdfProcessingJobData>(QUEUE_NAMES.PDF_PROCESSING, processPdfJob, {
    connection: createRedisConnection(),
    concurrency: 2, // Process 2 PDFs concurrently
    limiter: {
      max: 10, // Maximum 10 jobs
      duration: 60000, // per 60 seconds
    },
  });

  // Worker event listeners
  worker.on('completed', (job) => {
    console.log(`✅ Worker completed job ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Worker failed job ${job?.id}:`, err);
  });

  worker.on('error', (err) => {
    console.error('❌ Worker error:', err);
  });

  console.log('👷 PDF processing worker started');

  return worker;
}

// Graceful shutdown
export async function stopWorker(worker: Worker) {
  await worker.close();
  console.log('✅ Worker stopped');
}

export default startPdfProcessingWorker;
