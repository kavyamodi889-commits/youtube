// FILE: client/src/pages/Settings/Settings.jsx
import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTheme } from '../../context/ThemeContext.jsx'
import api from '../../services/api.js'
import './Settings.css'

// ── ICONS ──
const UserIcon        = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const LockIcon        = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
const PaletteIcon     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
const BellIcon        = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
const ShieldIcon      = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
const InfoIcon        = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
const CameraIcon      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
const CheckIcon       = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const ChevronRightIcon= () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
const LogoutIcon      = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
const TrashIcon       = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
const LinkIcon        = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
const EyeOffIcon      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
const EyeIcon         = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
const AlertIcon       = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
const CreditCardIcon  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>

const NAV_ITEMS = [
  { id: 'profile',       label: 'Profile',       icon: <UserIcon /> },
  { id: 'account',       label: 'Account',       icon: <LockIcon /> },
  { id: 'appearance',    label: 'Appearance',    icon: <PaletteIcon /> },
  { id: 'notifications', label: 'Notifications', icon: <BellIcon /> },
  { id: 'privacy',       label: 'Privacy',       icon: <ShieldIcon /> },
  { id: 'billing',       label: 'Billing',       icon: <CreditCardIcon /> },
  { id: 'about',         label: 'About',         icon: <InfoIcon /> },
]

