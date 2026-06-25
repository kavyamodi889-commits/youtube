// FILE: server/models/User.js

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // ─── Identity ───────────────────────────────────────────────
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      default: null,
    },

    // ─── Google OAuth ────────────────────────────────────────────
    googleId: {
      type: String,
      default: null,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    // ─── Profile ─────────────────────────────────────────────────
    displayName: {
      type: String,
      trim: true,
      maxlength: 60,
      default: "",
    },
    avatar: {
      type: String,
      default: "",
    },
    avatarPublicId: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      maxlength: 500,
      default: "",
    },
    handle: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    website: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "",
    },
    bannerImage: {
      type: String,
      default: "",
    },
    bannerPublicId: {
      type: String,
      default: "",
    },

    // ─── Signup Interests ─────────────────────────────────────────
    // Short IDs selected at signup (e.g. 'tech', 'music', 'gaming').
    // Used by the recommendation engine for cold-start personalisation.
    interests: {
      type: [String],
      default: [],
    },

    // ─── Social / Channel Links ───────────────────────────────────
    links: {
      type: [
        {
          label: { type: String, trim: true, maxlength: 30, default: "" },
          url:   { type: String, trim: true, maxlength: 200, default: "" },
        },
      ],
      default: [],
    },

    // ─── Channel Stats ────────────────────────────────────────────
    subscriberCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalViews: {
      type: Number,
      default: 0,
      min: 0,
    },
    videoCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ─── User Activity (proper arrays — not hidden in meta) ───────
    subscriptions: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    likedVideos: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
      default: [],
    },
    dislikedVideos: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
      default: [],
    },
    savedVideos: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
      default: [],
    },
    watchLater: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
      default: [],
    },
    downloadedVideos: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
      default: [],
    },
    notInterestedVideos: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
      default: [],
    },
    hiddenChannels: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },

    // ─── Roles & Status ───────────────────────────────────────────
    role: {
      type: String,
      enum: ["user", "creator", "admin", "moderator"],
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isChannelVerified: {
      type: Boolean,
      default: false,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    banReason: {
      type: String,
      default: "",
    },
    banExpiresAt: {
      type: Date,
      default: null,
    },

    // ─── Tokens ───────────────────────────────────────────────────
    refreshToken: {
      type: String,
      default: null,
    },
    emailVerifyToken: {
      type: String,
      default: null,
    },
    emailVerifyExpires: {
      type: Date,
      default: null,
    },
    passwordResetToken: {
      type: String,
      default: null,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
    },

    // ─── Notifications & Push ─────────────────────────────────────
    pushSubscription: {
      type: Object,
      default: null,
    },
    notificationPrefs: {
      subscriptions: { type: Boolean, default: true },
      likes: { type: Boolean, default: true },
      comments: { type: Boolean, default: true },
      live: { type: Boolean, default: true },
      system: { type: Boolean, default: true },
    },

    // ─── Browser Permissions (saved so we never ask again) ────────
    browserPermissions: {
      notifications: { type: String, enum: ['granted','denied','default','unsupported',null], default: null },
      microphone:    { type: String, enum: ['granted','denied','default','unsupported',null], default: null },
      camera:        { type: String, enum: ['granted','denied','default','unsupported',null], default: null },
    },

    // ─── Monetisation ─────────────────────────────────────────────
    membershipTier: {
      type: String,
      enum: ["none", "basic", "standard", "premium", "ultra"],
      default: "none",
    },
    membershipExpiresAt: {
      type: Date,
      default: null,
    },
    razorpayCustomerId: {
      type: String,
      default: null,
    },

    // ─── Focus Mode ───────────────────────────────────────────────
    focusStreak: {
      type: Number,
      default: 0,
    },
    totalFocusMinutes: {
      type: Number,
      default: 0,
    },

    // ─── Privacy & Settings ───────────────────────────────────────
    theme: {
      type: String,
      enum: ["dark", "light", "amoled", "system"],
      default: "dark",
    },
    language: {
      type: String,
      default: "en",
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    showLikedVideos: {
      type: Boolean,
      default: true,
    },
    showSubscriptions: {
      type: Boolean,
      default: true,
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
userSchema.index({ googleId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ subscriptions: 1 });
userSchema.index({ likedVideos: 1 });

// ─── Virtuals ────────────────────────────────────────────────────
userSchema.virtual("channelUrl").get(function () {
  return `/channel/${this.handle || this._id}`;
});

// ─── Methods ─────────────────────────────────────────────────────
userSchema.methods.toPublicProfile = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.password;
  delete obj.refreshToken;
  delete obj.emailVerifyToken;
  delete obj.passwordResetToken;
  delete obj.pushSubscription;
  return obj;
};

const User = mongoose.model("User", userSchema);
module.exports = User;