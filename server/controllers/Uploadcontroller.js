// FILE: server/controllers/Uploadcontroller.js
const { cloudinary } = require('../utils/cloudinary')
const User           = require('../models/User')
const asyncHandler   = require('../utils/asyncHandler')
const { sendResponse, sendError } = require('../utils/sendResponse')

const uploadToCloudinary = (buffer, options) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) =>
      err ? reject(err) : resolve(result)
    )
    stream.end(buffer)
  })

// POST /api/upload/avatar
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) return sendError(res, 400, 'No file uploaded')

  const user = await User.findById(req.user._id)
  if (!user) return sendError(res, 404, 'User not found')

  if (user.avatarPublicId) {
    await cloudinary.uploader.destroy(user.avatarPublicId).catch(() => {})
  }

  const result = await uploadToCloudinary(req.file.buffer, {
    folder: 'aura/avatars',
    transformation: [{ width: 256, height: 256, crop: 'fill', gravity: 'face' }],
    resource_type: 'image',
  })

  user.avatar         = result.secure_url
  user.avatarPublicId = result.public_id
  await user.save()

  return sendResponse(res, 200, 'Avatar updated', {
    avatar: user.avatar,
    user:   user.toPublicProfile(),
  })
})

// POST /api/upload/banner
const uploadBanner = asyncHandler(async (req, res) => {
  if (!req.file) return sendError(res, 400, 'No file uploaded')

  const user = await User.findById(req.user._id)
  if (!user) return sendError(res, 404, 'User not found')

  if (user.bannerPublicId) {
    await cloudinary.uploader.destroy(user.bannerPublicId).catch(() => {})
  }

  const result = await uploadToCloudinary(req.file.buffer, {
    folder: 'aura/banners',
    transformation: [{ width: 1280, height: 360, crop: 'fill' }],
    resource_type: 'image',
  })

  user.bannerImage    = result.secure_url
  user.bannerPublicId = result.public_id
  await user.save()

  return sendResponse(res, 200, 'Banner updated', {
    bannerImage: user.bannerImage,
    user:        user.toPublicProfile(),
  })
})

module.exports = { uploadAvatar, uploadBanner }