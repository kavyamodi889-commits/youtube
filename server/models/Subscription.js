// FILE: server/models/Subscription.js

const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    // ─── Core Relationship ────────────────────────────────────────
    subscriber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      // "channel" is also a User — the one being subscribed to
    },

    // ─── Notification Preference ──────────────────────────────────
    notifyLevel: {
      type: String,
      enum: ["all", "personalised", "none"],
      default: "personalised",
      // all = bell on, personalised = bell off but subscribed, none = muted
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

// ─── Compound unique — one subscription per pair ──────────────────
subscriptionSchema.index({ subscriber: 1, channel: 1 }, { unique: true });
subscriptionSchema.index({ channel: 1, createdAt: -1 }); // for subscriber count queries

const Subscription = mongoose.model("Subscription", subscriptionSchema);
module.exports = Subscription;