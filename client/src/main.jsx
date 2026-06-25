// FILE: client/src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider }          from './context/AuthContext.jsx'
import { ThemeProvider }         from './context/ThemeContext.jsx'
import { StatsProvider }         from './context/StatsContext.jsx'
import { FocusProvider }         from './context/FocusContext.jsx'
import { EyeProtectionProvider } from './context/EyeProtectionContext.jsx'
import { SocketProvider }        from './context/SocketContext.jsx'
import './styles/global.css'
import './styles/light-mode.css'
import 'bootstrap/dist/css/bootstrap.min.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <StatsProvider>
              <FocusProvider>
                <EyeProtectionProvider>
                  <App />
                </EyeProtectionProvider>
              </FocusProvider>
            </StatsProvider>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
)