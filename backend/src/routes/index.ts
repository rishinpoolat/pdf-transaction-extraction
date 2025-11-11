import { Router } from 'express';
import authRoutes from './auth.routes';

const router = Router();

// Mount auth routes
router.use('/auth', authRoutes);

// Health check (also available at root level in index.ts)
router.get('/ping', (_req, res) => {
  res.status(200).json({ message: 'pong' });
});

export default router;
