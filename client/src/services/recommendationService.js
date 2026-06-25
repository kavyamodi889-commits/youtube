// FILE: client/src/services/recommendationService.js
//
// All recommendation calls go through here.
// Every function falls back gracefully if the Python service or Node proxy is down.

import api from './api'

/**
 * Home feed — personalised for logged-in users, trending for guests.
 * Signals used server-side: watch history, likes, dislikes, saves,
 * downloads, watch-later, subscriptions, shared, not-interested,
 * hidden channels, collaborative filtering, content-based TF-IDF.
 * @param {object} opts  { limit, page, category }
 */
export async function getFeed({ limit = 30, page = 1, category = null } = {}) {
  try {
    const params = new URLSearchParams({ limit, page })
    if (category && category !== 'All') params.set('category', category)
    const res = await api.get(`/recommendations/feed?${params}`)
    return res.data.results || []
  } catch {
    // Fallback: generic video list
    const params = new URLSearchParams({ limit })
    if (category && category !== 'All') params.set('category', category)
    const res = await api.get(`/videos?${params}`)
    return res.data.videos || res.data.data?.videos || []
  }
}

/**
 * Watch page "Up next" sidebar — content-based on current video + user signals.
 * @param {string} videoId   currently playing video id
 * @param {number} limit
 */
export async function getNext(videoId, limit = 20) {
  try {
    const res = await api.get(`/recommendations/next/${videoId}?limit=${limit}`)
    return res.data.results || []
  } catch {
    // Fallback: videos in the same category (server does this)
    const res = await api.get(`/videos?limit=${limit + 1}`)
    const all = res.data.videos || res.data.data?.videos || []
    return all.filter(v => v._id !== videoId && !v.isShort).slice(0, limit)
  }
}

/**
 * Shorts page — next shorts to auto-play after the current short.
 * @param {string} currentShortId  currently playing short id
 * @param {number} limit
 */
export async function getShortsNext(currentShortId, limit = 20) {
  try {
    const res = await api.post('/recommendations/shorts/next', {
      currentShortId,
      limit,
    })
    return res.data.results || []
  } catch {
    // Fallback: fetch all shorts, exclude current
    const res = await api.get(`/videos?isShort=true&limit=${limit + 5}`)
    const all = res.data.videos || res.data.data?.videos || []
    return all.filter(v => v.isShort && v._id !== currentShortId).slice(0, limit)
  }
}

/**
 * Global trending — no auth required.
 * @param {object} opts  { limit, page, category }
 */
export async function getTrending({ limit = 20, page = 1, category = null } = {}) {
  try {
    const params = new URLSearchParams({ limit, page })
    if (category && category !== 'All') params.set('category', category)
    const res = await api.get(`/recommendations/trending?${params}`)
    return res.data.results || []
  } catch {
    const params = new URLSearchParams({ limit, sort: 'views' })
    if (category && category !== 'All') params.set('category', category)
    const res = await api.get(`/videos?${params}`)
    return res.data.videos || res.data.data?.videos || []
  }
}