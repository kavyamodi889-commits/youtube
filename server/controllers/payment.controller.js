// FILE: server/controllers/payment.controller.js
const crypto  = require('crypto')
const User    = require('../models/User')
const Payment = require('../models/Payment')

// Lazy-init Razorpay — ensures env vars are loaded before instantiation
function getRazorpay() {
  const Razorpay = require('razorpay')
  return new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })
}

// Plan config — amount in paise (₹1 = 100 paise)
const PLANS = {
  premium_monthly: { tier: 'premium', amount: 14900,  currency: 'INR', interval: 'monthly', months: 1,  label: 'AURA Premium – Monthly' },
  premium_yearly:  { tier: 'premium', amount: 119000, currency: 'INR', interval: 'yearly',  months: 12, label: 'AURA Premium – Yearly'  },
  ultra_monthly:   { tier: 'ultra',   amount: 24900,  currency: 'INR', interval: 'monthly', months: 1,  label: 'AURA Ultra – Monthly'   },
  ultra_yearly:    { tier: 'ultra',   amount: 199000, currency: 'INR', interval: 'yearly',  months: 12, label: 'AURA Ultra – Yearly'    },
}

// ── POST /api/payments/create-order ──────────────────────────────
exports.createOrder = async (req, res) => {
  try {
    const { planId } = req.body
    const plan = PLANS[planId]
    if (!plan) return res.status(400).json({ success: false, message: 'Invalid plan' })

    const razorpay = getRazorpay()
    const order = await razorpay.orders.create({
      amount:   plan.amount,
      currency: plan.currency,
      receipt:  `aura_${Date.now()}`,
      notes: {
        userId: String(req.user._id),
        planId,
        tier:   plan.tier,
      },
    })

    // ── Save a 'created' Payment record so admin can track pending orders ──
    await Payment.create({
      payer:            req.user._id,
      type:             'membership',
      razorpayOrderId:  order.id,
      amount:           plan.amount,
      currency:         plan.currency,
      status:           'created',
      membershipTier:   plan.tier,
      membershipMonths: plan.months,
      meta:             new Map([
        ['planId',    planId],
        ['planLabel', plan.label],
      ]),
    })

    console.log(`[payment] order created  | ${plan.label} | ₹${plan.amount / 100} | user=${req.user._id}`)

    res.json({
      success: true,
      order: {
        id:       order.id,
        amount:   order.amount,
        currency: order.currency,
      },
      plan: {
        id:       planId,
        label:    plan.label,
        tier:     plan.tier,
        interval: plan.interval,
      },
      key: process.env.RAZORPAY_KEY_ID,
    })
  } catch (err) {
    const msg = err?.error?.description || err?.message || 'Unknown error'
    console.error('[payment] createOrder:', msg)
    res.status(500).json({ success: false, message: 'Failed to create order: ' + msg })
  }
}

// ── POST /api/payments/verify ─────────────────────────────────────
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body

    // Verify Razorpay HMAC signature
    const body     = razorpay_order_id + '|' + razorpay_payment_id
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex')

    if (expected !== razorpay_signature) {
      // Mark the Payment record as failed
      await Payment.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { status: 'failed', failureReason: 'Signature mismatch — possible tampering' }
      )
      return res.status(400).json({ success: false, message: 'Payment signature verification failed' })
    }

    const plan = PLANS[planId]
    if (!plan) return res.status(400).json({ success: false, message: 'Invalid plan' })

    // ── Update Payment record to 'captured' with full Razorpay IDs ──
    await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status:            'captured',
      },
      {
        upsert: true,   // safety: create if create-order record was somehow missed
        setOnInsert: {
          payer:            req.user._id,
          type:             'membership',
          razorpayOrderId:  razorpay_order_id,
          amount:           plan.amount,
          currency:         plan.currency,
          membershipTier:   plan.tier,
          membershipMonths: plan.months,
        },
      }
    )

    // Calculate expiry date
    const expires = new Date()
    if (plan.interval === 'monthly') expires.setMonth(expires.getMonth() + 1)
    else expires.setFullYear(expires.getFullYear() + 1)

    // Upgrade user membership
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { membershipTier: plan.tier, membershipExpiresAt: expires },
      { new: true }
    ).select('displayName email membershipTier membershipExpiresAt')

    console.log(`[payment] captured       | ${plan.label} | user=${req.user._id} | expires=${expires.toISOString().slice(0, 10)}`)

    // Send in-app notification
    try {
      const { createNotification } = require('./notification.controller')
      createNotification({
        recipient: req.user._id,
        sender:    req.user._id,
        type:      'milestone',
        title:     `Welcome to AURA ${plan.tier === 'ultra' ? 'Ultra' : 'Premium'}! 🎉`,
        message:   `Your ${plan.label} is now active. Enjoy all ${plan.tier} features!`,
        linkUrl:   '/premium',
        priority:  'high',
      }).catch(() => {})
    } catch {}

    res.json({
      success: true,
      message: 'Payment verified. Subscription activated!',
      user: {
        membershipTier:      user.membershipTier,
        membershipExpiresAt: user.membershipExpiresAt,
      },
    })
  } catch (err) {
    console.error('[payment] verifyPayment:', err.message)
    res.status(500).json({ success: false, message: 'Payment verification error' })
  }
}

