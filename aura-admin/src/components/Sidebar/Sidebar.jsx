// src/components/Sidebar/Sidebar.jsx
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext.jsx'
import api from '../../services/api.js'
import './Sidebar.css'

const DashIcon      = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
const UsersIcon     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
const VideoIcon     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>
const ReportIcon    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
const AnalyticsIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
const CommentIcon   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
const LiveIcon      = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 010 8.49"/><path d="M7.76 7.76a6 6 0 000 8.49"/><path d="M20.07 4.93a10 10 0 010 14.14"/><path d="M3.93 4.93a10 10 0 000 14.14"/></svg>
const PaymentIcon   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
const SettingsIcon  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
const ChevronIcon   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
const BackIcon      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
const LogoutIcon    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
const EarlyIcon     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>

export default function AdminSidebar({ collapsed, onToggle }) {
  const location = useLocation()
  const navigate  = useNavigate()
  const { user, logout } = useAuth()

  const [pendingReports, setPending] = useState(null)
  const [liveCount,      setLive]    = useState(null)
  const [logoutConfirm,  setLCon]    = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [repRes, liveRes] = await Promise.all([
          api.get('/admin/reports',     { params:{ status:'pending', limit:1 } }),
          api.get('/admin/livestreams', { params:{ status:'live',    limit:1 } }),
        ])
        setPending(repRes.data?.total  ?? 0)
        setLive(liveRes.data?.total    ?? 0)
      } catch {}
    }
    load()
    const iv = setInterval(load, 30000)
    return () => clearInterval(iv)
  }, [])

  const handleLogout = async () => {
    if (!logoutConfirm) { setLCon(true); setTimeout(() => setLCon(false), 3000); return }
    await logout()
    navigate('/admin/login')
  }

  const NAV = [
    { path:'/admin',               label:'Dashboard',     icon:<DashIcon />,      exact:true },
    { path:'/admin/users',         label:'Users',         icon:<UsersIcon /> },
    { path:'/admin/videos',        label:'Videos',        icon:<VideoIcon /> },
    { path:'/admin/reports',       label:'Reports',       icon:<ReportIcon />,    badge: pendingReports, badgeColor:'red' },
    { path:'/admin/comments',      label:'Comments',      icon:<CommentIcon /> },
    { path:'/admin/livestreams',   label:'Live Streams',  icon:<LiveIcon />,      badge: liveCount, badgeColor:'live' },
    { path:'/admin/analytics',     label:'Analytics',     icon:<AnalyticsIcon /> },
    { path:'/admin/payments',      label:'Payments',      icon:<PaymentIcon /> },
    { path:'/admin/early-access',  label:'Coming Soon',   icon:<EarlyIcon /> },
    { path:'/admin/settings',      label:'Settings',      icon:<SettingsIcon /> },
  ]

  const isActive = (path, exact) => {
    if (exact) return location.pathname === path
    return location.pathname.startsWith(path) && path !== '/admin'
  }

  return (
    <motion.aside
      className="admin-sidebar"
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration:0.3, ease:[0.4,0,0.2,1] }}
    >
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="var(--a)" strokeWidth="2"/>
            <path d="M12 6 L16 12 L12 18 L8 12 Z" fill="var(--a)" opacity="0.8"/>
          </svg>
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div className="logo-text"
              initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }}
              exit={{ opacity:0, x:-10 }} transition={{ duration:0.2 }}>
              <span className="logo-name">AURA</span>
              <span className="logo-sub">Admin</span>
            </motion.div>
          )}
        </AnimatePresence>
        <button className="sidebar-toggle-btn" onClick={onToggle}>
          {collapsed ? <ChevronIcon /> : <BackIcon />}
        </button>
      </div>

      {/* Back to main client */}
      <div className="sidebar-back-wrap">
        <a href="http://localhost:5173" className={`sidebar-back ${collapsed?'collapsed':''}`} title="Back to AURA">
          <BackIcon />
          {!collapsed && <span>Back to AURA</span>}
        </a>
      </div>

      {!collapsed && <div className="sidebar-nav-label">Navigation</div>}

      {/* Nav items */}
      <nav className="sidebar-nav">
        {NAV.map(item => {
          const active = isActive(item.path, item.exact)
          const showBadge = item.badge != null && item.badge > 0
          return (
            <Link key={item.path} to={item.path}
              className={`sidebar-nav-item ${active?'active':''} ${collapsed?'collapsed':''}`}
              title={collapsed ? item.label : ''}>
              <span className="nav-icon">{item.icon}</span>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span className="nav-label"
                    initial={{ opacity:0 }} animate={{ opacity:1 }}
                    exit={{ opacity:0 }} transition={{ duration:0.15 }}>
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {showBadge && !collapsed && (
                <span className={`nav-badge ${item.badgeColor}`}>{item.badge}</span>
              )}
              {showBadge && collapsed && <span className="nav-badge-dot" />}
            </Link>
          )
        })}
      </nav>

      {/* Admin user chip + logout */}
      {!collapsed ? (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ padding:'var(--sp-sm) var(--sp-md)', borderTop:'1px solid var(--s2)', marginTop:'auto' }}>
          {/* User info row */}
          <div className="sidebar-user" style={{ marginBottom:8 }}>
            <div className="user-avatar" style={{ background:'var(--a-dim)', color:'var(--a)', border:'1px solid var(--a-border)' }}>
              {user?.avatar ? <img src={user.avatar} alt={user.username} /> : user?.username?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.displayName || user?.username || 'Admin'}</span>
              <span className="sidebar-user-role">{user?.role || 'admin'}</span>
            </div>
            <div className="sidebar-user-dot live-pulse" />
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            style={{
              display:'flex', alignItems:'center', gap:8, width:'100%',
              padding:'8px 10px', borderRadius:'var(--r-sm)',
              background: logoutConfirm ? 'rgba(166,60,60,0.18)' : 'transparent',
              border: `1px solid ${logoutConfirm ? 'rgba(166,60,60,0.4)' : 'var(--s3)'}`,
              color: logoutConfirm ? '#f87171' : 'var(--t2)',
              fontSize:'0.78rem', fontWeight:600, cursor:'pointer',
              transition:'all 0.2s',
            }}
            onMouseEnter={e => { if (!logoutConfirm) { e.currentTarget.style.background='var(--s2)'; e.currentTarget.style.color='var(--t1)' } }}
            onMouseLeave={e => { if (!logoutConfirm) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--t2)' } }}
          >
            <LogoutIcon />
            {logoutConfirm ? 'Click again to confirm' : 'Sign Out'}
          </button>
        </motion.div>
      ) : (
        /* Collapsed — just show logout icon */
        <div style={{ padding:'var(--sp-sm)', marginTop:'auto', borderTop:'1px solid var(--s2)' }}>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="icon-btn"
            style={{ width:'100%', justifyContent:'center', color: logoutConfirm ? '#f87171' : 'var(--t3)' }}
          >
            <LogoutIcon />
          </button>
        </div>
      )}
    </motion.aside>
  )
}