// FILE: server/routes/user.routes.js
const express    = require('express')
const multer     = require('multer')
const { protect } = require('../middleware/auth')
const {
  getHistory, removeFromHistory, clearHistory,
  getProfile, getPublicProfile, updateProfile, deleteAccount,
  getSettings, updateSettings, changePassword,
} = require('../controllers/user.controller')

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 4 * 1024 * 1024 } })
const router = express.Router()

// ── Profile ───────────────────────────────────────────────────────
router.get   ('/profile',          protect, getProfile)
router.patch ('/profile',          protect, upload.single('avatar'), updateProfile)
router.delete('/account',          protect, deleteAccount)
router.get   ('/:userId/public',            getPublicProfile)

// ── History ───────────────────────────────────────────────────────
router.get   ('/history',             protect, getHistory)
router.delete('/history',             protect, clearHistory)
router.delete('/history/:videoId',    protect, removeFromHistory)

// ── Settings ──────────────────────────────────────────────────────
router.get   ('/settings',  protect, getSettings)
router.patch ('/settings',  protect, updateSettings)
router.patch ('/password',  protect, changePassword)

module.exports = router