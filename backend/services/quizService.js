const Quiz = require('../models/Quiz')
const QuizResult = require('../models/QuizResult')
const Note = require('../models/Note')
const TopicMastery = require('../models/TopicMastery')

const buildQuizPrompt = (context, count, difficulty, topics, quizType) => {
  const topicFilter = topics?.length > 0
    ? `Focus ONLY on these specific topics: ${topics.join(', ')}.`
    : 'Cover all topics found in the content.'

  const difficultyGuide = {
    easy:   'Simple recall and basic comprehension. Single-concept questions.',
    medium: 'Applied understanding. Require knowing how concepts relate.',
    hard:   'Analysis and synthesis. Multi-concept reasoning required.',
  }[difficulty?.toLowerCase()] || 'Applied understanding.'

  // TYPE-SPECIFIC RULES — this is what was missing
  let typeRule = ''
  let typeExample = ''

  if (quizType === 'true_false' || quizType === 'true-false') {
    typeRule = `
QUIZ TYPE: True/False ONLY.
- Every question MUST be a True/False statement.
- options array MUST be exactly: ["True", "False"]
- correctIndex MUST be 0 (True) or 1 (False)
- Do NOT generate any multiple-choice questions.
`
    typeExample = `{
  "text": "HTTP is a stateless protocol.",
  "options": ["True", "False"],
  "correctIndex": 0,
  "topic": "HTTP",
  "explanation": "HTTP does not maintain state between requests by default."
}`
  } else if (quizType === 'mixed') {
    typeRule = `
QUIZ TYPE: Mixed — alternate between multiple-choice and true/false.
- Roughly half the questions should be True/False
- Remaining questions should be 4-option multiple choice
- For True/False: options = ["True", "False"], correctIndex = 0 or 1
- For MCQ: options = 4 items, correctIndex = 0-3
- Vary the types throughout — do not cluster all T/F at the start
`
    typeExample = `{ "text": "...", "options": ["True","False"], "correctIndex": 1, ... }
{ "text": "...", "options": ["A","B","C","D"], "correctIndex": 2, ... }`
  } else {
    // Default: multiple_choice
    typeRule = `
QUIZ TYPE: Multiple Choice ONLY.
- Every question MUST have exactly 4 options.
- options array MUST have exactly 4 items.
- correctIndex MUST be 0, 1, 2, or 3.
- Do NOT generate True/False questions.
- All 4 options must be plausible distractors.
`
    typeExample = `{
  "text": "What does CSS stand for?",
  "options": ["Cascading Style Sheets", "Computer Style Syntax", "Creative Style System", "Coded Style Sheets"],
  "correctIndex": 0,
  "topic": "CSS",
  "explanation": "CSS stands for Cascading Style Sheets."
}`
  }

  return `
You are a university-level quiz generator creating an exam.

${typeRule}

DIFFICULTY: ${difficulty?.toUpperCase() || 'MEDIUM'} — ${difficultyGuide}

TOPIC FILTER: ${topicFilter}

Generate EXACTLY ${count} questions. Not more, not less.

SOURCE MATERIAL:
${context}

Return ONLY a valid JSON array. No markdown, no code blocks, no explanation.
Every object must follow this exact structure:
[
  ${typeExample}
]

CRITICAL RULES:
1. Return EXACTLY ${count} questions
2. Every question MUST follow the ${quizType === 'true_false' || quizType === 'true-false' ? 'True/False' : quizType === 'mixed' ? 'Mixed' : 'Multiple Choice'} format strictly
3. No duplicate questions
4. Explanations must be 1-2 sentences maximum
5. Return ONLY the JSON array — absolutely no other text
`
}

