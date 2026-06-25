// FILE: client/src/components/Modals/SaveToPlaylistModal.jsx
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import api from '../../services/api'
import './SaveToPlaylistModal.css'

const CloseIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const CheckIcon = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const PlusIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const LockIcon  = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
const GlobeIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
const WatchLaterIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>

export default function SaveToPlaylistModal({ videoId, initialState = {}, onClose, onStateChange }) {
  const [loading,       setLoading]     = useState(true)
  const [playlists,     setPlaylists]   = useState([])
  const [watchLater,    setWatchLater]  = useState(initialState.watchLater || false)
  const [showNew,       setShowNew]     = useState(false)
  const [newName,       setNewName]     = useState('')
  const [newPrivacy,    setNewPrivacy]  = useState('private')
  const [creating,      setCreating]    = useState(false)
  const [toast,         setToast]       = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    api.get(`/playlists/video-state/${videoId}`)
      .then(r => setPlaylists(r.data.playlists || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [videoId])

  useEffect(() => {
    if (showNew) setTimeout(() => inputRef.current?.focus(), 50)
  }, [showNew])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2000) }

  const toggleWatchLater = async () => {
    const was = watchLater
    setWatchLater(!was)
    try {
      const r = await api.post(`/interactions/${videoId}/watch-later`)
      setWatchLater(r.data.watchLater)
      onStateChange?.({ watchLater: r.data.watchLater })
      showToast(r.data.watchLater ? 'Added to Watch Later' : 'Removed from Watch Later')
    } catch { setWatchLater(was) }
  }

  const togglePlaylist = async (pl) => {
    const was = pl.hasVideo
    setPlaylists(prev => prev.map(p => p._id === pl._id ? { ...p, hasVideo: !was } : p))
    try {
      if (was) {
        await api.delete(`/playlists/${pl._id}/videos/${videoId}`)
        showToast(`Removed from "${pl.title}"`)
      } else {
        await api.post(`/playlists/${pl._id}/videos`, { videoId })
        showToast(`Saved to "${pl.title}"`)
      }
    } catch {
      setPlaylists(prev => prev.map(p => p._id === pl._id ? { ...p, hasVideo: was } : p))
    }
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const res = await api.post('/playlists', { title: newName.trim(), privacy: newPrivacy })
      const newPl = res.data.playlist
      await api.post(`/playlists/${newPl._id}/videos`, { videoId })
      setPlaylists(prev => [...prev, { ...newPl, hasVideo: true }])
      setShowNew(false); setNewName('')
      showToast(`Saved to "${newPl.title}"`)
    } catch {}
    finally { setCreating(false) }
  }

  return createPortal(
    <motion.div className="stp-backdrop"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div className="stp-shell"
        initial={{ opacity: 0, scale: 0.93, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 16 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}>

        {/* Header */}
        <div className="stp-header">
          <h2 className="stp-title">Save video to...</h2>
          <button className="stp-close-btn" onClick={onClose}><CloseIcon /></button>
        </div>

        {/* List */}
        <div className="stp-list">
          {/* Watch Later — built-in */}
          <button className={`stp-item ${watchLater ? 'checked' : ''}`} onClick={toggleWatchLater}>
            <div className="stp-checkbox">{watchLater && <CheckIcon />}</div>
            <div className="stp-item-icon stp-watch-later-icon"><WatchLaterIcon /></div>
            <div className="stp-item-info">
              <span className="stp-item-name">Watch Later</span>
            </div>
          </button>

          {/* Custom playlists */}
          {loading ? (
            <div className="stp-loading">Loading playlists…</div>
          ) : playlists.map(pl => (
            <button key={pl._id} className={`stp-item ${pl.hasVideo ? 'checked' : ''}`} onClick={() => togglePlaylist(pl)}>
              <div className="stp-checkbox">{pl.hasVideo && <CheckIcon />}</div>
              <div className="stp-item-icon stp-custom-icon">
                {pl.privacy === 'private' ? <LockIcon /> : <GlobeIcon />}
              </div>
              <div className="stp-item-info">
                <span className="stp-item-name">{pl.title}</span>
              </div>
            </button>
          ))}

          <div className="stp-divider" />

          {!showNew && (
            <button className="stp-new-row" onClick={() => setShowNew(true)}>
              <div className="stp-new-icon"><PlusIcon /></div>
              New playlist
            </button>
          )}
        </div>

        {/* New playlist form */}
        <AnimatePresence>
          {showNew && (
            <motion.div className="stp-new-form"
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
              <input ref={inputRef} className="stp-new-input" placeholder="Playlist name"
                value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
                maxLength={100} />
              <div className="stp-privacy-row">
                <span className="stp-privacy-label">Privacy:</span>
                <select className="stp-privacy-select" value={newPrivacy} onChange={e => setNewPrivacy(e.target.value)}>
                  <option value="public">Public</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <div className="stp-form-actions">
                <button className="stp-cancel-btn" onClick={() => { setShowNew(false); setNewName('') }}>Cancel</button>
                <button className="stp-create-btn" onClick={handleCreate} disabled={!newName.trim() || creating}>
                  {creating ? 'Creating…' : 'Create'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div className="stp-toast"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}>
              <span className="stp-toast-dot" />{toast}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>,
    document.body
  )
}