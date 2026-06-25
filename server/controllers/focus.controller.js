// FILE: server/controllers/focus.controller.js
const FocusSession = require('../models/FocusSession')
const WatchHistory = require('../models/WatchHistory')
const Video        = require('../models/Video')
const Payment      = require('../models/Payment')
const User         = require('../models/User')

// ── Helper: check and grant focus rewards ─────────────────────────────────────
// Called after a session completes. Checks if user just hit a monthly milestone.
// Returns { rewarded: true, tier, trigger } or { rewarded: false }
async function checkFocusReward(userId, completedSession) {
  try {
    const now        = new Date()
    const monthKey   = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    // Count this month's completed sessions by plannedDuration bucket
    const [count30, count60] = await Promise.all([
      FocusSession.countDocuments({
        user:            userId,
        status:          'completed',
        plannedDuration: { $gte: 30, $lt: 60 },
        startedAt:       { $gte: monthStart, $lte: monthEnd },
      }),
      FocusSession.countDocuments({
        user:            userId,
        status:          'completed',
        plannedDuration: { $gte: 60 },
        startedAt:       { $gte: monthStart, $lte: monthEnd },
      }),
    ])

    // Determine which reward (if any) was just unlocked
    // Ultra reward takes priority over Premium
    let rewardTier    = null
    let rewardTrigger = null

    if (count60 === 100) {
      rewardTier    = 'ultra'
      rewardTrigger = '60min_x100'
    } else if (count30 === 100) {
      rewardTier    = 'premium'
      rewardTrigger = '30min_x100'
    }

    if (!rewardTier) return { rewarded: false, count30, count60 }

    // Check if already rewarded this month for this trigger
    const alreadyRewarded = await Payment.findOne({
      payer:         userId,
      type:          'focus_reward',
      rewardTrigger,
      rewardMonth:   monthKey,
      status:        'captured',
    })
    if (alreadyRewarded) return { rewarded: false, alreadyRewarded: true, count30, count60 }

    // Grant the reward — 1 month free subscription
    const syntheticId = `focus_reward_${userId}_${rewardTrigger}_${monthKey}_${Date.now()}`
    const expires     = new Date()
    expires.setMonth(expires.getMonth() + 1)

    // Create Payment record (free — amount 0)
    await Payment.create({
      payer:            userId,
      type:             'focus_reward',
      razorpayOrderId:  syntheticId,
      amount:           0,
      currency:         'INR',
      status:           'captured',
      membershipTier:   rewardTier,
      membershipMonths: 1,
      rewardTrigger,
      rewardMonth:      monthKey,
      meta:             new Map([
        ['source', 'focus_milestone'],
        ['monthKey', monthKey],
        ['sessionCount', rewardTier === 'ultra' ? count60 : count30],
      ]),
    })

    // Upgrade user — only upgrade, never downgrade
    const user = await User.findById(userId).select('membershipTier membershipExpiresAt')
    const tierRank = { none: 0, basic: 1, standard: 2, premium: 3, ultra: 4 }
    const currentRank = tierRank[user.membershipTier] || 0
    const rewardRank  = tierRank[rewardTier]

    if (rewardRank >= currentRank) {
      // Extend existing expiry or set fresh 1-month
      const baseDate = (user.membershipExpiresAt && user.membershipExpiresAt > new Date())
        ? new Date(user.membershipExpiresAt)
        : new Date()
      baseDate.setMonth(baseDate.getMonth() + 1)

      await User.findByIdAndUpdate(userId, {
        membershipTier:      rewardTier,
        membershipExpiresAt: baseDate,
      })
    }

    // Send in-app notification
    try {
      const { createNotification } = require('./notification.controller')
      const label = rewardTier === 'ultra' ? 'Ultra' : 'Premium'
      createNotification({
        recipient: userId,
        sender:    userId,
        type:      'milestone',
        title:     `🎯 Focus Reward Unlocked — AURA ${label} Free!`,
        message:   rewardTier === 'ultra'
          ? `You completed 100 one-hour focus sessions this month. Enjoy 1 month of AURA Ultra — on us!`
          : `You completed 100 thirty-minute focus sessions this month. Enjoy 1 month of AURA Premium — on us!`,
        linkUrl:   '/premium',
        priority:  'high',
      }).catch(() => {})
    } catch {}

    console.log(`[focus-reward] granted ${rewardTier} to user=${userId} trigger=${rewardTrigger} month=${monthKey}`)

    return { rewarded: true, tier: rewardTier, trigger: rewardTrigger, count30, count60 }
  } catch (err) {
    console.error('[focus-reward] checkFocusReward error:', err.message)
    return { rewarded: false }
  }
}

