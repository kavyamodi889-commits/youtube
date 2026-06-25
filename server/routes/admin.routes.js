// FILE: server/routes/admin.routes.js
// All routes protected by adminAuth middleware (AdminUser collection)

const express = require('express')
const { protectAdmin, requireAdminRole, requirePermission } = require('../middleware/adminAuth')
const {
  getDashboard,
  getUsers, banUser, unbanUser, changeRole, verifyChannel, deleteUser,
  getVideos, setVideoStatus, dismissVideoReports, deleteVideo,
  getReports, actionReport,
  getLiveStreams, endLiveStream,
  getPayments,
  getAnalytics,
  getFlags, updateFlags, getAdminTeam,
  createTeamMember, updateTeamMember, deleteTeamMember, resetTeamMemberPassword,
  getComments, adminDeleteComment, adminFlagComment,
} = require('../controllers/admin.controller')

const router = express.Router()

// All admin data routes require a valid AdminUser JWT
router.use(protectAdmin)

// ── Dashboard ─────────────────────────────────────────────────────
router.get('/dashboard', getDashboard)

// ── Users ─────────────────────────────────────────────────────────
router.get   ('/users',                      getUsers)
router.patch ('/users/:id/ban',              requirePermission('canBanUsers'),    banUser)
router.patch ('/users/:id/unban',            requirePermission('canBanUsers'),    unbanUser)
router.patch ('/users/:id/role',             requirePermission('canChangeRoles'), changeRole)
router.patch ('/users/:id/verify',           verifyChannel)
router.delete('/users/:id',                  requireAdminRole('admin'),           deleteUser)

// ── Videos ────────────────────────────────────────────────────────
router.get   ('/videos',                     getVideos)
router.patch ('/videos/:id/status',          requirePermission('canDeleteVideos'), setVideoStatus)
router.patch ('/videos/:id/dismiss-reports', requirePermission('canActionReports'), dismissVideoReports)
router.delete('/videos/:id',                 requireAdminRole('admin'),            deleteVideo)

// ── Reports ───────────────────────────────────────────────────────
router.get   ('/reports',                    getReports)
router.patch ('/reports/:id/action',         requirePermission('canActionReports'), actionReport)

// ── Live Streams ──────────────────────────────────────────────────
router.get   ('/livestreams',                getLiveStreams)
router.patch ('/livestreams/:id/end',        requireAdminRole('admin'),            endLiveStream)

// ── Payments ──────────────────────────────────────────────────────
router.get   ('/payments',                   requirePermission('canViewPayments'), getPayments)

// ── Analytics ─────────────────────────────────────────────────────
router.get   ('/analytics',                  getAnalytics)

// ── Early Access / Coming Soon registrations ──────────────────────
router.get   ('/early-access',               async (req, res) => {
  try {
    const EarlyAccess = require('../models/EarlyAccess')
    const { source, status, page = 1, limit = 50 } = req.query
    const filter = {}
    if (source && source !== 'all') filter.source = source
    if (status && status !== 'all') filter.status = status
    const skip = (Number(page) - 1) * Number(limit)
    const [docs, total] = await Promise.all([
      EarlyAccess.find(filter)
        .populate('user', 'username email displayName avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      EarlyAccess.countDocuments(filter),
    ])
    res.json({ success: true, total, page: Number(page), data: docs })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})
router.patch ('/early-access/:id/invite',    async (req, res) => {
  try {
    const EarlyAccess = require('../models/EarlyAccess')
    const doc = await EarlyAccess.findByIdAndUpdate(req.params.id,
      { status: 'invited', invitedAt: new Date() }, { new: true }
    )
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' })
    res.json({ success: true, data: doc })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// ── Comments ──────────────────────────────────────────────────────
router.get   ('/comments',                   getComments)
router.delete('/comments/:id',               requirePermission('canActionReports'), adminDeleteComment)
router.patch ('/comments/:id/flag',          requirePermission('canActionReports'), adminFlagComment)

// ── Settings: platform flags ──────────────────────────────────────
router.get   ('/settings/flags',             getFlags)
router.patch ('/settings/flags',             requirePermission('canEditFlags'),    updateFlags)

// ── Admin Team Management ─────────────────────────────────────────
router.get   ('/team',                       getAdminTeam)
router.post  ('/team',                       requireAdminRole('admin'),            createTeamMember)
router.patch ('/team/:id',                   requireAdminRole('admin'),            updateTeamMember)
router.delete('/team/:id',                   requireAdminRole('admin'),            deleteTeamMember)
router.patch ('/team/:id/reset-password',    requireAdminRole('admin'),            resetTeamMemberPassword)

module.exports = router