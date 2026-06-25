// FILE: client/src/pages/LikedVideos/LikedVideos.jsx
import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { formatViews, timeAgo, formatDuration } from '../../utils/formatUtils.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useFocus } from '../../context/FocusContext.jsx'
import { triggerDeleteParticles } from '../../utils/particleUtils.js'
import api from '../../services/api.js'
import './LikedVideos.css'

// ── ICONS ──
const HeartIcon    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
const PlayIcon     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
const SearchIcon   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
const CloseIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const GridIcon     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
const ListIcon     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
const ShuffleIcon  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>
const VerifiedIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const SortIcon     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="9" y1="18" x2="15" y2="18"/></svg>

const normalizeVideo = (v) => ({
  _id:        v._id,
  title:      v.title,
  thumbnail:  v.thumbnailUrl || '',
  duration:   v.duration     || 0,
  views:      v.viewCount    || 0,
  uploadedAt: v.createdAt,
  isShort:    v.isShort      || false,
  channel: {
    _id:      v.uploader?._id,
    name:     v.uploader?.displayName || v.uploader?.username || 'Unknown',
    avatar:   v.uploader?.avatar      || '',
    verified: v.uploader?.isChannelVerified || false,
  },
})

function LikedGridCard({ video, onUnlike, canvasRef }) {
  const dest   = video.isShort ? `/shorts?id=${video._id}` : `/watch/${video._id}`
  const btnRef = useRef(null)

  const handleUnlike = () => {
    if (btnRef.current && canvasRef?.current) {
      const rect = btnRef.current.getBoundingClientRect()
      triggerDeleteParticles(rect, true, canvasRef.current)
    }
    onUnlike(video._id)
  }

  return (
    <motion.div className="lv-grid-card" layout exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }} whileHover={{ y: -4 }}>
      <Link to={dest} className={`lv-grid-thumb-wrap ${video.isShort ? 'lv-grid-thumb-short' : ''}`}>
        <img src={video.thumbnail} alt={video.title} className="lv-grid-thumb" loading="lazy" />
        {!video.isShort && <span className="lv-grid-duration">{formatDuration(video.duration)}</span>}
        {video.isShort  && <span className="lv-grid-short-badge">Short</span>}
        <div className="lv-grid-play-overlay"><PlayIcon /></div>
      </Link>
      <div className="lv-grid-info">
        <Link to={dest} className="lv-grid-title">{video.title}</Link>
        <Link to={`/channel/${video.channel?._id}`} className="lv-grid-channel">
          {video.channel?.avatar && <img src={video.channel.avatar} alt={video.channel.name} className="lv-grid-channel-avatar" />}
          {video.channel?.name}
          {video.channel?.verified && <VerifiedIcon />}
        </Link>
        <span className="lv-grid-meta">{formatViews(video.views)} views · {timeAgo(video.uploadedAt)}</span>
      </div>
      <button ref={btnRef} className="lv-grid-unlike" onClick={handleUnlike} title="Unlike"><HeartIcon /></button>
    </motion.div>
  )
}

function LikedListRow({ video, index, onUnlike, canvasRef }) {
  const dest   = video.isShort ? `/shorts?id=${video._id}` : `/watch/${video._id}`
  const btnRef = useRef(null)

  const handleUnlike = () => {
    if (btnRef.current && canvasRef?.current) {
      const rect = btnRef.current.getBoundingClientRect()
      triggerDeleteParticles(rect, true, canvasRef.current)
    }
    onUnlike(video._id)
  }

  return (
    <motion.div className="lv-list-row" layout exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}>
      <span className="lv-list-index">{index + 1}</span>
      <Link to={dest} className={`lv-list-thumb-wrap ${video.isShort ? 'lv-list-thumb-short' : ''}`}>
        <img src={video.thumbnail} alt={video.title} className="lv-list-thumb" loading="lazy" />
        {!video.isShort && <span className="lv-list-duration">{formatDuration(video.duration)}</span>}
        {video.isShort  && <span className="lv-grid-short-badge">Short</span>}
        <div className="lv-list-play-overlay"><PlayIcon /></div>
      </Link>
      <div className="lv-list-info">
        <Link to={dest} className="lv-list-title">{video.title}</Link>
        <Link to={`/channel/${video.channel?._id}`} className="lv-list-channel">
          {video.channel?.avatar && <img src={video.channel.avatar} alt={video.channel.name} className="lv-list-channel-avatar" />}
          {video.channel?.name}
          {video.channel?.verified && <VerifiedIcon />}
        </Link>
        <span className="lv-list-meta">{formatViews(video.views)} views · {timeAgo(video.uploadedAt)}</span>
      </div>
      <button ref={btnRef} className="lv-list-unlike" onClick={handleUnlike} title="Unlike"><HeartIcon /></button>
    </motion.div>
  )
}

