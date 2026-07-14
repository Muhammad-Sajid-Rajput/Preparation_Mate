const express  = require('express')
const bcrypt   = require('bcrypt')
const { verifyToken } = require('../middleware/auth')
const User     = require('../models/User')
const router   = express.Router()

router.use(verifyToken)

// GET /api/users/me
router.get('/me', (req, res) => {
  const u = req.user.toObject()
  delete u.passwordHash
  delete u.refreshTokenHash
  delete u.otpHash
  res.json({ success: true, data: u })
})

// PATCH /api/users/me
router.patch('/me', async (req, res, next) => {
  try {
    const { name, goalPreference } = req.body
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { name, goalPreference },
      { new: true, select: '-passwordHash -refreshTokenHash -otpHash' }
    )
    res.json({ success: true, data: updated })
  } catch (err) { next(err) }
})

// PATCH /api/users/me/password
router.patch('/me/password', async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body
    const user = await User.findById(req.user._id)
    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid)
      return res.status(400).json({ success: false, error: 'Current password is incorrect' })
    user.passwordHash    = await bcrypt.hash(newPassword, 12)
    user.refreshTokenHash = undefined
    await user.save()
    res.clearCookie('refreshToken')
    res.json({ success: true, data: { message: 'Password updated. Please log in again.' } })
  } catch (err) { next(err) }
})

// DELETE /api/users/me
router.delete('/me', async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.user._id)
    res.clearCookie('refreshToken')
    res.json({ success: true, data: { message: 'Account deleted.' } })
  } catch (err) { next(err) }
})

module.exports = router