exports.generateQuiz = async ({ userId, noteId, count, difficulty, topics, type }) => {

  if (!noteId) {
    throw Object.assign(
      new Error('A note must be selected to generate a quiz.'),
      { statusCode: 400 }
    )
  }

  const Note = require('../models/Note')
  const note = await Note.findOne({ _id: noteId, userId })
  if (!note) {
    throw Object.assign(new Error('Note not found.'), { statusCode: 404 })
  }
  if (note.processingStatus !== 'ready') {
    throw Object.assign(
      new Error('Note is still processing. Please wait and try again.'),
      { statusCode: 400 }
    )
  }

  // Use summary + topics for context (extractedText may be cleared)
  const context = [
    note.summary,
    note.extractedTopics?.length > 0
      ? 'Key topics covered: ' + note.extractedTopics.join(', ')
      : '',
  ].filter(Boolean).join('\n\n')

  if (!context || context.length < 50) {
    throw Object.assign(
      new Error('This note has insufficient content to generate a quiz.'),
      { statusCode: 400 }
    )
  }

  // Normalize quizType to backend enum
  const normalizedType = (type || 'multiple_choice')
    .toLowerCase()
    .replace(/ /g, '_')
    .replace('-', '_')
  // Accepts: 'multiple_choice', 'true_false', 'mixed'

  // Normalize and validate difficulty to backend enum
  const normalizedDifficulty = (difficulty || 'medium').toLowerCase()
  const finalDifficulty = ['easy', 'medium', 'hard'].includes(normalizedDifficulty)
    ? normalizedDifficulty
    : 'medium'

  const prompt = buildQuizPrompt(
    context,
    parseInt(count) || 10,
    finalDifficulty,
    topics || [],
    normalizedType
  )

  const { generateWithFallback } = require('../config/gemini')
  const { text: raw, modelUsed } = await generateWithFallback(prompt)

  // Robust JSON parse — strip any accidental markdown fences
  let questions
  try {
    const clean = raw
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim()
    questions = JSON.parse(clean)
    if (!Array.isArray(questions)) throw new Error('Not an array')
    if (questions.length < 1) throw new Error('Empty array')
  } catch (parseErr) {
    throw Object.assign(
      new Error('Quiz generation produced an invalid format. Please try again.'),
      { statusCode: 500 }
    )
  }

  // Validate each question matches the requested type
  questions = questions.map((q, i) => {
    const isValid = q.text && Array.isArray(q.options) && q.options.length >= 2
    if (!isValid) {
      throw Object.assign(
        new Error(`Question ${i+1} has invalid structure.`),
        { statusCode: 500 }
      )
    }
    return {
      text:         q.text,
      options:      q.options,
      correctIndex: parseInt(q.correctIndex) || 0,
      topic:        q.topic || note.extractedTopics?.[0] || 'General',
      explanation:  q.explanation || '',
    }
  })

  const Quiz = require('../models/Quiz')
  const quiz = await Quiz.create({
    userId,
    noteId: note._id,
    noteTitle: note.title,
    title: `${note.title} — Quiz`,
    quizType: normalizedType,
    difficulty: finalDifficulty,
    targetTopics: topics || [],
    questions,
    questionCount: questions.length,
  })

  // Log usage
  const ApiUsageLog = require('../models/ApiUsageLog')
  await ApiUsageLog.create({
    provider: 'gemini', model: modelUsed,
    endpoint: '/quizzes/generate', userId,
    status: 'success',
    durationMs: 0,
  }).catch(() => {})

  return quiz
}


