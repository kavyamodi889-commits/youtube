// studio/src/pages/Analytics/Analytics.jsx
import { useState, useEffect } from 'react'
import api from '../../services/api'
import { useStudioAuth } from '../../context/StudioAuthContext'
import './Analytics.css'

// ── helpers ──────────────────────────────────────────────────────
const fmtNum = n => {
  if (!n) return '0'
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n/1_000).toFixed(1)}K`
  return String(n)
}
const fmtDate = d => new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })

// ── Icons ─────────────────────────────────────────────────────────
const EyeIco     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
const LikeIco    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/><path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>
const CommentIco = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
const SubIco     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
const ArrowIco   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>
const ArrowDIco  = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>

// ── Skeleton ──────────────────────────────────────────────────────
const Skel = ({ w='100%', h=14, r=6 }) => (
  <div className="an-skel" style={{ width:w, height:h, borderRadius:r }} />
)

// ── Simple bar chart (pure CSS, no lib) ──────────────────────────
function BarChart({ data, valueKey, labelKey, color = 'var(--st-rose)' }) {
  if (!data.length) return <div className="an-empty-chart">No data yet</div>
  const max = Math.max(...data.map(d => d[valueKey] || 0), 1)
  return (
    <div className="an-bar-chart">
      {data.map((item, i) => (
        <div key={i} className="an-bar-col">
          <div className="an-bar-wrap">
            <div
              className="an-bar"
              style={{
                height: `${Math.max(2, (item[valueKey] / max) * 100)}%`,
                background: color,
              }}
              title={`${item[labelKey]}: ${fmtNum(item[valueKey])}`}
            />
          </div>
          <span className="an-bar-label">{item[labelKey]}</span>
        </div>
      ))}
    </div>
  )
}

// ── Donut chart (pure SVG) ────────────────────────────────────────
function DonutChart({ segments, size = 120 }) {
  const r = 40, cx = 60, cy = 60
  const circ = 2 * Math.PI * r
  const total = segments.reduce((a, s) => a + s.value, 0) || 1
  let offset = 0
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className="an-donut">
      {segments.map((seg, i) => {
        const pct  = seg.value / total
        const dash = pct * circ
        const gap  = circ - dash
        const el = (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="18"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            style={{ transform: 'rotate(-90deg)', transformOrigin: '60px 60px' }}
          />
        )
        offset += dash
        return el
      })}
      {/* Centre hole */}
      <circle cx={cx} cy={cy} r={26} fill="var(--st-surf1)" />
    </svg>
  )
}

export default function Analytics() {
  const { user } = useStudioAuth()
  const [videos,  setVideos]  = useState([])
  const [loading, setLoading] = useState(true)
  const [period,  setPeriod]  = useState('28') // days

  useEffect(() => {
    api.get('/videos/user/me')
      .then(r => setVideos(r.data.videos || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // ── Derived analytics ─────────────────────────────────────────
  const days = parseInt(period)
  const cutoff = new Date(Date.now() - days * 86400 * 1000)
  const recent = videos.filter(v => new Date(v.createdAt) >= cutoff)

  const totalViews    = videos.reduce((a,v) => a + (v.viewCount||0),    0)
  const totalLikes    = videos.reduce((a,v) => a + (v.likeCount||0),    0)
  const totalComments = videos.reduce((a,v) => a + (v.commentCount||0), 0)
  const recentViews   = recent.reduce((a,v) => a + (v.viewCount||0),    0)
  const recentLikes   = recent.reduce((a,v) => a + (v.likeCount||0),    0)

  // Top 10 by views
  const topByViews = [...videos]
    .sort((a,b) => (b.viewCount||0) - (a.viewCount||0))
    .slice(0, 10)

  // Top 10 by likes
  const topByLikes = [...videos]
    .sort((a,b) => (b.likeCount||0) - (a.likeCount||0))
    .slice(0, 5)

  // Views by video (bar chart data — last 10 videos by date)
  const last10 = [...videos]
    .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10)
    .reverse()
    .map(v => ({ label: fmtDate(v.createdAt), views: v.viewCount||0, likes: v.likeCount||0 }))

  // Category breakdown
  const catMap = {}
  videos.forEach(v => {
    const c = v.category || 'Uncategorised'
    catMap[c] = (catMap[c] || 0) + 1
  })
  const COLORS = ['#b5294e','#6654a8','#2d9e8c','#c8922a','#22c55e','#ef4444','#3b82f6','#a855f7']
  const categories = Object.entries(catMap)
    .sort((a,b) => b[1] - a[1])
    .map(([name, count], i) => ({ name, count, color: COLORS[i % COLORS.length] }))

  // Engagement rate
  const engRate = totalViews > 0
    ? ((totalLikes / totalViews) * 100).toFixed(1)
    : '0.0'

  return (
    <div className="an-wrap">
      {/* Header */}
      <div className="an-header">
        <div>
          <h1 className="an-title">Analytics</h1>
          <p className="an-subtitle">Channel performance overview</p>
        </div>
        <div className="an-period-tabs">
          {[['7','7 days'],['28','28 days'],['90','90 days'],['365','1 year']].map(([v,l]) => (
            <button
              key={v}
              className={`an-period-tab ${period === v ? 'active' : ''}`}
              onClick={() => setPeriod(v)}
            >{l}</button>
          ))}
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="an-kpi-row">
        {[
          { icon: <EyeIco/>,     label: 'Total views',    val: totalViews,    sub: `${fmtNum(recentViews)} last ${period}d`,  color: 'rose'   },
          { icon: <LikeIco/>,    label: 'Total likes',    val: totalLikes,    sub: `${fmtNum(recentLikes)} last ${period}d`,  color: 'indigo' },
          { icon: <CommentIco/>, label: 'Comments',       val: totalComments, sub: `Across ${videos.length} videos`,           color: 'teal'   },
          { icon: <SubIco/>,     label: 'Subscribers',    val: user?.subscriberCount || 0, sub: 'Total channel subs',         color: 'gold'   },
        ].map(k => (
          <div key={k.label} className={`an-kpi-card an-kpi-${k.color}`}>
            <div className="an-kpi-icon">{k.icon}</div>
            <div className="an-kpi-body">
              <div className="an-kpi-val">
                {loading ? <Skel w={60} h={24} r={5}/> : fmtNum(k.val)}
              </div>
              <div className="an-kpi-label">{k.label}</div>
              <div className="an-kpi-sub">{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Row: bar chart + engagement ── */}
      <div className="an-row-2">

        {/* Views per video bar chart */}
        <div className="an-card an-card-wide">
          <div className="an-card-header">
            <span className="an-card-title">Views per video</span>
            <span className="an-card-sub">Last {Math.min(10, videos.length)} uploads</span>
          </div>
          {loading
            ? <Skel h={140} r={8}/>
            : <BarChart data={last10} valueKey="views" labelKey="label" color="var(--st-rose)" />
          }
        </div>

        {/* Engagement + category donut */}
        <div className="an-card">
          <div className="an-card-header">
            <span className="an-card-title">Engagement rate</span>
          </div>
          {loading ? (
            <Skel h={120} r={8}/>
          ) : (
            <div className="an-engagement">
              <div className="an-eng-ring">
                <svg viewBox="0 0 36 36" className="an-ring-svg">
                  <circle cx="18" cy="18" r="15.9"
                    fill="none" stroke="var(--st-surf3)" strokeWidth="3.8"/>
                  <circle cx="18" cy="18" r="15.9"
                    fill="none" stroke="var(--st-rose)" strokeWidth="3.8"
                    strokeDasharray={`${Math.min(parseFloat(engRate), 100)} 100`}
                    strokeLinecap="round"
                    style={{ transform:'rotate(-90deg)', transformOrigin:'18px 18px' }}
                  />
                </svg>
                <div className="an-ring-val">{engRate}%</div>
              </div>
              <div className="an-eng-stats">
                <div className="an-eng-row">
                  <span>Likes / View</span>
                  <span>{engRate}%</span>
                </div>
                <div className="an-eng-row">
                  <span>Comments / Video</span>
                  <span>{videos.length ? (totalComments / videos.length).toFixed(1) : '0'}</span>
                </div>
                <div className="an-eng-row">
                  <span>Avg views / video</span>
                  <span>{videos.length ? fmtNum(Math.round(totalViews / videos.length)) : '0'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Row: top videos + category breakdown ── */}
      <div className="an-row-2">

        {/* Top videos table */}
        <div className="an-card an-card-wide">
          <div className="an-card-header">
            <span className="an-card-title">Top videos by views</span>
            <span className="an-card-sub">All time</span>
          </div>
          {loading ? (
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {Array(5).fill(0).map((_,i) => <Skel key={i} h={12}/>)}
            </div>
          ) : topByViews.length === 0 ? (
            <div className="an-empty">Upload videos to see analytics</div>
          ) : (
            <div className="an-top-table">
              <div className="an-top-head">
                <span className="an-top-col-title">Video</span>
                <span><EyeIco/> Views</span>
                <span><LikeIco/> Likes</span>
                <span><CommentIco/> Comments</span>
              </div>
              {topByViews.map((v, i) => (
                <div key={v._id} className="an-top-row">
                  <span className="an-top-rank">{i+1}</span>
                  <div className="an-top-thumb">
                    {v.thumbnailUrl
                      ? <img src={v.thumbnailUrl} alt=""/>
                      : <div className="an-top-thumb-fb"/>
                    }
                  </div>
                  <span className="an-top-title">{v.title}</span>
                  <span className="an-top-val">{fmtNum(v.viewCount||0)}</span>
                  <span className="an-top-val">{fmtNum(v.likeCount||0)}</span>
                  <span className="an-top-val">{fmtNum(v.commentCount||0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category breakdown */}
        <div className="an-card">
          <div className="an-card-header">
            <span className="an-card-title">Category breakdown</span>
            <span className="an-card-sub">{videos.length} videos</span>
          </div>
          {loading ? (
            <Skel h={120} r={8}/>
          ) : categories.length === 0 ? (
            <div className="an-empty">No data</div>
          ) : (
            <div className="an-cat-wrap">
              <DonutChart segments={categories.map(c => ({ value: c.count, color: c.color }))} />
              <div className="an-cat-legend">
                {categories.slice(0, 7).map(c => (
                  <div key={c.name} className="an-cat-row">
                    <span className="an-cat-dot" style={{ background: c.color }}/>
                    <span className="an-cat-name">{c.name}</span>
                    <span className="an-cat-count">{c.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}