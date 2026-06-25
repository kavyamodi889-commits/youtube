// FILE: server/routes/search.routes.js
const express = require('express')
const multer  = require('multer')
const router  = express.Router()
const upload  = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } })

// ── POST /api/search/image ─────────────────────────────────────────
// Google Vision API — identify what's in an image, return search results
router.post('/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image provided' })

    const b64    = req.file.buffer.toString('base64')
    const apiKey = process.env.GOOGLE_VISION_API_KEY
    if (!apiKey) return res.status(500).json({ success: false, message: 'Vision API not configured' })

    const visionRes = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: b64 },
            features: [
              { type: 'LABEL_DETECTION',    maxResults: 10 },
              { type: 'WEB_DETECTION',      maxResults: 10 },
              { type: 'OBJECT_LOCALIZATION',maxResults: 5  },
            ],
          }],
        }),
      }
    )

    const visionData = await visionRes.json()
    const ann = visionData.responses?.[0]

    // Build search query from Vision results
    const webLabels  = ann?.webDetection?.bestGuessLabels?.map(l => l.label) || []
    const labels     = ann?.labelAnnotations?.slice(0, 5).map(l => l.description) || []
    const objects    = ann?.localizedObjectAnnotations?.slice(0, 3).map(o => o.name) || []

    const queryTerms = [...new Set([...webLabels, ...objects, ...labels])]
    const query      = queryTerms.slice(0, 3).join(' ')

    if (!query) return res.json({ success: true, query: '', videos: [], labels: [] })

    // Search videos with the extracted query
    const Video  = require('../models/Video')
    const regex  = new RegExp(queryTerms.slice(0, 5).join('|'), 'i')
    const videos = await Video.find({
      status: 'published', visibility: 'public',
      $or: [
        { title:       { $regex: regex } },
        { description: { $regex: regex } },
        { tags:        { $elemMatch: { $regex: regex } } },
      ],
    })
      .populate('uploader', 'displayName username avatar handle')
      .sort({ viewCount: -1 })
      .limit(20)

    res.json({ success: true, query, labels: queryTerms, videos })
  } catch (err) {
    console.error('[search/image]', err.message)
    res.status(500).json({ success: false, message: 'Image search failed: ' + err.message })
  }
})

// ── POST /api/search/song ──────────────────────────────────────────
// ACR Cloud — identify song from audio, return matching videos
router.post('/song', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No audio provided' })

    const { ACR_HOST, ACR_ACCESS_KEY, ACR_ACCESS_SECRET } = process.env
    if (!ACR_HOST || !ACR_ACCESS_KEY || !ACR_ACCESS_SECRET)
      return res.status(500).json({ success: false, message: 'ACR Cloud not configured' })

    const crypto    = require('crypto')
    const FormData  = require('form-data')

    const method    = 'POST'
    const uri       = '/v1/identify'
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const dataType  = 'audio'
    const sigVersion= '1'

    const strToSign = [method, uri, ACR_ACCESS_KEY, dataType, sigVersion, timestamp].join('\n')
    const signature = crypto.createHmac('sha1', ACR_ACCESS_SECRET).update(strToSign).digest('base64')

    const form = new FormData()
    form.append('sample',          req.file.buffer, { filename: 'audio.wav', contentType: req.file.mimetype })
    form.append('access_key',      ACR_ACCESS_KEY)
    form.append('data_type',       dataType)
    form.append('signature_version', sigVersion)
    form.append('signature',       signature)
    form.append('sample_bytes',    req.file.size.toString())
    form.append('timestamp',       timestamp)

    const acrRes  = await fetch(`https://${ACR_HOST}${uri}`, { method: 'POST', body: form, headers: form.getHeaders() })
    const acrData = await acrRes.json()

    if (acrData.status?.code !== 0)
      return res.json({ success: true, identified: false, query: '', videos: [], message: acrData.status?.msg })

    const music  = acrData.metadata?.music?.[0]
    const title  = music?.title || ''
    const artist = music?.artists?.[0]?.name || ''
    const query  = [title, artist].filter(Boolean).join(' ')

    // Search AURA videos matching this song
    const Video  = require('../models/Video')
    const regex  = new RegExp([title, artist].filter(Boolean).join('|'), 'i')
    const videos = await Video.find({
      status: 'published', visibility: 'public',
      $or: [{ title: { $regex: regex } }, { tags: { $elemMatch: { $regex: regex } } }],
    })
      .populate('uploader', 'displayName username avatar handle')
      .sort({ viewCount: -1 })
      .limit(20)

    res.json({
      success: true,
      identified: true,
      song:   { title, artist, album: music?.album?.name || '' },
      query,
      videos,
    })
  } catch (err) {
    console.error('[search/song]', err.message)
    res.status(500).json({ success: false, message: 'Song search failed: ' + err.message })
  }
})

module.exports = router