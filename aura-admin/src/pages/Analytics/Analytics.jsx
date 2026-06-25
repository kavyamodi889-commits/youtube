// src/pages/Analytics/Analytics.jsx
import { useState, useMemo } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from 'recharts'
import { useAdminFetch } from '../../hooks/useAdminAPI.js'
import ExportBar from '../../components/ExportBar/ExportBar.jsx'
import { exportAnalyticsPDF, exportAnalyticsCSV } from '../../utils/exportReports.js'

const COLORS = ['#b5294e','#6654a8','#3d9e8c','#b8882a','#2563eb','#7c3aed','#059669','#374151']

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'var(--bg)', border:'1px solid var(--s4)', borderRadius:8, padding:'10px 14px', fontSize:12, boxShadow:'0 4px 24px rgba(0,0,0,0.25)' }}>
      <div style={{ color:'var(--t2)', marginBottom:4, fontWeight:600 }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ color:p.color, fontWeight:600 }}>
          {p.name}: {p.value >= 1000 ? (p.value/1000).toFixed(1)+'K' : p.value}
        </div>
      ))}
    </div>
  )
}

// Shared legend style — adapts to light/dark via CSS vars
const LEGEND_STYLE = {
  fontSize: 11,
  color: 'var(--t2)',
  paddingTop: 8,
  lineHeight: '20px',
}

const fmt = n => n >= 1e6 ? (n/1e6).toFixed(1)+'M' : n >= 1000 ? (n/1000).toFixed(1)+'K' : String(n||0)

// Build a date range going back `days` days from today, returning label + ISO key
// Format a Date as YYYY-MM-DD using LOCAL time (IST) — must match server timezone: +05:30
function localDateKey(d) {
  const yyyy = d.getFullYear()
  const mm   = String(d.getMonth() + 1).padStart(2, '0')
  const dd   = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function buildDateRange(days) {
  const today = new Date()
  today.setHours(0,0,0,0)

  if (days === 7) {
    // Always show full Sun–Sat of the current week
    const dayOfWeek = today.getDay()
    const sunday = new Date(today)
    sunday.setDate(today.getDate() - dayOfWeek)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday)
      d.setDate(sunday.getDate() + i)
      return {
        key:   localDateKey(d),
        label: d.toLocaleDateString('en-IN', { month:'short', day:'numeric' }),
      }
    })
  }

  // For 14d / 30d: last N days ending today
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (days - 1 - i))
    return {
      key:   localDateKey(d),
      label: d.toLocaleDateString('en-IN', { month:'short', day:'numeric' }),
    }
  })
}

