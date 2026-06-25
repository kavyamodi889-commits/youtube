// FILE: server/live/socketStream.js
const { spawn }      = require('child_process')
const path           = require('path')
const fs             = require('fs')
const LiveStream     = require('../models/LiveStream')
const ChatMessage    = require('../models/ChatMessage')

const HLS_ROOT = process.env.HLS_OUTPUT_PATH || './tmp/hls'
const activeStreams  = new Map()   // streamId -> { ffmpeg, viewers: Set, streamKey }
const roomViewers   = new Map()   // streamId -> Set of socket.id  (works for OBS streams too)

function toFFmpegPath(p) { return p.replace(/\\/g, '/') }

module.exports = function setupSocketStream(io) {
  io.on('connection', socket => {

    socket.on('user:join', ({ userId }) => {
      if (userId) { socket.join(`user:${userId}`); socket.userId = userId }
    })

    // ── HOST: start stream ──────────────────────────────────────
    socket.on('stream:start', async ({ streamId, streamKey, mimeType }) => {
      try {
        const stream = await LiveStream.findById(streamId)
        if (!stream || stream.streamKey !== streamKey) {
          return socket.emit('stream:error', 'Invalid stream ID or key')
        }

        const hlsDir    = path.join(HLS_ROOT, 'live', streamKey)
        const hlsOutput = path.join(hlsDir, 'index.m3u8')
        fs.mkdirSync(hlsDir, { recursive: true })

        const hlsDirFF    = toFFmpegPath(hlsDir)
        const hlsOutputFF = toFFmpegPath(hlsOutput)
        const ffmpegPath  = process.env.FFMPEG_PATH || 'ffmpeg'

        const ffmpeg = spawn(ffmpegPath, [
          '-analyzeduration', '0', '-probesize', '32',
          '-f', 'webm', '-i', 'pipe:0',
          '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency',
          '-crf', '28', '-g', '15', '-keyint_min', '15', '-sc_threshold', '0', '-bf', '0',
          '-c:a', 'aac', '-ar', '44100', '-b:a', '96k',
          '-f', 'hls', '-hls_time', '2', '-hls_list_size', '0',
          '-hls_flags', 'append_list+omit_endlist',
          '-hls_segment_filename', `${hlsDirFF}/seg%03d.ts`,
          hlsOutputFF,
        ], { stdio: ['pipe', 'pipe', 'pipe'] })

        let ffmpegLog = ''
        ffmpeg.stderr.on('data', d => { ffmpegLog += d.toString() })
        ffmpeg.on('error', err => {
          const msg = err.code === 'ENOENT'
            ? 'FFmpeg not found. Install FFmpeg and add it to PATH.'
            : `FFmpeg error: ${err.message}`
          socket.emit('stream:error', msg)
          activeStreams.delete(streamId)
        })
        ffmpeg.on('close', code => {
          if (code !== 0 && code !== null) console.error(`[FFmpeg] exit ${code}:`, ffmpegLog.slice(-400))
          activeStreams.delete(streamId)
        })

        activeStreams.set(streamId, { ffmpeg, viewers: new Set(), streamKey })

        // Set immediately so stream:chunk works
        socket.streamId = streamId
        socket.isHost   = true

        // Wait for .m3u8 before notifying client
        const hlsUrl = `http://localhost:${process.env.PORT || 5000}/hls/live/${streamKey}/index.m3u8`
        let ready = false, pollTimer = null, safeTimer = null

        const notifyReady = async () => {
          if (ready) return
          ready = true
          if (pollTimer) clearInterval(pollTimer)
          if (safeTimer) clearTimeout(safeTimer)
          await LiveStream.findByIdAndUpdate(streamId, { status: 'live', hlsUrl, startedAt: new Date() }).catch(() => {})
          socket.join(`stream:${streamId}`)
          socket.emit('stream:ready', { hlsUrl })
          io.emit('stream:went-live', { streamId, title: stream.title, hostId: stream.host })
          console.log(`[Socket] ▶ Stream live: ${streamId}`)
        }

        pollTimer = setInterval(() => {
          try { if (fs.existsSync(hlsOutput) && fs.statSync(hlsOutput).size > 0) notifyReady() } catch {}
        }, 500)

        safeTimer = setTimeout(() => {
          if (!ready) socket.emit('stream:error', `Timed out. FFmpeg: ${ffmpegLog.slice(-200) || 'no output'}`)
        }, 30_000)

        console.log(`[Socket] FFmpeg started for ${streamId}`)
      } catch (err) {
        console.error('[socketStream] start error:', err)
        socket.emit('stream:error', err.message)
      }
    })

    // ── Chunks → FFmpeg ─────────────────────────────────────────
    const chunkCount = new Map()
    socket.on('stream:chunk', chunk => {
      const entry = activeStreams.get(socket.streamId)
      if (!entry?.ffmpeg || entry.ffmpeg.stdin.destroyed) return
      try {
        let buf
        if (Buffer.isBuffer(chunk))            buf = chunk
        else if (chunk instanceof Uint8Array)  buf = Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength)
        else                                   buf = Buffer.from(chunk)

        const n = (chunkCount.get(socket.streamId) || 0) + 1
        chunkCount.set(socket.streamId, n)
        if (n <= 5) console.log(`[chunk] #${n} ${buf.length}B → FFmpeg`)
        entry.ffmpeg.stdin.write(buf)
      } catch (err) { console.error('[chunk]', err.message) }
    })

    // ── End stream ───────────────────────────────────────────────
    socket.on('stream:end', () => endStream(socket.streamId))

    // ── VIEWER: join room ────────────────────────────────────────
    socket.on('stream:join', async ({ streamId }) => {
      socket.join(`stream:${streamId}`)
      socket.streamId = streamId
      // roomViewers works for both OBS and webcam streams
      if (!roomViewers.has(streamId)) roomViewers.set(streamId, new Set())
      roomViewers.get(streamId).add(socket.id)
      // keep activeStreams in sync for webcam streams
      const entry = activeStreams.get(streamId)
      if (entry) entry.viewers.add(socket.id)
      const count = roomViewers.get(streamId).size
      await LiveStream.findByIdAndUpdate(streamId, {
        currentViewers: count,
        $max: { peakViewers: count },
        $inc: { totalViews: 1 },
      }).catch(() => {})
      io.to(`stream:${streamId}`).emit('stream:viewers', { count })
    })

    // ── CHAT — save to DB and broadcast ─────────────────────────
    socket.on('chat:message', async ({ streamId, message, username, avatar, userId }) => {
      if (!streamId || !message?.trim()) return
      const now = Date.now()
      const msg = {
        id:       `${socket.id}-${now}`,
        username: (username || 'Anonymous').slice(0, 100),
        avatar:   avatar || null,
        message:  message.trim().slice(0, 300),
        ts:       now,
      }
      // Broadcast immediately for real-time feel
      io.to(`stream:${streamId}`).emit('chat:message', msg)
      // Calculate stream offset for VOD replay (ms since stream started)
      let streamOffsetMs = 0
      try {
        const stream = await LiveStream.findById(streamId).select('startedAt').lean()
        if (stream?.startedAt) streamOffsetMs = now - new Date(stream.startedAt).getTime()
      } catch {}
      // Persist to DB asynchronously
      ChatMessage.create({
        streamId, userId: userId || null,
        username: msg.username, avatar: msg.avatar || '',
        message:  msg.message,
        isHost:   socket.isHost || false,
        streamOffsetMs,
      }).catch(err => console.error('[chat] save error:', err.message))
    })

    // ── Disconnect ───────────────────────────────────────────────
    socket.on('disconnect', async () => {
      if (socket.streamId && !socket.isHost) {
        // Update roomViewers
        const viewers = roomViewers.get(socket.streamId)
        if (viewers) {
          viewers.delete(socket.id)
          const count = viewers.size
          if (viewers.size === 0) roomViewers.delete(socket.streamId)
          await LiveStream.findByIdAndUpdate(socket.streamId, { currentViewers: count }).catch(() => {})
          io.to(`stream:${socket.streamId}`).emit('stream:viewers', { count })
        }
        // Keep activeStreams in sync too
        const entry = activeStreams.get(socket.streamId)
        if (entry) entry.viewers.delete(socket.id)
      }
      if (socket.isHost && socket.streamId) await endStream(socket.streamId)
    })

    async function endStream(streamId) {
      if (!streamId) return
      const entry = activeStreams.get(streamId)

      // Get the stream key so we can write EXT-X-ENDLIST
      let streamKey = entry?.streamKey
      if (!streamKey) {
        try {
          const s = await LiveStream.findById(streamId).select('streamKey').lean()
          streamKey = s?.streamKey
        } catch {}
      }

      if (entry?.ffmpeg) {
        // End FFmpeg stdin — it will flush remaining frames and close
        try { entry.ffmpeg.stdin.end() } catch {}
        // Wait a moment for FFmpeg to write last segment
        await new Promise(r => setTimeout(r, 2000))
      }
      activeStreams.delete(streamId)
      roomViewers.delete(streamId)

      // Write #EXT-X-ENDLIST so the m3u8 is treated as a complete VOD
      if (streamKey) {
        const path = require('path')
        const fs   = require('fs')
        const HLS_ROOT = process.env.HLS_OUTPUT_PATH || './tmp/hls'
        const m3u8Path = path.join(HLS_ROOT, 'live', streamKey, 'index.m3u8')
        try {
          if (fs.existsSync(m3u8Path)) {
            let m3u8 = fs.readFileSync(m3u8Path, 'utf8')
            if (!m3u8.includes('#EXT-X-ENDLIST')) {
              m3u8 = m3u8.trimEnd() + '\n#EXT-X-ENDLIST\n'
              fs.writeFileSync(m3u8Path, m3u8, 'utf8')
              console.log(`[Socket] ✓ EXT-X-ENDLIST written for ${streamKey}`)
            }
          }
        } catch (e) { console.error('[Socket] EXT-X-ENDLIST write error:', e.message) }
      }

      // Calculate duration
      const stream = await LiveStream.findById(streamId).select('startedAt').lean().catch(() => null)
      const durationSec = stream?.startedAt
        ? Math.round((Date.now() - new Date(stream.startedAt).getTime()) / 1000)
        : 0

      await LiveStream.findByIdAndUpdate(streamId, {
        status: 'ended', endedAt: new Date(), currentViewers: 0, duration: durationSec,
      }).catch(() => {})
      io.to(`stream:${streamId}`).emit('stream:ended')
      console.log(`[Socket] ⏹ Stream ended: ${streamId} (${durationSec}s)`)
    }
  })
}