// FILE: server/routes/focus.routes.js
const express    = require('express')
const { protect } = require('../middleware/auth')
const {
  startSession, updateSession, getMySessions, getWellbeing, getProgress,
} = require('../controllers/focus.controller')

const router = express.Router()

router.post  ('/sessions',     protect, startSession)
router.patch ('/sessions/:id', protect, updateSession)
router.get   ('/sessions',     protect, getMySessions)
router.get   ('/progress',     protect, getProgress)
router.get   ('/wellbeing',    protect, getWellbeing)

module.exports = router