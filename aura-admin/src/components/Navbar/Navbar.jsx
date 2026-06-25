// src/components/Navbar/Navbar.jsx
import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import api from '../../services/api.js'
import './Navbar.css'

const BellIcon    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
const SearchIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
const RefreshIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>

const PAGE_TITLES = {
  '/admin':'/admin','/admin/users':'User Management','/admin/videos':'Video Management',
  '/admin/reports':'Reports & Moderation','/admin/comments':'Comment Moderation',
  '/admin/livestreams':'Live Streams','/admin/analytics':'Platform Analytics',
  '/admin/payments':'Payment Transactions','/admin/settings':'Admin Settings',
}
const LABELS = { '/admin':'Dashboard', ...PAGE_TITLES }

export default function AdminNavbar({ sidebarWidth }) {
  const location = useLocation()
  const [notifOpen, setNotif]   = useState(false)
  const [liveCount, setLive]    = useState(null)
  const [pending,   setPending] = useState(null)
  const [spin, setSpin]         = useState(false)
  const title = LABELS[location.pathname] || 'Admin'
  const now   = new Date().toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' })

  const loadStats = async () => {
    try {
      const [liveRes, repRes] = await Promise.all([
        api.get('/admin/livestreams', { params:{ status:'live', limit:1 } }),
        api.get('/admin/reports',    { params:{ status:'pending', limit:1 } }),
      ])
      setLive(liveRes.data.total    ?? 0)
      setPending(repRes.data.total  ?? 0)
    } catch {}
  }

  useEffect(() => { loadStats(); const iv = setInterval(loadStats, 30000); return () => clearInterval(iv) }, [])

  const refresh = () => { setSpin(true); loadStats(); setTimeout(() => setSpin(false), 700) }

  return (
    <header className="admin-navbar" style={{ left: sidebarWidth }}>
      <div className="navbar-left">
        <h1 className="navbar-title">{title}</h1>
        <span className="navbar-time">{now}</span>
      </div>
      <div className="navbar-right">
        <div className="admin-search" style={{ width:220 }}>
          <SearchIcon />
          <input placeholder="Search anything…" />
        </div>
        {liveCount > 0 && (
          <div className="live-chip"><span className="live-dot" /><span>{liveCount} Live</span></div>
        )}
        <button className="icon-btn" title="Refresh" onClick={refresh}>
          <span style={{ display:'inline-flex', transform:spin?'rotate(360deg)':'none', transition:spin?'transform 0.7s ease':'none' }}><RefreshIcon /></span>
        </button>
        <div className="notif-wrap">
          <button className="icon-btn notif-btn" onClick={() => setNotif(o=>!o)}>
            <BellIcon />
            {pending > 0 && <span className="notif-dot" />}
          </button>
          {notifOpen && (
            <div className="notif-drop">
              <div className="notif-drop-header">
                <span>Admin Alerts</span>
                <button className="notif-clear" onClick={() => setNotif(false)}>✕</button>
              </div>
              {pending > 0 && <div className="notif-item"><span className="notif-circle red"/><div><span className="notif-text">{pending} reports pending review</span><span className="notif-time">live</span></div></div>}
              {liveCount > 0 && <div className="notif-item"><span className="notif-circle teal"/><div><span className="notif-text">{liveCount} streams active now</span><span className="notif-time">live</span></div></div>}
              {!pending && !liveCount && <div style={{ padding:'12px 4px', fontSize:'0.82rem', color:'var(--t3)', textAlign:'center' }}>✓ All clear</div>}
            </div>
          )}
        </div>
        <div className="navbar-avatar">A</div>
      </div>
    </header>
  )
}
