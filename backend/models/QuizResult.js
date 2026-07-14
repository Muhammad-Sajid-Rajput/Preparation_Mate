const mongoose = require('mongoose')

const quizResultSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quizId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  answers:    [Number],
  score:      { type: Number, required: true },
  topicScores:[{ topic: String, correct: Number, total: Number }],
  timeTaken:  Number,
  completedAt:{ type: Date, default: Date.now },
})

quizResultSchema.index({ userId: 1, completedAt: -1 })

module.exports = mongoose.model('QuizResult', quizResultSchema)
