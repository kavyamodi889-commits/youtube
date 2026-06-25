// FILE: server/controllers/videoController.js
const cloudinary       = require('cloudinary').v2
const Video            = require('../models/Video')
const User             = require('../models/User')
const { processVideo, processSubtitle, getVideoMeta } = require('../utils/videoProcessor')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

function uploadThumbnail(buffer, isShort = false) {
  return new Promise((resolve, reject) => {
    // Shorts are portrait 9:16, regular videos are landscape 16:9
    const transformation = isShort
      ? [{ width: 720, height: 1280, crop: 'fill', gravity: 'center' }]
      : [{ width: 1280, height: 720,  crop: 'fill', gravity: 'center' }]

    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'image', folder: 'aura/thumbnails', transformation },
      (err, result) => err ? reject(err) : resolve(result)
    )
    stream.end(buffer)
  })
}

// ── POST /api/videos/upload ───────────────────────────────────────────────────
exports.uploadVideo = async (req, res) => {
  try {
    if (!req.files?.video?.[0])
      return res.status(400).json({ success: false, message: 'No video file provided' })

    const { title, description, tags, category, madeForKids, visibility } = req.body
    if (!title?.trim())
      return res.status(400).json({ success: false, message: 'Title is required' })

    const parsedTags = tags
      ? (Array.isArray(tags) ? tags
          : (() => { try { return JSON.parse(tags) } catch { return tags.split(',').map(t => t.trim()).filter(Boolean) } })())
      : []

    // Create stub doc immediately — client polls for progress
    const video = await Video.create({
      uploader:           req.user._id,
      title:              title.trim(),
      description:        description || '',
      tags:               parsedTags,
      category:           category    || 'General',
      madeForKids:        madeForKids === 'true' || madeForKids === 'yes',
      visibility:         visibility  || 'private',
      status:             'processing',
      processingProgress: 0,
    })

    // Respond immediately
    res.status(202).json({
      success: true,
      message: 'Upload received — processing started',
      videoId: video._id,
    })

    // Background processing
    ;(async () => {
      try {
        const videoBuffer = req.files.video[0].buffer
        const baseId      = `video_${video._id}`

        // Detect portrait/short BEFORE uploading thumbnail so we know the right crop
        const os   = require('os')
        const fs   = require('fs')
        const path = require('path')
        const tmpMetaDir  = fs.mkdtempSync(path.join(os.tmpdir(), 'aura-meta-'))
        const tmpMetaPath = path.join(tmpMetaDir, 'input.mp4')
        fs.writeFileSync(tmpMetaPath, videoBuffer)
        let videoIsShort = false
        try {
          const meta = await getVideoMeta(tmpMetaPath)
          videoIsShort = meta.height > meta.width && meta.duration <= 60
          console.log(`[video] isShort=${videoIsShort} (${meta.width}x${meta.height}, ${Math.round(meta.duration)}s)`)
        } catch (e) {
          console.warn('[video] meta detection failed, assuming landscape:', e.message)
        } finally {
          try { fs.rmSync(tmpMetaDir, { recursive: true, force: true }) } catch {}
        }

        if (req.files?.thumbnail?.[0]) {
          const tResult = await uploadThumbnail(req.files.thumbnail[0].buffer, videoIsShort)
          await Video.findByIdAndUpdate(video._id, {
            thumbnailUrl:      tResult.secure_url,
            thumbnailPublicId: tResult.public_id,
          })
        }

        const result = await processVideo(videoBuffer, baseId, async (pct) => {
          await Video.findByIdAndUpdate(video._id, { processingProgress: pct })
        })

        // Re-fetch to check if custom thumbnail was already saved (from the upload step above)
        const freshVideo   = await Video.findById(video._id).select('thumbnailUrl')
        const autoThumbUrl = result.autoThumbnails?.[0]?.url || ''

        await Video.findByIdAndUpdate(video._id, {
          videoUrl:           result.videoUrl,
          videoPublicId:      result.videoPublicId,
          qualities:          result.qualities,
          duration:           result.duration,
          fileSize:           result.fileSize,
          resolution:         result.resolution,
          status:             'published',
          processingProgress: 100,
          autoThumbnails:     result.autoThumbnails || [],
          // Auto-detect shorts: vertical video (height > width) AND ≤ 60 seconds
          isShort: (() => {
            const [w, h] = (result.resolution || '0x0').split('x').map(Number)
            return h > w && result.duration <= 60
          })(),
          // Only override thumbnailUrl with auto if creator didn't upload a custom one
          ...(freshVideo.thumbnailUrl ? {} : { thumbnailUrl: autoThumbUrl }),
        })

        console.log(`[video] ✅ ${video._id} done — ${result.qualities.length} qualities`)

        // ── Keep channel stats in sync ────────────────────────────
        User.findByIdAndUpdate(req.user._id, { $inc: { videoCount: 1 } }).catch(() => {})

        // ── Auto-promote user → creator on first video upload ─────
        // Only promotes if their current role is 'user' — creators/admins/moderators unchanged
        User.findOne({ _id: req.user._id, role: 'user' })
          .then(u => {
            if (u) {
              return User.findByIdAndUpdate(req.user._id, { role: 'creator' })
                .then(() => console.log(`[video] 🎬 ${req.user._id} promoted to creator`))
            }
          })
          .catch(err => console.error('[video] role promotion error:', err.message))

        // Notify all subscribers of this channel about the new video
        try {
          const { createNotification } = require('./notification.controller')
          const uploader = await User.findById(req.user._id).select('displayName username avatar subscriptions')
          // Find all users who subscribe to this channel (subscriptions is now a real array field)
          const subscribers = await User.find({ subscriptions: req.user._id }).select('_id').lean()
          const freshVid    = await Video.findById(video._id).select('title thumbnailUrl isShort')

          for (const sub of subscribers) {
            createNotification({
              recipient: sub._id,
              sender:    req.user._id,
              type:      'newVideo',
              title:     uploader.displayName || uploader.username,
              message:   `uploaded: ${freshVid.title}`,
              imageUrl:  freshVid.thumbnailUrl || uploader.avatar || null,
              linkUrl:   `/watch/${video._id}`,
              linkType:  'video',
              linkId:    video._id,
              priority:  'high',
            }).catch(() => {})
          }
        } catch (notifErr) {
          console.error('[video] notification error:', notifErr.message)
        }
      } catch (err) {
        console.error(`[video] ❌ ${video._id} failed:`, err.message)
        await Video.findByIdAndUpdate(video._id, { status: 'rejected', processingProgress: 0 })
      }
    })()
  } catch (err) {
    console.error('[uploadVideo]', err)
    res.status(500).json({ success: false, message: 'Server error during upload' })
  }
}

