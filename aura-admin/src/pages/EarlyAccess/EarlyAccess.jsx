// aura-admin/src/pages/EarlyAccess/EarlyAccess.jsx
import { useState, useEffect } from 'react'
import { useAdminFetch, adminAction } from '../../hooks/useAdminAPI.js'
import FilterDropdown from '../../components/FilterDropdown/FilterDropdown.jsx'
import ExportBar from '../../components/ExportBar/ExportBar.jsx'

const SearchIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
const MailIcon   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
const CheckIcon  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>

const SOURCE_BADGE = { music: 'blue', ads: 'rose', general: 'teal' }
const STATUS_BADGE = { pending: 'yellow', invited: 'blue', converted: 'green' }

const SOURCE_OPTIONS = [
  { value: 'all',     label: 'All Sources' },
  { value: 'music',   label: '🎵 Music' },
  { value: 'ads',     label: '📢 Ads' },
  { value: 'general', label: '🌐 General' },
]
const STATUS_OPTIONS = [
  { value: 'all',       label: 'All Statuses' },
  { value: 'pending',   label: '🟡 Pending' },
  { value: 'invited',   label: '🔵 Invited' },
  { value: 'converted', label: '✅ Converted' },
]

function exportCSV(rows) {
  const headers = ['Email', 'Source', 'Status', 'Linked User', 'Date']
  const lines = rows.map(r => [
    r.email, r.source, r.status,
    r.user?.username || '—',
    new Date(r.createdAt).toLocaleDateString('en-IN'),
  ])
  const csv = [headers, ...lines].map(l => l.join(',')).join('\n')
  const a = document.createElement('a')
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
  a.download = 'early-access-registrations.csv'
  a.click()
}

export default function EarlyAccess() {
  const [source, setSource]   = useState('all')
  const [status, setStatus]   = useState('all')
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(1)
  const [toast, setToast]     = useState('')

  const params = {
    page, limit: 30,
    ...(source !== 'all' && { source }),
    ...(status !== 'all' && { status }),
  }

  const { data, loading, error, refetch } = useAdminFetch('/admin/early-access', params, [page, source, status])

  const rows  = data?.data  || []
  const total = data?.total || 0

  // local search filter
  const filtered = search.trim()
    ? rows.filter(r => r.email.toLowerCase().includes(search.toLowerCase()) || r.user?.username?.toLowerCase().includes(search.toLowerCase()))
    : rows

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const markInvited = async (id) => {
    try {
      await adminAction('patch', `/admin/early-access/${id}/invite`)
      showToast('Marked as invited ✓')
      refetch()
    } catch {
      // fallback — just show info
      showToast('Invite endpoint not wired — update status in DB manually')
    }
  }

  // Summary counts from all fetched rows
  const bySource = { music: 0, ads: 0, general: 0 }
  const byStatus = { pending: 0, invited: 0, converted: 0 }
  rows.forEach(r => { bySource[r.source] = (bySource[r.source]||0)+1; byStatus[r.status] = (byStatus[r.status]||0)+1 })

  return (
    <div className="admin-page">
      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, background:'var(--s4)', borderRadius:'var(--r-md)', padding:'10px 18px', color:'var(--t1)', fontWeight:600, fontSize:'0.85rem', zIndex:999, boxShadow:'0 8px 32px rgba(0,0,0,0.4)' }}>
          {toast}
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Coming Soon Registrations</h1>
          <p className="page-subtitle">{total.toLocaleString()} total signups — Ads & Music pre-booking</p>
        </div>
        <ExportBar onCSV={() => exportCSV(filtered)} onPDF={() => {}} />
      </div>

      {/* Summary cards */}
      <div className="stats-grid" style={{ gridTemplateColumns:'repeat(6,1fr)', marginBottom:24 }}>
        {[
          { label:'Total',     value:total,               accent:'' },
          { label:'Music',     value:bySource.music,      accent:'accent-b' },
          { label:'Ads',       value:bySource.ads,        accent:'' },
          { label:'General',   value:bySource.general,    accent:'accent-c' },
          { label:'Pending',   value:byStatus.pending,    accent:'' },
          { label:'Converted', value:byStatus.converted,  accent:'accent-gold' },
        ].map((s,i) => (
          <div key={i} className={`stat-card ${s.accent}`}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ fontSize:'1.4rem' }}>{loading ? '…' : s.value}</div>
          </div>
        ))}
      </div>

      <div className="table-toolbar">
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <FilterDropdown label="All Sources" value={source} options={SOURCE_OPTIONS} onChange={v => { setSource(v); setPage(1) }} />
          <FilterDropdown label="All Statuses" value={status} options={STATUS_OPTIONS} onChange={v => { setStatus(v); setPage(1) }} />
        </div>
        <div className="admin-search">
          <SearchIcon />
          <input placeholder="Search email or username…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'var(--t3)' }}>Loading registrations…</div>
      ) : error ? (
        <div style={{ color:'var(--err)', padding:40 }}>Error loading data — make sure the backend `/api/early-access` route is accessible from the admin token.</div>
      ) : (
        <>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Linked User</th>
                  <th>Signed Up</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r._id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--s3)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <MailIcon />
                        </div>
                        <span style={{ fontWeight:600, fontSize:'0.85rem' }}>{r.email}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${SOURCE_BADGE[r.source]||'blue'}`}>
                        {r.source === 'music' ? '🎵' : r.source === 'ads' ? '📢' : '🌐'} {r.source}
                      </span>
                    </td>
                    <td><span className={`badge ${STATUS_BADGE[r.status]||'blue'}`}>{r.status}</span></td>
                    <td style={{ fontSize:'0.82rem' }}>
                      {r.user
                        ? <span style={{ color:'var(--a)', fontWeight:600 }}>@{r.user.username}</span>
                        : <span style={{ color:'var(--t3)' }}>Guest</span>}
                    </td>
                    <td style={{ fontSize:'0.78rem', color:'var(--t3)' }}>
                      {new Date(r.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
                    </td>
                    <td>
                      {r.status === 'pending' && (
                        <button
                          className="icon-btn success"
                          title="Mark as Invited"
                          onClick={() => markInvited(r._id)}
                        >
                          <CheckIcon />
                        </button>
                      )}
                      {r.status !== 'pending' && (
                        <span style={{ fontSize:'0.75rem', color:'var(--t3)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="empty-state">No registrations match your filter.</div>
          )}
        </>
      )}
    </div>
  )
}