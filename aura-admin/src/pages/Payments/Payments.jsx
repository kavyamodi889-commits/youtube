//aura-admin/src/pages/Payments/Payments.jsx
import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useAdminFetch } from '../../hooks/useAdminAPI.js'
import ExportBar from '../../components/ExportBar/ExportBar.jsx'
import FilterDropdown from '../../components/FilterDropdown/FilterDropdown.jsx'
import { exportPaymentsPDF, exportPaymentsCSV } from '../../utils/exportReports.js'

const SearchIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
const EyeIcon    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>

const STATUS_BADGE = { captured:'green', failed:'red', refunded:'yellow', created:'blue' }
const PLAN_BADGE   = { ultra:'rose', premium:'blue', standard:'teal', basic:'green' }

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#12121f', border:'1px solid var(--s4)', borderRadius:8, padding:'10px 14px', fontSize:12 }}>
      <div style={{ color:'var(--t2)', marginBottom:4 }}>{label}</div>
      {payload.map((p,i) => <div key={i} style={{ color:p.color, fontWeight:600 }}>₹{p.value?.toLocaleString()}</div>)}
    </div>
  )
}

const fmt = n => n >= 1e6 ? '₹'+(n/1e6).toFixed(1)+'M' : n >= 1000 ? '₹'+(n/1000).toFixed(0)+'K' : '₹'+(n||0)

const STATUS_OPTIONS = [
  { value:'all',      label:'All Statuses' },
  { value:'captured', label:'✅ Completed' },
  { value:'failed',   label:'❌ Failed' },
  { value:'refunded', label:'↩ Refunded' },
  { value:'created',  label:'🕐 Pending' },
]
const PLAN_OPTIONS = [
  { value:'all',      label:'All Plans' },
  { value:'premium',  label:'⭐ Premium' },
  { value:'ultra',    label:'🔥 Ultra' },
  { value:'standard', label:'Standard' },
  { value:'basic',    label:'Basic' },
]
const BILLING_OPTIONS = [
  { value:'all',     label:'All Billing' },
  { value:'monthly', label:'📅 Monthly' },
  { value:'yearly',  label:'📆 Yearly' },
]

