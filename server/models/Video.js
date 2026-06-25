// FILE: server/models/Video.js

const mongoose = require("mongoose");

// ─── Sub-schema: Quality Variant ─────────────────────────────────
const qualitySchema = new mongoose.Schema(
  {
    label: { type: String }, // "360p", "720p", "1080p"
    url: { type: String },   // Cloudinary HLS URL
    publicId: { type: String },
    bitrate: { type: Number },
  },
  { _id: false }
);

// ─── Sub-schema: Chapter ─────────────────────────────────────────
const chapterSchema = new mongoose.Schema(
  {
    title: { type: String, maxlength: 100 },
    startTime: { type: Number }, // seconds
  },
  { _id: false }
);

// ─── Sub-schema: Subtitle Track ──────────────────────────────────
const subtitleSchema = new mongoose.Schema(
  {
    language: { type: String },  // "en", "hi"
    label: { type: String },     // "English", "Hindi"
    url: { type: String },       // VTT file URL
  },
  { _id: false }
);

// ─── Main Schema ─────────────────────────────────────────────────
const videoSchema = new mongoose.Schema(
  {
    // ─── Ownership ───────────────────────────────────────────────
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ─── Content ─────────────────────────────────────────────────
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      maxlength: 5000,
      default: "",
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    category: {
      type: String,
      default: "General",
      index: true,
    },
    language: {
      type: String,
      default: "en",
    },

    // ─── Media Files ─────────────────────────────────────────────
    videoUrl: {
      type: String,
      default: "", // filled after FFmpeg processing
    },
    videoPublicId: {
      type: String,
      default: "", // filled after FFmpeg processing
    },
    qualities: {
      type: [qualitySchema],
      default: [],
    },
    thumbnailUrl: {
      type: String,
      default: "",
    },
    autoThumbnails: {
      type: [{
        url:       { type: String },
        publicId:  { type: String },
        index:     { type: Number },
      }],
      default: [],
    },
    thumbnailPublicId: {
      type: String,
      default: "",
    },
    duration: {
      type: Number,  // seconds
      default: 0,
    },
    fileSize: {
      type: Number,  // bytes
      default: 0,
    },
    resolution: {
      type: String,  // "1920x1080"
      default: "",
    },
    mimeType: {
      type: String,
      default: "video/mp4",
    },

    // ─── Chapters & Subtitles ─────────────────────────────────────
    chapters: {
      type: [chapterSchema],
      default: [],
    },
    subtitles: {
      type: [subtitleSchema],
      default: [],
    },

    // ─── Status ──────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["processing", "published", "unlisted", "private", "deleted", "rejected"],
      default: "processing",
      index: true,
    },
    visibility: {
      type: String,
      enum: ["public", "unlisted", "private", "membersOnly"],
      default: "public",
    },
    processingProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    isShort: {
      type: Boolean,
      default: false, // true = vertical, ≤60s
      index: true,
    },
    scheduledAt: {
      type: Date,
      default: null,
    },

    // ─── Engagement Stats ─────────────────────────────────────────
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
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
    commentCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    shareCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ── Embedded comments removed — comments now live in Comment collection ─

    shareCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    saveCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ─── Content Flags ────────────────────────────────────────────
    ageRestricted: {
      type: Boolean,
      default: false,
    },
    containsMusic: {
      type: Boolean,
      default: false,
    },
    madeForKids: {
      type: Boolean,
      default: false,
    },
    allowComments: {
      type: Boolean,
      default: true,
    },
    allowRatings: {
      type: Boolean,
      default: true,
    },

    // ─── Moderation ───────────────────────────────────────────────
    isFlagged: {
      type: Boolean,
      default: false,
    },
    flagReason: {
      type: String,
      default: "",
    },
    moderationNote: {
      type: String,
      default: "",
    },

    // ─── Live VOD ─────────────────────────────────────────────────
    isLiveVOD: {
      type: Boolean,
      default: false,
    },
    sourceStreamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LiveStream',
      default: null,
    },
    liveStartedAt: {
      type: Date,
      default: null,
    },

    // ─── Monetisation ─────────────────────────────────────────────
    isMonetized: {
      type: Boolean,
      default: false,
    },
    adCampaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdCampaign",
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
videoSchema.index({ title: "text", description: "text", tags: "text" }); // full-text search
videoSchema.index({ uploader: 1, status: 1 });
videoSchema.index({ category: 1, viewCount: -1 });
videoSchema.index({ isShort: 1, status: 1 });
videoSchema.index({ createdAt: -1 });
videoSchema.index({ scheduledAt: 1 }, { sparse: true });

const Video = mongoose.model("Video", videoSchema);
module.exports = Video;