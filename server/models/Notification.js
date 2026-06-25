// FILE: server/models/Notification.js

const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    // ─── Target ──────────────────────────────────────────────────
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ─── Sender (optional — null for system notifications) ────────
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ─── Type & Subtype ───────────────────────────────────────────
    type: {
      type: String,
      enum: [
        "subscription",   // someone subscribed to your channel
        "newVideo",       // channel you subscribe to uploaded
        "like",           // someone liked your video
        "comment",        // someone commented on your video
        "reply",          // someone replied to your comment
        "mention",        // someone @mentioned you
        "live",           // channel went live
        "superChat",      // super chat received
        "membership",     // membership payment
        "system",         // AURA system message
        "moderation",     // content flagged/removed
        "milestone",      // subscriber/view milestone
      ],
      required: true,
    },
    priority: {
      type: String,
      enum: ["default", "high", "critical"],
      default: "default",
      // high = push notification, critical = email + push
    },

    // ─── Content ─────────────────────────────────────────────────
    title: {
      type: String,
      maxlength: 100,
      default: "",
    },
    message: {
      type: String,
      maxlength: 500,
      required: true,
    },
    imageUrl: {
      type: String,
      default: null,
    },

    // ─── Deep Link ───────────────────────────────────────────────
    linkType: {
      type: String,
      enum: ["video", "channel", "comment", "live", "payment", "system", null],
      default: null,
    },
    linkId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null, // ID of the linked resource
    },
    linkUrl: {
      type: String,
      default: null, // pre-built relative URL e.g. /watch/abc123
    },

    // ─── State ───────────────────────────────────────────────────
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    isDismissed: {
      type: Boolean,
      default: false,
    },

    // ─── Delivery ─────────────────────────────────────────────────
    deliveredViaSocket: {
      type: Boolean,
      default: false,
    },
    deliveredViaPush: {
      type: Boolean,
      default: false,
    },

    // ─── TTL Auto-delete ─────────────────────────────────────────
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },

    // ─── Extensibility ────────────────────────────────────────────
    meta: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

// ─── Indexes ─────────────────────────────────────────────────────
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Notification = mongoose.model("Notification", notificationSchema);
module.exports = Notification;