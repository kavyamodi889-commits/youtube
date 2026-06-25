// src/pages/Reports/Reports.jsx
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAdminFetch, adminAction } from '../../hooks/useAdminAPI.js'
import ExportBar from '../../components/ExportBar/ExportBar.jsx'
import FilterDropdown from '../../components/FilterDropdown/FilterDropdown.jsx'
import { exportReportsPDF, exportReportsCSV } from '../../utils/exportReports.js'

const EyeIcon   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
const CheckIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const XIcon     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>

const REASON_COLOR = { spam:'yellow', harassment:'red', hateSpeech:'red', misinformation:'yellow', violence:'red', sexualContent:'red', copyright:'blue', childSafety:'red', privacyViolation:'yellow', other:'blue' }
const STATUS_BADGE = { pending:'yellow', reviewed:'blue', actioned:'red', dismissed:'green' }
const TYPE_BADGE   = { Video:'blue', Comment:'teal', User:'rose', LiveStream:'red', ChatMessage:'yellow' }

const STATUS_OPTIONS = [
  { value:'all',       label:'All Statuses' },
  { value:'pending',   label:'🟡 Pending' },
  { value:'reviewed',  label:'🔵 Reviewed' },
  { value:'actioned',  label:'🔴 Actioned' },
  { value:'dismissed', label:'✅ Dismissed' },
]

const TYPE_OPTIONS = [
  { value:'all',        label:'All Types' },
  { value:'Video',      label:'🎬 Video' },
  { value:'Comment',    label:'💬 Comment' },
  { value:'User',       label:'👤 User' },
  { value:'LiveStream', label:'📡 LiveStream' },
]

function ReviewModal({ report, onClose, onAction }) {
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const act = async (action) => {
    setBusy(true)
    try { await onAction(report._id, action, note) }
    finally { setBusy(false) }
  }

  const actions = [
    { key:'dismiss', label:'Dismiss',       cls:'secondary', desc:'No violation found', icon:'✕' },
    { key:'warn',    label:'Warn User',      cls:'secondary', desc:'Send a warning',     icon:'⚠' },
    { key:'delete',  label:'Delete Content', cls:'danger',    desc:'Remove the content', icon:'🗑' },
    { key:'ban',     label:'Ban User',       cls:'danger',    desc:'Ban the account',    icon:'🚫' },
  ]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div className="modal-box" style={{ maxWidth:520 }} onClick={e => e.stopPropagation()}
        initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}>
        <div className="modal-title">Review Report</div>

        {/* Report summary */}
        <div style={{ background:'var(--s2)', borderRadius:'var(--r-md)', padding:'var(--sp-md)', marginBottom:16, fontSize:'0.875rem' }}>
          <div style={{ display:'flex', gap:6, marginBottom:8, flexWrap:'wrap' }}>
            <span className={`badge ${TYPE_BADGE[report.targetType]||'blue'}`}>{report.targetType}</span>
            <span className={`badge ${REASON_COLOR[report.reason]||'blue'}`}>{report.reason}</span>
            <span className={`badge ${STATUS_BADGE[report.status]||'blue'}`}>{report.status}</span>
          </div>
          {report.targetTitle && (
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, padding:'8px 10px', background:'var(--s2)', borderRadius:'var(--r-sm)' }}>
              {report.targetThumbnail && (
                <div style={{ flexShrink:0, width:56, height:36, borderRadius:4, overflow:'hidden', background:'var(--s3)' }}>
                  <img src={report.targetThumbnail} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                </div>
              )}
              <div>
                <div style={{ fontSize:'0.7rem', color:'var(--t3)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:2 }}>Reported content</div>
                <div style={{ fontSize:'0.83rem', fontWeight:700, color:'var(--t1)' }}>{report.targetTitle}</div>
              </div>
            </div>
          )}
          <div style={{ fontWeight:600, marginBottom:4 }}>{report.description || '(no description)'}</div>
          <div style={{ color:'var(--t3)', fontSize:'0.75rem', marginTop:6 }}>
            Reported by @{report.reporter?.username || 'unknown'} · {new Date(report.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
          </div>
          {report.reviewNote && (
            <div style={{ marginTop:8, padding:'6px 10px', background:'var(--s3)', borderRadius:'var(--r-sm)', fontSize:'0.78rem', color:'var(--t2)' }}>
              📝 Note: {report.reviewNote}
            </div>
          )}
        </div>

        <div className="field-group">
          <div className="field-label">Review Note (optional)</div>
          <textarea className="field-input" rows={2} style={{ resize:'vertical' }} value={note} onChange={e => setNote(e.target.value)} placeholder="Internal note about this decision…" />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {actions.map(a => (
            <button key={a.key} disabled={busy} className={`action-btn ${a.cls}`}
              style={{ flexDirection:'column', alignItems:'flex-start', height:'auto', padding:'10px 12px', opacity: busy ? 0.6 : 1 }}
              onClick={() => act(a.key)}>
              <span style={{ fontWeight:700 }}>{a.icon} {a.label}</span>
              <span style={{ fontSize:'0.7rem', opacity:0.7, fontWeight:400 }}>{a.desc}</span>
            </button>
          ))}
        </div>

        <div className="modal-actions" style={{ marginTop:12 }}>
          <button className="action-btn secondary" onClick={onClose}>Cancel</button>
        </div>
      </motion.div>
    </div>
  )
}

