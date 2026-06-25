// FILE: server/controllers/interactionController.js
const Video    = require('../models/Video')
const User     = require('../models/User')
const Comment  = require('../models/Comment')
const mongoose = require('mongoose')

// ── GET /api/interactions/:videoId — interaction state ────────────
exports.getState = async (req, res) => {
  try {
    const { videoId } = req.params
    const user = await User.findById(req.user._id)
      .select('likedVideos dislikedVideos savedVideos watchLater subscriptions')

    const video = await Video.findById(videoId).select('uploader')

    const liked      = user.likedVideos.some(id => id.equals(videoId))
    const disliked   = user.dislikedVideos.some(id => id.equals(videoId))
    const saved      = user.savedVideos.some(id => id.equals(videoId))
    const watchLater = user.watchLater.some(id => id.equals(videoId))
    const subscribed = video?.uploader
      ? user.subscriptions.some(id => id.equals(video.uploader))
      : false

    res.json({ success: true, liked, disliked, saved, watchLater, subscribed })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── POST /api/interactions/:videoId/like ──────────────────────────
exports.toggleLike = async (req, res) => {
  try {
    const { videoId } = req.params
    const user = await User.findById(req.user._id)
      .select('likedVideos dislikedVideos')

    const liked    = user.likedVideos.some(id => id.equals(videoId))
    const disliked = user.dislikedVideos.some(id => id.equals(videoId))

    let likeDelta = 0, dislikeDelta = 0

    if (liked) {
      user.likedVideos = user.likedVideos.filter(id => !id.equals(videoId))
      likeDelta = -1
    } else {
      user.likedVideos.push(videoId)
      likeDelta = 1
      if (disliked) {
        user.dislikedVideos = user.dislikedVideos.filter(id => !id.equals(videoId))
        dislikeDelta = -1
      }
    }

    await user.save()

    const video = await Video.findByIdAndUpdate(
      videoId,
      { $inc: { likeCount: likeDelta, dislikeCount: dislikeDelta } },
      { returnDocument: 'after' }
    ).select('likeCount dislikeCount uploader title thumbnailUrl')

    // Notify video owner when someone likes (not self-like, only on new like)
    if (!liked && likeDelta === 1) {
      try {
        if (String(video.uploader) !== String(req.user._id)) {
          const { createNotification } = require('./notification.controller')
          const liker = await User.findById(req.user._id).select('displayName username avatar')
          createNotification({
            recipient: video.uploader,
            sender:    req.user._id,
            type:      'like',
            title:     liker.displayName || liker.username,
            message:   `liked your video "${video.title?.slice(0, 50) || 'your video'}"`,
            imageUrl:  liker.avatar || null,
            linkUrl:   `/watch/${videoId}`,
            linkType:  'video',
            linkId:    videoId,
            priority:  'default',
          }).catch(() => {})
        }
      } catch {}
    }

    res.json({
      success: true,
      liked:   !liked,
      likeCount:    video.likeCount,
      dislikeCount: video.dislikeCount,
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── POST /api/interactions/:videoId/dislike ───────────────────────
exports.toggleDislike = async (req, res) => {
  try {
    const { videoId } = req.params
    const user = await User.findById(req.user._id)
      .select('likedVideos dislikedVideos')

    const liked    = user.likedVideos.some(id => id.equals(videoId))
    const disliked = user.dislikedVideos.some(id => id.equals(videoId))

    let likeDelta = 0, dislikeDelta = 0

    if (disliked) {
      user.dislikedVideos = user.dislikedVideos.filter(id => !id.equals(videoId))
      dislikeDelta = -1
    } else {
      user.dislikedVideos.push(videoId)
      dislikeDelta = 1
      if (liked) {
        user.likedVideos = user.likedVideos.filter(id => !id.equals(videoId))
        likeDelta = -1
      }
    }

    await user.save()

    const video = await Video.findByIdAndUpdate(
      videoId,
      { $inc: { likeCount: likeDelta, dislikeCount: dislikeDelta } },
      { returnDocument: 'after' }
    ).select('likeCount dislikeCount')

    res.json({
      success:     true,
      disliked:    !disliked,
      likeCount:    video.likeCount,
      dislikeCount: video.dislikeCount,
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── POST /api/interactions/:videoId/save ──────────────────────────
exports.toggleSave = async (req, res) => {
  try {
    const { videoId } = req.params
    const user  = await User.findById(req.user._id).select('savedVideos')
    const saved = user.savedVideos.some(id => id.equals(videoId))

    if (saved) user.savedVideos = user.savedVideos.filter(id => !id.equals(videoId))
    else       user.savedVideos.push(videoId)

    await user.save()
    res.json({ success: true, saved: !saved })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── POST /api/interactions/:videoId/watch-later ───────────────────
exports.toggleWatchLater = async (req, res) => {
  try {
    const { videoId } = req.params
    const user = await User.findById(req.user._id).select('watchLater')
    const inWL = user.watchLater.some(id => id.equals(videoId))

    if (inWL) user.watchLater = user.watchLater.filter(id => !id.equals(videoId))
    else      user.watchLater.push(videoId)

    await user.save()
    res.json({ success: true, watchLater: !inWL })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── POST /api/interactions/channel/:channelId/subscribe ───────────
exports.toggleSubscribe = async (req, res) => {
  try {
    const { channelId } = req.params
    if (channelId === req.user._id.toString())
      return res.status(400).json({ success: false, message: "Can't subscribe to yourself" })

    const user       = await User.findById(req.user._id).select('subscriptions displayName username avatar')
    const subscribed = user.subscriptions.some(id => id.equals(channelId))

    let delta = 0
    if (subscribed) {
      user.subscriptions = user.subscriptions.filter(id => !id.equals(channelId))
      delta = -1
    } else {
      user.subscriptions.push(channelId)
      delta = 1
    }
    await user.save()
    // Notify channel owner on new subscribe
    if (!subscribed) {
      const { createNotification } = require('./notification.controller')
      createNotification({
        recipient: channelId,
        sender:    req.user._id,
        type:      'subscription',
        title:     'New subscriber',
        message:   `${user.displayName || user.username} subscribed to your channel`,
        imageUrl:  user.avatar || null,
        linkUrl:   `/channel/${req.user._id}`,
        linkType:  'channel',
        linkId:    req.user._id,
        priority:  'high',
      }).catch(() => {})
    }

    const channel = await User.findByIdAndUpdate(
      channelId,
      { $inc: { subscriberCount: delta } },
      { new: true }
    ).select('subscriberCount')
    res.json({ success: true, subscribed: !subscribed, subscriberCount: channel.subscriberCount })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── GET /api/interactions/channel/:channelId/state ────────────────
exports.getChannelState = async (req, res) => {
  try {
    const { channelId } = req.params
    const [viewer, channel] = await Promise.all([
      User.findById(req.user._id).select('subscriptions'),
      User.findById(channelId).select('subscriberCount'),
    ])
    const subscribed = viewer.subscriptions.some(id => id.equals(channelId))
    res.json({ success: true, subscribed, subscriberCount: channel?.subscriberCount || 0 })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── GET /api/interactions/:videoId/comments ───────────────────────
exports.getComments = async (req, res) => {
  try {
    const { videoId } = req.params
    const { sort = 'top', page = 1, limit = 20 } = req.query

    const sortObj = sort === 'newest'
      ? { createdAt: -1 }
      : { isPinned: -1, likeCount: -1, createdAt: -1 }

    const skip = (page - 1) * limit

    const [comments, total] = await Promise.all([
      Comment.find({ video: videoId, parent: null, isDeleted: false })
        .sort(sortObj)
        .skip(skip)
        .limit(Number(limit))
        .populate('author', 'displayName username avatar handle isChannelVerified')
        .lean(),
      Comment.countDocuments({ video: videoId, parent: null, isDeleted: false }),
    ])

    const userId = req.user?._id?.toString()
    const enriched = comments.map(c => ({
      ...c,
      likedByMe: userId ? c.likes.some(id => id.toString() === userId) : false,
      likes: undefined,
    }))

    res.json({ success: true, comments: enriched, total })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── POST /api/interactions/:videoId/comments ──────────────────────
exports.addComment = async (req, res) => {
  try {
    const { videoId } = req.params
    const { text, parentId } = req.body
    if (!text?.trim()) return res.status(400).json({ success: false, message: 'Comment text required' })

    const video = await Video.findById(videoId).select('uploader commentCount allowComments title')
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' })
    if (!video.allowComments) return res.status(403).json({ success: false, message: 'Comments are disabled for this video' })

    if (parentId) {
      const parent = await Comment.findById(parentId)
      if (!parent || parent.isDeleted) return res.status(404).json({ success: false, message: 'Parent comment not found' })
    }

    const comment = await Comment.create({
      video:  videoId,
      author: req.user._id,
      text:   text.trim(),
      parent: parentId || null,
    })

    if (parentId) {
      await Comment.findByIdAndUpdate(parentId, { $inc: { replyCount: 1 } })
    }

    await Video.findByIdAndUpdate(videoId, { $inc: { commentCount: 1 } })
    await comment.populate('author', 'displayName username avatar handle isChannelVerified')

    try {
      if (String(video.uploader) !== String(req.user._id)) {
        const { createNotification } = require('./notification.controller')
        const author = comment.author
        createNotification({
          recipient: video.uploader,
          sender:    req.user._id,
          type:      'comment',
          title:     author.displayName || author.username,
          message:   `${parentId ? 'replied' : 'commented'}: "${text.trim().slice(0, 60)}${text.length > 60 ? '…' : ''}"`,
          imageUrl:  author.avatar || null,
          linkUrl:   `/watch/${videoId}`,
          linkType:  'video',
          linkId:    videoId,
          priority:  'default',
        }).catch(() => {})
      }
    } catch {}

    res.status(201).json({
      success: true,
      comment: { ...comment.toObject(), likedByMe: false },
      commentCount: (video.commentCount || 0) + 1,
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── DELETE /api/interactions/:videoId/comments/:commentId ─────────
exports.deleteComment = async (req, res) => {
  try {
    const { videoId, commentId } = req.params

    const comment = await Comment.findById(commentId)
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' })

    const video = await Video.findById(videoId).select('uploader')
    const isOwner   = String(comment.author) === String(req.user._id)
    const isCreator = video && String(video.uploader) === String(req.user._id)
    if (!isOwner && !isCreator)
      return res.status(403).json({ success: false, message: 'Not authorised' })

    comment.isDeleted = true
    comment.text      = '[deleted]'
    await comment.save()

    if (comment.parent) {
      await Comment.findByIdAndUpdate(comment.parent, { $inc: { replyCount: -1 } })
    }

    await Video.findByIdAndUpdate(videoId, { $inc: { commentCount: -1 } })

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── GET /api/interactions/:videoId/comments/:commentId/replies ─────
exports.getReplies = async (req, res) => {
  try {
    const { commentId } = req.params
    const { page = 1, limit = 10 } = req.query
    const skip = (page - 1) * limit

    const [replies, total] = await Promise.all([
      Comment.find({ parent: commentId, isDeleted: false })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('author', 'displayName username avatar handle isChannelVerified')
        .lean(),
      Comment.countDocuments({ parent: commentId, isDeleted: false }),
    ])

    const userId = req.user?._id?.toString()
    const enriched = replies.map(r => ({
      ...r,
      likedByMe: userId ? r.likes.some(id => id.toString() === userId) : false,
      likes: undefined,
    }))

    res.json({ success: true, replies: enriched, total })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── POST /api/interactions/:videoId/comments/:commentId/like ───────
exports.likeComment = async (req, res) => {
  try {
    const { commentId } = req.params
    const userId = req.user._id

    const comment = await Comment.findById(commentId)
    if (!comment || comment.isDeleted)
      return res.status(404).json({ success: false, message: 'Comment not found' })

    const alreadyLiked = comment.likes.some(id => id.equals(userId))
    if (alreadyLiked) {
      comment.likes     = comment.likes.filter(id => !id.equals(userId))
      comment.likeCount = Math.max(0, comment.likeCount - 1)
    } else {
      comment.likes.push(userId)
      comment.likeCount = comment.likeCount + 1
    }
    await comment.save()

    res.json({ success: true, liked: !alreadyLiked, likeCount: comment.likeCount })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── POST /api/interactions/:videoId/comments/:commentId/report ─────
exports.reportComment = async (req, res) => {
  try {
    const { commentId } = req.params
    const { reason = 'other', details = '' } = req.body
    const userId = req.user._id

    const comment = await Comment.findById(commentId)
    if (!comment || comment.isDeleted)
      return res.status(404).json({ success: false, message: 'Comment not found' })

    const alreadyReported = comment.reports.some(r => r.reporter.equals(userId))
    if (alreadyReported)
      return res.json({ success: true, alreadyReported: true })

    comment.reports.push({ reporter: userId, reason, details })
    comment.reportCount = comment.reports.length
    if (comment.reportCount >= 3) comment.isFlagged = true
    await comment.save()

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── POST /api/interactions/:videoId/share ─────────────────────────
exports.shareVideo = async (req, res) => {
  try {
    await Video.findByIdAndUpdate(req.params.videoId, { $inc: { shareCount: 1 } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── GET /api/interactions/watch-later ─────────────────────────────
exports.getWatchLater = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('watchLater')
      .populate({ path: 'watchLater', select: 'title thumbnailUrl duration viewCount createdAt uploader isShort', populate: { path: 'uploader', select: 'displayName username avatar handle' } })
    res.json({ success: true, videos: user.watchLater.reverse() })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── GET /api/interactions/liked ───────────────────────────────────
exports.getLikedVideos = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('likedVideos')
      .populate({ path: 'likedVideos', select: 'title thumbnailUrl duration viewCount createdAt uploader isShort', populate: { path: 'uploader', select: 'displayName username avatar handle' } })
    res.json({ success: true, videos: user.likedVideos.reverse() })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── GET /api/interactions/subscriptions ───────────────────────────
exports.getSubscriptionFeed = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('subscriptions')
    const videos = await Video.find({
      uploader:   { $in: user.subscriptions },
      status:     'published',
      visibility: 'public',
    })
      .sort({ createdAt: -1 })
      .limit(60)
      .populate('uploader', 'displayName username avatar handle isChannelVerified')
    res.json({ success: true, videos })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
// ── POST /api/interactions/:videoId/not-interested ────────────────
exports.notInterested = async (req, res) => {
  try {
    const { videoId } = req.params
    const user = await User.findById(req.user._id).select('notInterestedVideos')
    const already = user.notInterestedVideos.some(id => id.equals(videoId))
    if (!already) {
      user.notInterestedVideos.push(videoId)
      await user.save()
    }
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── POST /api/interactions/channel/:channelId/hide ────────────────
exports.hideChannel = async (req, res) => {
  try {
    const { channelId } = req.params
    const user = await User.findById(req.user._id).select('hiddenChannels')
    const already = user.hiddenChannels.some(id => id.equals(channelId))
    if (!already) {
      user.hiddenChannels.push(channelId)
      await user.save()
    }
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── POST /api/interactions/:videoId/report ────────────────────────
exports.reportVideo = async (req, res) => {
  try {
    const { videoId } = req.params
    const { reason = 'other', details = '' } = req.body
    const Report = require('../models/Report')

    // Avoid duplicate reports from the same user for the same video
    const existing = await Report.findOne({
      reporter:   req.user._id,
      targetId:   videoId,
      targetType: 'Video',
    })
    if (existing) {
      return res.json({ success: true, alreadyReported: true })
    }

    await Report.create({
      reporter:   req.user._id,
      targetType: 'Video',
      targetId:   videoId,
      reason,
      details,
      status:     'pending',
    })

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}