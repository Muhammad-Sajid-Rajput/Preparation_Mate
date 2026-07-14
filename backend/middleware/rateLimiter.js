const rateLimit = require('express-rate-limit')

const standard = rateLimit({
  windowMs: 60 * 1000,
  max:      60,
  message:  { success: false, error: 'Too many requests' },
})

const aiRoutes = rateLimit({
  windowMs: 60 * 1000,
  max:      10,
  message:  { success: false, error: 'AI rate limit exceeded. Try again shortly.' },
})

// Strict limiter for auth endpoints: 5 attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      5,
  message:  { success: false, error: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders:   false,
})

// Rate limiter specifically for forgot password requests: 5 requests per hour per IP
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max:      5,
  message:  { success: false, error: 'Too many password reset requests. Please try again in an hour.' },
  standardHeaders: true,
  legacyHeaders:   false,
})

module.exports = { standard, aiRoutes, authLimiter, forgotPasswordLimiter }
