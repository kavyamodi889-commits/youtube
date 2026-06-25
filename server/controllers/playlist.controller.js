// FILE: server/controllers/playlist.controller.js
const Playlist = require('../models/Playlist')
const Video    = require('../models/Video')

// ── GET /api/playlists — my playlists ────────────────────────────
exports.getMyPlaylists = async (req, res) => {
  try {
    const playlists = await Playlist.find({ owner: req.user._id })
      .sort({ updatedAt: -1 })
      .lean()

    // Attach thumbnail from first video in each playlist
    const result = await Promise.all(playlists.map(async pl => {
      const firstVideoEntry = pl.videos?.[0]
      let thumbnail = pl.thumbnail || ''
      if (!thumbnail && firstVideoEntry) {
        const vid = await Video.findById(firstVideoEntry.video).select('thumbnailUrl').lean()
        thumbnail = vid?.thumbnailUrl || ''
      }
      return {
        _id:       pl._id,
        title:     pl.title,
        privacy:   pl.privacy,
        count:     pl.videos?.length || 0,
        thumbnail,
        updatedAt: pl.updatedAt,
        createdAt: pl.createdAt,
      }
    }))

    res.json({ success: true, playlists: result })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── POST /api/playlists — create ──────────────────────────────────
exports.createPlaylist = async (req, res) => {
  try {
    const { title, privacy = 'private', description = '' } = req.body
    if (!title?.trim())
      return res.status(400).json({ success: false, message: 'Title required' })

    const playlist = await Playlist.create({
      owner: req.user._id,
      title: title.trim(),
      privacy,
      description,
    })

    res.status(201).json({
      success: true,
      playlist: {
        _id:       playlist._id,
        title:     playlist.title,
        privacy:   playlist.privacy,
        count:     0,
        thumbnail: '',
        updatedAt: playlist.updatedAt,
        createdAt: playlist.createdAt,
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── PATCH /api/playlists/:id — update title/privacy ───────────────
exports.updatePlaylist = async (req, res) => {
  try {
    const pl = await Playlist.findOne({ _id: req.params.id, owner: req.user._id })
    if (!pl) return res.status(404).json({ success: false, message: 'Not found' })

    if (req.body.title   !== undefined) pl.title   = req.body.title.trim()
    if (req.body.privacy !== undefined) pl.privacy = req.body.privacy
    if (req.body.description !== undefined) pl.description = req.body.description

    await pl.save()
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── DELETE /api/playlists/:id ─────────────────────────────────────
exports.deletePlaylist = async (req, res) => {
  try {
    await Playlist.deleteOne({ _id: req.params.id, owner: req.user._id })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── POST /api/playlists/:id/videos — add video ────────────────────
exports.addVideo = async (req, res) => {
  try {
    const { videoId } = req.body
    if (!videoId)
      return res.status(400).json({ success: false, message: 'videoId required' })

    const pl = await Playlist.findOne({ _id: req.params.id, owner: req.user._id })
    if (!pl) return res.status(404).json({ success: false, message: 'Playlist not found' })

    // Avoid duplicates
    const exists = pl.videos.some(v => v.video?.toString() === videoId)
    if (!exists) {
      pl.videos.push({ video: videoId, addedAt: new Date() })
      await pl.save()
    }

    res.json({ success: true, count: pl.videos.length, added: !exists })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── DELETE /api/playlists/:id/videos/:videoId — remove video ──────
exports.removeVideo = async (req, res) => {
  try {
    const pl = await Playlist.findOne({ _id: req.params.id, owner: req.user._id })
    if (!pl) return res.status(404).json({ success: false, message: 'Playlist not found' })

    pl.videos = pl.videos.filter(v => v.video?.toString() !== req.params.videoId)
    await pl.save()

    res.json({ success: true, count: pl.videos.length })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── GET /api/playlists/:id/details — get full playlist with video details (public for shared playlists)
exports.getPlaylistById = async (req, res) => {
  try {
    const pl = await Playlist.findById(req.params.id).lean()
    if (!pl) return res.status(404).json({ success: false, message: 'Playlist not found' })

    // Allow access if public, or if the requester owns it
    const ownerId = pl.owner?.toString()
    const userId  = req.user?._id?.toString()
    if (pl.privacy === 'private' && ownerId !== userId) {
      return res.status(403).json({ success: false, message: 'Private playlist' })
    }

    // Populate videos
    const videoIds = pl.videos.map(v => v.video).filter(Boolean)
    const videos   = await Video.find({ _id: { $in: videoIds }, status: { $in: ['published', 'unlisted', 'private'] } })
      .select('title thumbnailUrl duration viewCount uploader createdAt')
      .populate('uploader', 'displayName username avatar')
      .lean()

    // Preserve playlist order
    const videoMap = {}
    videos.forEach(v => { videoMap[v._id.toString()] = v })
    const orderedVideos = videoIds
      .map(id => videoMap[id?.toString()])
      .filter(Boolean)

    // Owner info
    const owner = await require('../models/User').findById(pl.owner)
      .select('displayName username avatar').lean()

    res.json({
      success: true,
      playlist: {
        _id:       pl._id,
        title:     pl.title,
        privacy:   pl.privacy,
        description: pl.description,
        createdAt: pl.createdAt,
        updatedAt: pl.updatedAt,
        owner,
        videos: orderedVideos,
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── GET /api/playlists/channel/:channelId — public playlists of a channel ──
exports.getChannelPlaylists = async (req, res) => {
  try {
    const { channelId } = req.params
    const isOwner = req.user && String(req.user._id) === String(channelId)

    // If viewer is the owner, show all playlists; otherwise only public ones
    const query = isOwner
      ? { owner: channelId }
      : { owner: channelId, privacy: 'public' }

    const playlists = await Playlist.find(query)
      .sort({ updatedAt: -1 })
      .lean()

    const result = await Promise.all(playlists.map(async pl => {
      const firstVideoEntry = pl.videos?.[0]
      let thumbnail = pl.thumbnail || ''
      if (!thumbnail && firstVideoEntry) {
        const vid = await Video.findById(firstVideoEntry.video).select('thumbnailUrl').lean()
        thumbnail = vid?.thumbnailUrl || ''
      }
      return {
        _id:       pl._id,
        title:     pl.title,
        privacy:   pl.privacy,
        count:     pl.videos?.length || 0,
        thumbnail,
        updatedAt: pl.updatedAt,
      }
    }))

    res.json({ success: true, playlists: result })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}


exports.getVideoPlaylistState = async (req, res) => {
  try {
    const playlists = await Playlist.find({ owner: req.user._id }).select('title videos privacy').lean()
    const result = playlists.map(pl => ({
      _id:       pl._id,
      title:     pl.title,
      privacy:   pl.privacy,
      hasVideo:  pl.videos.some(v => v.video?.toString() === req.params.videoId),
    }))
    res.json({ success: true, playlists: result })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}