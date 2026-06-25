// FILE: client/src/components/NotificationDropdown/NotificationDropdown.jsx
// Real-time notifications via Socket.IO — panel rendered via portal to escape transform contexts
import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useStats }  from '../../context/StatsContext.jsx'
import { useSocket } from '../../context/SocketContext.jsx'
import { useNavigate } from 'react-router-dom'
import api           from '../../services/api'
import './NotificationDropdown.css'

// ── Icons ──────────────────────────────────────────────────────────
const BellIcon  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
const PlayIcon  = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
const DotIcon   = () => <svg width="7"  height="7"  viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
const LikeIcon  = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/><path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>
const StarIcon  = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
const SubIcon   = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
const CommentIco= () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
const GearIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
const CheckIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
const TrashIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>

const TYPE_META = {
  newVideo:     { icon: <PlayIcon />,   bg: '#b5294e' },
  live:         { icon: <DotIcon />,    bg: '#c0392b' },
  milestone:    { icon: <StarIcon />,   bg: '#b8882a' },
  like:         { icon: <LikeIcon />,   bg: '#6654a8' },
  subscription: { icon: <SubIcon />,    bg: '#3d9e8c' },
  comment:      { icon: <CommentIco/>,  bg: '#2d7dd2' },
  reply:        { icon: <CommentIco/>,  bg: '#5c4da8' },
  system:       { icon: <StarIcon />,   bg: '#555'    },
}

const timeAgo = d => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000)
  if (s < 60)    return 'just now'
  if (s < 3600)  return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  return `${Math.floor(s/86400)}d ago`
}

