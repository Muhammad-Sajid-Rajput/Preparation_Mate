const mongoose = require('mongoose')

const chatSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:  { type: String, default: 'New conversation' },
  noteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Note' },
  noteTitle: { type: String },
  messages: [{
    role:      { type: String, enum: ['user','assistant'] },
    content:   String,
    sources:   [{ title: String, page: Number, noteId: String }],
    createdAt: { type: Date, default: Date.now },
  }],
  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true })

chatSessionSchema.index({ userId: 1, lastUpdated: -1 })

module.exports = mongoose.model('ChatSession', chatSessionSchema)
