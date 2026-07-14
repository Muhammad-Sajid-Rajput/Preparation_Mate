const express        = require('express')
const { verifyToken } = require('../middleware/auth')
const { aiRoutes }    = require('../middleware/rateLimiter')
const plannerService  = require('../services/plannerService')
const router         = express.Router()

router.use(verifyToken)

// GET /api/planner/suggested-topics
router.get('/suggested-topics', async (req, res, next) => {
  try {
    const topics = await plannerService.getSuggestedTopics(req.user._id)
    res.json({ success: true, data: topics })
  } catch (err) { next(err) }
})

// GET /api/planner/mission (today's mission)
router.get('/mission', async (req, res, next) => {
  try {
    const mission = await plannerService.getTodaysMission(req.user._id)
    res.json({ success: true, data: mission })
  } catch (err) { next(err) }
})

// GET /api/planner/readiness
router.get('/readiness', async (req, res, next) => {
  try {
    const score = await plannerService.getReadinessScore(req.user._id)
    res.json({ success: true, data: { score } })
  } catch (err) { next(err) }
})

// GET /api/planner/plan
router.get('/plan', async (req, res, next) => {
  try {
    const plan = await plannerService.getPlan(req.user._id)
    if (!plan) return res.status(404).json({ success: false, error: 'No active plan' })
    res.json({ success: true, data: plan })
  } catch (err) { next(err) }
})

// POST /api/planner/plan
router.post('/plan', aiRoutes, async (req, res, next) => {
  try {
    const {
      examName, examDate, dailyTargetHours,
      weekdayHours, weekendHours,
      topics, sourceNotes,
    } = req.body

    if (!examName || !examDate || !dailyTargetHours) {
      return res.status(400).json({
        success: false,
        error: 'examName, examDate, and dailyTargetHours are required'
      })
    }

    const plan = await plannerService.createPlan({
      userId: req.user._id,
      examName, examDate,
      dailyTargetHours: parseFloat(dailyTargetHours),
      weekdayHours: weekdayHours ? parseFloat(weekdayHours) : null,
      weekendHours: weekendHours ? parseFloat(weekendHours) : null,
      topics:      topics || [],
      sourceNotes: sourceNotes || [],
    })

    res.status(201).json({ success: true, data: plan })
  } catch (err) { next(err) }
})

// POST /api/planner/recalculate
router.post('/recalculate', aiRoutes, async (req, res, next) => {
  try {
    const result = await plannerService.recalculatePlan(req.user._id)
    res.json({ success: true, data: result })
  } catch (err) { next(err) }
})

// PATCH /api/planner/tasks/:taskId
router.patch('/tasks/:taskId', async (req, res, next) => {
  try {
    const task = await plannerService.updateTask(
      req.params.taskId,
      req.user._id,
      req.body.completed,
      req.body.confidenceBefore,
      req.body.confidenceAfter,
    )
    res.json({ success: true, data: task })
  } catch (err) { next(err) }
})

module.exports = router
