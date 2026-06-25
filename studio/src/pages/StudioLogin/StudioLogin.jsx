// studio/src/pages/StudioLogin/StudioLogin.jsx
// Shown when user visits Studio directly without being logged into the client
import { useState } from 'react'
import api from '../../services/api'
import { useStudioAuth } from '../../context/StudioAuthContext'
import './StudioLogin.css'

const EyeOpenIco  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
const EyeCloseIco = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
const GoogleIco   = () => <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>

export default function StudioLogin() {
  const { login } = useStudioAuth()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) { setError('Please fill in all fields'); return }
    setLoading(true)
    setError('')
    try {
      const r = await api.post('/auth/login', { email, password })
      // Server returns accessToken in body + sets refreshToken cookie
      login(r.data.accessToken, r.data.user)
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = () => {
    // Pass state=studio so the server knows to redirect back to Studio after auth
    window.location.href = 'http://localhost:5000/api/auth/google?state=studio'
  }

  return (
    <div className="sl-page">
      {/* Background gradient */}
      <div className="sl-bg" />

      <div className="sl-card">
        {/* Logo */}
        <div className="sl-logo">
          <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="10" fill="url(#slg)"/>
            <path d="M12 10l10 6-10 6V10z" fill="white"/>
            <defs>
              <linearGradient id="slg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="#b5294e"/>
                <stop offset="1" stopColor="#6654a8"/>
              </linearGradient>
            </defs>
          </svg>
          <div className="sl-logo-text">
            <span className="sl-logo-aura">AURA</span>
            <span className="sl-logo-studio">Studio</span>
          </div>
        </div>

        <h1 className="sl-title">Sign in to Studio</h1>
        <p className="sl-sub">
          Already signed into AURA?{' '}
          <a href="http://localhost:5173" className="sl-sub-link">
            Open the client first →
          </a>
        </p>

        {error && <div className="sl-error">{error}</div>}

        <form className="sl-form" onSubmit={handleSubmit}>
          <div className="sl-field">
            <label className="sl-label">Email</label>
            <input
              type="email"
              className="sl-input"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="sl-field">
            <label className="sl-label">Password</label>
            <div className="sl-pw-wrap">
              <input
                type={showPw ? 'text' : 'password'}
                className="sl-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="sl-pw-toggle"
                onClick={() => setShowPw(v => !v)}
                tabIndex={-1}
              >
                {showPw ? <EyeCloseIco /> : <EyeOpenIco />}
              </button>
            </div>
          </div>

          <button type="submit" className="sl-btn-primary" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="sl-divider"><span>or</span></div>

        <button className="sl-btn-google" onClick={handleGoogle}>
          <GoogleIco />
          Continue with Google
        </button>

        <p className="sl-footer">
          Don't have an account?{' '}
          <a href="http://localhost:5173/auth" className="sl-sub-link">
            Sign up on AURA
          </a>
        </p>
      </div>
    </div>
  )
}