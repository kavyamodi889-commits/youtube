// FILE: client/src/pages/History/History.jsx
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { formatViews, timeAgo, formatDuration } from '../../utils/formatUtils.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useFocus } from '../../context/FocusContext.jsx'
import { triggerDeleteParticles } from '../../utils/particleUtils.js'
import api from '../../services/api.js'
import './History.css'

// ── ICONS ──
const TrashIcon    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
const SearchIcon   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
const PlayIcon     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
const PauseIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
const VerifiedIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const CloseIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>

const normalizeVideo = (v) => ({
  _id:        v._id,
  title:      v.title,
  thumbnail:  v.thumbnailUrl || '',
  duration:   v.duration     || 0,
  views:      v.viewCount    || 0,
  uploadedAt: v.createdAt,
  description:v.description  || '',
  watchedAt:  v.lastWatchedAt || v.createdAt,
  isShort:    v.isShort       || false,
  channel: {
    _id:      v.uploader?._id,
    name:     v.uploader?.displayName || v.uploader?.username || 'Unknown',
    avatar:   v.uploader?.avatar      || '',
    verified: v.uploader?.isChannelVerified || false,
  },
})

// Group videos by relative date
function groupByDate(videos) {
  const today     = new Date(); today.setHours(0,0,0,0)
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate()-1)
  const thisWeek  = new Date(today); thisWeek.setDate(thisWeek.getDate()-7)
  const thisMonth = new Date(today); thisMonth.setDate(1)

  const groups = {}
  for (const v of videos) {
    const d = new Date(v.watchedAt || v.uploadedAt)
    d.setHours(0,0,0,0)
    let label
    if (d >= today)     label = 'Today'
    else if (d >= yesterday) label = 'Yesterday'
    else if (d >= thisWeek)  label = 'This week'
    else if (d >= thisMonth) label = 'This month'
    else {
      label = d.toLocaleString('default', { month: 'long', year: 'numeric' })
    }
    if (!groups[label]) groups[label] = []
    groups[label].push(v)
  }
  // Return in chronological order
  const order = ['Today','Yesterday','This week','This month']
  const result = []
  for (const key of order) {
    if (groups[key]) result.push({ label: key, videos: groups[key] })
  }
  // Remaining month groups
  for (const key of Object.keys(groups)) {
    if (!order.includes(key)) result.push({ label: key, videos: groups[key] })
  }
  return result
}

function HistoryRow({ video, onRemove, canvasRef }) {
  const btnRef = useRef(null)
  const dest = video.isShort ? `/shorts?id=${video._id}` : `/watch/${video._id}`

  const handleRemove = () => {
    if (btnRef.current && canvasRef?.current) {
      const rect = btnRef.current.getBoundingClientRect()
      triggerDeleteParticles(rect, false, canvasRef.current)
    }
    onRemove(video._id)
  }

  return (
    <motion.div className="history-row" layout exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}>
      <Link to={dest} className={`history-thumb-wrap${video.isShort ? ' history-thumb-wrap--short' : ''}`}>
        <img src={video.thumbnail} alt={video.title} className="history-thumb" loading="lazy" />
        {video.isShort
          ? <span className="history-short-badge">Short</span>
          : <span className="history-duration">{formatDuration(video.duration)}</span>
        }
        <div className="history-play-overlay"><PlayIcon /></div>
      </Link>
      <div className="history-info">
        <Link to={dest} className="history-title">{video.title}</Link>
        <Link to={`/channel/${video.channel?._id}`} className="history-channel">
          {video.channel?.avatar && <img src={video.channel.avatar} alt={video.channel.name} className="history-channel-avatar" />}
          {video.channel?.name}
          {video.channel?.verified && <VerifiedIcon />}
        </Link>
        <span className="history-meta">{formatViews(video.views)} views · {timeAgo(video.uploadedAt)}</span>
        {video.description && <span className="history-desc">{video.description.slice(0, 80)}{video.description.length > 80 ? '...' : ''}</span>}
      </div>
      <button ref={btnRef} className="history-remove-btn" onClick={handleRemove} title="Remove from history">
        <CloseIcon />
      </button>
    </motion.div>
  )
}

