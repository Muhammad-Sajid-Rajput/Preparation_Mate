const { GoogleGenerativeAI } = require('@google/generative-ai')

const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
].filter(Boolean)

const GROQ_KEYS = [
  process.env.GROQ_API_KEY_1,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
].filter(Boolean)

// Module-level counters — persist across requests
let geminiKeyIndex = 0
let groqKeyIndex   = 0

const getNextGeminiKey = () => {
  if (GEMINI_KEYS.length === 0) return null
  const key = GEMINI_KEYS[geminiKeyIndex]
  geminiKeyIndex = (geminiKeyIndex + 1) % GEMINI_KEYS.length
  return key
}

const FLASH = process.env.GEMINI_FLASH_MODEL || 'gemini-2.5-flash'
const PRO   = process.env.GEMINI_PRO_MODEL   || 'gemini-3-flash-preview'

const isQuotaError = (err) =>
  err?.status === 429 ||
  err?.message?.toLowerCase().includes('quota') ||
  err?.message?.toLowerCase().includes('rate limit') ||
  err?.message?.toLowerCase().includes('resource exhausted') ||
  err?.message?.toLowerCase().includes('limit')

/**
 * Try every key on current model before escalating to next model.
 * Never throws until all keys AND all models exhausted.
 * Returns { text, modelUsed, keyUsed }
 */
const generateWithFallback = async (prompt, opts = {}) => {
  const { forceQuality = false, modelOverride = null } = opts
  const modelChain = modelOverride
    ? [modelOverride, PRO, FLASH]
    : (forceQuality ? [PRO, FLASH] : [FLASH, PRO])

  const errors = []

  for (const modelName of modelChain) {
    for (let attempt = 0; attempt < GEMINI_KEYS.length; attempt++) {
      const apiKey = getNextGeminiKey()
      try {
        const client = new GoogleGenerativeAI(apiKey)
        const model  = client.getGenerativeModel({ model: modelName })
        const result = await model.generateContent(prompt)
        return {
          text:      result.response.text(),
          modelUsed: modelName,
          keyIndex:  geminiKeyIndex,
        }
      } catch (err) {
        errors.push(`${modelName} key${attempt+1}: ${err.message}`)
        if (!isQuotaError(err)) {
          // Non-quota error (bad prompt, content policy) —
          // rotating keys won't help, skip remaining keys
          break
        }
        // Quota error — rotate to next key and retry
      }
    }
  }

  // All keys + all models exhausted — fallback to Groq
  if (opts.isFallback) {
    const error = new Error('AI generation temporarily unavailable. Please try again in a few minutes.')
    error.statusCode = 503
    error.details = errors
    throw error
  }

  try {
    console.warn(`[config/gemini] Gemini exhausted. Falling back to Groq Llama model...`);
    const { createChatCompletion, MODEL: GROQ_MODEL } = require('./groq');
    const groqResponse = await createChatCompletion(
      [{ role: 'user', content: prompt }],
      { maxTokens: 4096, isFallback: true }
    );
    return {
      text:      groqResponse.choices[0].message.content,
      modelUsed: GROQ_MODEL,
      keyIndex:  0,
    }
  } catch (groqErr) {
    errors.push(`Groq fallback: ${groqErr.message}`);
  }

  // All keys + all models exhausted
  const error = new Error('AI generation temporarily unavailable. Please try again in a few minutes.')
  error.statusCode = 503
  error.details = errors
  throw error
}

/**
 * Embed text using Gemini — rotate keys on quota errors.
 */
const embedText = async (text) => {
  const EMBED_MODEL = process.env.GEMINI_EMBED_MODEL || 'gemini-embedding-001'
  for (let attempt = 0; attempt < GEMINI_KEYS.length; attempt++) {
    const apiKey = getNextGeminiKey()
    try {
      const client = new GoogleGenerativeAI(apiKey)
      const model  = client.getGenerativeModel({ model: EMBED_MODEL })
      const result = await model.embedContent(text)
      return result.embedding.values
    } catch (err) {
      if (!isQuotaError(err)) {
        if (attempt === GEMINI_KEYS.length - 1) throw err
      }
    }
  }
  throw new Error('Embedding temporarily unavailable.')
}

const embedTexts = async (texts) => {
  const results = []
  for (const text of texts) {
    results.push(await embedText(text))
  }
  return results
}

module.exports = {
  generateWithFallback,
  embedText,
  embedTexts,
  FLASH,
  PRO,
}
