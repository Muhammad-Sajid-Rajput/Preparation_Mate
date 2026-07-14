const mongoose = require('mongoose')

const interviewSessionSchema = new mongoose.Schema({
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role:            { type: String, required: true },
  experienceLevel: { type: String, enum: ['entry','mid','senior'], required: true },
  specialization:  String,
  qas: [{
    question:    String,
    modelAnswer: String,
    category:    { type: String, enum: ['Technical','Behavioral','Situational'] },
    difficulty:  String,
    reviewed:    { type: Boolean, default: false },
  }],
}, { timestamps: true })

interviewSessionSchema.index({ userId: 1, createdAt: -1 })

module.exports = mongoose.model('InterviewSession', interviewSessionSchema)
