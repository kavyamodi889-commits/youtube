// FILE: server/controllers/admin.controller.js
// AURA Admin — all admin-only API handlers
// All field names verified against real Mongoose models:
//   Video:      status = "processing|published|unlisted|private|deleted|rejected"
//               viewCount, likeCount, dislikeCount (NOT viewerCount)
//               No boolean "flagged" field — flagging derived from Report model
//   LiveStream: status = "scheduled|live|ended|cancelled"
//               currentViewers, peakViewers (NOT viewerCount)
//   Payment:    payer (ref User, NOT "user"), membershipTier (NOT "plan")
//               status = "created|captured|failed|refunded|disputed"
//   User:       role, isBanned, banReason, banExpiresAt, isChannelVerified, membershipTier

const User       = require('../models/User')
const AdminUser  = require('../models/AdminUser')
const Video      = require('../models/Video')
const Report     = require('../models/Report')
const LiveStream = require('../models/LiveStream')
const Payment    = require('../models/Payment')

const paginate = (query = {}) => {
  const page  = Math.max(1, parseInt(query.page)  || 1)
  const limit = Math.min(100, parseInt(query.limit) || 20)
  return { skip: (page - 1) * limit, limit, page }
}

// ── DASHBOARD ────────────────────────────────────────────────────────────────
exports.getDashboard = async (req, res) => {
  try {
    const monthStart   = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const todayStart   = new Date(new Date().setHours(0,0,0,0))

    const [
      totalUsers, totalVideos, totalReports, pendingReports,
      liveNow, premiumUsers, newUsersToday, viewsAgg,
      revenueAgg, dailyUsers, dailyViews, categoryBreakdown,
      topCreators, recentReports,
    ] = await Promise.all([
      User.countDocuments(),
      Video.countDocuments(),
      Report.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
      LiveStream.countDocuments({ status: 'live' }),
      User.countDocuments({ membershipTier: { $ne: 'none' } }),
      User.countDocuments({ createdAt: { $gte: todayStart } }),
      Video.aggregate([{ $group: { _id: null, total: { $sum: '$viewCount' } } }]),
      Payment.aggregate([
        { $match: { status: 'captured', createdAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: '+05:30' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Video.aggregate([
        { $match: { status: 'published', updatedAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt', timezone: '+05:30' } }, views: { $sum: '$viewCount' } } },
        { $sort: { _id: 1 } }
      ]),
      Video.aggregate([
        { $match: { status: 'published' } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 8 }
      ]),
      User.find({ role: 'creator' }).sort({ subscriberCount: -1 }).limit(5)
        .select('username displayName avatar subscriberCount videoCount isChannelVerified'),
      Report.find({ status: 'pending' }).sort({ createdAt: -1 }).limit(5)
        .populate('reporter', 'username displayName avatar'),
    ])

    res.json({
      success: true,
      stats: {
        totalUsers, totalVideos, totalReports, pendingReports, liveNow,
        premiumUsers, newUsersToday,
        totalViews:    viewsAgg[0]?.total || 0,
        revenueMonth:  Math.round((revenueAgg[0]?.total || 0) / 100),
      },
      charts: { dailyUsers, dailyVideos: dailyViews, categoryBreakdown },
      topCreators,
      recentReports,
    })
  } catch (err) {
    console.error('[admin] getDashboard:', err.message)
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── USERS ────────────────────────────────────────────────────────────────────
exports.getUsers = async (req, res) => {
  try {
    const { skip, limit, page } = paginate(req.query)
    const { search, role, status } = req.query
    const filter = {}
    if (search) filter.$or = [
      { username: { $regex: search, $options: 'i' } },
      { email:    { $regex: search, $options: 'i' } },
      { displayName: { $regex: search, $options: 'i' } },
    ]
    if (role   && role   !== 'all') filter.role    = role
    if (status === 'banned')        filter.isBanned = true
    if (status === 'active')        filter.isBanned = false
    if (status === 'verified')      filter.isChannelVerified = true

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
        .select('username displayName email avatar role isVerified isChannelVerified isBanned banReason membershipTier subscriberCount videoCount totalViews createdAt authProvider'),
      User.countDocuments(filter)
    ])
    res.json({ success: true, users, total, page, pages: Math.ceil(total / limit) })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

exports.banUser = async (req, res) => {
  try {
    const { reason, duration } = req.body
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })
    if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot ban an admin' })
    user.isBanned     = true
    user.banReason    = reason || 'Policy violation'
    user.banExpiresAt = duration ? new Date(Date.now() + duration * 86400000) : null
    await user.save()
    res.json({ success: true, message: 'User banned' })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

exports.unbanUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isBanned: false, banReason: '', banExpiresAt: null })
    res.json({ success: true, message: 'User unbanned' })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

exports.changeRole = async (req, res) => {
  try {
    const { role } = req.body
    // Admin cannot manually set 'creator' role — that is auto-granted on first video upload
    if (!['user', 'moderator'].includes(role))
      return res.status(400).json({ success: false, message: 'Invalid role. Admin can only set "user" or "moderator". Creator role is granted automatically when a user uploads their first video.' })
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('username role')
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })
    res.json({ success: true, message: `Role updated to ${role}`, user })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

exports.verifyChannel = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })
    user.isChannelVerified = !user.isChannelVerified
    user.isVerified        = user.isChannelVerified
    await user.save()
    res.json({ success: true, isChannelVerified: user.isChannelVerified })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })
    if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot delete an admin' })
    await User.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: 'User deleted' })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

