import fs from 'fs/promises';
import path from 'path';
import { UPLOAD_DIR, generateUniqueFilename } from '../config/upload.config';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PDFParse } = require('pdf-parse');

export interface PdfParseResult {
  text: string;
  numPages: number;
  info: any;
  metadata: any;
  version: string;
}

export interface SavedPdfInfo {
  filename: string;
  originalName: string;
  filepath: string;
  fileSize: number;
}

/**
 * Parse PDF buffer and extract text content
 */
export async function parsePdfBuffer(buffer: Buffer): Promise<PdfParseResult> {
  try {
    // Convert Node.js Buffer to Uint8Array if needed
    const uint8Array = new Uint8Array(buffer);

    // Create PDF parser instance
    const parser = new PDFParse({ data: uint8Array });

    // Load the PDF document
    await parser.load();

    // Extract text from all pages
    const textResult = await parser.getText();
    const info = await parser.getInfo();

    return {
      text: textResult.text,
      numPages: textResult.total,
      info: info,
      metadata: info,
      version: info.PDFFormatVersion || '1.0',
    };
  } catch (error) {
    throw new Error('Failed to parse PDF file');
  }
}

/**
 * Save PDF buffer to disk
 */
export async function savePdfFile(
  buffer: Buffer,
  originalName: string
): Promise<SavedPdfInfo> {
  try {
    // Ensure upload directory exists
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    // Generate unique filename
    const filename = generateUniqueFilename(originalName);
    const filepath = path.join(UPLOAD_DIR, filename);

    // Write file to disk
    await fs.writeFile(filepath, buffer);

    return {
      filename,
      originalName,
      filepath,
      fileSize: buffer.length,
    };
  } catch (error) {
    throw new Error('Failed to save PDF file');
  }
}

export interface Transaction {
  buyer_name_tamil?: string;
  seller_name_tamil?: string;
  buyer_name_english?: string;
  seller_name_english?: string;
  house_number?: string;
  survey_number?: string;
  document_number?: string;
  transaction_date?: string;
  transaction_value?: number;
  page_number?: number;
  raw_text?: string;
}

/**
 * Extract transactions from PDF text
 * Customize this function based on your Tamil PDF structure
 */
export function extractTransactions(
  pdfText: string,
  _numPages: number
): Transaction[] {
  const transactions: Transaction[] = [];

  transactions.push({
    raw_text: pdfText.substring(0, 500),
    page_number: 1,
  });

  return transactions;
}

/**
 * Process PDF file: parse, extract text, and extract transactions
 */
export async function processPdf(buffer: Buffer) {
  // Parse PDF
  const parseResult = await parsePdfBuffer(buffer);

  // Extract transactions
  const transactions = extractTransactions(parseResult.text, parseResult.numPages);

  return {
    parseResult,
    transactions,
  };
}