// Shorts show as a horizontal scroll row with their vertical thumbnails
function ShortsHistoryRow({ shorts, onRemove }) {
  return (
    <div className="history-shorts-section">
      <div className="history-shorts-label">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--a)" stroke="none"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
        Shorts
      </div>
      <div className="history-shorts-row">
        {shorts.map(short => (
          <div key={short._id} className="history-short-card">
            <Link to={`/shorts?id=${short._id}`} className="history-short-thumb-wrap">
              <img src={short.thumbnail} alt={short.title} className="history-short-thumb" loading="lazy" />
              <div className="history-short-play"><PlayIcon /></div>
            </Link>
            <div className="history-short-info">
              <Link to={`/shorts?id=${short._id}`} className="history-short-title">{short.title}</Link>
              <span className="history-short-views">{formatViews(short.views)} views</span>
            </div>
            <button className="history-short-remove" onClick={() => onRemove(short._id)} title="Remove">
              <CloseIcon />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className="history-row history-skeleton">
      <div className="history-thumb-wrap sk-block" />
      <div className="history-info">
        <div className="sk-block" style={{ height: 14, width: '65%', marginBottom: 8 }} />
        <div className="sk-block" style={{ height: 12, width: '35%', marginBottom: 6 }} />
        <div className="sk-block" style={{ height: 11, width: '25%' }} />
      </div>
    </div>
  )
}

export default function History() {
  const { user } = useAuth()
  const { active: focusActive, blockedCategories } = useFocus()
  const [videos,  setVideos]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [search,  setSearch]  = useState('')
  const [paused,  setPaused]  = useState(false)
  const canvasRef = useRef(null)

  // History is stored in WatchHistory collection — fetch via dedicated endpoint
  // For now we use the subscription feed endpoint as placeholder while history endpoint
  // is built; we fall back to an empty state gracefully
  const fetchHistory = useCallback(async () => {
    if (!user) { setLoading(false); return }
    try {
      setLoading(true)
      setError(null)
      const res = await api.get('/user/history')
      setVideos((res.data.history || []).map(normalizeVideo))
    } catch {
      setError('Failed to load history')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  const removeVideo = async (id) => {
    setVideos(prev => prev.filter(v => v._id !== id))
    try {
      await api.delete(`/user/history/${id}`)
    } catch {
      // non-fatal — optimistic removal stays
    }
  }

  const clearAll = async () => {
    setVideos([])
    try {
      await api.delete('/user/history')
    } catch {
      // non-fatal
    }
  }

  const filteredVideos = useMemo(() => {
    let list = videos.filter(v =>
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      v.channel?.name?.toLowerCase().includes(search.toLowerCase())
    )
    if (focusActive) {
      list = list.filter(v => !v.isShort)
      if (blockedCategories.length > 0)
        list = list.filter(v => !blockedCategories.includes(v.category))
    }
    return list
  }, [videos, search, focusActive, blockedCategories])

  const groups = useMemo(() => groupByDate(filteredVideos), [filteredVideos])
  const totalCount = videos.length

  if (!user) return (
    <motion.div className="history-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="history-empty" style={{ marginTop: 80 }}>
        <div className="history-empty-icon">🔒</div>
        <p className="history-empty-title">Sign in to see your history</p>
        <p className="history-empty-sub">Videos you watch will appear here</p>
        <Link to="/auth" style={{ marginTop: 16, display:'inline-block', padding:'10px 24px', background:'var(--a)', color:'#fff', borderRadius: 8, fontWeight: 600, textDecoration:'none' }}>Sign in</Link>
      </div>
    </motion.div>
  )

  return (
    <motion.div className="history-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
      {/* Particle canvas — fixed full-screen, pointer-events none */}
      <canvas ref={canvasRef} style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:9999, width:'100vw', height:'100vh' }} />
      <div className="history-layout">

        <div className="history-feed">
          <div className="history-feed-header">
            <h1 className="history-feed-title">Watch History</h1>
            <span className="history-feed-count">{totalCount} video{totalCount !== 1 ? 's' : ''}</span>
          </div>

          {error ? (
            <div className="history-empty">
              <div className="history-empty-icon">⚠️</div>
              <p className="history-empty-title">{error}</p>
              <button onClick={fetchHistory} style={{ marginTop:12, padding:'8px 20px', background:'var(--a)', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600 }}>Try again</button>
            </div>
          ) : loading ? (
            <div className="history-group">
              <div className="sk-block" style={{ height: 14, width: 80, marginBottom: 16 }} />
              <div className="history-group-list">
                {[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}
              </div>
            </div>
          ) : videos.length === 0 ? (
            <div className="history-empty">
              <div className="history-empty-icon">📺</div>
              <p className="history-empty-title">No watch history</p>
              <p className="history-empty-sub">Videos you watch will appear here</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="history-empty">
              <div className="history-empty-icon">🔍</div>
              <p className="history-empty-title">No results for "{search}"</p>
              <p className="history-empty-sub">Try a different search term</p>
            </div>
          ) : (
            <AnimatePresence>
              {groups.map((group, gi) => {
                const groupShorts = group.videos.filter(v => v.isShort)
                const groupVideos = group.videos.filter(v => !v.isShort)
                return (
                  <motion.div key={group.label} className="history-group"
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: gi * 0.05 }}>
                    <h3 className="history-group-label">{group.label}</h3>
                    {/* Shorts row — horizontal carousel */}
                    {groupShorts.length > 0 && (
                      <ShortsHistoryRow shorts={groupShorts} onRemove={removeVideo} />
                    )}
                    {/* Regular videos */}
                    <div className="history-group-list">
                      <AnimatePresence>
                        {groupVideos.map(video => (
                          <HistoryRow key={video._id} video={video} onRemove={removeVideo} canvasRef={canvasRef} />
                        ))}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          )}
        </div>

        <aside className="history-sidebar">
          <div className="history-search-wrap">
            <SearchIcon />
            <input className="history-search" placeholder="Search history..." value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button onClick={() => setSearch('')} className="history-search-clear"><CloseIcon /></button>}
          </div>

          <div className="history-controls">
            <motion.button className={`history-control-btn ${paused ? 'active' : ''}`}
              onClick={() => setPaused(v => !v)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              {paused ? <PlayIcon /> : <PauseIcon />}
              {paused ? 'Resume history' : 'Pause history'}
            </motion.button>
            {videos.length > 0 && (
              <motion.button className="history-control-btn danger" onClick={clearAll}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <TrashIcon /> Clear all history
              </motion.button>
            )}
          </div>

          {paused && (
            <motion.div className="history-paused-notice" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <PauseIcon /> History is paused. New videos won't be saved.
            </motion.div>
          )}
        </aside>
      </div>
    </motion.div>
  )
}