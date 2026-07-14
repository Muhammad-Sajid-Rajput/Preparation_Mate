// Daily usage limits — mirrored from backend .env defaults
// These are used in the UI to show "X of Y used today"
export const DAILY_LIMITS = {
  QUIZ:   parseInt(import.meta.env.VITE_DAILY_QUIZ_LIMIT)   || 20,
  CHAT:   parseInt(import.meta.env.VITE_DAILY_CHAT_LIMIT)   || 50,
  RESUME: parseInt(import.meta.env.VITE_DAILY_RESUME_LIMIT) || 2,
  PDF:    parseInt(import.meta.env.VITE_DAILY_PDF_LIMIT)    || 10,
}

// File upload limits
export const FILE_SIZE_LIMITS = {
  NOTE:   20 * 1024 * 1024, // 20MB
  RESUME:  5 * 1024 * 1024, //  5MB
}

export const ALLOWED_FILE_TYPES = {
  NOTE:   ['application/pdf'],
  RESUME: ['application/pdf'],
}
