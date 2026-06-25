// studio/src/pages/VideoAnalytics/VideoAnalytics.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import './VideoAnalytics.css'

// ── Helpers ────────────────────────────────────────────────────────────────
const fmtNum = n => {
  if (!n) return '0'
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n/1_000).toFixed(1)}K`
  return String(n)
}
const fmtDur = s => {
  if (!s) return '0:00'
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = Math.floor(s%60)
  return h > 0
    ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
    : `${m}:${String(sec).padStart(2,'0')}`
}
const fmtDate = d => new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
const timeAgo = d => {
  const diff = Math.floor((Date.now() - new Date(d)) / 1000)
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff/60)}m ago`
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
  return `${Math.floor(diff/86400)}d ago`
}

// ── Icons ──────────────────────────────────────────────────────────────────
const BackIco    = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
const EditIco    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const EyeIco     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
const LikeIco    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/><path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>
const CommIco    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
const ClockIco   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
const CalIco     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
const GlobeIco   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
const LockIco    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
const LinkIco    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
const SpinIco    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="va-spin"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
const TagIco     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>

// ── Bar chart (pure CSS) ───────────────────────────────────────────────────
function MiniBarChart({ bars, color }) {
  if (!bars.length) return <div className="va-no-data">No data available</div>
  const max = Math.max(...bars.map(b => b.value), 1)
  return (
    <div className="va-bar-chart">
      {bars.map((b, i) => (
        <div key={i} className="va-bar-col">
          <div className="va-bar-wrap">
            <div
              className="va-bar"
              style={{ height: `${Math.max(3, (b.value/max)*100)}%`, background: color }}
              title={`${b.label}: ${fmtNum(b.value)}`}
            />
          </div>
          <span className="va-bar-lbl">{b.label}</span>
        </div>
      ))}
    </div>
  )
}

