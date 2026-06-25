// FILE: client/src/components/Navbar/Navbar.jsx
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { dropdownVariant } from '../../utils/animationUtils.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTheme } from '../../context/ThemeContext.jsx'
import { useEyeProtection } from '../../context/EyeProtectionContext.jsx'
import { useFocus } from '../../context/FocusContext.jsx'
import './Navbar.css'
import CreateMenu from '../CreateMenu/CreateMenu.jsx'
import NotificationDropdown from '../NotificationDropdown/NotificationDropdown'
import { useRecommendedChips } from '../../hooks/useRecommendedChips.js'

// Chips are now dynamic — driven by useRecommendedChips hook below

const SunIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
)
const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
)
const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
)
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
)
const MicIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
)
const FocusNavIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
)
const ChevronDown = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  return `${m}:${String(s).padStart(2,'0')}`
}

export default function Navbar({ onMenuClick, sidebarCollapsed }) {
  const [query,       setQuery]       = useState('')
  const [focused,     setFocused]     = useState(false)
  const [scrolled,    setScrolled]    = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [avatarError, setAvatarError] = useState(false)

  const [voiceModal,  setVoiceModal]  = useState(false)
  const [voiceStatus, setVoiceStatus] = useState('idle')
  const [voiceText,   setVoiceText]   = useState('')
  const recognitionRef = useRef(null)

  const { isDark, toggle: toggleTheme } = useTheme()
  const navigate   = useNavigate()
  const location   = useLocation()
  const profileRef = useRef(null)

  const { user, logout }         = useAuth()
  const { testBlink, testBreak } = useEyeProtection()
  const isDev = import.meta.env.DEV

  const { active: focusActive, remaining, progressPct, blockedCategories } = useFocus()

  const [searchParams, setSearchParams] = useSearchParams()
  const activeChip = searchParams.get('category') || 'All'
  const isHome     = location.pathname === '/'

  // Dynamic chips from recommendation engine + signup interests
  const allChips = useRecommendedChips(user?._id, user?.interests || [])

  // Focus mode: strip user-blocked categories from the chip bar
  const visibleChips = focusActive
    ? allChips.filter(chip => {
        if (chip === 'All') return true
        if (blockedCategories.includes(chip)) return false
        return true
      })
    : allChips

  const sidebarWidth = sidebarCollapsed ? 72 : 240
  const displayName  = user?.displayName || user?.username || 'U'
  const initial      = displayName.charAt(0).toUpperCase()

  // Pill ring colour escalates as session progresses
  const pillColor = progressPct >= 90 ? 'var(--err)' : progressPct >= 75 ? 'var(--a)' : 'var(--b)'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handler = e => {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // If currently-selected chip gets hidden by focus mode, reset to All
  useEffect(() => {
    if (focusActive && activeChip !== 'All' && !visibleChips.includes(activeChip)) {
      setSearchParams({})
    }
  }, [focusActive, blockedCategories]) // eslint-disable-line

  const selectChip = chip => {
    if (chip === 'All') setSearchParams({})
    else setSearchParams({ category: chip })
  }

  const handleSearch = e => {
    e.preventDefault()
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}&mode=text`)
  }

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { setVoiceStatus('error'); setVoiceText('Voice search not supported in this browser'); return }
    const rec = new SR()
    rec.lang = 'en-IN'; rec.continuous = false; rec.interimResults = true
    recognitionRef.current = rec
    setVoiceStatus('listening'); setVoiceText('')
    rec.onresult = e => {
      const t = Array.from(e.results).map(r => r[0].transcript).join('')
      setVoiceText(t)
      if (e.results[e.results.length - 1].isFinal) {
        setVoiceStatus('done')
        rec.stop()
        setTimeout(() => {
          setVoiceModal(false); setVoiceStatus('idle'); setVoiceText('')
          navigate(`/search?q=${encodeURIComponent(t.trim())}&mode=voice`)
        }, 800)
      }
    }
    rec.onerror = () => { setVoiceStatus('error'); setVoiceText('Could not understand. Try again.') }
    rec.onend   = () => {}
    rec.start()
  }
  const stopVoice = () => { recognitionRef.current?.stop(); setVoiceStatus('idle') }

  return (
    <div className={`aura-navbar-wrapper ${scrolled ? 'scrolled' : ''}`}>

      <motion.nav
        className="aura-navbar"
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
      >
        {/* ── LEFT ── */}
        <div className="navbar-left">
          <motion.button
            className="navbar-icon-btn"
            onClick={onMenuClick}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Toggle sidebar"
          >
            <MenuIcon />
          </motion.button>
          <Link to="/" className="navbar-logo">
            <motion.span className="logo-text" whileHover={{ scale: 1.04 }} transition={{ duration: 0.2 }}>
              AURA
            </motion.span>
          </Link>
          {isDev && (
            <div className="navbar-dev-tests" title="Dev: test eye protection popups">
              <button className="navbar-dev-btn" onClick={testBlink} title="Preview blink card">👁</button>
              <button className="navbar-dev-btn" onClick={testBreak} title="Preview break modal">🚶</button>
            </div>
          )}
        </div>

        {/* ── CENTER ── */}
        <div className="navbar-center">
          <form className={`search-form ${focused ? 'focused' : ''}`} onSubmit={handleSearch}>
            <div className="search-input-wrap">
              <span className="search-icon-left"><SearchIcon /></span>
              <input
                type="text"
                className="search-input"
                placeholder="Search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />
              <AnimatePresence>
                {query && (
                  <motion.button type="button" className="search-clear" onClick={() => setQuery('')}
                    initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}>
                    ✕
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
            <motion.button type="submit" className="search-submit-btn" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} title="Search">
              <SearchIcon />
            </motion.button>
          </form>

          <div className="search-modes">
            <motion.button
              className="search-mode-btn"
              title="Voice search"
              onClick={() => {
                setVoiceModal(true)
                setVoiceStatus('idle')
                setVoiceText('')
                setTimeout(() => startVoice(), 100)
              }}
              whileHover={{ scale: 1.12, backgroundColor: 'var(--a-dim)' }}
              whileTap={{ scale: 0.9 }}
            >
              <MicIcon />
            </motion.button>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="navbar-right">

          {/* ── FOCUS TIMER PILL — visible only when session is active ── */}
          <AnimatePresence>
            {focusActive && (
              <motion.button
                className="navbar-focus-timer-pill"
                onClick={() => navigate('/focus-wall')}
                title="Focus session active — click to open focus wall"
                initial={{ opacity: 0, scale: 0.75, maxWidth: 0, marginRight: 0 }}
                animate={{ opacity: 1, scale: 1, maxWidth: 160, marginRight: 4 }}
                exit={{ opacity: 0, scale: 0.75, maxWidth: 0, marginRight: 0 }}
                transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                style={{ '--pill-clr': pillColor }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" className="focus-pill-ring-svg">
                  <circle cx="10" cy="10" r="7.5" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2.2"/>
                  <circle
                    cx="10" cy="10" r="7.5"
                    fill="none"
                    stroke={pillColor}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 7.5}`}
                    strokeDashoffset={`${2 * Math.PI * 7.5 * (1 - progressPct / 100)}`}
                    transform="rotate(-90 10 10)"
                    style={{
                      transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease',
                      filter: `drop-shadow(0 0 3px ${pillColor})`
                    }}
                  />
                </svg>
                <span className="focus-pill-time">{formatTime(remaining)}</span>
                <span className="focus-pill-dot" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* ── FOCUS ICON — only when no session active ── */}
          {!focusActive && (
            <motion.button
              className="navbar-focus-btn"
              onClick={() => navigate('/focus')}
              title="Start Focus Mode"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
            >
              <FocusNavIcon />
            </motion.button>
          )}

          {/* ── THEME TOGGLE — always after focus ── */}
          <motion.button
            className={`navbar-theme-btn ${isDark ? 'is-dark' : 'is-light'}`}
            onClick={toggleTheme}
            title={isDark ? 'Light mode' : 'Dark mode'}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
          >
            <motion.span
              key={isDark ? 'sun' : 'moon'}
              initial={{ rotate: -30, opacity: 0, scale: 0.7 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', alignItems: 'center' }}
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </motion.span>
          </motion.button>

          <CreateMenu />

          <motion.div className="navbar-notif-wrap" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <NotificationDropdown />
          </motion.div>

          {user ? (
            <div className="navbar-profile" ref={profileRef}>
              <motion.button
                className="profile-trigger"
                onClick={() => setProfileOpen(p => !p)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {user.avatar && !avatarError
                  ? <img src={user.avatar} alt={displayName} className="trigger-avatar" onError={() => setAvatarError(true)} />
                  : <div className="trigger-avatar trigger-avatar-initial">{initial}</div>
                }
                <span className="trigger-name">{displayName.split(' ')[0]}</span>
                <ChevronDown />
              </motion.button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    className="profile-dropdown"
                    variants={dropdownVariant}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <div className="dd-header">
                      {user.avatar && !avatarError
                        ? <img src={user.avatar} alt={displayName} className="dd-avatar" onError={() => setAvatarError(true)} />
                        : <div className="dd-avatar dd-avatar-initial">{initial}</div>
                      }
                      <div className="dd-info">
                        <p className="dd-name">{displayName}</p>
                        <p className="dd-handle">{user.handle ? `@${user.handle}` : user.email}</p>
                      </div>
                    </div>

                    <div className="dropdown-divider" />

                    <Link to="http://localhost:5174/"  className="dropdown-item" onClick={() => setProfileOpen(false)}><span className="dropdown-item-icon">🎬</span> Creator Studio</Link>
                    <Link to={`/channel/${user._id}`} className="dropdown-item" onClick={() => setProfileOpen(false)}><span className="dropdown-item-icon">👤</span> Your Channel</Link>
                    <Link to="/wellbeing" className="dropdown-item" onClick={() => setProfileOpen(false)}>
                      <span className="dropdown-item-icon">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                        </svg>
                      </span> Digital Wellbeing
                    </Link>
                    <Link to="/premium"  className="dropdown-item dropdown-premium" onClick={() => setProfileOpen(false)}><span className="dropdown-item-icon">⭐</span> AURA Premium</Link>
                    <Link to="/settings" className="dropdown-item" onClick={() => setProfileOpen(false)}><span className="dropdown-item-icon">⚙️</span> Settings</Link>

                    <div className="dropdown-divider" />

                    <button className="dropdown-item dropdown-signout" onClick={() => { logout(); setProfileOpen(false) }}>
                      <span className="dropdown-item-icon">🚪</span> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <motion.button
              className="navbar-signin-btn"
              onClick={() => navigate('/auth')}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              Sign In
            </motion.button>
          )}
        </div>
      </motion.nav>

      {/* ── Category chips — home page only ── */}
      {isHome && (
        <div className="navbar-chips-bar" style={{ paddingLeft: `${sidebarWidth + 16}px` }}>
          <div className="chips-scroll">
            {visibleChips.map(chip => (
              <motion.button
                key={chip}
                className={`category-chip ${activeChip === chip ? 'active' : ''}`}
                onClick={() => selectChip(chip)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {chip}
              </motion.button>
            ))}
            {focusActive && (
              <span className="focus-chips-badge">🎯 Focus active</span>
            )}
          </div>
        </div>
      )}

      {/* ══ VOICE SEARCH MODAL ══ */}
      {createPortal(
        <AnimatePresence>
          {voiceModal && (
            <motion.div className="srch-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { stopVoice(); setVoiceModal(false) }}>
              <motion.div className="srch-modal"
                initial={{ scale: 0.88, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.88, y: 24 }}
                transition={{ type: 'spring', stiffness: 340, damping: 26 }}
                onClick={e => e.stopPropagation()}>

                <div className={`srch-anim-circle ${
                  voiceStatus === 'listening' ? 'srch-anim-red'   :
                  voiceStatus === 'done'      ? 'srch-anim-green' :
                  voiceStatus === 'error'     ? 'srch-anim-error' : ''}`}>
                  <span className="srch-anim-ring"/>
                  <span className="srch-anim-ring srch-ring-2"/>
                  <div className="srch-anim-icon"><MicIcon /></div>
                </div>

                <h3 className="srch-title">
                  {voiceStatus === 'listening' ? 'Listening…'
                 : voiceStatus === 'done'      ? 'Got it!'
                 : voiceStatus === 'error'     ? "Couldn't hear you"
                 :                              'Starting…'}
                </h3>

                {voiceText && <p className="srch-transcript">"{voiceText}"</p>}

                {voiceStatus === 'error' && (
                  <button className="srch-search-btn srch-search-btn-ghost"
                    onClick={() => { stopVoice(); setVoiceModal(false) }}>
                    Dismiss
                  </button>
                )}

                <p className="srch-dismiss-hint">Click anywhere outside to dismiss</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

    </div>
  )
}