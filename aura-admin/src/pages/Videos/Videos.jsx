// src/pages/Videos/Videos.jsx
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAdminFetch, adminAction } from '../../hooks/useAdminAPI.js'
import ExportBar from '../../components/ExportBar/ExportBar.jsx'
import FilterDropdown from '../../components/FilterDropdown/FilterDropdown.jsx'
import { exportVideosPDF, exportVideosCSV } from '../../utils/exportReports.js'

const SearchIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
const TrashIcon  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
const EyeIcon    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
const PlayIcon   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>

const STATUS_BADGE = { published:'green', unlisted:'yellow', private:'blue', deleted:'red', rejected:'red', processing:'yellow' }
const fmt = n => n >= 1e6 ? (n/1e6).toFixed(1)+'M' : n >= 1000 ? (n/1000).toFixed(0)+'K' : String(n||0)

// Dropdown 1: visibility statuses
const VISIBILITY_OPTIONS = [
  { value:'all',       label:'All Visibility' },
  { value:'published', label:'✅ Published' },
  { value:'unlisted',  label:'🔗 Unlisted' },
  { value:'private',   label:'🔒 Private' },
]

// Dropdown 2: moderation statuses
const MODERATION_OPTIONS = [
  { value:'all',      label:'All Moderation' },
  { value:'deleted',  label:'🗑 Deleted' },
  { value:'rejected', label:'❌ Rejected' },
  { value:'flagged',  label:'🚩 Flagged' },
]