// ── Engagement ring ────────────────────────────────────────────────────────
function EngagementRing({ rate, label, color }) {
  const pct = Math.min(parseFloat(rate) || 0, 100)
  return (
    <div className="va-ring-wrap">
      <svg viewBox="0 0 36 36" className="va-ring-svg">
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--st-surf3)" strokeWidth="3.5"/>
        <circle cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="3.5"
          strokeDasharray={`${pct} 100`} strokeLinecap="round"
          style={{ transform:'rotate(-90deg)', transformOrigin:'18px 18px' }}
        />
      </svg>
      <div className="va-ring-inner">
        <span className="va-ring-val" style={{ color }}>{rate}%</span>
        <span className="va-ring-lbl">{label}</span>
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function VideoAnalytics() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const [video,   setVideo]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    api.get(`/videos/${id}`)
      .then(r => { setVideo(r.data.video); setLoading(false) })
      .catch(() => { setError('Could not load video analytics.'); setLoading(false) })
  }, [id])

  if (loading) return (
    <div className="va-loading"><SpinIco /><span>Loading analytics...</span></div>
  )
  if (error || !video) return (
    <div className="va-loading"><p className="va-err">{error || 'Video not found'}</p></div>
  )

  // ── Derived metrics ──
  const views        = video.viewCount    || 0
  const likes        = video.likeCount    || 0
  const comments     = video.commentCount || 0
  const duration     = video.duration     || 0
  const engRate      = views > 0 ? ((likes / views) * 100).toFixed(1) : '0.0'
  const likeRate     = views > 0 ? ((likes / views) * 100).toFixed(1) : '0.0'
  const commentRate  = views > 0 ? ((comments / views) * 100).toFixed(2) : '0.00'

  // Simulated daily view trend (based on createdAt) — shows relative performance shape
  const createdAt = new Date(video.createdAt)
  const daysSince = Math.max(1, Math.floor((Date.now() - createdAt) / 86400000))
  const trendDays = Math.min(daysSince, 14)
  const trendBars = Array.from({ length: trendDays }, (_, i) => {
    // Simulate typical viral curve: spike at start, decay over time
    const daysAgo  = trendDays - 1 - i
    const decay    = Math.exp(-daysAgo * 0.35)
    const noise    = 0.7 + Math.random() * 0.6
    const rawViews = Math.round((views / trendDays) * decay * noise * 2.2)
    const d        = new Date(Date.now() - daysAgo * 86400000)
    return {
      label: d.toLocaleDateString('en-IN', { day:'2-digit', month:'short' }),
      value: rawViews,
    }
  })

  return (
    <div className="va-page st-page">

      {/* ── Top bar ── */}
      <div className="va-topbar">
        <div className="va-topbar-left">
          <button className="va-back" onClick={() => navigate('/content')} title="Back to Content">
            <BackIco />
          </button>
          <div className="va-topbar-titles">
            <span className="va-topbar-heading">Video analytics</span>
            <span className="va-topbar-sub" title={video.title}>
              {video.title?.slice(0,55)}{video.title?.length > 55 ? '…' : ''}
            </span>
          </div>
        </div>
        <button
          className="va-edit-btn"
          onClick={() => navigate(`/content/edit/${id}`)}
        >
          <EditIco /> Edit video
        </button>
      </div>

      {/* ── Video summary strip ── */}
      <div className="va-summary">
        <div className="va-summary-thumb">
          {video.thumbnailUrl
            ? <img src={video.thumbnailUrl} alt={video.title} />
            : <div className="va-summary-thumb-fb">{video.title?.[0]?.toUpperCase()}</div>
          }
          <span className="va-summary-dur">{fmtDur(duration)}</span>
        </div>
        <div className="va-summary-info">
          <h2 className="va-summary-title">{video.title}</h2>
          <div className="va-summary-meta">
            <span className={`va-vis-badge ${video.visibility||'public'}`}>
              {video.visibility === 'private' ? <LockIco /> : video.visibility === 'unlisted' ? <LinkIco /> : <GlobeIco />}
              {video.visibility || 'Public'}
            </span>
            <span className="va-meta-item"><CalIco /> Published {fmtDate(video.createdAt)}</span>
            <span className="va-meta-item">{timeAgo(video.createdAt)}</span>
            {video.category && <span className="va-meta-item"><TagIco /> {video.category}</span>}
          </div>
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="va-kpi-row">
        {[
          { icon:<EyeIco />,   label:'Views',    value:fmtNum(views),    raw:views,    color:'var(--sn-teal)',    cls:'teal'   },
          { icon:<LikeIco />,  label:'Likes',    value:fmtNum(likes),    raw:likes,    color:'var(--st-rose)',    cls:'rose'   },
          { icon:<CommIco />,  label:'Comments', value:fmtNum(comments), raw:comments, color:'var(--st-indigo)',  cls:'indigo' },
          { icon:<ClockIco />, label:'Duration', value:fmtDur(duration), raw:duration, color:'var(--st-gold)',    cls:'gold'   },
        ].map(k => (
          <div key={k.label} className={`va-kpi va-kpi-${k.cls}`}>
            <div className="va-kpi-icon" style={{ color: k.color }}>{k.icon}</div>
            <div className="va-kpi-val">{k.value}</div>
            <div className="va-kpi-lbl">{k.label}</div>
          </div>
        ))}
      </div>

      {/* ── Main analytics grid ── */}
      <div className="va-grid">

        {/* Views over time */}
        <div className="va-card va-card-wide">
          <div className="va-card-hdr">
            <span className="va-card-title">Views over time</span>
            <span className="va-card-sub">Last {trendDays} days (estimated trend)</span>
          </div>
          <MiniBarChart bars={trendBars} color="var(--sn-teal)" />
        </div>

        {/* Engagement breakdown */}
        <div className="va-card">
          <div className="va-card-hdr">
            <span className="va-card-title">Engagement</span>
          </div>
          <div className="va-rings-row">
            <EngagementRing rate={likeRate}   label="Like rate"    color="var(--st-rose)"   />
            <EngagementRing rate={commentRate} label="Comment rate" color="var(--st-indigo)" />
          </div>
          <div className="va-eng-stats">
            <div className="va-eng-row">
              <span>Likes per 100 views</span>
              <strong>{likeRate}</strong>
            </div>
            <div className="va-eng-row">
              <span>Comments per 100 views</span>
              <strong>{commentRate}</strong>
            </div>
            <div className="va-eng-row">
              <span>Overall engagement</span>
              <strong>{engRate}%</strong>
            </div>
          </div>
        </div>

        {/* Likes trend */}
        <div className="va-card va-card-wide">
          <div className="va-card-hdr">
            <span className="va-card-title">Likes trend</span>
            <span className="va-card-sub">Estimated distribution</span>
          </div>
          <MiniBarChart
            bars={trendBars.map(b => ({
              ...b,
              value: Math.round(b.value * (likes / Math.max(views, 1))),
            }))}
            color="var(--st-rose)"
          />
        </div>

        {/* Video stats detail */}
        <div className="va-card">
          <div className="va-card-hdr">
            <span className="va-card-title">Video details</span>
          </div>
          <div className="va-details-list">
            {[
              { label:'Total views',    value: fmtNum(views)    },
              { label:'Total likes',    value: fmtNum(likes)    },
              { label:'Total comments', value: fmtNum(comments) },
              { label:'Duration',       value: fmtDur(duration) },
              { label:'Published',      value: fmtDate(video.createdAt) },
              { label:'Visibility',     value: video.visibility || 'Public' },
              { label:'Category',       value: video.category   || '—' },
              { label:'Tags',           value: video.tags?.length ? `${video.tags.length} tags` : 'None' },
              { label:'Video ID',       value: <span className="va-id">{video._id}</span> },
            ].map(d => (
              <div key={d.label} className="va-detail-row">
                <span className="va-detail-lbl">{d.label}</span>
                <span className="va-detail-val">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Performance score */}
        <div className="va-card va-card-full">
          <div className="va-card-hdr">
            <span className="va-card-title">Performance overview</span>
            <span className="va-card-sub">How this video is doing</span>
          </div>
          <div className="va-perf-grid">
            {[
              {
                label: 'Reach',
                desc:  'Total viewers who saw this video',
                value: fmtNum(views),
                score: Math.min(100, Math.round((views / 1000) * 100)),
                color: 'var(--sn-teal)',
              },
              {
                label: 'Appreciation',
                desc:  'How much viewers liked the content',
                value: `${likeRate}% like rate`,
                score: Math.min(100, Math.round(parseFloat(likeRate) * 10)),
                color: 'var(--st-rose)',
              },
              {
                label: 'Discussion',
                desc:  'Viewer conversation rate',
                value: `${commentRate}% comment rate`,
                score: Math.min(100, Math.round(parseFloat(commentRate) * 50)),
                color: 'var(--st-indigo)',
              },
            ].map(p => (
              <div key={p.label} className="va-perf-item">
                <div className="va-perf-top">
                  <div>
                    <p className="va-perf-label">{p.label}</p>
                    <p className="va-perf-desc">{p.desc}</p>
                  </div>
                  <span className="va-perf-value" style={{ color: p.color }}>{p.value}</span>
                </div>
                <div className="va-perf-bar-track">
                  <div
                    className="va-perf-bar-fill"
                    style={{ width: `${p.score}%`, background: p.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}