// FILE: client/src/pages/Playlists/PlaylistDetail.jsx
import { useState, useEffect, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext.jsx'
import { useFocus } from '../../context/FocusContext.jsx'
import api from '../../services/api.js'
import { formatViews, timeAgo, formatDuration } from '../../utils/formatUtils.js'
import './PlaylistDetail.css'

// ── Icons ──
const PlayIcon    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
const ShuffleIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>
const LockIcon    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
const GlobeIcon   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
const TrashIcon   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
const DotsIcon    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
const BackIcon    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
const ShortsIcon  = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink:0 }}><path d="M17.77 10.32l-1.2-.5L18 9.06c1.84-.96 2.53-3.23 1.56-5.06s-3.23-2.53-5.06-1.56L6 6.94c-1.29.68-2.06 2.03-1.98 3.49.07 1.18.63 2.23 1.51 2.94-.07.23-.11.47-.11.73v4c0 2.21 2.69 4 6 4s6-1.79 6-4v-4c0-.67-.21-1.3-.58-1.84l.93-.38c.67-.28 1-.93.72-1.56z"/></svg>

const PLACEHOLDER = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="480" height="270" viewBox="0 0 480 270"><rect width="480" height="270" fill="%231a1a2e"/><text x="50%25" y="50%25" font-family="sans-serif" font-size="48" fill="%23333" dominant-baseline="middle" text-anchor="middle">▶</text></svg>'

