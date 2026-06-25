// src/pages/Dashboard/Dashboard.jsx
import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { useAdminFetch } from '../../hooks/useAdminAPI.js'
import ExportBar from '../../components/ExportBar/ExportBar.jsx'
import { exportAnalyticsPDF, exportAnalyticsCSV } from '../../utils/exportReports.js'

const CATEGORY_COLORS = ['#b5294e','#6654a8','#3d9e8c','#b8882a','#2563eb','#7c3aed','#059669','#374151']

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg)', border: '1px solid var(--s4)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--t1)' }}>
      <div style={{ color: 'var(--t2)', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  )
}

function StatCard({ label, value, change, accent, warn }) {
  return (
    <div className={`stat-card ${accent || ''}`}>
      {warn && <div style={{ position: 'absolute', top: 10, right: 10 }}><span className="badge red">!</span></div>}
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value ?? '—'}</div>
      {change && <div className="stat-change">↑ {change}</div>}
    </div>
  )
}

// Build a full 7-day array (Sun–Sat of current week) with YYYY-MM-DD keys
function buildWeek7Days() {
  const today = new Date()
  // Find this week's Sunday
  const dayOfWeek = today.getDay() // 0=Sun
  const sunday = new Date(today)
  sunday.setDate(today.getDate() - dayOfWeek)
  sunday.setHours(0,0,0,0)

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    const yyyy = d.getFullYear()
    const mm   = String(d.getMonth()+1).padStart(2,'0')
    const dd   = String(d.getDate()).padStart(2,'0')
    const label = d.toLocaleDateString('en-IN',{ month:'short', day:'numeric' }) // e.g. "Apr 12"
    return { key: `${yyyy}-${mm}-${dd}`, label, count:0, views:0 }
  })
}

