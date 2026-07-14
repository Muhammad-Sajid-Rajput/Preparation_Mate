const express = require('express')
const TopicMastery = require('../models/TopicMastery')
const QuizResult = require('../models/QuizResult')
const Note = require('../models/Note')
const { verifyToken } = require('../middleware/auth')
const router = express.Router()

router.use(verifyToken)

// GET /api/gaps/report
router.get('/report', async (req, res, next) => {
  try {
    const userId = req.user._id

    // 1. Fetch all topic masteries for this user
    const masteries = await TopicMastery.find({ userId })

    // 2. Fetch all notes to build a quick noteId -> noteTitle map
    const notes = await Note.find({ userId })
    const noteMap = {}
    notes.forEach(n => {
      noteMap[n._id.toString()] = n.title
    })

    // 3. Fetch user's quiz history to extract trend, quizCount, and history data points
    const quizResults = await QuizResult.find({ userId })
      .populate('quizId')
      .sort({ completedAt: 1 }) // oldest first to build linear timeline

    // Build timeline data points per topic
    // Map: topicName -> { dateString -> { correct, total } }
    const topicPerformanceMap = {}
    
    // Map: topicName -> Set of quizId
    const topicQuizzesMap = {}

    // Map: topicName -> noteId
    const topicNoteMap = {}

    quizResults.forEach(r => {
      if (!r.quizId) return
      const noteIdStr = r.quizId.noteId ? r.quizId.noteId.toString() : null
      const dateStr = r.completedAt.toISOString().split('T')[0]

      r.quizId.questions.forEach((q, idx) => {
        const tName = q.topic || 'General'
        if (noteIdStr && !topicNoteMap[tName]) {
          topicNoteMap[tName] = noteIdStr
        }

        // Track quiz count
        if (!topicQuizzesMap[tName]) {
          topicQuizzesMap[tName] = new Set()
        }
        topicQuizzesMap[tName].add(r.quizId._id.toString())

        // Track correctness
        const userAnswer = r.answers[idx]
        const isCorrect = userAnswer === q.correctIndex

        if (!topicPerformanceMap[tName]) {
          topicPerformanceMap[tName] = {}
        }
        if (!topicPerformanceMap[tName][dateStr]) {
          topicPerformanceMap[tName][dateStr] = { correct: 0, total: 0 }
        }
        topicPerformanceMap[tName][dateStr].total++
        if (isCorrect) {
          topicPerformanceMap[tName][dateStr].correct++
        }
      })
    })

    // Compile topics list
    const topics = masteries.map(m => {
      const name = m.topic
      const mastery = m.masteryScore || 0

      // Get history points
      const performanceByDate = topicPerformanceMap[name] || {}
      const history = Object.entries(performanceByDate).map(([date, stats]) => ({
        date,
        score: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
      })).sort((a, b) => a.date.localeCompare(b.date))

      // Determine trend
      let trend = 'stable'
      if (history.length >= 2) {
        const lastScore = history[history.length - 1].score
        const prevScore = history[history.length - 2].score
        if (lastScore > prevScore) trend = 'up'
        else if (lastScore < prevScore) trend = 'down'
      }

      // Quiz Count
      const quizCount = topicQuizzesMap[name] ? topicQuizzesMap[name].size : 0

      // Note associations
      const noteId = topicNoteMap[name] || null
      const noteTitle = noteId ? (noteMap[noteId] || 'Custom Note') : 'General Study'

      // Generate AI Insights text
      let insights = 'Practice more quizzes to help AI outline your custom learning report.'
      if (mastery < 40) {
        insights = `This topic is currently a critical gap. Focus on studying key concepts in "${noteTitle}" and take a targeted quiz to build confidence.`
      } else if (mastery < 60) {
        insights = `You are making progress but need more practice. Review details in "${noteTitle}" and test yourself on this topic specifically.`
      } else if (mastery < 80) {
        insights = `Good understanding! Try practicing a few more quizzes to lock in your knowledge on "${noteTitle}" and turn this into a mastered topic.`
      } else {
        insights = `Excellent mastery! You have a solid grasp of "${noteTitle}" concepts. Keep it fresh by doing periodic reviews.`
      }

      // If history is empty, populate with a default baseline point
      if (history.length === 0) {
        history.push({
          date: m.lastUpdated.toISOString().split('T')[0],
          score: mastery
        })
      }

      return {
        name,
        mastery,
        trend,
        quizCount,
        noteId,
        noteTitle,
        history,
        insights
      }
    })

    // Calculate Summary Stats
    const weakTopics = topics.filter(t => t.mastery < 60).length
    const avgMastery = topics.length > 0
      ? topics.reduce((acc, t) => acc + t.mastery, 0) / topics.length
      : 0
    const improving = topics.filter(t => t.trend === 'up').length

    const summary = {
      weakTopics,
      avgMastery,
      improving
    }

    res.json({
      success: true,
      data: {
        topics,
        summary
      }
    })
  } catch (err) { next(err) }
})

module.exports = router
