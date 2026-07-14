const { GoogleGenerativeAI } = require('@google/generative-ai');
const ApiUsageLog = require('../../models/ApiUsageLog');
const { getNextKey } = require('./geminiService');

const EMBED_MODEL = process.env.GEMINI_EMBED_MODEL || 'gemini-embedding-2';

const isRateLimitError = (err) =>
  err.status === 429 ||
  err.message?.toLowerCase().includes('quota') ||
  err.message?.toLowerCase().includes('rate limit') ||
  err.message?.toLowerCase().includes('429');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const callWithBackoff = async (fn, maxRetries = 3, initialDelay = 1000) => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt >= maxRetries || !isRateLimitError(err)) {
        throw err;
      }
      const delay = initialDelay * Math.pow(2, attempt);
      console.warn(`[embeddingService] Rate limited. Retrying in ${delay}ms... (Attempt ${attempt}/${maxRetries})`);
      await wait(delay);
    }
  }
};

/**
 * Embed a single string of text.
 * @param {string} text 
 * @param {object} opts 
 * @param {string} opts.userId - User ID for logging
 * @param {string} opts.endpoint - Endpoint category
 */
const embedText = async (text, opts = {}) => {
  const { userId = null, endpoint = '/ai/embed', feature = 'chat' } = opts;
  const start = Date.now();
  let lastError = null;

  // Try different API keys on rate limit
  for (let i = 0; i < 3; i++) {
    const apiKey = getNextKey();
    try {
      const result = await callWithBackoff(async () => {
        const client = new GoogleGenerativeAI(apiKey);
        const model = client.getGenerativeModel({ model: EMBED_MODEL });
        const res = await model.embedContent(text);
        return res;
      });

      const durationMs = Date.now() - start;

      // Log successful usage
      await ApiUsageLog.create({
        provider: 'gemini',
        model: EMBED_MODEL,
        endpoint,
        feature,
        userId,
        durationMs,
        status: 'success',
      }).catch(() => {});

      return result.embedding.values;
    } catch (err) {
      lastError = err;
      console.error(`[embeddingService] Attempt failed:`, err.message);
      if (!isRateLimitError(err)) {
        break;
      }
    }
  }

  // Log error usage
  const durationMs = Date.now() - start;
  await ApiUsageLog.create({
    provider: 'gemini',
    model: EMBED_MODEL,
    endpoint,
    feature,
    userId,
    durationMs,
    status: 'error',
    errorMessage: lastError?.message,
  }).catch(() => {});

  const error = new Error(`Embedding failed: ${lastError?.message}`);
  error.statusCode = 503;
  throw error;
};

/**
 * Embed multiple strings. Loop sequentially with key rotation.
 * @param {string[]} texts 
 * @param {object} opts 
 */
const embedTexts = async (texts, opts = {}) => {
  const results = [];
  for (const text of texts) {
    const vector = await embedText(text, opts);
    results.push(vector);
  }
  return results;
};

module.exports = {
  embedText,
  embedTexts,
  EMBED_MODEL,
};
