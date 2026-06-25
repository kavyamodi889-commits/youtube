// FILE: server/utils/videoProcessor.js
const ffmpeg     = require('fluent-ffmpeg')
const cloudinary = require('cloudinary').v2
const fs         = require('fs')
const path       = require('path')
const os         = require('os')

// ── Point fluent-ffmpeg at bundled static binaries ────────────────────────────
// Install once: npm install ffmpeg-static ffprobe-static
try {
  const ffmpegPath  = require('ffmpeg-static')
  const ffprobePath = require('ffprobe-static').path
  if (ffmpegPath)  ffmpeg.setFfmpegPath(ffmpegPath)
  if (ffprobePath) ffmpeg.setFfprobePath(ffprobePath)
  console.log('[processor] ffmpeg :', ffmpegPath)
  console.log('[processor] ffprobe:', ffprobePath)
} catch {
  console.warn('[processor] ffmpeg-static / ffprobe-static not found — falling back to system PATH')
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// ── Quality ladder — only renditions ≤ source height are generated ────────────
const QUALITY_LADDER = [
  { label: '144p',  height: 144,  bitrate: '200k',  audioBitrate: '64k'  },
  { label: '240p',  height: 240,  bitrate: '400k',  audioBitrate: '96k'  },
  { label: '360p',  height: 360,  bitrate: '800k',  audioBitrate: '96k'  },
  { label: '480p',  height: 480,  bitrate: '1400k', audioBitrate: '128k' },
  { label: '720p',  height: 720,  bitrate: '2800k', audioBitrate: '128k' },
  { label: '1080p', height: 1080, bitrate: '5000k', audioBitrate: '192k' },
]

// ── Get video metadata (resolution, duration) ─────────────────────────────────
function getVideoMeta(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, meta) => {
      if (err) return reject(err)
      const vStream = meta.streams.find(s => s.codec_type === 'video')
      resolve({
        width:    vStream?.width    || 0,
        height:   vStream?.height   || 0,
        duration: meta.format?.duration || 0,
        size:     meta.format?.size     || 0,
      })
    })
  })
}


// ── Extract 3 thumbnail frames via FFmpeg → upload to Cloudinary ──────────────
function extractThumbnails(inputPath, videoPublicIdBase, duration, isShort = false) {
  return new Promise(async (resolve) => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aura-thumb-'))
    const thumbnails = []

    // Pick 3 timestamps: 10%, 30%, 60% through the video (avoid black intros/outros)
    const times = [
      Math.max(1, Math.floor(duration * 0.10)),
      Math.max(2, Math.floor(duration * 0.30)),
      Math.max(3, Math.floor(duration * 0.60)),
    ]

    // Shorts are portrait (9:16) — scale height to 854, width proportional
    // Regular videos are landscape (16:9) — scale width to 480, height proportional
    const scaleFilter = isShort ? 'scale=-2:854' : 'scale=480:-2'

    for (let i = 0; i < times.length; i++) {
      const t        = times[i]
      const outPath  = path.join(tmpDir, `thumb_${i}.jpg`)
      try {
        await new Promise((res, rej) => {
          ffmpeg(inputPath)
            .seekInput(t)
            .frames(1)
            .output(outPath)
            .outputOptions(['-vf', scaleFilter, '-q:v', '3'])
            .on('end',   res)
            .on('error', rej)
            .run()
        })
        const result = await uploadToCloudinary(outPath, {
          resource_type: 'image',
          folder:        'aura/thumbnails',
          public_id:     `${videoPublicIdBase}_thumb_${i}`,
          overwrite:     true,
        })
        thumbnails.push({ url: result.secure_url, publicId: result.public_id, index: i })
        fs.unlinkSync(outPath)
      } catch (e) {
        console.warn(`[processor] thumb ${i} failed:`, e.message)
      }
    }

    try { fs.rmSync(tmpDir, { recursive: true, force: true }) } catch {}
    resolve(thumbnails)
  })
}

// ── Transcode one rendition ───────────────────────────────────────────────────
function transcodeRendition(inputPath, outputPath, height, bitrate, audioBitrate) {
  return new Promise((resolve, reject) => {
    // Keep aspect ratio: scale width to nearest even number, fix height
    const scaleFilter = `scale=-2:${height}`

    ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .videoBitrate(bitrate)
      .audioBitrate(audioBitrate)
      .videoFilter(scaleFilter)
      .outputOptions([
        '-preset fast',
        '-crf 23',
        '-movflags +faststart',  // web-optimised: moov atom at front
        '-pix_fmt yuv420p',
      ])
      .output(outputPath)
      .on('end', resolve)
      .on('error', reject)
      .run()
  })
}

