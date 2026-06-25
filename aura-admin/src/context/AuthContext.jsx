// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children, onUserLoaded }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const restore = async () => {
      try {
        const r1  = await api.post('/admin-auth/refresh')
        const tok = r1.data.accessToken
        window.__aura_admin_token__ = tok

        const r2    = await api.get('/admin-auth/me')
        const admin = r2.data.admin

        setUser(admin)
        // Sync theme from DB once — fires after restore
        if (onUserLoaded) onUserLoaded(admin)
      } catch {
        window.__aura_admin_token__ = null
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    restore()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (identifier, password) => {
    const res   = await api.post('/admin-auth/login', { identifier, password })
    const tok   = res.data.accessToken
    const admin = res.data.admin

    window.__aura_admin_token__ = tok
    setUser(admin)
    // Sync theme from DB on login too
    if (onUserLoaded) onUserLoaded(admin)
    return admin
  }, [onUserLoaded])

  const logout = useCallback(async () => {
    try { await api.post('/admin-auth/logout') } catch {}
    window.__aura_admin_token__ = null
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}