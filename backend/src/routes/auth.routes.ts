import { Router } from "express";

import { isAuthenticated } from "../middlewares/authMiddleware";
import {
  login,
  userDetails,
  logout,
  refreshAccessToken,
} from "../controllers/auth.controller";
import {
  authLimiter,
  refreshLimiter,
} from "../middlewares/rateLimitterMiddleware";

const router = Router();

// Public routes with rate limiting
router.post("/login", authLimiter, login);
router.post("/refresh-token", refreshLimiter, refreshAccessToken);

// Protected routes (require authentication)
router.use(isAuthenticated);
router.get("/me", userDetails);
router.post("/logout", logout);

export default router;
