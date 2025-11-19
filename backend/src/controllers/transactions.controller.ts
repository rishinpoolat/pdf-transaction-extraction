import { Request, Response, NextFunction } from 'express';
import { errorHandler, httpErrorCodes } from '../utils/error';
import { savePdfFile } from '../services/pdf.service';
import { pdfProcessingQueue } from '../config/queue.config';
import { db } from '../db';
import { pdfs, transactions } from '../db/schema';
import { eq, sql, and } from 'drizzle-orm';

/**
 * Upload and process PDF file
 * POST /api/transactions/upload
 */
export async function uploadPdf(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return next(
        errorHandler(httpErrorCodes.BAD_REQUEST, 'No PDF file uploaded')
      );
    }

    const file = req.file;

    // Validate file buffer
    if (!file.buffer || file.buffer.length === 0) {
      return next(
        errorHandler(httpErrorCodes.BAD_REQUEST, 'Uploaded file is empty')
      );
    }

    // Save PDF file to disk
    const savedFile = await savePdfFile(file.buffer, file.originalname);

    // Create PDF record in database
    const [pdfRecord] = await db
      .insert(pdfs)
      .values({
        filename: savedFile.filename,
        originalName: savedFile.originalName,
        filePath: savedFile.filepath,
        fileSize: savedFile.fileSize,
        processingStatus: 'queued',
        currentStep: 'queued',
      })
      .returning();

    // Add job to queue
    const job = await pdfProcessingQueue.add('process-pdf', {
      pdfId: pdfRecord.id,
      filename: savedFile.filename,
      filepath: savedFile.filepath,
      originalName: savedFile.originalName,
    });

    // Update PDF record with job ID
    await db
      .update(pdfs)
      .set({ jobId: job.id })
      .where(eq(pdfs.id, pdfRecord.id));

    // Return success response immediately
    return res.status(202).json({
      success: true,
      message: 'PDF uploaded and queued for processing',
      data: {
        pdfId: pdfRecord.id,
        jobId: job.id,
        filename: savedFile.filename,
        originalName: savedFile.originalName,
        fileSize: savedFile.fileSize,
        status: 'queued',
        statusUrl: `/api/transactions/status/${pdfRecord.id}`,
        progressUrl: `/api/transactions/progress/${pdfRecord.id}`,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      return next(
        errorHandler(
          httpErrorCodes.INTERNAL_SERVER,
          `Failed to process PDF: ${error.message}`
        )
      );
    }

    return next(
      errorHandler(
        httpErrorCodes.INTERNAL_SERVER,
        'An unexpected error occurred while processing the PDF'
      )
    );
  }
}

/**
 * Get all transactions with optional filters
 * GET /api/transactions?pdfId=1&page=1&limit=50&buyerName=John&sellerName=Jane&surveyNumber=123&documentNumber=456
 */
export async function getTransactions(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const {
      pdfId,
      page = '1',
      limit = '50',
      buyerName,
      sellerName,
      surveyNumber,
      documentNumber,
      village,
      plotNumber
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    let query = db.select().from(transactions);

    // Build WHERE conditions
    const conditions = [];

    // Filter by PDF ID if provided
    if (pdfId) {
      conditions.push(eq(transactions.pdfId, parseInt(pdfId as string)));
    }

    // Filter by buyer name (case-insensitive partial match)
    if (buyerName && typeof buyerName === 'string') {
      conditions.push(sql`LOWER(${transactions.buyerName}) LIKE LOWER(${'%' + buyerName + '%'})`);
    }

    // Filter by seller name (case-insensitive partial match)
    if (sellerName && typeof sellerName === 'string') {
      conditions.push(sql`LOWER(${transactions.sellerName}) LIKE LOWER(${'%' + sellerName + '%'})`);
    }

    // Filter by survey number
    if (surveyNumber && typeof surveyNumber === 'string') {
      conditions.push(sql`${transactions.surveyNumber} LIKE ${'%' + surveyNumber + '%'}`);
    }

    // Filter by document number
    if (documentNumber && typeof documentNumber === 'string') {
      conditions.push(sql`${transactions.documentNumber} LIKE ${'%' + documentNumber + '%'}`);
    }

    // Filter by village (case-insensitive partial match)
    if (village && typeof village === 'string') {
      conditions.push(sql`LOWER(${transactions.village}) LIKE LOWER(${'%' + village + '%'})`);
    }

    // Filter by plot number
    if (plotNumber && typeof plotNumber === 'string') {
      conditions.push(sql`${transactions.plotNumber} LIKE ${'%' + plotNumber + '%'}`);
    }

    // Apply all conditions with AND
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    // Get transactions with pagination
    const results = await query.limit(limitNum).offset(offset);

    // Get total count - apply same filters
    let totalQuery = db.select().from(transactions);
    if (conditions.length > 0) {
      totalQuery = totalQuery.where(and(...conditions)) as typeof totalQuery;
    }

    const allResults = await totalQuery;
    const total = allResults.length;

    return res.status(200).json({
      success: true,
      data: {
        transactions: results,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    return next(
      errorHandler(
        httpErrorCodes.INTERNAL_SERVER,
        'Failed to retrieve transactions'
      )
    );
  }
}

/**
 * Get a single transaction by ID
 * GET /api/transactions/:id
 */
export async function getTransactionById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const transactionId = parseInt(req.params.id);

    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, transactionId));

    if (!transaction) {
      return next(errorHandler(httpErrorCodes.NOT_FOUND, 'Transaction not found'));
    }

    return res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    return next(
      errorHandler(
        httpErrorCodes.INTERNAL_SERVER,
        'Failed to retrieve transaction'
      )
    );
  }
}

