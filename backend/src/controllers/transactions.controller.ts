import { Request, Response, NextFunction } from 'express';
import { errorHandler, httpErrorCodes } from '../utils/error';
import { processPdf, savePdfFile } from '../services/pdf.service';

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

    // Process PDF: parse and extract transactions
    const { parseResult, transactions } = await processPdf(file.buffer);

    // Save PDF file to disk
    const savedFile = await savePdfFile(file.buffer, file.originalname);

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'PDF uploaded and processed successfully',
      data: {
        pdf: {
          filename: savedFile.filename,
          originalName: savedFile.originalName,
          fileSize: savedFile.fileSize,
          numPages: parseResult.numPages,
          status: 'completed',
        },
        transactions: transactions,
        total_transactions: transactions.length,
        parseInfo: {
          numPages: parseResult.numPages,
          pdfVersion: parseResult.version,
          textLength: parseResult.text.length,
        },
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
 * GET /api/transactions
 */
export async function getTransactions(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    return res.status(200).json({
      success: true,
      data: {
        transactions: [],
        total: 0,
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
    const { id } = req.params;

    return res.status(200).json({
      success: true,
      data: null,
      message: `Transaction ${id} not implemented`,
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
