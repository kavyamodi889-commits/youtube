// FILE: server/controllers/notification.controller.js
const Notification = require('../models/Notification')
const User         = require('../models/User')

// Lazy-load web-push — prevents server crash if package not yet installed
function getWebPush() {
  try {
    const webpush = require('web-push')
    if (process.env.VAPID_EMAIL && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(
        process.env.VAPID_EMAIL,
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      )
    }
    return webpush
  } catch {
    return null
  }
}

// ── Helper: send push to a user ───────────────────────────────────
async function sendPushToUser(userId, payload) {
  try {
    const webpush = getWebPush()
    if (!webpush) return // web-push not installed yet

    const user = await User.findById(userId).select('pushSubscription')
    if (!user?.pushSubscription?.endpoint) return

    await webpush.sendNotification(
      user.pushSubscription,
      JSON.stringify(payload)
    )
  } catch (err) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      await User.findByIdAndUpdate(userId, { pushSubscription: null })
    }
  }
}

// ── Helper: create a notification + emit via Socket.IO ────────────
async function createNotification({ recipient, sender, type, title, message, imageUrl, linkUrl, linkType, linkId, priority = 'default' }) {
  if (String(recipient) === String(sender)) return // don't notify yourself

  const notif = await Notification.create({
    recipient, sender, type, title, message,
    imageUrl, linkUrl, linkType, linkId, priority,
  })

  // Populate sender for the socket event
  const populated = await notif.populate('sender', 'displayName username avatar')

  // ── Emit real-time via Socket.IO ────────────────────────────────
  try {
    require('../lib/socketIO').emitTo(`user:${recipient}`, 'notification:new', populated.toObject())
  } catch {} // silent — socket may not be available in all contexts

  // Also send web push if available (optional, won't crash if missing)
  if (priority !== 'default') {
    await sendPushToUser(recipient, {
      title,
      body:  message,
      image: imageUrl,
      url:   linkUrl || '/',
      tag:   type,
      priority,
    })
  }

  return notif
}

// ── GET /api/notifications — list for logged-in user ─────────────
exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 30, unreadOnly } = req.query
    const filter = { recipient: req.user._id, isDismissed: false }
    if (unreadOnly === 'true') filter.isRead = false

    const [notifications, totalUnread] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .populate('sender', 'displayName username avatar handle'),
      Notification.countDocuments({ recipient: req.user._id, isRead: false, isDismissed: false }),
    ])

    res.json({ success: true, notifications, totalUnread })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── PATCH /api/notifications/:id/read ────────────────────────────
exports.markRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true, readAt: new Date() }
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── PATCH /api/notifications/read-all ────────────────────────────
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── DELETE /api/notifications/:id ────────────────────────────────
exports.dismiss = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isDismissed: true }
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── DELETE /api/notifications/all ────────────────────────────────
exports.dismissAll = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id },
      { isDismissed: true }
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── POST /api/notifications/push/subscribe ───────────────────────
// Save push subscription from browser
exports.savePushSubscription = async (req, res) => {
  try {
    const { subscription } = req.body
    if (!subscription?.endpoint)
      return res.status(400).json({ success: false, message: 'Invalid subscription' })

    await User.findByIdAndUpdate(req.user._id, { pushSubscription: subscription })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── DELETE /api/notifications/push/unsubscribe ───────────────────
exports.removePushSubscription = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { pushSubscription: null })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── Export helper for other controllers to use ───────────────────
exports.createNotification = createNotification
exports.sendPushToUser     = sendPushToUser