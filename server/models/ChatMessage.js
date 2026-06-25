// FILE: server/models/ChatMessage.js
const mongoose = require('mongoose')

const chatMessageSchema = new mongoose.Schema({
  streamId: { type: mongoose.Schema.Types.ObjectId, ref: 'LiveStream', required: true, index: true },
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  username: { type: String, required: true, maxlength: 100 },
  avatar:   { type: String, default: '' },
  message:  { type: String, required: true, maxlength: 300 },
  isHost:   { type: Boolean, default: false },
  streamOffsetMs: { type: Number, default: 0 }, // ms since stream startedAt — used for VOD chat replay
}, { timestamps: true })

chatMessageSchema.index({ streamId: 1, createdAt: 1 })
module.exports = mongoose.model('ChatMessage', chatMessageSchema)