const ACCENT_COLORS = [
  { name: 'Rose',    value: '#b5294e' },
  { name: 'Violet',  value: '#7c3aed' },
  { name: 'Blue',    value: '#2563eb' },
  { name: 'Cyan',    value: '#0891b2' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Amber',   value: '#d97706' },
  { name: 'Pink',    value: '#db2777' },
]

function Toggle({ value, onChange }) {
  return (
    <motion.button className={`settings-toggle ${value ? 'on' : ''}`}
      onClick={() => onChange(!value)} whileTap={{ scale: 0.94 }}>
      <motion.div className="settings-toggle-thumb"
        animate={{ x: value ? 20 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
    </motion.button>
  )
}

function SettingsRow({ label, sub, children, danger }) {
  return (
    <div className={`settings-row ${danger ? 'danger' : ''}`}>
      <div className="settings-row-info">
        <span className="settings-row-label">{label}</span>
        {sub && <span className="settings-row-sub">{sub}</span>}
      </div>
      <div className="settings-row-action">{children}</div>
    </div>
  )
}

function SettingsSection({ title, children }) {
  return (
    <div className="settings-section">
      {title && <h3 className="settings-section-title">{title}</h3>}
      <div className="settings-section-body">{children}</div>
    </div>
  )
}

function SettingsInput({ label, value, onChange, type = 'text', placeholder, disabled }) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  return (
    <div className="settings-input-wrap">
      <label className="settings-input-label">{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          className="settings-input"
          type={isPassword && show ? 'text' : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
        />
        {isPassword && (
          <button type="button" className="settings-pw-eye" onClick={() => setShow(s => !s)}>
            {show ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
    </div>
  )
}

function SettingsTextarea({ label, value, onChange, placeholder, maxLength }) {
  return (
    <div className="settings-input-wrap">
      <label className="settings-input-label">{label}</label>
      <div className="settings-textarea-wrap">
        <textarea className="settings-textarea" value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} maxLength={maxLength} rows={4} />
        {maxLength && <span className="settings-textarea-count">{value.length}/{maxLength}</span>}
      </div>
    </div>
  )
}

function SaveButton({ onClick, saved, saving, disabled }) {
  return (
    <motion.button className={`settings-save-btn ${saved ? 'saved' : ''}`}
      onClick={onClick} disabled={saving || disabled}
      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
      {saving ? 'Saving…' : saved ? <><CheckIcon /> Saved</> : 'Save Changes'}
    </motion.button>
  )
}

function StatusMsg({ msg, isError }) {
  if (!msg) return null
  return (
    <motion.div className={`settings-status-msg ${isError ? 'error' : 'success'}`}
      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
      {isError ? <AlertIcon /> : <CheckIcon />} {msg}
    </motion.div>
  )
}

// ── PROFILE SECTION ───────────────────────────────────────────────
function ProfileSection({ settings, onSettingsChange }) {
  const fileRef = useRef(null)
  const { user, login } = useAuth()
  const [avatar,     setAvatar]     = useState(settings?.avatar || user?.avatar || '')
  const [avatarFile, setAvatarFile] = useState(null)
  const [name,       setName]       = useState(settings?.displayName || user?.displayName || user?.username || '')
  const [handle,     setHandle]     = useState(settings?.handle || user?.handle || '')
  const [bio,        setBio]        = useState(settings?.bio || '')
  const [website,    setWebsite]    = useState(settings?.website || '')
  const [location,   setLocation]   = useState(settings?.location || '')
  const [saved,      setSaved]      = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [msg,        setMsg]        = useState('')
  const [isError,    setIsError]    = useState(false)

  useEffect(() => {
    if (!settings) return
    setAvatar(settings.avatar || '')
    setName(settings.displayName || '')
    setHandle(settings.handle || '')
    setBio(settings.bio || '')
    setWebsite(settings.website || '')
    setLocation(settings.location || '')
  }, [settings])

  const handleSave = async () => {
    setSaving(true); setMsg(''); setIsError(false)
    try {
      const form = new FormData()
      form.append('displayName', name)
      form.append('handle',      handle)
      form.append('bio',         bio)
      form.append('website',     website)
      form.append('location',    location)
      if (avatarFile) form.append('avatar', avatarFile)
      const res = await api.patch('/user/profile', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      if (res.data.user) login(window.__aura_access_token__, res.data.user)
      onSettingsChange({ displayName: name, handle, bio, website, location, avatar: res.data.user?.avatar || avatar })
      setSaved(true); setMsg('Profile saved!')
      setTimeout(() => { setSaved(false); setMsg('') }, 2500)
    } catch (err) {
      setIsError(true); setMsg(err.response?.data?.message || 'Failed to save')
    } finally { setSaving(false) }
  }

  return (
    <div className="settings-content-inner">
      <div className="settings-page-header">
        <h2 className="settings-page-title">Profile</h2>
        <p className="settings-page-sub">Manage how others see you on AURA</p>
      </div>
      <SettingsSection title="Photo">
        <div className="profile-avatar-section">
          <div className="profile-avatar-wrap">
            {avatar
              ? <img src={avatar} alt="avatar" className="profile-avatar" />
              : <div className="profile-avatar profile-avatar-fallback">{name?.[0]?.toUpperCase() || 'U'}</div>
            }
            <motion.button className="profile-avatar-edit" onClick={() => fileRef.current?.click()}
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}><CameraIcon /></motion.button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
              const f = e.target.files[0]; if (!f) return
              setAvatarFile(f); setAvatar(URL.createObjectURL(f))
            }} />
          </div>
          <div className="profile-avatar-info">
            <p className="profile-avatar-hint">Upload a photo at least 98×98px. PNG, JPG or GIF. Max 4 MB.</p>
            <button className="profile-avatar-remove" onClick={() => { setAvatar(''); setAvatarFile(null) }}>Remove photo</button>
          </div>
        </div>
      </SettingsSection>
      <SettingsSection title="Basic Info">
        <div className="settings-form-grid">
          <SettingsInput label="Display Name" value={name}   onChange={setName}   placeholder="Your name" />
          <SettingsInput label="Handle"        value={handle} onChange={setHandle} placeholder="yourhandle" />
        </div>
        <SettingsTextarea label="Bio" value={bio} onChange={setBio} placeholder="Tell the world about yourself…" maxLength={200} />
        <SettingsInput label="Location" value={location} onChange={setLocation} placeholder="City, Country" />
      </SettingsSection>
      <SettingsSection title="Links">
        <div className="settings-link-item">
          <div className="settings-link-icon"><LinkIcon /></div>
          <SettingsInput label="Website" value={website} onChange={setWebsite} placeholder="https://yourwebsite.com" />
        </div>
      </SettingsSection>
      <StatusMsg msg={msg} isError={isError} />
      <div className="settings-footer"><SaveButton onClick={handleSave} saved={saved} saving={saving} /></div>
    </div>
  )
}

// ── ACCOUNT SECTION ───────────────────────────────────────────────
function AccountSection({ settings }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [currentPw,     setCurrentPw]     = useState('')
  const [newPw,         setNewPw]         = useState('')
  const [confirmPw,     setConfirmPw]     = useState('')
  const [pwSaved,       setPwSaved]       = useState(false)
  const [pwSaving,      setPwSaving]      = useState(false)
  const [pwMsg,         setPwMsg]         = useState('')
  const [pwError,       setPwError]       = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting,      setDeleting]      = useState(false)
  const [delMsg,        setDelMsg]        = useState('')
  const isLocalAuth = !settings?.authProvider || settings?.authProvider === 'local'

  const handlePasswordChange = async () => {
    if (!newPw || !currentPw) { setPwError(true); setPwMsg('All fields required'); return }
    if (newPw !== confirmPw)  { setPwError(true); setPwMsg('Passwords do not match'); return }
    if (newPw.length < 8)     { setPwError(true); setPwMsg('Password must be at least 8 characters'); return }
    setPwSaving(true); setPwMsg(''); setPwError(false)
    try {
      await api.patch('/user/password', { currentPassword: currentPw, newPassword: newPw })
      setPwSaved(true); setPwMsg('Password changed!')
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
      setTimeout(() => { setPwSaved(false); setPwMsg('') }, 3000)
    } catch (err) {
      setPwError(true); setPwMsg(err.response?.data?.message || 'Failed to change password')
    } finally { setPwSaving(false) }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') { setDelMsg('Type DELETE to confirm'); return }
    setDeleting(true)
    try { await api.delete('/user/account'); logout(); navigate('/') }
    catch (err) { setDelMsg(err.response?.data?.message || 'Failed to delete account'); setDeleting(false) }
  }

  return (
    <div className="settings-content-inner">
      <div className="settings-page-header">
        <h2 className="settings-page-title">Account</h2>
        <p className="settings-page-sub">Manage your credentials and security</p>
      </div>
      <SettingsSection title="Email">
        <SettingsInput label="Email address" value={settings?.email || user?.email || ''} onChange={() => {}} type="email" disabled placeholder="you@example.com" />
        <p className="settings-helper-text">Email changes require contacting support.</p>
      </SettingsSection>
      <SettingsSection title="Change Password">
        {isLocalAuth ? (
          <>
            <SettingsInput label="Current Password" value={currentPw} onChange={setCurrentPw} type="password" placeholder="Current password" />
            <div className="settings-form-grid" style={{ marginTop: 12 }}>
              <SettingsInput label="New Password"     value={newPw}     onChange={setNewPw}     type="password" placeholder="Min 8 characters" />
              <SettingsInput label="Confirm Password" value={confirmPw} onChange={setConfirmPw} type="password" placeholder="Repeat new password" />
            </div>
            <StatusMsg msg={pwMsg} isError={pwError} />
            <div className="settings-footer" style={{ marginTop: 8 }}>
              <SaveButton onClick={handlePasswordChange} saved={pwSaved} saving={pwSaving} />
            </div>
          </>
        ) : (
          <p className="settings-helper-text">You signed in with Google — password change is not available.</p>
        )}
      </SettingsSection>
      <SettingsSection title="Danger Zone">
        <SettingsRow label="Delete Account" sub="Permanently delete your account. This cannot be undone." danger>
          <div className="settings-delete-wrap">
            <input className="settings-input settings-delete-confirm-input" placeholder='Type "DELETE" to confirm'
              value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} />
            <button className="settings-danger-btn" onClick={handleDeleteAccount} disabled={deleting}>
              <TrashIcon /> {deleting ? 'Deleting…' : 'Delete Account'}
            </button>
          </div>
        </SettingsRow>
        {delMsg && <p className="settings-status-msg error" style={{ marginTop: 8 }}><AlertIcon /> {delMsg}</p>}
      </SettingsSection>
    </div>
  )
}

// ── APPEARANCE SECTION ────────────────────────────────────────────
function AppearanceSection({ settings, onSettingsChange }) {
  const { isDark, toggle: toggleTheme } = useTheme()
  const [theme,    setTheme]    = useState(settings?.theme    || 'dark')
  const [language, setLanguage] = useState(settings?.language || 'en')
  const [saved,    setSaved]    = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [msg,      setMsg]      = useState('')
  const [isError,  setIsError]  = useState(false)

  useEffect(() => {
    if (settings?.theme)    setTheme(settings.theme)
    if (settings?.language) setLanguage(settings.language)
  }, [settings])

  const applyTheme = (t) => {
    setTheme(t)
    const wantDark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    if (wantDark !== isDark) toggleTheme()
  }

  const handleSave = async () => {
    setSaving(true); setMsg(''); setIsError(false)
    try {
      await api.patch('/user/settings', { theme, language })
      onSettingsChange({ theme, language })
      setSaved(true); setMsg('Appearance saved!')
      setTimeout(() => { setSaved(false); setMsg('') }, 2500)
    } catch (err) {
      setIsError(true); setMsg(err.response?.data?.message || 'Failed to save')
    } finally { setSaving(false) }
  }

  return (
    <div className="settings-content-inner">
      <div className="settings-page-header">
        <h2 className="settings-page-title">Appearance</h2>
        <p className="settings-page-sub">Customize how AURA looks and feels</p>
      </div>
      <SettingsSection title="Theme">
        <div className="appearance-theme-options">
          {[{id:'dark',label:'Dark'},{id:'light',label:'Light'},{id:'system',label:'System'}].map(t => (
            <motion.button key={t.id} className={`appearance-theme-card ${theme === t.id ? 'active' : ''}`}
              onClick={() => applyTheme(t.id)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <div className={`appearance-theme-preview ${t.id}`} />
              <span>{t.label}</span>
              {theme === t.id && <div className="appearance-theme-check"><CheckIcon /></div>}
            </motion.button>
          ))}
        </div>
      </SettingsSection>
      <SettingsSection title="Language">
        <div className="settings-input-wrap">
          <label className="settings-input-label">Display Language</label>
          <select className="settings-select" value={language} onChange={e => setLanguage(e.target.value)}>
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="gu">Gujarati</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="ja">Japanese</option>
            <option value="de">German</option>
          </select>
        </div>
      </SettingsSection>
      <StatusMsg msg={msg} isError={isError} />
      <div className="settings-footer"><SaveButton onClick={handleSave} saved={saved} saving={saving} /></div>
    </div>
  )
}

// ── NOTIFICATIONS SECTION ─────────────────────────────────────────
function NotificationsSection({ settings, onSettingsChange }) {
  const [prefs,   setPrefs]   = useState(settings?.notificationPrefs || { subscriptions:true, likes:true, comments:true, live:true, system:true })
  const [extras,  setExtras]  = useState({ replies:true, mentions:true, email:false, marketing:false, browserPush: typeof Notification !== 'undefined' && Notification.permission === 'granted' })
  const [saved,   setSaved]   = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [msg,     setMsg]     = useState('')
  const [isError, setIsError] = useState(false)

  useEffect(() => { if (settings?.notificationPrefs) setPrefs(settings.notificationPrefs) }, [settings])

  const togglePrefs  = k => setPrefs(p  => ({ ...p,  [k]: !p[k]  }))
  const toggleExtras = k => setExtras(e => ({ ...e, [k]: !e[k] }))

  const requestPush = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission()
      setExtras(e => ({ ...e, browserPush: perm === 'granted' }))
    }
  }

  const handleSave = async () => {
    setSaving(true); setMsg(''); setIsError(false)
    try {
      await api.patch('/user/settings', { notificationPrefs: prefs })
      onSettingsChange({ notificationPrefs: prefs })
      setSaved(true); setMsg('Notification preferences saved!')
      setTimeout(() => { setSaved(false); setMsg('') }, 2500)
    } catch (err) {
      setIsError(true); setMsg(err.response?.data?.message || 'Failed to save')
    } finally { setSaving(false) }
  }

  const groups = [
    { title: 'Activity (In-app & Push)', items: [
      { key:'subscriptions', label:'New video uploads',    sub:'From channels you subscribe to', inPrefs:true },
      { key:'live',          label:'Live streams',          sub:'When a channel goes live',       inPrefs:true },
      { key:'comments',      label:'Comments on my videos', sub:'When someone comments',          inPrefs:true },
      { key:'replies',       label:'Replies to comments',   sub:'When someone replies to you',    inPrefs:false },
      { key:'mentions',      label:'Mentions',              sub:'When someone @mentions you',     inPrefs:false },
      { key:'likes',         label:'Likes',                 sub:'When someone likes your video',  inPrefs:true },
      { key:'system',        label:'System notifications',  sub:'AURA announcements & alerts',    inPrefs:true },
    ]},
    { title: 'Email', items: [
      { key:'email',     label:'Email notifications', sub:'Activity summaries via email', inPrefs:false },
      { key:'marketing', label:'Product updates',     sub:'News and tips from AURA',      inPrefs:false },
    ]},
  ]

  return (
    <div className="settings-content-inner">
      <div className="settings-page-header">
        <h2 className="settings-page-title">Notifications</h2>
        <p className="settings-page-sub">Control what you get notified about</p>
      </div>
      <SettingsSection title="Browser Push Notifications">
        <SettingsRow label="Enable push notifications"
          sub={extras.browserPush ? 'Browser notifications are enabled' : 'Allow AURA to send browser notifications'}>
          {extras.browserPush
            ? <span className="settings-badge-green"><CheckIcon /> Enabled</span>
            : <button className="settings-connect-btn" onClick={requestPush}>Enable</button>
          }
        </SettingsRow>
      </SettingsSection>
      {groups.map(group => (
        <SettingsSection key={group.title} title={group.title}>
          {group.items.map(item => (
            <SettingsRow key={item.key} label={item.label} sub={item.sub}>
              <Toggle value={item.inPrefs ? prefs[item.key] : extras[item.key]}
                onChange={() => item.inPrefs ? togglePrefs(item.key) : toggleExtras(item.key)} />
            </SettingsRow>
          ))}
        </SettingsSection>
      ))}
      <StatusMsg msg={msg} isError={isError} />
      <div className="settings-footer"><SaveButton onClick={handleSave} saved={saved} saving={saving} /></div>
    </div>
  )
}

// ── PRIVACY SECTION ───────────────────────────────────────────────
function PrivacySection({ settings, onSettingsChange }) {
  const [priv,     setPriv]     = useState({ isPrivate:false, showLikedVideos:true, showSubscriptions:true, watchHistory:true, searchHistory:true, dataCollection:true, recommendations:true })
  const [saved,    setSaved]    = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [msg,      setMsg]      = useState('')
  const [isError,  setIsError]  = useState(false)
  const [clearing, setClearing] = useState(false)

  useEffect(() => {
    if (!settings) return
    setPriv(p => ({ ...p, isPrivate: settings.isPrivate||false, showLikedVideos: settings.showLikedVideos??true, showSubscriptions: settings.showSubscriptions??true }))
  }, [settings])

  const toggle = k => setPriv(p => ({ ...p, [k]: !p[k] }))

  const handleSave = async () => {
    setSaving(true); setMsg(''); setIsError(false)
    try {
      await api.patch('/user/settings', { isPrivate: priv.isPrivate, showLikedVideos: priv.showLikedVideos, showSubscriptions: priv.showSubscriptions })
      onSettingsChange({ isPrivate: priv.isPrivate, showLikedVideos: priv.showLikedVideos, showSubscriptions: priv.showSubscriptions })
      setSaved(true); setMsg('Privacy settings saved!')
      setTimeout(() => { setSaved(false); setMsg('') }, 2500)
    } catch (err) {
      setIsError(true); setMsg(err.response?.data?.message || 'Failed to save')
    } finally { setSaving(false) }
  }

  const handleClearHistory = async () => {
    setClearing(true)
    try {
      await api.delete('/user/history')
      setMsg('Watch history cleared!'); setIsError(false)
      setTimeout(() => setMsg(''), 2500)
    } catch { setMsg('Failed to clear history'); setIsError(true) }
    finally { setClearing(false) }
  }

  return (
    <div className="settings-content-inner">
      <div className="settings-page-header">
        <h2 className="settings-page-title">Privacy</h2>
        <p className="settings-page-sub">Control your data and what others can see</p>
      </div>
      <SettingsSection title="Account Privacy">
        <SettingsRow label="Private account" sub="Only approved followers can see your content">
          <Toggle value={priv.isPrivate} onChange={() => toggle('isPrivate')} />
        </SettingsRow>
      </SettingsSection>
      <SettingsSection title="History">
        <SettingsRow label="Save watch history" sub="Videos you watch are saved to your history">
          <Toggle value={priv.watchHistory} onChange={() => toggle('watchHistory')} />
        </SettingsRow>
        <SettingsRow label="Save search history" sub="Your searches are saved for recommendations">
          <Toggle value={priv.searchHistory} onChange={() => toggle('searchHistory')} />
        </SettingsRow>
        <SettingsRow label="Clear watch history" sub="Remove all videos from your watch history" danger>
          <button className="settings-danger-btn" onClick={handleClearHistory} disabled={clearing}>
            <TrashIcon /> {clearing ? 'Clearing…' : 'Clear History'}
          </button>
        </SettingsRow>
      </SettingsSection>
      <SettingsSection title="Profile Visibility">
        <SettingsRow label="Show liked videos" sub="Others can see videos you've liked">
          <Toggle value={priv.showLikedVideos} onChange={() => toggle('showLikedVideos')} />
        </SettingsRow>
        <SettingsRow label="Show subscriptions" sub="Others can see channels you subscribe to">
          <Toggle value={priv.showSubscriptions} onChange={() => toggle('showSubscriptions')} />
        </SettingsRow>
      </SettingsSection>
      <SettingsSection title="Data & Personalization">
        <SettingsRow label="Data collection" sub="Help improve AURA with usage analytics">
          <Toggle value={priv.dataCollection} onChange={() => toggle('dataCollection')} />
        </SettingsRow>
        <SettingsRow label="Personalized recommendations" sub="Use watch history to recommend videos">
          <Toggle value={priv.recommendations} onChange={() => toggle('recommendations')} />
        </SettingsRow>
      </SettingsSection>
      <StatusMsg msg={msg} isError={isError} />
      <div className="settings-footer"><SaveButton onClick={handleSave} saved={saved} saving={saving} /></div>
    </div>
  )
}

// ── ABOUT SECTION ─────────────────────────────────────────────────
function AboutSection() {
  const items = [
    { label:'Version', value:'1.0.0-beta' }, { label:'Build', value:'March 2026' },
    { label:'Environment', value: import.meta.env.MODE || 'development' },
    { label:'React', value:'18.3.x' }, { label:'Vite', value:'5.x' }, { label:'Framer Motion', value:'11.x' },
  ]
  const links = ['Terms of Service','Privacy Policy','Cookie Policy','Open Source Licenses','Help Center']
  return (
    <div className="settings-content-inner">
      <div className="settings-page-header">
        <h2 className="settings-page-title">About</h2>
        <p className="settings-page-sub">AURA — a next-gen video platform</p>
      </div>
      <div className="about-logo-block">
        <span className="about-logo">AURA</span>
        <p className="about-tagline">The future of video, today.</p>
      </div>
      <SettingsSection title="App Info">
        {items.map(i => <SettingsRow key={i.label} label={i.label}><span className="about-value">{i.value}</span></SettingsRow>)}
      </SettingsSection>
      <SettingsSection title="Legal">
        {links.map(l => <SettingsRow key={l} label={l}><ChevronRightIcon /></SettingsRow>)}
      </SettingsSection>
    </div>
  )
}

// ── MAIN SETTINGS PAGE ────────────────────────────────────────────
// ── BILLING SECTION ──────────────────────────────────────────────────────────
function BillingSection() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [subStatus,  setSubStatus]  = useState(null)
  const [history,    setHistory]    = useState([])
  const [loadingSub, setLoadingSub] = useState(true)
  const [loadingHist,setLoadingHist]= useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [msg,        setMsg]        = useState('')
  const [isError,    setIsError]    = useState(false)

  useEffect(() => {
    if (!user) return
    api.get('/payments/status')
      .then(r => setSubStatus(r.data))
      .catch(() => {})
      .finally(() => setLoadingSub(false))

    api.get('/payments/history')
      .then(r => setHistory(r.data.payments || []))
      .catch(() => {})
      .finally(() => setLoadingHist(false))
  }, [user])

  const handleCancel = async () => {
    if (!window.confirm('Cancel your subscription? You keep access until the billing period ends.')) return
    setCancelling(true)
    try {
      const r = await api.post('/payments/cancel')
      setMsg(r.data.message || 'Subscription cancelled.')
      setIsError(false)
    } catch {
      setMsg('Failed to cancel. Please try again.')
      setIsError(true)
    } finally {
      setCancelling(false)
    }
  }

  const tierLabel = (t) => {
    if (!t || t === 'none') return 'Free'
    return t.charAt(0).toUpperCase() + t.slice(1)
  }

  const statusColor = (s) => {
    if (s === 'captured') return 'var(--success, #22c55e)'
    if (s === 'failed')   return 'var(--err, #ef4444)'
    if (s === 'refunded') return 'var(--warn, #f59e0b)'
    return 'var(--t3)'
  }

  const statusLabel = (s) => {
    if (s === 'captured') return '✓ Paid'
    if (s === 'created')  return '⏳ Pending'
    if (s === 'failed')   return '✗ Failed'
    if (s === 'refunded') return '↩ Refunded'
    return s
  }

  if (!user) return (
    <div>
      <h2 className="settings-page-title">Billing</h2>
      <p style={{ color: 'var(--t3)', marginTop: 16 }}>Sign in to view billing information.</p>
    </div>
  )

  return (
    <div>
      <h2 className="settings-page-title">Billing</h2>

      {msg && (
        <div className={`settings-save-toast ${isError ? 'error' : ''}`} style={{ marginBottom: 16 }}>
          {isError ? '✗' : '✓'} {msg}
        </div>
      )}

      {/* Current plan */}
      <SettingsSection title="Current Plan">
        {loadingSub ? (
          <div style={{ padding: '16px 0', color: 'var(--t3)', fontSize: '0.9rem' }}>Loading…</div>
        ) : (
          <div className="billing-plan-card">
            <div className="billing-plan-info">
              <span className={`billing-plan-badge billing-plan-badge-${subStatus?.tier || 'none'}`}>
                {tierLabel(subStatus?.tier)}
              </span>
              {subStatus?.isActive ? (
                <span className="billing-plan-expires">
                  Active · Renews {subStatus.expiresAt
                    ? new Date(subStatus.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '—'}
                </span>
              ) : (
                <span className="billing-plan-expires" style={{ color: 'var(--t3)' }}>No active subscription</span>
              )}
            </div>
            <div className="billing-plan-actions">
              {subStatus?.isActive ? (
                <button className="billing-cancel-btn" onClick={handleCancel} disabled={cancelling}>
                  {cancelling ? 'Cancelling…' : 'Cancel Subscription'}
                </button>
              ) : (
                <button className="billing-upgrade-btn" onClick={() => navigate('/premium')}>
                  Upgrade to Premium →
                </button>
              )}
            </div>
          </div>
        )}
      </SettingsSection>

      {/* Payment history */}
      <SettingsSection title="Payment History">
        {loadingHist ? (
          <div style={{ padding: '16px 0', color: 'var(--t3)', fontSize: '0.9rem' }}>Loading…</div>
        ) : history.length === 0 ? (
          <div style={{ padding: '16px 0', color: 'var(--t3)', fontSize: '0.9rem' }}>
            No payments yet.{' '}
            <button className="billing-upgrade-btn" onClick={() => navigate('/premium')} style={{ display: 'inline', padding: '2px 10px' }}>
              Go Premium →
            </button>
          </div>
        ) : (
          <div className="billing-history-table">
            <div className="billing-history-header">
              <span>Date</span>
              <span>Plan</span>
              <span>Amount</span>
              <span>Status</span>
              <span>Payment ID</span>
            </div>
            {history.map(p => (
              <div key={p._id} className="billing-history-row">
                <span>{new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <span>{tierLabel(p.plan)} · {p.months === 1 ? 'Monthly' : 'Yearly'}</span>
                <span>₹{p.amount.toLocaleString('en-IN')}</span>
                <span style={{ color: statusColor(p.status), fontWeight: 600, fontSize: '0.78rem' }}>
                  {statusLabel(p.status)}
                </span>
                <span className="billing-payment-id">{p.paymentId || p.orderId?.slice(-12) || '—'}</span>
              </div>
            ))}
          </div>
        )}
      </SettingsSection>

      <SettingsSection>
        <p style={{ fontSize: '0.8rem', color: 'var(--t3)', lineHeight: 1.6 }}>
          Payments are processed securely via Razorpay. For refund or dispute queries, contact{' '}
          <a href="mailto:support@aura.com" style={{ color: 'var(--a)' }}>support@aura.com</a>.
        </p>
      </SettingsSection>
    </div>
  )
}

export default function Settings() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()

  const hashSection  = location.hash.replace('#', '') || 'profile'
  const validSections = NAV_ITEMS.map(n => n.id)
  const activeSection = validSections.includes(hashSection) ? hashSection : 'profile'
  const setActiveSection = id => navigate(`/settings#${id}`, { replace: true })

  const [settings,      setSettings]      = useState(null)
  const [settingsLoad,  setSettingsLoad]  = useState(true)
  const [loadError,     setLoadError]     = useState('')

  useEffect(() => {
    api.get('/user/settings')
      .then(r => setSettings(r.data.settings))
      .catch(e => setLoadError(e.response?.data?.message || 'Failed to load settings'))
      .finally(() => setSettingsLoad(false))
  }, [])

  const handleSettingsChange = useCallback(patch => {
    setSettings(prev => prev ? { ...prev, ...patch } : patch)
  }, [])

  const sectionComponents = {
    profile:       <ProfileSection       settings={settings} onSettingsChange={handleSettingsChange} />,
    account:       <AccountSection       settings={settings} />,
    appearance:    <AppearanceSection    settings={settings} onSettingsChange={handleSettingsChange} />,
    notifications: <NotificationsSection settings={settings} onSettingsChange={handleSettingsChange} />,
    privacy:       <PrivacySection       settings={settings} onSettingsChange={handleSettingsChange} />,
    billing:       <BillingSection />,
    about:         <AboutSection />,
  }

  return (
    <motion.div className="settings-page" initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.25 }}>
      <aside className="settings-nav">
        <div className="settings-nav-header"><h2 className="settings-nav-title">Settings</h2></div>
        <nav className="settings-nav-list">
          {NAV_ITEMS.map(item => (
            <motion.button key={item.id}
              className={`settings-nav-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => setActiveSection(item.id)}
              whileHover={{ x: 3 }} whileTap={{ scale: 0.97 }}>
              <span className="settings-nav-icon">{item.icon}</span>
              <span className="settings-nav-label">{item.label}</span>
              {activeSection === item.id && (
                <motion.div className="settings-nav-indicator" layoutId="settings-nav-indicator"
                  transition={{ type:'spring', stiffness:400, damping:32 }} />
              )}
            </motion.button>
          ))}
        </nav>
        <div className="settings-nav-footer">
          <button className="settings-logout-btn" onClick={logout}><LogoutIcon /><span>Sign Out</span></button>
        </div>
      </aside>

      <main className="settings-content">
        {settingsLoad ? (
          <div className="settings-loading">
            <div className="settings-loading-spinner" />
            <p>Loading your settings…</p>
          </div>
        ) : loadError ? (
          <div className="settings-load-error">
            <AlertIcon /><p>{loadError}</p>
            <button className="settings-connect-btn" onClick={() => window.location.reload()}>Retry</button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={activeSection}
              initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }}
              exit={{ opacity:0, x:-16 }} transition={{ duration:0.18 }}>
              {sectionComponents[activeSection]}
            </motion.div>
          </AnimatePresence>
        )}
      </main>
    </motion.div>
  )
}