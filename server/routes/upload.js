// FILE: server/routes/upload.js

const express     = require('express')
const router      = express.Router()
const { protect } = require('../middleware/auth')
const { uploadAvatar: avatarMiddleware, uploadBanner: bannerMiddleware } = require('../utils/cloudinary')
const { uploadAvatar, uploadBanner } = require('../controllers/Uploadcontroller')

// POST /api/upload/avatar
router.post('/avatar', protect, avatarMiddleware.single('avatar'), uploadAvatar)

// POST /api/upload/banner
router.post('/banner', protect, bannerMiddleware.single('banner'), uploadBanner)

module.exports = router