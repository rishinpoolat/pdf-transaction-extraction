import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';

// Define the upload directory
export const UPLOAD_DIR = path.join(__dirname, '../../uploads/pdfs');

// Configure multer for memory storage (we'll process the file before saving)
const storage = multer.memoryStorage();

// File filter to accept only PDFs
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = ['application/pdf'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF files are allowed.'));
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Helper function to generate a unique filename
export const generateUniqueFilename = (originalName: string): string => {
  const ext = path.extname(originalName);
  const nameWithoutExt = path.basename(originalName, ext);
  const timestamp = Date.now();
  const uuid = uuidv4();
  return `${timestamp}-${uuid}-${nameWithoutExt}${ext}`;
};
