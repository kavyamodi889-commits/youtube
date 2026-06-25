// server/controllers/adminAuth.controller.js
const jwt       = require('jsonwebtoken')
const bcrypt    = require('bcryptjs')
const AdminUser = require('../models/AdminUser')

const ACCESS_SECRET  = () => process.env.ADMIN_JWT_ACCESS_SECRET  || process.env.JWT_ACCESS_SECRET
const REFRESH_SECRET = () => process.env.ADMIN_JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET

const signAccess  = (id) => jwt.sign({ id, type: 'admin' }, ACCESS_SECRET(),  { expiresIn: '15m' })
const signRefresh = (id) => jwt.sign({ id, type: 'admin' }, REFRESH_SECRET(), { expiresIn: '7d'  })

const COOKIE_OPTS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge:   7 * 24 * 60 * 60 * 1000,
}

// ── POST /api/admin-auth/login ────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body
    if (!identifier || !password)
      return res.status(400).json({ success: false, message: 'Email/username and password are required' })

    const isEmail = identifier.includes('@')
    const admin = await AdminUser.findOne(
      isEmail ? { email: identifier.toLowerCase() } : { username: identifier.toLowerCase() }
    ).select('+password')

    if (!admin || !admin.isActive)
      return res.status(401).json({ success: false, message: 'Invalid credentials' })

    // Use bcrypt.compare directly — no instance method needed
    const match = await bcrypt.compare(password, admin.password)
    if (!match)
      return res.status(401).json({ success: false, message: 'Invalid credentials' })

    const accessToken   = signAccess(admin._id)
    const refreshToken  = signRefresh(admin._id)
    const hashedRefresh = await bcrypt.hash(refreshToken, 8)

    // findByIdAndUpdate — never triggers pre-save hook
    await AdminUser.findByIdAndUpdate(admin._id, {
      refreshToken: hashedRefresh,
      lastLoginAt:  new Date(),
      lastLoginIp:  (req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim(),
    })

    res.cookie('adminRefreshToken', refreshToken, COOKIE_OPTS)

    return res.status(200).json({
      success:     true,
      message:     'Login successful',
      accessToken,
      admin:       admin.toSafeProfile(),
    })
  } catch (err) {
    console.error('[adminAuth] login:', err.message)
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── POST /api/admin-auth/refresh ─────────────────────────────────
exports.refresh = async (req, res) => {
  try {
    const token = req.cookies?.adminRefreshToken || req.body?.refreshToken
    if (!token)
      return res.status(401).json({ success: false, message: 'No refresh token' })

    let decoded
    try {
      decoded = jwt.verify(token, REFRESH_SECRET())
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' })
    }

    if (decoded.type !== 'admin')
      return res.status(401).json({ success: false, message: 'Invalid token type' })

    const admin = await AdminUser.findById(decoded.id).select('+refreshToken')
    if (!admin || !admin.isActive || !admin.refreshToken)
      return res.status(401).json({ success: false, message: 'Session expired' })

    const valid = await bcrypt.compare(token, admin.refreshToken)
    if (!valid)
      return res.status(401).json({ success: false, message: 'Session expired' })

    const newAccessToken  = signAccess(admin._id)
    const newRefreshToken = signRefresh(admin._id)
    const hashedRefresh   = await bcrypt.hash(newRefreshToken, 8)

    await AdminUser.findByIdAndUpdate(admin._id, { refreshToken: hashedRefresh })
    res.cookie('adminRefreshToken', newRefreshToken, COOKIE_OPTS)

    return res.status(200).json({ success: true, accessToken: newAccessToken })
  } catch (err) {
    console.error('[adminAuth] refresh:', err.message)
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── GET /api/admin-auth/me ────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const admin = await AdminUser.findById(req.adminUser._id)
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' })
    res.json({ success: true, admin: admin.toSafeProfile() })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── POST /api/admin-auth/logout ───────────────────────────────────
exports.logout = async (req, res) => {
  try {
    if (req.adminUser?._id)
      await AdminUser.findByIdAndUpdate(req.adminUser._id, { refreshToken: null })
    res.clearCookie('adminRefreshToken')
    res.json({ success: true, message: 'Logged out' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── PATCH /api/admin-auth/theme ───────────────────────────────────
exports.updateTheme = async (req, res) => {
  try {
    const { theme } = req.body
    if (!['dark', 'light'].includes(theme))
      return res.status(400).json({ success: false, message: 'Invalid theme' })
    await AdminUser.findByIdAndUpdate(req.adminUser._id, { theme })
    res.json({ success: true, theme })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── PATCH /api/admin-auth/profile ────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { displayName, avatar } = req.body
    const updates = {}
    if (displayName !== undefined) updates.displayName = displayName
    if (avatar      !== undefined) updates.avatar      = avatar
    const admin = await AdminUser.findByIdAndUpdate(req.adminUser._id, updates, { new: true })
    res.json({ success: true, admin: admin.toSafeProfile() })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── PATCH /api/admin-auth/password ───────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: 'Both passwords required' })
    if (newPassword.length < 8)
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' })

    const admin = await AdminUser.findById(req.adminUser._id).select('+password')
    const match = await bcrypt.compare(currentPassword, admin.password)
    if (!match)
      return res.status(401).json({ success: false, message: 'Current password is incorrect' })

    const hashed = await bcrypt.hash(newPassword, 12)
    await AdminUser.findByIdAndUpdate(req.adminUser._id, { password: hashed })

    res.json({ success: true, message: 'Password changed' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}