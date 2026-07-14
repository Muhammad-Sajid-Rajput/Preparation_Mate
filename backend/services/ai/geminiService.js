const { GoogleGenerativeAI } = require('@google/generative-ai');
const ApiUsageLog = require('../../models/ApiUsageLog');

const apiKeys = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
].filter(Boolean);

if (apiKeys.length === 0) {
  throw new Error('No Gemini API keys configured in .env');
}

let keyIndex = 0;
const getNextKey = () => {
  const key = apiKeys[keyIndex];
  keyIndex = (keyIndex + 1) % apiKeys.length;
  return key;
};

const FLASH_MODEL = process.env.GEMINI_FLASH_MODEL || 'gemini-2.5-flash';
const PRO_MODEL   = process.env.GEMINI_PRO_MODEL   || 'gemini-3-flash-preview';

const isRateLimitError = (err) =>
  err.status === 429 ||
  err.message?.toLowerCase().includes('quota') ||
  err.message?.toLowerCase().includes('rate limit') ||
  err.message?.toLowerCase().includes('429');

const getFeatureFromEndpoint = (endpoint) => {
  if (!endpoint) return 'unknown';
  if (endpoint.includes('/notes/upload')) return 'pdf';
  if (endpoint.includes('/chat/')) return 'chat';
  if (endpoint.includes('/resume/')) return 'resume';
  if (endpoint.includes('/quizzes/')) return 'quiz';
  if (endpoint.includes('/planner/')) return 'planner';
  if (endpoint.includes('/interview/')) return 'interview';
  return 'unknown';
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Execute a callback function with exponential backoff on rate limits.
 */
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
      console.warn(`[geminiService] Rate limited. Retrying in ${delay}ms... (Attempt ${attempt}/${maxRetries})`);
      await wait(delay);
    }
  }
};

/**
 * Generate content using flash or fallback to pro, with key rotation.
 * @param {string} prompt 
 * @param {object} opts 
 * @param {boolean} opts.forceQuality - skip flash, go straight to pro
 * @param {string} opts.userId - user ID for usage log
 * @param {string} opts.endpoint - endpoint category for analytics
 * @param {string} opts.feature - explicit feature tracking category
 */
const generateWithFallback = async (prompt, opts = {}) => {
  const { forceQuality = false, userId = null, endpoint = '/ai/generate', feature = null, modelOverride = null } = opts;
  const modelChain = modelOverride
    ? [modelOverride, PRO_MODEL, FLASH_MODEL]
    : (forceQuality ? [PRO_MODEL, FLASH_MODEL] : [FLASH_MODEL, PRO_MODEL]);

  let lastError = null;
  let totalAttempts = 0;
  const start = Date.now();

  for (const modelName of modelChain) {
    let keyAttempts = 0;
    while (keyAttempts < apiKeys.length) {
      totalAttempts++;
      keyAttempts++;
      const apiKey = getNextKey();

      try {
        const result = await callWithBackoff(async () => {
          const client = new GoogleGenerativeAI(apiKey);
          const model = client.getGenerativeModel({ model: modelName });
          const response = await model.generateContent(prompt);
          return response;
        });

        const durationMs = Date.now() - start;
        const text = result.response.text();

        // Log successful usage
        await ApiUsageLog.create({
          provider: 'gemini',
          model: modelName,
          endpoint,
          feature: feature || getFeatureFromEndpoint(endpoint),
          userId,
          durationMs,
          status: 'success',
        }).catch(() => {});

        return {
          text,
          modelUsed: modelName,
          attempts: totalAttempts,
        };
      } catch (err) {
        lastError = err;
        console.error(`[geminiService] Attempt failed on model ${modelName}:`, err.message);
        if (!isRateLimitError(err)) {
          break; // Break key attempts loop if not a rate limit error (go to fallback model)
        }
      }
    }
  }

  // FALLBACK TO GROQ IF GEMINI FAILS
  if (opts.isFallback) {
    const error = new Error(`All Gemini models and keys exhausted. Last error: ${lastError?.message}`);
    error.statusCode = 503;
    throw error;
  }

  try {
    console.warn(`[geminiService] Gemini exhausted. Falling back to Groq Llama model...`);
    const { createChatCompletion, MODEL: GROQ_MODEL } = require('../../config/groq');
    const groqResponse = await createChatCompletion(
      [{ role: 'user', content: prompt }],
      { maxTokens: 4096, isFallback: true }
    );
    const durationMs = Date.now() - start;
    const text = groqResponse.choices[0].message.content;

    // Log successful fallback usage
    await ApiUsageLog.create({
      provider: 'groq',
      model: GROQ_MODEL,
      endpoint,
      feature: feature || getFeatureFromEndpoint(endpoint),
      userId,
      durationMs,
      status: 'success',
    }).catch(() => {});

    return {
      text,
      modelUsed: GROQ_MODEL,
      attempts: totalAttempts + 1,
    };
  } catch (groqErr) {
    console.error(`[geminiService] Groq fallback failed:`, groqErr.message);
    lastError = groqErr;
  }

  // Log error usage
  const durationMs = Date.now() - start;
  await ApiUsageLog.create({
    provider: 'gemini',
    model: modelChain[0],
    endpoint,
    feature: feature || getFeatureFromEndpoint(endpoint),
    userId,
    durationMs,
    status: 'error',
    errorMessage: lastError?.message,
  }).catch(() => {});

  const error = new Error(`All Gemini and Groq models/keys exhausted. Last error: ${lastError?.message}`);
  error.statusCode = 503;
  throw error;
};

