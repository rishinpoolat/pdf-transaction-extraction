import speakeasy from 'speakeasy';

// Generate a secret for OTP (valid for 10 minutes / 600 seconds)
export function generateOTP(): string {
  const secret = speakeasy.generateSecret().base32;
  return secret;
}

// Generate a token from the secret
export function generateToken(secret: string): string {
  return speakeasy.totp({
    secret: secret,
    step: 600, // 10 minutes
  });
}

// Verify OTP
export function verifyOtp(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret: secret,
    token: token,
    step: 600, // 10 minutes
    window: 2, // Allow 2 steps before/after for clock skew
  });
}
