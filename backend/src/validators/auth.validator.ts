import { z } from 'zod';

/**
 * Validation schema for login request
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .trim(),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

/**
 * Validation schema for refresh token request
 */
export const refreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .min(1, 'Refresh token is required'),
});

// Type exports for use in controllers
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
