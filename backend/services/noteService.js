const Note = require('../models/Note')
const NoteChunk = require('../models/NoteChunk')
const pdfParser = require('../utils/pdfParser')
const { chunkText } = require('./rag/chunkService')
const { generateWithFallback } = require('./ai/geminiService')
const { embedTexts } = require('./ai/embeddingService')
const fileUploader = require('./storage/cloudinaryService')

exports.createNote = async (userId, title, fileBuffer, filename, subject = '') => {
  // 1. Upload to Cloudinary
  const { url, publicId } = await fileUploader.uploadFile(fileBuffer, 'notes', filename || `${title}.pdf`)

  // 2. Extract text
  const { text, pageCount } = await pdfParser.extractText(fileBuffer)

  // 3. Create note in pending state
  const note = await Note.create({
    userId,
    title,
    fileUrl: url,
    publicId,
    subject: subject || '',
    pageCount,
    extractedText: text,
    processingStatus: 'pending'
  })

  // 4. Process background tasks
  processNoteInBackground(note, text).catch(err => {
    console.error(`Error processing note ${note._id} in background:`, err)
  })

  return note
}

async function processNoteInBackground(note, text) {
  try {
    // A. Chunks and embeddings
    const chunks = chunkText(text)
    if (chunks.length > 0) {
      const embeddings = await embedTexts(chunks, { userId: note.userId, endpoint: '/notes/upload', feature: 'pdf' })
      const chunkDocs = chunks.map((chunkText, index) => ({
        noteId: note._id,
        userId: note.userId,
        chunkIndex: index,
        text: chunkText,
        embedding: embeddings[index]
      }))
      await NoteChunk.insertMany(chunkDocs)
    }

    // B. AI Summary and Topics
    let summary = 'Standard AI study summary placeholder.'
    let topics = ['General Study']

    try {
      const summaryPrompt = `Analyze the following text from a study document. Provide a comprehensive summary of key takeaways and topics:\n\n${text.substring(0, 8000)}`
      const { text: summaryRaw } = await generateWithFallback(summaryPrompt, { userId: note.userId, endpoint: '/notes/upload', feature: 'pdf' })
      summary = summaryRaw

      const topicsPrompt = `Analyze the following text and extract 3 to 6 major topics/concepts discussed. Return ONLY a JSON array of strings containing the topics:\n\n${text.substring(0, 4000)}`
      const { text: topicsRaw } = await generateWithFallback(topicsPrompt, { userId: note.userId, endpoint: '/notes/upload', feature: 'pdf' })
      const topicsText = topicsRaw
      try {
        const cleanedText = topicsText.replace(/```json/g, '').replace(/```/g, '').trim()
        topics = JSON.parse(cleanedText)
      } catch (e) {
        topics = topicsText.split(',').map(t => t.trim()).filter(Boolean)
      }
    } catch (err) {
      console.error('Note AI processing failed, using offline fallback:', err.message)
      const commonTopics = ['Algorithms', 'Data Structures', 'React Components', 'Systems Design', 'Machine Learning']
      topics = commonTopics.filter(t => text.toLowerCase().includes(t.toLowerCase()))
      if (topics.length === 0) topics = ['General Study', 'Overview']
    }

    // C. Update note details
    note.summary = summary
    note.extractedTopics = topics
    note.chunkCount = chunks.length
    note.processingStatus = 'ready'
    await note.save()
  } catch (err) {
    note.processingStatus = 'failed'
    await note.save()
    throw err;
  }
}

exports.deleteNote = async (noteId, userId) => {
  const note = await Note.findOne({ _id: noteId, userId })
  if (!note) return null

  // Delete from Cloudinary
  if (note.publicId) {
    await fileUploader.deleteFile(note.publicId)
  }

  // Delete chunk database records
  await NoteChunk.deleteMany({ noteId })

  // Delete note
  await Note.deleteOne({ _id: noteId })
  return note
}
