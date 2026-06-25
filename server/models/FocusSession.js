// FILE: server/models/FocusSession.js

const mongoose = require("mongoose");

const focusSessionSchema = new mongoose.Schema(
  {
    // ─── Owner ────────────────────────────────────────────────────
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ─── Session Config ───────────────────────────────────────────
    plannedDuration: {
      type: Number,
      required: true, // minutes — user picked (15, 30, 60, 90, 120)
      min: 5,
      max: 360,
    },
    category: {
      type: String,
      default: "General",
      // task category: "Study", "Work", "Creative", etc.
    },
    goal: {
      type: String,
      maxlength: 200,
      default: "", // optional "what will you accomplish?"
    },
    quote: {
      type: String,
      maxlength: 300,
      default: null, // motivational quote shown during session (Playfair Display italic)
    },

    // ─── Blocked Categories ───────────────────────────────────────
    blockedCategories: {
      type: [String],
      default: [],
      // video categories blocked during this session (e.g., Gaming, Memes)
    },

    // ─── Timing ──────────────────────────────────────────────────
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    actualDuration: {
      type: Number,
      default: null, // minutes — filled on session end
    },

    // ─── Outcome ─────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["active", "completed", "aborted"],
      default: "active",
    },
    completionPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    exitMethod: {
      type: String,
      enum: ["natural", "emergency", "timeout", null],
      default: null,
      // emergency = 3-step emergency exit flow was used
    },
    emergencyExitCount: {
      type: Number,
      default: 0, // how many times they tried to exit early
    },

    // ─── Mood Tracking ────────────────────────────────────────────
    moodBefore: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    moodAfter: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
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
focusSessionSchema.index({ user: 1, startedAt: -1 });
focusSessionSchema.index({ user: 1, status: 1 });

const FocusSession = mongoose.model("FocusSession", focusSessionSchema);
module.exports = FocusSession;