// FILE: client/src/pages/Auth/Auth.jsx
import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import './Auth.css'

// ── ICONS ──
const EyeIcon = ({ open }) => open ? (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)
const UserIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)
const AtIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 006 0v-1a10 10 0 10-3.92 7.94"/>
  </svg>
)
const MailIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
  </svg>
)
const LockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
)
const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const XIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)
const CameraIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>
  </svg>
)
const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)

// ── PASSWORD STRENGTH ──
function getPasswordStrength(pwd) {
  let score = 0
  if (pwd.length >= 8)               score++
  if (/[A-Z]/.test(pwd))             score++
  if (/[a-z]/.test(pwd))             score++
  if (/[0-9]/.test(pwd))             score++
  if (/[^A-Za-z0-9]/.test(pwd))      score++
  return score
}

const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong']
const strengthColors = ['', '#a63c3c', '#b8882a', '#b8882a', '#2d9e6e', '#3d9e8c']

const COUNTRIES = [
  'India','United States','United Kingdom','Canada','Australia',
  'Germany','France','Japan','Brazil','South Korea','Singapore',
  'UAE','Netherlands','Sweden','Italy','Spain','Mexico','Indonesia',
  'Pakistan','Bangladesh','Other'
]

const CATEGORIES = [
  { id:'tech',    label:'Technology', emoji:'💻' },
  { id:'gaming',  label:'Gaming',     emoji:'🎮' },
  { id:'music',   label:'Music',      emoji:'🎵' },
  { id:'sports',  label:'Sports',     emoji:'⚽' },
  { id:'comedy',  label:'Comedy',     emoji:'😂' },
  { id:'edu',     label:'Education',  emoji:'📚' },
  { id:'food',    label:'Food',       emoji:'🍕' },
  { id:'travel',  label:'Travel',     emoji:'✈️' },
  { id:'anime',   label:'Anime',      emoji:'🎌' },
  { id:'news',    label:'News',       emoji:'📰' },
  { id:'science', label:'Science',    emoji:'🔬' },
  { id:'fashion', label:'Fashion',    emoji:'👗' },
  { id:'health',  label:'Health',     emoji:'💪' },
  { id:'business',label:'Business',   emoji:'💼' },
  { id:'movies',  label:'Movies',     emoji:'🎬' },
]

