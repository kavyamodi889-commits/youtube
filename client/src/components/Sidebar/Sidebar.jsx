// FILE: client/src/components/Sidebar/Sidebar.jsx
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { slideFromLeft } from '../../utils/animationUtils.js'
import { useFocus } from '../../context/FocusContext.jsx'
import './Sidebar.css'

const HomeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)
const ShortsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
)
const SubscriptionsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </svg>
)
const HistoryIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="12 8 12 12 14 14"/><path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5"/>
  </svg>
)
const PlaylistIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
)
const WatchLaterIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const LikeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
)
const DownloadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)
const PremiumIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)
const StudioIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 10 4.553-2.069A1 1 0 0 1 21 8.82v6.36a1 1 0 0 1-1.447.89L15 14"/><rect x="1" y="6" width="15" height="12" rx="2"/>
  </svg>
)
const MusicIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
  </svg>
)
const AdsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2"/>
    <path d="M8 15V9l4 3 4-3v6"/>
    <line x1="2" y1="10" x2="22" y2="10"/>
  </svg>
)
const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)
const TrendingIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
)
const ReportIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
  </svg>
)
const HelpIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const FeedbackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)


// Collapsed — only these 4 show
const NAV_COLLAPSED = [
  { label: 'Home',      path: '/',         icon: <HomeIcon /> },
  { label: 'Shorts',    path: '/shorts',   icon: <ShortsIcon /> },
  { label: 'Downloads', path: '/downloads',icon: <DownloadIcon /> },
]

const NAV_MAIN = [
  { label: 'Home',          path: '/',              icon: <HomeIcon /> },
  { label: 'Shorts',        path: '/shorts',        icon: <ShortsIcon /> },
  { label: 'Subscriptions', path: '/subscriptions', icon: <SubscriptionsIcon /> },
  { label: 'Trending',      path: '/trending',      icon: <TrendingIcon /> },
]

const NAV_YOU = [
  { label: 'History',       path: '/history',      icon: <HistoryIcon /> },
  { label: 'Playlists',     path: '/playlists',    icon: <PlaylistIcon /> },
  { label: 'Watch Later',   path: '/watch-later',  icon: <WatchLaterIcon /> },
  { label: 'Liked Videos',  path: '/liked',        icon: <LikeIcon /> },
  { label: 'Downloads',     path: '/downloads',    icon: <DownloadIcon /> },
]

const NAV_AURA = [
  { label: 'Aura Premium',     path: '/premium',     icon: <PremiumIcon />, special: 'premium' },
  { label: 'Aura Studio',      path: 'http://localhost:5174/',      icon: <StudioIcon /> },
  { label: 'Aura Music',       path: 'http://localhost:5175/',       icon: <MusicIcon /> },
  { label: 'Aura Ads',         path: 'http://localhost:5176/',         icon: <AdsIcon />,     special: 'ads' },
]

const NAV_MORE = [
  { label: 'Settings',      path: '/settings',         icon: <SettingsIcon /> },
  { label: 'Report History', path: '/report-history',  icon: <ReportIcon /> },
  { label: 'Help',          path: '/help',             icon: <HelpIcon /> },
  { label: 'Send Feedback', path: '/send-feedback',    icon: <FeedbackIcon /> },
]

const FOOTER_LINKS = [
  { label: 'About',            path: '/about' },
  { label: 'Press',            path: '/press' },
  { label: 'Copyright',        path: '/copyright' },
  { label: 'Contact us',       path: '/contact' },
  { label: 'Creators',         path: '/creators' },
  { label: 'Advertise',        path: '/advertise' },
  { label: 'Developers',       path: '/developers' },
  { label: 'Terms',            path: '/terms' },
  { label: 'Privacy',          path: '/privacy' },
  { label: 'Policy & Safety',  path: '/policy-safety' },
  { label: 'How AURA works',   path: '/how-aura-works' },
  { label: 'Test new features',path: '/test-new-features' },
]

