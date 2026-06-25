// FILE: server/routes/playlist.routes.js
const express  = require('express')
const { protect, optionalProtect } = require('../middleware/auth')
const {
  getMyPlaylists,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addVideo,
  removeVideo,
  getVideoPlaylistState,
  getPlaylistById,
  getChannelPlaylists,
} = require('../controllers/playlist.controller')

const router = express.Router()

router.get('/',                          protect, getMyPlaylists)
router.get('/channel/:channelId',        optionalProtect, getChannelPlaylists)
router.get('/video-state/:videoId',      protect, getVideoPlaylistState)
router.get('/:id/details',               optionalProtect, getPlaylistById)
router.post('/',                         protect, createPlaylist)
router.patch('/:id',                     protect, updatePlaylist)
router.delete('/:id',                    protect, deletePlaylist)
router.post('/:id/videos',               protect, addVideo)
router.delete('/:id/videos/:videoId',    protect, removeVideo)

module.exports = router