// FILE: client/src/pages/YourVideos/YourVideos.jsx
import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../services/api'
import { formatViews, timeAgo, formatDuration } from '../../utils/formatUtils.js'
import './YourVideos.css'

// ── ICONS ──
const UploadIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
const EditIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const TrashIcon   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
const EyeIcon     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
const ThumbUpIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/><path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>
const CommentIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
const SearchIcon  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
const CloseIcon   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const DotsIcon    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
const VideoIcon   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
const GlobeIcon   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
const LockIcon    = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
const SortIcon    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="9" y1="18" x2="15" y2="18"/></svg>

// ── STAT CARD ──
function StatCard({ icon, label, value, color }) {
  return (
    <motion.div className="yv-stat-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div className="yv-stat-icon" style={{ color, background: `${color}18`, border: `1px solid ${color}30` }}>{icon}</div>
      <div className="yv-stat-info">
        <span className="yv-stat-value">{value}</span>
        <span className="yv-stat-label">{label}</span>
      </div>
    </motion.div>
  )
}

// ── STATUS BADGE ──
function StatusBadge({ visibility, status }) {
  const isPrivate  = visibility === 'private'
  const isUnlisted = visibility === 'unlisted'
  const isProc     = status === 'processing'
  const color = isProc ? '#fbbf24' : isPrivate ? 'var(--a, #dc267f)' : isUnlisted ? '#a78bfa' : '#4ade80'
  const label = isProc ? 'Processing' : isPrivate ? 'Private' : isUnlisted ? 'Unlisted' : 'Public'
  const icon  = isPrivate ? <LockIcon /> : <GlobeIcon />
  return (
    <span className="yv-status-badge" style={{ color, background: `${color}15`, border: `1px solid ${color}30` }}>
      {icon} {label}
    </span>
  )
}

