require('dotenv').config()
const app = require('./app')
const connectDB = require('./config/db')
const cron = require('node-cron')
const resetQuotas = require('./jobs/resetQuotas')
const checkStreaks = require('./jobs/checkStreaks')

const PORT = process.env.PORT || 5000

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })

  // Daily quota reset at 00:00 UTC
  cron.schedule('0 0 * * *', resetQuotas)

  // Streak check at 23:00 UTC
  cron.schedule('0 23 * * *', checkStreaks)
})
