// src/App.jsx
import { useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

import { useAuth } from './context/AuthContext.jsx'
import AdminSidebar from './components/Sidebar/Sidebar.jsx'
import AdminNavbar  from './components/Navbar/Navbar.jsx'
import PermissionsGate from './components/PermissionsGate/PermissionsGate.jsx'

import Login          from './pages/Login/Login.jsx'
import Dashboard      from './pages/Dashboard/Dashboard.jsx'
import Users          from './pages/Users/Users.jsx'
import Videos         from './pages/Videos/Videos.jsx'
import Reports        from './pages/Reports/Reports.jsx'
import Comments       from './pages/Comments/Comments.jsx'
import LiveStreams     from './pages/LiveStreams/LiveStreams.jsx'
import Analytics      from './pages/Analytics/Analytics.jsx'
import Payments       from './pages/Payments/Payments.jsx'
import AdminSettings  from './pages/AdminSettings/AdminSettings.jsx'
import EarlyAccess    from './pages/EarlyAccess/EarlyAccess.jsx'

const pageVar = {
  initial: { opacity:0, y:10 },
  animate: { opacity:1, y:0, transition:{ duration:0.22, ease:[0.4,0,0.2,1] } },
  exit:    { opacity:0, y:-6, transition:{ duration:0.14 } },
}

function RequireAdmin({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12 }}>
        <div style={{ width:40, height:40, borderRadius:'50%', border:'3px solid var(--s3)', borderTopColor:'var(--a)', animation:'spin 0.8s linear infinite' }} />
        <div style={{ color:'var(--t3)', fontSize:'0.85rem' }}>Restoring session…</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (!user) return <Navigate to="/admin/login" state={{ from: location }} replace />
  if (!['admin','moderator'].includes(user.role)) return <Navigate to="/admin/login" replace />

  return children
}

function AdminShell() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const sidebarW = collapsed ? 64 : 240

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <AdminNavbar sidebarWidth={sidebarW} />
      <main style={{
        marginLeft: sidebarW,
        marginTop: 58,
        flex: 1,
        minHeight: 'calc(100vh - 58px)',
        transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)',
        position: 'relative',
        zIndex: 1,
      }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={location.pathname} variants={pageVar} initial="initial" animate="animate" exit="exit">
            <Routes location={location}>
              <Route path=""                element={<Dashboard />} />
              <Route path="users"           element={<Users />} />
              <Route path="videos"          element={<Videos />} />
              <Route path="reports"         element={<Reports />} />
              <Route path="comments"        element={<Comments />} />
              <Route path="livestreams"     element={<LiveStreams />} />
              <Route path="analytics"       element={<Analytics />} />
              <Route path="payments"        element={<Payments />} />
              <Route path="early-access"    element={<EarlyAccess />} />
              <Route path="settings"        element={<AdminSettings />} />
              <Route path="*"               element={<Dashboard />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
      <PermissionsGate />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin/*" element={
        <RequireAdmin>
          <AdminShell />
        </RequireAdmin>
      } />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}