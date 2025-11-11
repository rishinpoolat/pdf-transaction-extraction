import { z } from 'zod';

// Password must contain at least 7 characters, one uppercase, one lowercase, one number, and one special character
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&+.])[A-Za-z\d@$!%*?&+.]{7,}$/;

export const signUpSchema = z.object({
  name: z.string().max(30, 'Name must be at most 30 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().regex(
    passwordRegex,
    'Password must contain at least 7 characters, one uppercase, one lowercase, one number, and one special character'
  ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const resetPasswordSchema = z.object({
  password: z.string().regex(
    passwordRegex,
    'Password must contain at least 7 characters, one uppercase, one lowercase, one number, and one special character'
  ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const verifyOtpSchema = z.object({
  otp: z.string().min(1, 'OTP is required'),
  email: z.string().email('Invalid email address'),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type EmailInput = z.infer<typeof emailSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
