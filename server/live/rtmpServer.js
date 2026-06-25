// FILE: server/live/rtmpServer.js
// Strategy: NMS receives RTMP from OBS, then we spawn FFmpeg manually
// to read from NMS's RTMP output and write HLS files to disk.
// This gives us full control over FFmpeg and avoids NMS trans failures.

const NodeMediaServer = require('node-media-server')
const { spawn }       = require('child_process')
const path            = require('path')
const fs              = require('fs')
const LiveStream      = require('../models/LiveStream')

const HLS_ROOT       = path.resolve(process.env.HLS_OUTPUT_PATH || './tmp/hls')
const liveHlsDir     = path.join(HLS_ROOT, 'live')
const RTMP_PORT      = Number(process.env.RTMP_PORT) || 1935
const RTMP_HTTP_PORT = Number(process.env.RTMP_HTTP_PORT) || 8888
const SERVER_PORT    = Number(process.env.PORT) || 5000
const FFMPEG         = process.env.FFMPEG_PATH || 'ffmpeg'

fs.mkdirSync(liveHlsDir, { recursive: true })

// Clean stale non-archived HLS dirs on startup (async, after DB connects)
async function cleanStaleHlsDirs() {
  try {
    const dirs = fs.readdirSync(liveHlsDir, { withFileTypes: true })
      .filter(d => d.isDirectory()).map(d => d.name)
    for (const streamKey of dirs) {
      try {
        const archived = await LiveStream.findOne({ streamKey, isArchived: true }).lean()
        if (!archived) {
          fs.rmSync(path.join(liveHlsDir, streamKey), { recursive: true, force: true })
        }
      } catch {}
    }
    console.log('[RTMP] Cleaned stale HLS dirs on startup')
  } catch {}
}
// Run after a short delay so DB is connected
setTimeout(cleanStaleHlsDirs, 5000)

// Track active FFmpeg processes per streamKey
const activeFFmpeg = new Map()

// NMS — minimal config, just RTMP receiver + HTTP for stats
const nmsConfig = {
  rtmp: {
    port:         RTMP_PORT,
    chunk_size:   60000,
    gop_cache:    true,
    ping:         60,
    ping_timeout: 120,
  },
  http: {
    port:         RTMP_HTTP_PORT,
    allow_origin: '*',
    mediaroot:    HLS_ROOT,
  },
  // NO trans — we spawn FFmpeg ourselves for full control
}

const nms = new NodeMediaServer(nmsConfig)

function toFF(p) { return p.replace(/\\/g, '/') }

// Spawn FFmpeg to read from NMS RTMP output → write HLS
function startFFmpeg(streamKey) {
  if (activeFFmpeg.has(streamKey)) return // already running

  const hlsDir    = path.join(liveHlsDir, streamKey)
  const hlsOutput = path.join(hlsDir, 'index.m3u8')
  fs.mkdirSync(hlsDir, { recursive: true })
  // Remove stale EXT-X-ENDLIST if reconnecting so FFmpeg can append
  try {
    if (fs.existsSync(hlsOutput)) {
      let m = fs.readFileSync(hlsOutput, 'utf8')
      if (m.includes('#EXT-X-ENDLIST')) {
        fs.writeFileSync(hlsOutput, m.replace('#EXT-X-ENDLIST', '').trimEnd() + '\n', 'utf8')
      }
    }
  } catch {}

  // Read from NMS's internal RTMP restream on localhost
  const rtmpInput = `rtmp://127.0.0.1:${RTMP_PORT}/live/${streamKey}`

  const args = [
    '-i', rtmpInput,
    // Copy codecs — no re-encoding, zero CPU
    '-c:v', 'copy',
    '-c:a', 'copy',
    // HLS output — keep ALL segments for VOD stitching
    '-f', 'hls',
    '-hls_time', '2',
    '-hls_list_size', '0',          // 0 = unlimited, keep all segments
    '-hls_flags', 'append_list+omit_endlist', // no delete_segments!
    '-hls_segment_filename', toFF(path.join(hlsDir, 'seg%03d.ts')),
    toFF(hlsOutput),
  ]

  console.log(`[RTMP-FF] Starting FFmpeg for: ${streamKey}`)
  const ff = spawn(FFMPEG, args, { stdio: ['ignore', 'pipe', 'pipe'] })

  let log = ''
  ff.stderr.on('data', d => {
    log += d.toString()
    // Log first connection info
    if (log.length < 2000) process.stdout.write(`[FF] ${d.toString().trim()}\n`)
  })
  ff.on('error', err => {
    console.error(`[RTMP-FF] spawn error: ${err.message}`)
    if (err.code === 'ENOENT') console.error('[RTMP-FF] ❌ FFmpeg not found! Install FFmpeg and add to PATH.')
    activeFFmpeg.delete(streamKey)
  })
  ff.on('close', code => {
    console.log(`[RTMP-FF] FFmpeg exited (${code}) for: ${streamKey}`)
    activeFFmpeg.delete(streamKey)
  })

  activeFFmpeg.set(streamKey, ff)

  // Poll for index.m3u8 and update DB when ready
  let pollCount = 0
  const poll = setInterval(async () => {
    pollCount++
    try {
      if (fs.existsSync(hlsOutput) && fs.statSync(hlsOutput).size > 0) {
        clearInterval(poll)
        const hlsUrl = `http://localhost:${SERVER_PORT}/hls/live/${streamKey}/index.m3u8`
        console.log(`[RTMP-FF] ✅ HLS ready: ${hlsUrl}`)
        await LiveStream.findOneAndUpdate(
          { streamKey, status: { $ne: 'ended' } },
          { status: 'live', hlsUrl, startedAt: new Date() }
        )
      }
    } catch {}
    if (pollCount > 60) {
      clearInterval(poll)
      console.error(`[RTMP-FF] Timeout waiting for HLS from FFmpeg`)
    }
  }, 1000)
}

