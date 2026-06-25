// FILE: server/services/recommendation.service.js
// Thin HTTP proxy from Node → Python recommendation microservice.
// Falls back to a MongoDB-only trending query if the Python service is down.

const RECO_URL = process.env.RECO_SERVICE_URL || 'http://localhost:8000'

async function _post(path, body) {
  const res = await fetch(`${RECO_URL}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
    signal:  AbortSignal.timeout(5000),   // 5s timeout
  })
  if (!res.ok) throw new Error(`Reco service ${res.status}`)
  return res.json()
}

async function _get(path, params = {}) {
  const qs  = new URLSearchParams(params).toString()
  const res = await fetch(`${RECO_URL}${path}?${qs}`, {
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) throw new Error(`Reco service ${res.status}`)
  return res.json()
}

// ── Fallback: pure-Mongo trending (no Python dep) ─────────────────
async function _mongoTrending(limit = 20, page = 1, category = null) {
  const Video  = require('../models/Video')
  const skip   = (page - 1) * limit
  const match  = { status: 'published', visibility: 'public' }
  if (category) match.category = category

  const videos = await Video.find(match)
    .populate('uploader', 'displayName handle avatar')
    .sort({ viewCount: -1, likeCount: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

  return videos.map(v => ({
    ...v,
    _id:    v._id.toString(),
    source: 'trending',
    score:  0,
  }))
}

// ── Public API ────────────────────────────────────────────────────

/**
 * Home feed — blended collaborative + content + trending.
 * @param {string|null} userId
 * @param {object} opts  { limit, page, category }
 */
async function getFeed(userId, { limit = 20, page = 1, category = null } = {}) {
  try {
    const data = await _post('/recommend', { userId, limit, page, category })
    return data.results || []
  } catch (err) {
    console.warn('[Reco] getFeed fallback:', err.message)
    return _mongoTrending(limit, page, category)
  }
}

/**
 * "Up next" sidebar for the watch page.
 * @param {string}      videoId   currently playing video
 * @param {string|null} userId
 * @param {number}      limit
 */
async function getNext(videoId, userId, limit = 15) {
  try {
    const data = await _post('/recommend/next', { videoId, userId, limit })
    return data.results || []
  } catch (err) {
    console.warn('[Reco] getNext fallback:', err.message)
    // Fall back: videos in the same category
    const Video = require('../models/Video')
    const seed  = await Video.findById(videoId).lean()
    if (!seed) return _mongoTrending(limit)
    return _mongoTrending(limit, 1, seed.category)
  }
}

/**
 * Global trending — no auth required.
 */
async function getTrending({ limit = 20, page = 1, category = null } = {}) {
  try {
    const params = { limit, page }
    if (category) params.category = category
    const data = await _get('/recommend/trending', params)
    return data.results || []
  } catch (err) {
    console.warn('[Reco] getTrending fallback:', err.message)
    return _mongoTrending(limit, page, category)
  }
}

/**
 * Next shorts for the Shorts page.
 * @param {string}      currentShortId  currently playing short
 * @param {string|null} userId
 * @param {number}      limit
 */
async function getShortsNext(currentShortId, userId, limit = 20) {
  try {
    const data = await _post('/recommend/shorts/next', { currentShortId, userId, limit })
    return data.results || []
  } catch (err) {
    console.warn('[Reco] getShortsNext fallback:', err.message)
    const Video = require('../models/Video')
    const seed  = await Video.findById(currentShortId).lean()
    const match = { isShort: true, status: 'published', visibility: 'public', _id: { $ne: seed?._id } }
    if (seed?.category) match.category = seed.category
    return Video.find(match)
      .populate('uploader', 'displayName handle avatar')
      .sort({ viewCount: -1 })
      .limit(limit)
      .lean()
  }
}

module.exports = { getFeed, getNext, getShortsNext, getTrending }