// ── GET /api/videos/:id/status ────────────────────────────────────────────────
// ── POST /api/videos/:id/view — called only when video actually plays ─────────
exports.recordView = async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { returnDocument: 'after', select: 'uploader' }
    )
    // Keep the uploader's totalViews in sync (fire-and-forget)
    if (video?.uploader) {
      User.findByIdAndUpdate(video.uploader, { $inc: { totalViews: 1 } }).catch(() => {})
    }
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.getVideoStatus = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .select('status processingProgress qualities duration')
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' })
    res.json({
      success:   true,
      status:    video.status,
      progress:  video.processingProgress,
      qualities: video.qualities.map(q => q.label),
      duration:  video.duration,
    })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// ── POST /api/videos/:id/subtitles — upload .srt or .vtt ─────────────────────
exports.uploadSubtitle = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' })
    if (String(video.uploader) !== String(req.user._id))
      return res.status(403).json({ success: false, message: 'Not your video' })
    if (!req.file)
      return res.status(400).json({ success: false, message: 'No subtitle file' })

    const { language = 'en', label = 'English' } = req.body
    const subtitle = await processSubtitle(
      req.file.buffer, req.file.originalname,
      `video_${video._id}`, language, label
    )

    const idx = video.subtitles.findIndex(s => s.language === language)
    if (idx >= 0) video.subtitles[idx] = subtitle
    else video.subtitles.push(subtitle)
    await video.save()

    res.json({ success: true, subtitle })
  } catch (err) {
    console.error('[uploadSubtitle]', err)
    res.status(500).json({ success: false, message: err.message || 'Server error' })
  }
}

// ── POST /api/videos/:id/subtitles/auto — Cloudinary AI captions ──────────────
exports.autoCaption = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' })
    if (String(video.uploader) !== String(req.user._id))
      return res.status(403).json({ success: false, message: 'Not your video' })
    if (!video.videoPublicId)
      return res.status(400).json({ success: false, message: 'Video not yet processed' })

    await cloudinary.uploader.explicit(video.videoPublicId, {
      resource_type: 'video',
      type:          'upload',
      raw_convert:   'google_speech:vtt:en-US',
    })

    const vttUrl = cloudinary.url(`${video.videoPublicId}.transcript.vtt`, {
      resource_type: 'raw',
    })

    const subtitle = { language: 'en', label: 'Auto-generated', url: vttUrl }
    const idx = video.subtitles.findIndex(s => s.language === 'en')
    if (idx >= 0) video.subtitles[idx] = subtitle
    else video.subtitles.push(subtitle)
    await video.save()

    res.json({ success: true, subtitle })
  } catch (err) {
    console.error('[autoCaption]', err)
    res.status(500).json({ success: false, message: err.message || 'Server error' })
  }
}

