// FILE: client/src/pages/WatchLater/WatchLater.jsx
import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { formatViews, timeAgo, formatDuration } from '../../utils/formatUtils.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useFocus } from '../../context/FocusContext.jsx'
import { triggerDeleteParticles } from '../../utils/particleUtils.js'
import api from '../../services/api.js'
import './WatchLater.css'

// ── ICONS ──
const PlayIcon     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
const TrashIcon    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
const SearchIcon   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
const CloseIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const ShuffleIcon  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>
const VerifiedIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const SortIcon     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="9" y1="18" x2="15" y2="18"/></svg>

// Normalize API video → component shape
const normalizeVideo = (v) => ({
  _id:        v._id,
  title:      v.title,
  thumbnail:  v.thumbnailUrl || '',
  duration:   v.duration     || 0,
  views:      v.viewCount    || 0,
  uploadedAt: v.createdAt,
  description:v.description  || '',
  isShort:    v.isShort      || false,
  channel: {
    _id:      v.uploader?._id,
    name:     v.uploader?.displayName || v.uploader?.username || 'Unknown',
    avatar:   v.uploader?.avatar      || '',
    verified: v.uploader?.isChannelVerified || false,
  },
})

function WatchLaterRow({ video, index, onRemove, canvasRef }) {
  const dest   = video.isShort ? `/shorts?id=${video._id}` : `/watch/${video._id}`
  const btnRef = useRef(null)

  const handleRemove = () => {
    if (btnRef.current && canvasRef?.current) {
      const rect = btnRef.current.getBoundingClientRect()
      triggerDeleteParticles(rect, true, canvasRef.current)
    }
    onRemove(video._id)
  }

  return (
    <motion.div className="wl-row" layout exit={{ opacity: 0, x: 32 }} transition={{ duration: 0.2 }}>
      <span className="wl-index">{index + 1}</span>
      <Link to={dest} className={`wl-thumb-wrap ${video.isShort ? 'wl-thumb-wrap-short' : ''}`}>
        <img src={video.thumbnail} alt={video.title} className="wl-thumb" loading="lazy" />
        {!video.isShort && <span className="wl-duration">{formatDuration(video.duration)}</span>}
        {video.isShort && <span className="wl-short-badge">Short</span>}
        <div className="wl-play-overlay"><PlayIcon /></div>
      </Link>
      <div className="wl-info">
        <Link to={dest} className="wl-title">{video.title}</Link>
        <Link to={`/channel/${video.channel?._id}`} className="wl-channel">
          {video.channel?.avatar && <img src={video.channel.avatar} alt={video.channel.name} className="wl-channel-avatar" />}
          {video.channel?.name}
          {video.channel?.verified && <VerifiedIcon />}
        </Link>
        <span className="wl-meta">{formatViews(video.views)} views · {timeAgo(video.uploadedAt)}</span>
      </div>
      <button ref={btnRef} className="wl-remove-btn" onClick={handleRemove} title="Remove from Watch Later">
        <CloseIcon />
      </button>
    </motion.div>
  )
}

// Skeleton loader row
function SkeletonRow() {
  return (
    <div className="wl-row wl-skeleton">
      <span className="wl-index sk-block" style={{ width: 16, height: 16 }} />
      <div className="wl-thumb-wrap sk-block" />
      <div className="wl-info">
        <div className="sk-block" style={{ height: 14, width: '70%', marginBottom: 8 }} />
        <div className="sk-block" style={{ height: 12, width: '40%', marginBottom: 6 }} />
        <div className="sk-block" style={{ height: 11, width: '30%' }} />
      </div>
    </div>
  )
}

