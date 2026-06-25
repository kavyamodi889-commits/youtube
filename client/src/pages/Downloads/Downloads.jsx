// FILE: client/src/pages/Downloads/Downloads.jsx
import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { timeAgo, formatDuration } from '../../utils/formatUtils.js'
import {
  getAllDownloads, removeDownload, clearAllDownloads,
  evictExpired, daysLeft, formatSize,
} from '../../utils/downloadsStore.js'
import './Downloads.css'

// ── ICONS ──
const DownloadIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
const PlayIcon      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
const TrashIcon     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
const SearchIcon    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
const CloseIcon     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const WifiOffIcon   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0119 12.55"/><path d="M5 12.55a10.94 10.94 0 015.17-2.39"/><path d="M10.71 5.05A16 16 0 0122.56 9"/><path d="M1.42 9a15.91 15.91 0 014.7-2.88"/><path d="M8.53 16.11a6 6 0 016.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
const HardDriveIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="12" x2="2" y2="12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/><line x1="6" y1="16" x2="6.01" y2="16"/><line x1="10" y1="16" x2="10.01" y2="16"/></svg>
const VerifiedIcon  = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const SortIcon      = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="9" y1="18" x2="15" y2="18"/></svg>
const InfoIcon      = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
const CheckIcon     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const AlertIcon     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>

const TOTAL_BYTES = 3 * 1024 * 1024 * 1024 // 3 GB

// ── STORAGE BAR ──
function StorageBar({ used, total }) {
  const pct   = Math.min((used / total) * 100, 100)
  const color = pct > 80 ? '#e55' : pct > 60 ? '#f90' : 'var(--a)'
  return (
    <div className="dl-storage-bar-wrap">
      <div className="dl-storage-bar-track">
        <motion.div className="dl-storage-bar-fill" style={{ background: color }}
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }} />
      </div>
    </div>
  )
}

// ── DOWNLOAD CARD ──
function DownloadCard({ video, onDelete }) {
  const [deleting, setDeleting] = useState(false)
  const days = daysLeft(video)
  const isExpiringSoon = days <= 3

  const handleDelete = async () => {
    setDeleting(true)
    try { await removeDownload(video._id) } catch {}
    setTimeout(() => onDelete(video._id), 300)
  }

  return (
    <motion.div className={`dl-card ${deleting ? 'deleting' : ''}`} layout
      exit={{ opacity: 0, scale: 0.92, y: -10 }} transition={{ duration: 0.22 }}>
      <Link to={video.isShort ? `/shorts?id=${video._id}` : `/watch/${video._id}`} className="dl-card-thumb-wrap">
        <img src={video.thumbnailUrl} alt={video.title} className="dl-card-thumb" loading="lazy" />
        {video.isShort
          ? <span className="dl-card-short-badge">Short</span>
          : <span className="dl-card-duration">{formatDuration(video.duration)}</span>
        }
        <div className="dl-card-play-overlay"><PlayIcon /></div>
        <div className="dl-card-offline-badge"><WifiOffIcon /> Offline</div>
      </Link>
      <div className="dl-card-info">
        <Link to={video.isShort ? `/shorts?id=${video._id}` : `/watch/${video._id}`} className="dl-card-title">{video.title}</Link>
        <Link to={`/channel/${video.channel?._id}`} className="dl-card-channel">
          {video.channel?.avatar && (
            <img src={video.channel.avatar} alt={video.channel.name} className="dl-card-channel-avatar" />
          )}
          {video.channel?.name}
          {video.channel?.verified && <VerifiedIcon />}
        </Link>
        <div className="dl-card-tags">
          <span className="dl-card-tag quality">{video.quality || '720p'}</span>
          <span className="dl-card-tag size">{formatSize(video.sizeBytes)}</span>
          <span className={`dl-card-tag expires ${isExpiringSoon ? 'expiring' : ''}`}>
            {isExpiringSoon && <AlertIcon />}
            {days <= 0 ? 'Expired' : `${days}d left`}
          </span>
        </div>
        <span className="dl-card-meta">Downloaded {timeAgo(video.downloadedAt)}</span>
      </div>
      <button className="dl-card-delete" onClick={handleDelete} title="Remove download"><TrashIcon /></button>
    </motion.div>
  )
}

