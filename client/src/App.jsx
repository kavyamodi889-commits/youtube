// FILE: client/src/App.jsx
import { useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'

import Home          from './pages/Home/Home.jsx'
import Watch         from './pages/Watch/Watch.jsx'
import Shorts        from './pages/Shorts/Shorts.jsx'
import Search        from './pages/Search/Search.jsx'
import Channel       from './pages/Channel/Channel.jsx'
import Auth          from './pages/Auth/Auth.jsx'
import AuthCallback  from './pages/Auth/AuthCallback.jsx'
import ForgotPassword from './pages/ForgotPassword/ForgotPassword.jsx'
import ResetPassword  from './pages/ResetPassword/ResetPassword.jsx'
import NotFound      from './pages/NotFound/NotFound.jsx'

import Navbar   from './components/Navbar/Navbar.jsx'
import Sidebar  from './components/Sidebar/Sidebar.jsx'
import { BlinkPill, BreakModal } from './components/EyeProtection/EyeProtection.jsx'
import PermissionsGate from './components/PermissionsGate/PermissionsGate.jsx'

import Settings      from './pages/Settings/Settings.jsx'
import Trending      from './pages/Trending/Trending.jsx'
import FocusMode     from './pages/FocusMode/FocusMode.jsx'
import FocusWall     from './pages/FocusMode/FocusWall.jsx'
import Wellbeing     from './pages/Wellbeing/Wellbeing.jsx'
import History       from './pages/History/History.jsx'
import Playlists     from './pages/Playlists/Playlists.jsx'
import PlaylistDetail from './pages/Playlists/PlaylistDetail.jsx'
import WatchLater    from './pages/WatchLater/WatchLater.jsx'
import LikedVideos   from './pages/LikedVideos/LikedVideos.jsx'
import Downloads     from './pages/Downloads/Downloads.jsx'
import Subscriptions from './pages/Subscriptions/Subscriptions.jsx'
import Premium        from './pages/Premium/Premium.jsx'
import { LiveWatchPage } from './pages/Watch/Watch.jsx'
import MobileStream   from './pages/Live/MobileStream.jsx'

// More / Footer pages
import ReportHistory   from './pages/ReportHistory/ReportHistory.jsx'
import Help            from './pages/Help/Help.jsx'
import SendFeedback    from './pages/SendFeedback/SendFeedback.jsx'
import About           from './pages/About/About.jsx'
import Press           from './pages/Press/Press.jsx'
import Copyright       from './pages/Copyright/Copyright.jsx'
import ContactUs       from './pages/ContactUs/ContactUs.jsx'
import Creators        from './pages/Creators/Creators.jsx'
import Advertise       from './pages/Advertise/Advertise.jsx'
import Developers      from './pages/Developers/Developers.jsx'
import Terms           from './pages/Terms/Terms.jsx'
import Privacy         from './pages/Privacy/Privacy.jsx'
import PolicySafety    from './pages/PolicySafety/PolicySafety.jsx'
import HowAURAWorks    from './pages/HowAURAWorks/HowAURAWorks.jsx'
import TestNewFeatures from './pages/TestNewFeatures/TestNewFeatures.jsx'

import './styles/shared.css'

// Routes that render without Navbar/Sidebar (full-page bare layouts)
const BARE_ROUTES  = ['/auth', '/forgot-password', '/reset-password', '/focus-wall', '/stream-mobile']
const WATCH_ROUTES = ['/watch']

export default function App() {
  const location = useLocation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const isBare      = BARE_ROUTES.some(r  => location.pathname.startsWith(r))
  const isWatchPage = WATCH_ROUTES.some(r => location.pathname.startsWith(r))
  const isHomePage  = location.pathname === '/'

  const sidebarWidth = sidebarCollapsed ? 72 : 240
  const navbarH      = 58
  // Chips bar (category filter row) is only shown on the Home page
  const chipsH       = isHomePage ? 44 : 0
  const paddingTop   = isBare ? '0px' : `${navbarH + chipsH}px`
  // Sidebar always starts right below the navbar — never pushed down by chips bar
  const sidebarTop   = isBare ? 0 : navbarH

  return (
    <div className="app-root">
      {!isBare && (
        <Navbar
          onMenuClick={() => setSidebarCollapsed(c => !c)}
          sidebarCollapsed={sidebarCollapsed}
        />
      )}
      <div
        className={`app-body ${isBare ? '' : 'with-sidebar'}`}
        style={{ '--sidebar-top': `${sidebarTop}px` }}
      >
        {!isBare && <Sidebar collapsed={sidebarCollapsed} sidebarTop={sidebarTop} />}
        <main
          className="app-main"
          style={!isBare ? {
            marginLeft: sidebarWidth,
            paddingTop,
            transition: 'margin-left 0.35s cubic-bezier(0.4,0,0.2,1), padding-top 0.2s ease',
          } : {}}
        >
          <AnimatePresence mode="wait" initial={false}>
            <Routes location={location} key={location.pathname}>
              {/* Core */}
              <Route path="/"               element={<Home />} />
              <Route path="/watch/:id"      element={<Watch />} />
              <Route path="/live/:id"       element={<LiveWatchPage />} />
              <Route path="/stream-mobile"  element={<MobileStream />} />
              <Route path="/shorts"         element={<Shorts />} />
              <Route path="/search"         element={<Search />} />
              <Route path="/channel/:id"    element={<Channel />} />

              {/* Auth */}
              <Route path="/auth"           element={<Auth />} />
              <Route path="/auth/callback"  element={<AuthCallback />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password"  element={<ResetPassword />} />

              {/* You */}
              <Route path="/history"        element={<History />} />
              <Route path="/playlists"      element={<Playlists />} />
              <Route path="/playlists/:id"  element={<PlaylistDetail />} />
              <Route path="/watch-later"    element={<WatchLater />} />
              <Route path="/liked"          element={<LikedVideos />} />
              <Route path="/downloads"      element={<Downloads />} />
              <Route path="/subscriptions"  element={<Subscriptions />} />
              <Route path="/trending"       element={<Trending />} />

              {/* Focus & Wellbeing */}
              <Route path="/focus"          element={<FocusMode />} />
              <Route path="/focus-wall"     element={<FocusWall />} />
              <Route path="/wellbeing"      element={<Wellbeing />} />

              {/* Settings */}
              <Route path="/settings"       element={<Settings />} />
              {/* Premium */}
              <Route path="/premium"        element={<Premium />} />

              {/* More */}
              <Route path="/report-history" element={<ReportHistory />} />
              <Route path="/help"           element={<Help />} />
              <Route path="/send-feedback"  element={<SendFeedback />} />

              {/* Footer pages */}
              <Route path="/about"          element={<About />} />
              <Route path="/press"          element={<Press />} />
              <Route path="/copyright"      element={<Copyright />} />
              <Route path="/contact"        element={<ContactUs />} />
              <Route path="/creators"       element={<Creators />} />
              <Route path="/advertise"      element={<Advertise />} />
              <Route path="/developers"     element={<Developers />} />
              <Route path="/terms"          element={<Terms />} />
              <Route path="/privacy"        element={<Privacy />} />
              <Route path="/policy-safety"  element={<PolicySafety />} />
              <Route path="/how-aura-works" element={<HowAURAWorks />} />
              <Route path="/test-new-features" element={<TestNewFeatures />} />

              {/* 404 */}
              <Route path="*"               element={<NotFound />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>

      {/* ── Eye protection reminders — render on every page ── */}
      <BlinkPill />
      <BreakModal />

      {/* ── One-time permissions request ── */}
      <PermissionsGate />
    </div>
  )
}