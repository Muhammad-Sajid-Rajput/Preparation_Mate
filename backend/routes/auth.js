const express  = require('express')
const bcrypt   = require('bcrypt')
const jwt      = require('jsonwebtoken')
const crypto   = require('crypto')
const User     = require('../models/User')
const PasswordResetToken = require('../models/PasswordResetToken')
const { sendOTPEmail, sendResetLinkEmail, sendPasswordChangedEmail } = require('../utils/emailSender')
const { authLimiter, forgotPasswordLimiter } = require('../middleware/rateLimiter')
const router   = express.Router()

// Inline input validators
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const isValidEmail = (e) => EMAIL_REGEX.test((e || '').trim())
const isValidPassword = (p) => {
  if (typeof p !== 'string') return false
  if (p.length < 8) return false
  if (!/[A-Z]/.test(p)) return false
  if (!/[a-z]/.test(p)) return false
  if (!/[0-9]/.test(p)) return false
  if (!/[^A-Za-z0-9]/.test(p)) return false
  return true
}
const isValidName = (n) => typeof n === 'string' && n.trim().length >= 2 && n.trim().length <= 100

// Helper to retrieve and validate reset token status
const getValidResetToken = async (token) => {
  if (!token) {
    return { valid: false, errorType: 'invalid', error: 'Invalid password reset link.' }
  }
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  const resetToken = await PasswordResetToken.findOne({ token_hash: tokenHash })
  
  if (!resetToken) {
    return { valid: false, errorType: 'invalid', error: 'Invalid password reset link.' }
  }
  if (resetToken.used_at) {
    return { valid: false, errorType: 'used', error: 'This password reset link has already been used.' }
  }
  if (resetToken.expires_at < new Date()) {
    return { valid: false, errorType: 'expired', error: 'This password reset link has expired.' }
  }
  return { valid: true, resetToken }
}

const signAccess  = (id, role) =>
  jwt.sign({ _id: id, role }, process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES })

const signRefresh = (id) =>
  jwt.sign({ _id: id }, process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES })

const COOKIE_OPTS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge:   7 * 24 * 60 * 60 * 1000,
}

// POST /api/auth/check-email
router.post('/check-email', async (req, res, next) => {
  try {
    const { email } = req.body
    if (!isValidEmail(email))
      return res.status(400).json({ success: false, error: 'Invalid email address' })
      
    const exists = await User.findOne({ email })
    if (exists)
      return res.status(409).json({ success: false, error: 'An account with this email already exists' })
      
    res.json({ success: true })
  } catch (err) { next(err) }
})

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const { name, email, password, goal } = req.body
    if (!name || !email || !password)
      return res.status(400).json({ success: false, error: 'All fields required' })
    if (!isValidName(name))
      return res.status(400).json({ success: false, error: 'Name must be between 2 and 100 characters' })
    if (!isValidEmail(email))
      return res.status(400).json({ success: false, error: 'Invalid email address' })
    if (!isValidPassword(password))
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' })

    const exists = await User.findOne({ email })
    if (exists)
      return res.status(409).json({ success: false, error: 'Email already registered' })

    const passwordHash = await bcrypt.hash(password, 12)
    const otp          = crypto.randomInt(100000, 999999).toString()
    const otpHash      = await bcrypt.hash(otp, 10)

    const user = await User.create({
      name, email, passwordHash, goalPreference: goal || 'exam',
      otpHash, otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
    })

    await sendOTPEmail(email, otp, 'verify').catch(() => {})

    res.status(201).json({ success: true, data: { userId: user._id } })
  } catch (err) { next(err) }
})

// POST /api/auth/resend-otp
router.post('/resend-otp', authLimiter, async (req, res, next) => {
  try {
    const { email } = req.body
    if (!email || !isValidEmail(email))
      return res.status(400).json({ success: false, error: 'Valid email required' })

    const user = await User.findOne({ email })
    // Always return 200 to avoid user enumeration
    if (!user || user.isVerified) {
      return res.json({ success: true, data: { message: 'If applicable, a new code has been sent.' } })
    }

    const otp     = crypto.randomInt(100000, 999999).toString()
    user.otpHash      = await bcrypt.hash(otp, 10)
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000)
    await user.save()

    await sendOTPEmail(email, otp, 'verify').catch(() => {})
    res.json({ success: true, data: { message: 'A new verification code has been sent.' } })
  } catch (err) { next(err) }
})

