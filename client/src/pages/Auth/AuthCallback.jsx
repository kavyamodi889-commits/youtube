// FILE: client/src/pages/Auth/AuthCallback.jsx
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

// Decode a JWT payload without verifying signature (safe — server already verified it)
function decodeJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch {
    return null
  }
}

export default function AuthCallback() {
  const [params]            = useSearchParams()
  const navigate            = useNavigate()
  const { login: ctxLogin } = useAuth()

  useEffect(() => {
    const token = params.get('token')
    const error = params.get('error')

    if (error || !token) {
      navigate('/auth?error=oauth_failed', { replace: true })
      return
    }

    // Store token immediately so api interceptor can use it
    window.__aura_access_token__ = token

    const finish = async () => {
      try {
        // Use token directly in header — don't rely on interceptor timing
        const res = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        ctxLogin(token, res.data.user)
        navigate('/', { replace: true })
      } catch (err) {
        // /auth/me failed — fall back to JWT payload for basic user object
        console.warn('[AuthCallback] /auth/me failed, using JWT payload fallback:', err.response?.status)
        const payload = decodeJwt(token)
        if (payload?.id) {
          // Log in with minimal user — full profile loads on next /auth/me call
          ctxLogin(token, { _id: payload.id })
          navigate('/', { replace: true })
        } else {
          window.__aura_access_token__ = null
          navigate('/auth?error=oauth_failed', { replace: true })
        }
      }
    }

    finish()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a14',
      flexDirection: 'column',
      gap: 16,
    }}>
      <div style={{
        width: 44, height: 44,
        border: '3px solid #2a2a3e',
        borderTop: '3px solid #b5294e',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: '#a09cbe', fontSize: '0.9rem', margin: 0 }}>Signing you in…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}