const mongoose = require('mongoose')

const noteChunkSchema = new mongoose.Schema({
  noteId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Note', required: true },
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  chunkIndex: { type: Number, required: true },
  text:       { type: String, required: true },
  embedding:  { type: [Number], required: true }, // 3072-dimensional vector from Gemini Embedding 2
}, { timestamps: true })

noteChunkSchema.index({ noteId: 1 })
noteChunkSchema.index({ userId: 1 })

module.exports = mongoose.model('NoteChunk', noteChunkSchema)