export default function Dashboard() {
  const [chartMetric, setMetric] = useState('count')
  const { data, loading, error } = useAdminFetch('/admin/dashboard')

  const stats   = data?.stats   || {}
  const charts  = data?.charts  || {}
  const creators= data?.topCreators   || []
  const reports = data?.recentReports || []

  // Merge API data into full 7-day grid
  const chartData = useMemo(() => {
    const week = buildWeek7Days()
    const userMap  = {}
    const viewsMap = {}
    ;(charts.dailyUsers  || []).forEach(d => { userMap[d._id]  = d.count })
    ;(charts.dailyVideos || []).forEach(d => { viewsMap[d._id] = d.views })
    return week.map(d => ({
      ...d,
      count: userMap[d.key]  || 0,
      views: viewsMap[d.key] || 0,
    }))
  }, [charts.dailyUsers, charts.dailyVideos])

  const catData = (charts.categoryBreakdown || []).map((c, i) => ({
    name: c._id || 'Other', value: c.count, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length]
  }))

  const exportData = chartData.map(d => ({ date: d.key, views: d.views, users: d.count, revenue: 0 }))

  // Integer-only Y axis ticks for user counts
  const maxCount = Math.max(...chartData.map(d => d[chartMetric] || 0), 1)
  const yTicks = Array.from({ length: Math.min(maxCount+1, 6) }, (_, i) => Math.round((maxCount/(Math.min(maxCount,5)))*i))

  if (loading) return <div className="admin-page"><div className="section-title" style={{ marginTop: 40, textAlign: 'center' }}>Loading dashboard…</div></div>
  if (error)   return <div className="admin-page"><div style={{ color: 'var(--err)', padding: 40 }}>Error: {error}</div></div>

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Live platform snapshot from MongoDB</p>
        </div>
        <ExportBar label="Export Summary" onPDF={() => exportAnalyticsPDF(exportData, stats)} onCSV={() => exportAnalyticsCSV(exportData)} />
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <StatCard label="Total Users"     value={(stats.totalUsers||0).toLocaleString()}      change={`${stats.newUsersToday||0} today`} />
        <StatCard label="Total Videos"    value={(stats.totalVideos||0).toLocaleString()}     accent="accent-b" />
        <StatCard label="Total Views"     value={stats.totalViews >= 1e6 ? (stats.totalViews/1e6).toFixed(1)+'M' : (stats.totalViews||0).toLocaleString()} accent="accent-c" />
        <StatCard label="Monthly Revenue" value={`₹${(stats.revenueMonth||0).toLocaleString()}`} accent="accent-gold" />
        <StatCard label="Live Now"        value={stats.liveNow||0} />
        <StatCard label="Pending Reports" value={stats.pendingReports||0} warn={stats.pendingReports > 0} accent="accent-b" />
        <StatCard label="New Users Today" value={stats.newUsersToday||0} accent="accent-c" />
        <StatCard label="Premium Users"   value={(stats.premiumUsers||0).toLocaleString()} accent="accent-gold" />
      </div>

      <div className="charts-row">
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="section-title">7-Day Trend (This Week)</div>
            <div className="filter-chips">
              {[['count','New Users'],['views','Views']].map(([v,l]) => (
                <button key={v} className={`filter-chip ${chartMetric===v?'active':''}`} onClick={() => setMetric(v)}>{l}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--a)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--a)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: 'var(--t3)' }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: 'var(--t3)' }}
                axisLine={false} tickLine={false}
                tickFormatter={v => Number.isInteger(v) ? v : ''}
                ticks={yTicks}
              />
              <Tooltip content={<TT />} />
              <Area
                type="monotone"
                dataKey={chartMetric}
                stroke="var(--a)" strokeWidth={2}
                fill="url(#g1)" dot={false}
                name={chartMetric === 'count' ? 'New Users' : 'Views'}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card">
          <div className="section-title" style={{ marginBottom: 16 }}>Content by Category</div>
          {catData.length === 0
            ? <div className="empty-state" style={{ padding: '40px 0' }}>No category data</div>
            : <ResponsiveContainer width="100%" height={260}>
                <PieChart margin={{ top:0, right:0, bottom:0, left:0 }}>
                  <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="42%" outerRadius={82} strokeWidth={0}>
                    {catData.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip formatter={v => v+' videos'} contentStyle={{ background: 'var(--card-bg,#12121f)', border: '1px solid var(--s4)', borderRadius: 8, fontSize: 12, color: 'var(--t1)' }} />
                  <Legend wrapperStyle={{ fontSize: 10, color: 'var(--t2)', lineHeight: '18px' }} iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
          }
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-lg)' }}>
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div className="section-title">Top Creators</div>
            <Link to="/admin/users" style={{ fontSize: '0.78rem', color: 'var(--a)', fontWeight: 600 }}>View all →</Link>
          </div>
          {creators.length === 0
            ? <div className="empty-state">No creators yet</div>
            : creators.map((u, i) => (
              <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < creators.length-1 ? '1px solid var(--s2)' : 'none' }}>
                <div className="user-avatar">
                  {u.avatar ? <img src={u.avatar} alt={u.username} /> : u.username?.[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{u.displayName || u.username}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--t3)' }}>@{u.username}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{(u.subscriberCount||0).toLocaleString()}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--t3)' }}>subs</div>
                </div>
                {u.isChannelVerified && <span className="badge teal">✓</span>}
              </div>
            ))
          }
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div className="section-title">Pending Reports</div>
            <Link to="/admin/reports" style={{ fontSize: '0.78rem', color: 'var(--a)', fontWeight: 600 }}>Review all →</Link>
          </div>
          {reports.length === 0
            ? <div style={{ color: 'var(--ok)', fontSize: '0.85rem', padding: '20px 0', textAlign: 'center' }}>✓ No pending reports</div>
            : reports.map((r, i) => (
              <div key={r._id} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < reports.length-1 ? '1px solid var(--s2)' : 'none' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24', flexShrink: 0, marginTop: 5 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{r.reason}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--t3)' }}>{r.targetType} · by @{r.reporter?.username}</div>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--t3)', flexShrink: 0 }}>
                  {new Date(r.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}