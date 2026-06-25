// studio/src/pages/Settings/Settings.jsx
import { useState, useEffect } from 'react'
import api from '../../services/api'
import { useStudioAuth } from '../../context/StudioAuthContext'
import { useTheme } from '../../context/ThemeContext'
import './Settings.css'

// ── Icons ─────────────────────────────────────────────────────────
const SettingsIco = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
const UserIco     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const BellIco     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
const LockIco     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
const PaletteIco  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
const ShieldIco   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
const CheckIco    = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
const SpinIco     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="sg-spin"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
const EyeIco      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
const EyeOffIco   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>

const TABS = [
  { id: 'notifications', label: 'Notifications', icon: <BellIco /> },
  { id: 'appearance',    label: 'Appearance',    icon: <PaletteIco /> },
  { id: 'privacy',       label: 'Privacy',       icon: <ShieldIco /> },
  { id: 'account',       label: 'Account',       icon: <LockIco /> },
]

// ── Toggle ────────────────────────────────────────────────────────
function Toggle({ value, onChange, disabled }) {
  return (
    <button
      className={`sg-toggle${value ? ' on' : ''}`}
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
    >
      <span className="sg-toggle-thumb" />
    </button>
  )
}

// ── Settings row ──────────────────────────────────────────────────
function Row({ label, sub, children }) {
  return (
    <div className="sg-row">
      <div className="sg-row-info">
        <span className="sg-row-label">{label}</span>
        {sub && <span className="sg-row-sub">{sub}</span>}
      </div>
      <div className="sg-row-ctrl">{children}</div>
    </div>
  )
}

// ── Section ───────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="sg-section">
      {title && <p className="sg-section-title">{title}</p>}
      <div className="sg-section-body">{children}</div>
    </div>
  )
}

// ── Password input ────────────────────────────────────────────────
function PwInput({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false)
  return (
    <Row label={label}>
      <div className="sg-pw-wrap">
        <input
          className="sg-input"
          type={show ? 'text' : 'password'}
          placeholder={placeholder || '••••••••'}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
        <button className="sg-pw-eye" onClick={() => setShow(s => !s)}>
          {show ? <EyeOffIco /> : <EyeIco />}
        </button>
      </div>
    </Row>
  )
}

