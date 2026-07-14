const mongoose = require('mongoose')

const noteSchema = new mongoose.Schema({
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:           { type: String, required: true, maxlength: 200 },
  fileUrl:          { type: String, required: true },
  publicId:         { type: String, required: true },
  subject:          { type: String, default: '' },
  pageCount:       { type: Number, required: true },
  extractedText:   String,
  summary:         String,
  extractedTopics: [String],
  chunkCount:      { type: Number, default: 0 },
  processingStatus:{ type: String, enum: ['pending','ready','failed'], default: 'pending' },
}, { timestamps: true })

noteSchema.index({ userId: 1, createdAt: -1 })

module.exports = mongoose.model('Note', noteSchema)
