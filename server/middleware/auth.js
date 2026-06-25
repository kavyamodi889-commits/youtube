// FILE: server/middleware/auth.js
const jwt  = require('jsonwebtoken')
const User = require('../models/User')

// ── protect: require valid JWT ────────────────────────────────────────────────
exports.protect = async (req, res, next) => {
  try {
    let token = req.cookies?.accessToken

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1]
    }

    // Also check global token set by frontend (fallback for upload flows)
    if (!token && req.headers['x-access-token']) {
      token = req.headers['x-access-token']
    }

    if (!token)
      return res.status(401).json({ success: false, message: 'Not authenticated' })

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
    const user    = await User.findById(decoded.id).select('-password -refreshToken')

    if (!user)
      return res.status(401).json({ success: false, message: 'User not found' })

    if (user.isBanned)
      return res.status(403).json({ success: false, message: 'Account is banned' })

    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}

// ── optionalProtect: attach user if token present, otherwise continue ─────────
exports.optionalProtect = async (req, res, next) => {
  try {
    let token = req.cookies?.accessToken

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) return next()

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
    const user    = await User.findById(decoded.id).select('-password -refreshToken')
    if (user && !user.isBanned) req.user = user
  } catch (_) {
    // ignore invalid token — just proceed unauthenticated
  }
  next()
}

// ── requireRole: restrict to specific roles ───────────────────────────────────
exports.requireRole = (...roles) => (req, res, next) => {
  if (!req.user)
    return res.status(401).json({ success: false, message: 'Not authenticated' })
  if (!roles.includes(req.user.role))
    return res.status(403).json({ success: false, message: 'Insufficient permissions' })
  next()
}
