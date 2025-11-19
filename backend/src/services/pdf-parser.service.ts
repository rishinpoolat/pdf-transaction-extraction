import fs from 'fs/promises';
import { PDFDocument } from 'pdf-lib';

// Import pdf-parse v2 - uses PDFParse class
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PDFParse } = require('pdf-parse');

export interface PageContent {
  pageNumber: number;
  text: string;
  rawText: string;
}

export interface PdfMetadata {
  totalPages: number;
  title?: string;
  author?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

/**
 * Extract metadata from PDF
 */
export async function extractPdfMetadata(filepath: string): Promise<PdfMetadata> {
  try {
    const dataBuffer = await fs.readFile(filepath);
    const pdfDoc = await PDFDocument.load(dataBuffer);

    const pageCount = pdfDoc.getPageCount();
    const title = pdfDoc.getTitle();
    const author = pdfDoc.getAuthor();
    const creator = pdfDoc.getCreator();
    const producer = pdfDoc.getProducer();
    const creationDate = pdfDoc.getCreationDate();
    const modificationDate = pdfDoc.getModificationDate();

    return {
      totalPages: pageCount,
      title,
      author,
      creator,
      producer,
      creationDate,
      modificationDate,
    };
  } catch (error) {
    console.error('Error extracting PDF metadata:', error);
    throw new Error('Failed to extract PDF metadata');
  }
}

/**
 * Parse entire PDF and get all text
 */
export async function parsePdfText(filepath: string): Promise<string> {
  try {
    const dataBuffer = await fs.readFile(filepath);

    // Parse PDF with pdf-parse v2
    const parser = new PDFParse({ data: dataBuffer });
    await parser.load();
    const textResult = await parser.getText();

    return textResult.text;
  } catch (error) {
    console.error('Error parsing PDF text:', error);
    throw new Error('Failed to parse PDF text');
  }
}

/**
 * Parse entire PDF and get all pages
 * Note: pdf-parse doesn't reliably separate pages, so we return the full text
 * and divide it based on estimated page size
 */
export async function parsePdfPages(filepath: string): Promise<PageContent[]> {
  try {
    const metadata = await extractPdfMetadata(filepath);
    const fullText = await parsePdfText(filepath);

    // Since pdf-parse doesn't reliably separate pages, we'll divide the text
    // by approximate page size (this is a workaround)
    const avgCharsPerPage = Math.ceil(fullText.length / metadata.totalPages);
    const pages: PageContent[] = [];

    for (let i = 0; i < metadata.totalPages; i++) {
      const start = i * avgCharsPerPage;
      const end = Math.min((i + 1) * avgCharsPerPage, fullText.length);
      const pageText = fullText.substring(start, end);

      if (pageText.trim()) {
        pages.push({
          pageNumber: i + 1,
          text: pageText.trim(),
          rawText: pageText,
        });
      }
    }

    return pages;
  } catch (error) {
    console.error('Error parsing PDF pages:', error);
    throw new Error('Failed to parse PDF pages');
  }
}

/**
 * Parse a single page from PDF
 */
export async function parseSinglePage(filepath: string, pageNumber: number): Promise<PageContent> {
  try {
    const metadata = await extractPdfMetadata(filepath);

    if (pageNumber < 1 || pageNumber > metadata.totalPages) {
      throw new Error(`Page number ${pageNumber} is out of range (1-${metadata.totalPages})`);
    }

    const fullText = await parsePdfText(filepath);
    const avgCharsPerPage = Math.ceil(fullText.length / metadata.totalPages);

    const start = (pageNumber - 1) * avgCharsPerPage;
    const end = Math.min(pageNumber * avgCharsPerPage, fullText.length);
    const pageText = fullText.substring(start, end);

    return {
      pageNumber,
      text: pageText.trim(),
      rawText: pageText,
    };
  } catch (error) {
    console.error(`Error parsing page ${pageNumber}:`, error);
    throw new Error(`Failed to parse page ${pageNumber}`);
  }
}

/**
 * Parse pages in batches for memory efficiency
 */
export async function* parsePdfPagesInBatches(
  filepath: string,
  batchSize: number = 5
): AsyncGenerator<PageContent[]> {
  const metadata = await extractPdfMetadata(filepath);
  const fullText = await parsePdfText(filepath);
  const totalPages = metadata.totalPages;
  const avgCharsPerPage = Math.ceil(fullText.length / totalPages);

  for (let i = 0; i < totalPages; i += batchSize) {
    const endPage = Math.min(i + batchSize, totalPages);
    const batch: PageContent[] = [];

    for (let pageNum = i + 1; pageNum <= endPage; pageNum++) {
      const start = (pageNum - 1) * avgCharsPerPage;
      const end = Math.min(pageNum * avgCharsPerPage, fullText.length);
      const pageText = fullText.substring(start, end);

      batch.push({
        pageNumber: pageNum,
        text: pageText.trim(),
        rawText: pageText,
      });
    }

    yield batch;
  }
}

export default {
  extractPdfMetadata,
  parsePdfPages,
  parseSinglePage,
  parsePdfPagesInBatches,
};