function stopFFmpeg(streamKey) {
  const ff = activeFFmpeg.get(streamKey)
  if (ff) {
    try { ff.kill('SIGTERM') } catch {}
    activeFFmpeg.delete(streamKey)
  }
}

// Extract stream key from NMS v3/v4 event args
function getStreamKey(...args) {
  const hexKey = /\/live\/([a-f0-9]{16,})/i
  for (const a of args) {
    if (typeof a === 'string') {
      const m = a.match(hexKey); if (m) return m[1]
    }
    if (a && typeof a === 'object') {
      for (const p of [
        a.publishStream?.path, a.pushStream?.path,
        a.streamPath, a.path, a.StreamPath,
      ]) {
        if (typeof p === 'string') {
          const m = p.match(hexKey); if (m) return m[1]
        }
      }
    }
  }
  return null
}

// ── NMS events ────────────────────────────────────────────────────
nms.on('prePublish', async (...args) => {
  const streamKey = getStreamKey(...args)
  if (!streamKey) return
  console.log(`[RTMP] prePublish ✓ key: ${streamKey}`)

  try {
    const stream = await LiveStream.findOne({ streamKey })
    if (!stream) { console.warn(`[RTMP] Unknown key: ${streamKey}`); return }

    // Update DB immediately (status may be scheduled, live, or ended from reconnect)
    await LiveStream.findByIdAndUpdate(stream._id, {
      status:    'live',
      rtmpUrl:   `rtmp://localhost:${RTMP_PORT}/live/${streamKey}`,
      startedAt: stream.startedAt || new Date(),
    })
    console.log(`[RTMP] ✅ "${stream.title}" — starting FFmpeg HLS writer`)

    // Wait 1s for NMS to be ready to relay, then start FFmpeg
    setTimeout(() => startFFmpeg(streamKey), 1000)
  } catch (err) {
    console.error('[RTMP] prePublish error:', err.message)
  }
})

nms.on('donePublish', async (...args) => {
  const streamKey = getStreamKey(...args)
  if (!streamKey) return
  console.log(`[RTMP] donePublish: ${streamKey}`)

  // Stop FFmpeg gracefully — wait for it to finish writing remaining segments
  const ff = activeFFmpeg.get(streamKey)
  if (ff) {
    await new Promise(resolve => {
      const forceKill = setTimeout(() => {
        try { ff.kill('SIGKILL') } catch {}
        resolve()
      }, 8000)
      ff.on('close', () => { clearTimeout(forceKill); resolve() })
      // Try graceful quit first, then SIGTERM after 1s
      try { ff.stdin?.write('q'); ff.stdin?.end() } catch {}
      setTimeout(() => { try { ff.kill('SIGTERM') } catch {} }, 1000)
    })
    activeFFmpeg.delete(streamKey)
  }

  // Write #EXT-X-ENDLIST so the HLS is a valid VOD
  const m3u8Path = path.join(liveHlsDir, streamKey, 'index.m3u8')
  try {
    if (fs.existsSync(m3u8Path)) {
      let m3u8 = fs.readFileSync(m3u8Path, 'utf8')
      if (!m3u8.includes('#EXT-X-ENDLIST')) {
        fs.writeFileSync(m3u8Path, m3u8.trimEnd() + '\n#EXT-X-ENDLIST\n', 'utf8')
        console.log(`[RTMP] ✓ EXT-X-ENDLIST written for ${streamKey}`)
      }
    }
  } catch (e) { console.error('[RTMP] EXT-X-ENDLIST error:', e.message) }

  try {
    const stream = await LiveStream.findOne({ streamKey }).select('_id startedAt').lean()
    const durationSec = stream?.startedAt
      ? Math.round((Date.now() - new Date(stream.startedAt).getTime()) / 1000)
      : 0

    await LiveStream.findOneAndUpdate(
      { streamKey },
      { status: 'ended', endedAt: new Date(), duration: durationSec }
    )

    // Emit socket event so viewers see stream ended
    if (stream?._id) {
      const socketIO = require('../lib/socketIO')
      socketIO.emitTo(`stream:${stream._id}`, 'stream:ended', {})
    }

    // Do NOT delete HLS files — they're needed for save-as-video
    // Schedule cleanup only after 24 hours (or never if archived)
    setTimeout(async () => {
      try {
        const s = await LiveStream.findOne({ streamKey, isArchived: true }).lean()
        if (!s) {
          // Not archived — safe to delete
          fs.rmSync(path.join(liveHlsDir, streamKey), { recursive: true, force: true })
          console.log(`[RTMP] Cleaned HLS dir: ${streamKey}`)
        }
      } catch {}
    }, 24 * 60 * 60 * 1000) // 24 hours
  } catch (err) {
    console.error('[RTMP] donePublish error:', err.message)
  }
})

nms.on('prePlay', (...args) => {
  const key = getStreamKey(...args)
  if (key) console.log(`[RTMP] viewer joined: ${key}`)
})

module.exports = nms