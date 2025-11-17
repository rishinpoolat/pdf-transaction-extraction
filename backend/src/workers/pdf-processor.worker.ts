import { Worker, Job } from 'bullmq';
import { createRedisConnection } from '../config/redis.config';
import { QUEUE_NAMES, PdfProcessingJobData } from '../config/queue.config';
import { extractPdfMetadata, parsePdfPagesInBatches } from '../services/pdf-parser.service';
import { translateText } from '../services/translation.service';
import { db } from '../db';
import { pdfs, transactions } from '../db/schema';
import { eq } from 'drizzle-orm';

// Processing configuration
const BATCH_SIZE = 5; // Process 5 pages at a time

/**
 * Extract transaction data from page text
 * This is a placeholder - customize based on your Tamil PDF structure
 */
function extractTransactionFromPage(pageText: string, pageNumber: number): any[] {
  // For now, treat each page as one transaction
  // You'll need to implement actual parsing logic based on your PDF structure
  const transactions = [];

  // Split by common patterns (customize based on your PDF)
  const lines = pageText.split('\n').filter((line) => line.trim());

  if (lines.length > 0) {
    transactions.push({
      pageNumber,
      originalText: pageText,
      rawLines: lines,
    });
  }

  return transactions;
}

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
    const metadata = await extractPdfMetadata(filepath);
    console.log(`📄 PDF has ${metadata.totalPages} pages`);

    await db
      .update(pdfs)
      .set({
        totalPages: metadata.totalPages,
        currentStep: 'parsing_pages',
      })
      .where(eq(pdfs.id, pdfId));

    await job.updateProgress({
      step: 'metadata_extracted',
      totalPages: metadata.totalPages,
      progress: 5,
    });

    // Step 2: Process pages in batches
    let processedPages = 0;
    let totalTransactions = 0;

    for await (const pageBatch of parsePdfPagesInBatches(filepath, BATCH_SIZE)) {
      console.log(
        `📖 Processing pages ${processedPages + 1} to ${processedPages + pageBatch.length}`
      );

      // Update status
      await db
        .update(pdfs)
        .set({
          currentStep: 'parsing_and_translating',
          processedPages: processedPages + pageBatch.length,
          progressPercentage: Math.round(
            ((processedPages + pageBatch.length) / metadata.totalPages) * 80
          ),
        })
        .where(eq(pdfs.id, pdfId));

      // Process each page in the batch
      for (const page of pageBatch) {
        console.log(`📝 Processing page ${page.pageNumber}...`);

        // Extract transactions from page
        const pageTransactions = extractTransactionFromPage(page.text, page.pageNumber);

        // Translate page text
        let translatedText = '';
        try {
          translatedText = await translateText(page.text, (current, total) => {
            console.log(`🌐 Translating chunk ${current}/${total} for page ${page.pageNumber}`);
          });
        } catch (error) {
          console.error(`❌ Translation failed for page ${page.pageNumber}:`, error);
          translatedText = `[Translation failed: ${error}]`;
        }

        // Store transactions in database
        for (const txn of pageTransactions) {
          await db.insert(transactions).values({
            pdfId: pdfId,
            originalText: txn.originalText,
            translatedText: translatedText,
            pageNumber: page.pageNumber,
            // Add extracted fields here based on your parsing logic
            buyerNameTamil: null,
            sellerNameTamil: null,
            buyerNameEnglish: null,
            sellerNameEnglish: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          totalTransactions++;
        }
      }

      processedPages += pageBatch.length;

      // Update job progress
      await job.updateProgress({
        step: 'processing_pages',
        processedPages,
        totalPages: metadata.totalPages,
        progress: Math.round((processedPages / metadata.totalPages) * 80),
      });
    }

    // Step 3: Finalize
    console.log(`✅ Completed processing ${processedPages} pages, ${totalTransactions} transactions`);

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
