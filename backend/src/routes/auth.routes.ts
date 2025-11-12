import { Router } from 'express';
import { isAuthenticated } from '../middlewares/authMiddleware';
import { login, userDetails, logout } from '../controllers/auth.controller';

const router = Router();

// Public routes
router.post('/login', login);

// Protected routes (require authentication)
router.use(isAuthenticated);
router.get('/me', userDetails);
router.post('/logout', logout);

export default router;