// ── GET /api/videos ───────────────────────────────────────────────────────────
exports.getVideos = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, sort = 'recent' } = req.query
    const filter = { status: 'published', visibility: 'public' }
    if (category && category !== 'All') filter.category = category

    const sortMap = {
      recent:  { createdAt: -1 },
      views:   { viewCount: -1 },
      trending:{ viewCount: -1, createdAt: -1 },
      oldest:  { createdAt:  1 },
    }
    const sortObj = sortMap[sort] || sortMap.recent

    const videos = await Video.find(filter)
      .populate('uploader', 'displayName username avatar handle')
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(Number(limit))

    const total = await Video.countDocuments(filter)
    res.json({ success: true, videos, total, page: Number(page) })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// ── GET /api/videos/:id ───────────────────────────────────────────────────────
const WatchHistory = require('../models/WatchHistory')

exports.getVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate('uploader', 'displayName username avatar handle subscribers')
    if (!video || video.status === 'deleted')
      return res.status(404).json({ success: false, message: 'Video not found' })

    // ── View count is incremented via POST /api/videos/:id/view (on actual play)
    // NOT here — this endpoint is called on every page load including Studio

    // Record in WatchHistory for authenticated users (upsert — one entry per user/video)
    if (req.user) {
      WatchHistory.findOneAndUpdate(
        { user: req.user._id, video: req.params.id },
        {
          $set:  { lastWatchedAt: new Date(), totalDuration: video.duration || 0 },
          $inc:  { watchCount: 1 },
          $setOnInsert: { progressPercent: 0, resumeAt: 0, watchedDuration: 0 },
        },
        { upsert: true, returnDocument: 'after' }
      ).catch(() => {}) // non-blocking
    }

    res.json({ success: true, video })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// ── POST /api/videos/:id/progress — save resume position ─────────
