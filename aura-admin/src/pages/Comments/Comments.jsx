// FILE: aura-admin/src/pages/Comments/Comments.jsx
import { useState, useEffect, useCallback } from 'react'
import { adminAction } from '../../hooks/useAdminAPI.js'
import api from '../../services/api.js'

const TrashIcon  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
const FlagIcon   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
const SearchIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
const DownIcon   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
const VideoIcon  = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
const ShortIcon  = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M17.77 10.32l-1.2-.5L18 9.06c1.84-.96 2.53-3.23 1.56-5.06s-3.23-2.53-5.06-1.56L6 6.94c-1.29.68-2.06 2.03-1.98 3.49.07 1.18.63 2.23 1.51 2.94-.07.23-.11.47-.11.73v4c0 2.21 2.69 4 6 4s6-1.79 6-4v-4c0-.67-.21-1.3-.58-1.84l.93-.38c.67-.28 1-.93.72-1.56z"/></svg>
const ReplyIcon  = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 00-4-4H4"/></svg>

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)   return 'just now'
  if (m < 60)  return m + 'm ago'
  const h = Math.floor(m / 60)
  if (h < 24)  return h + 'h ago'
  const d = Math.floor(h / 24)
  if (d < 30)  return d + 'd ago'
  return new Date(dateStr).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'2-digit' })
}

function exportCSV(comments) {
  const rows = [['Author','Comment','Video','Type','Flagged','Likes','Replies','Reports','Date']]
  comments.forEach(c => {
    rows.push([
      (c.author?.username) || 'unknown',
      (c.text || '').replace(/,/g,' ').slice(0, 120),
      ((c.video?.title) || 'unknown').replace(/,/g,' '),
      c.video?.isShort ? 'Short' : 'Video',
      c.isFlagged ? 'Yes' : 'No',
      c.likeCount   || 0,
      c.replyCount  || 0,
      c.reportCount || 0,
      new Date(c.createdAt).toLocaleDateString('en-IN'),
    ])
  })
  const csv  = rows.map(r => r.join(',')).join('\r\n')
  const blob = new Blob([csv], { type:'text/csv' })
  const a    = document.createElement('a')
  a.href     = URL.createObjectURL(blob)
  a.download = 'AURA_Comments_' + Date.now() + '.csv'
  a.click()
}

