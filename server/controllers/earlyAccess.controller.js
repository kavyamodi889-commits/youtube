const { EarlyAccess, User } = require('../models')

exports.register = async (req, res) => {
  try {
    const email  = (req.body.email  || '').toLowerCase().trim()
    const source = (req.body.source || 'general').trim()

    if (!email)
      return res.status(400).json({ success: false, message: 'Email is required.' })

    // Check duplicate for this specific email+source combo only
    const existing = await EarlyAccess.findOne({ email, source })
    if (existing)
      return res.status(200).json({
        success: true,
        alreadyRegistered: true,
        message: `You're already signed up for AURA ${source.charAt(0).toUpperCase() + source.slice(1)}!`,
      })

    const linkedUser = await User.findOne({ email }).select('_id')

    const doc = await EarlyAccess.create({
      email,
      source,
      user:      linkedUser?._id ?? null,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    })

    return res.status(201).json({
      success: true,
      alreadyRegistered: false,
      message: "You're on the list — we'll reach out soon.",
      data: { id: doc._id, email: doc.email, source: doc.source, linkedUser: !!linkedUser },
    })
  } catch (err) {
    console.error('[EarlyAccess] register error:', err)
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' })
  }
}

exports.list = async (req, res) => {
  try {
    const { source, status, page = 1, limit = 50 } = req.query
    const filter = {}
    if (source) filter.source = source
    if (status) filter.status = status

    const [docs, total] = await Promise.all([
      EarlyAccess.find(filter)
        .populate('user', 'username email displayName avatar')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      EarlyAccess.countDocuments(filter),
    ])

    return res.json({ success: true, total, page: Number(page), data: docs })
  } catch (err) {
    console.error('[EarlyAccess] list error:', err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}