exports.saveProgress = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false })
    const { watchedDuration, progressPercent, resumeAt } = req.body
    const addSecs = Number(watchedDuration) || 0

    await WatchHistory.findOneAndUpdate(
      { user: req.user._id, video: req.params.id },
      {
        // $inc accumulates watchedDuration across multiple sessions/flushes
        ...(addSecs > 0 ? { $inc: { watchedDuration: addSecs } } : {}),
        $set: {
          progressPercent:  Number(progressPercent)  || 0,
          resumeAt:         Number(resumeAt)          || 0,
          lastWatchedAt:    new Date(),
          isCompleted:      (Number(progressPercent) || 0) >= 90,
        },
      },
      { upsert: true }
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── GET /api/videos/search ────────────────────────────────────────────────────
exports.searchVideos = async (req, res) => {
  try {
    const { q, page = 1, limit = 20, sort = 'relevance', duration, date } = req.query
    if (!q?.trim()) return res.status(400).json({ success: false, message: 'Query required' })

    const regex   = new RegExp(q.trim().split(/\s+/).join('|'), 'i')
    const baseFilter = {
      status:     'published',
      visibility: 'public',
      $or: [
        { title:       { $regex: regex } },
        { description: { $regex: regex } },
        { tags:        { $elemMatch: { $regex: regex } } },
      ],
    }

    // Duration filter
    if (duration === 'short')  baseFilter.duration = { $lt: 240 }
    if (duration === 'medium') baseFilter.duration = { $gte: 240, $lte: 1200 }
    if (duration === 'long')   baseFilter.duration = { $gt: 1200 }

    // Date filter
    if (date) {
      const now = new Date()
      const from = new Date()
      if (date === 'today') from.setHours(0,0,0,0)
      if (date === 'week')  from.setDate(now.getDate() - 7)
      if (date === 'month') from.setMonth(now.getMonth() - 1)
      if (date === 'year')  from.setFullYear(now.getFullYear() - 1)
      baseFilter.createdAt = { $gte: from }
    }

    // Sort
    let sortObj = { createdAt: -1 }
    if (sort === 'views')     sortObj = { viewCount: -1 }
    if (sort === 'rating')    sortObj = { likeCount: -1 }
    if (sort === 'relevance') sortObj = { viewCount: -1, createdAt: -1 }

    const total  = await Video.countDocuments(baseFilter)
    const videos = await Video.find(baseFilter)
      .populate('uploader', 'displayName username avatar handle isChannelVerified subscriberCount')
      .sort(sortObj)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))

    // Return both shapes for backward compat
    res.json({
      success: true,
      videos,                          // new shape
      data: { videos, total },         // old client shape
      total,
    })
  } catch (err) {
    console.error('[search]', err.message)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// ── GET /api/videos/user/me ───────────────────────────────────────────────────
exports.getMyVideos = async (req, res) => {
  try {
    const videos = await Video.find({ uploader: req.user._id, status: { $ne: 'deleted' } })
      .sort({ createdAt: -1 })
    res.json({ success: true, videos })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// ── DELETE /api/videos/:id ────────────────────────────────────────────────────
exports.deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' })
    if (String(video.uploader) !== String(req.user._id))
      return res.status(403).json({ success: false, message: 'Not your video' })

    for (const q of video.qualities) {
      if (q.publicId)
        await cloudinary.uploader.destroy(q.publicId, { resource_type: 'video' }).catch(() => {})
    }
    if (video.thumbnailPublicId)
      await cloudinary.uploader.destroy(video.thumbnailPublicId).catch(() => {})

    await Video.findByIdAndUpdate(req.params.id, { status: 'deleted' })
    // Keep channel stats in sync
    User.findByIdAndUpdate(video.uploader, { $inc: { videoCount: -1 } }).catch(() => {})
    res.json({ success: true, message: 'Video deleted' })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
// ── GET /api/videos/user/:userId — public channel videos ─────────
exports.getVideosByUser = async (req, res) => {
  try {
    const { limit = 50, isShort } = req.query
    const filter = {
      uploader:   req.params.userId,
      status:     'published',
      visibility: 'public',
      isLiveVOD:  { $ne: true },   // exclude live VODs — they show in Live tab only
    }
    if (isShort === 'true')  filter.isShort = true
    if (isShort === 'false') filter.isShort = false

    const videos = await Video.find(filter)
      .populate('uploader', 'displayName username avatar handle isChannelVerified subscriberCount bio createdAt bannerImage website')
      .sort({ createdAt: -1 })
      .limit(Number(limit))

    res.json({ success: true, videos })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// ── DELETE /api/videos/:id/subtitles/:language ────────────────────────────────
exports.deleteSubtitle = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' })
    if (String(video.uploader) !== String(req.user._id))
      return res.status(403).json({ success: false, message: 'Not your video' })

    video.subtitles = video.subtitles.filter(s => s.language !== req.params.language)
    await video.save()
    res.json({ success: true, message: 'Subtitle track removed' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── PATCH /api/videos/:id — edit video metadata & thumbnail ──────────────────
exports.updateVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
    if (!video)
      return res.status(404).json({ success: false, message: 'Video not found' })
 
    if (String(video.uploader) !== String(req.user._id))
      return res.status(403).json({ success: false, message: 'Not your video' })
 
    const { title, description, visibility, category, commentsEnabled } = req.body
 
    // Tags come as tags[] form fields or a JSON string
    let tags = video.tags
    if (req.body['tags[]']) {
      tags = Array.isArray(req.body['tags[]'])
        ? req.body['tags[]']
        : [req.body['tags[]']]
    } else if (req.body.tags) {
      try { tags = JSON.parse(req.body.tags) } catch { tags = video.tags }
    }
 
    if (title           !== undefined) video.title           = title.trim()
    if (description     !== undefined) video.description     = description
    if (visibility      !== undefined) video.visibility      = visibility
    if (category        !== undefined) video.category        = category
    if (commentsEnabled !== undefined)
      video.commentsEnabled = commentsEnabled !== 'false' && commentsEnabled !== false
    video.tags = tags
 
    // New thumbnail (optional)
    if (req.file?.buffer) {
      try {
        const tResult = await uploadThumbnail(req.file.buffer)
        if (video.thumbnailPublicId) {
          cloudinary.uploader.destroy(video.thumbnailPublicId).catch(() => {})
        }
        video.thumbnailUrl      = tResult.secure_url
        video.thumbnailPublicId = tResult.public_id
      } catch (e) {
        console.warn('[updateVideo] thumb upload failed:', e.message)
      }
    }
 
    await video.save()
 
    res.json({
      success: true,
      message: 'Video updated',
      video: {
        _id:             video._id,
        title:           video.title,
        description:     video.description,
        visibility:      video.visibility,
        category:        video.category,
        tags:            video.tags,
        thumbnailUrl:    video.thumbnailUrl,
        commentsEnabled: video.commentsEnabled,
      },
    })
  } catch (err) {
    console.error('[updateVideo]', err)
    res.status(500).json({ success: false, message: err.message || 'Server error' })
  }
}