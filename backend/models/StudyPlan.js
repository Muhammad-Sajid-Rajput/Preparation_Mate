const mongoose = require('mongoose')

const studyPlanSchema = new mongoose.Schema({
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
  examName:        { type: String, required: true, maxlength: 100 },
  examDate:        { type: Date, required: true },
  dailyTargetHours:{ type: Number, default: 2 },
  recalcNeeded:    { type: Boolean, default: false },

  status: {
    type: String,
    enum: ['active', 'completed', 'paused'],
    default: 'active',
  },
  healthStatus: {
    type: String,
    enum: ['on_track', 'falling_behind', 'critical'],
    default: 'on_track',
  },
  readinessScore:  { type: Number, default: 0 },
  lastHealthCheck: { type: Date },
  autoRecalc:      { type: Boolean, default: true },
  weekdayHours:    { type: Number, default: null },
  weekendHours:    { type: Number, default: null },
  recoveryMode:    { type: Boolean, default: false },
}, { timestamps: true })

module.exports = mongoose.model('StudyPlan', studyPlanSchema)
