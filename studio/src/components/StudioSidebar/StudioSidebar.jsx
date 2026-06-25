// studio/src/components/StudioSidebar/StudioSidebar.jsx
import { Link, useLocation } from 'react-router-dom'
import { useStudioAuth } from '../../context/StudioAuthContext'
import './StudioSidebar.css'

/* ─── Icons ─── */
const DashIco     = () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
const ContentIco  = () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="m10 8 6 4-6 4V8z"/><path d="M8 21h8M12 17v4"/></svg>
const AnalytIco   = () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>
const CommentIco  = () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
const SubtitleIco = () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="6" y1="16" x2="12" y2="16"/></svg>
const EarnIco     = () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
const CustomIco   = () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
const AudioIco    = () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
const ShieldIco   = () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
const SettingsIco = () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
const FeedbackIco = () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
const HelpIco     = () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
const PrivacyIco  = () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
const TermsIco    = () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
const LiveIco     = () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 010 8.49M7.76 16.24a6 6 0 010-8.49M19.07 4.93a10 10 0 010 14.14M4.93 19.07a10 10 0 010-14.14"/></svg>
const ExternalIco = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>

/* ─── Nav structure ─── */
const SECTIONS = [
  {
    label: null,
    items: [
      { label: 'Dashboard',  path: '/',          icon: <DashIco /> },
      { label: 'Content',    path: '/content',   icon: <ContentIco /> },
      { label: 'Analytics',  path: '/analytics', icon: <AnalytIco /> },
      { label: 'Comments',   path: '/comments',  icon: <CommentIco /> },
    ],
  },
  {
    label: 'Create & Manage',
    items: [
      { label: 'Subtitles',      path: '/subtitles',    icon: <SubtitleIco /> },
      { label: 'Earn',           path: '/monetization', icon: <EarnIco />,  badge: 'NEW', badgeType: 'new', special: 'earn' },
      { label: 'Customization',  path: '/customization',icon: <CustomIco /> },
      { label: 'Audio Library',  path: '/audio',        icon: <AudioIco /> },
      { label: 'Live Streams',   path: '/live-streams',  icon: <LiveIco />, badge: 'LIVE', badgeType: 'live' },
    ],
  },
  {
    label: 'Legal & Settings',
    items: [
      { label: 'Content Detection', path: '/copyright', icon: <ShieldIco /> },
      { label: 'Settings',          path: '/settings',  icon: <SettingsIco /> },
      { label: 'Send Feedback',     path: '/feedback',  icon: <FeedbackIco /> },
    ],
  },
]

/* ─── Single nav item ─── */
function NavItem({ item }) {
  const { pathname } = useLocation()
  const isActive = pathname === item.path ||
    (item.path !== '/' && pathname.startsWith(item.path))

  return (
    <Link
      to={item.path}
      className={`sside-item${isActive ? ' sside-item-active' : ''} ${item.special ? `sside-item-${item.special}` : ''}`}
    >
      <span className="sside-item-icon">{item.icon}</span>
      <span className="sside-item-label">{item.label}</span>
      {item.badge && (
        <span className={`sside-badge sside-badge-${item.badgeType}`}>
          {item.badge}
        </span>
      )}
    </Link>
  )
}

/* ─── Main sidebar ─── */
export default function StudioSidebar({ open = true }) {
  const { user, logout } = useStudioAuth()
  const initial = user?.displayName?.[0] || user?.username?.[0] || 'A'

  const fmtNum = n => {
    if (!n) return '0'
    if (n >= 1000000) return `${(n/1000000).toFixed(1)}M`
    if (n >= 1000)    return `${(n/1000).toFixed(1)}K`
    return String(n)
  }

  return (
    <aside className={`sside${open ? '' : ' sside-hidden'}`}>

      {/* ── Channel card ── */}
      <div className="sside-channel">
        <div className="sside-ch-av-wrap">
          <div className="sside-ch-av">
            {user?.avatar
              ? <img src={user.avatar} alt={initial} className="sside-ch-av-img" />
              : initial
            }
          </div>
          <div className="sside-ch-status" />
        </div>
        <div className="sside-ch-name">{user?.displayName || user?.username || 'Your Channel'}</div>
        <div className="sside-ch-handle">@{user?.handle || user?.username || 'yourchannel'}</div>

        <div className="sside-ch-stats">
          <div className="sside-ch-stat">
            <span className="sside-ch-stat-val">{fmtNum(user?.subscriberCount)}</span>
            <span className="sside-ch-stat-lbl">Subscribers</span>
          </div>
          <div className="sside-ch-stat-divider" />
          <div className="sside-ch-stat">
            <span className="sside-ch-stat-val">{fmtNum(user?.videoCount)}</span>
            <span className="sside-ch-stat-lbl">Videos</span>
          </div>
          <div className="sside-ch-stat-divider" />
          <div className="sside-ch-stat">
            <span className="sside-ch-stat-val">{fmtNum(user?.totalViews)}</span>
            <span className="sside-ch-stat-lbl">Views</span>
          </div>
        </div>

        <a
          href={`http://localhost:5173/channel/${user?._id}`}
          className="sside-ch-view-btn"
          target="_blank"
          rel="noopener noreferrer"
        >
          View on AURA <ExternalIco />
        </a>
      </div>

      {/* ── Nav sections ── */}
      <div className="sside-nav">
        {SECTIONS.map((section, si) => (
          <div key={si} className="sside-section">
            <div className="sside-divider" />
            {section.label && (
              <div className="sside-section-label">{section.label}</div>
            )}
            {section.items.map(item => (
              <NavItem key={item.path} item={item} />
            ))}
          </div>
        ))}
      </div>

      {/* ── Footer ── */}
      <div className="sside-footer">
        <div className="sside-divider" />
        <a href="http://localhost:5173" className="sside-back-aura-btn">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Back to AURA
        </a>
        <button className="sside-logout-btn" onClick={logout}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Sign out
        </button>
        <div className="sside-footer-links">
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/help">Help</Link>
        </div>
        <p className="sside-footer-copy">© 2026 AURA Studio</p>
      </div>

    </aside>
  )
}