export default function Reports() {
  const [page, setPage]        = useState(1)
  const [status, setStatus]    = useState('all')
  const [targetType, setType]  = useState('all')
  const [reviewTarget, setRev] = useState(null)
  const [toast, setToast]      = useState('')

  const { data, loading, error, refetch } = useAdminFetch(
    '/admin/reports',
    { page, limit:20, status: status === 'all' ? undefined : status, targetType: targetType === 'all' ? undefined : targetType },
    [page, status, targetType]
  )

  const reports = data?.reports || []
  const total   = data?.total   || 0
  const pages   = data?.pages   || 1
  const pending = reports.filter(r => r.status === 'pending').length

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const handleAction = async (id, action, note) => {
    try {
      await adminAction('patch', `/admin/reports/${id}/action`, { action, reviewNote: note })
      showToast(action === 'dismiss' ? '✅ Report dismissed' : `✅ Action taken: ${action}`)
      setRev(null); refetch()
    } catch (e) { showToast('Error: ' + (e.response?.data?.message || e.message)) }
  }

  const quickAction = async (id, action) => {
    try {
      await adminAction('patch', `/admin/reports/${id}/action`, { action, reviewNote: 'Quick action' })
      showToast(action === 'dismiss' ? '✅ Dismissed' : '✅ Actioned')
      refetch()
    } catch (e) { showToast('Error: ' + e.message) }
  }

  return (
    <div className="admin-page">
      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, background:'var(--s4)', borderRadius:'var(--r-md)', padding:'10px 18px', color:'var(--t1)', fontWeight:600, fontSize:'0.85rem', zIndex:999, boxShadow:'0 8px 32px rgba(0,0,0,0.4)' }}>
          {toast}
        </div>
      )}
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Moderation</h1>
          <p className="page-subtitle">{total.toLocaleString()} total reports</p>
        </div>
        <ExportBar onPDF={() => exportReportsPDF(reports.map(r => ({ ...r, reporter: r.reporter?.username, targetTitle: r.description })))} onCSV={() => exportReportsCSV(reports.map(r => ({ ...r, reporter: r.reporter?.username, targetTitle: r.description })))} />
      </div>

      {pending > 0 && (
        <div style={{ background:'rgba(166,60,60,0.1)', border:'1px solid rgba(166,60,60,0.3)', borderRadius:'var(--r-md)', padding:'12px 16px', marginBottom:20, display:'flex', gap:10, alignItems:'center' }}>
          <span style={{ color:'#f87171', fontWeight:700 }}>⚠ {pending} report{pending>1?'s':''} need review on this page</span>
        </div>
      )}

      <div className="table-toolbar">
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          <FilterDropdown label="All Statuses" value={status}     options={STATUS_OPTIONS} onChange={v=>{ setStatus(v); setPage(1) }} />
          <FilterDropdown label="All Types"    value={targetType} options={TYPE_OPTIONS}   onChange={v=>{ setType(v);   setPage(1) }} />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'var(--t3)' }}>Loading reports…</div>
      ) : error ? (
        <div style={{ color:'var(--err)', padding:40 }}>Error: {error}</div>
      ) : (
        <>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead><tr><th>Type</th><th>Reason</th><th>Content</th><th>Description</th><th>Reporter</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r._id} style={r.status==='pending' ? { background:'rgba(184,136,42,0.04)' } : {}}>
                    <td><span className={`badge ${TYPE_BADGE[r.targetType]||'blue'}`}>{r.targetType}</span></td>
                    <td><span className={`badge ${REASON_COLOR[r.reason]||'blue'}`}>{r.reason}</span></td>
                    <td style={{ maxWidth:220 }}>
                      {r.targetTitle ? (
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          {r.targetThumbnail && (
                            <div style={{ flexShrink:0, width:48, height:32, borderRadius:4, overflow:'hidden', background:'var(--s3)' }}>
                              <img src={r.targetThumbnail} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                            </div>
                          )}
                          <div style={{ fontSize:'0.8rem', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--t1)', minWidth:0 }} title={r.targetTitle}>
                            {r.targetTitle}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color:'var(--t3)', fontSize:'0.78rem' }}>—</span>
                      )}
                    </td>
                    <td style={{ maxWidth:240 }}>
                      <div style={{ fontSize:'0.8rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.description || '—'}</div>
                    </td>
                    <td style={{ fontSize:'0.82rem', color:'var(--t2)' }}>@{r.reporter?.username || '—'}</td>
                    <td><span className={`badge ${STATUS_BADGE[r.status]||'blue'}`}>{r.status}</span></td>
                    <td style={{ fontSize:'0.78rem', color:'var(--t3)' }}>{new Date(r.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}</td>
                    <td>
                      <div style={{ display:'flex', gap:4 }}>
                        {/* Eye icon always opens full review modal */}
                        <button className="icon-btn" title="Review & take action" onClick={() => setRev(r)}><EyeIcon /></button>
                        {r.status === 'pending' && <>
                          <button className="icon-btn success" title="Quick dismiss" onClick={() => quickAction(r._id,'dismiss')}><CheckIcon /></button>
                          <button className="icon-btn danger"  title="Quick delete"  onClick={() => quickAction(r._id,'delete')}><XIcon /></button>
                        </>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {reports.length === 0 && <div className="empty-state">No reports match your filter. ✓</div>}
          {pages > 1 && (
            <div className="pagination">
              <button className="page-btn" onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1}>‹</button>
              {Array.from({ length:Math.min(7,pages) },(_,i)=>{ const p=page<=4?i+1:page-3+i; if(p<1||p>pages)return null; return <button key={p} className={`page-btn ${page===p?'active':''}`} onClick={()=>setPage(p)}>{p}</button> })}
              <button className="page-btn" onClick={() => setPage(p=>Math.min(pages,p+1))} disabled={page===pages}>›</button>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {reviewTarget && <ReviewModal report={reviewTarget} onClose={() => setRev(null)} onAction={handleAction} />}
      </AnimatePresence>
    </div>
  )
}