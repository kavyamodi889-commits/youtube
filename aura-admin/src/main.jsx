// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, useTheme } from './context/ThemeContext.jsx'
import { AuthProvider }  from './context/AuthContext.jsx'
import App from './App.jsx'
import './styles/global.css'

// Bridge: sits inside ThemeProvider so it can access syncFromDB,
// then passes it into AuthProvider as the onUserLoaded callback.
function AppWithThemeSync() {
  const { syncFromDB } = useTheme()

  const handleUserLoaded = React.useCallback((admin) => {
    if (admin?.theme) syncFromDB(admin.theme)
  }, [syncFromDB])

  return (
    <AuthProvider onUserLoaded={handleUserLoaded}>
      <App />
    </AuthProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AppWithThemeSync />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)