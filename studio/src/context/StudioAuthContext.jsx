// FILE: studio/src/context/StudioAuthContext.jsx
import { createContext, useContext, useEffect, useState, useRef } from 'react'
import api from '../services/api'

const StudioAuthContext = createContext(null)

export function StudioAuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  const tokenRef = useRef(null)

  useEffect(() => {
    window.__studioTokenRef__ = tokenRef
  }, [])

  const setToken = (t) => {
    tokenRef.current = t
    window.__studio_access_token__ = t
  }

  useEffect(() => {
    api.post('/auth/refresh')
      .then(r => {
        const token = r.data.accessToken || r.data.data?.accessToken
        setToken(token)
        return api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
      })
      .then(r => {
        setUser(r.data.user || r.data.data?.user)
      })
      .catch(() => {
        setToken(null)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = (accessToken, userData) => {
    setToken(accessToken)
    setUser(userData)
  }

  const logout = async () => {
    try { await api.post('/auth/logout') } catch {}
    setToken(null)
    setUser(null)
  }

  const refreshToken = async () => {
    try {
      const r = await api.post('/auth/refresh')
      const token = r.data.accessToken || r.data.data?.accessToken
      setToken(token)
      return token
    } catch {
      setToken(null)
      setUser(null)
      return null
    }
  }

  return (
    <StudioAuthContext.Provider value={{ user, loading, setUser, login, logout, refreshToken }}>
      {children}
    </StudioAuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStudioAuth() {
  return useContext(StudioAuthContext)
}