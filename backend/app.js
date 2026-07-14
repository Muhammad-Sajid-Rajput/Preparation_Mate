const express      = require('express')
const helmet       = require('helmet')
const cors         = require('cors')
const morgan       = require('morgan')
const cookieParser = require('cookie-parser')
const mongoose     = require('mongoose')
const errorHandler = require('./middleware/errorHandler')

const authRoutes      = require('./routes/auth')
const userRoutes      = require('./routes/users')
const notesRoutes     = require('./routes/notes')
const quizzesRoutes   = require('./routes/quizzes')
const chatRoutes      = require('./routes/chat')
const plannerRoutes   = require('./routes/planner')
const gapsRoutes      = require('./routes/gaps')
const interviewRoutes = require('./routes/interview')
const resumeRoutes    = require('./routes/resume')
const adminRoutes     = require('./routes/admin')

const app = express()

app.use(helmet())
app.use(cors({
  origin:      process.env.CLIENT_URL,
  credentials: true,
}))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())

app.use('/api/auth',      authRoutes)
app.use('/api/users',     userRoutes)
app.use('/api/notes',     notesRoutes)
app.use('/api/quizzes',   quizzesRoutes)
app.use('/api/chat',      chatRoutes)
app.use('/api/planner',   plannerRoutes)
app.use('/api/gaps',      gapsRoutes)
app.use('/api/career/interview', interviewRoutes)
app.use('/api/career/resume',    resumeRoutes)
app.use('/api/admin',     adminRoutes)

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  })
})

app.use(errorHandler)

module.exports = app
