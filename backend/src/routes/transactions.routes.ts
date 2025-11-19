import { Router } from 'express';
import { upload } from '../config/upload.config';
import { isAuthenticated } from '../middlewares/authMiddleware';
import {
  uploadPdf,
  getTransactions,
  getTransactionById,
  getPdfStatus,
  getPdfProgress,
  getAllPdfs,
  getPdfFile,
} from '../controllers/transactions.controller';

const router = Router();

// All transaction routes require authentication
router.use(isAuthenticated);

// POST /api/transactions/upload - Upload and process PDF
router.post('/upload', upload.single('pdf'), uploadPdf);

// GET /api/transactions/pdfs - Get all PDFs
router.get('/pdfs', getAllPdfs);

// GET /api/transactions/status/:pdfId - Get PDF processing status
router.get('/status/:pdfId', getPdfStatus);

// GET /api/transactions/progress/:pdfId - Get real-time progress (SSE)
router.get('/progress/:pdfId', getPdfProgress);

// GET /api/transactions/pdf/:pdfId - Get PDF file for preview
router.get('/pdf/:pdfId', getPdfFile);

// GET /api/transactions - Get all transactions with optional filters
router.get('/', getTransactions);

// GET /api/transactions/:id - Get single transaction by ID
router.get('/:id', getTransactionById);

export default router;