// ── Helper: get this month's focus progress for a user ───────────────────────
async function getMonthlyProgress(userId) {
  const now        = new Date()
  const monthKey   = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

  const [count30, count60, reward30, reward60] = await Promise.all([
    FocusSession.countDocuments({
      user: userId, status: 'completed',
      plannedDuration: { $gte: 30, $lt: 60 },
      startedAt: { $gte: monthStart, $lte: monthEnd },
    }),
    FocusSession.countDocuments({
      user: userId, status: 'completed',
      plannedDuration: { $gte: 60 },
      startedAt: { $gte: monthStart, $lte: monthEnd },
    }),
    Payment.findOne({ payer: userId, type: 'focus_reward', rewardTrigger: '30min_x100', rewardMonth: monthKey, status: 'captured' }),
    Payment.findOne({ payer: userId, type: 'focus_reward', rewardTrigger: '60min_x100', rewardMonth: monthKey, status: 'captured' }),
  ])

  return {
    monthKey,
    count30,
    count60,
    target: 100,
    premiumRewardClaimed: !!reward30,
    ultraRewardClaimed:   !!reward60,
    premiumProgress: Math.min(100, count30),
    ultraProgress:   Math.min(100, count60),
  }
}

// POST /api/focus/sessions — start a new session
exports.startSession = async (req, res) => {
  try {
    const { plannedDuration, blockedCategories = [], goal = '', quote = null } = req.body
    if (!plannedDuration || plannedDuration < 5)
      return res.status(400).json({ success: false, message: 'plannedDuration must be >= 5 minutes' })

    const session = await FocusSession.create({
      user:             req.user._id,
      plannedDuration,
      blockedCategories,
      goal,
      quote,
      status:           'active',
      startedAt:        new Date(),
    })
    res.status(201).json({ success: true, session })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// PATCH /api/focus/sessions/:id — end / update session
exports.updateSession = async (req, res) => {
  try {
    const session = await FocusSession.findOne({ _id: req.params.id, user: req.user._id })
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' })

    const { status, actualDuration, completionPercent, exitMethod, emergencyExitCount, moodBefore, moodAfter } = req.body

    if (status)             session.status             = status
    if (actualDuration)     session.actualDuration     = actualDuration
    if (completionPercent)  session.completionPercent  = completionPercent
    if (exitMethod)         session.exitMethod         = exitMethod
    if (emergencyExitCount) session.emergencyExitCount = emergencyExitCount
    if (moodBefore)         session.moodBefore         = moodBefore
    if (moodAfter)          session.moodAfter          = moodAfter

    session.endedAt = new Date()
    await session.save()

    // ── Check focus rewards only when a session is marked completed ──
    let reward = null
    if (session.status === 'completed') {
      const result = await checkFocusReward(req.user._id, session)
      if (result.rewarded) {
        reward = { tier: result.tier, trigger: result.trigger }
      }
    }

    // Always return monthly progress so client can update the UI
    const progress = await getMonthlyProgress(req.user._id)

    res.json({ success: true, session, reward, progress })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/focus/sessions — my sessions history
exports.getMySessions = async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query
    const sessions = await FocusSession.find({ user: req.user._id })
      .sort({ startedAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))

    const total     = await FocusSession.countDocuments({ user: req.user._id })
    const completed = await FocusSession.countDocuments({ user: req.user._id, status: 'completed' })
    const totalMinutes = await FocusSession.aggregate([
      { $match: { user: req.user._id, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$actualDuration' } } }
    ])

    res.json({
      success: true, sessions, total, completed,
      totalFocusMinutes: totalMinutes[0]?.total || 0,
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/focus/wellbeing — Digital Wellbeing stats
exports.getWellbeing = async (req, res) => {
  try {
    const { days = 7 } = req.query
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    // ── Watch history ─────────────────────────────────────────────
    const history = await WatchHistory.find({
      user: req.user._id,
      lastWatchedAt: { $gte: since },
    })
      .populate({ path: 'video', select: 'title category isShort duration tags' })
      .sort({ lastWatchedAt: -1 })
      .lean()

    const valid = history.filter(h => h.video)

    // ── Totals ────────────────────────────────────────────────────
    const totalMinutes = Math.round(
      valid.reduce((acc, h) => acc + (h.watchedDuration || 0), 0) / 60
    )

    // ── By category ───────────────────────────────────────────────
    const categoryMap = {}
    for (const h of valid) {
      const cat = h.video.category || 'General'
      if (!categoryMap[cat]) categoryMap[cat] = { minutes: 0, count: 0 }
      categoryMap[cat].minutes += Math.round((h.watchedDuration || 0) / 60)
      categoryMap[cat].count++
    }
    const byCategory = Object.entries(categoryMap)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.minutes - a.minutes)

    // ── Shorts vs Videos ──────────────────────────────────────────
    const shortsItems  = valid.filter(h => h.video.isShort)
    const videosItems  = valid.filter(h => !h.video.isShort)
    const shortsMinutes = Math.round(shortsItems.reduce((a, h) => a + (h.watchedDuration || 0), 0) / 60)
    const videosMinutes = Math.round(videosItems.reduce((a, h) => a + (h.watchedDuration || 0), 0) / 60)
    const shortsCount   = shortsItems.length

    // ── By day (chronological, oldest → newest) ───────────────────
    // Frontend sorts Mon→Sun; we just provide accurate per-date data
    const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    const byDay = Array.from({ length: Number(days) }, (_, i) => {
      const d = new Date(Date.now() - (days - 1 - i) * 86400000)
      d.setHours(0, 0, 0, 0)
      const next = new Date(d); next.setDate(next.getDate() + 1)
      const dayHistory = valid.filter(h => {
        const w = new Date(h.lastWatchedAt)
        return w >= d && w < next
      })
      return {
        day:     DAY_NAMES[d.getDay()],
        date:    d.toISOString().slice(0, 10),
        minutes: Math.round(dayHistory.reduce((a, h) => a + (h.watchedDuration || 0), 0) / 60),
        count:   dayHistory.length,
      }
    })

    // ── By hour (watch) ───────────────────────────────────────────
    const byHour = Array.from({ length: 24 }, (_, h) => ({
      hour:    h,
      label:   h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h-12}pm`,
      minutes: 0,
    }))
    for (const h of valid) {
      const hr = new Date(h.lastWatchedAt).getHours()
      byHour[hr].minutes += Math.round((h.watchedDuration || 0) / 60)
    }

    // ── By hour per day (for active-hours day filter) ─────────────
    const byHourByDay = {}
    for (const dayEntry of byDay) {
      const hours = Array.from({ length: 24 }, (_, h) => ({
        hour:    h,
        label:   h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h-12}pm`,
        minutes: 0,
      }))
      const dayHistory = valid.filter(h => {
        const w = new Date(h.lastWatchedAt)
        w.setHours(0, 0, 0, 0)
        return w.toISOString().slice(0, 10) === dayEntry.date
      })
      for (const h of dayHistory) {
        const hr = new Date(h.lastWatchedAt).getHours()
        hours[hr].minutes += Math.round((h.watchedDuration || 0) / 60)
      }
      byHourByDay[dayEntry.date] = hours
    }

    // ── Top videos ────────────────────────────────────────────────
    const topVideos = [...valid]
      .sort((a, b) => (b.watchedDuration || 0) - (a.watchedDuration || 0))
      .slice(0, 5)
      .map(h => ({
        title:    h.video.title,
        category: h.video.category,
        isShort:  h.video.isShort,
        minutes:  Math.round((h.watchedDuration || 0) / 60),
      }))

    // ── Focus sessions ────────────────────────────────────────────
    const focusSince = await FocusSession.find({
      user:      req.user._id,
      startedAt: { $gte: since },
    }).lean()

    const focusMinutes   = focusSince.reduce((a, s) => a + (s.actualDuration || 0), 0)
    const focusCompleted = focusSince.filter(s => s.status === 'completed').length
    const avgSessionLen  = focusCompleted > 0
      ? Math.round(focusMinutes / focusCompleted)
      : 0

    // ── Focus by day (sessions started per date) ──────────────────
    // Attach to same byDay array entries for easy frontend merge
    const focusByDay = byDay.map(d => {
      const daySessions = focusSince.filter(s => {
        const sd = new Date(s.startedAt)
        sd.setHours(0, 0, 0, 0)
        return sd.toISOString().slice(0, 10) === d.date
      })
      return {
        day:          d.day,
        date:         d.date,
        focusMinutes: daySessions.reduce((a, s) => a + (s.actualDuration || 0), 0),
        sessions:     daySessions.filter(s => s.status === 'completed').length,
      }
    })

    // ── Focus by hour ─────────────────────────────────────────────
    const focusByHour = Array.from({ length: 24 }, (_, h) => ({
      hour:    h,
      label:   h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h-12}pm`,
      minutes: 0,
    }))
    for (const s of focusSince) {
      if (s.startedAt && s.actualDuration) {
        const hr = new Date(s.startedAt).getHours()
        focusByHour[hr].minutes += s.actualDuration || 0
      }
    }

    // ── Streak (consecutive days with watch activity) ─────────────
    let streak = 0
    for (let i = Number(days) - 1; i >= 0; i--) {
      if (byDay[i]?.minutes > 0) streak++
      else break
    }

    res.json({
      success:      true,
      period:       { days: Number(days), since },
      totalMinutes,
      shortsMinutes,
      videosMinutes,
      shortsCount,
      totalVideos:  valid.length,
      byCategory,
      byDay,
      byHour,
      byHourByDay,
      topVideos,
      focusMinutes,
      focusCompleted,
      avgSessionLen,
      focusByDay,
      focusByHour,
      streak,
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
// GET /api/focus/progress — this month's focus reward progress
exports.getProgress = async (req, res) => {
  try {
    const progress = await getMonthlyProgress(req.user._id)
    res.json({ success: true, ...progress })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}