// FILE: server/models/WatchHistory.js

const mongoose = require("mongoose");

const watchHistorySchema = new mongoose.Schema(
  {
    // ─── Core ────────────────────────────────────────────────────
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      required: true,
    },

    // ─── Playback State ───────────────────────────────────────────
    watchedDuration: {
      type: Number,
      default: 0,  // seconds watched in last session
    },
    totalDuration: {
      type: Number,
      default: 0,  // total video duration at time of watch
    },
    progressPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    resumeAt: {
      type: Number,
      default: 0,  // seconds — where to resume playback
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },

    // ─── Session Info ─────────────────────────────────────────────
    watchCount: {
      type: Number,
      default: 1,  // how many times this user watched this video
    },
    lastWatchedAt: {
      type: Date,
      default: Date.now,
    },
    deviceType: {
      type: String,
      enum: ["mobile", "desktop", "tablet", "tv", "unknown"],
      default: "unknown",
    },
    quality: {
      type: String,
      default: "auto",  // quality selected during last watch
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

// ─── One history entry per user-video pair (upsert on each watch) ─
watchHistorySchema.index({ user: 1, video: 1 }, { unique: true });
watchHistorySchema.index({ user: 1, lastWatchedAt: -1 }); // "History" page sort

const WatchHistory = mongoose.model("WatchHistory", watchHistorySchema);
module.exports = WatchHistory;