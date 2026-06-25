// FILE: server/controllers/authController.js
const bcrypt     = require('bcryptjs')
const jwt        = require('jsonwebtoken')
const crypto     = require('crypto')
const cloudinary = require('cloudinary').v2
const User       = require('../models/User')
const {
  sendWelcomeEmail,
  sendLoginAlertEmail,
  sendPasswordResetEmail,
} = require('../utils/mailer')

// ── Cloudinary config ─────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// ── Upload buffer → Cloudinary (works with any cloudinary version) ─────────────
function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder:         'aura/avatars',
        transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
      },
      (err, result) => {
        if (err) return reject(err)
        resolve(result)
      }
    )
    stream.end(buffer)
  })
}

// ── JWT helpers ───────────────────────────────────────────────────────────────
const signAccess  = (id) => jwt.sign({ id }, process.env.JWT_ACCESS_SECRET,  { expiresIn: '15m' })
const signRefresh = (id) => jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d'  })

const COOKIE_OPTS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'lax',    // 'strict' blocked the cookie after Google OAuth redirect
  maxAge:   7 * 24 * 60 * 60 * 1000,
}

// ── Register ──────────────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { username, email, password, displayName, dob, gender, country, interests, role } = req.body

    if (!username || !email || !password)
      return res.status(400).json({ message: 'Username, email and password are required' })

    const existing = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username }] })
    if (existing) {
      const field = existing.email === email.toLowerCase() ? 'Email' : 'Username'
      return res.status(409).json({ message: `${field} is already taken` })
    }

    const hashed = await bcrypt.hash(password, 12)

    // Upload avatar buffer to Cloudinary if present
    let avatar = '', avatarPublicId = ''
    if (req.file?.buffer) {
      try {
        const result  = await uploadToCloudinary(req.file.buffer)
        avatar        = result.secure_url
        avatarPublicId = result.public_id
      } catch (err) {
        console.error('[register] avatar upload failed:', err.message)
        // non-fatal — proceed without avatar
      }
    }

    let parsedInterests = []
    try {
      parsedInterests = Array.isArray(interests)
        ? interests
        : JSON.parse(interests || '[]')
    } catch { parsedInterests = [] }

    const user = await User.create({
      username,
      email:        email.toLowerCase(),
      password:     hashed,
      displayName:  displayName || username,
      avatar,
      avatarPublicId,
      handle:       username.toLowerCase(),
      dob:          dob    || null,
      gender:       gender || '',
      location:     country || '',
      interests:    parsedInterests,
      role:         'user',
      authProvider: 'local',
    })

    const accessToken  = signAccess(user._id)
    const refreshToken = signRefresh(user._id)
    const hashedRefresh = await bcrypt.hash(refreshToken, 8)
    await User.updateOne({ _id: user._id }, { $set: { refreshToken: hashedRefresh } })

    // Welcome email — fire and forget
    sendWelcomeEmail({ to: user.email, displayName: user.displayName || user.username })
      .catch(err => console.error('[mailer] welcome:', err.message))

    res.cookie('refreshToken', refreshToken, COOKIE_OPTS)
    return res.status(201).json({ message: 'Account created', accessToken, user: user.toPublicProfile() })
  } catch (err) {
    console.error('[register]', err)
    return res.status(500).json({ message: 'Server error during registration' })
  }
}

// ── Login ─────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { identifier, password } = req.body

    if (!identifier || !password)
      return res.status(400).json({ message: 'Email/username and password are required' })

    const isEmail = identifier.includes('@')
    const user    = await User.findOne(
      isEmail ? { email: identifier.toLowerCase() } : { username: identifier }
    )

    if (!user || !user.password)
      return res.status(401).json({ message: 'Invalid credentials' })

    const match = await bcrypt.compare(password, user.password)
    if (!match)
      return res.status(401).json({ message: 'Invalid credentials' })

    const accessToken  = signAccess(user._id)
    const refreshToken = signRefresh(user._id)
    const hashedRefresh = await bcrypt.hash(refreshToken, 8)
    await User.updateOne({ _id: user._id }, { $set: { refreshToken: hashedRefresh } })

    // Login alert email — fire and forget
    const ip        = (req.headers['x-forwarded-for'] || req.ip || 'Unknown').split(',')[0].trim()
    const userAgent = req.headers['user-agent'] || 'Unknown'
    const time      = new Date().toLocaleString('en-US', {
      timeZone: 'UTC', dateStyle: 'full', timeStyle: 'short',
    }) + ' UTC'

    sendLoginAlertEmail({ to: user.email, displayName: user.displayName || user.username, ip, userAgent, time })
      .catch(err => console.error('[mailer] login alert:', err.message))

    res.cookie('refreshToken', refreshToken, COOKIE_OPTS)
    return res.status(200).json({ message: 'Login successful', accessToken, user: user.toPublicProfile() })
  } catch (err) {
    console.error('[login]', err)
    return res.status(500).json({ message: 'Server error during login' })
  }
}

