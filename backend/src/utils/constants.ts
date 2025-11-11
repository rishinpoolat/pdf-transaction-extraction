export const errorMessages = {
  INVALID_TOKEN: 'Invalid token',
  BLACKLIST_TOKEN: 'Token has been blacklisted',
  TOKEN_NOT_FOUND: 'Token not found',
  USER_NOT_FOUND: 'User not found',
  TOKEN_SIGN_FAILED: 'Failed to sign token',
  TOKEN_VERIFY_FAILED: 'Failed to verify token',
  NOT_VERIFIED: 'User is not verified',
  SOMETHING_WENT_WRONG: 'Something went wrong',
} as const;

export const successMessages = {
  SIGN_IN: 'Signed in successfully',
  LOG_OUT: 'Logged out successfully',
  OTP_SENT: 'OTP sent successfully',
  OTP_VERIFIED: 'OTP verified successfully',
  PASSWORD_RESET: 'Password reset successfully',
  RESET_LINK_SENT: 'Password reset link sent successfully',
} as const;
