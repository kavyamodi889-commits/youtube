// FILE: server/controllers/liveController.js
const crypto      = require('crypto')
const cloudinary  = require('cloudinary').v2
const LiveStream  = require('../models/LiveStream')
const socketIO    = require('../lib/socketIO')
const ChatMessage = require('../models/ChatMessage')
const Video       = require('../models/Video')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

function uploadThumbnail(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'image', folder: 'aura/live-thumbnails',
        transformation: [{ width: 1280, height: 720, crop: 'fill' }] },
      (err, result) => err ? reject(err) : resolve(result)
    )
    stream.end(buffer)
  })
}

// ── POST /api/live — create stream ────────────────────────────────
exports.createStream = async (req, res) => {
  try {
    if (!req.user?._id)
      return res.status(401).json({ success: false, message: 'Not authenticated' })

    const { title, description, category, visibility, chatEnabled } = req.body
    if (!title?.trim())
      return res.status(400).json({ success: false, message: 'Title is required' })

    const streamKey = crypto.randomBytes(16).toString('hex')
    const rtmpPort  = process.env.RTMP_PORT      || 1935
    const httpPort  = process.env.RTMP_HTTP_PORT || 8888
    const rtmpUrl   = `rtmp://localhost:${rtmpPort}/live`
    // Use port 5000 /hls/ (express.static) — works via Vite proxy for remote access too
    const hlsUrl    = `http://localhost:${process.env.PORT || 5000}/hls/live/${streamKey}/index.m3u8`

    let thumbnailUrl = '', thumbnailPublicId = ''
    if (req.file?.buffer) {
      try {
        const t = await uploadThumbnail(req.file.buffer)
        thumbnailUrl      = t.secure_url
        thumbnailPublicId = t.public_id
      } catch (e) {
        console.warn('[createStream] thumb upload failed:', e.message)
      }
    }

    const stream = await LiveStream.create({
      host:             req.user._id,
      title:            title.trim(),
      description:      description || '',
      category:         category    || 'General',
      visibility:       visibility  || 'public',
      chatEnabled:      chatEnabled !== 'false',
      streamKey,
      rtmpUrl,
      hlsUrl,
      thumbnailUrl,
      thumbnailPublicId,
      status:           'scheduled',
    })

    res.status(201).json({
      success: true,
      stream: {
        _id:       stream._id,
        title:     stream.title,
        streamKey: stream.streamKey,
        rtmpUrl,
        streamUrl: `${rtmpUrl}/${streamKey}`,
        hlsUrl,
        status:    stream.status,
      },
    })
  } catch (err) {
    console.error('[createStream]', err)
    res.status(500).json({ success: false, message: err.message || 'Server error' })
  }
}

