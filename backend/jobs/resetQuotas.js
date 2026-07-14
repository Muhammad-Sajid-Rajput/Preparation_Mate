const User = require('../models/User')

module.exports = async function resetQuotas() {
  try {
    await User.updateMany({}, {
      $set: {
        'usageStats.date':        new Date(),
        'usageStats.chatCount':   0,
        'usageStats.quizCount':   0,
        'usageStats.resumeCount': 0,
        'usageStats.pdfCount':    0,
      }
    })
    console.log('[CRON] Daily quotas reset')
  } catch (err) {
    console.error('[CRON] Quota reset failed:', err.message)
  }
}
