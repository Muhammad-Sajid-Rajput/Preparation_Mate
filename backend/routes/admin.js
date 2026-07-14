const express  = require('express')
const { verifyToken, requireRole } = require('../middleware/auth')
const adminService = require('../services/adminService')
const User     = require('../models/User')
const router   = express.Router()

router.use(verifyToken, requireRole('admin'))

// GET /api/admin/metrics
router.get('/metrics', async (req, res, next) => {
  try {
    const data = await adminService.getMetrics()
    res.json({ success: true, data })
  } catch (err) { next(err) }
})

// GET /api/admin/api-usage?days=7
router.get('/api-usage', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 7
    const data = await adminService.getApiUsage(days)
    res.json({ success: true, data })
  } catch (err) { next(err) }
})

// GET /api/admin/errors?page=1&limit=20
router.get('/errors', async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || 1
    const limit = parseInt(req.query.limit) || 20
    const data  = await adminService.getErrorLogs(page, limit)
    res.json({ success: true, data })
  } catch (err) { next(err) }
})

// GET /api/admin/users?page=1&search=
router.get('/users', async (req, res, next) => {
  try {
    const page   = parseInt(req.query.page) || 1
    const limit  = 20
    const search = req.query.search || ''
    const query  = search
      ? { $or: [
          { name:  { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ]}
      : {}
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-passwordHash -refreshTokenHash -otpHash')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 }),
      User.countDocuments(query),
    ])
    res.json({ success: true, data: { users, total, page } })
  } catch (err) { next(err) }
})

// PATCH /api/admin/users/:id
router.patch('/users/:id', async (req, res, next) => {
  try {
    const { role, resetQuota } = req.body
    const update = {}
    if (role) update.role = role
    if (resetQuota) {
      update.usageStats = {
        date:        new Date(),
        chatCount:   0,
        quizCount:   0,
        resumeCount: 0,
        pdfCount:    0,
      }
    }
    const user = await User.findByIdAndUpdate(
      req.params.id, update,
      { new: true, select: '-passwordHash -refreshTokenHash -otpHash' }
    )
    res.json({ success: true, data: user })
  } catch (err) { next(err) }
})

module.exports = router
