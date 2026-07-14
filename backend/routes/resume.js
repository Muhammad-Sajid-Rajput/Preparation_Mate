const express = require('express')
const resumeService = require('../services/resumeService')
const { verifyToken } = require('../middleware/auth')
const quotaGuard = require('../middleware/quotaGuard')
const { validateUpload } = require('../middleware/uploadValidation')
const router = express.Router()

router.use(verifyToken)

// POST /api/career/resume/analyze
router.post('/analyze', quotaGuard('resume'), validateUpload('resume'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' })
    const { role, jobDescription } = req.body
    if (!role) return res.status(400).json({ success: false, error: 'Target role is required' })

    const result = await resumeService.analyzeResume(
      req.user._id,
      req.file.buffer,
      req.file.originalname,
      role,
      jobDescription
    )

    res.status(201).json({ success: true, data: result })
  } catch (err) { next(err) }
})

module.exports = router
