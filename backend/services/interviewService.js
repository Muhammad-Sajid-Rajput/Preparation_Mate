const mongoose = require('mongoose')
const InterviewSession = require('../models/InterviewSession')
const { generateWithFallback } = require('./ai/geminiService')

exports.setupInterview = async (userId, data) => {
  const { role, experienceLevel, specialization, count = 10 } = data

  let qas = []

  try {
    const prompt = `Generate exactly ${count} interview questions and model answers for a candidate applying for:
Role: ${role}
Experience Level: ${experienceLevel}
Specialization: ${specialization || 'General'}

Return ONLY a valid JSON array matching this exact typescript signature:
Array<{
  question: string;
  modelAnswer: string;
  category: 'Technical' | 'Behavioral' | 'Situational';
  difficulty: 'Easy' | 'Medium' | 'Hard';
}>`

    const { text: responseTextRaw } = await generateWithFallback(prompt, {
      userId,
      endpoint: '/career/interview/setup',
      feature: 'interview'
    })
    let responseText = responseTextRaw.trim()
    if (responseText.startsWith('```json')) {
      responseText = responseText.substring(7, responseText.length - 3).trim()
    } else if (responseText.startsWith('```')) {
      responseText = responseText.substring(3, responseText.length - 3).trim()
    }
    qas = JSON.parse(responseText)
  } catch (err) {
    console.error('Interview setup AI failed:', err.message)
  }

  // Fallback / Mock Questions
  if (!qas || qas.length === 0) {
    const categories = ['Technical', 'Behavioral', 'Situational']
    const difficulties = ['Easy', 'Medium', 'Hard']
    for (let i = 0; i < count; i++) {
      qas.push({
        question: `Question ${i + 1}: Describe your experience with ${role} and how you manage ${specialization || 'day-to-day duties'}.`,
        modelAnswer: `Model Answer ${i + 1}: Standard response showing problem solving, system knowledge, and adaptability suited for ${experienceLevel} level.`,
        category: categories[i % categories.length],
        difficulty: difficulties[i % difficulties.length]
      })
    }
  }

  // Ensure each QA has a clean ObjectId
  const formattedQas = qas.map((qa) => ({
    ...qa,
    _id: new mongoose.Types.ObjectId(),
    reviewed: false
  }))

  const session = await InterviewSession.create({
    userId,
    role,
    experienceLevel: experienceLevel || 'entry',
    specialization: specialization || 'General',
    qas: formattedQas
  })

  // Format to match frontend expected fields
  const sessionObject = session.toObject()
  sessionObject.qas = sessionObject.qas.map(qa => ({
    ...qa,
    id: qa._id.toString()
  }))

  return sessionObject
}

exports.evaluateAnswer = async (userId, sessionId, questionId, answerText) => {
  const session = await InterviewSession.findOne({ _id: sessionId, userId })
  if (!session) throw new Error('Interview session not found')

  const qa = session.qas.id(questionId)
  if (!qa) throw new Error('Question not found')

  let feedback = 'Standard offline review feedback.'
  let score = 7

  try {
    const prompt = `Evaluate the candidate's answer for this interview question.
Question: ${qa.question}
Model Answer: ${qa.modelAnswer}
Candidate's Answer: ${answerText}

Return ONLY a valid JSON object matching this structure:
{
  "feedback": "constructive feedback text",
  "score": number // 1 to 10 scale
}`

    const { text: responseTextRaw } = await generateWithFallback(prompt, {
      userId,
      endpoint: '/career/interview/evaluate',
      feature: 'interview'
    })
    let responseText = responseTextRaw.trim()
    if (responseText.startsWith('```json')) {
      responseText = responseText.substring(7, responseText.length - 3).trim()
    } else if (responseText.startsWith('```')) {
      responseText = responseText.substring(3, responseText.length - 3).trim()
    }
    const parsed = JSON.parse(responseText)
    feedback = parsed.feedback
    score = parsed.score
  } catch (err) {
    console.error('Answer evaluation failed:', err.message)
  }

  // Update question status to reviewed
  qa.reviewed = true
  await session.save()

  return {
    questionId,
    feedback,
    score,
    modelAnswer: qa.modelAnswer
  }
}