function GridSkeleton() {
  return (
    <div className="lv-grid-card lv-skeleton">
      <div className="lv-grid-thumb-wrap sk-block" />
      <div className="lv-grid-info">
        <div className="sk-block" style={{ height: 14, width: '80%', marginBottom: 8 }} />
        <div className="sk-block" style={{ height: 12, width: '50%', marginBottom: 6 }} />
        <div className="sk-block" style={{ height: 11, width: '35%' }} />
      </div>
    </div>
  )
}

export default function LikedVideos() {
  const { user } = useAuth()
  const { active: focusActive, blockedCategories } = useFocus()
  const [videos,   setVideos]   = useState([])
  const canvasRef = useRef(null)
  const [loading,    setLoading]   = useState(true)
  const [error,      setError]     = useState(null)
  const [search,     setSearch]    = useState('')
  const [sort,       setSort]      = useState('recent')
  const [viewMode,   setViewMode]  = useState('grid')
  const [typeFilter, setTypeFilter]= useState('all')

  const fetchLiked = useCallback(async () => {
    if (!user) { setLoading(false); return }
    try {
      setLoading(true)
      setError(null)
      const res = await api.get('/interactions/liked')
      setVideos((res.data.videos || []).map(normalizeVideo))
    } catch {
      setError('Failed to load liked videos')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchLiked() }, [fetchLiked])

  const unlike = async (id) => {
    setVideos(prev => prev.filter(v => v._id !== id))
    try {
      await api.post(`/interactions/${id}/like`) // toggles off
    } catch {
      fetchLiked()
    }
  }

  const shuffle = () => setVideos(prev => [...prev].sort(() => Math.random() - 0.5))

  const filtered = useMemo(() => {
    let list = videos.filter(v =>
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      v.channel?.name?.toLowerCase().includes(search.toLowerCase())
    )
    if (typeFilter === 'videos') list = list.filter(v => !v.isShort)
    if (typeFilter === 'shorts') list = list.filter(v =>  v.isShort)
    if (sort === 'oldest') list = [...list].reverse()
    if (sort === 'views')  list = [...list].sort((a, b) => (b.views||0) - (a.views||0))
    if (sort === 'az')     list = [...list].sort((a, b) => a.title.localeCompare(b.title))
    // Focus mode: hide shorts and blocked categories
    if (focusActive) {
      list = list.filter(v => !v.isShort)
      if (blockedCategories.length > 0)
        list = list.filter(v => !blockedCategories.includes(v.category))
    }
    return list
  }, [videos, search, sort, typeFilter, focusActive, blockedCategories])

  if (!user) return (
    <div className="lv-page">
      <div className="lv-empty" style={{ marginTop: 80 }}>
        <div className="lv-empty-icon">🔒</div>
        <p className="lv-empty-title">Sign in to see Liked Videos</p>
        <p className="lv-empty-sub">Videos you like will appear here</p>
        <Link to="/auth" className="lv-hero-play-btn" style={{ display:'inline-flex', marginTop:16 }}>Sign in</Link>
      </div>
    </div>
  )

  return (
    <motion.div className="lv-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
      <canvas ref={canvasRef} style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:9999, width:'100vw', height:'100vh' }} />
      <div className="lv-hero">
        <div className="lv-hero-bg">
          {videos.slice(0, 4).map((v, i) => (
            <img key={v._id} src={v.thumbnail} alt="" className={`lv-hero-bg-img lv-hero-bg-img-${i}`} />
          ))}
          <div className="lv-hero-bg-overlay" />
        </div>
        <div className="lv-hero-content">
          <div className="lv-hero-icon"><HeartIcon /></div>
          <div className="lv-hero-text">
            <h1 className="lv-hero-title">Liked Videos</h1>
            <p className="lv-hero-sub">{videos.length} video{videos.length !== 1 ? 's' : ''} you've liked</p>
          </div>
          <div className="lv-hero-actions">
            <Link to={videos[0] ? `/watch/${videos[0]._id}` : '#'} className="lv-hero-play-btn"><PlayIcon /> Play all</Link>
            <motion.button className="lv-hero-shuffle-btn" onClick={shuffle} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} title="Shuffle"><ShuffleIcon /></motion.button>
          </div>
        </div>
      </div>

      <div className="lv-controls">
        <div className="lv-search-wrap">
          <SearchIcon />
          <input className="lv-search" placeholder="Search liked videos..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="lv-search-clear" onClick={() => setSearch('')}><CloseIcon /></button>}
        </div>
        <div className="lv-controls-right">
          <div className="lv-sort-wrap">
            <SortIcon />
            <select className="lv-sort-select" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="recent">Most recent</option>
              <option value="oldest">Oldest first</option>
              <option value="views">Most viewed</option>
              <option value="az">A → Z</option>
            </select>
          </div>
          {/* Hide grid/list toggle when showing shorts — always grid for shorts */}
          {typeFilter !== 'shorts' && (
            <div className="lv-view-toggle">
              <button className={`lv-view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')} title="Grid view"><GridIcon /></button>
              <button className={`lv-view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')} title="List view"><ListIcon /></button>
            </div>
          )}
        </div>
      </div>

      {/* All / Videos / Shorts filter tabs */}
      <div className="lv-type-tabs">
        {['all','videos','shorts'].map(t => (
          <button key={t} className={`lv-type-tab ${typeFilter === t ? 'active' : ''}`}
            onClick={() => setTypeFilter(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {error && (
        <div className="lv-empty">
          <div className="lv-empty-icon">⚠️</div>
          <p className="lv-empty-title">{error}</p>
          <button className="lv-hero-play-btn" onClick={fetchLiked} style={{ marginTop: 12 }}>Try again</button>
        </div>
      )}

      {search && !loading && (
        <p className="lv-result-count">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''} for <strong>"{search}"</strong>
        </p>
      )}

      {!error && loading ? (
        <div className="lv-grid">
          {[...Array(8)].map((_, i) => <GridSkeleton key={i} />)}
        </div>
      ) : !error && videos.length === 0 ? (
        <div className="lv-empty">
          <div className="lv-empty-icon">🤍</div>
          <p className="lv-empty-title">No liked videos yet</p>
          <p className="lv-empty-sub">Videos you like will appear here</p>
        </div>
      ) : !error && filtered.length === 0 ? (
        <div className="lv-empty">
          <div className="lv-empty-icon">🔍</div>
          <p className="lv-empty-title">No results for "{search}"</p>
          <p className="lv-empty-sub">Try a different search term</p>
        </div>
      ) : !error && (
        typeFilter === 'shorts' ? (
          /* Shorts filter — vertical grid like YouTube Shorts tab */
          <motion.div className="lv-shorts-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} layout>
            <AnimatePresence>
              {filtered.map(video => (
                <motion.div key={video._id} className="lv-short-grid-card"
                  layout exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }} whileHover={{ y: -4 }}>
                  <Link to={`/shorts?id=${video._id}`} className="lv-short-grid-thumb">
                    <img src={video.thumbnail} alt={video.title} className="lv-short-grid-img" loading="lazy" />
                    <div className="lv-short-grid-play"><PlayIcon /></div>
                  </Link>
                  <div className="lv-short-grid-info">
                    <Link to={`/shorts?id=${video._id}`} className="lv-short-grid-title">{video.title}</Link>
                    <span className="lv-short-grid-channel">{video.channel?.name}</span>
                    <span className="lv-short-grid-views">{formatViews(video.views)} views</span>
                  </div>
                  <button className="lv-short-grid-unlike" onClick={() => unlike(video._id)} title="Unlike">
                    <HeartIcon />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            {viewMode === 'grid' ? (
              <motion.div key="grid" className="lv-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} layout>
                <AnimatePresence>
                  {filtered.map(video => <LikedGridCard key={video._id} video={video} onUnlike={unlike} canvasRef={canvasRef} />)}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div key="list" className="lv-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <AnimatePresence>
                  {filtered.map((video, i) => <LikedListRow key={video._id} video={video} index={i} onUnlike={unlike} canvasRef={canvasRef} />)}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        )
      )}
    </motion.div>
  )
}