// FILE: server/utils/cloudinary.js
const cloudinary = require('cloudinary').v2
const multer     = require('multer')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Memory storage — buffer is sent to Cloudinary inside the controller
const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    cb(null, ok.includes(file.mimetype))
  },
})

const uploadBanner = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    cb(null, ok.includes(file.mimetype))
  },
})

module.exports = { cloudinary, uploadAvatar, uploadBanner }