const mongoose = require('mongoose')

const topicMasterySchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topic:        { type: String, required: true },
  attempts:     { type: Number, default: 0 },
  correct:      { type: Number, default: 0 },
  masteryScore: { type: Number, default: 0 },
  weakFlag:     { type: Boolean, default: true },
  lastUpdated:  { type: Date, default: Date.now },
})

topicMasterySchema.index({ userId: 1, topic: 1 }, { unique: true })
topicMasterySchema.index({ userId: 1, weakFlag: 1 })

module.exports = mongoose.model('TopicMastery', topicMasterySchema)
