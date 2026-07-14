const ChatSession = require('../models/ChatSession')
const Note = require('../models/Note')

exports.getSessions = async (userId, noteId) => {
  const query = { userId }
  if (noteId !== undefined) {
    query.noteId = noteId === 'null' || noteId === 'none' || !noteId ? null : noteId
  }
  return ChatSession.find(query).sort({ lastUpdated: -1 })
}

exports.createSession = async (userId, noteId) => {
  let title = 'New Conversation'
  let noteTitle = null
  if (noteId) {
    const note = await Note.findOne({ _id: noteId, userId })
    if (note) {
      title = `Q&A: ${note.title}`
      noteTitle = note.title
    }
  }

  const session = await ChatSession.create({
    userId,
    title,
    noteId: noteId || null,
    noteTitle,
    messages: []
  })
  return session
}

exports.streamMessage = async (res, sessionId, message, userId, noteId) => {

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`)
  const start = Date.now()
  let fullText = ''
  let sources = []

  try {
    const { embedText } = require('../config/gemini')
    const NoteChunk = require('../models/NoteChunk')
    const Note = require('../models/Note')

    // ── 1. Get context note info ──────────────────────────
    let contextNote = null
    if (noteId) {
      contextNote = await Note.findById(noteId).select('title extractedTopics summary')
    }

    // ── 2. Embed the user query ───────────────────────────
    const queryVector = await embedText(message)

    // ── 3. Vector search in Atlas ─────────────────────────
    const matchFilter = noteId
      ? {
        userId: { $eq: userId.toString() },
        noteId: { $eq: noteId.toString() }
      }
      : { userId: { $eq: userId.toString() } }

    let chunks = []
    try {
      chunks = await NoteChunk.aggregate([
        {
          $vectorSearch: {
            index: 'vector_index',
            path: 'embedding',
            queryVector,
            numCandidates: 100,
            limit: 5,
            filter: matchFilter,
          },
        },
        {
          $lookup: {
            from: 'notes',
            localField: 'noteId',
            foreignField: '_id',
            as: 'note',
          },
        },
        { $unwind: { path: '$note', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            text: 1,
            chunkIndex: 1,
            noteId: 1,
            noteTitle: '$note.title',
            score: { $meta: 'vectorSearchScore' },
          },
        },
      ])
    } catch (vectorErr) {
      // Atlas Vector Search not configured — fall back to summary
      console.error('Vector search failed, using note summary fallback:', vectorErr.message)
      if (contextNote?.summary) {
        chunks = [{
          text: contextNote.summary,
          noteTitle: contextNote.title,
          noteId: noteId,
          chunkIndex: 0,
        }]
      }
    }

    // ── 4. Build sources list ─────────────────────────────
    sources = chunks.map(c => ({
      title: c.noteTitle || 'Your notes',
      page: c.chunkIndex + 1,
      noteId: c.noteId?.toString(),
    }))

    const retrievedContext = chunks.map(c => c.text).join('\n\n---\n\n')

    // ── 5. Get session history ────────────────────────────
    const ChatSession = require('../models/ChatSession')
    const session = await ChatSession.findById(sessionId)
    const history = (session?.messages ?? [])
      .slice(-8)
      .map(m => ({ role: m.role, content: m.content }))

    // ── 6. Build system prompt ────────────────────────────
    let systemPrompt

    if (retrievedContext.length > 100) {
      systemPrompt = `You are an intelligent study assistant for a university student.

IMPORTANT: Base your answer primarily on the student's notes provided below.
If the answer is in the notes, use that information directly and cite it.
If the question goes beyond the notes, supplement with your knowledge but 
clearly say "This goes beyond your notes, but generally..."

${contextNote ? `SUBJECT: ${contextNote.title}
KEY TOPICS: ${contextNote.extractedTopics?.join(', ') || 'Not specified'}` : ''}

RELEVANT EXCERPTS FROM STUDENT NOTES:
${retrievedContext}

Instructions:
- Answer clearly and educationally
- Use examples from the notes when possible
- Be concise — maximum 3-4 paragraphs
- If explaining a concept, structure it clearly
- Do not say "according to your notes" repeatedly — just answer naturally`
    } else {
      // No relevant chunks found — still helpful but honest
      systemPrompt = `You are an intelligent study assistant for a university student.
${contextNote
          ? `The student has uploaded a note titled "${contextNote.title}" covering: ${contextNote.extractedTopics?.join(', ') || 'various topics'}.
However, the specific answer to this question was not found in those notes.
Answer from your general knowledge and mention that this topic may not be covered in the uploaded material.`
          : `The student has not selected a specific note. Answer from your general knowledge as a helpful study assistant.`}

Be clear, educational, and concise.`
    }

    // ── 7. Build full message array ───────────────────────
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: message },
    ]

    // ── 8. Stream via Groq with key rotation ──────────────
    const { createChatCompletion } = require('../config/groq')

    let stream
    try {
      stream = await createChatCompletion(messages, { stream: true })
    } catch (groqErr) {
      send({ type: 'error', content: 'AI temporarily unavailable. Please try again in a moment.' })
      res.write('data: [DONE]\n\n')
      res.end()
      return
    }

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content || ''
      if (token) {
        fullText += token
        send({ type: 'text', content: token })
      }
    }

    // ── 9. Send sources after text ────────────────────────
    if (sources.length > 0) {
      send({ type: 'sources', content: sources })
    }

    send({ type: 'done' })
    res.write('data: [DONE]\n\n')

    // ── 10. Auto-title session on first message ───────────
    const isFirstMessage = !session?.messages?.length
    const sessionTitle = isFirstMessage
      ? message.slice(0, 60)
      : session?.title

    // ── 11. Persist to session ────────────────────────────
    await ChatSession.findByIdAndUpdate(sessionId, {
      $push: {
        messages: {
          $each: [
            { role: 'user', content: message, createdAt: new Date() },
            {
              role: 'assistant', content: fullText,
              sources, createdAt: new Date()
            },
          ],
        },
      },
      $set: { lastUpdated: new Date(), title: sessionTitle },
    })

    // Increment user's usage counts & streak using centralized model method
    const User = require('../models/User')
    const chatUser = await User.findById(userId)
    if (chatUser) {
      chatUser.recordActivity()
      chatUser.usageStats.chatCount = (chatUser.usageStats.chatCount || 0) + 1
      await chatUser.save()
    }

    const ApiUsageLog = require('../models/ApiUsageLog')
    await ApiUsageLog.create({
      provider: 'groq', model: process.env.GROQ_MODEL,
      endpoint: '/chat/message', userId,
      durationMs: Date.now() - start, status: 'success',
    }).catch(() => { })

  } catch (err) {
    send({ type: 'error', content: err.message || 'Something went wrong.' })
    res.write('data: [DONE]\n\n')

    const ApiUsageLog = require('../models/ApiUsageLog')
    await ApiUsageLog.create({
      provider: 'groq', endpoint: '/chat/message', userId,
      durationMs: Date.now() - start, status: 'error',
      errorMessage: err.message,
    }).catch(() => { })
  } finally {
    res.end()
  }
}

exports.deleteSession = async (userId, sessionId) => {
  return ChatSession.deleteOne({ _id: sessionId, userId })
}
