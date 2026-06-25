// studio/src/context/ThemeContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('aura-studio-theme') || 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('aura-studio-theme', theme)
  }, [theme])

  const toggle      = () => setTheme(t => t === 'dark' ? 'light' : 'dark')
  const setExplicit = (t) => setTheme(t)

  return (
    <ThemeContext.Provider value={{ theme, toggle, setExplicit, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
