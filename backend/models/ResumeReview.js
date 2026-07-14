const mongoose = require('mongoose')

const resumeReviewSchema = new mongoose.Schema({
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileUrl:         { type: String, required: true },
  publicId:        { type: String, required: true },
  targetRole:      { type: String, required: true },
  atsScore:        Number,
  keywordMatch:    Number,
  strengths:       [String],
  weaknesses:      [String],
  missingKeywords: [{ keyword: String, priority: { type: String, enum: ['high','medium'] } }],
  recommendations: [{ before: String, after: String }],
  reviewVersion:   { type: Number, default: 1 },
}, { timestamps: true })

resumeReviewSchema.index({ userId: 1, createdAt: -1 })

module.exports = mongoose.model('ResumeReview', resumeReviewSchema)
