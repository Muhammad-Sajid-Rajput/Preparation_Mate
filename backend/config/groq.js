const Groq = require('groq-sdk')

const GROQ_KEYS = [
  process.env.GROQ_API_KEY_1,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
].filter(Boolean)

let groqKeyIndex = 0

const getNextGroqKey = () => {
  if (GROQ_KEYS.length === 0) return null
  const key = GROQ_KEYS[groqKeyIndex]
  groqKeyIndex = (groqKeyIndex + 1) % GROQ_KEYS.length
  return key
}

const MAIN_MODEL     = process.env.GROQ_MAIN_MODEL     || 'openai/gpt-oss-120b'
const FALLBACK_MODEL = process.env.GROQ_FALLBACK_MODEL || 'meta-llama/Llama-3.3-70B-Instruct'
const MODEL = MAIN_MODEL

const isGroqQuotaError = (err) =>
  err?.status === 429 ||
  err?.message?.toLowerCase().includes('rate limit') ||
  err?.message?.toLowerCase().includes('quota')

/**
 * Get a Groq client using the next key in rotation.
 * For streaming, caller creates the stream but we pick the key here.
 */
const getClient = () => new Groq({ apiKey: getNextGroqKey() })

/**
 * Create a Groq chat completion with automatic key rotation on quota errors.
 * Returns a stream (for SSE) or text (for non-streaming).
 */
const createChatCompletion = async (messages, opts = {}) => {
  const { stream = false, maxTokens = 1024 } = opts
  const models = [MAIN_MODEL, FALLBACK_MODEL]

  let lastError = null
  for (const modelName of models) {
    for (let attempt = 0; attempt < GROQ_KEYS.length; attempt++) {
      const apiKey = getNextGroqKey()
      const client = new Groq({ apiKey })
      try {
        return await client.chat.completions.create({
          model: modelName,
          messages,
          stream,
          max_tokens: maxTokens,
          temperature: 0.7,
        })
      } catch (err) {
        lastError = err
        if (!isGroqQuotaError(err)) {
          // If it's a non-quota error, try the fallback model
          break
        }
        // Quota error — rotate to next key and retry
      }
    }
  }
  // All keys + all models exhausted — fallback to Gemini
  if (opts.isFallback) {
    throw lastError || new Error('All Groq models and keys exhausted.')
  }

  try {
    console.warn(`[config/groq] Groq exhausted. Falling back to Gemini...`);
    const prompt = messages
      .map(m => `${m.role === 'system' ? 'Instruction' : m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n\n') + '\n\nAssistant:';

    if (stream) {
      const { generateStream } = require('../services/ai/geminiService');
      const geminiResult = await generateStream(prompt, { isFallback: true });
      
      // Wrap Gemini stream to match Groq stream chunks format
      async function* wrapGeminiStream() {
        for await (const chunk of geminiResult.stream) {
          yield {
            choices: [
              {
                delta: {
                  content: chunk.text()
                }
              }
            ]
          };
        }
      }
      return wrapGeminiStream();
    } else {
      const { generateWithFallback } = require('./gemini');
      const geminiResult = await generateWithFallback(prompt, { isFallback: true });
      return {
        choices: [
          {
            message: {
              content: geminiResult.text
            }
          }
        ]
      };
    }
  } catch (geminiErr) {
    console.error(`[config/groq] Gemini fallback failed:`, geminiErr.message);
    throw lastError || geminiErr;
  }
}

module.exports = { getClient, createChatCompletion, MODEL, MAIN_MODEL, FALLBACK_MODEL, isGroqQuotaError }