export default function Videos() {
  const [page, setPage]       = useState(1)
  const [search, setSearch]   = useState('')
  const [searchQ, setSearchQ] = useState('')
  const [visibility, setVisibility] = useState('all')
  const [moderation, setModeration] = useState('all')
  const [preview, setPrev]    = useState(null)
  const [toast, setToast]     = useState('')

  // Compute API params from the two dropdowns
  const apiStatus = visibility !== 'all' ? visibility
    : moderation === 'deleted' ? 'deleted'
    : moderation === 'rejected' ? 'rejected'
    : undefined
  const apiFlagged = moderation === 'flagged' ? true : undefined

  const { data, loading, error, refetch } = useAdminFetch(
    '/admin/videos',
    { page, limit: 20, search: searchQ, status: apiStatus, flagged: apiFlagged },
    [page, searchQ, visibility, moderation]
  )

  const videos = data?.videos || []
  const total  = data?.total  || 0
  const pages  = data?.pages  || 1

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const setVStatus = async (id, newStatus) => {
    try {
      await adminAction('patch', `/admin/videos/${id}/status`, { status: newStatus })
      showToast(`Status set to ${newStatus}`)
      setPrev(null); refetch()
    } catch (e) { showToast('Error: ' + (e.response?.data?.message || e.message)) }
  }

  const unflag = async (id) => {
    try { await adminAction('patch', `/admin/videos/${id}/unflag`); showToast('Flag cleared'); refetch() }
    catch (e) { showToast('Error: ' + e.message) }
  }

  useEffect(() => {
    const t = setTimeout(() => { setSearchQ(search); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [search])

  return (
    <div className="admin-page">
      {toast && <div style={{ position:'fixed', bottom:24, right:24, background:'var(--s4)', borderRadius:'var(--r-md)', padding:'10px 18px', color:'var(--t1)', fontWeight:600, fontSize:'0.85rem', zIndex:999 }}>{toast}</div>}
      <div className="page-header">
        <div>
          <h1 className="page-title">Video Management</h1>
          <p className="page-subtitle">{total.toLocaleString()} total videos</p>
        </div>
        <ExportBar onPDF={() => exportVideosPDF(videos.map(v => ({ ...v, uploader: v.uploader?.username, views: v.viewCount, likes: v.likeCount })))} onCSV={() => exportVideosCSV(videos.map(v => ({ ...v, uploader: v.uploader?.username, views: v.viewCount, likes: v.likeCount })))} />
      </div>

      <div className="table-toolbar">
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          <FilterDropdown
            label="All Visibility"
            value={visibility}
            options={VISIBILITY_OPTIONS}
            onChange={v => { setVisibility(v); if(v!=='all') setModeration('all'); setPage(1) }}
          />
          <FilterDropdown
            label="All Moderation"
            value={moderation}
            options={MODERATION_OPTIONS}
            onChange={v => { setModeration(v); if(v!=='all') setVisibility('all'); setPage(1) }}
          />
        </div>
        <div className="admin-search"><SearchIcon /><input placeholder="Search title…" value={search} onChange={e => setSearch(e.target.value)} /></div>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'var(--t3)' }}>Loading videos…</div>
      ) : error ? (
        <div style={{ color:'var(--err)', padding:40 }}>Error: {error}</div>
      ) : (
        <>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead><tr><th>Video</th><th>Uploader</th><th>Views</th><th>Likes</th><th>Status</th><th>Category</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                {videos.map(v => (
                  <tr key={v._id} style={v.flagged ? { background:'rgba(166,60,60,0.06)' } : {}}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div className="video-thumb">
                          {v.thumbnailUrl ? <img src={v.thumbnailUrl} alt={v.title} /> : <PlayIcon />}
                        </div>
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontWeight:600, fontSize:'0.82rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:220 }}>{v.title}</div>
                          {v.isLiveVOD && (
                            <div style={{ display:'inline-flex', alignItems:'center', gap:4, marginTop:3, padding:'1px 6px', borderRadius:4, background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.3)', fontSize:'0.65rem', fontWeight:700, color:'#ef4444', letterSpacing:'0.5px' }}>
                              📡 LIVE REC
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize:'0.82rem' }}>@{v.uploader?.username || '—'}</td>
                    <td style={{ fontWeight:600 }}>{fmt(v.viewCount)}</td>
                    <td>{fmt(v.likeCount)}</td>
                    <td>
                      <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                        <span className={`badge ${STATUS_BADGE[v.status]||'blue'}`}>{v.status}</span>
                        {v.flagged && <span className="badge red">🚩</span>}
                      </div>
                    </td>
                    <td style={{ fontSize:'0.8rem', color:'var(--t2)' }}>{v.category}</td>
                    <td style={{ fontSize:'0.78rem', color:'var(--t3)' }}>{new Date(v.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td>
                    <td>
                      <div style={{ display:'flex', gap:4 }}>
                        <button className="icon-btn" title="Details" onClick={() => setPrev(v)}><EyeIcon /></button>
                        {v.flagged && <button className="icon-btn success" title="Clear flag" onClick={() => unflag(v._id)}>✓</button>}
                        {v.status !== 'deleted' && v.status !== 'rejected' && <button className="icon-btn danger" title="Remove" onClick={() => setVStatus(v._id, 'deleted')}><TrashIcon /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {videos.length === 0 && <div className="empty-state">No videos match your filter.</div>}
          {pages > 1 && (
            <div className="pagination">
              <button className="page-btn" onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1}>‹</button>
              {Array.from({ length: Math.min(7,pages) },(_,i)=>{ const p=page<=4?i+1:page-3+i; if(p<1||p>pages)return null; return <button key={p} className={`page-btn ${page===p?'active':''}`} onClick={()=>setPage(p)}>{p}</button> })}
              <button className="page-btn" onClick={() => setPage(p=>Math.min(pages,p+1))} disabled={page===pages}>›</button>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {preview && (
          <div className="modal-overlay" onClick={() => setPrev(null)}>
            <motion.div className="modal-box" style={{ maxWidth:500 }} onClick={e=>e.stopPropagation()} initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}>
              <div className="modal-title" style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{preview.title}</div>
              {preview.thumbnailUrl && <img src={preview.thumbnailUrl} alt={preview.title} style={{ width:'100%', borderRadius:'var(--r-md)', marginBottom:16, maxHeight:200, objectFit:'cover' }} />}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, fontSize:'0.82rem', marginBottom:16 }}>
                {[['Uploader','@'+(preview.uploader?.username||'—')],['Status',preview.status],['Views',fmt(preview.viewCount)],['Likes',fmt(preview.likeCount)],['Category',preview.category||'—'],['Flagged',preview.flagged?'Yes':'No'],['Source',preview.isLiveVOD?'📡 Live Recording':'Regular Upload']].map(([k,v])=>(
                  <div key={k} style={{ background:'var(--s2)', padding:'8px 12px', borderRadius:'var(--r-sm)' }}>
                    <div style={{ fontSize:'0.7rem', color:'var(--t3)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:2 }}>{k}</div>
                    <div style={{ fontWeight:600 }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:8 }}>
                {['published','unlisted','private','deleted','rejected'].map(s => (
                  <button key={s} className={`action-btn ${s==='deleted'||s==='rejected'?'danger':'secondary'}`} onClick={() => setVStatus(preview._id, s)}>
                    → {s}
                  </button>
                ))}
              </div>
              <div className="modal-actions"><button className="action-btn secondary" onClick={() => setPrev(null)}>Close</button></div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}