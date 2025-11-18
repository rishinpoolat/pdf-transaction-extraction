import { translate } from '@vitalets/google-translate-api';
import redisClient from '../config/redis.config';
import crypto from 'crypto';

/**
 * Google Translate Free API Strategy (based on research and testing):
 *
 * Rate Limits (observed):
 * - ~80-100 requests before IP throttling kicks in
 * - Rate limit resets gradually over time (not instant)
 * - Burst requests trigger faster throttling
 *
 * Optimized Strategy:
 * - Slow and steady: 1 request every 5 seconds (~12 requests/min, 720/hour)
 * - When rate limited: Wait 1 minute, then retry with increasing delays
 * - Skip translation after 3 attempts to avoid blocking entire job
 * - Aggressive caching to reduce API calls
 */
const TRANSLATION_CONFIG = {
  sourceLang: 'ta', // Tamil
  targetLang: 'en', // English
  maxChunkSize: 5000, // Google Translate character limit
  cacheExpiry: 60 * 60 * 24 * 30, // 30 days in seconds (longer cache)
  rateLimit: {
    maxRequests: 10, // 10 requests per minute
    perSeconds: 60, // Per minute
  },
  delayBetweenRequests: 5000, // 5 seconds between requests (reasonable pace)
  maxRetries: 3, // Only try 3 times, then skip to avoid blocking
  initialBackoff: 60000, // 1 minute wait on rate limit
  backoffMultiplier: 2, // 1min, 2min, 4min
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
 * Translate a single text chunk with optimized retry logic
 */
async function translateChunk(text: string): Promise<string> {
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
  for (let attempt = 1; attempt <= TRANSLATION_CONFIG.maxRetries; attempt++) {
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
      const isRateLimited = error.message?.includes('Too Many Requests') || error.name === 'TooManyRequestsError';

      console.error(`❌ Translation attempt ${attempt}/${TRANSLATION_CONFIG.maxRetries} failed:`, error.message || error);

      // Last attempt - give up
      if (attempt === TRANSLATION_CONFIG.maxRetries) {
        console.log(`⚠️ Translation skipped after ${TRANSLATION_CONFIG.maxRetries} attempts`);
        return '[TRANSLATION_SKIPPED]';
      }

      // Calculate wait time
      let waitTime: number;
      if (isRateLimited) {
        // Rate limited: exponential backoff (1min, 2min, 4min)
        waitTime = TRANSLATION_CONFIG.initialBackoff * Math.pow(TRANSLATION_CONFIG.backoffMultiplier, attempt - 1);
        const minutes = Math.floor(waitTime / 60000);
        const seconds = Math.floor((waitTime % 60000) / 1000);
        console.log(`⏳ Rate limited. Waiting ${minutes}m ${seconds}s before retry ${attempt + 1}/${TRANSLATION_CONFIG.maxRetries}...`);
      } else {
        // Other errors: shorter wait (10s, 20s, 40s)
        waitTime = 10000 * Math.pow(2, attempt - 1);
        console.log(`⏳ Retrying in ${waitTime / 1000}s (attempt ${attempt + 1}/${TRANSLATION_CONFIG.maxRetries})...`);
      }

      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  return '[TRANSLATION_FAILED]';
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