// ── Refresh ───────────────────────────────────────────────────────────────────
const refresh = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken
    if (!token) return res.status(401).json({ message: 'No refresh token' })

    let payload
    try { payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET) }
    catch { return res.status(401).json({ message: 'Invalid or expired refresh token' }) }

    const user = await User.findById(payload.id)
    if (!user?.refreshToken) return res.status(401).json({ message: 'Session expired' })

    const valid = await bcrypt.compare(token, user.refreshToken)
    if (!valid) return res.status(401).json({ message: 'Refresh token mismatch' })

    const newAccess  = signAccess(user._id)
    const newRefresh = signRefresh(user._id)
    const hashedRefresh = await bcrypt.hash(newRefresh, 8)

    // Use findByIdAndUpdate to avoid Mongoose VersionError on concurrent refreshes
    await User.findByIdAndUpdate(user._id, { refreshToken: hashedRefresh })

    res.cookie('refreshToken', newRefresh, COOKIE_OPTS)
    return res.status(200).json({ accessToken: newAccess })
  } catch (err) {
    console.error('[refresh]', err)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ── Logout ────────────────────────────────────────────────────────────────────
const logout = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken
    if (token) {
      const payload = jwt.decode(token)
      if (payload?.id) await User.findByIdAndUpdate(payload.id, { refreshToken: null })
    }
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })
    return res.status(200).json({ message: 'Logged out' })
  } catch (err) {
    console.error('[logout]', err)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ── Get Me ────────────────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    // Re-fetch the full document — req.user from protect middleware
    // uses .select() which strips Mongoose instance methods like toSafeObject()
    const user = await User.findById(req.user._id || req.user.id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    return res.status(200).json({ user: user.toPublicProfile() })
  } catch (err) {
    console.error('[getMe] error:', err.message)
    return res.status(500).json({ message: 'Server error', detail: err.message })
  }
}

// ── Forgot Password ───────────────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ message: 'Email is required' })

    const SAFE = 'If that email is registered, a reset link has been sent.'

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user || user.authProvider === 'google')
      return res.status(200).json({ message: SAFE })

    const rawToken  = crypto.randomBytes(32).toString('hex')
    const hashed    = crypto.createHash('sha256').update(rawToken).digest('hex')

    await User.updateOne(
      { _id: user._id },
      { $set: {
        passwordResetToken:   hashed,
        passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000),
      }}
    )

    await sendPasswordResetEmail({
      to:          user.email,
      displayName: user.displayName || user.username,
      resetToken:  rawToken,
    })

    return res.status(200).json({ message: SAFE })
  } catch (err) {
    console.error('[forgotPassword]', err)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ── Reset Password ────────────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body

    if (!token || !password)
      return res.status(400).json({ message: 'Token and password are required' })
    if (password.length < 8)
      return res.status(400).json({ message: 'Password must be at least 8 characters' })

    const hashed = crypto.createHash('sha256').update(token).digest('hex')

    const user = await User.findOne({
      passwordResetToken:   hashed,
      passwordResetExpires: { $gt: new Date() },
    })

    if (!user)
      return res.status(400).json({ message: 'Reset link is invalid or has expired' })

    const newHashed = await bcrypt.hash(password, 12)
    await User.updateOne(
      { _id: user._id },
      { $set: {
        password:             newHashed,
        passwordResetToken:   null,
        passwordResetExpires: null,
        refreshToken:         null,
      }}
    )

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })
    return res.status(200).json({ message: 'Password reset successfully. Please sign in.' })
  } catch (err) {
    console.error('[resetPassword]', err)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ── Google OAuth callback ─────────────────────────────────────────────────────
const googleCallback = async (req, res) => {
  try {
    const user         = req.user
    const accessToken  = signAccess(user._id)
    const refreshToken = signRefresh(user._id)
    const hashedRefresh = await bcrypt.hash(refreshToken, 8)
    await User.updateOne({ _id: user._id }, { $set: { refreshToken: hashedRefresh } })

    // Login alert email — fire and forget
    const ip        = (req.headers['x-forwarded-for'] || req.ip || 'Unknown').split(',')[0].trim()
    const userAgent = req.headers['user-agent'] || 'Unknown'
    const time      = new Date().toLocaleString('en-US', {
      timeZone: 'UTC', dateStyle: 'full', timeStyle: 'short',
    }) + ' UTC'
    sendLoginAlertEmail({ to: user.email, displayName: user.displayName || user.username, ip, userAgent, time })
      .catch(err => console.error('[mailer] google login alert:', err.message))

    res.cookie('refreshToken', refreshToken, COOKIE_OPTS)

    // If the OAuth was triggered from Studio, redirect back to Studio
    // Studio then calls /auth/refresh using the cookie to get the access token
    const state = req.query.state || ''
    if (state === 'studio') {
      return res.redirect('http://localhost:5174')
    }

    // Default — redirect to client with access token in URL
    return res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${accessToken}`)
  } catch (err) {
    console.error('[googleCallback]', err)
    return res.redirect(`${process.env.CLIENT_URL}/auth?error=oauth_failed`)
  }
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  googleCallback,
}