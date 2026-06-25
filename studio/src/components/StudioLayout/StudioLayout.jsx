// studio/src/components/StudioLayout/StudioLayout.jsx
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import StudioNav     from '../StudioNav/StudioNav'
import StudioSidebar from '../StudioSidebar/StudioSidebar'
import './StudioLayout.css'

export default function StudioLayout({ onCreateOpen }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="st-layout">
      <StudioNav
        onMenuToggle={() => setSidebarOpen(p => !p)}
        onCreateOpen={onCreateOpen}
      />
      <div className="st-body">
        <StudioSidebar open={sidebarOpen} />
        <main className={`st-main${sidebarOpen ? '' : ' st-main-wide'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}