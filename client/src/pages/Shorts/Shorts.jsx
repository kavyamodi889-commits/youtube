// FILE: client/src/pages/Shorts/Shorts.jsx
import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { formatViews } from '../../utils/formatUtils.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useStats } from '../../context/StatsContext.jsx'
import { useFocus } from '../../context/FocusContext.jsx'
import api from '../../services/api.js'
import SaveToPlaylistModal from '../../components/Modals/SaveToPlaylistModal.jsx'
import './Shorts.css'

// ── ICONS ──
const PlayIcon        = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
const PauseIcon       = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
const LikeIcon        = ({ filled }) => <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/><path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>
const DislikeIcon     = ({ filled }) => <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17"/></svg>
const CommentIcon     = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
const ShareIcon       = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
const SaveIcon        = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
const DotsVertIcon    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
const ChevronUpIcon   = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
const ChevronDownIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
const CloseIcon       = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const SendIcon        = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
const MuteIcon        = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
const UnmuteIcon      = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>
const FlagIcon        = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
const BlockIcon       = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
const CheckIcon       = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>

// ── REPORT MODAL ──
const REPORT_REASONS = [
  { key: 'spam',           label: 'Spam or misleading' },
  { key: 'harassment',     label: 'Harassment or bullying' },
  { key: 'hateSpeech',     label: 'Hate speech' },
  { key: 'violence',       label: 'Violent or graphic content' },
  { key: 'sexualContent',  label: 'Sexual content' },
  { key: 'misinformation', label: 'Misinformation' },
  { key: 'copyright',      label: 'Copyright violation' },
  { key: 'childSafety',    label: 'Child safety' },
  { key: 'other',          label: 'Other' },
]

function ReportModal({ videoId, onClose }) {
  const [reason, setReason]        = useState('')
  const [details, setDetails]      = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]            = useState(false)

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const handleSubmit = async () => {
    if (!reason || submitting) return
    setSubmitting(true)
    try {
      await api.post(`/interactions/${videoId}/report`, { reason, details })
      setDone(true); setTimeout(onClose, 1800)
    } catch { setDone(true); setTimeout(onClose, 1800) }
  }

  return createPortal(
    <motion.div className="report-backdrop"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div className="report-modal"
        initial={{ opacity: 0, scale: 0.93, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 16 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        onMouseDown={e => e.stopPropagation()}>
        {done ? (
          <div className="report-done">
            <div className="report-done-icon">✓</div>
            <p className="report-done-title">Report submitted</p>
            <p className="report-done-sub">Thanks for helping keep AURA safe.</p>
          </div>
        ) : (
          <>
            <div className="report-header">
              <h3 className="report-title">Report video</h3>
              <button className="report-close" onClick={onClose}><CloseIcon /></button>
            </div>
            <p className="report-sub">What's wrong with this video?</p>
            <div className="report-reasons">
              {REPORT_REASONS.map(r => (
                <button key={r.key}
                  className={`report-reason-btn ${reason === r.key ? 'active' : ''}`}
                  onClick={() => setReason(r.key)}>
                  <span className="report-reason-check">{reason === r.key ? <CheckIcon /> : null}</span>
                  {r.label}
                </button>
              ))}
            </div>
            <textarea className="report-details"
              placeholder="Additional details (optional)"
              value={details} onChange={e => setDetails(e.target.value)}
              maxLength={500} rows={3}
            />
            <div className="report-footer">
              <button className="report-cancel-btn" onClick={onClose}>Cancel</button>
              <motion.button
                className={`report-submit-btn ${reason ? 'active' : ''}`}
                onClick={handleSubmit} disabled={!reason || submitting}
                whileHover={reason ? { scale: 1.03 } : {}}
                whileTap={reason ? { scale: 0.97 } : {}}>
                {submitting ? 'Submitting…' : 'Submit report'}
              </motion.button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>,
    document.body
  )
}

// ── COMMENTS PANEL ──
function CommentsPanel({ short, onClose }) {
  const { user } = useAuth()
  const [comments, setComments] = useState([])
  const [text, setText]         = useState('')
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    api.get(`/interactions/${short._id}/comments?sort=top`)
      .then(r => setComments(r.data.comments || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [short._id])

  const submit = async () => {
    if (!text.trim() || !user) return
    try {
      const r = await api.post(`/interactions/${short._id}/comments`, { text })
      setComments(prev => [r.data.comment, ...prev])
      setText('')
    } catch {}
  }

  return (
    <motion.div className="shorts-comments-panel"
      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 32 }}>
      <div className="scp-header">
        <span className="scp-title">Comments</span>
        <span className="scp-count">{comments.length}</span>
        <button className="scp-close" onClick={onClose}><CloseIcon /></button>
      </div>
      <div className="scp-list">
        {loading
          ? <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--t3)', fontSize: '0.875rem' }}>Loading...</div>
          : comments.length === 0
            ? <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--t3)', fontSize: '0.875rem' }}>No comments yet</div>
            : comments.map(c => (
              <div key={c._id} className="scp-comment-row">
                <img src={c.author?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${c.author?.username}`} alt="" className="scp-comment-avatar" />
                <div className="scp-comment-body">
                  <span className="scp-comment-name">{c.author?.displayName || c.author?.username}</span>
                  <p className="scp-comment-text">{c.text}</p>
                </div>
              </div>
            ))
        }
      </div>
      <div className="scp-input-row">
        <img src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.username || 'guest'}`} alt="you" className="scp-avatar" />
        <div className="scp-input-wrap">
          <input className="scp-input"
            placeholder={user ? 'Add a comment...' : 'Sign in to comment'}
            value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit() }}
            disabled={!user}
          />
          {text.trim() && <button className="scp-send" onClick={submit}><SendIcon /></button>}
        </div>
      </div>
    </motion.div>
  )
}

// ── TOAST ──
function Toast({ msg }) {
  return createPortal(
    <motion.div className="short-toast"
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.2 }}>
      {msg}
    </motion.div>,
    document.body
  )
}

