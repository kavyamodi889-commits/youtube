// FILE: server/models/LiveStream.js

const mongoose = require("mongoose");

const liveStreamSchema = new mongoose.Schema(
  {
    // ─── Ownership ───────────────────────────────────────────────
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ─── Identity ────────────────────────────────────────────────
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      maxlength: 2000,
      default: "",
    },
    tags: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      default: "General",
    },
    thumbnailUrl: {
      type: String,
      default: "",
    },
    thumbnailPublicId: {
      type: String,
      default: "",
    },

    // ─── RTMP / HLS Config ────────────────────────────────────────
    streamKey: {
      type: String,
      required: true,
      unique: true,
    },
    rtmpUrl: {
      type: String,
      default: "",
    },
    hlsUrl: {
      type: String,
      default: "",
    },
    ngrokUrl: {
      type: String,
      default: null,
    },

    // ─── Status ──────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["scheduled", "live", "ended", "cancelled"],
      default: "scheduled",
    },
    scheduledAt: {
      type: Date,
      default: null,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number,
      default: 0,
    },

    // ─── Stats ───────────────────────────────────────────────────
    peakViewers: {
      type: Number,
      default: 0,
    },
    currentViewers: {
      type: Number,
      default: 0,
    },
    totalViews: {
      type: Number,
      default: 0,
    },
    likeCount: {
      type: Number,
      default: 0,
    },
    superChatTotal: {
      type: Number,
      default: 0,
    },

    // ─── Post-stream VOD ─────────────────────────────────────────
    vodVideo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      default: null,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },

    // ─── Settings ────────────────────────────────────────────────
    chatEnabled: {
      type: Boolean,
      default: true,
    },
    membersOnlyChat: {
      type: Boolean,
      default: false,
    },
    visibility: {
      type: String,
      enum: ["public", "unlisted", "private"],
      default: "public",
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
// Note: streamKey already indexed via unique:true above
liveStreamSchema.index({ host: 1, status: 1 });
liveStreamSchema.index({ status: 1, scheduledAt: 1 });

const LiveStream = mongoose.model("LiveStream", liveStreamSchema);
module.exports = LiveStream;