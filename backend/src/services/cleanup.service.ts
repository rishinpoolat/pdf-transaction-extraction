import { lt } from 'drizzle-orm';
import { db } from '../db';
import { blacklist } from '../db/schema';

/**
 * Cleanup expired tokens from the blacklist table
 * Removes tokens older than the refresh token expiry (7 days by default)
 */
export async function cleanupExpiredTokens(): Promise<void> {
  try {
    // Calculate expiry date based on REFRESH_TOKEN_EXPIRY
    // Default to 7 days if not set
    const expiryDays = 7;
    const expiryDate = new Date(Date.now() - expiryDays * 24 * 60 * 60 * 1000);

    // Delete tokens older than expiry date
    await db
      .delete(blacklist)
      .where(lt(blacklist.createdAt, expiryDate));

    console.log(`✓ Cleaned up expired tokens from blacklist (older than ${expiryDays} days)`);
  } catch (error) {
    console.error('✗ Error cleaning up expired tokens:', error);
  }
}

/**
 * Start the token cleanup job
 * Runs daily at midnight
 */
export function startCleanupJob(): void {
  const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

  // Run cleanup on startup
  cleanupExpiredTokens();

  // Schedule periodic cleanup
  setInterval(() => {
    cleanupExpiredTokens();
  }, CLEANUP_INTERVAL);

  console.log('✓ Token cleanup job started (runs every 24 hours)');
}