// ── Upload file buffer / path to Cloudinary ───────────────────────────────────
function uploadToCloudinary(filePath, options) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(filePath, options, (err, result) => {
      if (err) return reject(err)
      resolve(result)
    })
  })
}

// ── Convert .srt → .vtt ───────────────────────────────────────────────────────
function srtToVtt(srtContent) {
  return 'WEBVTT\n\n' + srtContent
    .replace(/\r\n/g, '\n')
    .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2')  // SRT timestamps use comma
    .trim()
}

// ── Main: process video, return qualities array + meta ────────────────────────
async function processVideo(inputBuffer, videoPublicIdBase, onProgress) {
  const tmpDir   = fs.mkdtempSync(path.join(os.tmpdir(), 'aura-'))
  const inputPath = path.join(tmpDir, 'input.mp4')

  try {
    // Write buffer to temp file
    fs.writeFileSync(inputPath, inputBuffer)

    // Get source metadata
    const meta = await getVideoMeta(inputPath)
    console.log(`[processor] source: ${meta.width}x${meta.height}, ${Math.round(meta.duration)}s`)

    // Filter quality ladder to only include ≤ source height
    const applicableQualities = QUALITY_LADDER.filter(q => q.height <= meta.height)
    // Always include at least one quality (the lowest possible)
    if (applicableQualities.length === 0) applicableQualities.push(QUALITY_LADDER[0])

    const qualities    = []
    const total        = applicableQualities.length
    let   completed    = 0

    for (const q of applicableQualities) {
      const outputPath = path.join(tmpDir, `${q.label}.mp4`)

      console.log(`[processor] transcoding ${q.label}...`)
      await transcodeRendition(inputPath, outputPath, q.height, q.bitrate, q.audioBitrate)

      // Upload to Cloudinary
      const result = await uploadToCloudinary(outputPath, {
        resource_type: 'video',
        folder:        'aura/videos',
        public_id:     `${videoPublicIdBase}_${q.label}`,
        overwrite:     true,
      })

      qualities.push({
        label:    q.label,
        url:      result.secure_url,
        publicId: result.public_id,
        bitrate:  parseInt(q.bitrate),
      })

      completed++
      if (onProgress) onProgress(Math.round((completed / total) * 90)) // 0-90%
      console.log(`[processor] ✅ ${q.label} uploaded`)

      // Clean up temp rendition
      fs.unlinkSync(outputPath)
    }

    // Extract 3 auto thumbnails at 10%, 30%, 60% of video
    const isShort = meta.height > meta.width && meta.duration <= 60
    const autoThumbnails = await extractThumbnails(inputPath, videoPublicIdBase, meta.duration, isShort)
    console.log(`[processor] ✅ ${autoThumbnails.length} auto-thumbnails generated (isShort=${isShort})`)

    if (onProgress) onProgress(100)

    return {
      qualities,
      autoThumbnails,
      duration:   Math.round(meta.duration),
      fileSize:   meta.size,
      resolution: `${meta.width}x${meta.height}`,
      // Best quality URL (highest rendition) as the main videoUrl
      videoUrl:   qualities[qualities.length - 1].url,
      videoPublicId: qualities[qualities.length - 1].publicId,
    }
  } finally {
    // Clean up temp dir
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    } catch {}
  }
}

// ── Process subtitle file (.srt or .vtt) → upload to Cloudinary ──────────────
async function processSubtitle(buffer, filename, videoPublicIdBase, language, label) {
  const tmpDir   = fs.mkdtempSync(path.join(os.tmpdir(), 'aura-sub-'))
  const ext      = path.extname(filename).toLowerCase()

  try {
    let vttContent
    if (ext === '.srt') {
      vttContent = srtToVtt(buffer.toString('utf8'))
    } else if (ext === '.vtt') {
      vttContent = buffer.toString('utf8')
    } else {
      throw new Error('Unsupported subtitle format. Use .srt or .vtt')
    }

    const vttPath = path.join(tmpDir, `${language}.vtt`)
    fs.writeFileSync(vttPath, vttContent, 'utf8')

    const result = await uploadToCloudinary(vttPath, {
      resource_type: 'raw',
      folder:        'aura/subtitles',
      public_id:     `${videoPublicIdBase}_${language}`,
      overwrite:     true,
    })

    return { language, label, url: result.secure_url }
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }) } catch {}
  }
}

module.exports = { processVideo, processSubtitle, getVideoMeta, extractThumbnails }