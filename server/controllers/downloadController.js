// FILE: server/controllers/downloadController.js
const User  = require('../models/User')
const Video = require('../models/Video')

// ── POST /api/downloads/:videoId — mark video as downloaded ───────────────────
exports.addDownload = async (req, res) => {
  try {
    const { videoId } = req.params
    const user = await User.findById(req.user._id).select('downloadedVideos')

    const alreadyIn = user.downloadedVideos.some(id => id.equals(videoId))
    if (!alreadyIn) {
      user.downloadedVideos.push(videoId)
      await user.save()
    }

    res.json({ success: true, downloaded: true, count: user.downloadedVideos.length })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── DELETE /api/downloads/:videoId — remove a download record ─────────────────
exports.removeDownload = async (req, res) => {
  try {
    const { videoId } = req.params
    const user = await User.findById(req.user._id).select('downloadedVideos')

    user.downloadedVideos = user.downloadedVideos.filter(id => !id.equals(videoId))
    await user.save()

    res.json({ success: true, downloaded: false, count: user.downloadedVideos.length })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── GET /api/downloads — list all downloaded videos ───────────────────────────
exports.getDownloads = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('downloadedVideos')
      .populate({
        path: 'downloadedVideos',
        select: 'title thumbnailUrl duration viewCount createdAt uploader isShort videoUrl',
        populate: { path: 'uploader', select: 'displayName username avatar handle isChannelVerified' },
      })

    res.json({ success: true, videos: (user.downloadedVideos || []).reverse() })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── DELETE /api/downloads — clear all downloads ───────────────────────────────
exports.clearDownloads = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { downloadedVideos: [] })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── GET /api/downloads/state/:videoId — is this video downloaded? ─────────────
exports.getDownloadState = async (req, res) => {
  try {
    const { videoId } = req.params
    const user = await User.findById(req.user._id).select('downloadedVideos')
    const downloaded = user.downloadedVideos.some(id => id.equals(videoId))
    res.json({ success: true, downloaded })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}