// FILE: server/models/Conversation.js

const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    // ─── Type ────────────────────────────────────────────────────
    type: {
      type: String,
      enum: ["dm", "group"],
      default: "dm",
    },

    // ─── Participants ─────────────────────────────────────────────
    participants: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      required: true,
      // DM: exactly 2. Group: 2–50
    },

    // ─── Group Info (null for DM) ─────────────────────────────────
    groupName: {
      type: String,
      maxlength: 80,
      default: null,
    },
    groupAvatar: {
      type: String,
      default: null,
    },
    groupAvatarPublicId: {
      type: String,
      default: null,
    },
    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ─── Last Message Preview ─────────────────────────────────────
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatMessage",
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
    lastMessageText: {
      type: String,
      maxlength: 100,
      default: null, // snippet for conversation list preview
    },

    // ─── Unread Counts Map ────────────────────────────────────────
    // { "userId1": 3, "userId2": 0 }
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },

    // ─── Mute / Archive per User ──────────────────────────────────
    mutedBy: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },
    archivedBy: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },
    deletedBy: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
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
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });

const Conversation = mongoose.model("Conversation", conversationSchema);
module.exports = Conversation;