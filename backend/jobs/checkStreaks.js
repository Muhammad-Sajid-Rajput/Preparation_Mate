const User = require('../models/User')

module.exports = async function checkStreaks() {
  try {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)

    // Reset streak for users who missed yesterday
    await User.updateMany(
      { lastActiveDate: { $lt: yesterday }, studyStreak: { $gt: 0 } },
      { $set: { studyStreak: 0 } }
    )
    console.log('[CRON] Streak check complete')
  } catch (err) {
    console.error('[CRON] Streak check failed:', err.message)
  }
}