export default function Payments() {
  const [page, setPage]       = useState(1)
  const [search, setSearch]   = useState('')
  const [searchQ, setSearchQ] = useState('')
  const [status, setStatus]   = useState('all')
  const [plan, setPlan]       = useState('all')
  const [billing, setBilling] = useState('all')
  const [detail, setDetail]   = useState(null)

  const { data, loading, error } = useAdminFetch(
    '/admin/payments',
    { page, limit:20, status: status==='all'?undefined:status, plan: plan==='all'?undefined:plan },
    [page, status, plan]
  )

  const payments = data?.payments || []
  const total    = data?.total    || 0
  const pages    = data?.pages    || 1
  const summary  = data?.summary  || {}

  useEffect(() => {
    const t = setTimeout(() => { setSearchQ(search); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [search])

  // Only premium + ultra in the chart
  const planRevenue = ['premium','ultra'].map(p => ({
    plan: p.charAt(0).toUpperCase()+p.slice(1),
    revenue: payments.filter(x=>x.plan===p && x.status==='captured').reduce((s,x)=>s+(x.amount||0)/100, 0),
  }))

  // Client-side billing filter (monthly ≈ <500, yearly ≈ ≥500 — adjust thresholds if needed)
  const filteredPayments = payments.filter(p => {
    if (billing === 'all') return true
    const amt = Math.round((p.amount||0)/100)
    return billing === 'monthly' ? amt < 500 : amt >= 500
  })

  const exportRows = payments.map(p => ({
    _id: p._id, user: p.user?.username || '—', plan: p.plan,
    amount: Math.round((p.amount||0)/100), status: p.status,
    method: p.method || 'Razorpay', createdAt: p.createdAt,
  }))

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payment Transactions</h1>
          <p className="page-subtitle">{total.toLocaleString()} total transactions</p>
        </div>
        <ExportBar onPDF={() => exportPaymentsPDF(exportRows)} onCSV={() => exportPaymentsCSV(exportRows)} />
      </div>

      {/* Summary */}
      <div className="stats-grid" style={{ gridTemplateColumns:'repeat(4,1fr)', marginBottom:24 }}>
        {[
          { label:'Total Revenue',   value:fmt(summary.revenue||0) },
          { label:'Transactions',    value:(summary.count||0).toLocaleString(), accent:'accent-c' },
          { label:'Refunded',        value:fmt(summary.refunded||0) },
          { label:'Failed',          value:(summary.failed||0).toLocaleString(), accent:'accent-b' },
        ].map((s,i) => (
          <div key={i} className={`stat-card ${s.accent||''}`}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ fontSize:'1.5rem' }}>{loading?'…':s.value}</div>
          </div>
        ))}
      </div>

      {/* Revenue by plan — Premium & Ultra only */}
      {planRevenue.some(p=>p.revenue>0) && (
        <div className="glass-card" style={{ marginBottom:20 }}>
          <div className="section-title" style={{ marginBottom:16 }}>Revenue by Plan (visible page)</div>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={planRevenue} layout="vertical" margin={{ top:0, right:16, left:0, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--s2)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize:10, fill:'var(--t3)' }} axisLine={false} tickLine={false} tickFormatter={v=>'₹'+v} />
              <YAxis type="category" dataKey="plan" tick={{ fontSize:12, fill:'var(--t2)', fontWeight:600 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip content={<TT />} />
              <Bar dataKey="revenue" fill="var(--gold)" radius={[0,4,4,0]} name="Revenue ₹" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="table-toolbar">
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          <FilterDropdown label="All Statuses" value={status}  options={STATUS_OPTIONS}  onChange={v=>{ setStatus(v);  setPage(1) }} />
          <FilterDropdown label="All Plans"    value={plan}    options={PLAN_OPTIONS}    onChange={v=>{ setPlan(v);    setPage(1) }} />
          <FilterDropdown label="All Billing"  value={billing} options={BILLING_OPTIONS} onChange={v=>{ setBilling(v); setPage(1) }} />
        </div>
        <div className="admin-search"><SearchIcon /><input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} /></div>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'var(--t3)' }}>Loading payments…</div>
      ) : error ? (
        <div style={{ color:'var(--err)', padding:40 }}>Error: {error}</div>
      ) : (
        <>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead><tr><th>User</th><th>Plan</th><th>Amount</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredPayments.map(p => (
                  <tr key={p._id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div className="user-avatar" style={{ background:'var(--gold-dim)', color:'var(--gold)', borderColor:'var(--gold-border)' }}>
                          {p.user?.avatar ? <img src={p.user.avatar} alt={p.user.username} /> : p.user?.username?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div style={{ fontWeight:600, fontSize:'0.875rem' }}>{p.user?.displayName || p.user?.username || '—'}</div>
                          <div style={{ fontSize:'0.72rem', color:'var(--t3)' }}>{p.user?.email || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge ${PLAN_BADGE[p.plan]||'blue'}`}>{p.plan}</span></td>
                    <td style={{ fontWeight:700, fontFamily:'JetBrains Mono,monospace', fontSize:'0.9rem' }}>
                      ₹{Math.round((p.amount||0)/100).toLocaleString()}
                    </td>
                    <td><span className={`badge ${STATUS_BADGE[p.status]||'blue'}`}>{p.status}</span></td>
                    <td style={{ fontSize:'0.78rem', color:'var(--t3)' }}>
                      {new Date(p.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
                    </td>
                    <td><button className="icon-btn" title="View detail" onClick={() => setDetail(p)}><EyeIcon /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredPayments.length === 0 && <div className="empty-state">No transactions match your filter.</div>}
          {pages > 1 && (
            <div className="pagination">
              <button className="page-btn" onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1}>‹</button>
              {Array.from({length:Math.min(7,pages)},(_,i)=>{ const p=page<=4?i+1:page-3+i; if(p<1||p>pages)return null; return <button key={p} className={`page-btn ${page===p?'active':''}`} onClick={()=>setPage(p)}>{p}</button> })}
              <button className="page-btn" onClick={() => setPage(p=>Math.min(pages,p+1))} disabled={page===pages}>›</button>
            </div>
          )}
        </>
      )}

      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Transaction Detail</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, fontSize:'0.85rem', marginBottom:16 }}>
              {[
                ['Transaction ID', detail._id],
                ['User', '@'+(detail.user?.username||'—')],
                ['Email', detail.user?.email||'—'],
                ['Plan', detail.plan],
                ['Amount', '₹'+Math.round((detail.amount||0)/100).toLocaleString()],
                ['Status', detail.status],
                ['Razorpay Order ID', detail.razorpayOrderId||'—'],
                ['Date', new Date(detail.createdAt).toLocaleString('en-IN')],
              ].map(([k,v])=>(
                <div key={k} style={{ background:'var(--s2)', padding:'8px 12px', borderRadius:'var(--r-sm)' }}>
                  <div style={{ fontSize:'0.7rem', color:'var(--t3)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:2 }}>{k}</div>
                  <div style={{ fontWeight:600, fontSize:'0.78rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v}</div>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button className="action-btn secondary" onClick={() => setDetail(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}