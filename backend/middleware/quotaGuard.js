const quotaGuard = (type) => (req, res, next) => {
  const limits = {
    quiz:   parseInt(process.env.DAILY_QUIZ_LIMIT)   || 20,
    chat:   parseInt(process.env.DAILY_CHAT_LIMIT)   || 50,
    resume: parseInt(process.env.DAILY_RESUME_LIMIT) || 2,
    pdf:    parseInt(process.env.DAILY_PDF_LIMIT)    || 10,
  }

  const stats  = req.user.usageStats
  const today  = new Date().toISOString().split('T')[0]
  const isToday = stats?.date && new Date(stats.date).toISOString().split('T')[0] === today

  const count = isToday ? (stats[`${type}Count`] ?? 0) : 0

  if (count >= limits[type]) {
    return res.status(429).json({
      success: false,
      error:   `Daily ${type} limit reached (${limits[type]}). Resets at midnight UTC.`,
    })
  }
  next()
}

module.exports = quotaGuard
