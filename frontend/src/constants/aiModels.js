// AI model identifiers — for display in UI and logging
export const AI_MODELS = {
  GEMINI_FLASH: 'gemini-1.5-flash',
  GEMINI_PRO:   'gemini-2.0-flash',
  GEMINI_EMBED: 'gemini-embedding-2',
  GROQ_MAIN:    'openai/gpt-oss-120b',
}

// Display-friendly names for model labels in admin dashboard
export const AI_MODEL_LABELS = {
  'gemini-1.5-flash':          'Gemini 1.5 Flash',
  'gemini-2.0-flash':          'Gemini 2.0 Flash',
  'gemini-embedding-2':        'Gemini Embedding 2',
  'openai/gpt-oss-120b':       'Groq GPT-120B',
  // Fallbacks for older or alternative model configs in logs
  'gemini-3.5-flash':          'Gemini 3.5 Flash',
  'gemini-3.1-pro-preview':    'Gemini 3.1 Pro (Preview)',
  'gemini-3-flash':            'Gemini 3 Flash',
  'gemini-3-pro':              'Gemini 3 Pro',
  'gemini-3-flash-preview':    'Gemini 3 Flash (Preview)',
  'gemini-1.5-pro':            'Gemini 1.5 Pro',
}

export const getModelLabel = (modelKey) =>
  AI_MODEL_LABELS[modelKey] || modelKey || 'Unknown model'

// Which provider handles which feature
export const AI_PROVIDER_MAP = {
  chat:      'groq',    // Groq primary, Gemini Flash fallback
  quiz:      'gemini',  // Gemini Flash with Pro fallback
  planner:   'gemini',  // Gemini Pro (forced quality)
  resume:    'gemini',  // Gemini Pro (forced quality)
  interview: 'gemini',  // Gemini Flash with Pro fallback
  notes:     'gemini',  // Gemini Flash for summary/topics
  embedding: 'gemini',  // Gemini Embedding 2
}
