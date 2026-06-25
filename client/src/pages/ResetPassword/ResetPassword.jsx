// FILE: client/src/pages/ResetPassword/ResetPassword.jsx
import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../services/api'
import './ResetPassword.css'

function getStrength(pwd) {
  let s = 0
  if (pwd.length >= 8)          s++
  if (/[A-Z]/.test(pwd))        s++
  if (/[a-z]/.test(pwd))        s++
  if (/[0-9]/.test(pwd))        s++
  if (/[^A-Za-z0-9]/.test(pwd)) s++
  return s
}
const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong']
const strengthColors = ['', '#a63c3c', '#b8882a', '#b8882a', '#2d9e6e', '#3d9e8c']

const EyeIcon = ({ open }) => open
  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>

export default function ResetPassword() {
  const [params]          = useSearchParams()
  const navigate          = useNavigate()
  const token             = params.get('token')

  const [password,    setPassword]    = useState('')
  const [confirm,     setConfirm]     = useState('')
  const [showPwd,     setShowPwd]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [done,        setDone]        = useState(false)
  const [error,       setError]       = useState('')

  useEffect(() => {
    if (!token) setError('Invalid reset link. Please request a new one.')
  }, [token])

  const strength = getStrength(password)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!token)           { setError('Invalid reset link.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (strength < 3)     { setError('Password is too weak.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, password })
      setDone(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rp-page">
      <div className="rp-orb rp-orb-1" />
      <div className="rp-orb rp-orb-2" />

      <Link to="/" className="rp-logo">AURA</Link>

      <div className="rp-wrap">
        <motion.div className="rp-card"
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          transition={{ duration: 0.45, ease: [0.34, 1.2, 0.64, 1] }}>

          <AnimatePresence mode="wait">

            {/* ── SUCCESS ── */}
            {done && (
              <motion.div key="done" style={{ textAlign: 'center' }}
                initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: [0.34, 1.2, 0.64, 1] }}>

                <motion.div className="rp-success-circle"
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </motion.div>

                <h2 className="rp-title" style={{ marginTop: 20 }}>Password updated!</h2>
                <p className="rp-subtitle" style={{ marginTop: 8 }}>
                  Your password has been reset successfully. You can now sign in with your new password.
                </p>

                <motion.button className="rp-btn" style={{ marginTop: 28 }}
                  onClick={() => navigate('/auth')}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  Go to sign in →
                </motion.button>
              </motion.div>
            )}

            {/* ── FORM ── */}
            {!done && (
              <motion.div key="form"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>

                <div className="rp-icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                </div>

                <h1 className="rp-title">Set new password</h1>
                <p className="rp-subtitle">Choose a strong password for your AURA account.</p>

                {error && (
                  <motion.p className="rp-server-error"
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                    {error}
                  </motion.p>
                )}

                <form onSubmit={handleSubmit} className="rp-form">

                  {/* New password */}
                  <div className="rp-field">
                    <label className="rp-label">New password <span className="rp-req">*</span></label>
                    <div className="rp-input-wrap">
                      <svg className="rp-input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                      </svg>
                      <input className="rp-input" type={showPwd ? 'text' : 'password'}
                        placeholder="Create a strong password" value={password}
                        onChange={e => { setPassword(e.target.value); setError('') }}
                        autoComplete="new-password" />
                      <button type="button" className="rp-eye" onClick={() => setShowPwd(v => !v)}>
                        <EyeIcon open={showPwd} />
                      </button>
                    </div>

                    {/* Strength bars */}
                    {password && (
                      <motion.div className="rp-strength" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="rp-bars">
                          {[1,2,3,4,5].map(i => (
                            <motion.div key={i} className="rp-bar"
                              animate={{ background: i <= strength ? strengthColors[strength] : 'var(--s3, #2a2a3e)' }}
                              transition={{ duration: 0.2 }} />
                          ))}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: strengthColors[strength] }}>
                          {strengthLabels[strength]}
                        </span>
                      </motion.div>
                    )}
                  </div>

                  {/* Confirm */}
                  <div className="rp-field">
                    <label className="rp-label">Confirm password <span className="rp-req">*</span></label>
                    <div className="rp-input-wrap">
                      <svg className="rp-input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                      </svg>
                      <input className="rp-input" type={showConfirm ? 'text' : 'password'}
                        placeholder="Repeat your password" value={confirm}
                        onChange={e => { setConfirm(e.target.value); setError('') }}
                        autoComplete="new-password" />
                      <button type="button" className="rp-eye" onClick={() => setShowConfirm(v => !v)}>
                        <EyeIcon open={showConfirm} />
                      </button>
                    </div>
                    {confirm && password !== confirm && (
                      <p className="rp-mismatch">Passwords do not match</p>
                    )}
                    {confirm && password === confirm && confirm.length > 0 && (
                      <p className="rp-match">✓ Passwords match</p>
                    )}
                  </div>

                  <motion.button type="submit" className="rp-btn"
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    disabled={loading || !token}>
                    {loading ? 'Resetting…' : 'Reset password'}
                  </motion.button>
                </form>

                <Link to="/forgot-password" className="rp-back">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                  Request a new link
                </Link>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}