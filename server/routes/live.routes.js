// FILE: server/routes/live.routes.js
const express = require('express')
const multer  = require('multer')
const { protect, optionalProtect } = require('../middleware/auth')
const {
  createStream,
  endStream,
  getLiveStreams,
  getStream,
  getMyStreams,
  getChannelStreams,
  getMobileToken,
  getChatHistory,
  saveAsVideo,
  updateThumbnail,
  getVodChat,
  toggleLike,
  reportStream,
  getInteractions,
} = require('../controllers/liveController')

const router = express.Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 },
})
const thumbUpload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 2 * 1024 * 1024 },
})

router.get('/',                        getLiveStreams)
router.get('/channel/:channelId',      getChannelStreams)
router.get('/user/me',                 protect, getMyStreams)
router.get('/:id',                     optionalProtect, getStream)
router.post('/',                       protect, upload.single('thumbnail'), createStream)
router.post('/:id/end',                protect, endStream)
router.get('/:id/mobile-token',        protect, getMobileToken)
router.get('/:id/chat',                getChatHistory)
router.post('/:id/save-as-video',      protect, saveAsVideo)
router.post('/:id/thumbnail',          protect, thumbUpload.single('thumbnail'), updateThumbnail)
router.get ('/:id/vod-chat',            getVodChat)
router.post('/:id/like',               optionalProtect, toggleLike)
router.post('/:id/report',             optionalProtect, reportStream)
router.get ('/:id/interactions',        optionalProtect, getInteractions)

module.exports = router