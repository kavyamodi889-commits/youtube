// src/pages/LiveStreams/LiveStreams.jsx
import { useState } from 'react'
import { useAdminFetch, adminAction } from '../../hooks/useAdminAPI.js'
import ExportBar from '../../components/ExportBar/ExportBar.jsx'
import { exportLivePDF, exportLiveCSV } from '../../utils/exportReports.js'

const StopIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
const EyeIcon  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>

const fmt = n => n >= 1000 ? (n/1000).toFixed(1)+'K' : String(n||0)

function elapsed(startedAt) {
  const ms = Date.now() - new Date(startedAt).getTime()
  const h  = Math.floor(ms / 3600000)
  const m  = Math.floor((ms % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default function LiveStreams() {
  const [filter, setFilter] = useState('all')
  const [toast, setToast]   = useState('')

  const { data, loading, error, refetch } = useAdminFetch(
    '/admin/livestreams',
    { limit:50, status: filter === 'all' ? undefined : filter },
    [filter]
  )

  const streams         = data?.streams         || []
  const total           = data?.total           || 0
  const lifetimeViews   = data?.lifetimeViews   || 0
  const lifetimeDuration= data?.lifetimeDuration|| 0
  const totalAll        = data?.totalAll        || 0
  const live    = streams.filter(s => s.status === 'live')
  const viewers = live.reduce((s,st) => s + (st.currentViewers||0), 0)

  // Format lifetime duration (seconds) into readable string
  const fmtDur = (secs) => {
    if (!secs) return '0m'
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    if (h >= 1000) return `${(h/1000).toFixed(1)}K hrs`
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const endStream = async (id) => {
    try {
      await adminAction('patch', `/admin/livestreams/${id}/end`)
      showToast('Stream ended')
      refetch()
    } catch (e) { showToast('Error: ' + (e.response?.data?.message || e.message)) }
  }

  const exportRows = streams.map(s => ({
    title: s.title, streamer: s.host?.username||'—',
    status: s.status, viewers: s.currentViewers||0,
    category: s.category, startedAt: s.startedAt,
  }))

  return (
    <div className="admin-page">
      {toast && <div style={{ position:'fixed', bottom:24, right:24, background:'var(--s4)', borderRadius:'var(--r-md)', padding:'10px 18px', color:'var(--t1)', fontWeight:600, fontSize:'0.85rem', zIndex:999 }}>{toast}</div>}
      <div className="page-header">
        <div>
          <h1 className="page-title">Live Streams</h1>
          <p className="page-subtitle">{live.length} live now · {fmt(viewers)} watching now · {fmt(lifetimeViews)} lifetime views</p>
        </div>
        <ExportBar onPDF={() => exportLivePDF(exportRows)} onCSV={() => exportLiveCSV(exportRows)} />
      </div>

      {/* Summary cards */}
      <div className="stats-grid" style={{ gridTemplateColumns:'repeat(4,1fr)', marginBottom:24 }}>
        {[
          { label:'Live Now',           value: live.length },
          { label:'Lifetime Views',     value: fmt(lifetimeViews),     accent:'accent-b' },
          { label:'Total Live Streams', value: fmt(totalAll),          accent:'accent-c' },
          { label:'Live Stream Duration', value: fmtDur(lifetimeDuration), accent:'accent-gold' },
        ].map((s,i) => (
          <div key={i} className={`stat-card ${s.accent||''}`}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ fontSize:'1.6rem' }}>{loading?'…':s.value}</div>
          </div>
        ))}
      </div>

      {/* Active stream cards */}
      {live.length > 0 && (
        <div style={{ marginBottom:24 }}>
          <div className="section-title" style={{ marginBottom:12 }}>Currently Live</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
            {live.map(s => (
              <div key={s._id} className="glass-card" style={{ padding:'var(--sp-md)', border:'1px solid rgba(158,42,42,0.35)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                  <span className="badge red" style={{ animation:'pulse 1.5s infinite' }}>● LIVE</span>
                  <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'0.78rem', color:'var(--t3)' }}>{elapsed(s.startedAt)}</span>
                </div>
                {s.thumbnailUrl && <img src={s.thumbnailUrl} alt={s.title} style={{ width:'100%', height:120, objectFit:'cover', borderRadius:'var(--r-sm)', marginBottom:8 }} />}
                <div style={{ fontWeight:700, fontSize:'0.9rem', marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.title}</div>
                <div style={{ fontSize:'0.78rem', color:'var(--t2)', marginBottom:12 }}>
                  by @{s.host?.username||'—'} · {s.category}
                </div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.82rem' }}>
                    <EyeIcon />
                    <span style={{ fontWeight:700 }}>{fmt(s.currentViewers||0)}</span>
                    <span style={{ color:'var(--t3)' }}>watching</span>
                  </div>
                  <button className="action-btn danger" style={{ padding:'5px 10px', fontSize:'0.75rem', gap:5 }} onClick={() => endStream(s._id)}>
                    <StopIcon /> Force End
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All streams table */}
      <div className="table-toolbar" style={{ marginBottom:12 }}>
        <div className="filter-chips">
          {['all','live','ended'].map(f => (
            <button key={f} className={`filter-chip ${filter===f?'active':''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'40px 0', color:'var(--t3)' }}>Loading streams…</div>
      ) : error ? (
        <div style={{ color:'var(--err)', padding:40 }}>Error: {error}</div>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead><tr><th>Title</th><th>Streamer</th><th>Status</th><th>Viewers</th><th>Category</th><th>Started</th><th>Actions</th></tr></thead>
            <tbody>
              {streams.map(s => (
                <tr key={s._id}>
                  <td style={{ fontWeight:600, fontSize:'0.875rem', maxWidth:240, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.title}</td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div className="user-avatar">
                        {s.host?.avatar ? <img src={s.host.avatar} alt={s.host.username} /> : s.host?.username?.[0]?.toUpperCase()||'?'}
                      </div>
                      <span style={{ fontSize:'0.82rem' }}>@{s.host?.username||'—'}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${s.status==='live'?'red':'green'}`} style={s.status==='live'?{animation:'pulse 1.5s infinite'}:{}}>
                      {s.status==='live'?'● LIVE':'Ended'}
                    </span>
                  </td>
                  <td style={{ fontWeight:600 }}>{s.status==='live'?fmt(s.currentViewers||0):'—'}</td>
                  <td style={{ fontSize:'0.82rem', color:'var(--t2)' }}>{s.category}</td>
                  <td style={{ fontSize:'0.78rem', color:'var(--t3)' }}>
                    {new Date(s.startedAt).toLocaleString('en-IN',{ dateStyle:'medium', timeStyle:'short' })}
                  </td>
                  <td>
                    {s.status==='live' && (
                      <button className="icon-btn danger" title="Force end" onClick={() => endStream(s._id)}><StopIcon /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {streams.length === 0 && <div className="empty-state">No streams match your filter.</div>}
        </div>
      )}
    </div>
  )
}