export default function Analytics() {
  const [days, setDays] = useState(7)

  const { data, loading, error } = useAdminFetch('/admin/analytics', { days }, [days])

  const dailyUsers  = data?.dailyUsers         || []
  const dailyViews  = data?.dailyViews          || []
  const catBreak    = data?.categoryBreakdown   || []
  const planBreak   = data?.revenueByPlan       || []
  const totals      = data?.totals              || {}

  // Merge API data into a full date-range grid (no missing dates, no decimals)
  const mergedChart = useMemo(() => {
    const range    = buildDateRange(days)
    const userMap  = {}
    const viewsMap = {}
    dailyUsers.forEach(d => { userMap[d._id]  = d.count })
    dailyViews.forEach(d => { viewsMap[d._id] = d.views })
    return range.map(({ key, label }) => ({
      date:  label,
      users: userMap[key]  || 0,
      views: viewsMap[key] || 0,
    }))
  }, [dailyUsers, dailyViews, days])

  const catChartData = catBreak.map((c,i) => ({
    name:  c._id || 'Other',
    value: c.count,
    views: c.views,
    color: COLORS[i % COLORS.length],
  }))

  const planChartData = planBreak.map(p => ({
    plan:  p._id || 'none',
    count: p.count,
  }))

  const exportData = mergedChart.map(d => ({ date: d.date, views: d.views, users: d.users, revenue: 0 }))

  // Format total content duration into "X hours Y min" 
  const fmtDuration = (secs) => {
    if (!secs) return '—'
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    if (h >= 1000) return `${(h/1000).toFixed(1)}K hrs`
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

  const statCards = [
    { label:'Total Users',          value: fmt(totals.totalUsers),        color:'var(--a)',    accent:'accent-a' },
    { label:'Total Videos',         value: fmt(totals.totalVideos),       color:'var(--b)',    accent:'accent-b' },
    { label:'Total Views',          value: fmt(totals.totalViews),        color:'var(--c)',    accent:'accent-c' },
    { label:'Premium Users',        value: fmt(totals.premiumUsers),      color:'var(--gold)', accent:'accent-gold' },
    { label:'Creators',             value: fmt(totals.creators),          color:'var(--a)',    accent:'accent-a' },
    { label:'Banned Users',         value: fmt(totals.bannedUsers),       color:'var(--err)' },

    { label:'Total Live Streams',   value: fmt(totals.totalLiveStreams),  color:'var(--c)',    accent:'accent-c' },
    { label:'Total Content Hrs',    value: fmtDuration(totals.totalDuration), color:'var(--gold)', accent:'accent-gold' },
  ]

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Platform Analytics</h1>
          <p className="page-subtitle">Live metrics from MongoDB — no dummy data</p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div className="filter-chips">
            {[7,14,30].map(d => (
              <button key={d} className={`filter-chip ${days===d?'active':''}`} onClick={() => setDays(d)}>{d}d</button>
            ))}
          </div>
          <ExportBar onPDF={() => exportAnalyticsPDF(exportData, totals)} onCSV={() => exportAnalyticsCSV(exportData)} />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'var(--t3)' }}>Loading analytics…</div>
      ) : error ? (
        <div style={{ color:'var(--err)', padding:40 }}>Error: {error}</div>
      ) : (
        <>
          {/* Platform totals */}
          <div className="stats-grid" style={{ gridTemplateColumns:'repeat(4,1fr)', marginBottom:24 }}>
            {statCards.map((s,i) => (
              <div key={i} className={`stat-card ${s.accent || ''}`}>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ color:s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Users + Views dual chart */}
          <div className="glass-card" style={{ marginBottom:20 }}>
            <div className="section-title" style={{ marginBottom:16 }}>
              New Users & Views — {days === 7 ? 'This Week (Sun–Sat)' : `Last ${days} Days`}
            </div>
            {mergedChart.every(d => d.users === 0 && d.views === 0)
              ? <div className="empty-state" style={{ padding:'40px 0' }}>No activity data in this period</div>
              : <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={mergedChart} margin={{ top:4, right:4, left:0, bottom:0 }}>
                    <defs>
                      <linearGradient id="gU" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="var(--a)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--a)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="var(--b)" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="var(--b)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--s2)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize:10, fill:'var(--t3)' }}
                      axisLine={false} tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize:10, fill:'var(--t3)' }}
                      axisLine={false} tickLine={false}
                      tickFormatter={v => v >= 1000 ? (v/1000).toFixed(0)+'K' : v}
                    />
                    <Tooltip content={<TT />} />
                    <Area type="monotone" dataKey="users" stroke="var(--a)" strokeWidth={2} fill="url(#gU)" dot={false} name="New Users" />
                    <Area type="monotone" dataKey="views" stroke="var(--b)" strokeWidth={2} fill="url(#gV)" dot={false} name="Views" />
                  </AreaChart>
                </ResponsiveContainer>
            }
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
            {/* Category breakdown */}
            <div className="glass-card">
              <div className="section-title" style={{ marginBottom:16 }}>Videos by Category</div>
              {catChartData.length === 0
                ? <div className="empty-state" style={{ padding:'30px 0' }}>No videos yet</div>
                : <ResponsiveContainer width="100%" height={260}>
                    <PieChart margin={{ top:0, right:0, bottom:0, left:0 }}>
                      <Pie data={catChartData} dataKey="value" nameKey="name" cx="50%" cy="42%" innerRadius={50} outerRadius={82} strokeWidth={0}>
                        {catChartData.map((c,i) => <Cell key={i} fill={c.color} />)}
                      </Pie>
                      <Tooltip formatter={(v,n,p) => [`${v} videos`, p.payload.name]} contentStyle={{ background:'var(--card-bg,#12121f)', border:'1px solid var(--s4)', borderRadius:8, fontSize:12, color:'var(--t1)' }} />
                      <Legend wrapperStyle={LEGEND_STYLE} iconSize={8} />
                    </PieChart>
                  </ResponsiveContainer>
              }
            </div>

            {/* Premium plans breakdown */}
            <div className="glass-card">
              <div className="section-title" style={{ marginBottom:16 }}>Users by Membership Plan</div>
              {planChartData.length === 0
                ? <div className="empty-state" style={{ padding:'30px 0' }}>No premium users yet</div>
                : <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={planChartData} margin={{ top:4, right:4, left:0, bottom:0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--s2)" vertical={false} />
                      <XAxis dataKey="plan" tick={{ fontSize:11, fill:'var(--t2)', fontWeight:600 }} axisLine={false} tickLine={false} />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize:10, fill:'var(--t3)' }}
                        axisLine={false} tickLine={false}
                      />
                      <Tooltip content={<TT />} />
                      <Bar dataKey="count" fill="var(--gold)" radius={[4,4,0,0]} name="Users" />
                    </BarChart>
                  </ResponsiveContainer>
              }
            </div>
          </div>

          {/* Category view breakdown table */}
          {catChartData.length > 0 && (
            <div className="glass-card">
              <div className="section-title" style={{ marginBottom:16 }}>Category Performance</div>
              {catChartData.map((c,i) => {
                const maxViews = Math.max(...catChartData.map(x=>x.views||0), 1)
                const pct = Math.round(((c.views||0) / maxViews) * 100)
                return (
                  <div key={i} style={{ marginBottom:12 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.82rem', marginBottom:4 }}>
                      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                        <div style={{ width:10, height:10, borderRadius:'50%', background:c.color, flexShrink:0 }} />
                        <span style={{ color:'var(--t1)', fontWeight:600 }}>{c.name}</span>
                        <span className="badge blue">{c.value} videos</span>
                      </div>
                      <span style={{ color:'var(--t3)' }}>{fmt(c.views)} views</span>
                    </div>
                    <div style={{ height:5, background:'var(--s3)', borderRadius:99 }}>
                      <div style={{ height:'100%', width:pct+'%', background:`linear-gradient(90deg, ${c.color}, ${c.color}88)`, borderRadius:99, transition:'width 0.6s var(--smooth)' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}