// ── POST /api/live/:id/end ────────────────────────────────────────
exports.endStream = async (req, res) => {
  try {
    const stream = await LiveStream.findById(req.params.id)
    if (!stream)
      return res.status(404).json({ success: false, message: 'Stream not found' })
    if (String(stream.host) !== String(req.user._id))
      return res.status(403).json({ success: false, message: 'Not your stream' })

    const durationSec = stream.startedAt
      ? Math.round((Date.now() - new Date(stream.startedAt).getTime()) / 1000)
      : 0

    await LiveStream.findByIdAndUpdate(req.params.id, {
      status: 'ended', endedAt: new Date(), currentViewers: 0, duration: durationSec,
    })

    // Write EXT-X-ENDLIST so the m3u8 is valid VOD
    try {
      const path = require('path')
      const fs   = require('fs')
      const HLS_ROOT = process.env.HLS_OUTPUT_PATH || './tmp/hls'
      const m3u8Path = path.join(HLS_ROOT, 'live', stream.streamKey, 'index.m3u8')
      if (fs.existsSync(m3u8Path)) {
        let m3u8 = fs.readFileSync(m3u8Path, 'utf8')
        if (!m3u8.includes('#EXT-X-ENDLIST')) {
          fs.writeFileSync(m3u8Path, m3u8.trimEnd() + '\n#EXT-X-ENDLIST\n', 'utf8')
        }
      }
    } catch (e) { console.error('[endStream] EXT-X-ENDLIST error:', e.message) }

    // Notify all clients watching this stream
    socketIO.emitTo(`stream:${req.params.id}`, 'stream:ended', {})
    res.json({ success: true, message: 'Stream ended' })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// ── GET /api/live — all live streams ─────────────────────────────
exports.getLiveStreams = async (req, res) => {
  try {
    const streams = await LiveStream.find({ status: 'live', visibility: 'public' })
      .populate('host', 'displayName username avatar handle')
      .sort({ startedAt: -1 })
      .limit(20)
    res.json({ success: true, streams })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// ── GET /api/live/:id ─────────────────────────────────────────────
exports.getStream = async (req, res) => {
  try {
    const stream = await LiveStream.findById(req.params.id)
      .populate('host', 'displayName username avatar handle subscribers subscriberCount')
    if (!stream)
      return res.status(404).json({ success: false, message: 'Stream not found' })

    const data = stream.toObject()
    if (String(stream.host._id) !== String(req.user?._id)) {
      delete data.streamKey
    }
    res.json({ success: true, stream: data })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// ── GET /api/live/user/me ─────────────────────────────────────────
exports.getMyStreams = async (req, res) => {
  try {
    const streams = await LiveStream.find({ host: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
    res.json({ success: true, streams })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// ── GET /api/live/channel/:channelId ─────────────────────────────
exports.getChannelStreams = async (req, res) => {
  try {
    const { channelId } = req.params
    // Only show archived (saved-as-video) streams on channel page
    const streams = await LiveStream.find({
      host:       channelId,
      isArchived: true,
      visibility: 'public',
    })
      .populate('host', 'displayName username avatar handle subscriberCount')
      .populate('vodVideo', '_id')   // so client can link to /watch/:vodVideoId
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()
    res.json({ success: true, streams })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// ── GET /api/live/:id/mobile-token ───────────────────────────────
exports.getMobileToken = async (req, res) => {
  try {
    const stream = await LiveStream.findById(req.params.id)
    if (!stream)
      return res.status(404).json({ success: false, message: 'Stream not found' })
    if (String(stream.host) !== String(req.user._id))
      return res.status(403).json({ success: false, message: 'Not your stream' })

    const localIP   = process.env.LOCAL_IP || 'localhost'
    const mobileUrl = `http://${localIP}:5173/stream-mobile?sid=${stream._id}&key=${stream.streamKey}`
    res.json({ success: true, mobileUrl, streamId: stream._id, streamKey: stream.streamKey })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// ── GET /api/live/:id/chat — fetch saved chat messages ────────────
exports.getChatHistory = async (req, res) => {
  try {
    const messages = await ChatMessage.find({ streamId: req.params.id })
      .sort({ createdAt: 1 })
      .limit(500)
      .lean()
    res.json({ success: true, messages })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// ── POST /api/live/:id/save-as-video — stitch HLS → MP4 and save as VOD ────
exports.saveAsVideo = async (req, res) => {
  const path   = require('path')
  const fs     = require('fs')
  const { spawn } = require('child_process')

  try {
    const stream = await LiveStream.findById(req.params.id)
    if (!stream)
      return res.status(404).json({ success: false, message: 'Stream not found' })
    if (String(stream.host) !== String(req.user._id))
      return res.status(403).json({ success: false, message: 'Not your stream' })
    if (stream.isArchived && stream.vodVideo)
      return res.status(400).json({ success: false, message: 'Already saved as video' })

    // Calculate real duration
    const startMs     = stream.startedAt ? new Date(stream.startedAt).getTime() : null
    const endMs       = stream.endedAt   ? new Date(stream.endedAt).getTime()   : Date.now()
    const durationSec = startMs ? Math.round((endMs - startMs) / 1000) : 0

    const HLS_ROOT  = process.env.HLS_OUTPUT_PATH || './tmp/hls'
    const hlsDir    = path.join(HLS_ROOT, 'live', stream.streamKey)
    const m3u8Path  = path.join(hlsDir, 'index.m3u8')

    // Respond immediately so client doesn't time out — processing happens async
    res.json({ success: true, message: 'Saving stream as video…', processing: true })

    // Wait for FFmpeg to finish writing (EXT-X-ENDLIST appears in m3u8) — max 30s
    for (let i = 0; i < 30; i++) {
      if (fs.existsSync(m3u8Path) && fs.readFileSync(m3u8Path, 'utf8').includes('#EXT-X-ENDLIST')) break
      await new Promise(r => setTimeout(r, 1000))
    }
    // Ensure EXT-X-ENDLIST is written even if timed out
    if (fs.existsSync(m3u8Path)) {
      let m3u8 = fs.readFileSync(m3u8Path, 'utf8')
      if (!m3u8.includes('#EXT-X-ENDLIST')) {
        fs.writeFileSync(m3u8Path, m3u8.trimEnd() + '\n#EXT-X-ENDLIST\n', 'utf8')
      }
    }
    console.log('[saveAsVideo] EXT-X-ENDLIST confirmed, starting stitch')

    // VOD output directory
    const vodDir  = path.join(HLS_ROOT, 'vod')
    fs.mkdirSync(vodDir, { recursive: true })
    const mp4File = path.join(vodDir, `${stream.streamKey}.mp4`)
    const mp4Url  = `http://localhost:${process.env.PORT || 5000}/hls/vod/${stream.streamKey}.mp4`

    const ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg'

    // Helper to run FFmpeg and return a promise
    const runFFmpeg = (args, cwd) => new Promise((resolve, reject) => {
      const ff = spawn(ffmpegPath, args, { stdio: ['ignore', 'pipe', 'pipe'], ...(cwd ? { cwd } : {}) })
      let errLog = ''
      ff.stderr.on('data', d => { errLog += d.toString() })
      ff.on('error', reject)
      ff.on('close', code => code === 0 ? resolve() : reject(new Error(`FFmpeg exit ${code}: ${errLog.slice(-300)}`)))
    })

    const createVideo = async (videoUrl, dur) => {
      const video = await Video.create({
        uploader:       req.user._id,
        title:          stream.title,
        description:    stream.description || '',
        category:       stream.category    || 'General',
        tags:           stream.tags        || [],
        visibility:     stream.visibility  || 'public',
        thumbnailUrl:   stream.thumbnailUrl || '',
        videoUrl,
        status:         'published',
        mimeType:       videoUrl.includes('.mp4') ? 'video/mp4' : 'application/x-mpegurl',
        duration:       dur,
        isLiveVOD:      true,
        sourceStreamId: stream._id,
        liveStartedAt:  stream.startedAt || stream.createdAt,
      })
      await LiveStream.findByIdAndUpdate(req.params.id, {
        isArchived: true,
        vodVideo:   video._id,
        duration:   dur,
      })
      console.log(`[saveAsVideo] VOD created: ${video._id}`)
    }

    if (fs.existsSync(m3u8Path)) {
      // Stitch all .ts segments into a single MP4
      try {
        await runFFmpeg([
          '-y',
          '-allowed_extensions', 'ALL',
          '-protocol_whitelist', 'file,http,crypto,tcp,tls,https',
          '-i', 'index.m3u8',      // relative — cwd is hlsDir
          '-c', 'copy',
          '-movflags', '+faststart',
          path.resolve(mp4File),   // absolute output path
        ], hlsDir)                 // run FFmpeg in the HLS dir
        // Get real duration from MP4
        let realDur = durationSec
        try {
          const probe = await new Promise((res, rej) => {
            const p = spawn(ffmpegPath, ['-i', mp4File], { stdio: ['ignore','pipe','pipe'] })
            let out = ''
            p.stderr.on('data', d => out += d)
            p.on('close', () => {
              const m = out.match(/Duration: (\d+):(\d+):(\d+\.\d+)/)
              if (m) res(Math.round(parseInt(m[1])*3600 + parseInt(m[2])*60 + parseFloat(m[3])))
              else   res(durationSec)
            })
            p.on('error', rej)
          })
          realDur = probe
        } catch {}
        await createVideo(mp4Url, realDur)
        console.log(`[saveAsVideo] MP4 stitched: ${mp4File}`)
      } catch (ffErr) {
        console.error('[saveAsVideo] FFmpeg stitch failed, falling back to HLS:', ffErr.message)
        // Fallback: serve the HLS m3u8 directly
        const hlsUrl = stream.hlsUrl || `http://localhost:${process.env.PORT || 5000}/hls/live/${stream.streamKey}/index.m3u8`
        await createVideo(hlsUrl, durationSec)
      }
    } else {
      // No HLS segments — nothing to save
      console.warn('[saveAsVideo] No m3u8 found at', m3u8Path)
      const hlsUrl = stream.hlsUrl || ''
      await createVideo(hlsUrl, durationSec)
    }
  } catch (err) {
    console.error('[saveAsVideo]', err)
    // Don't send a second response since we already responded above
  }
}

// ── POST /api/live/:id/thumbnail — auto-capture thumbnail ─────────
exports.updateThumbnail = async (req, res) => {
  try {
    const stream = await LiveStream.findById(req.params.id)
    if (!stream) return res.status(404).json({ success: false })
    if (req.user && String(stream.host) !== String(req.user._id))
      return res.status(403).json({ success: false })
    if (!req.file?.buffer)
      return res.status(400).json({ success: false, message: 'No image provided' })

    const result = await uploadThumbnail(req.file.buffer)

    if (stream.thumbnailPublicId)
      cloudinary.uploader.destroy(stream.thumbnailPublicId).catch(() => {})

    await LiveStream.findByIdAndUpdate(req.params.id, {
      thumbnailUrl:      result.secure_url,
      thumbnailPublicId: result.public_id,
    })

    res.json({ success: true, thumbnailUrl: result.secure_url })
  } catch (err) {
    console.error('[updateThumbnail]', err)
    res.status(500).json({ success: false, message: err.message })
  }
}
// ── GET /api/live/:id/vod-chat — full chat with offsets for VOD replay ───
exports.getVodChat = async (req, res) => {
  try {
    const messages = await require('../models/ChatMessage')
      .find({ streamId: req.params.id })
      .sort({ streamOffsetMs: 1 })
      .limit(2000)
      .lean()
    res.json({ success: true, messages })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// ── POST /api/live/:id/like — toggle like on a stream ────────────
exports.toggleLike = async (req, res) => {
  try {
    if (!req.user?._id)
      return res.status(401).json({ success: false, message: 'Not authenticated' })
    const stream = await LiveStream.findById(req.params.id)
    if (!stream) return res.status(404).json({ success: false, message: 'Stream not found' })

    // Simple toggle stored in stream meta map
    const userId  = String(req.user._id)
    const likers  = stream.meta?.get?.('likers') || []
    const liked   = likers.includes(userId)
    const updated = liked
      ? likers.filter(id => id !== userId)
      : [...likers, userId]

    await LiveStream.findByIdAndUpdate(req.params.id, {
      likeCount: updated.length,
      'meta.likers': updated,
    })
    res.json({ success: true, liked: !liked, likeCount: updated.length })
  } catch (err) {
    console.error('[toggleLike]', err)
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── POST /api/live/:id/report — report a stream ──────────────────
exports.reportStream = async (req, res) => {
  try {
    const { reason } = req.body
    if (!reason) return res.status(400).json({ success: false, message: 'Reason required' })
    // Store report in stream meta
    const report = {
      userId:    req.user?._id || null,
      reason,
      createdAt: new Date(),
    }
    await LiveStream.findByIdAndUpdate(req.params.id, {
      $push: { 'meta.reports': report },
      isFlagged: true,
    })
    res.json({ success: true, message: 'Report submitted' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
// ── GET /api/live/:id/interactions — get liked state for current user ─────────
exports.getInteractions = async (req, res) => {
  try {
    const stream = await LiveStream.findById(req.params.id).select('likeCount meta')
    if (!stream) return res.status(404).json({ success: false, message: 'Stream not found' })
    const userId = String(req.user?._id || '')
    const likers = stream.meta?.get?.('likers') || []
    const liked  = userId ? likers.includes(userId) : false
    res.json({ success: true, liked, likeCount: stream.likeCount || 0 })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}