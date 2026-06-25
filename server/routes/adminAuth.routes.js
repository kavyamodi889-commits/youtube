// FILE: server/routes/adminAuth.routes.js
const express = require('express')
const { protectAdmin } = require('../middleware/adminAuth')
const {
  login, refresh, getMe, logout,
  updateTheme, updateProfile, changePassword,
} = require('../controllers/adminAuth.controller')

const router = express.Router()

// Public
router.post('/login',    login)
router.post('/refresh',  refresh)

// Protected
router.use(protectAdmin)
router.get   ('/me',       getMe)
router.post  ('/logout',   logout)
router.patch ('/theme',    updateTheme)
router.patch ('/profile',  updateProfile)
router.patch ('/password', changePassword)

module.exports = router