exports.submitQuiz = async (userId, quizId, answers) => {
  const quiz = await Quiz.findById(quizId)
  if (!quiz) throw new Error('Quiz not found')

  // Map incoming answers object/array into a clean array of numbers
  const answersArray = quiz.questions.map((q, idx) => {
    const qId = q._id ? q._id.toString() : String(idx);
    let userAnswer = answers[qId] !== undefined ? answers[qId] : answers[idx];
    if (userAnswer === undefined || userAnswer === null || userAnswer === -1 || userAnswer === '') {
      return -1;
    }
    return typeof userAnswer === 'string' ? parseInt(userAnswer, 10) : Number(userAnswer);
  });

  let correctCount = 0
  const topicBreakdown = {} // topicName -> { correct, total }

  quiz.questions.forEach((q, idx) => {
    const userAnswer = answersArray[idx]
    const isCorrect = userAnswer === q.correctIndex
    if (isCorrect) {
      correctCount++
    }

    const t = q.topic || 'General Core'
    if (!topicBreakdown[t]) {
      topicBreakdown[t] = { correct: 0, total: 0 }
    }
    topicBreakdown[t].total++
    if (isCorrect) {
      topicBreakdown[t].correct++
    }
  })

  const score = Math.round((correctCount / quiz.questions.length) * 100)

  // Save QuizResult
  const topicScores = Object.entries(topicBreakdown).map(([topic, stats]) => ({
    topic,
    correct: stats.correct,
    total: stats.total
  }))

  const result = await QuizResult.create({
    userId,
    quizId,
    answers: answersArray,
    score,
    topicScores
  })

  // Update TopicMastery
  const masteryPromises = topicScores.map(async (ts) => {
    let mastery = await TopicMastery.findOne({ userId, topic: ts.topic })
    if (!mastery) {
      mastery = new TopicMastery({
        userId,
        topic: ts.topic,
        attempts: 0,
        correct: 0
      })
    }
    mastery.attempts += ts.total
    mastery.correct += ts.correct
    mastery.masteryScore = Math.round((mastery.correct / mastery.attempts) * 100)
    mastery.weakFlag = mastery.masteryScore < 60
    mastery.lastUpdated = new Date()
    return mastery.save()
  })

  await Promise.all(masteryPromises)

  // Increment user's usage counts & streak using centralized model method
  const user = await QuizResult.db.model('User').findById(userId)
  if (user) {
    user.recordActivity()
    user.usageStats.quizCount = (user.usageStats.quizCount || 0) + 1
    await user.save()
  }

  return result
}

exports.formatQuiz = (quiz) => {
  if (!quiz) return null;
  const quizObj = quiz.toObject ? quiz.toObject() : quiz;
  const id = quizObj._id ? quizObj._id.toString() : quizObj.id;
  
  const formattedQuestions = (quizObj.questions || []).map((q, idx) => {
    const qId = q._id ? q._id.toString() : String(idx);
    const opts = (q.options || []).map((opt, oIdx) => ({
      id: String(oIdx),
      text: opt
    }));
    return {
      id: qId,
      _id: q._id || qId,
      questionText: q.text || '',
      options: opts,
      correctAnswer: q.correctIndex !== undefined ? String(q.correctIndex) : '',
      topic: q.topic || '',
      explanation: q.explanation || ''
    };
  });

  return {
    id,
    _id: id,
    title: quizObj.title,
    quizType: quizObj.quizType,
    subject: quizObj.title,
    targetTopics: quizObj.targetTopics || [],
    questions: formattedQuestions
  };
};

exports.formatQuizResult = (result, quiz) => {
  if (!result || !quiz) return null;
  const resultObj = result.toObject ? result.toObject() : result;
  const quizObj = quiz.toObject ? quiz.toObject() : quiz;

  let correct = 0;
  let incorrect = 0;
  let skipped = 0;

  const questionReview = (quizObj.questions || []).map((q, idx) => {
    const qId = q._id ? q._id.toString() : String(idx);
    const userAnswerIndex = resultObj.answers[idx];
    const isCorrect = userAnswerIndex === q.correctIndex;
    
    if (userAnswerIndex === undefined || userAnswerIndex === null || userAnswerIndex === -1) {
      skipped++;
    } else if (isCorrect) {
      correct++;
    } else {
      incorrect++;
    }

    return {
      id: qId,
      question: q.text || '',
      userAnswer: userAnswerIndex !== undefined && userAnswerIndex !== null ? String(userAnswerIndex) : '',
      correctAnswer: q.correctIndex !== undefined ? String(q.correctIndex) : '',
      isCorrect,
      explanation: q.explanation || ''
    };
  });

  const topicBreakdown = (resultObj.topicScores || []).map(ts => ({
    topic: ts.topic,
    score: ts.total > 0 ? Math.round((ts.correct / ts.total) * 100) : 0
  }));

  return {
    id: resultObj._id ? resultObj._id.toString() : resultObj.id,
    quizId: quizObj._id ? quizObj._id.toString() : quizObj.id,
    score: resultObj.score,
    correct,
    incorrect,
    skipped,
    timeTaken: resultObj.timeTaken || 0,
    completedAt: resultObj.completedAt,
    topicBreakdown,
    questionReview
  };
};
