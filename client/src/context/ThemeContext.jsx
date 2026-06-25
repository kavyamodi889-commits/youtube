// FILE: client/src/context/ThemeContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Persist across sessions; default to dark
    return localStorage.getItem('aura-theme') || 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('aura-theme', theme)
  }, [theme])

  const toggle      = () => setTheme(t => t === 'dark' ? 'light' : 'dark')
  const setExplicit = (t) => setTheme(t)

  return (
    <ThemeContext.Provider value={{ theme, toggle, setExplicit, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}