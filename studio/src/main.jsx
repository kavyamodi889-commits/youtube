// FILE: studio/src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { StudioAuthProvider } from './context/StudioAuthContext'
import App from './App.jsx'
import './styles/global.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider>
        <StudioAuthProvider>
          <App />
        </StudioAuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
)