const slideVariants = {
  enter:  (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
}

function FormInput({ icon, label, error, hint, children, required }) {
  return (
    <div className="auth-field">
      {label && (
        <label className="auth-label">
          {label} {required && <span className="auth-required">*</span>}
        </label>
      )}
      <div className={`auth-input-wrap ${error ? 'has-error' : ''}`}>
        {icon && <span className="auth-input-icon">{icon}</span>}
        {children}
      </div>
      {error && <p className="auth-field-error">{error}</p>}
      {hint && !error && <p className="auth-field-hint">{hint}</p>}
    </div>
  )
}

const GOOGLE_URL = `${import.meta.env.VITE_API_URL}/auth/google`
const TOTAL_STEPS = 3

export default function Auth() {
  const navigate        = useNavigate()
  const { login: ctxLogin } = useAuth()
  const [mode, setMode] = useState('signup')
  const [step, setStep] = useState(1)
  const [dir,  setDir]  = useState(1)
  const fileRef         = useRef(null)

  // Step 1
  const [fullName,      setFullName]      = useState('')
  const [username,      setUsername]      = useState('')
  const [email,         setEmail]         = useState('')
  const [password,      setPassword]      = useState('')
  const [confirmPwd,    setConfirmPwd]    = useState('')
  const [showPwd,       setShowPwd]       = useState(false)
  const [showCPwd,      setShowCPwd]      = useState(false)
  const [agreed,        setAgreed]        = useState(false)

  // Step 2
  const [avatar,        setAvatar]        = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [dob,           setDob]           = useState('')
  const [gender,        setGender]        = useState('')
  const [country,       setCountry]       = useState('')

  // Step 3 — interests only (role removed)
  const [interests,     setInterests]     = useState([])

  // Login
  const [loginId,       setLoginId]       = useState('')
  const [loginPwd,      setLoginPwd]      = useState('')
  const [showLPwd,      setShowLPwd]      = useState(false)

  // Shared state
  const [errors,        setErrors]        = useState({})
  const [serverErr,     setServerErr]     = useState('')
  const [loading,       setLoading]       = useState(false)

  const pwdStrength = getPasswordStrength(password)
  const pwdRules = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'One uppercase letter',  ok: /[A-Z]/.test(password) },
    { label: 'One lowercase letter',  ok: /[a-z]/.test(password) },
    { label: 'One number',            ok: /[0-9]/.test(password) },
    { label: 'One special character', ok: /[^A-Za-z0-9]/.test(password) },
  ]

  const goNext = (newDir = 1) => { setDir(newDir); setStep(s => s + newDir) }

  const validateStep1 = () => {
    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrors({ fullName: 'Full name must be at least 2 characters' }); return false
    }
    if (!username.trim() || username.length < 3) {
      setErrors({ username: 'Username must be at least 3 characters' }); return false
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setErrors({ username: 'Only letters, numbers and underscores allowed' }); return false
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: 'Enter a valid email address' }); return false
    }
    if (pwdStrength < 3) {
      setErrors({ password: 'Password is too weak' }); return false
    }
    if (password !== confirmPwd) {
      setErrors({ confirmPwd: 'Passwords do not match' }); return false
    }
    if (!agreed) {
      setErrors({ agreed: 'You must agree to the Terms and Privacy Policy' }); return false
    }
    setErrors({}); return true
  }

  const validateStep2 = () => {
    if (!dob) {
      setErrors({ dob: 'Date of birth is required' }); return false
    }
    const age = (new Date() - new Date(dob)) / (1000*60*60*24*365.25)
    if (age < 13) {
      setErrors({ dob: 'You must be at least 13 years old' }); return false
    }
    if (!country) {
      setErrors({ country: 'Please select your country' }); return false
    }
    setErrors({}); return true
  }

  const validateStep3 = () => {
    if (interests.length < 3) {
      setErrors({ interests: 'Please select at least 3 interests' }); return false
    }
    setErrors({}); return true
  }

  const handleStep1Next = () => { if (validateStep1()) goNext(1) }
  const handleStep2Next = () => { if (validateStep2()) goNext(1) }

  // ── Register ────────────────────────────────────────────────────────────────
  const handleStep3Submit = async () => {
    if (!validateStep3()) return
    setLoading(true)
    setServerErr('')
    try {
      const fd = new FormData()
      fd.append('displayName', fullName.trim())
      fd.append('username',    username.trim())
      fd.append('email',       email.trim())
      fd.append('password',    password)
      fd.append('dob',         dob)
      fd.append('gender',      gender)
      fd.append('country',     country)
      fd.append('interests',   JSON.stringify(interests))
      if (avatar) fd.append('avatar', avatar)

      const res = await api.post('/auth/register', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      ctxLogin(res.data.accessToken, res.data.user)
      navigate('/')
    } catch (err) {
      setServerErr(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Login ───────────────────────────────────────────────────────────────────
  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    if (!loginId.trim()) { setErrors({ loginId: 'Email or username is required' }); return }
    if (!loginPwd.trim()) { setErrors({ loginPwd: 'Password is required' }); return }
    setErrors({})
    setServerErr('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { identifier: loginId.trim(), password: loginPwd })
      ctxLogin(res.data.accessToken, res.data.user)
      navigate('/')
    } catch (err) {
      setServerErr(err.response?.data?.message || 'Sign in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, avatar: 'Max file size is 5MB' })); return
    }
    setAvatar(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const toggleInterest = (id) => {
    setInterests(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  return (
    <div className="auth-page">
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-orb auth-orb-3" />

      <Link to="/" className="auth-logo">AURA</Link>

      <div className="auth-card-wrap">
        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          transition={{ duration: 0.5, ease: [0.34, 1.2, 0.64, 1] }}
        >
          {/* ── LOGIN ── */}
          {mode === 'login' && (
            <div className="auth-inner">
              <div className="auth-head">
                <div className="auth-title">Welcome</div>
                <div className="auth-title-script">back.</div>
                <p className="auth-subtitle" style={{ marginTop: 8 }}>Sign in to your AURA account</p>
              </div>

              <a href={GOOGLE_URL} className="google-btn">
                <GoogleIcon />
                <span>Continue with Google</span>
              </a>

              <div className="auth-divider"><span>or</span></div>

              {serverErr && <p className="auth-server-error">{serverErr}</p>}

              <form onSubmit={handleLoginSubmit} className="auth-form">
                <FormInput label="Email or Username" icon={<MailIcon />} error={errors.loginId} required>
                  <input
                    className="auth-input"
                    placeholder="you@email.com or @username"
                    value={loginId}
                    onChange={e => setLoginId(e.target.value)}
                    autoComplete="username"
                  />
                </FormInput>

                <FormInput label="Password" icon={<LockIcon />} error={errors.loginPwd} required>
                  <input
                    className="auth-input"
                    type={showLPwd ? 'text' : 'password'}
                    placeholder="Your password"
                    value={loginPwd}
                    onChange={e => setLoginPwd(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button type="button" className="pwd-toggle" onClick={() => setShowLPwd(v => !v)}>
                    <EyeIcon open={showLPwd} />
                  </button>
                </FormInput>

                <div className="auth-forgot-row">
                  <Link to="/forgot-password" className="auth-forgot">Forgot password?</Link>
                </div>

                <motion.button
                  type="submit"
                  className="auth-submit-btn"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? 'Signing in…' : 'Sign In'}
                </motion.button>
              </form>

              <p className="auth-switch">
                Don't have an account?{' '}
                <button className="auth-switch-btn" onClick={() => { setMode('signup'); setStep(1); setErrors({}); setServerErr('') }}>
                  Create one
                </button>
              </p>
            </div>
          )}

          {/* ── SIGNUP ── */}
          {mode === 'signup' && (
            <div className="auth-inner">
              <div className="auth-progress-wrap">
                <div className="auth-progress-track">
                  <motion.div
                    className="auth-progress-fill"
                    animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                    transition={{ duration: 0.4, ease: [0.4,0,0.2,1] }}
                  />
                </div>
                <span className="auth-step-label">Step {step} of {TOTAL_STEPS}</span>
              </div>

              <AnimatePresence mode="wait" custom={dir}>
                {/* STEP 1 */}
                {step === 1 && (
                  <motion.div key="step1" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.32, ease: [0.4,0,0.2,1] }}>
                    <div className="auth-head">
                      <div className="auth-title">Join</div>
                      <div className="auth-title-big">AURA</div>
                      <div className="auth-title-script">for free.</div>
                      <p className="auth-subtitle" style={{ marginTop: 10 }}>Create your account in 3 quick steps</p>
                    </div>

                    <a href={GOOGLE_URL} className="google-btn">
                      <GoogleIcon />
                      <span>Continue with Google</span>
                    </a>

                    <div className="auth-divider"><span>or</span></div>

                    <div className="auth-form">
                      <div className="auth-row-2">
                        <FormInput label="Full Name" icon={<UserIcon />} error={errors.fullName} required>
                          <input className="auth-input" placeholder="John Doe" value={fullName} onChange={e => setFullName(e.target.value)} />
                        </FormInput>
                        <FormInput label="Username" icon={<AtIcon />} error={errors.username} hint="Letters, numbers, underscores only" required>
                          <input className="auth-input" placeholder="yourhandle" value={username} onChange={e => setUsername(e.target.value.toLowerCase())} />
                        </FormInput>
                      </div>

                      <FormInput label="Email Address" icon={<MailIcon />} error={errors.email} required>
                        <input className="auth-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
                      </FormInput>

                      <FormInput label="Password" icon={<LockIcon />} error={errors.password} required>
                        <input className="auth-input" type={showPwd ? 'text' : 'password'} placeholder="Create a strong password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
                        <button type="button" className="pwd-toggle" onClick={() => setShowPwd(v => !v)}><EyeIcon open={showPwd} /></button>
                      </FormInput>

                      {password && (
                        <motion.div className="pwd-strength-wrap" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                          <div className="pwd-strength-bars">
                            {[1,2,3,4,5].map(i => (
                              <motion.div key={i} className="pwd-bar" animate={{ background: i <= pwdStrength ? strengthColors[pwdStrength] : 'var(--s3)' }} transition={{ duration: 0.25 }} />
                            ))}
                          </div>
                          <span className="pwd-strength-label" style={{ color: strengthColors[pwdStrength] }}>{strengthLabels[pwdStrength]}</span>
                        </motion.div>
                      )}

                      {password && (
                        <motion.div className="pwd-rules" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          {pwdRules.map(r => (
                            <div key={r.label} className={`pwd-rule ${r.ok ? 'ok' : ''}`}>
                              <span className="pwd-rule-icon">{r.ok ? <CheckIcon /> : <XIcon />}</span>
                              {r.label}
                            </div>
                          ))}
                        </motion.div>
                      )}

                      <FormInput label="Confirm Password" icon={<LockIcon />} error={errors.confirmPwd} required>
                        <input className="auth-input" type={showCPwd ? 'text' : 'password'} placeholder="Repeat your password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} autoComplete="new-password" />
                        <button type="button" className="pwd-toggle" onClick={() => setShowCPwd(v => !v)}><EyeIcon open={showCPwd} /></button>
                      </FormInput>

                      <div className="auth-terms-row">
                        <button type="button" className={`auth-checkbox ${agreed ? 'checked' : ''}`} onClick={() => setAgreed(v => !v)}>
                          {agreed && <CheckIcon />}
                        </button>
                        <span className="auth-terms-text">
                          I agree to the{' '}<Link to="/terms" className="auth-link">Terms of Service</Link>{' '}and{' '}<Link to="/privacy" className="auth-link">Privacy Policy</Link>
                        </span>
                      </div>
                      {errors.agreed && <p className="auth-field-error">{errors.agreed}</p>}

                      <motion.button type="button" className="auth-submit-btn" onClick={handleStep1Next} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        Continue →
                      </motion.button>
                    </div>

                    <p className="auth-switch">
                      Already have an account?{' '}
                      <button className="auth-switch-btn" onClick={() => { setMode('login'); setErrors({}); setServerErr('') }}>Sign in</button>
                    </p>
                  </motion.div>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                  <motion.div key="step2" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.32, ease: [0.4,0,0.2,1] }}>
                    <div className="auth-head">
                      <div className="auth-title">Tell us about</div>
                      <div className="auth-title-big">yourself.</div>
                      <p className="auth-subtitle" style={{ marginTop: 8 }}>Quick profile setup</p>
                    </div>

                    <div className="auth-form">
                      <div className="avatar-upload-wrap">
                        <div className="avatar-upload-circle" onClick={() => fileRef.current?.click()}>
                          {avatarPreview
                            ? <img src={avatarPreview} alt="avatar" className="avatar-preview-img" />
                            : <CameraIcon />
                          }
                          <div className="avatar-upload-overlay"><CameraIcon /></div>
                        </div>
                        <div className="avatar-upload-info">
                          <p className="avatar-upload-label">Profile Photo</p>
                          <p className="avatar-upload-hint">Optional · JPG, PNG, WebP · Max 5MB</p>
                          {errors.avatar && <p className="auth-field-error">{errors.avatar}</p>}
                        </div>
                        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleAvatarChange} />
                      </div>

                      <div className="auth-row-2">
                        <FormInput label="Date of Birth" error={errors.dob} required>
                          <input className="auth-input" type="date" value={dob} onChange={e => setDob(e.target.value)} max={new Date(Date.now() - 13*365.25*24*60*60*1000).toISOString().split('T')[0]} />
                        </FormInput>
                        <FormInput label="Gender">
                          <select className="auth-input auth-select" value={gender} onChange={e => setGender(e.target.value)}>
                            <option value="">Prefer not to say</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="nonbinary">Non-binary</option>
                            <option value="other">Other</option>
                          </select>
                          <span className="select-chevron"><ChevronDown /></span>
                        </FormInput>
                      </div>

                      <FormInput label="Country" error={errors.country} required>
                        <select className="auth-input auth-select" value={country} onChange={e => setCountry(e.target.value)}>
                          <option value="">Select your country</option>
                          {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <span className="select-chevron"><ChevronDown /></span>
                      </FormInput>

                      <div className="auth-step-btns">
                        <button type="button" className="auth-back-btn" onClick={() => goNext(-1)}>← Back</button>
                        <motion.button type="button" className="auth-submit-btn" onClick={handleStep2Next} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ flex: 1 }}>
                          Continue →
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3 — interests only */}
                {step === 3 && (
                  <motion.div key="step3" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.32, ease: [0.4,0,0.2,1] }}>
                    <div className="auth-head">
                      <div className="auth-title">What do you</div>
                      <div className="auth-title-big">love</div>
                      <div className="auth-title-script">watching?</div>
                      <p className="auth-subtitle" style={{ marginTop: 8 }}>Pick at least 3 — we'll personalise your feed</p>
                    </div>

                    <div className="auth-form">
                      <div className="interest-grid">
                        {CATEGORIES.map(cat => (
                          <motion.button
                            key={cat.id}
                            type="button"
                            className={`interest-chip ${interests.includes(cat.id) ? 'selected' : ''}`}
                            onClick={() => toggleInterest(cat.id)}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                          >
                            <span className="interest-emoji">{cat.emoji}</span>
                            <span>{cat.label}</span>
                            {interests.includes(cat.id) && (
                              <motion.span className="interest-check" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                                <CheckIcon />
                              </motion.span>
                            )}
                          </motion.button>
                        ))}
                      </div>
                      {errors.interests && <p className="auth-field-error">{errors.interests}</p>}

                      {serverErr && <p className="auth-server-error" style={{ marginTop: 12 }}>{serverErr}</p>}

                      <div className="auth-step-btns" style={{ marginTop: 24 }}>
                        <button type="button" className="auth-back-btn" onClick={() => goNext(-1)}>← Back</button>
                        <motion.button
                          type="button"
                          className="auth-submit-btn"
                          onClick={handleStep3Submit}
                          disabled={loading}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          style={{ flex: 1 }}
                        >
                          {loading ? 'Creating account…' : 'Join AURA 🎉'}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}