// ── GET /api/payments/status ──────────────────────────────────────
exports.getStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('membershipTier membershipExpiresAt')

    // Auto-expire if past expiry date
    if (user.membershipTier !== 'none' && user.membershipExpiresAt && user.membershipExpiresAt < new Date()) {
      user.membershipTier      = 'none'
      user.membershipExpiresAt = null
      await user.save()
    }

    // Most recent successful payment for richer client display
    const latestPayment = await Payment.findOne({
      payer:  req.user._id,
      status: 'captured',
      type:   'membership',
    }).sort({ createdAt: -1 })
      .select('amount membershipTier membershipMonths createdAt')

    // ── Focus reward progress (this month) ──────────────────────
    const now        = new Date()
    const monthKey   = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const FocusSession = require('../models/FocusSession')
    const [count30, count60, reward30, reward60] = await Promise.all([
      FocusSession.countDocuments({
        user: req.user._id, status: 'completed',
        plannedDuration: { $gte: 30, $lt: 60 },
        startedAt: { $gte: monthStart, $lte: monthEnd },
      }),
      FocusSession.countDocuments({
        user: req.user._id, status: 'completed',
        plannedDuration: { $gte: 60 },
        startedAt: { $gte: monthStart, $lte: monthEnd },
      }),
      Payment.findOne({ payer: req.user._id, type: 'focus_reward', rewardTrigger: '30min_x100', rewardMonth: monthKey, status: 'captured' }),
      Payment.findOne({ payer: req.user._id, type: 'focus_reward', rewardTrigger: '60min_x100', rewardMonth: monthKey, status: 'captured' }),
    ])

    res.json({
      success:       true,
      tier:          user.membershipTier,
      expiresAt:     user.membershipExpiresAt,
      isActive:      user.membershipTier !== 'none',
      latestPayment: latestPayment || null,
      focusRewards: {
        monthKey,
        count30:              Math.min(100, count30),
        count60:              Math.min(100, count60),
        target:               100,
        premiumRewardClaimed: !!reward30,
        ultraRewardClaimed:   !!reward60,
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// ── GET /api/payments/history ─────────────────────────────────────
// Returns the logged-in user's own payment history (for Settings > Billing)
exports.getHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ payer: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('amount currency status membershipTier membershipMonths razorpayPaymentId razorpayOrderId createdAt')

    // Convert paise → rupees for easy client display
    const formatted = payments.map(p => ({
      _id:       p._id,
      amount:    p.amount / 100,
      currency:  p.currency,
      status:    p.status,
      plan:      p.membershipTier,
      months:    p.membershipMonths,
      paymentId: p.razorpayPaymentId,
      orderId:   p.razorpayOrderId,
      date:      p.createdAt,
    }))

    res.json({ success: true, payments: formatted })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// ── POST /api/payments/cancel ─────────────────────────────────────
exports.cancelSubscription = async (req, res) => {
  try {
    // Access continues until membershipExpiresAt — getStatus auto-expires then
    res.json({
      success: true,
      message: 'Subscription cancelled. Access continues until the end of your current billing period.',
    })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}