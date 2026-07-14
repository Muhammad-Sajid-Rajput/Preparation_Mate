const express = require('express')
const Quiz = require('../models/Quiz')
const QuizResult = require('../models/QuizResult')
const quizService = require('../services/quizService')
const { verifyToken } = require('../middleware/auth')
const quotaGuard = require('../middleware/quotaGuard')
const router = express.Router()

router.use(verifyToken)

// GET /api/quizzes/history
router.get('/history', async (req, res, next) => {
  try {
    const results = await QuizResult.find({ userId: req.user._id })
      .populate({
        path: 'quizId',
        select: 'title quizType questions difficulty noteTitle'
      })
      .sort({ completedAt: -1 })

    // Clean outputs to match frontend format
    const formatted = results.map(r => {
      if (!r.quizId) return null;

      const formattedQuiz = quizService.formatQuiz(r.quizId);
      const formattedResult = quizService.formatQuizResult(r, r.quizId);

      return {
        id: r._id,
        quizId: r.quizId._id,
        title: r.quizId.title,
        quizType: r.quizId.quizType,
        difficulty: r.quizId.difficulty || 'medium',
        noteTitle: r.quizId.noteTitle || '',
        score: r.score,
        completedAt: r.completedAt,
        questions: formattedQuiz.questions,
        answers: r.answers,
        topicScores: r.topicScores,
        results: formattedResult
      }
    }).filter(Boolean)

    res.json({ success: true, data: formatted })
  } catch (err) { next(err) }
})

// POST /api/quizzes/generate
router.post('/generate', quotaGuard('quiz'), async (req, res, next) => {
  try {
    const { noteId, count, difficulty, topics, quizType } = req.body

    const quiz = await quizService.generateQuiz({
      userId:     req.user._id,
      noteId,
      count:      parseInt(count) || 10,
      difficulty: difficulty || 'medium',
      topics:     topics || [],
      type:       quizType || 'multiple_choice',
    })
    const formattedQuiz = quizService.formatQuiz(quiz)
    res.status(201).json({ success: true, data: formattedQuiz })
  } catch (err) { next(err) }
})

// POST /api/quizzes/submit/:id
router.post('/submit/:id', async (req, res, next) => {
  try {
    const { answers } = req.body
    if (!answers) {
      return res.status(400).json({ success: false, error: 'Answers are required' })
    }

    const quiz = await Quiz.findById(req.params.id)
    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found' })
    }

    // Map answers map/object or array to the backend expected array format
    let answersArray = []
    if (Array.isArray(answers)) {
      answersArray = answers.map(val => parseInt(val) ?? -1)
    } else {
      // It's a dictionary of questionId -> optionId
      answersArray = quiz.questions.map(q => {
        const qId = q._id.toString()
        const selectedOptId = answers[qId]
        if (selectedOptId === undefined || selectedOptId === null) return -1
        const val = parseInt(selectedOptId)
        return isNaN(val) ? -1 : val
      })
    }

    const result = await quizService.submitQuiz(req.user._id, req.params.id, answersArray)
    const formattedResult = quizService.formatQuizResult(result, quiz)
    res.json({ success: true, data: formattedResult })
  } catch (err) { next(err) }
})

module.exports = router
