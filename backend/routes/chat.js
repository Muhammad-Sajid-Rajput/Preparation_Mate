const express = require('express')
const chatService = require('../services/chatService')
const { verifyToken } = require('../middleware/auth')
const quotaGuard = require('../middleware/quotaGuard')
const router = express.Router()

router.use(verifyToken)

// GET /api/chat/sessions
router.get('/sessions', async (req, res, next) => {
  try {
    const { noteId } = req.query
    const sessions = await chatService.getSessions(req.user._id, noteId)
    res.json({ success: true, data: sessions })
  } catch (err) { next(err) }
})

// POST /api/chat/sessions
router.post('/sessions', async (req, res, next) => {
  try {
    const { noteId } = req.body
    const session = await chatService.createSession(req.user._id, noteId)
    res.status(201).json({ success: true, data: session })
  } catch (err) { next(err) }
})

// DELETE /api/chat/sessions/:id
router.delete('/sessions/:id', async (req, res, next) => {
  try {
    await chatService.deleteSession(req.user._id, req.params.id)
    res.json({ success: true, message: 'Session deleted' })
  } catch (err) { next(err) }
})

// POST /api/chat/message
router.post('/message', quotaGuard('chat'), async (req, res, next) => {
  try {
    const { sessionId, text, noteId } = req.body
    if (!sessionId || !text) {
      return res.status(400).json({ success: false, error: 'SessionId and text are required' })
    }

    await chatService.streamMessage(
      res,
      sessionId,
      text,
      req.user._id,
      noteId
    )
  } catch (err) {
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ type: 'error', content: err.message })}\n\n`)
      res.end()
    } else {
      next(err)
    }
  }
})

module.exports = router
