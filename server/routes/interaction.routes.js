// FILE: server/routes/interaction.routes.js
const express = require('express')
const { protect } = require('../middleware/auth')
const {
  getState,
  toggleLike,
  toggleDislike,
  toggleSave,
  toggleWatchLater,
  toggleSubscribe,
  getChannelState,
  getComments,
  addComment,
  deleteComment,
  getReplies,
  likeComment,
  reportComment,
  shareVideo,
  getWatchLater,
  getLikedVideos,
  getSubscriptionFeed,
  notInterested,
  hideChannel,
  reportVideo,
} = require('../controllers/interactionController')

const router = express.Router()

// ── Lists (auth required) ─────────────────────────────────────────
router.get('/watch-later',    protect, getWatchLater)
router.get('/liked',          protect, getLikedVideos)
router.get('/subscriptions',  protect, getSubscriptionFeed)

// ── Per-video state ───────────────────────────────────────────────
router.get('/:videoId',               protect, getState)
router.post('/:videoId/like',         protect, toggleLike)
router.post('/:videoId/dislike',      protect, toggleDislike)
router.post('/:videoId/save',         protect, toggleSave)
router.post('/:videoId/watch-later',  protect, toggleWatchLater)
router.post('/:videoId/share',        shareVideo)
router.post('/:videoId/not-interested', protect, notInterested)
router.post('/:videoId/report',       protect, reportVideo)

// ── Comments ──────────────────────────────────────────────────────
router.get('/:videoId/comments',                                    getComments)
router.post('/:videoId/comments',                          protect, addComment)
router.delete('/:videoId/comments/:commentId',             protect, deleteComment)
router.get('/:videoId/comments/:commentId/replies',                 getReplies)
router.post('/:videoId/comments/:commentId/like',          protect, likeComment)
router.post('/:videoId/comments/:commentId/report',        protect, reportComment)

// ── Subscribe / Channel ───────────────────────────────────────────
router.post('/channel/:channelId/subscribe', protect, toggleSubscribe)
router.get('/channel/:channelId/state',      protect, getChannelState)
router.post('/channel/:channelId/hide',      protect, hideChannel)

module.exports = router