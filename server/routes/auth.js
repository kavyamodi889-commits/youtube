 // FILE: server/routes/auth.js
const express  = require('express')
const passport = require('passport')
const multer   = require('multer')
const { protect } = require('../middleware/auth')
const {
  register,
  login,
  refresh,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  googleCallback,
} = require('../controllers/authcontroller')

const router = express.Router()

// ── Avatar upload — memory storage only (Cloudinary upload happens in controller) ──
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 },  // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    cb(null, allowed.includes(file.mimetype))
  },
})

// ── Local auth ────────────────────────────────────────────────────────────────
router.post('/register',        upload.single('avatar'), register)
router.post('/login',           login)
router.post('/refresh',         refresh)
router.post('/logout',          logout)
router.get ('/me',              protect, getMe)

// ── Password reset ────────────────────────────────────────────────────────────
router.post('/forgot-password', forgotPassword)
router.post('/reset-password',  resetPassword)

// ── Google OAuth ──────────────────────────────────────────────────────────────
router.get('/google', (req, res, next) => {
  const state = req.query.state || ''
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state,  // passed through to Google and back in callback query
  })(req, res, next)
})
router.get('/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/auth?error=oauth_failed`,
  }),
  googleCallback
)

module.exports = router