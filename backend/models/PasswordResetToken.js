const mongoose = require('mongoose')

const passwordResetTokenSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  token_hash: {
    type: String,
    required: true,
    unique: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  expires_at: {
    type: Date,
    required: true,
  },
  used_at: {
    type: Date,
    default: null,
  },
})

module.exports = mongoose.model('PasswordResetToken', passwordResetTokenSchema)
