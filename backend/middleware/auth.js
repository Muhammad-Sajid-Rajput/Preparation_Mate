const jwt = require('jsonwebtoken')
const User = require('../models/User')

const verifyToken = async (req, res, next) => {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer '))
      return res.status(401).json({ success: false, error: 'No token provided' })

    const token = header.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET)

    const user = await User.findById(decoded._id).select('-passwordHash -refreshTokenHash')
    if (!user)
      return res.status(401).json({ success: false, error: 'User not found' })

    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' })
  }
}

const requireRole = (role) => (req, res, next) => {
  if (req.user?.role !== role)
    return res.status(403).json({ success: false, error: 'Forbidden' })
  next()
}

module.exports = { verifyToken, requireRole }
