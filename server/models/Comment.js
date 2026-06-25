// FILE: server/models/Comment.js

const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    // ─── References ──────────────────────────────────────────────
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      // null = top-level comment; ObjectId = reply to another comment
    },

    // ─── Content ─────────────────────────────────────────────────
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },

    // ─── Media Attachment ─────────────────────────────────────────
    imageUrl: {
      type: String,
      default: null, // optional image in comment
    },
    imagePublicId: {
      type: String,
      default: null,
    },

    // ─── Engagement ───────────────────────────────────────────────
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref:  'User',
    }],
    likeCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    dislikeCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    replyCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isHeartedByCreator: {
      type: Boolean,
      default: false,
    },

    // ─── Reports ──────────────────────────────────────────────────
    reports: [{
      reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reason:   { type: String, default: 'other' },
      details:  { type: String, default: '' },
      createdAt:{ type: Date,   default: Date.now },
    }],
    reportCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ─── Moderation ───────────────────────────────────────────────
    isDeleted: {
      type: Boolean,
      default: false,
      // soft delete — keep record, replace text with "[deleted]"
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    flagCount: {
      type: Number,
      default: 0,
    },

    // ─── Timestamp anchor ─────────────────────────────────────────
    videoTimestamp: {
      type: Number,
      default: null,
      // if not null, comment is linked to a specific second in the video
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
commentSchema.index({ video: 1, parent: 1, createdAt: -1 });
commentSchema.index({ author: 1 });
commentSchema.index({ isPinned: -1, likeCount: -1 });

const Comment = mongoose.model("Comment", commentSchema);
module.exports = Comment;