// studio/src/components/StudioNav/StudioNav.jsx
import { useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { useStudioAuth } from '../../context/StudioAuthContext'
import './StudioNav.css'

const SearchIco = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
const BellIco   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
const HelpIco   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
const PlusIco   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const BackIco   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
const SunIco    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
const MoonIco   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>

const StudioMark = () => (
  <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="url(#asg)"/>
    <path d="M12 10l10 6-10 6V10z" fill="white"/>
    <defs>
      <linearGradient id="asg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop stopColor="#b5294e"/>
        <stop offset="1" stopColor="#6654a8"/>
      </linearGradient>
    </defs>
  </svg>
)

export default function StudioNav({ onCreateOpen }) {
  const [q, setQ] = useState('')
  const { toggle, isDark } = useTheme()
  const { user } = useStudioAuth()

  const initial = user?.displayName?.[0] || user?.username?.[0] || 'A'

  return (
    <header className="snav">
      <div className="snav-left">
        <a href="/" className="snav-logo">
          <StudioMark />
          <div className="snav-logo-words">
            <span className="snav-logo-aura">AURA</span>
            <span className="snav-logo-studio">Studio</span>
          </div>
        </a>
      </div>

      <div className="snav-center">
        <div className="snav-search">
          <span className="snav-search-ico"><SearchIco /></span>
          <input
            type="text"
            placeholder="Search across your channel..."
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="snav-right">
        {/* Create button — triggers the create modal */}
        <button className="snav-create-btn" onClick={onCreateOpen}>
          <PlusIco />
          <span>Create</span>
        </button>

        <button className="snav-icon-btn" aria-label="Notifications">
          <BellIco />
          <span className="snav-bell-dot" />
        </button>

        <button className="snav-icon-btn" aria-label="Help">
          <HelpIco />
        </button>

        <button className="snav-icon-btn snav-theme-btn" onClick={toggle} title={isDark ? 'Light mode' : 'Dark mode'}>
          {isDark ? <SunIco /> : <MoonIco />}
        </button>

        <div className="snav-avatar" title={user?.displayName || 'You'}>
          {user?.avatar
            ? <img src={user.avatar} alt={initial} className="snav-avatar-img" />
            : initial
          }
        </div>
      </div>
    </header>
  )
}