const mongoose = require('mongoose')

const apiUsageLogSchema = new mongoose.Schema({
  provider:     { type: String, enum: ['gemini','groq'], required: true },
  model:        { type: String },
  endpoint:     { type: String, required: true },
  feature:      { type: String },
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tokensUsed:   Number,
  durationMs:   { type: Number, required: true },
  status:       { type: String, enum: ['success','error'], required: true },
  errorMessage: String,
  createdAt:    { type: Date, default: Date.now },
})

// TTL: auto-delete after 30 days
apiUsageLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 })
apiUsageLogSchema.index({ provider: 1, createdAt: -1 })

module.exports = mongoose.model('ApiUsageLog', apiUsageLogSchema)
