const mongoose = require('mongoose')

const quizSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  noteId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Note' },
  noteTitle:    { type: String },             // ADD THIS
  title:        { type: String, required: true },
  quizType:     {
    type: String,
    enum: ['multiple_choice', 'true_false', 'mixed'],
    default: 'multiple_choice'
  },
  difficulty:   {                             // ADD THIS
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  targetTopics: [String],
  questionCount:{ type: Number },             // ADD THIS
  questions: [{
    text:         String,
    options:      [String],
    correctIndex: Number,
    topic:        String,
    explanation:  String,
  }],
}, { timestamps: true })

quizSchema.index({ userId: 1, createdAt: -1 })

module.exports = mongoose.model('Quiz', quizSchema)
