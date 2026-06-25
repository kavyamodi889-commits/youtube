const mongoose = require('mongoose')

const earlyAccessSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    source: {
      type: String,
      enum: ['music', 'ads', 'general'],
      default: 'general',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'invited', 'converted'],
      default: 'pending',
    },
    invitedAt:   { type: Date, default: null },
    convertedAt: { type: Date, default: null },
    ipAddress:   { type: String, default: '' },
    userAgent:   { type: String, default: '' },
  },
  { timestamps: true }
)

// Unique per email+source combo — same email can sign up for music AND ads
earlyAccessSchema.index({ email: 1, source: 1 }, { unique: true })
earlyAccessSchema.index({ status: 1 })
earlyAccessSchema.index({ createdAt: -1 })
earlyAccessSchema.index({ user: 1 })

const EarlyAccess = mongoose.model('EarlyAccess', earlyAccessSchema)
module.exports = EarlyAccess