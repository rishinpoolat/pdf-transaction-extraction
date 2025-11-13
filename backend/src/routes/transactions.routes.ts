import { Router } from 'express';
import { upload } from '../config/upload.config';
import { isAuthenticated } from '../middlewares/authMiddleware';
import {
  uploadPdf,
  getTransactions,
  getTransactionById,
} from '../controllers/transactions.controller';

const router = Router();

// All transaction routes require authentication
router.use(isAuthenticated);

// POST /api/transactions/upload - Upload and process PDF
router.post('/upload', upload.single('pdf'), uploadPdf);

// GET /api/transactions - Get all transactions with optional filters
router.get('/', getTransactions);

// GET /api/transactions/:id - Get single transaction by ID
router.get('/:id', getTransactionById);

export default router;