/**
 * Generate a stream of content using flash or fallback to pro, with key rotation.
 * @param {string} prompt 
 * @param {object} opts 
 * @param {boolean} opts.forceQuality 
 * @param {string} opts.userId
 * @param {string} opts.endpoint
 * @param {string} opts.feature
 */
const generateStream = async (prompt, opts = {}) => {
  const { forceQuality = false, userId = null, endpoint = '/chat/stream', feature = 'chat' } = opts;
  const modelChain = forceQuality ? [PRO_MODEL, FLASH_MODEL] : [FLASH_MODEL, PRO_MODEL];

  let lastError = null;
  let totalAttempts = 0;
  const start = Date.now();

  for (const modelName of modelChain) {
    let keyAttempts = 0;
    while (keyAttempts < apiKeys.length) {
      totalAttempts++;
      keyAttempts++;
      const apiKey = getNextKey();

      try {
        const result = await callWithBackoff(async () => {
          const client = new GoogleGenerativeAI(apiKey);
          const model = client.getGenerativeModel({ model: modelName });
          const responseStream = await model.generateContentStream(prompt);
          return responseStream;
        });

        const durationMs = Date.now() - start;
        // Log successful usage
        await ApiUsageLog.create({
          provider: 'gemini',
          model: modelName,
          endpoint,
          feature: feature || getFeatureFromEndpoint(endpoint),
          userId,
          durationMs,
          status: 'success',
        }).catch(() => {});

        return {
          stream: result.stream,
          modelUsed: modelName,
          attempts: totalAttempts,
        };
      } catch (err) {
        lastError = err;
        console.error(`[geminiService] Stream attempt failed on model ${modelName}:`, err.message);
        if (!isRateLimitError(err)) {
          break;
        }
      }
    }
  }

  // FALLBACK TO GROQ IF GEMINI FAILS
  if (opts.isFallback) {
    const error = new Error(`All Gemini streaming models and keys exhausted. Last error: ${lastError?.message}`);
    error.statusCode = 503;
    throw error;
  }

  try {
    console.warn(`[geminiService] Gemini stream exhausted. Falling back to Groq stream...`);
    const { createChatCompletion } = require('../../config/groq');
    const groqResponseStream = await createChatCompletion(
      [{ role: 'user', content: prompt }],
      { stream: true, isFallback: true }
    );
    const durationMs = Date.now() - start;

    // Log successful fallback usage
    await ApiUsageLog.create({
      provider: 'groq',
      model: process.env.GROQ_MAIN_MODEL || 'openai/gpt-oss-120b',
      endpoint,
      feature: feature || getFeatureFromEndpoint(endpoint),
      userId,
      durationMs,
      status: 'success',
    }).catch(() => {});

    // Wrap Groq stream to match Gemini stream format
    async function* wrapGroqStream() {
      for await (const chunk of groqResponseStream) {
        const text = chunk.choices[0]?.delta?.content || '';
        yield {
          text: () => text
        };
      }
    }

    return {
      stream: wrapGroqStream(),
      modelUsed: 'groq',
      attempts: totalAttempts + 1,
    };
  } catch (groqErr) {
    console.error(`[geminiService] Groq stream fallback failed:`, groqErr.message);
    lastError = groqErr;
  }

  const durationMs = Date.now() - start;
  // Log error usage
  await ApiUsageLog.create({
    provider: 'gemini',
    model: modelChain[0],
    endpoint,
    feature: feature || getFeatureFromEndpoint(endpoint),
    userId,
    durationMs,
    status: 'error',
    errorMessage: lastError?.message,
  }).catch(() => {});

  const error = new Error(`All Gemini and Groq streaming models and keys exhausted. Last error: ${lastError?.message}`);
  error.statusCode = 503;
  throw error;
};

module.exports = {
  generateWithFallback,
  generateStream,
  FLASH_MODEL,
  PRO_MODEL,
  getNextKey,
};