export default function Settings() {
  const { user } = useStudioAuth()
  const { theme: currentTheme, toggle: toggleTheme, isDark } = useTheme()

  const [tab,     setTab]     = useState('notifications')
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState('')

  // Notification prefs
  const [notifs, setNotifs] = useState({
    subscriptions: true,
    likes:         true,
    comments:      true,
    live:          true,
    system:        true,
  })

  // Theme is driven by ThemeContext — local state mirrors it for the UI
  const [theme,    setTheme]    = useState(() => localStorage.getItem('aura-studio-theme') || 'dark')
  const [language, setLanguage] = useState('en')

  // Privacy
  const [isPrivate,         setIsPrivate]         = useState(false)
  const [showLikedVideos,   setShowLikedVideos]   = useState(true)
  const [showSubscriptions, setShowSubscriptions] = useState(true)

  // Account – password change
  const [currentPw,  setCurrentPw]  = useState('')
  const [newPw,      setNewPw]      = useState('')
  const [confirmPw,  setConfirmPw]  = useState('')

  // Load settings from API
  useEffect(() => {
    api.get('/user/settings')
      .then(r => {
        const s = r.data.settings || {}
        if (s.notificationPrefs) setNotifs(prev => ({ ...prev, ...s.notificationPrefs }))
        if (s.theme) {
          setTheme(s.theme)
          // Apply to ThemeContext if it differs from current
          if (s.theme !== (isDark ? 'dark' : 'light')) toggleTheme()
        }
        if (s.language) setLanguage(s.language)
        if (s.isPrivate         !== undefined) setIsPrivate(s.isPrivate)
        if (s.showLikedVideos   !== undefined) setShowLikedVideos(s.showLikedVideos)
        if (s.showSubscriptions !== undefined) setShowSubscriptions(s.showSubscriptions)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line

  const showSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2500) }
  const showErr   = msg => { setError(msg); setTimeout(() => setError(''), 4000) }

  const saveSettings = async (patch) => {
    setSaving(true); setError('')
    try {
      await api.patch('/user/settings', patch)
      showSaved()
    } catch (e) {
      showErr(e.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) return showErr('All password fields are required')
    if (newPw !== confirmPw) return showErr('New passwords do not match')
    if (newPw.length < 8)    return showErr('Password must be at least 8 characters')
    setSaving(true); setError('')
    try {
      await api.patch('/user/password', { currentPassword: currentPw, newPassword: newPw })
      showSaved()
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    } catch (e) {
      showErr(e.response?.data?.message || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const isGoogleUser = user?.authProvider === 'google'

  return (
    <div className="sg-page">

      {/* ── Header ── */}
      <div className="sg-header">
        <div className="sg-header-left">
          <div className="sg-header-icon"><SettingsIco /></div>
          <div>
            <h1 className="sg-title">Settings</h1>
            <p className="sg-sub">Manage your account preferences and privacy</p>
          </div>
        </div>
        {saved && (
          <div className="sg-saved-pill"><CheckIco /> Saved</div>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="sg-error-bar">
          ⚠ {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      <div className="sg-body">

        {/* ── Tab nav ── */}
        <nav className="sg-nav">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`sg-nav-item${tab === t.id ? ' active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </nav>

        {/* ── Panel ── */}
        <div className="sg-panel">

          {/* ══ Notifications ══ */}
          {tab === 'notifications' && (
            <>
              <Section title="Creator notifications">
                {[
                  { key:'subscriptions', label:'New subscriber',    sub:'When someone subscribes to your channel' },
                  { key:'comments',      label:'New comment',       sub:'When someone comments on your video' },
                  { key:'likes',         label:'New like',          sub:'When someone likes your video' },
                  { key:'live',          label:'Live activity',     sub:'Chat and events during your live streams' },
                  { key:'system',        label:'System updates',    sub:'Platform announcements and product news' },
                ].map(n => (
                  <Row key={n.key} label={n.label} sub={n.sub}>
                    <Toggle
                      value={notifs[n.key]}
                      onChange={v => setNotifs(p => ({ ...p, [n.key]: v }))}
                      disabled={loading}
                    />
                  </Row>
                ))}
              </Section>
              <div className="sg-footer">
                <button
                  className="sg-save-btn"
                  disabled={saving || loading}
                  onClick={() => saveSettings({ notificationPrefs: notifs })}
                >
                  {saving ? <><SpinIco /> Saving…</> : 'Save preferences'}
                </button>
              </div>
            </>
          )}

          {/* ══ Appearance ══ */}
          {tab === 'appearance' && (
            <>
              <Section title="Theme">
                <Row label="Colour scheme" sub="Controls the Studio interface appearance">
                  <div className="sg-theme-btns">
                    {['dark','light'].map(t => (
                      <button
                        key={t}
                        className={`sg-theme-btn${theme === t ? ' active' : ''}`}
                        onClick={() => {
                          setTheme(t)
                          // Apply immediately — only toggle if different from current
                          if ((t === 'dark') !== isDark) toggleTheme()
                        }}
                      >
                        {t === 'dark' ? '🌙 Dark' : '☀️ Light'}
                      </button>
                    ))}
                  </div>
                </Row>
              </Section>
              <Section title="Language">
                <Row label="Display language">
                  <select
                    className="sg-select"
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                  >
                    {[
                      { val:'en',    label:'English' },
                      { val:'hi',    label:'Hindi' },
                      { val:'es',    label:'Spanish' },
                      { val:'fr',    label:'French' },
                      { val:'de',    label:'German' },
                      { val:'pt',    label:'Portuguese' },
                      { val:'ja',    label:'Japanese' },
                    ].map(l => <option key={l.val} value={l.val}>{l.label}</option>)}
                  </select>
                </Row>
              </Section>
              <div className="sg-footer">
                <button
                  className="sg-save-btn"
                  disabled={saving || loading}
                  onClick={() => saveSettings({ theme, language })}
                >
                  {saving ? <><SpinIco /> Saving…</> : 'Save appearance'}
                </button>
              </div>
            </>
          )}

          {/* ══ Privacy ══ */}
          {tab === 'privacy' && (
            <>
              <Section title="Channel visibility">
                <Row label="Private channel" sub="Only subscribers can see your channel and videos">
                  <Toggle value={isPrivate} onChange={setIsPrivate} disabled={loading} />
                </Row>
                <Row label="Show liked videos" sub="Your liked videos tab is visible on your channel">
                  <Toggle value={showLikedVideos} onChange={setShowLikedVideos} disabled={loading} />
                </Row>
                <Row label="Show subscriptions" sub="Your subscriptions tab is visible on your channel">
                  <Toggle value={showSubscriptions} onChange={setShowSubscriptions} disabled={loading} />
                </Row>
              </Section>
              <div className="sg-footer">
                <button
                  className="sg-save-btn"
                  disabled={saving || loading}
                  onClick={() => saveSettings({ isPrivate, showLikedVideos, showSubscriptions })}
                >
                  {saving ? <><SpinIco /> Saving…</> : 'Save privacy settings'}
                </button>
              </div>
            </>
          )}

          {/* ══ Account ══ */}
          {tab === 'account' && (
            <>
              <Section title="Account info">
                <Row label="Email">
                  <span className="sg-info-val">{user?.email || '—'}</span>
                </Row>
                <Row label="Username">
                  <span className="sg-info-val">@{user?.username || '—'}</span>
                </Row>
                <Row label="Sign-in method">
                  <span className="sg-info-val">{isGoogleUser ? 'Google' : 'Email & password'}</span>
                </Row>
              </Section>

              {!isGoogleUser && (
                <Section title="Change password">
                  <PwInput label="Current password" value={currentPw} onChange={setCurrentPw} />
                  <PwInput label="New password"     value={newPw}     onChange={setNewPw} placeholder="Min. 8 characters" />
                  <PwInput label="Confirm password" value={confirmPw} onChange={setConfirmPw} />
                  <div className="sg-footer" style={{ borderTop: 'none', paddingTop: 4 }}>
                    <button
                      className="sg-save-btn"
                      disabled={saving}
                      onClick={changePassword}
                    >
                      {saving ? <><SpinIco /> Updating…</> : 'Update password'}
                    </button>
                  </div>
                </Section>
              )}

              {isGoogleUser && (
                <div className="sg-info-note">
                  Your account uses Google sign-in. Password changes are managed through your Google account.
                </div>
              )}

              <Section title="Danger zone">
                <div className="sg-danger-row">
                  <div>
                    <p className="sg-danger-label">Delete account</p>
                    <p className="sg-danger-sub">
                      Permanently delete your AURA account and all associated content. This cannot be undone.
                    </p>
                  </div>
                  <button
                    className="sg-danger-btn"
                    onClick={() => window.confirm('Are you absolutely sure? All your videos, comments and data will be deleted forever.') && api.delete('/user/account').then(() => window.location.href = 'http://localhost:5173')}
                  >
                    Delete account
                  </button>
                </div>
              </Section>
            </>
          )}

        </div>
      </div>
    </div>
  )
}