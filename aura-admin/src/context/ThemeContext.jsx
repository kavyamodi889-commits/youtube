// src/context/ThemeContext.jsx
// Theme syncs from DB ONCE (on login/restore) and is ONLY saved back to DB
// when admin clicks "Save to DB". Navigating to Settings never changes the theme.

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import api from '../services/api.js'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(
    () => localStorage.getItem('aura_admin_theme') || 'dark'
  )
  const [saving, setSaving] = useState(false)
  const syncedRef = useRef(false)

  // Apply data-theme to <html> + keep localStorage in sync
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('aura_admin_theme', theme)
  }, [theme])

  // Called ONCE after login with the DB value — never overwrites after that
  const syncFromDB = useCallback((dbTheme) => {
    if (syncedRef.current) return
    if (!dbTheme || !['dark', 'light'].includes(dbTheme)) return
    syncedRef.current = true
    setThemeState(dbTheme)
  }, [])

  // Called from AdminSettings "Save to DB" button — applies + persists
  const setTheme = useCallback(async (newTheme) => {
    setThemeState(newTheme)
    setSaving(true)
    try {
      await api.patch('/admin-auth/theme', { theme: newTheme })
    } catch (err) {
      console.warn('[ThemeContext] DB save failed:', err.message)
    } finally {
      setSaving(false)
    }
  }, [])

  // Call on logout so next login re-syncs from fresh DB value
  const resetSync = useCallback(() => { syncedRef.current = false }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, saving, syncFromDB, resetSync }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)