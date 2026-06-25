// FILE: client/src/pages/ForgotPassword/ForgotPassword.jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../services/api'
import './ForgotPassword.css'

export default function ForgotPassword() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address')
      return
    }
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() })
    } catch {
      // intentionally swallow — always show success to avoid email enumeration
    } finally {
      setSent(true)
      setLoading(false)
    }
  }

  return (
    <div className="fp-page">
      <div className="fp-orb fp-orb-1" />
      <div className="fp-orb fp-orb-2" />

      <Link to="/" className="fp-logo">AURA</Link>

      <div className="fp-wrap">
        <motion.div
          className="fp-card"
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          transition={{ duration: 0.45, ease: [0.34, 1.2, 0.64, 1] }}
        >
          <AnimatePresence mode="wait">

            {/* ── FORM ── */}
            {!sent && (
              <motion.div key="form"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>

                <div className="fp-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>

                <h1 className="fp-title">Forgot password?</h1>
                <p className="fp-subtitle">Enter your email and we'll send you a reset link.</p>

                <form onSubmit={handleSubmit} className="fp-form">
                  <div className="fp-field">
                    <label className="fp-label">Email address <span className="fp-req">*</span></label>
                    <div className={`fp-input-wrap ${error ? 'has-error' : ''}`}>
                      <svg className="fp-input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                      <input
                        className="fp-input"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setError('') }}
                        autoFocus
                        autoComplete="email"
                      />
                    </div>
                    {error && <p className="fp-error">{error}</p>}
                  </div>

                  <motion.button
                    type="submit" className="fp-btn"
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    disabled={loading}
                  >
                    {loading ? 'Sending…' : 'Send reset link'}
                  </motion.button>
                </form>

                <Link to="/auth" className="fp-back">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                  Back to sign in
                </Link>
              </motion.div>
            )}

            {/* ── SENT ── */}
            {sent && (
              <motion.div key="sent"
                initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: [0.34, 1.2, 0.64, 1] }}
                style={{ textAlign: 'center' }}>

                <motion.div className="fp-success-circle"
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </motion.div>

                <h2 className="fp-title" style={{ marginTop: 20 }}>Check your inbox</h2>
                <p className="fp-subtitle" style={{ marginTop: 8 }}>
                  If <strong>{email}</strong> is registered on AURA, a reset link is on its way. Check your spam folder too.
                </p>

                <motion.button className="fp-btn" style={{ marginTop: 28 }}
                  onClick={() => { setSent(false); setEmail('') }}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  Try a different email
                </motion.button>

                <Link to="/auth" className="fp-back" style={{ display: 'block', marginTop: 16 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                  Back to sign in
                </Link>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}