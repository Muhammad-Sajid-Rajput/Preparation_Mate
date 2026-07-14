const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  name:             { type: String, required: true, maxlength: 100 },
  email:            { type: String, required: true, unique: true, lowercase: true },
  passwordHash:     { type: String, required: true },
  role:             { type: String, enum: ['user', 'admin'], default: 'user' },
  isVerified:       { type: Boolean, default: false },
  otpHash:              String,
  otpExpiresAt:         Date,
  goalPreference:   { type: String, enum: ['exam', 'interview', 'both'], default: 'exam' },
  studyStreak:      { type: Number, default: 0 },
  lastActiveDate:   Date,
  usageStats: {
    date:         Date,
    chatCount:    { type: Number, default: 0 },
    quizCount:    { type: Number, default: 0 },
    resumeCount:  { type: Number, default: 0 },
    pdfCount:     { type: Number, default: 0 },
  },
  refreshTokenHash: String,
}, { timestamps: true })

userSchema.methods.recordActivity = function() {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // Update daily usage stats if new day
  const statsDate = this.usageStats?.date ? new Date(this.usageStats.date) : null
  const isToday = statsDate &&
    statsDate.getFullYear() === today.getFullYear() &&
    statsDate.getMonth() === today.getMonth() &&
    statsDate.getDate() === today.getDate()

  if (!isToday) {
    this.usageStats = {
      date: now,
      chatCount: 0,
      quizCount: 0,
      resumeCount: 0,
      pdfCount: 0,
    }
  }

  // Update study streak
  if (!this.lastActiveDate || !this.studyStreak) {
    this.studyStreak = 1
  } else {
    const lastActive = new Date(this.lastActiveDate)
    const lastActiveDay = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate())
    const diffTime = today.getTime() - lastActiveDay.getTime()
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      this.studyStreak += 1
    } else if (diffDays > 1) {
      this.studyStreak = 1
    }
  }

  this.lastActiveDate = now
}

userSchema.index({ 'usageStats.date': 1 })

module.exports = mongoose.model('User', userSchema)
