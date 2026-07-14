const ApiUsageLog = require('../models/ApiUsageLog')

const errorHandler = async (err, req, res, next) => {
  console.error(err)

  // Log AI errors to apiUsageLogs
  if (err.provider) {
    await ApiUsageLog.create({
      provider:     err.provider,
      endpoint:     req.path,
      userId:       req.user?._id || null,
      durationMs:   err.durationMs || 0,
      status:       'error',
      errorMessage: err.message,
    }).catch(() => {})
  }

  const status  = err.statusCode || 500
  const message = err.message    || 'Internal server error'
  res.status(status).json({ success: false, error: message })
}

module.exports = errorHandler
