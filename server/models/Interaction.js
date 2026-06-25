// FILE: server/models/Interaction.js

const mongoose = require("mongoose");

// Single collection tracks all user interactions:
// likes, dislikes, saves (playlist adds), shares
// Keeps Video/Comment counts as denormalized counters,
// while this collection is the source of truth for "did user X like video Y?"

const interactionSchema = new mongoose.Schema(
  {
    // ─── User ─────────────────────────────────────────────────────
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ─── Target (polymorphic) ─────────────────────────────────────
    targetType: {
      type: String,
      enum: ["Video", "Comment", "LiveStream"],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    // ─── Action ───────────────────────────────────────────────────
    action: {
      type: String,
      enum: ["like", "dislike", "save", "share", "report"],
      required: true,
    },

    // ─── Save / Playlist ─────────────────────────────────────────
    // Only relevant when action = "save"
    playlist: {
      type: String,
      default: "watchLater",
      // "watchLater", "liked", or custom playlist name
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

// ─── One action per user per target per action type ───────────────
interactionSchema.index(
  { user: 1, targetType: 1, targetId: 1, action: 1 },
  { unique: true }
);
interactionSchema.index({ targetId: 1, action: 1 }); // count likes on a video
interactionSchema.index({ user: 1, action: 1, createdAt: -1 }); // liked videos list

const Interaction = mongoose.model("Interaction", interactionSchema);
module.exports = Interaction;