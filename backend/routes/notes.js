const express = require('express')
const Note = require('../models/Note')
const noteService = require('../services/noteService')
const { verifyToken } = require('../middleware/auth')
const quotaGuard = require('../middleware/quotaGuard')
const { validateUpload } = require('../middleware/uploadValidation')
const router = express.Router()

router.use(verifyToken)

// GET /api/notes
router.get('/', async (req, res, next) => {
  try {
    const notes = await Note.find({ userId: req.user._id }).select('-extractedText').sort({ createdAt: -1 })
    res.json({ success: true, data: notes })
  } catch (err) { next(err) }
})

// GET /api/notes/:id
router.get('/:id', async (req, res, next) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user._id })
    if (!note) return res.status(404).json({ success: false, error: 'Note not found' })
    res.json({ success: true, data: note })
  } catch (err) { next(err) }
})

// POST /api/notes/upload
router.post('/upload', quotaGuard('pdf'), validateUpload('pdf'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' })
    
    // Increment quota usage stats & streak using centralized model method
    req.user.recordActivity()
    req.user.usageStats.pdfCount = (req.user.usageStats.pdfCount || 0) + 1
    await req.user.save()

    const title = req.body.title || req.file.originalname.replace(/\.[^/.]+$/, "")
    const subject = req.body.subject || ""
    const note = await noteService.createNote(req.user._id, title, req.file.buffer, req.file.originalname, subject)

    res.status(201).json({ success: true, data: note })
  } catch (err) { next(err) }
})

// DELETE /api/notes/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const note = await noteService.deleteNote(req.params.id, req.user._id)
    if (!note) return res.status(404).json({ success: false, error: 'Note not found' })

    res.json({ success: true, data: { message: 'Note deleted successfully' } })
  } catch (err) { next(err) }
})

module.exports = router