// ── Short row in playlist — rectangle card, vertical thumb letterboxed ──────
// Clicking navigates to /shorts?id=X&list=PLAYLIST_ID so the Shorts page
// scopes its feed to this playlist's shorts only.
function ShortRow({ video, index, playlistId, onRemove, isOwner, playlistShortIds }) {
  const navigate   = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleClick = () => {
    // Pass the playlist's short IDs so Shorts page can build its own scoped feed
    const ids = playlistShortIds.join(',')
    navigate(`/shorts?id=${video._id}&list=${playlistId}&ids=${ids}`)
  }

  return (
    <motion.div className="pld-video-row pld-short-row"
      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}>
      <span className="pld-row-num">{index + 1}</span>

      {/* Rectangle thumb — 16:9 box, vertical thumb letterboxed inside */}
      <div className="pld-row-thumb-wrap pld-short-thumb-wrap" onClick={handleClick} style={{ cursor:'pointer' }}>
        <img
          src={video.thumbnailUrl || PLACEHOLDER}
          alt={video.title}
          className="pld-row-thumb pld-short-thumb-img"
          loading="lazy"
        />
        {/* "Shorts" badge */}
        <span className="pld-short-badge"><ShortsIcon /> Short</span>
        <div className="pld-row-play-overlay"><PlayIcon /></div>
      </div>

      <div className="pld-row-info">
        <span className="pld-row-title" onClick={handleClick} style={{ cursor:'pointer' }}>
          {video.title}
        </span>
        <Link to={`/channel/${video.uploader?._id}`} className="pld-row-channel">
          {video.uploader?.displayName || video.uploader?.username}
        </Link>
        <span className="pld-row-meta">
          {formatViews(video.viewCount)} views · {timeAgo(video.createdAt)}
        </span>
      </div>

      {isOwner && (
        <div className="pld-row-menu-wrap">
          <button className="pld-row-dots" onClick={() => setMenuOpen(v => !v)}><DotsIcon /></button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div className="pld-row-menu"
                initial={{ opacity: 0, scale: 0.9, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -6 }}
                transition={{ duration: 0.14 }}>
                <button className="pld-row-menu-item danger" onClick={() => { onRemove(video._id); setMenuOpen(false) }}>
                  <TrashIcon /> Remove
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}

function VideoRow({ video, index, playlistId, onRemove, isOwner }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <motion.div className="pld-video-row"
      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}>
      <span className="pld-row-num">{index + 1}</span>

      <Link to={`/watch/${video._id}?list=${playlistId}&index=${index}`} className="pld-row-thumb-wrap">
        <img src={video.thumbnailUrl || PLACEHOLDER} alt={video.title} className="pld-row-thumb" loading="lazy" />
        {video.duration > 0 && <span className="pld-row-dur">{formatDuration(video.duration)}</span>}
        <div className="pld-row-play-overlay"><PlayIcon /></div>
      </Link>

      <div className="pld-row-info">
        <Link to={`/watch/${video._id}?list=${playlistId}&index=${index}`} className="pld-row-title">
          {video.title}
        </Link>
        <Link to={`/channel/${video.uploader?._id}`} className="pld-row-channel">
          {video.uploader?.displayName || video.uploader?.username}
        </Link>
        <span className="pld-row-meta">
          {formatViews(video.viewCount)} views · {timeAgo(video.createdAt)}
        </span>
      </div>

      {isOwner && (
        <div className="pld-row-menu-wrap">
          <button className="pld-row-dots" onClick={() => setMenuOpen(v => !v)}><DotsIcon /></button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div className="pld-row-menu"
                initial={{ opacity: 0, scale: 0.9, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -6 }}
                transition={{ duration: 0.14 }}>
                <button className="pld-row-menu-item danger" onClick={() => { onRemove(video._id); setMenuOpen(false) }}>
                  <TrashIcon /> Remove
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}

export default function PlaylistDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const { active: focusActive, blockedCategories } = useFocus()
  const navigate = useNavigate()

  const [playlist, setPlaylist] = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [typeTab,  setTypeTab]  = useState('all') // 'all' | 'videos' | 'shorts'

  useEffect(() => {
    setLoading(true); setError('')
    api.get(`/playlists/${id}/details`)
      .then(r => setPlaylist(r.data.playlist))
      .catch(err => setError(err.response?.data?.message || 'Playlist not found'))
      .finally(() => setLoading(false))
  }, [id])

  // Filter playlist videos by type tab + focus mode
  const displayVideos = useMemo(() => {
    if (!playlist?.videos) return []
    let list = [...playlist.videos]
    // Type tab filter (when not in focus)
    if (!focusActive) {
      if (typeTab === 'videos') list = list.filter(v => !v.isShort)
      if (typeTab === 'shorts') list = list.filter(v =>  v.isShort)
    }
    // Focus mode: always remove shorts + blocked categories
    if (focusActive) {
      list = list.filter(v => !v.isShort)
      if (blockedCategories.length > 0)
        list = list.filter(v => !blockedCategories.includes(v.category))
    }
    return list
  }, [playlist?.videos, typeTab, focusActive, blockedCategories])

  const handleRemove = async (videoId) => {
    setPlaylist(prev => ({ ...prev, videos: prev.videos.filter(v => v._id !== videoId) }))
    try { await api.delete(`/playlists/${id}/videos/${videoId}`) }
    catch { /* revert not needed for now */ }
  }

  const handlePlayAll = () => {
    const first = displayVideos?.[0]
    if (first) navigate(`/watch/${first._id}?list=${id}&index=0`)
  }

  const handleShuffle = () => {
    const videos = displayVideos || []
    if (!videos.length) return
    const idx = Math.floor(Math.random() * videos.length)
    navigate(`/watch/${videos[idx]._id}?list=${id}&index=${idx}`)
  }

  const isOwner = user && playlist && String(user._id) === String(playlist.owner?._id)

  if (loading) return (
    <div className="pld-page">
      <div className="pld-layout">
        <div className="pld-sidebar">
          <div className="pld-cover skel" style={{ aspectRatio: '16/9', borderRadius: 14 }} />
          <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[80, 55, 40].map((w, i) => <div key={i} className="skel" style={{ height: 14, width: `${w}%`, borderRadius: 6 }} />)}
          </div>
        </div>
        <div className="pld-videos">
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'center' }}>
              <div className="skel" style={{ width: 28, height: 14, borderRadius: 4, flexShrink: 0 }} />
              <div className="skel" style={{ width: 160, height: 90, borderRadius: 8, flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="skel" style={{ height: 14, borderRadius: 5 }} />
                <div className="skel" style={{ height: 12, width: '55%', borderRadius: 5 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  if (error) return (
    <div className="pld-page">
      <div className="pld-error">
        <span className="pld-error-icon">🎵</span>
        <h2 className="pld-error-title">{error}</h2>
        <p className="pld-error-sub">This playlist may be private or doesn't exist.</p>
        <Link to="/playlists" className="pld-error-btn">Back to Playlists</Link>
      </div>
    </div>
  )

  const thumb = playlist.thumbnail || playlist.videos?.[0]?.thumbnailUrl || PLACEHOLDER
  const totalDuration = displayVideos.reduce((acc, v) => acc + (v.duration || 0), 0)

  return (
    <motion.div className="pld-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
      <div className="pld-layout">
        {/* Sidebar — playlist info */}
        <div className="pld-sidebar">
          <div className="pld-cover-wrap">
            <img src={thumb} alt={playlist.title} className="pld-cover" />
            <div className="pld-cover-count-badge">
              <PlayIcon /><span>{playlist.videos?.length || 0} videos</span>
            </div>
          </div>

          <div className="pld-meta">
            <h1 className="pld-title">{playlist.title}</h1>
            <p className="pld-owner">
              by <Link to={`/channel/${playlist.owner?._id}`} className="pld-owner-link">
                {playlist.owner?.displayName || playlist.owner?.username}
              </Link>
            </p>
            <div className="pld-stats">
              <span className="pld-privacy">
                {playlist.privacy === 'private' ? <><LockIcon /> Private</> : <><GlobeIcon /> Public</>}
              </span>
              <span>·</span>
              <span>{playlist.videos?.length || 0} videos</span>
              {totalDuration > 0 && (
                <><span>·</span><span>{formatDuration(totalDuration)}</span></>
              )}
            </div>
            {playlist.description && <p className="pld-desc">{playlist.description}</p>}
          </div>

          <div className="pld-actions">
            <motion.button className="pld-play-all-btn" onClick={handlePlayAll}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <PlayIcon /> Play all
            </motion.button>
            <motion.button className="pld-shuffle-btn" onClick={handleShuffle}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <ShuffleIcon /> Shuffle
            </motion.button>
          </div>

          <button className="pld-back-btn" onClick={() => navigate(-1)}>
            <BackIcon /> Back
          </button>
        </div>

        {/* Videos list */}
        <div className="pld-videos">
          {/* Type filter tabs — hidden during focus (shorts already removed) */}
          {!focusActive && (
            <div className="pld-type-tabs">
              {['all', 'videos', 'shorts'].map(t => (
                <button key={t}
                  className={`pld-type-tab ${typeTab === t ? 'active' : ''}`}
                  onClick={() => setTypeTab(t)}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          )}

          {displayVideos.length === 0 ? (
            <div className="pld-empty">
              <span className="pld-empty-icon">{focusActive ? '🎯' : '🎵'}</span>
              <p className="pld-empty-title">
                {focusActive ? 'No videos available during Focus' : 'No videos yet'}
              </p>
              <p className="pld-empty-sub">
                {focusActive
                  ? 'Shorts and blocked categories are hidden while focusing.'
                  : 'Add videos to this playlist from the watch page.'}
              </p>
            </div>
          ) : (
            displayVideos.map((video, idx) => {
              // Collect IDs of all shorts in this playlist (for scoped feed)
              const playlistShortIds = displayVideos
                .filter(v => v.isShort)
                .map(v => v._id)

              return video.isShort ? (
                <ShortRow
                  key={video._id}
                  video={video}
                  index={idx}
                  playlistId={id}
                  onRemove={handleRemove}
                  isOwner={isOwner}
                  playlistShortIds={playlistShortIds}
                />
              ) : (
                <VideoRow
                  key={video._id}
                  video={video}
                  index={idx}
                  playlistId={id}
                  onRemove={handleRemove}
                  isOwner={isOwner}
                />
              )
            })
          )}
        </div>
      </div>
    </motion.div>
  )
}