// FILE: client/src/pages/Playlists/Playlists.jsx
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { timeAgo } from '../../utils/formatUtils.js'
import { useAuth } from '../../context/AuthContext.jsx'
import api from '../../services/api.js'
import './Playlists.css'

// ── ICONS ──
const PlusIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const PlayIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
const LockIcon  = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
const GlobeIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
const DotsIcon  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
const EditIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const TrashIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
const CloseIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const CheckIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const ListIcon  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>

const PLACEHOLDER = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="480" height="270" viewBox="0 0 480 270"><rect width="480" height="270" fill="%231a1a2e"/><text x="50%25" y="50%25" font-family="sans-serif" font-size="48" fill="%23333" dominant-baseline="middle" text-anchor="middle">▶</text></svg>'

// ── CREATE / EDIT MODAL ──
function PlaylistFormModal({ initial, onClose, onSave }) {
  const [title,   setTitle]   = useState(initial?.title   || '')
  const [privacy, setPrivacy] = useState(initial?.privacy || 'private')
  const [saving,  setSaving]  = useState(false)

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    await onSave({ title: title.trim(), privacy })
    setSaving(false)
    onClose()
  }

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <motion.div className="pl-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div className="pl-modal"
        initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 20 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        onClick={e => e.stopPropagation()}>

        <div className="pl-modal-header">
          <h3 className="pl-modal-title">{initial ? 'Edit playlist' : 'New playlist'}</h3>
          <button className="pl-modal-close" onClick={onClose}><CloseIcon /></button>
        </div>

        <div className="pl-modal-body">
          {/* Title */}
          <div className="pl-modal-field">
            <label className="pl-modal-label">Name</label>
            <input className="pl-modal-input" placeholder="Give your playlist a name..."
              value={title} onChange={e => setTitle(e.target.value)}
              autoFocus maxLength={100}
              onKeyDown={e => { if (e.key === 'Enter') handleSave() }} />
            <span className="pl-modal-char">{title.length}/100</span>
          </div>

          {/* Privacy */}
          <div className="pl-modal-field">
            <label className="pl-modal-label">Visibility</label>
            <div className="pl-modal-privacy-options">
              {[
                { v: 'public',   icon: <GlobeIcon />, label: 'Public',   desc: 'Anyone can view' },
                { v: 'unlisted', icon: <ListIcon />,  label: 'Unlisted', desc: 'Only with the link' },
                { v: 'private',  icon: <LockIcon />,  label: 'Private',  desc: 'Only you' },
              ].map(({ v, icon, label, desc }) => (
                <button key={v}
                  className={`pl-modal-privacy-btn ${privacy === v ? 'active' : ''}`}
                  onClick={() => setPrivacy(v)}>
                  <div className="pl-modal-privacy-left">
                    <span className="pl-modal-privacy-icon">{icon}</span>
                    <div>
                      <span className="pl-modal-privacy-label">{label}</span>
                      <span className="pl-modal-privacy-desc">{desc}</span>
                    </div>
                  </div>
                  {privacy === v && <CheckIcon />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pl-modal-footer">
          <button className="pl-modal-cancel" onClick={onClose}>Cancel</button>
          <motion.button className="pl-modal-create" onClick={handleSave}
            disabled={!title.trim() || saving}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            {saving ? 'Saving...' : initial ? 'Save changes' : 'Create playlist'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── PLAYLIST CARD — pixel-perfect YouTube ──
function PlaylistCard({ playlist, onDelete, onEdit }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const thumb = playlist.thumbnail || PLACEHOLDER

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e) => { if (!e.target.closest('.pl-card-menu-wrap')) setMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  return (
    <motion.div className="pl-card" layout
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>

      {/* ── THUMBNAIL STACK ── */}
      <div className="pl-card-stack-container">
        {/* Layer 3 — back */}
        <div className="pl-stack-layer pl-stack-back"
          style={{ backgroundImage: `url(${thumb})` }} />
        {/* Layer 2 — mid */}
        <div className="pl-stack-layer pl-stack-mid"
          style={{ backgroundImage: `url(${thumb})` }} />
        {/* Layer 1 — front / main */}
        <Link to={`/playlists/${playlist._id}`} className="pl-stack-front-link">
          <img src={thumb} alt={playlist.title} className="pl-stack-img" loading="lazy" />

          {/* Count overlay — right side dark strip */}
          <div className="pl-card-count-strip">
            <ListIcon />
            <span>{playlist.count}</span>
            <span className="pl-card-count-word">video{playlist.count !== 1 ? 's' : ''}</span>
          </div>

          {/* Play all hover overlay */}
          <div className="pl-card-play-overlay">
            <PlayIcon />
            <span>Play all</span>
          </div>
        </Link>
      </div>

      {/* ── INFO ── */}
      <div className="pl-card-info">
        <div className="pl-card-info-top">
          <Link to={`/playlists/${playlist._id}`} className="pl-card-title">
            {playlist.title}
          </Link>
          <div className="pl-card-menu-wrap">
            <button className="pl-card-dots" onClick={e => { e.stopPropagation(); setMenuOpen(v => !v) }}>
              <DotsIcon />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div className="pl-card-menu"
                  initial={{ opacity: 0, scale: 0.92, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -6 }}
                  transition={{ duration: 0.13 }}>
                  <button className="pl-card-menu-item" onClick={() => { onEdit(playlist); setMenuOpen(false) }}>
                    <EditIcon /> Edit title and description
                  </button>
                  <button className="pl-card-menu-item danger" onClick={() => { onDelete(playlist._id); setMenuOpen(false) }}>
                    <TrashIcon /> Delete playlist
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="pl-card-meta">
          {playlist.privacy === 'private'
            ? <span className="pl-card-privacy"><LockIcon /> Private · Playlist</span>
            : playlist.privacy === 'unlisted'
            ? <span className="pl-card-privacy"><ListIcon /> Unlisted · Playlist</span>
            : <span className="pl-card-privacy"><GlobeIcon /> Public · Playlist</span>}
        </div>
        <div className="pl-card-updated">Updated {timeAgo(playlist.updatedAt)}</div>
        <Link to={`/playlists/${playlist._id}`} className="pl-card-view-link">View full playlist</Link>
      </div>
    </motion.div>
  )
}

// Skeleton card
function SkeletonCard() {
  return (
    <div className="pl-card">
      <div className="pl-skeleton-thumb sk-block" />
      <div className="pl-card-info" style={{ gap: 8 }}>
        <div className="sk-block" style={{ height: 14, width: '80%', borderRadius: 4 }} />
        <div className="sk-block" style={{ height: 11, width: '50%', borderRadius: 4 }} />
        <div className="sk-block" style={{ height: 11, width: '35%', borderRadius: 4 }} />
      </div>
    </div>
  )
}

export default function Playlists() {
  const { user } = useAuth()
  const [playlists,  setPlaylists]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [showModal,  setShowModal]  = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [search,     setSearch]     = useState('')
  const [filter,     setFilter]     = useState('all')

  const fetchPlaylists = useCallback(async () => {
    if (!user) { setLoading(false); return }
    try {
      setLoading(true); setError(null)
      const res = await api.get('/playlists')
      setPlaylists(res.data.playlists || [])
    } catch {
      setError('Failed to load playlists')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchPlaylists() }, [fetchPlaylists])

  const handleCreate = async ({ title, privacy }) => {
    try {
      const res = await api.post('/playlists', { title, privacy })
      setPlaylists(prev => [res.data.playlist, ...prev])
    } catch {}
  }

  const handleEdit = async ({ title, privacy }) => {
    if (!editTarget) return
    try {
      await api.patch(`/playlists/${editTarget._id}`, { title, privacy })
      setPlaylists(prev => prev.map(p =>
        p._id === editTarget._id ? { ...p, title, privacy } : p
      ))
    } catch {}
  }

  const handleDelete = async (id) => {
    setPlaylists(prev => prev.filter(p => p._id !== id))
    try { await api.delete(`/playlists/${id}`) }
    catch { fetchPlaylists() }
  }

  const filtered = playlists
    .filter(p => filter === 'all' || p.privacy === filter)
    .filter(p => p.title.toLowerCase().includes(search.toLowerCase()))

  if (!user) return (
    <div className="playlists-page">
      <div className="playlists-empty" style={{ marginTop: 80 }}>
        <div className="playlists-empty-icon">🔒</div>
        <p className="playlists-empty-title">Sign in to see your playlists</p>
        <Link to="/auth" style={{ marginTop:16, display:'inline-block', padding:'10px 24px', background:'var(--a)', color:'#fff', borderRadius:8, fontWeight:600, textDecoration:'none' }}>Sign in</Link>
      </div>
    </div>
  )

  return (
    <motion.div className="playlists-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
      <div className="playlists-header">
        <div className="playlists-header-left">
          <h1 className="playlists-title">Playlists</h1>
          {!loading && <span className="playlists-count">{playlists.length} playlist{playlists.length !== 1 ? 's' : ''}</span>}
        </div>
        <motion.button className="playlists-create-btn" onClick={() => setShowModal(true)}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
          <PlusIcon /> New Playlist
        </motion.button>
      </div>

      <div className="playlists-filter-bar">
        <div className="playlists-search-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input className="playlists-search" placeholder="Search playlists..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="playlists-filter-tabs">
          {[
            { key: 'all',     label: 'All' },
            { key: 'public',  label: 'Public' },
            { key: 'private', label: 'Private' },
          ].map(f => (
            <button key={f.key} className={`playlists-filter-tab ${filter === f.key ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="playlists-empty">
          <div className="playlists-empty-icon">⚠️</div>
          <p className="playlists-empty-title">{error}</p>
          <button className="playlists-empty-btn" onClick={fetchPlaylists} style={{ marginTop:12 }}>Try again</button>
        </div>
      )}

      {!error && loading ? (
        <div className="playlists-grid">
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !error && filtered.length === 0 ? (
        <div className="playlists-empty">
          <div className="playlists-empty-icon">🎵</div>
          <p className="playlists-empty-title">{playlists.length === 0 ? 'No playlists yet' : 'No results found'}</p>
          <p className="playlists-empty-sub">
            {playlists.length === 0
              ? 'Create a playlist to organise your favourite videos'
              : 'Try a different search or filter'}
          </p>
          {playlists.length === 0 && (
            <motion.button className="playlists-empty-btn" onClick={() => setShowModal(true)}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <PlusIcon /> Create Playlist
            </motion.button>
          )}
        </div>
      ) : !error && (
        <motion.div className="playlists-grid" layout>
          <AnimatePresence>
            {filtered.map(pl => (
              <PlaylistCard key={pl._id} playlist={pl}
                onDelete={handleDelete}
                onEdit={(pl) => setEditTarget(pl)} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {showModal && (
          <PlaylistFormModal
            onClose={() => setShowModal(false)}
            onSave={handleCreate}
          />
        )}
        {editTarget && (
          <PlaylistFormModal
            initial={editTarget}
            onClose={() => setEditTarget(null)}
            onSave={handleEdit}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}