// FILE: client/src/components/VideoCard/VideoCard.jsx
import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { formatViews, formatDuration, timeAgo } from '../../utils/formatUtils.js'
import { useStats } from '../../context/StatsContext.jsx'
import api from '../../services/api.js'
import SaveToPlaylistModal from '../Modals/SaveToPlaylistModal.jsx'
import './VideoCard.css'

// ── Icons ─────────────────────────────────────────────────────────
const VerifiedIcon   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
const DotsIcon       = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
const WatchLaterIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
const PlaylistIcon   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
const ShareIcon      = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
const NotIntIcon     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
const BlockIcon      = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const ReportIcon     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
const CheckIcon      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>

// ── Report Modal ──────────────────────────────────────────────────
const REPORT_REASONS = [
  { key: 'spam',             label: 'Spam or misleading' },
  { key: 'harassment',       label: 'Harassment or bullying' },
  { key: 'hateSpeech',       label: 'Hate speech' },
  { key: 'violence',         label: 'Violent or graphic content' },
  { key: 'sexualContent',    label: 'Sexual content' },
  { key: 'misinformation',   label: 'Misinformation' },
  { key: 'copyright',        label: 'Copyright violation' },
  { key: 'childSafety',      label: 'Child safety' },
  { key: 'other',            label: 'Other' },
]

function ReportModal({ videoId, onClose }) {
  const [reason,    setReason]    = useState('')
  const [details,   setDetails]   = useState('')
  const [submitting,setSubmitting] = useState(false)
  const [done,      setDone]       = useState(false)

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
      setDone(true)
      setTimeout(onClose, 1800)
    } catch {
      setDone(true)
      setTimeout(onClose, 1800)
    }
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
              <button className="report-close" onClick={onClose}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <p className="report-sub">What's wrong with this video?</p>

            <div className="report-reasons">
              {REPORT_REASONS.map(r => (
                <button key={r.key}
                  className={`report-reason-btn ${reason === r.key ? 'active' : ''}`}
                  onClick={() => setReason(r.key)}>
                  <span className="report-reason-check">
                    {reason === r.key ? <CheckIcon /> : null}
                  </span>
                  {r.label}
                </button>
              ))}
            </div>

            <textarea className="report-details"
              placeholder="Additional details (optional)"
              value={details}
              onChange={e => setDetails(e.target.value)}
              maxLength={500}
              rows={3}
            />

            <div className="report-footer">
              <button className="report-cancel-btn" onClick={onClose}>Cancel</button>
              <motion.button
                className={`report-submit-btn ${reason ? 'active' : ''}`}
                onClick={handleSubmit}
                disabled={!reason || submitting}
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

