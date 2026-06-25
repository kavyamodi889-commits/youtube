const express = require('express')
const { protect } = require('../middleware/auth')
const {
  createOrder,
  verifyPayment,
  getStatus,
  getHistory,
  cancelSubscription,
} = require('../controllers/payment.controller')

const router = express.Router()

router.use(protect) // all payment routes require auth

router.post('/create-order', createOrder)
router.post('/verify', verifyPayment)
router.get('/status', getStatus)
router.get('/history', getHistory)
router.post('/cancel', cancelSubscription)

module.exports = router