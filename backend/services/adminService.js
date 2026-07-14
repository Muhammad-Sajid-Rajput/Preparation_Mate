const User           = require('../models/User')
const Note           = require('../models/Note')
const Quiz           = require('../models/Quiz')
const StudyPlan      = require('../models/StudyPlan')
const ResumeReview   = require('../models/ResumeReview')
const ApiUsageLog    = require('../models/ApiUsageLog')

exports.getMetrics = async () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    totalUsers, activeUsers7d, newToday,
    totalNotes, totalQuizzes, totalPlans, totalResumes,
    totalChats,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ lastActiveDate: { $gte: new Date(Date.now() - 7 * 86400000) } }),
    User.countDocuments({ createdAt: { $gte: today } }),
    Note.countDocuments(),
    Quiz.countDocuments(),
    StudyPlan.countDocuments(),
    ResumeReview.countDocuments(),
    ApiUsageLog.countDocuments({ endpoint: { $regex: '/chat' } }),
  ])

  return {
    totalUsers, activeUsers7d, newToday,
    totalNotes, totalQuizzes, totalPlans,
    totalResumes, totalChats,
  }
}

exports.getApiUsage = async (days) => {
  const since = new Date(Date.now() - days * 86400000)

  const [logs, totalCost] = await Promise.all([
    ApiUsageLog.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: {
        _id:           { provider: '$provider', model: '$model' },
        calls:         { $sum: 1 },
        avgDurationMs: { $avg: '$durationMs' },
      }},
    ]),
    ApiUsageLog.countDocuments({ createdAt: { $gte: since } }),
  ])

  const totalCalls    = logs.reduce((s, l) => s + l.calls, 0)
  const avgResponseMs = logs.reduce((s, l) => s + l.avgDurationMs, 0) / (logs.length || 1)

  // Rough cost estimate (adjust rates as needed)
  const estimatedCost = (totalCalls * 0.001).toFixed(2)
  const dailyBudget   = parseFloat(process.env.DAILY_BUDGET_USD) || 10
  const budgetUsedPct = Math.min(100, Math.round((estimatedCost / dailyBudget) * 100))

  return {
    totalCalls,
    estimatedCost: `$${estimatedCost}`,
    dailyBudget:   `$${dailyBudget}`,
    budgetUsedPct,
    avgResponseMs: `${(avgResponseMs / 1000).toFixed(1)}s`,
    providers:     logs.map(l => ({
      name:  l._id.provider,
      model: l._id.model,
      calls: l.calls,
      pct:   Math.round((l.calls / totalCalls) * 100),
    })),
  }
}

exports.getErrorLogs = async (page, limit) => {
  const [logs, total] = await Promise.all([
    ApiUsageLog.find({ status: 'error' })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    ApiUsageLog.countDocuments({ status: 'error' }),
  ])
  return { logs, total, page }
}