// POST /api/auth/verify-email
router.post('/verify-email', async (req, res, next) => {
  try {
    const { email, otp } = req.body
    const user = await User.findOne({ email })
    if (!user || !user.otpHash)
      return res.status(400).json({ success: false, error: 'Invalid request' })

    if (user.otpExpiresAt < new Date())
      return res.status(400).json({ success: false, error: 'OTP expired' })

    const valid = await bcrypt.compare(otp, user.otpHash)
    if (!valid)
      return res.status(400).json({ success: false, error: 'Invalid OTP' })

    user.isVerified  = true
    user.otpHash     = undefined
    user.otpExpiresAt = undefined
    await user.save()

    res.json({ success: true, data: { message: 'Email verified successfully. Please log in.' } })
  } catch (err) { next(err) }
})

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password)
      return res.status(400).json({ success: false, error: 'Email and password required' })
    if (!isValidEmail(email))
      return res.status(400).json({ success: false, error: 'Invalid email address' })
    const user = await User.findOne({ email })
    if (!user)
      return res.status(401).json({ success: false, error: 'Invalid credentials' })

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid)
      return res.status(401).json({ success: false, error: 'Invalid credentials' })

    if (!user.isVerified)
      return res.status(403).json({ success: false, error: 'Please verify your email before logging in.' })

    const refreshToken    = signRefresh(user._id)
    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10)
    await user.save()

    res.cookie('refreshToken', refreshToken, COOKIE_OPTS)
    const userPayload = user.toObject()
    delete userPayload.passwordHash
    delete userPayload.refreshTokenHash
    delete userPayload.otpHash
    res.json({ success: true, data: {
      accessToken: signAccess(user._id, user.role),
      user: userPayload,
    }})
  } catch (err) { next(err) }
})

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken
    if (!token)
      return res.status(401).json({ success: false, error: 'No refresh token' })

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET)
    const user    = await User.findById(decoded._id)
    if (!user?.refreshTokenHash)
      return res.status(401).json({ success: false, error: 'Session expired' })

    const valid = await bcrypt.compare(token, user.refreshTokenHash)
    if (!valid)
      return res.status(401).json({ success: false, error: 'Invalid session' })

    res.json({ success: true, data: {
      accessToken: signAccess(user._id, user.role),
    }})
  } catch (err) { next(err) }
})

// POST /api/auth/logout
router.post('/logout', async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET)
        if (decoded) {
          await User.findByIdAndUpdate(decoded._id, {
            $unset: { refreshTokenHash: '' }
          })
        }
      } catch (err) {}
    }
    res.clearCookie('refreshToken')
    res.json({ success: true })
  } catch (err) { next(err) }
})

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPasswordLimiter, async (req, res, next) => {
  try {
    const { email } = req.body
    if (!email || !isValidEmail(email)) {
      // Return 200 even for invalid email format to match generic behavior, or 400. Let's return generic success for security.
      return res.json({ success: true, data: { message: 'If an account exists for this email, a password reset link has been sent.' } })
    }

    const user = await User.findOne({ email: email.toLowerCase() })
    if (user) {
      // Generate a cryptographically secure random token
      const rawToken = crypto.randomBytes(32).toString('hex')
      // Store a SHA-256 hash — so the raw token never touches the DB
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
      
      await PasswordResetToken.create({
        user_id: user._id,
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + 30 * 60 * 1000) // 30 min expiration
      })

      const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}`
      await sendResetLinkEmail(user.email, resetLink).catch(() => {})
    }
    // Always return generic success to prevent user enumeration
    res.json({ success: true, data: { message: 'If an account exists for this email, a password reset link has been sent.' } })
  } catch (err) { next(err) }
})

// GET /api/auth/validate-reset-token
router.get('/validate-reset-token', async (req, res, next) => {
  try {
    const { token } = req.query
    const check = await getValidResetToken(token)
    if (!check.valid) {
      return res.status(400).json({ success: false, errorType: check.errorType, error: check.error })
    }

    res.json({ success: true, message: 'Token is valid' })
  } catch (err) { next(err) }
})

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, newPassword } = req.body
    if (!isValidPassword(newPassword)) {
      return res.status(400).json({ success: false, error: 'Password does not meet complexity requirements.' })
    }

    const check = await getValidResetToken(token)
    if (!check.valid) {
      return res.status(400).json({ success: false, errorType: check.errorType, error: check.error })
    }
    const { resetToken } = check

    const user = await User.findById(resetToken.user_id)
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' })
    }

    // 1. Update password securely
    user.passwordHash = await bcrypt.hash(newPassword, 12)
    // 4. Revoke refresh tokens / 5. Invalidate active sessions
    user.refreshTokenHash = undefined
    await user.save()

    // 2. Mark token as used
    resetToken.used_at = new Date()
    await resetToken.save()

    // 3. Invalidate all other active reset tokens for that user
    await PasswordResetToken.updateMany(
      { user_id: user._id, used_at: null },
      { $set: { used_at: new Date() } }
    )

    // 6. Force reauthentication: Send confirmation email
    await sendPasswordChangedEmail(user.email).catch(() => {})

    res.clearCookie('refreshToken')
    res.json({ success: true, data: { message: 'Password changed successfully.' } })
  } catch (err) { next(err) }
})

module.exports = router