// ── Single row ────────────────────────────────────────────────────
function Row({ n, onRead, onRemove }) {
  const meta   = TYPE_META[n.type] || TYPE_META.system
  const sender = n.sender
  return (
    <div className={`nr${n.isRead ? '' : ' nr-new'}`} onClick={() => onRead(n._id)}>
      {!n.isRead && <span className="nr-unread-dot" />}
      <div className="nr-av-wrap">
        <div className="nr-av" style={{ background: sender?.avatar ? 'transparent' : meta.bg }}>
          {sender?.avatar
            ? <img src={sender.avatar} alt="" className="nr-av-img" />
            : <span>{sender?.displayName?.[0]?.toUpperCase() || '?'}</span>
          }
        </div>
        <span className="nr-type-badge" style={{ background: meta.bg }}>{meta.icon}</span>
      </div>
      <div className="nr-body">
        <p className="nr-title">{n.message || n.title}</p>
        <span className="nr-time">{timeAgo(n.createdAt)}</span>
      </div>
      <div className="nr-menu-wrap">
        <button className="nr-dots" title="Dismiss"
          onClick={e => { e.stopPropagation(); onRemove(n._id) }}>
          <TrashIcon />
        </button>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────
export default function NotificationDropdown() {
  const [open,    setOpen]    = useState(false)
  const [notifs,  setNotifs]  = useState([])
  const [loading, setLoading] = useState(false)
  const [tab,     setTab]     = useState('All')
  // Panel position — recalculated from bell button position
  const [panelPos, setPanelPos] = useState({ top: 62, right: 14 })

  const bellRef  = useRef(null)
  const panelRef = useRef(null)
  const { setNotifCount } = useStats()
  const { socket }        = useSocket()
  const navigate          = useNavigate()

  const unread = notifs.filter(n => !n.isRead).length

  useEffect(() => { setNotifCount(unread) }, [unread, setNotifCount])

  // Calculate panel position relative to bell button (viewport coords)
  const updatePanelPos = useCallback(() => {
    if (!bellRef.current) return
    const rect = bellRef.current.getBoundingClientRect()
    // Panel right edge aligns with bell right edge, top below bell
    setPanelPos({
      top:   rect.bottom + 8,
      right: window.innerWidth - rect.right,
    })
  }, [])

  const toggleOpen = useCallback(() => {
    updatePanelPos()
    setOpen(o => !o)
  }, [updatePanelPos])

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api.get('/notifications?limit=40')
      setNotifs(r.data.notifications || [])
    } catch {
      // silent — user not logged in
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) loadNotifications()
  }, [open, loadNotifications])

  // Real-time via Socket.IO
  useEffect(() => {
    if (!socket) return
    const handleNew = (notif) => {
      setNotifs(prev => [notif, ...prev.slice(0, 49)])
      setNotifCount(c => c + 1)
      if (Notification.permission === 'granted') {
        new Notification(notif.title || 'AURA', {
          body:  notif.message || '',
          icon:  notif.imageUrl || '/logo192.png',
          badge: '/logo192.png',
          tag:   notif._id,
        })
      }
    }
    socket.on('notification:new', handleNew)
    return () => socket.off('notification:new', handleNew)
  }, [socket, setNotifCount])

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      const t = setTimeout(() => Notification.requestPermission(), 4000)
      return () => clearTimeout(t)
    }
  }, [])

  // Close on outside click — works even with portal
  useEffect(() => {
    if (!open) return
    const fn = e => {
      if (!bellRef.current?.contains(e.target) && !panelRef.current?.contains(e.target))
        setOpen(false)
    }
    const t = setTimeout(() => document.addEventListener('mousedown', fn), 10)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', fn) }
  }, [open])

  // Reposition panel on scroll/resize
  useEffect(() => {
    if (!open) return
    const update = () => updatePanelPos()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open, updatePanelPos])

  const markRead = async (id) => {
    setNotifs(p => p.map(n => n._id === id ? { ...n, isRead: true } : n))
    api.patch(`/notifications/${id}/read`).catch(() => {})
  }
  const markAll = async () => {
    setNotifs(p => p.map(n => ({ ...n, isRead: true })))
    api.patch('/notifications/read-all').catch(() => {})
  }
  const remove = async (id) => {
    setNotifs(p => p.filter(n => n._id !== id))
    api.delete(`/notifications/${id}`).catch(() => {})
  }

  const list = tab === 'All' ? notifs : notifs.filter(n => !n.isRead)

  // The panel — rendered via portal so it always sits in document.body,
  // completely outside any Framer Motion transform context
  const panel = open ? createPortal(
    <div
      className="nd-panel"
      ref={panelRef}
      style={{ top: panelPos.top, right: panelPos.right }}
    >
      <div className="nd-top">
        <h3 className="nd-title">Notifications</h3>
        <div className="nd-top-right">
          {unread > 0 && (
            <button className="nd-markall" onClick={markAll}>
              <CheckIcon /> Mark all read
            </button>
          )}
          <button className="nd-gear" title="Notification settings"
            onClick={() => { setOpen(false); navigate('/settings#notifications') }}>
            <GearIcon />
          </button>
        </div>
      </div>

      <div className="nd-tabs">
        {['All', 'Unread'].map(t => (
          <button key={t} type="button"
            className={`nd-tab${tab === t ? ' nd-tab-active' : ''}`}
            onClick={() => setTab(t)}>
            {t}
            {t === 'Unread' && unread > 0 && <span className="nd-tab-badge">{unread}</span>}
          </button>
        ))}
      </div>

      <div className="nd-list">
        {loading ? (
          <div className="nd-loading">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="nd-skel-row">
                <div className="nd-skel nd-skel-av" />
                <div className="nd-skel-body">
                  <div className="nd-skel" style={{ width: '70%', height: 11 }} />
                  <div className="nd-skel" style={{ width: '40%', height: 9, marginTop: 6 }} />
                </div>
              </div>
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="nd-empty">
            <span className="nd-empty-emoji">🔔</span>
            <strong>You're all caught up!</strong>
            <span>No {tab === 'Unread' ? 'unread ' : ''}notifications.</span>
          </div>
        ) : list.map(n => (
          <Row key={n._id} n={n} onRead={markRead} onRemove={remove} />
        ))}
      </div>

      <div className="nd-footer">
        <button className="nd-view-all" onClick={() => setOpen(false)} type="button">
          View all notifications
        </button>
      </div>
    </div>,
    document.body
  ) : null

  return (
    <>
      <button
        ref={bellRef}
        className={`nd-bell${open ? ' nd-bell-on' : ''}${unread > 0 ? ' nd-bell-shake' : ''}`}
        onClick={toggleOpen}
        type="button"
      >
        <BellIcon />
        {unread > 0 && <span className="nd-count">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {panel}
    </>
  )
}