// ── Portal context menu ───────────────────────────────────────────
function ContextMenu({ anchorRect, videoId, channelId, onClose, onDismiss }) {
  const menuRef = useRef(null)
  const [savedWL,       setSavedWL]       = useState(false)
  const [toast,         setToast]         = useState(null)
  const [showReport,    setShowReport]    = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)

  // Compute fixed position
  const MENU_W = 240
  const MENU_H = 300
  let left = anchorRect.right - MENU_W
  let top  = anchorRect.bottom + 6
  if (left < 8)                          left = anchorRect.left
  if (top + MENU_H > window.innerHeight) top  = anchorRect.top - MENU_H - 6
  if (top < 8)                           top  = 8

  useEffect(() => {
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) &&
          !e.target.closest('.report-backdrop')) onClose()
    }
    const onScroll = () => onClose()
    document.addEventListener('mousedown', onDown, true)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('mousedown', onDown, true)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [onClose])

  const flash = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }

  // ── Save to Watch Later ─────────────────────────────────────────
  const handleWatchLater = async (e) => {
    e.stopPropagation()
    try {
      const r = await api.post(`/interactions/${videoId}/watch-later`)
      setSavedWL(true)
      flash(r.data.watchLater ? 'Saved to Watch Later' : 'Removed from Watch Later')
      setTimeout(onClose, 1100)
    } catch {
      flash('Sign in to save videos')
      setTimeout(onClose, 1200)
    }
  }

  // ── Save to Playlist — open inline modal ──────────────────────
  const handleSaveToPlaylist = (e) => {
    e.stopPropagation()
    setShowSaveModal(true)
  }

  // ── Share ───────────────────────────────────────────────────────
  const handleShare = async (e) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/watch/${videoId}`)
      api.post(`/interactions/${videoId}/share`).catch(() => {})
      flash('Link copied to clipboard!')
    } catch {
      flash('Could not copy link')
    }
    setTimeout(onClose, 1000)
  }

  // ── Not Interested ──────────────────────────────────────────────
  const handleNotInterested = async (e) => {
    e.stopPropagation()
    try {
      await api.post(`/interactions/${videoId}/not-interested`)
      flash('Got it — video removed from feed')
      onDismiss?.()   // remove card from the UI
      setTimeout(onClose, 900)
    } catch {
      flash('Sign in to customise your feed')
      setTimeout(onClose, 1200)
    }
  }

  // ── Don't Recommend Channel ────────────────────────────────────
  const handleHideChannel = async (e) => {
    e.stopPropagation()
    if (!channelId) { flash('Channel info unavailable'); return }
    try {
      await api.post(`/interactions/channel/${channelId}/hide`)
      flash("Channel hidden from recommendations")
      onDismiss?.()
      setTimeout(onClose, 900)
    } catch {
      flash('Sign in to customise your feed')
      setTimeout(onClose, 1200)
    }
  }

  // ── Report ─────────────────────────────────────────────────────
  const handleReport = (e) => {
    e.stopPropagation()
    setShowReport(true)
  }

  const ITEMS = [
    {
      label: savedWL ? 'Saved ✓' : 'Save to Watch Later',
      icon: <WatchLaterIcon />,
      action: handleWatchLater,
      check: savedWL,
    },
    {
      label: 'Save to Playlist',
      icon: <PlaylistIcon />,
      action: handleSaveToPlaylist,
    },
    {
      label: 'Share',
      icon: <ShareIcon />,
      action: handleShare,
    },
    'divider',
    {
      label: 'Not Interested',
      icon: <NotIntIcon />,
      action: handleNotInterested,
    },
    {
      label: "Don't Recommend Channel",
      icon: <BlockIcon />,
      action: handleHideChannel,
    },
    'divider',
    {
      label: 'Report',
      icon: <ReportIcon />,
      action: handleReport,
      danger: true,
    },
  ]

  return (
    <>
      {createPortal(
        <>
          <motion.div
            ref={menuRef}
            className="video-context-menu"
            style={{ position: 'fixed', top, left, width: MENU_W, zIndex: 99999 }}
            initial={{ opacity: 0, scale: 0.9, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -6 }}
            transition={{ duration: 0.15, ease: [0.34, 1.4, 0.64, 1] }}
          >
            {ITEMS.map((item, i) =>
              item === 'divider'
                ? <div key={`d${i}`} className="context-menu-divider" />
                : (
                  <button
                    key={item.label}
                    className={`context-menu-item ${item.danger ? 'danger' : ''} ${item.check ? 'checked' : ''}`}
                    onMouseDown={(e) => { e.stopPropagation(); item.action(e) }}
                  >
                    <span className="context-menu-icon">{item.icon}</span>
                    <span className="context-menu-label">{item.label}</span>
                    {item.check && <span className="context-menu-check"><CheckIcon /></span>}
                  </button>
                )
            )}
          </motion.div>

          {toast && (
            <div className="vc-toast">{toast}</div>
          )}
        </>,
        document.body
      )}

      {/* Report modal — rendered separately so it survives menu unmount */}
      <AnimatePresence>
        {showReport && (
          <ReportModal
            videoId={videoId}
            onClose={() => { setShowReport(false); onClose() }}
          />
        )}
      </AnimatePresence>

      {/* Save to Playlist modal — inline, no navigation */}
      <AnimatePresence>
        {showSaveModal && (
          <SaveToPlaylistModal
            videoId={videoId}
            onClose={() => { setShowSaveModal(false); onClose() }}
          />
        )}
      </AnimatePresence>
    </>
  )
}

// ── Main VideoCard ────────────────────────────────────────────────
export default function VideoCard({ video }) {
  const [hovered,       setHovered]       = useState(false)
  const [previewActive, setPreviewActive] = useState(false)
  const [menuOpen,      setMenuOpen]      = useState(false)
  const [anchorRect,    setAnchorRect]    = useState(null)
  const [dismissed,     setDismissed]     = useState(false)
  const hoverTimer  = useRef(null)
  const btnRef      = useRef(null)
  const titleRef    = useRef(null)
  const wrapRef     = useRef(null)

  const { getVideoStats } = useStats()
  const liveStats    = getVideoStats(video._id)
  const displayViews = liveStats.viewCount ?? video.views ?? video.viewCount ?? 0

  const handleMouseEnter = () => {
    setHovered(true)
    hoverTimer.current = setTimeout(() => setPreviewActive(true), 800)
  }
  const handleMouseLeave = () => {
    setHovered(false)
    setPreviewActive(false)
    clearTimeout(hoverTimer.current)
  }

  const handleAvatarError = (e) => {
    e.currentTarget.style.display = 'none'
    const fb = e.currentTarget.nextSibling
    if (fb) fb.style.display = 'flex'
  }

  const openMenu = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const rect = btnRef.current?.getBoundingClientRect()
    if (rect) {
      setAnchorRect(rect)
      setMenuOpen(true)
    }
  }

  const closeMenu = useCallback(() => {
    setMenuOpen(false)
    setAnchorRect(null)
  }, [])

  // Scroll title on hover — only when title is wider than container
  useEffect(() => {
    const wrap  = wrapRef.current
    const title = titleRef.current
    if (!wrap || !title) return

    // Reset to baseline
    wrap.classList.remove('is-marquee')
    wrap.style.removeProperty('--marquee-shift')
    wrap.style.removeProperty('--marquee-dur')

    const timer = setTimeout(() => {
      // Measure natural text width by temporarily making it unrestricted
      const prevDisplay = title.style.display
      title.style.display = 'inline-block'
      title.style.whiteSpace = 'nowrap'
      title.style.overflow = 'visible'
      title.style.width = 'auto'

      const titleW = title.scrollWidth || title.offsetWidth
      const wrapW  = wrap.offsetWidth

      // Restore
      title.style.display = prevDisplay
      title.style.whiteSpace = ''
      title.style.overflow = ''
      title.style.width = ''
      title.style.animation = ''

      if (titleW <= wrapW + 2) return  // fits — no animation

      const overflow = titleW - wrapW
      wrap.style.setProperty('--marquee-shift', `-${overflow}px`)
      wrap.style.setProperty('--marquee-dur', `${Math.max(3, overflow / 55).toFixed(1)}s`)
      wrap.classList.add('is-marquee')
    }, 100)

    return () => clearTimeout(timer)
  }, [video.title])



  const channelInitial = (video.channel?.name || 'U')[0].toUpperCase()
  const dest = video.isShort ? `/shorts?id=${video._id}` : `/watch/${video._id}`

  // Card dismissed via Not Interested / Hide Channel
  if (dismissed) return null

  return (
    <>
      <motion.div
        className="video-card"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}
      >
        {/* THUMBNAIL */}
        <Link to={dest} className="video-thumb-wrap">
          <img
            src={video.thumbnail}
            alt={video.title}
            className={`video-thumb ${previewActive ? 'hidden' : ''}`}
          />
          {previewActive && (
            <motion.video
              className="video-preview"
              src={video.videoUrl || video.thumbnail}
              autoPlay muted loop playsInline
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}
          {video.duration > 0 && (
            <span className="video-duration">{formatDuration(video.duration)}</span>
          )}
          <motion.div
            className="video-thumb-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          />
        </Link>

        {/* INFO ROW */}
        <div className="video-info">
          <Link to={`/channel/${video.channel._id}`} className="video-avatar-wrap">
            {video.channel?.avatar
              ? <img src={video.channel.avatar} alt={video.channel.name}
                  className="video-channel-avatar" onError={handleAvatarError} />
              : null}
            <div
              className="video-channel-avatar video-channel-avatar-fb"
              style={{ display: video.channel?.avatar ? 'none' : 'flex' }}>
              {channelInitial}
            </div>
          </Link>

          <div className="video-meta">
            {/* Scroll title on hover when it overflows */}
            <div className="video-title-wrap" ref={wrapRef}>
              <Link ref={titleRef} to={dest} className="video-title">
                {video.title}
              </Link>
            </div>

            <div className="video-channel-row">
              <Link to={`/channel/${video.channel._id}`} className="video-channel-name">
                {video.channel.name}
              </Link>
              {video.channel.verified && <VerifiedIcon />}
            </div>
            <div className="video-stats-row">
              <p className="video-stats">
                {formatViews(displayViews)} views · {timeAgo(video.uploadedAt)}
              </p>
              {/* 3-dot menu — bottom-right of info */}
              <motion.button
                ref={btnRef}
                className="video-menu-btn"
                onMouseDown={openMenu}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <DotsIcon />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Portal-rendered dropdown — outside card DOM */}
      <AnimatePresence>
        {menuOpen && anchorRect && (
          <ContextMenu
            anchorRect={anchorRect}
            videoId={video._id}
            channelId={video.channel?._id}
            onClose={closeMenu}
            onDismiss={() => setDismissed(true)}
          />
        )}
      </AnimatePresence>

    </>
  )
}