// ── VIDEO ROW ──
function VideoRow({ video, onDelete, selected, onSelect }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const thumb = video.thumbnailUrl || video.thumbnail || 'https://via.placeholder.com/320x180/0e0e20/fff?text=No+Thumbnail'

  return (
    <motion.tr className="yv-table-row" layout exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
      <td className="yv-td yv-td-check">
        <input type="checkbox" className="yv-checkbox" checked={!!selected} onChange={onSelect} />
      </td>
      <td className="yv-td yv-td-video">
        <div className="yv-row-video">
          <Link to={`/watch/${video._id}`} className="yv-row-thumb-wrap">
            <img src={thumb} alt={video.title} className="yv-row-thumb" loading="lazy" />
            <span className="yv-row-duration">{formatDuration(video.duration || 0)}</span>
          </Link>
          <div className="yv-row-info">
            <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
              <Link to={`/watch/${video._id}`} className="yv-row-title">{video.title}</Link>
              {video.isLiveVOD && (
                <span style={{ display:'inline-flex', alignItems:'center', gap:3, padding:'1px 7px', borderRadius:4, background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.3)', fontSize:'0.65rem', fontWeight:700, color:'#ef4444', letterSpacing:'0.4px', flexShrink:0 }}>
                  📡 LIVE REC
                </span>
              )}
            </div>
            <p className="yv-row-desc">{video.description?.slice(0, 70)}{video.description?.length > 70 ? '...' : ''}</p>
            <div className="yv-row-tags">
              {video.tags?.slice(0, 3).map(t => <span key={t} className="yv-row-tag">#{t}</span>)}
            </div>
          </div>
        </div>
      </td>
      <td className="yv-td yv-td-status">
        <StatusBadge visibility={video.visibility} status={video.status} />
        <span className="yv-row-date">{timeAgo(video.createdAt)}</span>
      </td>
      <td className="yv-td yv-td-stat">
        <div className="yv-td-stat-inner"><EyeIcon /><span>{formatViews(video.viewCount || 0)}</span></div>
      </td>
      <td className="yv-td yv-td-stat">
        <div className="yv-td-stat-inner"><ThumbUpIcon /><span>{formatViews(video.likeCount || 0)}</span></div>
      </td>
      <td className="yv-td yv-td-stat">
        <div className="yv-td-stat-inner"><CommentIcon /><span>{video.commentCount || 0}</span></div>
      </td>
      <td className="yv-td yv-td-actions">
        <div className="yv-row-actions">
          <div className="yv-row-menu-wrap">
            <motion.button className="yv-row-action-btn" onClick={() => setMenuOpen(v => !v)}
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}><DotsIcon /></motion.button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div className="yv-row-menu"
                  initial={{ opacity: 0, scale: 0.9, y: -6 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -6 }} transition={{ duration: 0.14 }}>
                  <Link to={`/watch/${video._id}`} className="yv-menu-item"><EyeIcon /> View</Link>
                  <div className="yv-menu-divider" />
                  <button className="yv-menu-item danger" onClick={() => { onDelete(video._id); setMenuOpen(false) }}>
                    <TrashIcon /> Delete
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </td>
    </motion.tr>
  )
}

// ── MAIN PAGE ──
export default function YourVideos() {
  const [videos,   setVideos]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState('all')
  const [sort,     setSort]     = useState('recent')
  const [selected, setSelected] = useState([])

  // Fetch user's own videos
  useEffect(() => {
    api.get('/videos/user/me')
      .then(res => {
        setVideos(res.data.videos || [])
        setLoading(false)
      })
      .catch(() => {
        setVideos([])
        setLoading(false)
      })
  }, [])

  const deleteVideo = async (id) => {
    try { await api.delete(`/videos/${id}`) } catch {}
    setVideos(prev => prev.filter(v => v._id !== id))
  }

  const deleteSelected = async () => {
    for (const id of selected) {
      try { await api.delete(`/videos/${id}`) } catch {}
    }
    setVideos(prev => prev.filter(v => !selected.includes(v._id)))
    setSelected([])
  }

  const toggleSelect = (id) => setSelected(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  )

  const filtered = useMemo(() => {
    let list = videos.filter(v =>
      v.title?.toLowerCase().includes(search.toLowerCase()) ||
      v.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
    )
    if (filter === 'public')   list = list.filter(v => v.visibility === 'public')
    if (filter === 'private')  list = list.filter(v => v.visibility === 'private')
    if (filter === 'unlisted') list = list.filter(v => v.visibility === 'unlisted')
    if (sort === 'views')  list = [...list].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    if (sort === 'likes')  list = [...list].sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
    if (sort === 'oldest') list = [...list].reverse()
    return list
  }, [videos, search, filter, sort])

  const totalViews    = videos.reduce((a, v) => a + (v.viewCount    || 0), 0)
  const totalLikes    = videos.reduce((a, v) => a + (v.likeCount    || 0), 0)
  const totalComments = videos.reduce((a, v) => a + (v.commentCount || 0), 0)

  return (
    <motion.div className="yv-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
      <div className="yv-header">
        <div className="yv-header-left">
          <div className="yv-header-icon"><VideoIcon /></div>
          <div>
            <h1 className="yv-title">Your Videos</h1>
            <p className="yv-subtitle">Manage and track your uploaded content</p>
          </div>
        </div>
      </div>

      <div className="yv-stats-grid">
        <StatCard icon={<VideoIcon />}   label="Total Videos"   value={videos.length}           color="var(--a, #dc267f)" />
        <StatCard icon={<EyeIcon />}     label="Total Views"    value={formatViews(totalViews)} color="#60a5fa" />
        <StatCard icon={<ThumbUpIcon />} label="Total Likes"    value={formatViews(totalLikes)} color="#4ade80" />
        <StatCard icon={<CommentIcon />} label="Total Comments" value={totalComments}           color="#f472b6" />
      </div>

      <div className="yv-controls">
        <div className="yv-search-wrap">
          <SearchIcon />
          <input className="yv-search" placeholder="Search your videos..."
            value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="yv-search-clear" onClick={() => setSearch('')}><CloseIcon /></button>}
        </div>
        <div className="yv-controls-right">
          <div className="yv-filter-tabs">
            {[
              { id:'all',      label:`All (${videos.length})` },
              { id:'public',   label:'Public'   },
              { id:'private',  label:'Private'  },
              { id:'unlisted', label:'Unlisted' },
            ].map(f => (
              <button key={f.id} className={`yv-filter-tab ${filter === f.id ? 'active' : ''}`}
                onClick={() => setFilter(f.id)}>{f.label}</button>
            ))}
          </div>
          <div className="yv-sort-wrap">
            <SortIcon />
            <select className="yv-sort-select" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="recent">Most recent</option>
              <option value="oldest">Oldest first</option>
              <option value="views">Most views</option>
              <option value="likes">Most likes</option>
            </select>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div className="yv-bulk-bar" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <span className="yv-bulk-count">{selected.length} selected</span>
            <motion.button className="yv-bulk-delete" onClick={deleteSelected}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <TrashIcon /> Delete selected
            </motion.button>
            <button className="yv-bulk-clear" onClick={() => setSelected([])}><CloseIcon /> Clear</button>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="yv-empty">
          <div className="yv-empty-icon"><VideoIcon /></div>
          <p className="yv-empty-title">Loading your videos...</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="yv-empty">
          <div className="yv-empty-icon"><VideoIcon /></div>
          <p className="yv-empty-title">No videos uploaded yet</p>
          <p className="yv-empty-sub">Upload your first video to start building your channel</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="yv-empty">
          <p className="yv-empty-title">No videos match your search</p>
          <p className="yv-empty-sub">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="yv-table-wrap">
          <table className="yv-table">
            <thead>
              <tr className="yv-thead-row">
                <th className="yv-th yv-th-check">
                  <input type="checkbox" className="yv-checkbox"
                    checked={selected.length === filtered.length && filtered.length > 0}
                    onChange={() => setSelected(
                      selected.length === filtered.length ? [] : filtered.map(v => v._id)
                    )} />
                </th>
                <th className="yv-th yv-th-video">Video</th>
                <th className="yv-th">Status</th>
                <th className="yv-th">Views</th>
                <th className="yv-th">Likes</th>
                <th className="yv-th">Comments</th>
                <th className="yv-th yv-th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map(video => (
                  <VideoRow key={video._id} video={video} onDelete={deleteVideo}
                    selected={selected.includes(video._id)} onSelect={() => toggleSelect(video._id)} />
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  )
}