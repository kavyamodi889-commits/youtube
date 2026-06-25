// FILE: server/routes/download.routes.js
const express = require('express')
const { protect } = require('../middleware/auth')
const {
  addDownload,
  removeDownload,
  getDownloads,
  clearDownloads,
  getDownloadState,
} = require('../controllers/downloadController')

const router = express.Router()

router.get('/',                  protect, getDownloads)
router.delete('/',               protect, clearDownloads)
router.get('/state/:videoId',    protect, getDownloadState)
router.post('/:videoId',         protect, addDownload)
router.delete('/:videoId',       protect, removeDownload)

module.exports = router