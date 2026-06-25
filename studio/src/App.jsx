// studio/src/App.jsx
import { useState, useEffect } from 'react'
import { Routes, Route, useSearchParams } from 'react-router-dom'
import { useStudioAuth } from './context/StudioAuthContext'
import StudioLayout   from './components/StudioLayout/StudioLayout'
import StudioLogin    from './pages/StudioLogin/StudioLogin'
import CreateModal    from './components/CreateModal/CreateModal'
import PermissionsGate from './components/PermissionsGate/PermissionsGate'

// ── Core pages ──────────────────────────────────────────────────
import Dashboard      from './pages/Dashboard/Dashboard'
import Content        from './pages/Content/Content'
import Analytics      from './pages/Analytics/Analytics'
import Comments       from './pages/Comments/Comments'
import Subtitles      from './pages/Subtitles/Subtitles'
import VideoEdit      from './pages/VideoEdit/VideoEdit'
import VideoAnalytics from './pages/VideoAnalytics/VideoAnalytics'
import Customization  from './pages/Customization/Customization'

// ── New pages ────────────────────────────────────────────────────
import Earn            from './pages/Earn/Earn'
import AudioLibrary    from './pages/AudioLibrary/AudioLibrary'
import ContentDetection from './pages/ContentDetection/ContentDetection'
import Settings        from './pages/Settings/Settings'
import SendFeedback    from './pages/SendFeedback/SendFeedback'
import Privacy         from './pages/Privacy/Privacy'
import Terms           from './pages/Terms/Terms'
import Help            from './pages/Help/Help'

import LiveControl  from './pages/LiveControl/LiveControl'
import LiveStreams   from './pages/LiveStreams/LiveStreams'

// ── Loading screen ───────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center',
      justifyContent:'center', background:'var(--st-bg)',
      flexDirection:'column', gap:16,
    }}>
      <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="10" fill="url(#lg)"/>
        <path d="M12 10l10 6-10 6V10z" fill="white"/>
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#b5294e"/>
            <stop offset="1" stopColor="#6654a8"/>
          </linearGradient>
        </defs>
      </svg>
      <div style={{ width:200, height:3, borderRadius:99, background:'var(--st-surf3)', overflow:'hidden' }}>
        <div style={{
          height:'100%', background:'linear-gradient(90deg,#b5294e,#6654a8)',
          borderRadius:99, animation:'sl-bar 1.2s ease-in-out infinite',
        }}/>
      </div>
      <style>{`@keyframes sl-bar{0%{width:0%;margin-left:0%}50%{width:60%;margin-left:20%}100%{width:0%;margin-left:100%}}`}</style>
    </div>
  )
}

// ── Main app (authenticated) ─────────────────────────────────────
function StudioApp() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showCreate, setShowCreate] = useState(false)

  // Open create modal if ?create=true in URL (linked from client sidebar)
  useEffect(() => {
    if (searchParams.get('create')) {
      setShowCreate(true)
      setSearchParams({})
    }
  }, []) // eslint-disable-line

  return (
    <>
      <Routes>
        <Route element={<StudioLayout onCreateOpen={() => setShowCreate(true)} />}>
          {/* ── Core ── */}
          <Route index                           element={<Dashboard />} />
          <Route path="content"                  element={<Content />} />
          <Route path="content/edit/:id"         element={<VideoEdit />} />
          <Route path="content/analytics/:id"    element={<VideoAnalytics />} />
          <Route path="analytics"                element={<Analytics />} />
          <Route path="comments"                 element={<Comments />} />
          <Route path="subtitles"                element={<Subtitles />} />

          {/* ── Monetisation & tools ── */}
          <Route path="monetization"             element={<Earn />} />
          <Route path="customization"            element={<Customization />} />
          <Route path="audio"                    element={<AudioLibrary />} />
          <Route path="copyright"                element={<ContentDetection />} />

          {/* ── Settings & legal ── */}
          <Route path="settings"                 element={<Settings />} />
          <Route path="feedback"                 element={<SendFeedback />} />
          <Route path="privacy"                  element={<Privacy />} />
          <Route path="terms"                    element={<Terms />} />
          <Route path="help"                     element={<Help />} />
          <Route path="live-streams"             element={<LiveStreams />} />
          <Route path="live/:id"                 element={<LiveControl />} />
        </Route>
      </Routes>

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}
      <PermissionsGate />
    </>
  )
}

// ── Root: auth gate ──────────────────────────────────────────────
export default function App() {
  const { user, loading } = useStudioAuth()

  if (loading) return <LoadingScreen />
  if (!user)   return <StudioLogin />
  return <StudioApp />
}