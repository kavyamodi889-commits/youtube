// FILE: server/routes/recommendation.routes.js
const express  = require('express')
const router   = express.Router()
const { optionalProtect: optionalAuth } = require('../middleware/auth')
const reco     = require('../services/recommendation.service')

// All routes are public; optionalAuth attaches req.user if a valid token is present

/**
 * GET /api/recommendations/feed
 * Home page feed — blended collaborative + content + trending.
 * Query: limit, page, category
 */
router.get('/feed', optionalAuth, async (req, res, next) => {
  try {
    const limit    = Math.min(parseInt(req.query.limit)    || 20, 50)
    const page     = Math.max(parseInt(req.query.page)     || 1, 1)
    const category = req.query.category || null
    const userId   = req.user?._id?.toString() || null

    const results = await reco.getFeed(userId, { limit, page, category })
    res.json({ success: true, results, count: results.length })
  } catch (err) {
    next(err)
  }
})

/**
 * GET /api/recommendations/next/:videoId
 * "Up next" panel on the watch page — content-based on the current video.
 * Query: limit
 */
router.get('/next/:videoId', optionalAuth, async (req, res, next) => {
  try {
    const { videoId } = req.params
    const limit       = Math.min(parseInt(req.query.limit) || 15, 30)
    const userId      = req.user?._id?.toString() || null

    const results = await reco.getNext(videoId, userId, limit)
    res.json({ success: true, results, count: results.length })
  } catch (err) {
    next(err)
  }
})

/**
 * POST /api/recommendations/shorts/next
 * Next shorts for the Shorts page.
 * Body: { currentShortId, limit }
 */
router.post('/shorts/next', optionalAuth, async (req, res, next) => {
  try {
    const { currentShortId, limit = 20 } = req.body
    if (!currentShortId) return res.status(400).json({ success: false, message: 'currentShortId required' })
    const userId  = req.user?._id?.toString() || null
    const results = await reco.getShortsNext(currentShortId, userId, Math.min(limit, 30))
    res.json({ success: true, results, count: results.length })
  } catch (err) {
    next(err)
  }
})

/**
 * GET /api/recommendations/trending
 * Global trending — no auth needed.
 * Query: limit, page, category
 */
router.get('/trending', async (req, res, next) => {
  try {
    const limit    = Math.min(parseInt(req.query.limit)    || 20, 50)
    const page     = Math.max(parseInt(req.query.page)     || 1, 1)
    const category = req.query.category || null

    const results = await reco.getTrending({ limit, page, category })
    res.json({ success: true, results, count: results.length })
  } catch (err) {
    next(err)
  }
})

module.exports = router