// ── SINGLE SHORT ITEM ──
function ShortItem({ short, isActive, onSwipeUp, onSwipeDown }) {
  const { user }                                = useAuth()
  const { updateVideoStats, updateChannelStats } = useStats()
  const videoRef       = useRef(null)
  const progressRef    = useRef(null)
  const videoCardRef   = useRef(null)
  const touchStartY    = useRef(0)
  const touchStartX    = useRef(0)
  const touchStartTime = useRef(0)
  const viewCounted    = useRef(false)

  const [playing,       setPlaying]       = useState(false)
  const [muted,         setMuted]         = useState(false)
  const [volume,        setVolume]        = useState(0.8)
  const [liked,         setLiked]         = useState(false)
  const [disliked,      setDisliked]      = useState(false)
  const [watchLater,    setWatchLater]    = useState(false)
  const [subscribed,    setSubscribed]    = useState(false)
  const [likeCount,     setLikeCount]     = useState(short.likes || 0)
  const [showComments,  setShowComments]  = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [progress,      setProgress]      = useState(0)
  const [showPlay,      setShowPlay]      = useState(false)
  const [shareMsg,      setShareMsg]      = useState('')
  const [showVolume,    setShowVolume]    = useState(false)
  const [seekFlash,     setSeekFlash]     = useState(null)
  const [showDotsMenu,  setShowDotsMenu]  = useState(false)
  const [showReport,    setShowReport]    = useState(false)
  const [toast,         setToast]         = useState('')

  // Is current user the channel owner? → hide Subscribe
  const isOwner = !!(user && short.channel?._id && user._id === short.channel._id)

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2200) }

  // Fetch interaction state
  useEffect(() => {
    if (!isActive || !user || !short._id) return
    api.get(`/interactions/${short._id}`)
      .then(r => {
        setLiked(r.data.liked         || false)
        setDisliked(r.data.disliked   || false)
        setWatchLater(r.data.watchLater || false)
        setSubscribed(r.data.subscribed || false)
      }).catch(() => {})
  }, [isActive, user, short._id])

  // Play/pause + view count when active changes
  useEffect(() => {
    const v = videoRef.current; if (!v) return
    if (isActive) {
      v.currentTime = 0
      v.play().then(() => setPlaying(true)).catch(() => {})
      // Count view once per activation
      if (!viewCounted.current && short._id) {
        viewCounted.current = true
        api.post(`/videos/${short._id}/view`).catch(() => {})
      }
    } else {
      v.pause(); v.currentTime = 0; setPlaying(false); setProgress(0)
      viewCounted.current = false
    }
  }, [isActive, short._id])

  // Progress heartbeat
  const shortWatchedRef = useRef(0)
  const shortTickRef    = useRef(null)
  const shortIdRef      = useRef(null)
  const userRef         = useRef(null)
  shortIdRef.current    = short?._id ?? null
  userRef.current       = user ?? null

  const flushShortProgress = useCallback(() => {
    const vid = shortIdRef.current; const u = userRef.current
    if (!vid || !u || shortWatchedRef.current < 1) return
    const secs = Math.round(shortWatchedRef.current); shortWatchedRef.current = 0
    const v = videoRef.current
    api.post(`/videos/${vid}/progress`, {
      watchedDuration: secs,
      progressPercent: v?.duration ? Math.round((v.currentTime / v.duration) * 100) : 0,
      resumeAt: 0,
    }).catch(() => { shortWatchedRef.current += secs })
  }, [])

  useEffect(() => {
    if (isActive && playing) {
      shortTickRef.current = setInterval(() => { shortWatchedRef.current += 1 }, 1000)
    } else {
      clearInterval(shortTickRef.current); flushShortProgress()
    }
    return () => clearInterval(shortTickRef.current)
  }, [isActive, playing, flushShortProgress])

  useEffect(() => () => { clearInterval(shortTickRef.current); flushShortProgress() }, [flushShortProgress])

  useEffect(() => {
    const v = videoRef.current; if (!v) return
    const onTime  = () => { setProgress(v.duration ? (v.currentTime / v.duration) * 100 : 0) }
    const onEnded = () => { setProgress(100); setTimeout(() => onSwipeDown(), 800) }
    v.addEventListener('timeupdate', onTime)
    v.addEventListener('ended', onEnded)
    return () => { v.removeEventListener('timeupdate', onTime); v.removeEventListener('ended', onEnded) }
  }, [onSwipeDown])

  const togglePlay = useCallback(() => {
    const v = videoRef.current; if (!v) return
    if (v.paused) { v.play(); setPlaying(true) } else { v.pause(); setPlaying(false) }
    setShowPlay(true); setTimeout(() => setShowPlay(false), 700)
  }, [])

  const changeVolume = (val) => {
    const v = videoRef.current; if (!v) return
    v.volume = val; v.muted = val === 0; setVolume(val); setMuted(val === 0)
  }
  const toggleMute = (e) => {
    e?.stopPropagation()
    const v = videoRef.current; if (!v) return
    if (muted) { v.muted = false; v.volume = volume || 0.8; setMuted(false) }
    else { v.muted = true; setMuted(true) }
  }

  const handleProgressClick = (e) => {
    e.stopPropagation()
    const v = videoRef.current; if (!v) return
    const rect = progressRef.current?.getBoundingClientRect(); if (!rect) return
    v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration
  }

  const onTouchStart = (e) => {
    touchStartY.current    = e.touches[0].clientY
    touchStartX.current    = e.touches[0].clientX
    touchStartTime.current = Date.now()
  }
  const onTouchEnd = (e) => {
    const dy = touchStartY.current - e.changedTouches[0].clientY
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dt = Date.now() - touchStartTime.current
    if (Math.abs(dy) > 60 && dt < 400 && Math.abs(dy) > Math.abs(dx)) {
      if (dy > 0) onSwipeDown(); else onSwipeUp(); return
    }
    if (Math.abs(dx) < 30 && Math.abs(dy) < 30 && dt < 250) {
      const w = videoCardRef.current?.offsetWidth || 400
      if (touchStartX.current < w * 0.35) {
        const v = videoRef.current; if (!v) return
        v.currentTime = Math.max(0, v.currentTime - 10)
        setSeekFlash('back'); setTimeout(() => setSeekFlash(null), 600)
      } else if (touchStartX.current > w * 0.65) {
        const v = videoRef.current; if (!v) return
        v.currentTime = Math.min(v.duration, v.currentTime + 10)
        setSeekFlash('forward'); setTimeout(() => setSeekFlash(null), 600)
      } else { togglePlay() }
    }
  }

  const handleLike = async (e) => {
    e.stopPropagation(); if (!user) return
    const was = liked; setLiked(!was); setDisliked(false); setLikeCount(c => was ? c - 1 : c + 1)
    try {
      const r = await api.post(`/interactions/${short._id}/like`)
      setLiked(r.data.liked); setLikeCount(r.data.likeCount)
      updateVideoStats(short._id, { liked: r.data.liked, likeCount: r.data.likeCount })
    } catch { setLiked(was); setLikeCount(short.likes || 0) }
  }
  const handleDislike = async (e) => {
    e.stopPropagation(); if (!user) return
    const was = disliked; setDisliked(!was); setLiked(false)
    if (!was && liked) setLikeCount(c => c - 1)
    try {
      const r = await api.post(`/interactions/${short._id}/dislike`)
      updateVideoStats(short._id, { disliked: r.data.disliked, liked: r.data.liked })
    } catch { setDisliked(was) }
  }
  const handleSubscribe = async (e) => {
    e.stopPropagation(); if (!user || !short.channel?._id) return
    const was = subscribed; setSubscribed(!was)
    try {
      const r = await api.post(`/interactions/channel/${short.channel._id}/subscribe`)
      setSubscribed(r.data.subscribed)
      updateChannelStats(short.channel._id, { subscribed: r.data.subscribed, subscriberCount: r.data.subscriberCount })
    } catch { setSubscribed(was) }
  }
  const handleShare = async (e) => {
    e.stopPropagation()
    try {
      await api.post(`/interactions/${short._id}/share`)
      const url = `${window.location.origin}/shorts?id=${short._id}`
      if (navigator.share) navigator.share({ title: short.title, url })
      else { navigator.clipboard.writeText(url); setShareMsg('Copied!'); setTimeout(() => setShareMsg(''), 2000) }
    } catch {}
  }
  const handleHideChannel = async (e) => {
    e.stopPropagation(); setShowDotsMenu(false)
    if (!short.channel?._id) { flash('Channel info unavailable'); return }
    try {
      await api.post(`/interactions/channel/${short.channel._id}/hide`)
      flash('Channel hidden from recommendations')
    } catch { flash('Sign in to customise your feed') }
  }
  const handleReport = (e) => {
    e.stopPropagation(); setShowDotsMenu(false); setShowReport(true)
  }

  return (
    /* Three-column scene: [LEFT INFO] [VIDEO CARD] [RIGHT RAIL] */
    <div className="short-scene">

      {/* ── LEFT INFO — channel, title, subscribe ── */}
      <div className="short-left-info" onClick={e => e.stopPropagation()}>
        <div className="short-channel-row">
          <Link to={`/channel/${short.channel._id}`} className="short-channel-inner">
            {short.channel.avatar
              ? <img src={short.channel.avatar} alt={short.channel.name} className="short-channel-avatar" />
              : <div className="short-channel-avatar short-channel-avatar-fb">{short.channel.name?.[0]}</div>
            }
            <span className="short-channel-name">{short.channel.name}</span>
          </Link>
          {isOwner
            ? <button className="short-subscribe-btn short-manage-btn" onClick={() => window.open('http://localhost:5174', '_blank')}>Manage Channel</button>
            : subscribed
              ? <button className="short-subscribe-btn short-subscribed-btn" onClick={handleSubscribe}>Subscribed ✓</button>
              : <button className="short-subscribe-btn" onClick={handleSubscribe}>Subscribe</button>
          }
        </div>
        <p className="short-title">{short.title}</p>
      </div>

      {/* ── VIDEO CARD ── */}
      <div ref={videoCardRef} className="short-item"
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
        onClick={togglePlay}>
        <video ref={videoRef} className="short-video"
          src={short.videoUrl} loop={false} muted={muted} playsInline
          disablePictureInPicture disableRemotePlayback
          controlsList="nodownload nofullscreen noremoteplayback"
          poster={short.thumbnailUrl || short.thumbnail} preload="metadata"
        />

        <div className="short-gradient-top" />
        <div className="short-gradient-bottom" />

        {/* Seek flash */}
        <AnimatePresence>
          {seekFlash && (
            <motion.div key={seekFlash} className={`short-seek-flash short-seek-flash--${seekFlash}`}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <div className="short-seek-ripple" />
              <span className="short-seek-icon">
                {seekFlash === 'back'
                  ? <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M6 13a6 6 0 106-6h-.5V4.5L8 8l3.5 3.5V9H12a4 4 0 10-4 4z"/></svg>
                  : <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M18 13a6 6 0 11-6-6h.5V4.5L16 8l-3.5 3.5V9H12a4 4 0 104 4z"/></svg>
                }
                <span>10s</span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Play/pause flash */}
        <AnimatePresence>
          {showPlay && (
            <motion.div className="short-play-flash"
              initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.3 }} transition={{ duration: 0.22 }}>
              {playing ? <PauseIcon /> : <PlayIcon />}
            </motion.div>
          )}
        </AnimatePresence>

        {/* TOP BAR: volume + 3-dots */}
        <div className="short-top-bar" onClick={e => e.stopPropagation()}>
          {/* Volume */}
          <div className="short-volume-wrap"
            onMouseEnter={() => setShowVolume(true)}
            onMouseLeave={() => setShowVolume(false)}>
            <button className="short-ctrl-btn" onClick={toggleMute}>
              {muted || volume === 0 ? <MuteIcon /> : <UnmuteIcon />}
            </button>
            <AnimatePresence>
              {showVolume && (
                <motion.div className="short-volume-panel"
                  initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.15 }}>
                  <input type="range" min="0" max="1" step="0.02"
                    value={muted ? 0 : volume}
                    onChange={e => changeVolume(parseFloat(e.target.value))}
                    className="short-volume-slider"
                    style={{ '--vol': `${(muted ? 0 : volume) * 100}%` }}
                    onClick={e => e.stopPropagation()}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 3-dots */}
          <div style={{ position: 'relative' }}>
            <button className="short-ctrl-btn"
              onClick={e => { e.stopPropagation(); setShowDotsMenu(v => !v) }}>
              <DotsVertIcon />
            </button>
            <AnimatePresence>
              {showDotsMenu && (
                <motion.div className="short-dots-menu"
                  initial={{ opacity: 0, scale: 0.92, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -8 }}
                  transition={{ duration: 0.15 }}
                  onClick={e => e.stopPropagation()}>
                  <button className="short-dots-item" onClick={handleHideChannel}>
                    <BlockIcon /><span>Don't recommend this channel</span>
                  </button>
                  <button className="short-dots-item short-dots-item--danger" onClick={handleReport}>
                    <FlagIcon /><span>Report</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Progress bar */}
        <div className="short-progress-wrap" ref={progressRef}
          onClick={e => { e.stopPropagation(); handleProgressClick(e) }}
          onMouseDown={e => { e.stopPropagation(); handleProgressClick(e) }}>
          <div className="short-progress-track">
            <div className="short-progress-fill" style={{ width: `${progress}%` }} />
            <div className="short-progress-thumb" style={{ left: `${progress}%` }} />
          </div>
        </div>

        {/* Comments panel */}
        <AnimatePresence>
          {showComments && <CommentsPanel short={short} onClose={() => setShowComments(false)} />}
        </AnimatePresence>

        {/* Save to playlist modal */}
        <AnimatePresence>
          {showSaveModal && (
            <SaveToPlaylistModal videoId={short._id} onClose={() => setShowSaveModal(false)} />
          )}
        </AnimatePresence>
      </div>

      {/* ── RIGHT ACTION RAIL — directly beside the player ── */}
      <div className="short-action-rail" onClick={e => e.stopPropagation()}>
        <div className="short-action-item">
          <motion.button className={`short-action-btn ${liked ? 'active' : ''}`}
            onClick={handleLike} whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.88 }}>
            <LikeIcon filled={liked} />
          </motion.button>
          <span className="short-action-label">{formatViews(likeCount)}</span>
        </div>
        <div className="short-action-item">
          <motion.button className={`short-action-btn ${disliked ? 'active-dis' : ''}`}
            onClick={handleDislike} whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.88 }}>
            <DislikeIcon filled={disliked} />
          </motion.button>
          <span className="short-action-label">Dislike</span>
        </div>
        <div className="short-action-item">
          <motion.button className="short-action-btn"
            onClick={e => { e.stopPropagation(); setShowComments(v => !v) }}
            whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.88 }}>
            <CommentIcon />
          </motion.button>
          <span className="short-action-label">{short.commentCount || 0}</span>
        </div>
        <div className="short-action-item">
          <motion.button className="short-action-btn" onClick={handleShare}
            whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.88 }}>
            <ShareIcon />
          </motion.button>
          <span className="short-action-label">{shareMsg || 'Share'}</span>
        </div>
        <div className="short-action-item">
          <motion.button className={`short-action-btn ${watchLater ? 'active' : ''}`}
            onClick={e => { e.stopPropagation(); setShowSaveModal(true) }}
            whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.88 }}>
            <SaveIcon />
          </motion.button>
          <span className="short-action-label">Save</span>
        </div>
      </div>

      <AnimatePresence>
        {showReport && <ReportModal videoId={short._id} onClose={() => setShowReport(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {toast && <Toast msg={toast} />}
      </AnimatePresence>
    </div>
  )
}

// ── MAIN SHORTS PAGE ──
export default function Shorts() {
  const [searchParams] = useSearchParams()
  const navigate       = useNavigate()
  const startId        = searchParams.get('id')
  const playlistId     = searchParams.get('list')
  const playlistIdsStr = searchParams.get('ids')
  const { active: focusActive } = useFocus()

  const [shorts,       setShorts]       = useState([])
  const [loading,      setLoading]      = useState(true)
  const [current,      setCurrent]      = useState(0)
  const [playlistEnded,setPlaylistEnded]= useState(false)
  const direction = useRef(1)
  const total     = shorts.length
  const pageRef   = useRef(null)

  const isPlaylistMode   = !!(playlistId && playlistIdsStr)
  const playlistShortIds = isPlaylistMode ? playlistIdsStr.split(',').filter(Boolean) : []

  const goDown = useCallback(() => {
    if (current >= total - 1) {
      if (isPlaylistMode) setPlaylistEnded(true)
      return
    }
    direction.current = 1; setCurrent(c => c + 1); setPlaylistEnded(false)
  }, [current, total, isPlaylistMode])

  const goUp = useCallback(() => {
    if (current <= 0) return
    direction.current = -1; setCurrent(c => c - 1); setPlaylistEnded(false)
  }, [current])

  useEffect(() => {
    const h = (e) => { if (e.key === 'ArrowUp') goUp(); if (e.key === 'ArrowDown') goDown() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [goUp, goDown])

  useEffect(() => {
    const el = pageRef.current; if (!el) return
    let lastWheel = 0
    const onWheel = (e) => {
      e.preventDefault()
      const now = Date.now(); if (now - lastWheel < 700) return; lastWheel = now
      if (Math.abs(e.deltaY) < 30) return
      if (e.deltaY > 0) goDown(); else goUp()
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [goDown, goUp])

  useEffect(() => {
    if (isPlaylistMode && playlistShortIds.length > 0) {
      Promise.all(
        playlistShortIds.map(id =>
          api.get(`/videos/${id}`).then(r => r.data.video || r.data.data?.video).catch(() => null)
        )
      ).then(results => {
        const vids = results.filter(Boolean).filter(v => v.isShort)
        const normalized = vids.map(v => normalizeShort(v))
        setShorts(normalized)
        if (startId) {
          const idx = normalized.findIndex(s => s._id === startId)
          if (idx !== -1) setCurrent(idx)
        }
        setLoading(false)
      })
      return
    }

    api.get('/videos?isShort=true&limit=100')
      .then(res => {
        const vids = res.data.videos || res.data.data?.videos || []
        const normalized = vids.filter(v => v.isShort).map(v => normalizeShort(v))
        // After initial load, enrich with recommendations in background
        setShorts(normalized)
        if (startId) {
          const idx = normalized.findIndex(s => s._id === startId)
          if (idx !== -1) setCurrent(idx)
        }
        setLoading(false)

        // Background: fetch recommended shorts and append new ones not already in list
        const seedId = startId || normalized[0]?._id
        if (seedId) {
          import('../../services/recommendationService.js').then(({ getShortsNext }) => {
            getShortsNext(seedId, 30).then(recs => {
              const recNormalized = recs.filter(v => v.isShort).map(v => normalizeShort(v))
              setShorts(prev => {
                const existingIds = new Set(prev.map(s => s._id))
                const fresh = recNormalized.filter(s => !existingIds.has(s._id))
                return [...prev, ...fresh]
              })
            }).catch(() => {})
          })
        }
      })
      .catch(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return (
    <div className="shorts-page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '70vh' }}>
        <div style={{ width: 36, height: 36, border: '3px solid var(--s3)', borderTopColor: 'var(--a)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    </div>
  )

  if (shorts.length === 0) return (
    <div className="shorts-page">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70vh', gap: '16px' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--t3)', opacity: 0.35 }}><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
        <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--t1)' }}>No Shorts yet</p>
        <p style={{ fontSize: '0.875rem', color: 'var(--t3)' }}>Shorts uploaded by creators will appear here</p>
      </div>
    </div>
  )

  if (focusActive) return (
    <div className="shorts-focus-block">
      <div className="sfb-inner">
        <div className="sfb-icon">🎯</div>
        <h2 className="sfb-title">Shorts are blocked</h2>
        <p className="sfb-desc">Shorts are always disabled during a Focus session to help you stay on track.</p>
        <button className="sfb-btn" onClick={() => navigate('/')}>← Back to Home</button>
      </div>
    </div>
  )

  const dir = direction.current

  return (
    <div className="shorts-page" ref={pageRef}>
      <div className="shorts-feed">
        <AnimatePresence mode="wait" initial={false}>
          {playlistEnded ? (
            <motion.div key="playlist-end" className="shorts-slide"
              initial={{ y: '100%', opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '-100%', opacity: 0.5 }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}>
              <div className="shorts-playlist-end">
                <div className="spe-inner">
                  <div className="spe-icon">🎬</div>
                  <h2 className="spe-title">That's all the Shorts</h2>
                  <p className="spe-sub">You've watched all {total} short{total !== 1 ? 's' : ''} from this playlist.</p>
                  <button className="spe-back-btn" onClick={() => navigate(-1)}>← Back to Playlist</button>
                  <button className="spe-restart-btn" onClick={() => { setCurrent(0); setPlaylistEnded(false) }}>↺ Watch again</button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key={current} className="shorts-slide"
              initial={{ y: dir === 1 ? '100%' : '-100%', opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: dir === 1 ? '-100%' : '100%', opacity: 0.5 }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}>
              <ShortItem short={shorts[current]} isActive={true} onSwipeUp={goUp} onSwipeDown={goDown} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {isPlaylistMode && !playlistEnded && (
        <div className="shorts-playlist-indicator">
          <span className="spi-label">Playlist</span>
          <span className="spi-progress">{current + 1} / {total}</span>
        </div>
      )}

      <div className="shorts-nav-col">
        <motion.button className={`shorts-nav-btn ${current <= 0 ? 'disabled' : ''}`}
          onClick={goUp} disabled={current <= 0}
          whileHover={{ scale: current <= 0 ? 1 : 1.08 }}
          whileTap={{ scale: current <= 0 ? 1 : 0.92 }}>
          <ChevronUpIcon />
        </motion.button>
        <motion.button
          className={`shorts-nav-btn ${(current >= total - 1 && !isPlaylistMode) ? 'disabled' : ''}`}
          onClick={goDown} disabled={current >= total - 1 && !isPlaylistMode}
          whileHover={{ scale: (current >= total - 1 && !isPlaylistMode) ? 1 : 1.08 }}
          whileTap={{ scale: (current >= total - 1 && !isPlaylistMode) ? 1 : 0.92 }}>
          <ChevronDownIcon />
        </motion.button>
      </div>
    </div>
  )
}

// ── Helper ──
function normalizeShort(v) {
  return {
    _id:          v._id,
    title:        v.title,
    videoUrl:     v.videoUrl || '',
    thumbnailUrl: v.thumbnailUrl || '',
    thumbnail:    v.thumbnailUrl || '',
    views:        v.viewCount   || 0,
    likes:        v.likeCount   || 0,
    commentCount: v.commentCount || 0,
    tags:         v.tags        || [],
    channel: {
      _id:      v.uploader?._id,
      name:     v.uploader?.displayName || v.uploader?.username || 'Unknown',
      avatar:   v.uploader?.avatar || '',
      handle:   v.uploader?.handle || v.uploader?.username || '',
      verified: v.uploader?.isChannelVerified || false,
    },
  }
}