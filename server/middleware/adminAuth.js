// FILE: server/middleware/adminAuth.js
// Separate protect middleware for AdminUser collection.
// Reads "adminRefreshToken" cookie and "Authorization: Bearer" header.
// Completely independent from the regular User auth middleware.

const jwt       = require('jsonwebtoken')
const AdminUser = require('../models/AdminUser')

const ACCESS_SECRET = () => process.env.ADMIN_JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET

// ── protectAdmin: require valid admin JWT ─────────────────────────
exports.protectAdmin = async (req, res, next) => {
  try {
    let token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : req.cookies?.adminAccessToken || req.headers['x-admin-token']

    if (!token)
      return res.status(401).json({ success: false, message: 'Not authenticated' })

    let decoded
    try {
      decoded = jwt.verify(token, ACCESS_SECRET())
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' })
    }

    // Token must be admin-type
    if (decoded.type !== 'admin')
      return res.status(403).json({ success: false, message: 'Not an admin token' })

    const admin = await AdminUser.findById(decoded.id)
    if (!admin)
      return res.status(401).json({ success: false, message: 'Admin account not found' })

    if (!admin.isActive)
      return res.status(403).json({ success: false, message: 'Admin account is deactivated' })

    req.adminUser = admin
    next()
  } catch (err) {
    console.error('[adminAuth middleware]', err.message)
    return res.status(401).json({ success: false, message: 'Authentication failed' })
  }
}

// ── requireAdminRole: restrict to specific admin roles ────────────
exports.requireAdminRole = (...roles) => (req, res, next) => {
  if (!req.adminUser)
    return res.status(401).json({ success: false, message: 'Not authenticated' })
  if (!roles.includes(req.adminUser.role))
    return res.status(403).json({ success: false, message: `Requires role: ${roles.join(' or ')}` })
  next()
}

// ── requirePermission: check granular permissions ─────────────────
exports.requirePermission = (perm) => (req, res, next) => {
  if (!req.adminUser)
    return res.status(401).json({ success: false, message: 'Not authenticated' })

  // Admins always have all permissions
  if (req.adminUser.role === 'admin') return next()

  if (!req.adminUser.permissions?.[perm])
    return res.status(403).json({ success: false, message: `Missing permission: ${perm}` })

  next()
}
