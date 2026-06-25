// FILE: server/routes/video.routes.js
const express = require('express')
const multer  = require('multer')
const { protect, optionalProtect } = require('../middleware/auth')
const {
  uploadVideo,
  getVideoStatus,
  recordView,
  uploadSubtitle,
  deleteSubtitle,
  autoCaption,
  getVideos,
  getVideo,
  searchVideos,
  getMyVideos,
  deleteVideo,
  saveProgress,
  getVideosByUser,
  updateVideo,
} = require('../controllers/videocontroller')

const router = express.Router()

const MAX_VIDEO_BYTES = 500 * 1024 * 1024   // 500 MB — matches client limit

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: MAX_VIDEO_BYTES },
})

const subtitleUpload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const ok = ['.srt', '.vtt'].some(ext => file.originalname.toLowerCase().endsWith(ext))
    cb(null, ok)
  },
})

// Multer error handler — turns the raw 413 into a readable JSON response
function handleMulterError(err, req, res, next) {
  if (err?.code === 'LIMIT_FILE_SIZE') {
    const mb = Math.round(MAX_VIDEO_BYTES / (1024 * 1024))
    return res.status(413).json({
      success: false,
      message: `File too large. Maximum allowed size is ${mb} MB. Please compress your video and try again.`,
    })
  }
  next(err)
}

// ── Public ────────────────────────────────────────────────────────
router.get('/',                getVideos)
router.get('/search',          searchVideos)
router.get('/user/me',         protect, getMyVideos)
router.get('/user/:userId',    getVideosByUser)
router.get('/:id',             optionalProtect, getVideo)
router.get('/:id/status',      getVideoStatus)
router.post('/:id/view',       recordView)

// ── Protected ─────────────────────────────────────────────────────
router.post('/upload',
  protect,
  upload.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]),
  handleMulterError,
  uploadVideo
)
router.patch('/:id',
  protect,
  upload.single('thumbnail'),
  handleMulterError,
  updateVideo
)
router.post('/:id/progress',                protect, saveProgress)
router.post('/:id/subtitles',               protect, subtitleUpload.single('subtitle'), uploadSubtitle)
router.delete('/:id/subtitles/:language',   protect, deleteSubtitle)
router.post('/:id/subtitles/auto',          protect, autoCaption)
router.delete('/:id',                       protect, deleteVideo)

module.exports = router