export default function Comments() {
  const [comments,  setComments]  = useState([])
  const [total,     setTotal]     = useState(0)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [search,    setSearch]    = useState('')
  const [filter,    setFilter]    = useState('all')   // all | flagged | reported | videos | shorts
  const [page,      setPage]      = useState(1)
  const [toast,     setToast]     = useState('')
  const [selected,  setSelected]  = useState(new Set())
  const LIMIT = 50

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const fetchComments = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const params = { page, limit: LIMIT, search }
      if (filter === 'flagged')  params.flagged  = 'true'
      if (filter === 'reported') params.reported = 'true'

      const res = await api.get('/admin/comments', { params })
      let list  = res.data.comments || []

      // Client-side filter for video/short type (server returns all)
      if (filter === 'shorts') list = list.filter(c => c.video?.isShort)
      if (filter === 'videos') list = list.filter(c => c.video && !c.video.isShort)

      setComments(list)
      setTotal(res.data.total || 0)
    } catch(e) {
      setError((e.response?.data?.message) || e.message)
    } finally {
      setLoading(false)
    }
  }, [page, search, filter])

  useEffect(() => { fetchComments() }, [fetchComments])
  useEffect(() => { setPage(1) }, [search, filter])

  async function handleDelete(id) {
    try {
      await adminAction('delete', '/admin/comments/' + id)
      setComments(prev => prev.filter(c => c._id !== id))
      setSelected(prev => { const s = new Set(prev); s.delete(id); return s })
      showToast('Comment deleted')
    } catch(e) { showToast('Error: ' + e.message) }
  }

  async function handleFlag(id) {
    try {
      const res = await adminAction('patch', '/admin/comments/' + id + '/flag')
      setComments(prev => prev.map(c => c._id === id ? { ...c, isFlagged: res.isFlagged } : c))
      showToast(res.isFlagged ? 'Comment flagged' : 'Flag removed')
    } catch(e) { showToast('Error: ' + e.message) }
  }

  async function bulkDelete() {
    if (!selected.size) return
    for (const id of selected) await handleDelete(id)
    setSelected(new Set())
  }

  function toggle(id) { setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s }) }
  function toggleAll() { setSelected(prev => prev.size === comments.length ? new Set() : new Set(comments.map(c => c._id))) }

  const totalPages   = Math.ceil(total / LIMIT)
  const flaggedCount = comments.filter(c => c.isFlagged).length
  const reportedCount = comments.filter(c => (c.reportCount || 0) > 0).length

  return (
    <div className="admin-page">
      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, background:'var(--s4)', borderRadius:'var(--r-md)', padding:'10px 18px', color:'var(--t1)', fontWeight:600, fontSize:'0.85rem', zIndex:999 }}>
          {toast}
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Comments</h1>
          <p className="page-subtitle">
            All comments · {total} total
            {flaggedCount  > 0 && <span style={{ color:'#e55', marginLeft:8 }}>· {flaggedCount} flagged</span>}
            {reportedCount > 0 && <span style={{ color:'#e97316', marginLeft:8 }}>· {reportedCount} reported</span>}
          </p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {selected.size > 0 && (
            <button className="action-btn danger" onClick={bulkDelete}>
              <TrashIcon /> Delete Selected ({selected.size})
            </button>
          )}
          <button className="action-btn secondary" onClick={() => exportCSV(comments)}>
            <DownIcon /> Export CSV
          </button>
        </div>
      </div>

      <div className="table-toolbar" style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'var(--s2)', borderRadius:'var(--r-md)', padding:'7px 12px', flex:'1', minWidth:200, maxWidth:360 }}>
          <SearchIcon />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search comment text…"
            style={{ background:'none', border:'none', outline:'none', color:'var(--t1)', fontSize:'0.875rem', width:'100%' }}
          />
        </div>
        <div className="filter-chips">
          {[
            ['all',      'All'],
            ['flagged',  '🚩 Flagged'],
            ['reported', '⚠️ Reported'],
            ['videos',   'Videos'],
            ['shorts',   'Shorts'],
          ].map(([v, l]) => (
            <button key={v} className={`filter-chip ${filter === v ? 'active' : ''}`} onClick={() => setFilter(v)}>{l}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'var(--t3)' }}>Loading comments…</div>
      ) : error ? (
        <div style={{ color:'var(--err)', padding:40 }}>Error: {error}</div>
      ) : comments.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'var(--t3)' }}>
          <p style={{ fontSize:'2rem', marginBottom:8 }}>💬</p>
          <p>No comments found</p>
        </div>
      ) : (
        <>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width:32 }}>
                    <input type="checkbox" style={{ cursor:'pointer', accentColor:'var(--a)' }}
                      checked={comments.length > 0 && selected.size === comments.length}
                      onChange={toggleAll} />
                  </th>
                  <th>Author</th>
                  <th>Comment</th>
                  <th>On</th>
                  <th>Type</th>
                  <th>Likes</th>
                  <th>Replies</th>
                  <th>Reports</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {comments.map(c => {
                  const author = c.author || {}
                  const video  = c.video  || {}
                  return (
                    <tr key={c._id} style={c.isFlagged ? { background:'rgba(229,85,85,0.06)' } : (c.reportCount > 0 ? { background:'rgba(249,115,22,0.06)' } : {})}>
                      <td>
                        <input type="checkbox" style={{ cursor:'pointer', accentColor:'var(--a)' }}
                          checked={selected.has(c._id)} onChange={() => toggle(c._id)} />
                      </td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          {author.avatar && <img src={author.avatar} alt="" style={{ width:28, height:28, borderRadius:'50%', objectFit:'cover', flexShrink:0 }} />}
                          <div>
                            <p style={{ fontWeight:600, fontSize:'0.82rem', color:'var(--t1)', margin:0 }}>{author.displayName || author.username || '—'}</p>
                            <p style={{ fontSize:'0.73rem', color:'var(--t3)', margin:0 }}>@{author.username || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ maxWidth:300 }}>
                        <p style={{ fontSize:'0.82rem', color: c.isFlagged ? '#e58' : c.reportCount > 0 ? '#e97316' : 'var(--t1)', lineHeight:1.5, margin:0, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                          {c.isFlagged   && <span title="Flagged"   style={{ marginRight:5 }}>🚩</span>}
                          {c.reportCount > 0 && <span title="Reported" style={{ marginRight:5 }}>⚠️</span>}
                          {c.parent && <span title="Reply" style={{ marginRight:5, opacity:0.6 }}><ReplyIcon /></span>}
                          {c.text || '[deleted]'}
                        </p>
                        {c.reportCount > 0 && c.reports?.slice(0, 2).map((rep, i) => (
                          <p key={i} style={{ fontSize:'0.7rem', color:'var(--t4)', margin:'2px 0 0', fontStyle:'italic' }}>
                            "{rep.reason}"
                          </p>
                        ))}
                      </td>
                      <td style={{ maxWidth:180 }}>
                        {video.thumbnailUrl && <img src={video.thumbnailUrl} alt="" style={{ width:48, height:27, objectFit:'cover', borderRadius:4, display:'block', marginBottom:4 }} />}
                        <p style={{ fontSize:'0.78rem', color:'var(--t2)', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:160 }}>{video.title || '—'}</p>
                      </td>
                      <td>
                        <span className={`badge ${video.isShort ? 'red' : 'blue'}`} style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
                          {video.isShort ? <ShortIcon /> : <VideoIcon />}
                          {video.isShort ? 'Short' : 'Video'}
                        </span>
                      </td>
                      <td style={{ fontSize:'0.82rem', color:'var(--t2)' }}>{c.likeCount   || 0}</td>
                      <td style={{ fontSize:'0.82rem', color:'var(--t2)' }}>{c.replyCount  || 0}</td>
                      <td style={{ fontSize:'0.82rem', color: c.reportCount > 0 ? '#e97316' : 'var(--t2)', fontWeight: c.reportCount > 0 ? 700 : 400 }}>{c.reportCount || 0}</td>
                      <td style={{ fontSize:'0.78rem', color:'var(--t3)', whiteSpace:'nowrap' }}>{timeAgo(c.createdAt)}</td>
                      <td>
                        <div style={{ display:'flex', gap:6 }}>
                          <button
                            className={`action-btn ${c.isFlagged ? 'danger' : 'secondary'}`}
                            style={{ padding:'4px 8px', fontSize:'0.75rem' }}
                            onClick={() => handleFlag(c._id)}
                            title={c.isFlagged ? 'Remove flag' : 'Flag comment'}
                          ><FlagIcon /></button>
                          <button
                            className="action-btn danger"
                            style={{ padding:'4px 8px', fontSize:'0.75rem' }}
                            onClick={() => handleDelete(c._id)}
                            title="Delete comment"
                          ><TrashIcon /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:12, padding:'20px 0', fontFamily:'DM Sans,sans-serif' }}>
              <button className="action-btn secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span style={{ color:'var(--t2)', fontSize:'0.875rem' }}>Page {page} of {totalPages}</span>
              <button className="action-btn secondary" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}