// FILE: client/src/utils/downloadsStore.js
// IndexedDB-backed offline video store
// Stores video Blobs + metadata so videos can be watched without internet.
// Quota: 3 GB total, 30-day expiry per video.

const DB_NAME    = 'aura-downloads'
const DB_VERSION = 1
const META_STORE = 'meta'    // video metadata (title, thumbnail, channel, etc.)
const BLOB_STORE = 'blobs'   // actual video bytes as Blob

// ── Open DB ──────────────────────────────────────────────────────────────────
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(META_STORE))
        db.createObjectStore(META_STORE, { keyPath: '_id' })
      if (!db.objectStoreNames.contains(BLOB_STORE))
        db.createObjectStore(BLOB_STORE, { keyPath: '_id' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror   = () => reject(req.error)
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function tx(db, stores, mode, fn) {
  return new Promise((resolve, reject) => {
    const t  = db.transaction(stores, mode)
    t.onerror = () => reject(t.error)
    resolve(fn(t))
  })
}

function idbGet(store, key) {
  return new Promise((resolve, reject) => {
    const req = store.get(key)
    req.onsuccess = () => resolve(req.result)
    req.onerror   = () => reject(req.error)
  })
}

function idbPut(store, value) {
  return new Promise((resolve, reject) => {
    const req = store.put(value)
    req.onsuccess = () => resolve(req.result)
    req.onerror   = () => reject(req.error)
  })
}

function idbDelete(store, key) {
  return new Promise((resolve, reject) => {
    const req = store.delete(key)
    req.onsuccess = () => resolve()
    req.onerror   = () => reject(req.error)
  })
}

function idbGetAll(store) {
  return new Promise((resolve, reject) => {
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror   = () => reject(req.error)
  })
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Save a video for offline viewing.
 * Fetches the video bytes, stores them as a Blob in IndexedDB.
 * @param {object} videoMeta  - { _id, title, videoUrl, thumbnailUrl, duration, uploader, … }
 * @param {function} onProgress - (pct: 0–100) callback
 * @returns {Promise<object>} saved metadata record
 */
export async function saveDownload(videoMeta, onProgress) {
  const db = await openDB()

  // ── Check storage limit before fetching ──
  const existingMeta = await getAllDownloads()
  const LIMIT_BYTES  = 3 * 1024 * 1024 * 1024 // 3 GB

  // Evict expired entries first
  await evictExpired()

  // Re-check after eviction
  const freshMeta   = await getAllDownloads()
  const usedBytes   = freshMeta.reduce((a, m) => a + (m.sizeBytes || 0), 0)
  if (usedBytes >= LIMIT_BYTES)
    throw new Error('Storage full. Remove some downloads to free space.')

  // ── Fetch video bytes ──
  const response = await fetch(videoMeta.videoUrl)
  if (!response.ok) throw new Error('Failed to fetch video')

  const contentLength = parseInt(response.headers.get('content-length') || '0')
  const reader   = response.body.getReader()
  const chunks   = []
  let received   = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    received += value.length
    if (contentLength > 0 && onProgress)
      onProgress(Math.round((received / contentLength) * 100))
  }

  if (onProgress) onProgress(100)

  const blob      = new Blob(chunks, { type: 'video/mp4' })
  const sizeBytes = blob.size

  // Check size won't exceed limit
  if (usedBytes + sizeBytes > LIMIT_BYTES)
    throw new Error('Not enough space. Remove some downloads first.')

  // ── Build metadata record ──
  const now      = Date.now()
  const THIRTY_D = 30 * 24 * 60 * 60 * 1000
  const meta = {
    _id:          videoMeta._id,
    title:        videoMeta.title         || 'Untitled',
    thumbnailUrl: videoMeta.thumbnailUrl  || videoMeta.thumbnail || '',
    duration:     videoMeta.duration      || 0,
    channel: {
      _id:    videoMeta.uploader?._id    || videoMeta.channel?._id    || '',
      name:   videoMeta.uploader?.displayName || videoMeta.uploader?.username || videoMeta.channel?.name || 'Unknown',
      avatar: videoMeta.uploader?.avatar || videoMeta.channel?.avatar || '',
      verified: videoMeta.uploader?.isChannelVerified || false,
    },
    sizeBytes,
    sizeMb:       parseFloat((sizeBytes / (1024 * 1024)).toFixed(1)),
    quality:      '720p',
    downloadedAt: now,
    expiresAt:    now + THIRTY_D,
  }

  // ── Write to IndexedDB ──
  const t = db.transaction([META_STORE, BLOB_STORE], 'readwrite')
  await Promise.all([
    idbPut(t.objectStore(META_STORE), meta),
    idbPut(t.objectStore(BLOB_STORE), { _id: videoMeta._id, blob }),
  ])

  return meta
}

/**
 * Get all download metadata records (does NOT load blobs).
 */
export async function getAllDownloads() {
  const db   = await openDB()
  const t    = db.transaction(META_STORE, 'readonly')
  const meta = await idbGetAll(t.objectStore(META_STORE))
  // Sort newest first
  return meta.sort((a, b) => b.downloadedAt - a.downloadedAt)
}

/**
 * Get a Blob URL for a stored video so the <video> tag can play it offline.
 */
export async function getOfflineVideoUrl(id) {
  const db  = await openDB()
  const t   = db.transaction(BLOB_STORE, 'readonly')
  const rec = await idbGet(t.objectStore(BLOB_STORE), id)
  if (!rec?.blob) return null
  return URL.createObjectURL(rec.blob)
}

/**
 * Check if a video is already downloaded.
 */
export async function isDownloaded(id) {
  const db  = await openDB()
  const t   = db.transaction(META_STORE, 'readonly')
  const rec = await idbGet(t.objectStore(META_STORE), id)
  return !!rec
}

/**
 * Remove a single download (meta + blob).
 */
export async function removeDownload(id) {
  const db = await openDB()
  const t  = db.transaction([META_STORE, BLOB_STORE], 'readwrite')
  await Promise.all([
    idbDelete(t.objectStore(META_STORE), id),
    idbDelete(t.objectStore(BLOB_STORE), id),
  ])
}

/**
 * Remove all downloads.
 */
export async function clearAllDownloads() {
  const db = await openDB()
  const t  = db.transaction([META_STORE, BLOB_STORE], 'readwrite')
  await Promise.all([
    new Promise((res, rej) => { const r = t.objectStore(META_STORE).clear(); r.onsuccess=res; r.onerror=rej }),
    new Promise((res, rej) => { const r = t.objectStore(BLOB_STORE).clear(); r.onsuccess=res; r.onerror=rej }),
  ])
}

/**
 * Remove all expired downloads (older than 30 days).
 */
export async function evictExpired() {
  const all     = await getAllDownloads()
  const expired = all.filter(m => Date.now() > m.expiresAt)
  await Promise.all(expired.map(m => removeDownload(m._id)))
  return expired.length
}

/**
 * Compute days remaining until expiry.
 */
export function daysLeft(meta) {
  const ms = meta.expiresAt - Date.now()
  if (ms <= 0) return 0
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
}

/**
 * Human-readable size string.
 */
export function formatSize(bytes) {
  if (bytes >= 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  if (bytes >= 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / 1024).toFixed(0)} KB`
}