/**
 * Get all PDFs
 * GET /api/transactions/pdfs
 */
export async function getAllPdfs(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const allPdfs = await db.select().from(pdfs).orderBy(pdfs.uploadedAt);

    return res.status(200).json({
      success: true,
      data: allPdfs,
      total: allPdfs.length,
    });
  } catch (error) {
    return next(
      errorHandler(httpErrorCodes.INTERNAL_SERVER, 'Failed to retrieve PDFs')
    );
  }
}

/**
 * Get PDF by ID with transactions
 * GET /api/transactions/pdf/:pdfId
 */
export async function getPdfWithTransactions(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const pdfId = parseInt(req.params.pdfId);

    // Get PDF details
    const [pdf] = await db.select().from(pdfs).where(eq(pdfs.id, pdfId));

    if (!pdf) {
      return next(errorHandler(httpErrorCodes.NOT_FOUND, 'PDF not found'));
    }

    // Get transactions for this PDF
    const pdfTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.pdfId, pdfId))
      .orderBy(transactions.pageNumber);

    return res.status(200).json({
      success: true,
      data: {
        pdf,
        transactions: pdfTransactions,
        transactionCount: pdfTransactions.length,
      },
    });
  } catch (error) {
    return next(
      errorHandler(
        httpErrorCodes.INTERNAL_SERVER,
        'Failed to retrieve PDF details'
      )
    );
  }
}

/**
 * Get PDF processing status
 * GET /api/transactions/status/:pdfId
 */
export async function getPdfStatus(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const pdfId = parseInt(req.params.pdfId);

    if (isNaN(pdfId)) {
      return next(errorHandler(httpErrorCodes.BAD_REQUEST, 'Invalid PDF ID'));
    }

    // Get PDF record
    const [pdfRecord] = await db.select().from(pdfs).where(eq(pdfs.id, pdfId));

    if (!pdfRecord) {
      return next(errorHandler(httpErrorCodes.NOT_FOUND, 'PDF not found'));
    }

    // Get job status if job ID exists
    let jobStatus = null;
    if (pdfRecord.jobId) {
      const job = await pdfProcessingQueue.getJob(pdfRecord.jobId);
      if (job) {
        jobStatus = {
          id: job.id,
          state: await job.getState(),
          progress: job.progress,
          attemptsMade: job.attemptsMade,
          failedReason: job.failedReason,
        };
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        pdfId: pdfRecord.id,
        filename: pdfRecord.filename,
        originalName: pdfRecord.originalName,
        status: pdfRecord.processingStatus,
        currentStep: pdfRecord.currentStep,
        totalPages: pdfRecord.totalPages,
        processedPages: pdfRecord.processedPages,
        progressPercentage: pdfRecord.progressPercentage,
        totalTransactions: pdfRecord.totalTransactions,
        uploadedAt: pdfRecord.uploadedAt,
        processedAt: pdfRecord.processedAt,
        errorMessage: pdfRecord.errorMessage,
        job: jobStatus,
      },
    });
  } catch (error) {
    return next(
      errorHandler(httpErrorCodes.INTERNAL_SERVER, 'Failed to get PDF status')
    );
  }
}

/**
 * Get PDF processing progress (Server-Sent Events)
 * GET /api/transactions/progress/:pdfId
 */
export async function getPdfProgress(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const pdfId = parseInt(req.params.pdfId);

    if (isNaN(pdfId)) {
      return next(errorHandler(httpErrorCodes.BAD_REQUEST, 'Invalid PDF ID'));
    }

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Send initial connection message
    res.write('data: {"type":"connected"}\n\n');

    // Poll for updates every 2 seconds
    const interval = setInterval(async () => {
      try {
        const [pdfRecord] = await db
          .select()
          .from(pdfs)
          .where(eq(pdfs.id, pdfId));

        if (!pdfRecord) {
          res.write(
            `data: ${JSON.stringify({ type: 'error', message: 'PDF not found' })}\n\n`
          );
          clearInterval(interval);
          res.end();
          return;
        }

        // Determine the type based on processing status
        let eventType = 'progress';
        if (pdfRecord.processingStatus === 'completed') {
          eventType = 'completed';
        } else if (pdfRecord.processingStatus === 'failed') {
          eventType = 'error';
        }

        // Send progress update
        res.write(
          `data: ${JSON.stringify({
            type: eventType,
            pdfId: pdfRecord.id,
            status: pdfRecord.processingStatus,
            step: pdfRecord.currentStep || 'initializing',
            totalPages: pdfRecord.totalPages || 0,
            processedPages: pdfRecord.processedPages || 0,
            progress: pdfRecord.progressPercentage || 0,
            totalTransactions: pdfRecord.totalTransactions || 0,
            error: pdfRecord.errorMessage,
          })}\n\n`
        );

        // If processing is complete or failed, close the connection
        if (
          pdfRecord.processingStatus === 'completed' ||
          pdfRecord.processingStatus === 'failed'
        ) {
          clearInterval(interval);
          res.end();
        }
      } catch (error) {
        console.error('Error sending progress update:', error);
        clearInterval(interval);
        res.end();
      }
    }, 2000);

    // Clean up on client disconnect
    req.on('close', () => {
      clearInterval(interval);
      res.end();
    });
  } catch (error) {
    return next(
      errorHandler(
        httpErrorCodes.INTERNAL_SERVER,
        'Failed to start progress stream'
      )
    );
  }
}
