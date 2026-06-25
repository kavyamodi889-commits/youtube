// src/pages/Login/Login.jsx
// Authenticates against AdminUser collection via /api/admin-auth/login
// Field: "identifier" (email or username)

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext.jsx'

export default function Login() {
  const { login }              = useAuth()
  const navigate               = useNavigate()
  const [identifier, setIdent] = useState('')
  const [pass, setPass]        = useState('')
  const [error, setError]      = useState('')
  const [loading, setLoad]     = useState(false)
  const [show, setShow]        = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!identifier.trim()) { setError('Email or username is required'); return }
    if (!pass.trim())       { setError('Password is required'); return }
    setLoad(true)
    try {
      await login(identifier.trim(), pass)
      navigate('/admin')
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed'
      setError(msg)
    } finally {
      setLoad(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'var(--sp-md)' }}>
      <motion.div
        initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }}
        style={{
          width:'100%', maxWidth:400,
          background:'rgba(255,255,255,0.04)',
          border:'1px solid var(--s4)',
          borderRadius:'var(--r-xl)',
          padding:'var(--sp-2xl)',
          backdropFilter:'blur(20px)',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:'var(--sp-xl)' }}>
          <div style={{
            width:52, height:52, borderRadius:'var(--r-md)',
            background:'var(--a-dim)', border:'1px solid var(--a-border)',
            display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="var(--a)" strokeWidth="2"/>
              <path d="M12 6 L16 12 L12 18 L8 12 Z" fill="var(--a)" opacity="0.8"/>
            </svg>
          </div>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:'1.5rem', fontWeight:800, color:'var(--t1)', letterSpacing:'1px' }}>AURA</div>
          <div style={{ fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'2.5px', color:'var(--a)', marginTop:2 }}>Admin Portal</div>
        </div>

        <p style={{ textAlign:'center', fontSize:'0.82rem', color:'var(--t3)', marginBottom:'var(--sp-lg)' }}>
          Sign in to the admin panel
        </p>

        {error && (
          <div style={{
            background:'rgba(166,60,60,0.15)', border:'1px solid rgba(166,60,60,0.35)',
            borderRadius:'var(--r-sm)', padding:'10px 14px',
            color:'#f87171', fontSize:'0.82rem', marginBottom:'var(--sp-md)', lineHeight:1.5,
          }}>{error}</div>
        )}

        <form onSubmit={submit}>
          <div className="field-group">
            <div className="field-label">Email or Username</div>
            <input
              className="field-input" type="text" required autoComplete="username"
              placeholder="admin@aura.com or username"
              value={identifier} onChange={e => setIdent(e.target.value)}
            />
          </div>
          <div className="field-group" style={{ position:'relative' }}>
            <div className="field-label">Password</div>
            <input
              className="field-input" type={show?'text':'password'} required
              autoComplete="current-password" placeholder="••••••••"
              value={pass} onChange={e => setPass(e.target.value)}
              style={{ paddingRight:40 }}
            />
            <button type="button" onClick={() => setShow(s=>!s)}
              style={{ position:'absolute', right:10, bottom:9, background:'none', border:'none', color:'var(--t3)', cursor:'pointer', fontSize:14 }}>
              {show ? '🙈' : '👁'}
            </button>
          </div>
          <motion.button type="submit" disabled={loading} whileTap={{ scale:0.97 }}
            className="action-btn primary"
            style={{ width:'100%', justifyContent:'center', marginTop:8, padding:'11px', fontSize:'0.9rem', opacity:loading?0.7:1 }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </motion.button>
        </form>

        {/* Credential reminder box */}
        <div style={{
          marginTop:'var(--sp-lg)', background:'var(--s1)', border:'1px solid var(--s3)',
          borderRadius:'var(--r-md)', padding:'12px 14px', fontSize:'0.78rem', color:'var(--t3)', lineHeight:1.7,
        }}>
          <div style={{ fontWeight:700, color:'var(--t2)', marginBottom:4 }}>Admin credentials</div>
          <div>Use the email + password you set in <code style={{ background:'var(--s3)', padding:'1px 5px', borderRadius:3, fontSize:'0.72rem' }}>scripts/seed-admin.js</code></div>
          <div style={{ marginTop:6, color:'var(--a)', fontSize:'0.72rem' }}>
            ⚠ Run <code style={{ background:'var(--s3)', padding:'1px 5px', borderRadius:3 }}>node scripts/seed-admin.js</code> first if you haven't already.
          </div>
        </div>
      </motion.div>
    </div>
  )
}