export default function Downloads() {
  const [downloads, setDownloads] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [sort,      setSort]      = useState('recent')
  const [filter,    setFilter]    = useState('all')
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  // Track online/offline status
  useEffect(() => {
    const goOffline = () => setIsOffline(true)
    const goOnline  = () => setIsOffline(false)
    window.addEventListener('offline', goOffline)
    window.addEventListener('online',  goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online',  goOnline)
    }
  }, [])

  // Load from IndexedDB on mount + evict expired
  useEffect(() => {
    const init = async () => {
      try {
        await evictExpired()
        const all = await getAllDownloads()
        setDownloads(all)
      } catch (err) {
        console.error('Downloads load error:', err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const removeOne = (id) => setDownloads(prev => prev.filter(v => v._id !== id))

  const handleClearAll = async () => {
    try {
      await clearAllDownloads()
      setDownloads([])
    } catch {}
  }

  const totalUsedBytes = downloads.reduce((a, v) => a + (v.sizeBytes || 0), 0)

  const filtered = useMemo(() => {
    let list = downloads.filter(v =>
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      v.channel?.name?.toLowerCase().includes(search.toLowerCase())
    )
    if (filter === 'hd')       list = list.filter(v => v.quality === '1080p')
    if (filter === 'expiring') list = list.filter(v => daysLeft(v) <= 3)
    if (sort === 'oldest')  list = [...list].sort((a, b) => a.downloadedAt - b.downloadedAt)
    if (sort === 'size')    list = [...list].sort((a, b) => (b.sizeBytes||0) - (a.sizeBytes||0))
    if (sort === 'expires') list = [...list].sort((a, b) => daysLeft(a) - daysLeft(b))
    return list
  }, [downloads, search, sort, filter])

  return (
    <motion.div className="dl-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
      <div className="dl-header">
        <div className="dl-header-left">
          <div className="dl-header-icon"><DownloadIcon /></div>
          <div>
            <h1 className="dl-title">Downloads</h1>
            <p className="dl-subtitle">Watch offline — videos stored in your browser</p>
          </div>
        </div>
        <div className="dl-header-right">
          <div className="dl-storage-card">
            <div className="dl-storage-top">
              <HardDriveIcon />
              <span className="dl-storage-label">Browser Storage</span>
              <span className="dl-storage-value">{formatSize(totalUsedBytes)} / 3 GB</span>
            </div>
            <StorageBar used={totalUsedBytes} total={TOTAL_BYTES} />
            <div className="dl-storage-bottom">
              <span className="dl-storage-free">{formatSize(TOTAL_BYTES - totalUsedBytes)} free</span>
              <span className="dl-storage-count">{downloads.length} video{downloads.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="dl-info-banner">
        <InfoIcon />
        <p>
          Videos are stored <strong>in your browser</strong> (IndexedDB) and play offline without internet.
          Each download expires after <strong>30 days</strong>. Limit: <strong>3 GB</strong> total.
          Clearing browser data will remove all downloads.
        </p>
      </div>

      {isOffline && (
        <motion.div className="dl-offline-banner"
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <WifiOffIcon />
          <span>You're offline — only downloaded videos are available. Thumbnails may not load.</span>
        </motion.div>
      )}

      <div className="dl-controls">
        <div className="dl-search-wrap">
          <SearchIcon />
          <input className="dl-search" placeholder="Search downloads..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="dl-search-clear" onClick={() => setSearch('')}><CloseIcon /></button>}
        </div>
        <div className="dl-controls-right">
          <div className="dl-filter-chips">
            {[{id:'all',label:'All'},{id:'hd',label:'1080p HD'},{id:'expiring',label:'Expiring soon'}].map(f => (
              <button key={f.id} className={`dl-filter-chip ${filter === f.id ? 'active' : ''}`} onClick={() => setFilter(f.id)}>
                {filter === f.id && <CheckIcon />}
                {f.label}
              </button>
            ))}
          </div>
          <div className="dl-sort-wrap">
            <SortIcon />
            <select className="dl-sort-select" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="recent">Recently downloaded</option>
              <option value="oldest">Oldest first</option>
              <option value="size">Largest first</option>
              <option value="expires">Expiring soon</option>
            </select>
          </div>
          {downloads.length > 0 && (
            <motion.button className="dl-clear-btn" onClick={handleClearAll} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <TrashIcon /> Clear all
            </motion.button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="dl-empty">
          <div className="dl-empty-icon"><DownloadIcon /></div>
          <p className="dl-empty-title">Loading downloads…</p>
        </div>
      ) : downloads.length === 0 ? (
        <div className="dl-empty">
          <div className="dl-empty-icon"><DownloadIcon /></div>
          <p className="dl-empty-title">No downloads yet</p>
          <p className="dl-empty-sub">Hit the Download button on any video to save it for offline viewing</p>
          <Link to="/" className="dl-empty-browse">Browse videos</Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="dl-empty">
          <div className="dl-empty-icon">🔍</div>
          <p className="dl-empty-title">No results found</p>
          <p className="dl-empty-sub">Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          <p className="dl-result-count">
            {filtered.length} download{filtered.length !== 1 ? 's' : ''}
            {search && <> for <strong>"{search}"</strong></>}
          </p>
          <div className="dl-list">
            <AnimatePresence>
              {filtered.map(video => <DownloadCard key={video._id} video={video} onDelete={removeOne} />)}
            </AnimatePresence>
          </div>
        </>
      )}
    </motion.div>
  )
}