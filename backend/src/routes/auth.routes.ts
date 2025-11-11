import { Router } from 'express';
import { isAuthenticated } from '../middlewares/authMiddleware';
import {
  signupUser,
  login,
  forgotPassword,
  getResetPassword,
  resetPassword,
  verifyMfa,
  logout,
  userDetails,
  refreshAccessToken,
} from '../controllers/auth.controller';
import {
  validateSignup,
  validateLogin,
} from '../middlewares/userValidation';
import {
  signUpSchema,
  loginSchema,
  resetPasswordSchema,
  verifyOtpSchema,
  emailSchema,
} from '../utils/validationSchema';
import { bodyValidation } from '../middlewares/schemaValidation';
import { tokenValidation } from '../middlewares/tokenValidation';

const router = Router();

// Public routes
router.post(
  '/signup',
  bodyValidation(signUpSchema),
  validateSignup,
  signupUser
);

router.post(
  '/login',
  bodyValidation(loginSchema),
  validateLogin,
  login
);

router.post(
  '/verify-otp',
  bodyValidation(verifyOtpSchema),
  verifyMfa
);

router.post(
  '/forgot-password',
  bodyValidation(emailSchema),
  forgotPassword
);

router.get(
  '/reset-password/:token',
  tokenValidation,
  getResetPassword
);

router.post(
  '/reset-password/:token',
  tokenValidation,
  bodyValidation(resetPasswordSchema),
  resetPassword
);

router.post(
  '/refresh-token',
  tokenValidation,
  refreshAccessToken
);

// Protected routes (require authentication)
router.use(isAuthenticated);

router.get('/me', userDetails);
router.post('/logout', logout);

export default router;
