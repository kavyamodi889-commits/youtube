// FILE: server/server.js
require('dotenv').config({ override: true })

const express      = require('express')
const http         = require('http')
const cors         = require('cors')
const cookieParser = require('cookie-parser')
const helmet       = require('helmet')
const rateLimit    = require('express-rate-limit')
const { Server }   = require('socket.io')
const passport     = require('./config/passport')
const connectDB    = require('./config/db')
const errorHandler = require('./middleware/errorHandler')

// ─── Routes ───────────────────────────────────────────────────────
const authRoutes         = require('./routes/auth')
const videoRoutes        = require('./routes/video.routes')
const liveRoutes         = require('./routes/live.routes')
const interactionRoutes  = require('./routes/interaction.routes')
const userRoutes         = require('./routes/user.routes')
const playlistRoutes     = require('./routes/playlist.routes')
const focusRoutes        = require('./routes/focus.routes')
const wellnessRoutes     = require('./routes/wellness.routes')
const notificationRoutes = require('./routes/notification.routes')


const app    = express()
const server = http.createServer(app)

// ─── Socket.IO ────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: ['http://localhost:5173', 'http://localhost:5174'], credentials: true },
  maxHttpBufferSize: 5e6, // 5MB — for webcam video chunks
})
// Make io accessible in routes/controllers
app.set('io', io)
// Also store in singleton to avoid circular require issues
require('./lib/socketIO').setIO(io)

// ─── DB ───────────────────────────────────────────────────────────
connectDB().then(() => {
  require('./models/Category').seedDefaults().catch(console.error)
})

// ─── Security ─────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}))

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  process.env.CLIENT_URL,
  process.env.STUDIO_URL,
  process.env.ADMIN_URL,
].filter(Boolean)

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error('CORS blocked'))
  },
  credentials: true,
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())
app.use(passport.initialize())

// ─── Rate limiting ────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 20 : 200, // relaxed in dev
})

// ─── API Routes ───────────────────────────────────────────────────
app.use('/api/auth',         authLimiter, authRoutes)
app.use('/api/videos',       videoRoutes)
app.use('/api/live',         liveRoutes)
app.use('/api/interactions', interactionRoutes)
app.use('/api/user',         userRoutes)
app.use('/api/playlists',    playlistRoutes)
app.use('/api/focus',        focusRoutes)
app.use('/api/wellness',     wellnessRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/upload',       require('./routes/upload.js'))
app.use('/api/ai',           require('./routes/ai.routes'))
app.use('/api/payments',     require('./routes/payment.routes'))
app.use('/api/search',       require('./routes/search.routes'))
app.use('/api/admin-auth', require('./routes/adminAuth.routes'))
app.use('/api/admin',      require('./routes/admin.routes'))
app.use('/api/early-access', require('./routes/earlyAccess.routes'))
app.use('/api/categories',   require('./routes/category.routes'))



// ─── HLS static — serve webcam stream files via /hls on port 5000
const HLS_ROOT_PATH = require('path').resolve(process.env.HLS_OUTPUT_PATH || './tmp/hls')
app.use('/hls', require('express').static(HLS_ROOT_PATH, {
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Cache-Control', 'no-cache, no-store')
  },
}))

// ─── Health ───────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ success: true, message: 'AURA API running' }))

// ─── Serve built React apps in production ─────────────────────────
if (process.env.NODE_ENV === 'production') {
  const path = require('path')
  // Main client app
  const clientDist = path.resolve(__dirname, '../client/dist')
  app.use('/studio', require('express').static(path.resolve(__dirname, '../studio/dist')))
  app.use('/admin',  require('express').static(path.resolve(__dirname, '../aura-admin/dist')))
  app.use(require('express').static(clientDist))
  // SPA fallback — anything not matched above goes to client index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'))
  })
}

// ─── Error handler ────────────────────────────────────────────────
app.use(errorHandler)

// ─── Socket.IO live stream logic ──────────────────────────────────
require('./live/socketStream')(io)

// ─── HTTP server ──────────────────────────────────────────────────
const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  const env = process.env.NODE_ENV || 'development'
  console.log(`AURA server  →  http://localhost:${PORT}  [${env}]`)
})

// ─── RTMP / NMS ───────────────────────────────────────────────────
try {
  const nms = require('./live/rtmpServer')
  nms.run()
  console.log(`RTMP server  →  rtmp://localhost:${process.env.RTMP_PORT || 1935}`)
  console.log(`HLS  server  →  http://localhost:${process.env.RTMP_HTTP_PORT || 8888}`)
} catch (err) {
  console.error('[RTMP] failed to start:', err.message)
}

module.exports = { app, server, io }