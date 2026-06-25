// FILE: server/models/Playlist.js
const mongoose = require('mongoose')

const playlistSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: { type: String, default: '', maxlength: 500 },
    privacy: {
      type: String,
      enum: ['public', 'private', 'unlisted'],
      default: 'private',
    },
    videos: [
      {
        video:   { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
        addedAt: { type: Date, default: Date.now },
      },
    ],
    thumbnail: { type: String, default: '' },
  },
  { timestamps: true }
)

playlistSchema.index({ owner: 1, createdAt: -1 })

const Playlist = mongoose.model('Playlist', playlistSchema)
module.exports = Playlist