import rateLimit from "express-rate-limit";

// Rate limiter for authentication endpoints to prevent brute force attacks
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    status: 0,
    message:
      "Too many authentication attempts, please try again after 15 minutes",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip successful requests
  skipSuccessfulRequests: false,
});

// Rate limiter for token refresh (more lenient)
export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Allow more refresh attempts
  message: {
    status: 0,
    message: "Too many token refresh attempts, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
