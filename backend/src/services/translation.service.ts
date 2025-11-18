import { translate } from '@vitalets/google-translate-api';
import redisClient from '../config/redis.config';
import crypto from 'crypto';

/**
 * Google Translate Free API Limits (based on @vitalets/google-translate-api observations):
 * - Approximately 100-200 requests per hour per IP
 * - Rate limiting kicks in around 80-100 rapid requests
 * - Recommended: 2-3 requests per minute maximum for sustained use
 *
 * Strategy: Very conservative with long delays to avoid hitting limits
 */
const TRANSLATION_CONFIG = {
  sourceLang: 'ta', // Tamil
  targetLang: 'en', // English
  maxChunkSize: 5000, // Google Translate character limit
  cacheExpiry: 60 * 60 * 24 * 7, // 7 days in seconds
  rateLimit: {
    maxRequests: 2, // Only 2 requests per minute
    perSeconds: 60, // Per minute
  },
  delayBetweenRequests: 35000, // 35 seconds between requests (very conservative)
  maxRetries: 10, // More retries
  initialBackoff: 180000, // Start with 3 minutes wait on rate limit
};

// Rate limiting using Redis
class RateLimiter {
  private key = 'translate:ratelimit';

  async checkLimit(): Promise<boolean> {
    const current = await redisClient.incr(this.key);

    if (current === 1) {
      await redisClient.expire(this.key, TRANSLATION_CONFIG.rateLimit.perSeconds);
    }

    return current <= TRANSLATION_CONFIG.rateLimit.maxRequests;
  }

  async waitForSlot(): Promise<void> {
    while (!(await this.checkLimit())) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

const rateLimiter = new RateLimiter();

/**
 * Generate cache key for translation
 */
function generateCacheKey(text: string, sourceLang: string, targetLang: string): string {
  const hash = crypto.createHash('md5').update(text).digest('hex');
  return `translate:${sourceLang}:${targetLang}:${hash}`;
}

/**
 * Get cached translation from Redis
 */
async function getCachedTranslation(text: string): Promise<string | null> {
  const key = generateCacheKey(text, TRANSLATION_CONFIG.sourceLang, TRANSLATION_CONFIG.targetLang);
  return await redisClient.get(key);
}

/**
 * Cache translation result in Redis
 */
async function cacheTranslation(text: string, translation: string): Promise<void> {
  const key = generateCacheKey(text, TRANSLATION_CONFIG.sourceLang, TRANSLATION_CONFIG.targetLang);
  await redisClient.setex(key, TRANSLATION_CONFIG.cacheExpiry, translation);
}

/**
 * Split text into chunks for translation
 */
function splitIntoChunks(text: string, maxSize: number = TRANSLATION_CONFIG.maxChunkSize): string[] {
  const chunks: string[] = [];
  const lines = text.split('\n');
  let currentChunk = '';

  for (const line of lines) {
    if (currentChunk.length + line.length + 1 > maxSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = line;
    } else {
      currentChunk += (currentChunk ? '\n' : '') + line;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Translate a single text chunk with retry logic
 */
async function translateChunk(text: string, retries: number = TRANSLATION_CONFIG.maxRetries): Promise<string> {
  // Check cache first
  const cached = await getCachedTranslation(text);
  if (cached) {
    console.log('✅ Using cached translation');
    return cached;
  }

  // Wait for rate limit slot
  await rateLimiter.waitForSlot();

  // Add delay between requests to avoid rate limiting
  await new Promise((resolve) => setTimeout(resolve, TRANSLATION_CONFIG.delayBetweenRequests));

  // Attempt translation with retries
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await translate(text, {
        from: TRANSLATION_CONFIG.sourceLang,
        to: TRANSLATION_CONFIG.targetLang,
      });

      const translatedText = result.text;

      // Cache the result
      await cacheTranslation(text, translatedText);

      return translatedText;
    } catch (error: any) {
      console.error(`Translation attempt ${attempt}/${retries} failed:`, error.message || error);

      // If rate limited, wait with exponential backoff
      if (error.message?.includes('Too Many Requests') || error.name === 'TooManyRequestsError') {
        // Exponential backoff: 3min, 6min, 12min, 24min...
        const waitTime = TRANSLATION_CONFIG.initialBackoff * Math.pow(2, attempt - 1);
        const minutes = Math.floor(waitTime / 60000);
        console.log(`⏳ Rate limited. Waiting ${minutes} minutes before retry ${attempt + 1}/${retries}...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      if (attempt === retries) {
        // Return a placeholder instead of throwing
        console.log(`⚠️ Translation skipped after ${retries} attempts - storing original text`);
        return `[Translation unavailable - rate limited]`;
      }

      // Other errors: shorter exponential backoff
      const delay = Math.pow(2, attempt) * 10000; // 20s, 40s, 80s...
      console.log(`⏳ Retrying in ${delay / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return '[Translation failed]';
}

/**
 * Translate text in chunks with progress callback
 */
export async function translateText(
  text: string,
  onProgress?: (current: number, total: number) => void
): Promise<string> {
  if (!text || text.trim().length === 0) {
    return '';
  }

  const chunks = splitIntoChunks(text);
  const translatedChunks: string[] = [];

  console.log(`📝 Translating ${chunks.length} chunks...`);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const translatedChunk = await translateChunk(chunk);
    translatedChunks.push(translatedChunk);

    if (onProgress) {
      onProgress(i + 1, chunks.length);
    }

    console.log(`✅ Translated chunk ${i + 1}/${chunks.length}`);
  }

  return translatedChunks.join('\n');
}

/**
 * Translate multiple texts in batch
 */
export async function translateBatch(
  texts: string[],
  onProgress?: (current: number, total: number) => void
): Promise<string[]> {
  const results: string[] = [];

  for (let i = 0; i < texts.length; i++) {
    const translated = await translateText(texts[i]);
    results.push(translated);

    if (onProgress) {
      onProgress(i + 1, texts.length);
    }
  }

  return results;
}

/**
 * Clear translation cache (utility function)
 */
export async function clearTranslationCache(): Promise<void> {
  const keys = await redisClient.keys('translate:*');
  if (keys.length > 0) {
    await redisClient.del(...keys);
    console.log(`🗑️ Cleared ${keys.length} cached translations`);
  }
}

export default {
  translateText,
  translateBatch,
  clearTranslationCache,
};
