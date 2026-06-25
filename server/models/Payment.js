// FILE: server/models/Payment.js

const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    // ─── Parties ─────────────────────────────────────────────────
    payer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    payee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ─── Payment Type ─────────────────────────────────────────────
    type: {
      type: String,
      enum: ["superChat", "membership", "channelMembership", "donation", "focus_reward"],
      required: true,
    },

    // ─── Razorpay IDs ─────────────────────────────────────────────
    // focus_reward records use a generated synthetic ID (no Razorpay)
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    razorpaySignature: {
      type: String,
      default: null,
    },

    // ─── Amount ───────────────────────────────────────────────────
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    amountRefunded: {
      type: Number,
      default: 0,
    },

    // ─── Status ──────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["created", "captured", "failed", "refunded", "disputed"],
      default: "created",
    },
    failureReason: {
      type: String,
      default: null,
    },

    // ─── Context ─────────────────────────────────────────────────
    liveStream: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LiveStream",
      default: null,
    },
    superChatMessage: {
      type: String,
      maxlength: 200,
      default: null,
    },
    superChatColor: {
      type: String,
      default: null,
    },
    membershipTier: {
      type: String,
      enum: ["none", "basic", "standard", "premium", "ultra", null],
      default: null,
    },
    membershipMonths: {
      type: Number,
      default: 1,
    },

    // ─── Focus Reward (populated for type=focus_reward) ───────────
    rewardTrigger: {
      type: String,
      enum: ["30min_x100", "60min_x100", null],
      default: null,
      // '30min_x100' → 100 completed 30-min sessions in a month → 1 month Premium free
      // '60min_x100' → 100 completed 60-min sessions in a month → 1 month Ultra free
    },
    rewardMonth: {
      type: String, // e.g. "2025-04"
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
// Note: razorpayOrderId already indexed via unique:true above
paymentSchema.index({ payer: 1, status: 1 });
paymentSchema.index({ payee: 1, type: 1 });
paymentSchema.index({ liveStream: 1 }, { sparse: true });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ type: 1, rewardMonth: 1 }, { sparse: true });

const Payment = mongoose.model("Payment", paymentSchema);
module.exports = Payment;