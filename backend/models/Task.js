const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema({
  planId:         { type: mongoose.Schema.Types.ObjectId, ref: 'StudyPlan' },
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Core fields
  title:          { type: String, required: true },
  type:           {
    type: String,
    enum: ['read', 'quiz', 'review', 'manual'],
    default: 'manual',
  },
  dateAssigned:   { type: Date, required: true },
  estimatedMins:  { type: Number, default: 30 },
  priority:       { type: String, enum: ['high','medium','low'], default: 'medium' },
  completed:      { type: Boolean, default: false },
  completedAt:    { type: Date },
  confidenceBefore: { type: Number, min: 1, max: 5 },
  confidenceAfter:  { type: Number, min: 1, max: 5 },
  confidenceGain:   { type: Number },

  // Source linking
  sourceNoteId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Note' },
  sourceNoteTitle:{ type: String },
  sourceQuizId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
  topic:          { type: String },
  goal:           { type: String },
  whyThisMatters: { type: String },
  expectedImpact: { type: String },

  // Task-specific metadata
  metadata: {
    // For 'read' tasks
    suggestedPages: { type: String }, // e.g. "Pages 1-15"
    // For 'quiz' tasks
    questionCount:  { type: Number, default: 10 },
    difficulty:     { type: String, default: 'medium' },
    // For 'review' tasks
    reviewQuizId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
  },
})

taskSchema.index({ planId: 1, dateAssigned: 1 })
taskSchema.index({ userId: 1, dateAssigned: 1, completed: 1 })
taskSchema.index({ userId: 1, completed: 1, dateAssigned: 1 })

module.exports = mongoose.model('Task', taskSchema)
