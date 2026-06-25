// server/models/AdminUser.js
const mongoose = require('mongoose')

const adminUserSchema = new mongoose.Schema(
  {
    username: {
      type:      String,
      required:  true,
      unique:    true,
      trim:      true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type:      String,
      required:  true,
      unique:    true,
      lowercase: true,
      trim:      true,
    },
    password: {
      type:     String,
      required: true,
      select:   false,
    },
    displayName: {
      type:      String,
      trim:      true,
      maxlength: 60,
      default:   '',
    },
    avatar: {
      type:    String,
      default: '',
    },
    role: {
      type:    String,
      enum:    ['admin', 'moderator'],
      default: 'moderator',
    },
    permissions: {
      canBanUsers:      { type: Boolean, default: false },
      canDeleteVideos:  { type: Boolean, default: true  },
      canActionReports: { type: Boolean, default: true  },
      canViewPayments:  { type: Boolean, default: false },
      canChangeRoles:   { type: Boolean, default: false },
      canEditFlags:     { type: Boolean, default: false },
    },
    theme: {
      type:    String,
      enum:    ['dark', 'light'],
      default: 'dark',
    },
    isActive: {
      type:    Boolean,
      default: true,
    },
    lastLoginAt: {
      type:    Date,
      default: null,
    },
    lastLoginIp: {
      type:    String,
      default: '',
    },
    refreshToken: {
      type:    String,
      default: null,
      select:  false,
    },
    meta: {
      type:    Map,
      of:      mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdBy: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'AdminUser',
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'adminusers',
  }
)

// ─── Only index role — email and username already indexed by unique:true ───
adminUserSchema.index({ role: 1 })

// ─── NO pre-save hook — passwords are hashed manually in controller/scripts ───

adminUserSchema.methods.toSafeProfile = function () {
  const obj = this.toObject()
  delete obj.password
  delete obj.refreshToken
  return obj
}

const AdminUser = mongoose.model('AdminUser', adminUserSchema)
module.exports = AdminUser