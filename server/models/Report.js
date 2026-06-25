// FILE: server/models/Report.js

const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    // ─── Reporter ─────────────────────────────────────────────────
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ─── Target (polymorphic) ─────────────────────────────────────
    targetType: {
      type: String,
      enum: ["Video", "Comment", "User", "LiveStream", "ChatMessage"],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      // Use refPath pattern if needed: refPath: "targetType"
    },

    // ─── Reason ──────────────────────────────────────────────────
    reason: {
      type: String,
      enum: [
        "spam",
        "harassment",
        "hateSpeech",
        "misinformation",
        "violence",
        "sexualContent",
        "copyright",
        "childSafety",
        "privacyViolation",
        "other",
      ],
      required: true,
    },
    description: {
      type: String,
      maxlength: 1000,
      default: "",
    },

    // ─── Status ──────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["pending", "reviewed", "actioned", "dismissed"],
      default: "pending",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // admin/moderator who reviewed
    },
    reviewNote: {
      type: String,
      maxlength: 500,
      default: null,
    },
    actionTaken: {
      type: String,
      enum: ["none", "warned", "deleted", "banned", "escalated", null],
      default: null,
    },
    reviewedAt: {
      type: Date,
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
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ targetType: 1, targetId: 1 });
reportSchema.index({ reporter: 1 });

const Report = mongoose.model("Report", reportSchema);
module.exports = Report;