function NavItem({ item, collapsed }) {
  const location = useLocation()
  const isExternal = item.path.startsWith('http')
  const isActive = !isExternal && (
    location.pathname === item.path ||
    (item.path !== '/' && location.pathname.startsWith(item.path))
  )

  const className = `sidebar-nav-item ${isActive ? 'active' : ''} ${item.special === 'premium' ? 'premium' : ''} ${item.special === 'ads' ? 'ads' : ''}`

  const inner = (
    <>
      <span className="nav-icon">{item.icon}</span>
      {!collapsed && <span className="nav-label">{item.label}</span>}
      {collapsed && <span className="nav-label-small">{item.label}</span>}
      {!collapsed && item.badge && (
        <span className={`nav-badge ${item.badge === 'LIVE' ? 'live' : ''}`}>
          {item.badge}
        </span>
      )}
    </>
  )

  return (
    <motion.div
      whileHover={{ scale: collapsed ? 1.05 : 1, x: collapsed ? 0 : 3 }}
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.16, ease: [0.34, 1.56, 0.64, 1] }}
    >
      {isExternal
        ? <a href={item.path} target="_blank" rel="noopener noreferrer" className={className} title={item.label}>{inner}</a>
        : <Link to={item.path} className={className} title={item.label}>{inner}</Link>
      }
    </motion.div>
  )
}
function SectionLabel({ label, collapsed }) {
  if (collapsed) return null
  return <p className="sidebar-section-label">{label}</p>
}

export default function Sidebar({ collapsed, sidebarTop = 102 }) {
  const { active: focusActive } = useFocus()

  const filterFocus = (items) => focusActive
    ? items.filter(item => item.path !== '/shorts')
    : items

  const navItems = filterFocus(collapsed ? NAV_COLLAPSED : NAV_MAIN)

  return (
    <motion.aside
      className={`aura-sidebar ${collapsed ? 'collapsed' : ''}`}
      style={{ top: sidebarTop }}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="sidebar-inner">

        {/* MAIN NAV */}
        <nav className="sidebar-section">
          {navItems.map((item, i) => (
            <motion.div
              key={item.path}
              variants={slideFromLeft}
              initial="hidden"
              animate="visible"
              transition={{ delay: i * 0.04 }}
            >
              <NavItem item={item} collapsed={collapsed} />
            </motion.div>
          ))}
        </nav>

        {/* Everything below only shows when expanded */}
        {!collapsed && (
          <>
            {/* YOU SECTION */}
            <div className="sidebar-divider" />
            <SectionLabel label="You" collapsed={collapsed} />
            <nav className="sidebar-section">
              {filterFocus(NAV_YOU).map((item, i) => (
                <motion.div
                  key={item.path}
                  variants={slideFromLeft}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.2 + i * 0.04 }}
                >
                  <NavItem item={item} collapsed={collapsed} />
                </motion.div>
              ))}
            </nav>

            {/* MORE OF AURA */}
            <div className="sidebar-divider" />
            <SectionLabel label="More of AURA" collapsed={collapsed} />
            <nav className="sidebar-section">
              {NAV_AURA.map((item, i) => (
                <motion.div
                  key={item.path}
                  variants={slideFromLeft}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: i * 0.04 }}
                >
                  <NavItem item={item} collapsed={collapsed} />
                </motion.div>
              ))}
            </nav>

            {/* SETTINGS & MORE */}
            <div className="sidebar-divider" />
            <nav className="sidebar-section">
              {NAV_MORE.map((item, i) => (
                <motion.div
                  key={item.path}
                  variants={slideFromLeft}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: i * 0.04 }}
                >
                  <NavItem item={item} collapsed={collapsed} />
                </motion.div>
              ))}
            </nav>

            {/* Footer links */}
            <div className="sidebar-footer-links">
              {FOOTER_LINKS.map(link => (
                <Link key={link.path} to={link.path} className="sidebar-footer-link">
                  {link.label}
                </Link>
              ))}
            </div>

            <p className="sidebar-copyright">© 2026 AURA</p>
          </>
        )}

      </div>
    </motion.aside>
  )
}