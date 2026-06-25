// FILE: server/models/AdCampaign.js

const mongoose = require("mongoose");

const adCampaignSchema = new mongoose.Schema(
  {
    // ─── Ownership ───────────────────────────────────────────────
    advertiser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ─── Campaign Identity ────────────────────────────────────────
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      maxlength: 500,
      default: "",
    },

    // ─── Ad Creative ─────────────────────────────────────────────
    adType: {
      type: String,
      enum: ["preroll", "midroll", "banner", "card"],
      default: "preroll",
    },
    videoUrl: {
      type: String,
      default: null, // Cloudinary URL for video ad
    },
    videoPublicId: {
      type: String,
      default: null,
    },
    imageUrl: {
      type: String,
      default: null, // for banner/card ads
    },
    imagePublicId: {
      type: String,
      default: null,
    },
    headline: {
      type: String,
      maxlength: 80,
      default: "",
    },
    ctaText: {
      type: String,
      maxlength: 30,
      default: "Learn More",
    },
    ctaUrl: {
      type: String,
      default: "",
    },
    skipAfterSeconds: {
      type: Number,
      default: 5, // skippable after N seconds (0 = non-skippable)
    },

    // ─── Targeting ────────────────────────────────────────────────
    targetCategories: {
      type: [String],
      default: [],
    },
    targetAgeGroups: {
      type: [String],
      enum: ["13-17", "18-24", "25-34", "35-44", "45+", "all"],
      default: ["all"],
    },
    targetLocations: {
      type: [String],
      default: [], // country/city codes
    },
    targetLanguages: {
      type: [String],
      default: ["en"],
    },

    // ─── Budget & Billing ─────────────────────────────────────────
    budgetTotal: {
      type: Number,
      required: true, // in paise
    },
    budgetDaily: {
      type: Number,
      default: null,
    },
    budgetSpent: {
      type: Number,
      default: 0,
    },
    costPerView: {
      type: Number,
      default: 0, // CPV in paise
    },

    // ─── Schedule ─────────────────────────────────────────────────
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },

    // ─── Status ──────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["draft", "pending", "active", "paused", "completed", "rejected"],
      default: "draft",
    },
    rejectionReason: {
      type: String,
      default: null,
    },

    // ─── Analytics ────────────────────────────────────────────────
    totalImpressions: { type: Number, default: 0 },
    totalViews: { type: Number, default: 0 },       // watched ≥30s or full
    totalClicks: { type: Number, default: 0 },
    totalSkips: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },   // %
    clickThroughRate: { type: Number, default: 0 }, // %

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
adCampaignSchema.index({ advertiser: 1, status: 1 });
adCampaignSchema.index({ status: 1, startDate: 1, endDate: 1 });
adCampaignSchema.index({ targetCategories: 1 });

const AdCampaign = mongoose.model("AdCampaign", adCampaignSchema);
module.exports = AdCampaign;