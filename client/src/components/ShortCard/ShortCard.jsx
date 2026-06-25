// FILE: client/src/components/ShortCard/ShortCard.jsx
import { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { formatViews, formatDuration } from '../../utils/formatUtils.js'
import api from '../../services/api.js'
import './ShortCard.css'

// ── Icons ──
const PlayIcon       = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
const DotsIcon       = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
const WatchLaterIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
const PlaylistIcon   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
const ShareIcon      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
const NotIntIcon     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
const BlockIcon      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const ReportIcon     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
const CheckIcon      = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>

// ── Context Menu (same actions as VideoCard) ───────────────────────
function ShortContextMenu({ anchorRect, shortId, channelId, onClose, onDismiss }) {
  const menuRef = useRef(null)
  const [savedWL, setSavedWL] = useState(false)
  const [toast,   setToast]   = useState(null)

  const MENU_W = 230, MENU_H = 290
  let left = anchorRect.right - MENU_W
  let top  = anchorRect.bottom + 6
  if (left < 8)                          left = anchorRect.left
  if (top + MENU_H > window.innerHeight) top  = anchorRect.top - MENU_H - 6
  if (top < 8)                           top  = 8

  useEffect(() => {
    const onDown   = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) onClose() }
    const onScroll = () => onClose()
    document.addEventListener('mousedown', onDown, true)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('mousedown', onDown, true)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [onClose])

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2200) }

  const handleWatchLater = async (e) => {
    e.stopPropagation()
    try {
      const r = await api.post(`/interactions/${shortId}/watch-later`)
      setSavedWL(true)
      flash(r.data.watchLater ? 'Saved to Watch Later' : 'Removed from Watch Later')
      setTimeout(onClose, 1100)
    } catch { flash('Sign in to save'); setTimeout(onClose, 1200) }
  }

  const handleSaveToPlaylist = (e) => {
    e.stopPropagation()
    window.location.href = `/watch/${shortId}?save=1`
    onClose()
  }

  const handleShare = async (e) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/shorts?id=${shortId}`)
      api.post(`/interactions/${shortId}/share`).catch(() => {})
      flash('Link copied!')
    } catch { flash('Could not copy link') }
    setTimeout(onClose, 1000)
  }

  const handleNotInterested = async (e) => {
    e.stopPropagation()
    try {
      await api.post(`/interactions/${shortId}/not-interested`)
      flash('Got it — removed from feed')
      onDismiss?.()
      setTimeout(onClose, 900)
    } catch { flash('Sign in to customise feed'); setTimeout(onClose, 1200) }
  }

  const handleHideChannel = async (e) => {
    e.stopPropagation()
    if (!channelId) { flash('Channel info unavailable'); return }
    try {
      await api.post(`/interactions/channel/${channelId}/hide`)
      flash('Channel hidden from recommendations')
      onDismiss?.()
      setTimeout(onClose, 900)
    } catch { flash('Sign in to customise feed'); setTimeout(onClose, 1200) }
  }

  const handleReport = async (e) => {
    e.stopPropagation()
    try {
      await api.post(`/interactions/${shortId}/report`, { reason: 'other' })
      flash('Report submitted — thanks!')
    } catch { flash('Sign in to report') }
    setTimeout(onClose, 1200)
  }

  const ITEMS = [
    { label: savedWL ? 'Saved ✓' : 'Save to Watch Later', icon: <WatchLaterIcon />, action: handleWatchLater, check: savedWL },
    { label: 'Save to Playlist',        icon: <PlaylistIcon />, action: handleSaveToPlaylist },
    { label: 'Share',                   icon: <ShareIcon />,    action: handleShare },
    'divider',
    { label: 'Not Interested',          icon: <NotIntIcon />,   action: handleNotInterested },
    { label: "Don't Recommend Channel", icon: <BlockIcon />,    action: handleHideChannel },
    'divider',
    { label: 'Report',                  icon: <ReportIcon />,   action: handleReport, danger: true },
  ]

  return createPortal(
    <>
      <motion.div ref={menuRef}
        className="video-context-menu"
        style={{ position: 'fixed', top, left, width: MENU_W, zIndex: 99999 }}
        initial={{ opacity: 0, scale: 0.9, y: -6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -6 }}
        transition={{ duration: 0.15, ease: [0.34, 1.4, 0.64, 1] }}>
        {ITEMS.map((item, i) =>
          item === 'divider'
            ? <div key={`d${i}`} className="context-menu-divider" />
            : (
              <button key={item.label}
                className={`context-menu-item ${item.danger ? 'danger' : ''} ${item.check ? 'checked' : ''}`}
                onMouseDown={(e) => { e.stopPropagation(); item.action(e) }}>
                <span className="context-menu-icon">{item.icon}</span>
                <span className="context-menu-label">{item.label}</span>
                {item.check && <span className="context-menu-check"><CheckIcon /></span>}
              </button>
            )
        )}
      </motion.div>
      {toast && <div className="vc-toast">{toast}</div>}
    </>,
    document.body
  )
}

// ── ShortCard ──────────────────────────────────────────────────────
export default function ShortCard({ short }) {
  const [hovered,       setHovered]       = useState(false)
  const [previewActive, setPreviewActive] = useState(false)
  const [menuOpen,      setMenuOpen]      = useState(false)
  const [anchorRect,    setAnchorRect]    = useState(null)
  const [dismissed,     setDismissed]     = useState(false)
  const [thumbLandscape, setThumbLandscape] = useState(false)

  const hoverTimer = useRef(null)
  const btnRef     = useRef(null)
  const titleRef   = useRef(null)
  const wrapRef    = useRef(null)

  const onEnter = () => {
    setHovered(true)
    hoverTimer.current = setTimeout(() => setPreviewActive(true), 700)
  }
  const onLeave = () => {
    setHovered(false)
    setPreviewActive(false)
    clearTimeout(hoverTimer.current)
  }

  const closeMenu = useCallback(() => { setMenuOpen(false); setAnchorRect(null) }, [])
  const openMenu  = (e) => {
    e.preventDefault(); e.stopPropagation()
    const rect = btnRef.current?.getBoundingClientRect()
    if (rect) { setAnchorRect(rect); setMenuOpen(true) }
  }

  // Scroll title on hover — only when title is wider than container
  useEffect(() => {
    const wrap  = wrapRef.current
    const title = titleRef.current
    if (!wrap || !title) return

    // Reset to baseline before measuring
    wrap.classList.remove('sc-is-marquee')
    wrap.style.removeProperty('--sc-shift')
    wrap.style.removeProperty('--sc-dur')

    // Use a timeout so browser has finished layout
    const timer = setTimeout(() => {
      // Temporarily make title inline-block to get its natural width
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

      if (titleW <= wrapW + 2) return  // fits — no animation needed

      const overflow = titleW - wrapW
      wrap.style.setProperty('--sc-shift', `-${overflow}px`)
      wrap.style.setProperty('--sc-dur', `${Math.max(2.5, overflow / 55).toFixed(1)}s`)
      wrap.classList.add('sc-is-marquee')
    }, 100)

    return () => clearTimeout(timer)
  }, [short.title])

  const thumb  = short.thumbnailUrl || short.thumbnail || null
  const ch     = short.channel || {}
  const avatar = ch.avatar || null
  const views  = short.viewCount ?? short.views ?? 0
  const dur    = short.duration || 0

  if (dismissed) return null

  return (
    <>
      <motion.div className="sc-card"
        onMouseEnter={onEnter} onMouseLeave={onLeave}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}>

        {/* Thumbnail */}
        <Link to={`/shorts?id=${short._id}`} className="sc-thumb-wrap">
          {thumb
            ? <img src={thumb} alt={short.title}
                className={`sc-thumb ${previewActive ? 'hidden' : ''} ${thumbLandscape ? 'sc-thumb--landscape' : ''}`}
                onLoad={e => { const img = e.currentTarget; if (img.naturalWidth > img.naturalHeight) setThumbLandscape(true) }}
              />
            : <div className="sc-no-thumb"><span>No preview</span></div>}

          {previewActive && (
            <motion.video className="sc-preview" src={short.videoUrl}
              autoPlay muted loop playsInline
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} />
          )}

          <motion.div className="sc-play-overlay"
            animate={{ opacity: hovered && !previewActive ? 1 : 0 }}
            transition={{ duration: 0.18 }}>
            <PlayIcon />
          </motion.div>



          <motion.div className="sc-hover-border"
            animate={{ opacity: hovered ? 1 : 0 }} transition={{ duration: 0.18 }} />
        </Link>

        {/* Info below thumbnail */}
        <div className="sc-info">
          {avatar && (
            <Link to={`/channel/${ch._id}`} className="sc-avatar-link">
              <img src={avatar} alt={ch.name || ''} className="sc-avatar" />
            </Link>
          )}

          <div className="sc-meta">
            {/* Single-line scrolling title */}
            <div className="sc-title-wrap" ref={wrapRef}>
              <Link ref={titleRef} to={`/shorts?id=${short._id}`} className="sc-title">
                {short.title}
              </Link>
            </div>

            {/* Channel name + views + dots in one row */}
            <div className="sc-info-row">
              <div className="sc-info-left">
                <span className="sc-channel">{ch.name}</span>
                <span className="sc-views-text">{formatViews(views)} views</span>
              </div>
              <button ref={btnRef} className="sc-dots-btn" onMouseDown={openMenu}>
                <DotsIcon />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {menuOpen && anchorRect && (
          <ShortContextMenu
            anchorRect={anchorRect}
            shortId={short._id}
            channelId={ch._id}
            onClose={closeMenu}
            onDismiss={() => setDismissed(true)}
          />
        )}
      </AnimatePresence>
    </>
  )
}