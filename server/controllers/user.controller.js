// FILE: server/controllers/user.controller.js
const WatchHistory = require('../models/WatchHistory')
const User         = require('../models/User')

// ── GET /api/user/history ─────────────────────────────────────────
exports.getHistory = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    const entries = await WatchHistory.find({ user: req.user._id })
      .sort({ lastWatchedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate({
        path: 'video',
        select: 'title thumbnailUrl duration viewCount createdAt description uploader status',
        populate: {
          path: 'uploader',
          select: 'displayName username avatar isChannelVerified',
        },
      })

    const history = entries
      .filter(e => e.video && e.video.status === 'published')
      .map(e => ({
        ...e.video.toObject(),
        lastWatchedAt:   e.lastWatchedAt,
        watchedDuration: e.watchedDuration,
        progressPercent: e.progressPercent,
        resumeAt:        e.resumeAt,
      }))

    const total = await WatchHistory.countDocuments({ user: req.user._id })

    res.json({ success: true, history, total, page: Number(page) })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── DELETE /api/user/history/:videoId ─────────────────────────────
exports.removeFromHistory = async (req, res) => {
  try {
    await WatchHistory.deleteOne({ user: req.user._id, video: req.params.videoId })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── DELETE /api/user/history ──────────────────────────────────────
exports.clearHistory = async (req, res) => {
  try {
    await WatchHistory.deleteMany({ user: req.user._id })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── GET /api/user/profile ─────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })
    res.json({ success: true, user: user.toPublicProfile() })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── GET /api/user/:userId/public — public channel profile ─────────
exports.getPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('displayName username avatar handle isChannelVerified subscriberCount totalViews videoCount bio createdAt bannerImage website location links')
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })
    res.json({ success: true, user })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── PATCH /api/user/profile — update own profile ──────────────────
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })

    const { displayName, bio, handle, website, location, links } = req.body

    // Handle unique handle check
    if (handle !== undefined && handle !== user.handle) {
      const normalized = handle.toLowerCase().trim()
      if (normalized) {
        const taken = await User.findOne({ handle: normalized, _id: { $ne: user._id } })
        if (taken) return res.status(409).json({ success: false, message: 'Handle already taken' })
        user.handle = normalized
      }
    }

    if (displayName !== undefined) user.displayName = displayName
    if (bio         !== undefined) user.bio         = bio
    if (website     !== undefined) user.website     = website
    if (location    !== undefined) user.location    = location

    // Social links — sent as JSON string or array
    if (links !== undefined) {
      try {
        const parsed = typeof links === 'string' ? JSON.parse(links) : links
        if (Array.isArray(parsed)) {
          user.links = parsed.slice(0, 5).map(l => ({
            label: String(l.label || '').slice(0, 30),
            url:   String(l.url   || '').slice(0, 200),
          }))
        }
      } catch (_) {
        // ignore malformed links
      }
    }

    // Avatar upload via Cloudinary if file sent (multipart/form-data)
    if (req.file) {
      const cloudinary = require('../config/cloudinary')

      // Delete old avatar from Cloudinary if it exists
      if (user.avatarPublicId) {
        await cloudinary.uploader.destroy(user.avatarPublicId).catch(() => {})
      }

      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'aura/avatars', transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }] },
          (err, r) => err ? reject(err) : resolve(r)
        )
        stream.end(req.file.buffer)
      })
      user.avatar         = result.secure_url
      user.avatarPublicId = result.public_id
    }

    await user.save()
    res.json({ success: true, user: user.toPublicProfile() })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── DELETE /api/user/account — delete own account ─────────────────
exports.deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id)
    res.clearCookie('refreshToken')
    res.json({ success: true, message: 'Account deleted' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── GET /api/user/settings ────────────────────────────────────────
exports.getSettings = async (req, res) => {
  try {
    const user = await require('../models/User').findById(req.user._id)
      .select('displayName username email handle bio website location avatar bannerImage links theme language notificationPrefs isPrivate showLikedVideos showSubscriptions authProvider browserPermissions')
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })
    res.json({ success: true, settings: {
      displayName: user.displayName,
      username:    user.username,
      email:       user.email,
      handle:      user.handle || '',
      bio:         user.bio    || '',
      website:     user.website || '',
      location:    user.location || '',
      avatar:      user.avatar  || '',
      bannerImage: user.bannerImage || '',
      links:       user.links || [],
      theme:       user.theme    || 'dark',
      language:    user.language || 'en',
      notificationPrefs: user.notificationPrefs || {
        subscriptions: true, likes: true, comments: true, live: true, system: true,
      },
      isPrivate:         user.isPrivate         || false,
      showLikedVideos:   user.showLikedVideos   ?? true,
      showSubscriptions: user.showSubscriptions ?? true,
      authProvider: user.authProvider || 'local',
      browserPermissions: user.browserPermissions || {},
    }})
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── PATCH /api/user/settings ──────────────────────────────────────
exports.updateSettings = async (req, res) => {
  try {
    const User = require('../models/User')
    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })

    const {
      theme, language,
      notificationPrefs,
      isPrivate, showLikedVideos, showSubscriptions,
      browserPermissions,
    } = req.body

    if (theme    !== undefined) user.theme    = theme
    if (language !== undefined) user.language = language
    if (notificationPrefs !== undefined) {
      user.notificationPrefs = { ...user.notificationPrefs, ...notificationPrefs }
    }
    if (isPrivate         !== undefined) user.isPrivate         = isPrivate
    if (showLikedVideos   !== undefined) user.showLikedVideos   = showLikedVideos
    if (showSubscriptions !== undefined) user.showSubscriptions = showSubscriptions
    if (browserPermissions !== undefined) {
      user.browserPermissions = { ...user.browserPermissions, ...browserPermissions }
    }

    await user.save()
    res.json({ success: true, message: 'Settings saved' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── PATCH /api/user/password ──────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const bcrypt = require('bcryptjs')
    const User   = require('../models/User')
    const user   = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })
    if (user.authProvider !== 'local')
      return res.status(400).json({ success: false, message: 'Password change not available for social login accounts' })

    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: 'Current and new password required' })
    if (newPassword.length < 8)
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' })

    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) return res.status(401).json({ success: false, message: 'Current password is incorrect' })

    user.password = await bcrypt.hash(newPassword, 12)
    await user.save()
    res.json({ success: true, message: 'Password changed successfully' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}