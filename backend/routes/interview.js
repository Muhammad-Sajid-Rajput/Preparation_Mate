const express = require('express')
const InterviewSession = require('../models/InterviewSession')
const interviewService = require('../services/interviewService')
const { verifyToken } = require('../middleware/auth')
const router = express.Router()

router.use(verifyToken)

// POST /api/career/interview/setup
router.post('/setup', async (req, res, next) => {
  try {
    const session = await interviewService.setupInterview(req.user._id, req.body)
    res.status(201).json({ success: true, data: session })
  } catch (err) { next(err) }
})

// POST /api/career/interview/evaluate
router.post('/evaluate', async (req, res, next) => {
  try {
    const { sessionId, questionId, answerText } = req.body
    if (!sessionId || !questionId || !answerText) {
      return res.status(400).json({ success: false, error: 'SessionId, questionId and answerText are required' })
    }
    const result = await interviewService.evaluateAnswer(req.user._id, sessionId, questionId, answerText)
    res.json({ success: true, data: result })
  } catch (err) { next(err) }
})

// GET /api/career/interview/history
router.get('/history', async (req, res, next) => {
  try {
    const sessions = await InterviewSession.find({ userId: req.user._id }).sort({ createdAt: -1 })
    
    // Format to match frontend structure (ensure id key is string-ified)
    const formatted = sessions.map(s => {
      const obj = s.toObject()
      obj.id = obj._id.toString()
      obj.qas = obj.qas.map(q => ({
        ...q,
        id: q._id.toString()
      }))
      // Progress calculation helper
      const reviewedCount = obj.qas.filter(q => q.reviewed).length
      obj.reviewedCount = reviewedCount
      return obj
    })

    res.json({ success: true, data: formatted })
  } catch (err) { next(err) }
})

module.exports = router