export default function WatchLater() {
  const { user } = useAuth()
  const { active: focusActive, blockedCategories } = useFocus()
  const [videos,      setVideos]     = useState([])
  const canvasRef = useRef(null)
  const [loading,     setLoading]    = useState(true)
  const [error,       setError]      = useState(null)
  const [search,      setSearch]     = useState('')
  const [sort,        setSort]       = useState('added')
  const [typeFilter,  setTypeFilter] = useState('all') // 'all' | 'videos' | 'shorts'

  const fetchWatchLater = useCallback(async () => {
    if (!user) { setLoading(false); return }
    try {
      setLoading(true)
      setError(null)
      const res = await api.get('/interactions/watch-later')
      setVideos((res.data.videos || []).map(normalizeVideo))
    } catch (err) {
      setError('Failed to load Watch Later')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchWatchLater() }, [fetchWatchLater])

  const removeVideo = async (id) => {
    // Optimistic remove
    setVideos(prev => prev.filter(v => v._id !== id))
    try {
      await api.post(`/interactions/${id}/watch-later`) // toggles off
    } catch {
      fetchWatchLater() // revert on error
    }
  }

  const clearAll = async () => {
    const prev = videos
    setVideos([])
    // Remove each one — since they're all currently in watch-later, toggling removes them
    try {
      await Promise.allSettled(prev.map(v => api.post(`/interactions/${v._id}/watch-later`)))
    } catch {
      fetchWatchLater()
    }
  }

  const shuffle = () => setVideos(prev => [...prev].sort(() => Math.random() - 0.5))

  const totalDuration = useMemo(() => {
    const totalSecs = videos.reduce((acc, v) => acc + (Number(v.duration) || 0), 0)
    const h = Math.floor(totalSecs / 3600)
    const m = Math.floor((totalSecs % 3600) / 60)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }, [videos])

  const sorted = useMemo(() => {
    let list = videos.filter(v =>
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      v.channel?.name?.toLowerCase().includes(search.toLowerCase())
    )
    if (typeFilter === 'videos') list = list.filter(v => !v.isShort)
    if (typeFilter === 'shorts') list = list.filter(v =>  v.isShort)
    if (sort === 'oldest')   list = [...list].reverse()
    if (sort === 'views')    list = [...list].sort((a, b) => (b.views||0) - (a.views||0))
    if (sort === 'duration') list = [...list].sort((a, b) => (b.duration||0) - (a.duration||0))
    // Focus mode: hide shorts and blocked categories
    if (focusActive) {
      list = list.filter(v => !v.isShort)
      if (blockedCategories.length > 0)
        list = list.filter(v => !blockedCategories.includes(v.category))
    }
    return list
  }, [videos, search, sort, typeFilter, focusActive, blockedCategories])

  if (!user) return (
    <div className="wl-page">
      <div className="wl-empty" style={{ marginTop: 80 }}>
        <div className="wl-empty-icon">🔒</div>
        <p className="wl-empty-title">Sign in to see Watch Later</p>
        <p className="wl-empty-sub">Save videos to watch them when you have time</p>
        <Link to="/auth" className="wl-play-all-btn" style={{ display:'inline-flex', marginTop:16 }}>Sign in</Link>
      </div>
    </div>
  )

  return (
    <motion.div className="wl-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
      <canvas ref={canvasRef} style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:9999, width:'100vw', height:'100vh' }} />
      <div className="wl-layout">

        <aside className="wl-panel">
          <div className="wl-panel-thumb-wrap">
            {videos[0]
              ? <img src={videos[0].thumbnail} alt="cover" className="wl-panel-thumb" />
              : <div style={{ width:'100%', height:'100%', background:'var(--s2)' }} />
            }
            <div className="wl-panel-thumb-overlay" />
            <div className="wl-panel-thumb-info">
              <span className="wl-panel-label">Watch Later</span>
              <span className="wl-panel-count">{videos.length} videos</span>
            </div>
          </div>
          <div className="wl-panel-stats">
            <div className="wl-panel-stat"><span className="wl-panel-stat-value">{videos.length}</span><span className="wl-panel-stat-label">Videos</span></div>
            <div className="wl-panel-stat-divider" />
            <div className="wl-panel-stat"><span className="wl-panel-stat-value">{totalDuration}</span><span className="wl-panel-stat-label">Total time</span></div>
          </div>
          <div className="wl-panel-actions">
            <Link to={videos[0] ? `/watch/${videos[0]._id}` : '#'} className="wl-play-all-btn"><PlayIcon /> Play all</Link>
            <motion.button className="wl-shuffle-btn" onClick={shuffle} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><ShuffleIcon /></motion.button>
          </div>
          {videos.length > 0 && (
            <motion.button className="wl-clear-btn" onClick={clearAll} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <TrashIcon /> Clear all
            </motion.button>
          )}
        </aside>

        <div className="wl-list-section">
          <div className="wl-list-controls">
            <div className="wl-search-wrap">
              <SearchIcon />
              <input className="wl-search" placeholder="Search watch later..." value={search} onChange={e => setSearch(e.target.value)} />
              {search && <button className="wl-search-clear" onClick={() => setSearch('')}><CloseIcon /></button>}
            </div>
            <div className="wl-sort-wrap">
              <SortIcon />
              <select className="wl-sort-select" value={sort} onChange={e => setSort(e.target.value)}>
                <option value="added">Date added</option>
                <option value="oldest">Oldest first</option>
                <option value="views">Most viewed</option>
                <option value="duration">Duration</option>
              </select>
            </div>
          </div>
          {/* Type filter tabs — All / Videos / Shorts */}
          <div className="wl-type-tabs">
            {['all','videos','shorts'].map(t => (
              <button key={t} className={`wl-type-tab ${typeFilter === t ? 'active' : ''}`}
                onClick={() => setTypeFilter(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {error && (
            <div className="wl-empty">
              <div className="wl-empty-icon">⚠️</div>
              <p className="wl-empty-title">{error}</p>
              <button className="wl-play-all-btn" onClick={fetchWatchLater} style={{ marginTop: 12 }}>Try again</button>
            </div>
          )}

          {!error && loading ? (
            <div className="wl-list">
              {[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : !error && videos.length === 0 ? (
            <div className="wl-empty">
              <div className="wl-empty-icon">⏰</div>
              <p className="wl-empty-title">Watch Later is empty</p>
              <p className="wl-empty-sub">Save videos to watch them when you have time</p>
            </div>
          ) : !error && sorted.length === 0 ? (
            <div className="wl-empty">
              <div className="wl-empty-icon">🔍</div>
              <p className="wl-empty-title">No results for "{search}"</p>
            </div>
          ) : !error && (
            typeFilter === 'shorts' ? (
              <div className="wl-shorts-grid">
                <AnimatePresence>
                  {sorted.map(video => (
                    <motion.div key={video._id} className="wl-short-grid-card"
                      layout exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }} whileHover={{ y: -4 }}>
                      <Link to={`/shorts?id=${video._id}`} className="wl-short-grid-thumb">
                        <img src={video.thumbnail} alt={video.title} className="wl-short-grid-img" loading="lazy" />
                        <div className="wl-short-grid-play"><PlayIcon /></div>
                      </Link>
                      <div className="wl-short-grid-info">
                        <Link to={`/shorts?id=${video._id}`} className="wl-short-grid-title">{video.title}</Link>
                        <span className="wl-short-grid-channel">{video.channel?.name}</span>
                        <span className="wl-short-grid-views">{formatViews(video.views)} views</span>
                      </div>
                      <button className="wl-short-grid-remove" onClick={() => removeVideo(video._id)} title="Remove">
                        <CloseIcon />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="wl-list">
                <AnimatePresence>
                  {sorted.map((video, i) => <WatchLaterRow key={video._id} video={video} index={i} onRemove={removeVideo} canvasRef={canvasRef} />)}
                </AnimatePresence>
              </div>
            )
          )}
        </div>
      </div>
    </motion.div>
  )
}