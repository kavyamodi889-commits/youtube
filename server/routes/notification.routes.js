// FILE: server/routes/notification.routes.js
const express = require('express')
const { protect } = require('../middleware/auth')
const {
  getNotifications,
  markRead,
  markAllRead,
  dismiss,
  dismissAll,
  savePushSubscription,
  removePushSubscription,
} = require('../controllers/notification.controller')

const router = express.Router()

// All routes require auth
router.use(protect)

router.get   ('/',                      getNotifications)
router.patch ('/read-all',              markAllRead)
router.patch ('/:id/read',              markRead)
router.delete('/all',                   dismissAll)
router.delete('/:id',                   dismiss)

// Push subscription management
router.post  ('/push/subscribe',        savePushSubscription)
router.delete('/push/unsubscribe',      removePushSubscription)

module.exports = router