// ── VIDEOS ───────────────────────────────────────────────────────────────────
// status enum: "processing" | "published" | "unlisted" | "private" | "deleted" | "rejected"
exports.getVideos = async (req, res) => {
  try {
    const { skip, limit, page } = paginate(req.query)
    const { search, status, flagged } = req.query
    const filter = {}
    if (search) filter.$or = [{ title: { $regex: search, $options: 'i' } }]
    if (status && status !== 'all') filter.status = status

    // Flagged = videos with pending reports against them
    if (flagged === 'true') {
      const flaggedIds = await Report.distinct('targetId', { targetType: 'Video', status: 'pending' })
      filter._id = { $in: flaggedIds }
    }

    const [videos, total] = await Promise.all([
      Video.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
        .select('title thumbnailUrl viewCount likeCount dislikeCount status category duration createdAt uploader isShort flagReason isLiveVOD sourceStreamId')
        .populate('uploader', 'username displayName avatar'),
      Video.countDocuments(filter)
    ])

    // Derive flagged boolean from Report collection
    const videoIds   = videos.map(v => v._id)
    const flaggedIds = await Report.distinct('targetId', { targetType: 'Video', status: 'pending', targetId: { $in: videoIds } })
    const flaggedSet = new Set(flaggedIds.map(id => id.toString()))

    const result = videos.map(v => ({ ...v.toObject(), flagged: flaggedSet.has(v._id.toString()) }))
    res.json({ success: true, videos: result, total, page, pages: Math.ceil(total / limit) })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

exports.setVideoStatus = async (req, res) => {
  try {
    const { status } = req.body
    // MUST match Video model enum exactly
    const allowed = ['published', 'private', 'unlisted', 'deleted', 'rejected']
    if (!allowed.includes(status))
      return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${allowed.join(', ')}` })
    const video = await Video.findByIdAndUpdate(req.params.id, { status }, { new: true }).select('title status')
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' })
    res.json({ success: true, video })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

exports.dismissVideoReports = async (req, res) => {
  try {
    await Report.updateMany(
      { targetType: 'Video', targetId: req.params.id, status: 'pending' },
      { status: 'dismissed', reviewedBy: req.adminUser._id, reviewedAt: new Date(), reviewNote: 'Dismissed by admin', actionTaken: 'none' }
    )
    res.json({ success: true })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

exports.deleteVideo = async (req, res) => {
  try {
    await Video.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: 'Video deleted' })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

// ── REPORTS ──────────────────────────────────────────────────────────────────
exports.getReports = async (req, res) => {
  try {
    const { skip, limit, page } = paginate(req.query)
    const { status, targetType } = req.query
    const filter = {}
    if (status     && status     !== 'all') filter.status     = status
    if (targetType && targetType !== 'all') filter.targetType = targetType

    const [rawReports, total] = await Promise.all([
      Report.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
        .populate('reporter',   'username displayName avatar')
        .populate('reviewedBy', 'username displayName'),
      Report.countDocuments(filter)
    ])

    // Resolve targetTitle for each report (polymorphic lookup)
    const Video      = require('../models/Video')
    const Comment    = require('../models/Comment')
    const User       = require('../models/User')
    const LiveStream = require('../models/LiveStream')

    const reports = await Promise.all(rawReports.map(async r => {
      const obj = r.toObject()
      try {
        if (r.targetType === 'Video') {
          const v = await Video.findById(r.targetId).select('title thumbnailUrl').lean()
          obj.targetTitle = v?.title || null
          obj.targetThumbnail = v?.thumbnailUrl || null
        } else if (r.targetType === 'Comment') {
          const c = await Comment.findById(r.targetId).select('text').lean()
          obj.targetTitle = c?.text ? c.text.slice(0, 80) : null
        } else if (r.targetType === 'User') {
          const u = await User.findById(r.targetId).select('username displayName').lean()
          obj.targetTitle = u ? (u.displayName || u.username) : null
        } else if (r.targetType === 'LiveStream') {
          const ls = await LiveStream.findById(r.targetId).select('title thumbnailUrl').lean()
          obj.targetTitle = ls?.title || null
          obj.targetThumbnail = ls?.thumbnailUrl || null
        }
      } catch { /* ignore lookup errors */ }
      return obj
    }))

    res.json({ success: true, reports, total, page, pages: Math.ceil(total / limit) })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

exports.actionReport = async (req, res) => {
  try {
    const { action, reviewNote } = req.body
    // Report.actionTaken enum: "none"|"warned"|"deleted"|"banned"|"escalated"|null
    const statusMap = { dismiss:'dismissed', warn:'actioned', delete:'actioned', ban:'actioned', escalate:'reviewed' }
    const actionMap = { dismiss:'none',      warn:'warned',   delete:'deleted',  ban:'banned',   escalate:'escalated' }
    if (!statusMap[action])
      return res.status(400).json({ success: false, message: 'Invalid action. Use: dismiss, warn, delete, ban, escalate' })

    const report = await Report.findByIdAndUpdate(req.params.id, {
      status:      statusMap[action],
      actionTaken: actionMap[action],
      reviewedBy:  req.adminUser._id,
      reviewNote:  reviewNote || '',
      reviewedAt:  new Date(),
    }, { new: true })

    if (!report) return res.status(404).json({ success: false, message: 'Report not found' })
    res.json({ success: true, report })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

// ── LIVE STREAMS ─────────────────────────────────────────────────────────────
// LiveStream.currentViewers (NOT viewerCount), status: "scheduled|live|ended|cancelled"
exports.getLiveStreams = async (req, res) => {
  try {
    const { skip, limit, page } = paginate(req.query)
    const { status } = req.query
    const filter = {}
    if (status && status !== 'all') filter.status = status

    const [streams, total, lifetimeStats] = await Promise.all([
      LiveStream.find(filter).sort({ startedAt: -1 }).skip(skip).limit(limit)
        .populate('host', 'username displayName avatar isChannelVerified'),
      LiveStream.countDocuments(filter),
      LiveStream.aggregate([{
        $group: {
          _id: null,
          lifetimeViews:    { $sum: '$totalViews' },
          lifetimeDuration: { $sum: '$duration' },
          totalAll:         { $sum: 1 },
        }
      }])
    ])
    const ls = lifetimeStats[0] || {}
    res.json({
      success: true, streams, total, page, pages: Math.ceil(total / limit),
      lifetimeViews:    ls.lifetimeViews    || 0,
      lifetimeDuration: ls.lifetimeDuration || 0,
      totalAll:         ls.totalAll         || 0,
    })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

exports.endLiveStream = async (req, res) => {
  try {
    // Use currentViewers (real field name), not viewerCount
    const stream = await LiveStream.findByIdAndUpdate(req.params.id,
      { status: 'ended', endedAt: new Date(), currentViewers: 0 },
      { new: true }
    )
    if (!stream) return res.status(404).json({ success: false, message: 'Stream not found' })
    res.json({ success: true, stream })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

// ── PAYMENTS ─────────────────────────────────────────────────────────────────
// Payment.payer (not user), Payment.membershipTier (not plan)
exports.getPayments = async (req, res) => {
  try {
    const { skip, limit, page } = paginate(req.query)
    const { status, plan, type } = req.query
    const filter = {}
    if (status && status !== 'all') filter.status         = status
    if (plan   && plan   !== 'all') filter.membershipTier = plan
    // type filter: 'paid' = Razorpay membership only, 'reward' = focus_reward, 'all' = everything
    if (type === 'reward') filter.type = 'focus_reward'
    else if (type === 'paid') filter.type = 'membership'
    // default: show all types

    const [payments, total, revenueAgg, rewardCount] = await Promise.all([
      Payment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
        .populate('payer', 'username displayName email avatar'),
      Payment.countDocuments(filter),
      Payment.aggregate([{ $facet: {
        revenue:  [{ $match: { status:'captured', type: { $ne: 'focus_reward' } } }, { $group: { _id:null, total:{ $sum:'$amount' }, count:{ $sum:1 } } }],
        refunded: [{ $match: { status:'refunded' } }, { $group: { _id:null, total:{ $sum:'$amountRefunded' } } }],
        failed:   [{ $match: { status:'failed'   } }, { $count:'n' }],
      }}]),
      Payment.countDocuments({ type: 'focus_reward', status: 'captured' }),
    ])

    const r = revenueAgg[0]
    const summary = {
      revenue:     Math.round((r.revenue[0]?.total   || 0) / 100),
      count:        r.revenue[0]?.count  || 0,
      refunded:     Math.round((r.refunded[0]?.total || 0) / 100),
      failed:       r.failed[0]?.n       || 0,
      focusRewards: rewardCount,
    }

    // Remap payer → user, membershipTier → plan, add isFocusReward flag
    const mapped = payments.map(p => ({
      ...p.toObject(),
      user:          p.payer,
      plan:          p.membershipTier,
      isFocusReward: p.type === 'focus_reward',
      rewardTrigger: p.rewardTrigger || null,
      rewardMonth:   p.rewardMonth   || null,
    }))

    res.json({ success: true, payments: mapped, total, page, pages: Math.ceil(total / limit), summary })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

// ── ANALYTICS ────────────────────────────────────────────────────────────────
exports.getAnalytics = async (req, res) => {
  try {
    const days  = Math.min(90, parseInt(req.query.days) || 7)
    const since = new Date(Date.now() - days * 86400000)

    const [dailyUsers, dailyViews, categoryBreakdown, revenueByPlan, userStats, videoStats, liveStats] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format:'%Y-%m-%d', date:'$createdAt', timezone:'+05:30' } }, count:{ $sum:1 } } },
        { $sort: { _id:1 } }
      ]),
      Video.aggregate([
        { $match: { status:'published', updatedAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format:'%Y-%m-%d', date:'$updatedAt', timezone:'+05:30' } }, views:{ $sum:'$viewCount' } } },
        { $sort: { _id:1 } }
      ]),
      Video.aggregate([
        { $match: { status:'published' } },
        { $group: { _id:'$category', count:{ $sum:1 }, views:{ $sum:'$viewCount' } } },
        { $sort: { count:-1 } }, { $limit:10 }
      ]),
      User.aggregate([
        { $match: { membershipTier:{ $ne:'none' } } },
        { $group: { _id:'$membershipTier', count:{ $sum:1 } } },
        { $sort: { count:-1 } }
      ]),
      User.aggregate([{ $group: { _id:null,
        totalUsers:   { $sum:1 },
        premiumUsers: { $sum:{ $cond:[{ $ne:['$membershipTier','none'] },1,0] } },
        bannedUsers:  { $sum:{ $cond:['$isBanned',1,0] } },
        creators:     { $sum:{ $cond:[{ $eq:['$role','creator'] },1,0] } },
      }}]),
      Video.aggregate([{ $group: { _id:null,
        totalVideos:    { $sum:1 },
        totalViews:     { $sum:'$viewCount' },
        totalLikes:     { $sum:'$likeCount' },
        totalDuration:  { $sum:'$duration' },
      }}]),
      LiveStream.aggregate([{ $group: { _id:null,
        totalLiveViews:   { $sum:'$totalViews' },
        totalLiveStreams: { $sum:1 },
      }}]),
    ])

    res.json({
      success: true, dailyUsers, dailyViews, categoryBreakdown, revenueByPlan,
      totals: { ...(userStats[0]||{}), ...(videoStats[0]||{}), ...(liveStats[0]||{}) },
    })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

// ── SETTINGS FLAGS ───────────────────────────────────────────────────────────
const DEFAULT_FLAGS = {
  maintenanceMode:false, registrationOpen:true, premiumEnabled:true,
  liveEnabled:true, shortsEnabled:true, adsEnabled:true,
  emailVerifRequired:true, autoModeration:true, profanityFilter:true,
  spamDetection:true, twoFARequired:false, focusModeEnabled:true,
  aiSummaries:true, pushNotifEnabled:true, analyticsEnabled:true,
}

exports.getFlags = async (req, res) => {
  try {
    // Flags stored on AdminUser doc (req.adminUser set by protectAdmin middleware)
    const admin = await AdminUser.findById(req.adminUser._id).select('meta')
    const flags = (admin?.meta && admin.meta instanceof Map)
      ? (admin.meta.get('platformFlags') || DEFAULT_FLAGS)
      : DEFAULT_FLAGS
    res.json({ success: true, flags })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

exports.updateFlags = async (req, res) => {
  try {
    const { flags } = req.body
    if (!flags || typeof flags !== 'object')
      return res.status(400).json({ success: false, message: 'flags object required' })
    const admin   = await AdminUser.findById(req.adminUser._id)
    if (!admin.meta) admin.meta = new Map()
    const current = admin.meta.get('platformFlags') || DEFAULT_FLAGS
    admin.meta.set('platformFlags', { ...current, ...flags })
    await admin.save()
    res.json({ success: true, flags: admin.meta.get('platformFlags') })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

exports.getAdminTeam = async (req, res) => {
  try {
    // Query AdminUser collection (separate from viewer User table)
    const team = await AdminUser.find({ isActive: true })
      .sort({ role: 1, createdAt: 1 })
      .select('username displayName avatar role createdAt lastLoginAt permissions')
    res.json({ success: true, team })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

// ── ADMIN TEAM MANAGEMENT ─────────────────────────────────────────────────────
exports.createTeamMember = async (req, res) => {
  try {
    if (req.adminUser.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Only admins can create team members' })

    const { username, email, password, displayName, role, permissions } = req.body
    if (!username || !email || !password)
      return res.status(400).json({ success: false, message: 'username, email and password are required' })
    if (!['admin', 'moderator'].includes(role))
      return res.status(400).json({ success: false, message: 'Role must be admin or moderator' })
    if (password.length < 8)
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' })

    const bcrypt = require('bcryptjs')
    const existing = await AdminUser.findOne({ $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] })
    if (existing)
      return res.status(409).json({ success: false, message: 'Username or email already exists' })

    const hashed = await bcrypt.hash(password, 12)
    const member = await AdminUser.create({
      username:    username.toLowerCase().trim(),
      email:       email.toLowerCase().trim(),
      password:    hashed,
      displayName: displayName || username,
      role,
      permissions: permissions || {},
      createdBy:   req.adminUser._id,
    })

    res.status(201).json({ success: true, member: member.toSafeProfile() })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

exports.updateTeamMember = async (req, res) => {
  try {
    if (req.adminUser.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Only admins can update team members' })

    const { displayName, role, permissions, isActive } = req.body
    const updates = {}
    if (displayName !== undefined) updates.displayName = displayName
    if (role        !== undefined) {
      if (!['admin', 'moderator'].includes(role))
        return res.status(400).json({ success: false, message: 'Role must be admin or moderator' })
      updates.role = role
    }
    if (permissions !== undefined) updates.permissions = permissions
    if (isActive    !== undefined) updates.isActive    = isActive

    const member = await AdminUser.findByIdAndUpdate(req.params.id, updates, { new: true })
    if (!member) return res.status(404).json({ success: false, message: 'Team member not found' })

    res.json({ success: true, member: member.toSafeProfile() })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

exports.deleteTeamMember = async (req, res) => {
  try {
    if (req.adminUser.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Only admins can delete team members' })
    if (req.params.id === String(req.adminUser._id))
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' })

    const member = await AdminUser.findByIdAndDelete(req.params.id)
    if (!member) return res.status(404).json({ success: false, message: 'Team member not found' })

    res.json({ success: true, message: 'Team member removed' })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

exports.resetTeamMemberPassword = async (req, res) => {
  try {
    if (req.adminUser.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Only admins can reset passwords' })
    const { newPassword } = req.body
    if (!newPassword || newPassword.length < 8)
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' })

    const bcrypt = require('bcryptjs')
    const hashed = await bcrypt.hash(newPassword, 12)
    const member = await AdminUser.findByIdAndUpdate(req.params.id, { password: hashed, refreshToken: null }, { new: true })
    if (!member) return res.status(404).json({ success: false, message: 'Team member not found' })

    res.json({ success: true, message: 'Password reset successfully' })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

// ── Admin: Get all comments (paginated, searchable) ───────────────
exports.getComments = async (req, res) => {
  try {
    const Comment = require('../models/Comment')
    const { page = 1, limit = 50, search = '', videoId = '', flagged = '' } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    const query = { isDeleted: false }
    if (videoId)        query.video     = videoId
    if (flagged === 'true') query.isFlagged = true
    if (search)         query.text      = { $regex: search, $options: 'i' }

    const [rawComments, total] = await Promise.all([
      Comment.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('author', 'username displayName avatar')
        .populate('video',  'title thumbnailUrl isShort')
        .lean(),
      Comment.countDocuments(query),
    ])

    const comments = rawComments.map(c => ({
      ...c,
      likeCount:   c.likeCount   || 0,
      replyCount:  c.replyCount  || 0,
      reportCount: c.reportCount || 0,
    }))

    res.json({ success: true, comments, total, page: Number(page) })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

// ── Admin: Hard-delete a comment ──────────────────────────────────
exports.adminDeleteComment = async (req, res) => {
  try {
    const Comment = require('../models/Comment')
    const comment = await Comment.findById(req.params.id)
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' })

    const Video = require('../models/Video')
    await Video.findByIdAndUpdate(comment.video, { $inc: { commentCount: -1 } })

    if (comment.parent) {
      await Comment.findByIdAndUpdate(comment.parent, { $inc: { replyCount: -1 } })
    }

    await Comment.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: 'Comment deleted' })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

// ── Admin: Toggle flag on a comment ───────────────────────────────
exports.adminFlagComment = async (req, res) => {
  try {
    const Comment = require('../models/Comment')
    const comment = await Comment.findById(req.params.id)
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' })

    comment.isFlagged = !comment.isFlagged
    await comment.save()

    res.json({ success: true, isFlagged: comment.isFlagged })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}