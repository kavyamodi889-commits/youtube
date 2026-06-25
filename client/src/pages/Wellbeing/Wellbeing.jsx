// FILE: client/src/pages/Wellbeing/Wellbeing.jsx
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext.jsx'
import api from '../../services/api.js'
import './Wellbeing.css'

const PERIOD_OPTIONS = [
  { label: 'Today',   value: 1  },
  { label: '7 days',  value: 7  },
  { label: '30 days', value: 30 },
]

const DAY_ORDER = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

function sortDaysMtoS(byDay = []) {
  return [...byDay].sort((a, b) => {
    const ai = DAY_ORDER.indexOf(a.day)
    const bi = DAY_ORDER.indexOf(b.day)
    if (ai === bi) return a.date.localeCompare(b.date)
    return ai - bi
  })
}

// ── Redesigned SVG Line chart ─────────────────────────────────────
function LineChart({ data, color = 'var(--a)', valueKey = 'minutes' }) {
  if (!data || data.length === 0) return <div className="wb-empty-hint">No data</div>

  const W = 500, H = 100
  const PAD = { top: 10, right: 8, bottom: 4, left: 8 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const vals = data.map(d => d[valueKey] || 0)
  const max  = Math.max(...vals, 1)

  const getX = i => PAD.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW)
  const getY = v => PAD.top + innerH - (v / max) * (innerH - 6)

  const pts = data.map((d, i) => ({ x: getX(i), y: getY(d[valueKey] || 0), val: d[valueKey] || 0 }))

  // Smooth path using cubic bezier
  const linePath = pts.map((p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`
    const prev = pts[i - 1]
    const cpx = (prev.x + p.x) / 2
    return `C ${cpx} ${prev.y} ${cpx} ${p.y} ${p.x} ${p.y}`
  }).join(' ')

  const areaPath = linePath
    + ` L ${pts[pts.length - 1].x} ${H - PAD.bottom}`
    + ` L ${pts[0].x} ${H - PAD.bottom} Z`

  const gradId = `grad-${color.replace(/[^a-z0-9]/gi, '')}`

  return (
    <div className="wb-linechart-wrap">
      <svg className="wb-linechart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.20" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
          <filter id="dot-shadow">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Subtle horizontal grid lines at 25%, 50%, 75% */}
        {[0.25, 0.5, 0.75].map((pct, i) => (
          <line key={i}
            x1={PAD.left} y1={PAD.top + (1 - pct) * innerH}
            x2={W - PAD.right} y2={PAD.top + (1 - pct) * innerH}
            stroke="currentColor" strokeOpacity="0.07" strokeWidth="1" strokeDasharray="4 4"
          />
        ))}

        {/* Area fill */}
        <path d={areaPath} fill={`url(#${gradId})`} />

        {/* Line */}
        <path d={linePath} fill="none" stroke={color} strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots */}
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="5" fill={color} opacity="0.15" />
            <circle cx={p.x} cy={p.y} r="3" fill={color} stroke="white" strokeWidth="1.5"
              filter="url(#dot-shadow)" />
            <title>{`${data[i].day}: ${p.val}m`}</title>
          </g>
        ))}
      </svg>

      {/* X-axis labels */}
      <div className="wb-linechart-labels">
        {data.map((d, i) => (
          <span key={i}>{d.day || d.name || d.label}</span>
        ))}
      </div>
    </div>
  )
}

// ── Category bar chart — fills height properly ────────────────────
function CategoryBarChart({ data, maxVal }) {
  if (!data || data.length === 0) return <div className="wb-empty-hint">No data</div>
  const COLORS = ['var(--a)', 'var(--b)', 'var(--c)', 'var(--gold)', '#7c3aed']
  return (
    <div className="wb-cat-barchart">
      {data.slice(0, 5).map((item, i) => (
        <motion.div key={i} className="wb-cat-bar-col"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}>
          <div className="wb-cat-bar-track">
            <motion.div className="wb-cat-bar-fill"
              style={{ background: COLORS[i % COLORS.length], width: '100%', borderRadius: '6px 6px 0 0' }}
              initial={{ height: '0%' }}
              animate={{ height: maxVal > 0 ? `${Math.max(4, (item.minutes / maxVal) * 100)}%` : '4%' }}
              transition={{ duration: 0.7, delay: i * 0.07, ease: [0.4,0,0.2,1] }}
            />
          </div>
          <div className="wb-cat-bar-val">{item.minutes}<span>m</span></div>
          <div className="wb-cat-bar-label" title={item.name}>{item.name}</div>
        </motion.div>
      ))}
    </div>
  )
}

// ── Donut chart ───────────────────────────────────────────────────
function DonutChart({ shorts, videos }) {
  const total      = shorts + videos || 1
  const CIRC       = 2 * Math.PI * 54
  const shortsPct  = shorts / total
  const shortsDash = shortsPct * CIRC
  return (
    <div className="wb-donut-wrap">
      <svg width="130" height="130" viewBox="0 0 130 130">
        <circle cx="65" cy="65" r="54" fill="none" stroke="var(--b)"
          strokeWidth="18" strokeDasharray={CIRC} strokeDashoffset={shortsDash}
          transform="rotate(-90 65 65)" strokeLinecap="round" />
        <circle cx="65" cy="65" r="54" fill="none" stroke="var(--a)"
          strokeWidth="18" strokeDasharray={CIRC} strokeDashoffset={CIRC - shortsDash}
          transform={`rotate(${-90 + (1 - shortsPct) * 360} 65 65)`} strokeLinecap="round" />
      </svg>
      <div className="wb-donut-center">
        <span className="wb-donut-total">{shorts + videos}</span>
        <span className="wb-donut-label">min</span>
      </div>
    </div>
  )
}

// ── Active hours heatmap ──────────────────────────────────────────
function HourHeatmap({ byHour }) {
  const max = Math.max(...byHour.map(h => h.minutes), 1)
  return (
    <div className="wb-heatmap">
      {byHour.map((h, i) => (
        <div key={i} className="wb-heatmap-cell"
          title={`${h.label}: ${h.minutes} min`}
          style={{ opacity: 0.1 + 0.9 * (h.minutes / max) }}>
          <div className="wb-heatmap-fill"
            style={{ height: `${Math.max(4, (h.minutes / max) * 100)}%` }} />
        </div>
      ))}
    </div>
  )
}

// ── Focus mini bar per day ────────────────────────────────────────
function FocusDayBars({ byDay }) {
  const max = Math.max(...byDay.map(d => d.focusMinutes || 0), 1)
  return (
    <div className="wb-focus-day-bars">
      {byDay.map((d, i) => (
        <div key={i} className="wb-focus-day-col">
          <div className="wb-focus-day-track">
            <motion.div className="wb-focus-day-fill"
              initial={{ height: 0 }}
              animate={{ height: max > 0 ? `${Math.max(4, ((d.focusMinutes || 0) / max) * 100)}%` : '4%' }}
              transition={{ duration: 0.6, delay: i * 0.06 }}
              title={`${d.day}: ${d.focusMinutes || 0} min focused`}
            />
          </div>
          <span className="wb-focus-day-label">{d.day}</span>
        </div>
      ))}
    </div>
  )
}

// ── Focus ring ────────────────────────────────────────────────────
function FocusRing({ ratio, size = 80, strokeWidth = 8 }) {
  const r    = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const pct  = Math.min(1, ratio)
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="var(--s3)" strokeWidth={strokeWidth} />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="var(--b)" strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
    </svg>
  )
}

// ═════════════════════════════════════════════════════════════════
export default function Wellbeing() {
  const { user }  = useAuth()
  const [period,  setPeriod]        = useState(7)
  const [activeHourDay, setHourDay] = useState(null)
  const [data,    setData]          = useState(null)
  const [loading, setLoading]       = useState(true)
  const [error,   setError]         = useState(null)

  const fetchData = useCallback(async () => {
    if (!user) { setLoading(false); return }
    try {
      setLoading(true); setError(null)
      const res = await api.get(`/focus/wellbeing?days=${period}`)
      setData(res.data)
    } catch {
      setError('Failed to load wellbeing data')
    } finally {
      setLoading(false)
    }
  }, [user, period])

  useEffect(() => { fetchData(); setHourDay(null) }, [fetchData])

  const sortedDays     = data ? sortDaysMtoS(data.byDay || []) : []
  const maxCategoryMin = data ? Math.max(...(data.byCategory || []).map(c => c.minutes), 1) : 1

  const sortedDaysWithFocus = sortedDays.map(d => ({
    ...d, focusMinutes: d.focusMinutes || 0,
  }))

  const wellbeingScore = data
    ? Math.min(100, Math.round(
        50 +
        (data.focusMinutes / Math.max(data.totalMinutes, 1)) * 30 +
        (data.streak / 7) * 20
      ))
    : null

  const scoreLabel = wellbeingScore
    ? wellbeingScore >= 80 ? 'Excellent 🌟'
      : wellbeingScore >= 60 ? 'Good 👍'
      : wellbeingScore >= 40 ? 'Fair 📊'
      : 'Needs attention ⚠️'
    : ''

  const focusRatio = data
    ? data.focusMinutes / Math.max(data.focusMinutes + data.totalMinutes, 1)
    : 0

  if (!user) return (
    <div className="wb-page">
      <div className="wb-auth-wall">
        <div className="wb-auth-icon">📊</div>
        <h2>Sign in to see Digital Wellbeing</h2>
        <p>Track your watch habits and maintain a healthy balance.</p>
        <Link to="/auth" className="wb-cta-btn">Sign in</Link>
      </div>
    </div>
  )

  return (
    <motion.div className="wb-page"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>

      {/* Header */}
      <div className="wb-header">
        <div className="wb-header-left">
          <h1 className="wb-title">Digital Wellbeing</h1>
          <p className="wb-subtitle">Understand your watch habits and stay balanced</p>
        </div>
        <div className="wb-period-tabs">
          {PERIOD_OPTIONS.map(p => (
            <button key={p.value}
              className={`wb-period-tab ${period === p.value ? 'active' : ''}`}
              onClick={() => setPeriod(p.value)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="wb-error">
          <span>⚠️ {error}</span>
          <button onClick={fetchData}>Retry</button>
        </div>
      )}

      {loading ? (
        <div className="wb-loading">
          <div className="wb-spinner" />
          <span>Loading your data...</span>
        </div>
      ) : data && (
        <div className="wb-grid">

          {/* ── Row 1: Key stat cards ── */}
          <div className="wb-stats-row">
            <motion.div className="wb-stat-card"
              initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0 }}>
              <span className="wb-stat-icon">⏱</span>
              <div className="wb-stat-value">
                {data.totalMinutes >= 60
                  ? `${Math.round(data.totalMinutes/60)}h ${data.totalMinutes%60}m`
                  : `${data.totalMinutes}m`}
              </div>
              <div className="wb-stat-label">Watch time</div>
              <div className="wb-stat-sub">last {period} day{period>1?'s':''}</div>
            </motion.div>

            <motion.div className="wb-stat-card"
              initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.07 }}>
              <span className="wb-stat-icon">📺</span>
              <div className="wb-stat-value">{data.totalVideos}</div>
              <div className="wb-stat-label">Videos watched</div>
              <div className="wb-stat-sub">
                {data.videosMinutes > 0
                  ? `avg ${Math.round(data.videosMinutes / Math.max(data.totalVideos - (data.shortsCount||0), 1))}m per video`
                  : 'includes Shorts + Videos'}
              </div>
            </motion.div>

            <motion.div className="wb-stat-card"
              initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.14 }}>
              <span className="wb-stat-icon">🎯</span>
              <div className="wb-stat-value">{data.focusCompleted}</div>
              <div className="wb-stat-label">Focus sessions</div>
              <div className="wb-stat-sub">{data.focusMinutes} min focused</div>
            </motion.div>

            <motion.div className="wb-stat-card"
              initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.21 }}>
              <span className="wb-stat-icon">🔥</span>
              <div className="wb-stat-value">{data.streak} <span style={{fontSize:'1rem'}}>day{data.streak!==1?'s':''}</span></div>
              <div className="wb-stat-label">Watch streak</div>
              <div className="wb-stat-sub">consecutive days</div>
            </motion.div>
          </div>

          {/* ── Row 2: Wellbeing score + Shorts vs Videos ── */}
          <div className="wb-row-2">
            <motion.div className="wb-card wb-score-card"
              initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}>
              <h3 className="wb-card-title">Wellbeing Score</h3>
              <div className="wb-score-wrap">
                <div className="wb-score-ring">
                  <svg width="120" height="120" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none"
                      stroke="var(--s3)" strokeWidth="10" />
                    <circle cx="60" cy="60" r="50" fill="none"
                      stroke={wellbeingScore >= 80 ? 'var(--ok)' : wellbeingScore >= 60 ? 'var(--b)' : wellbeingScore >= 40 ? 'var(--gold)' : 'var(--err)'}
                      strokeWidth="10" strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 50}
                      strokeDashoffset={2 * Math.PI * 50 * (1 - wellbeingScore/100)}
                      transform="rotate(-90 60 60)"
                      style={{ transition: 'stroke-dashoffset 1s ease' }}
                    />
                  </svg>
                  <div className="wb-score-num">{wellbeingScore}</div>
                </div>
                <div className="wb-score-info">
                  <div className="wb-score-label">{scoreLabel}</div>
                  <p className="wb-score-hint">
                    {wellbeingScore >= 70
                      ? 'Great balance between watching and focusing!'
                      : 'Try using Focus Mode to improve your score.'}
                  </p>
                  <Link to="/focus" className="wb-focus-cta">
                    🎯 Start Focus Session →
                  </Link>
                </div>
              </div>
            </motion.div>

            <motion.div className="wb-card"
              initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}>
              <h3 className="wb-card-title">Shorts vs Videos</h3>
              <div className="wb-donut-section">
                <DonutChart shorts={data.shortsMinutes} videos={data.videosMinutes} />
                <div className="wb-donut-legend">
                  <div className="wb-legend-item">
                    <span className="wb-legend-dot" style={{ background:'var(--a)' }} />
                    <div>
                      <div className="wb-legend-label">Shorts</div>
                      <div className="wb-legend-val">{data.shortsMinutes} min</div>
                    </div>
                  </div>
                  <div className="wb-legend-item">
                    <span className="wb-legend-dot" style={{ background:'var(--b)' }} />
                    <div>
                      <div className="wb-legend-label">Videos</div>
                      <div className="wb-legend-val">{data.videosMinutes} min</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── Row 3: Watch time by day + Active hours ── */}
          <div className="wb-row-2">
            <motion.div className="wb-card"
              initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}>
              {/* Title & hint tightly grouped */}
              <div className="wb-card-title-group">
                <h3 className="wb-card-title">Watch time by day</h3>
                <p className="wb-card-hint">Monday to Sunday</p>
              </div>
              <LineChart data={sortedDays} color="var(--b)" valueKey="minutes" />
            </motion.div>

            <motion.div className="wb-card"
              initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }}>
              <div className="wb-active-hours-header">
                {/* Title & hint tightly grouped */}
                <div className="wb-active-hours-header-text">
                  <h3 className="wb-card-title">Active hours</h3>
                  <p className="wb-card-hint">When you watch the most</p>
                </div>
                {sortedDays.length > 1 && (
                  <div className="wb-hour-day-tabs">
                    <button
                      className={`wb-hour-day-tab ${activeHourDay === null ? 'active' : ''}`}
                      onClick={() => setHourDay(null)}>
                      All
                    </button>
                    {sortedDays.map(d => (
                      <button key={d.date}
                        className={`wb-hour-day-tab ${activeHourDay === d.date ? 'active' : ''}`}
                        title={d.date}
                        onClick={() => setHourDay(d.date)}>
                        {d.day}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <HourHeatmap byHour={
                activeHourDay && data.byHourByDay?.[activeHourDay]
                  ? data.byHourByDay[activeHourDay]
                  : data.byHour
              } />
              <div className="wb-hour-labels">
                <span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>11pm</span>
              </div>
            </motion.div>
          </div>

          {/* ── Row 4: Top categories + Most watched ── */}
          <div className="wb-row-2">
            <motion.div className="wb-card"
              initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}>
              <div className="wb-card-title-group">
                <h3 className="wb-card-title">Top categories watched</h3>
                <p className="wb-card-hint">By minutes watched</p>
              </div>
              {data.byCategory.length === 0
                ? <p className="wb-empty-hint">No watch data yet.</p>
                : <CategoryBarChart data={data.byCategory} maxVal={maxCategoryMin} />
              }
            </motion.div>

            <motion.div className="wb-card"
              initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }}>
              <div className="wb-card-title-group">
                <h3 className="wb-card-title">Most watched</h3>
                <p className="wb-card-hint">Your top 5 videos this period</p>
              </div>
              {data.topVideos.length === 0
                ? <p className="wb-empty-hint">No videos watched yet.</p>
                : (
                  <div className="wb-top-videos">
                    {data.topVideos.map((v, i) => (
                      <div key={i} className="wb-top-video-row">
                        <span className="wb-top-idx">{i+1}</span>
                        <div className="wb-top-info">
                          <span className="wb-top-title">{v.title}</span>
                          <span className="wb-top-meta">{v.category} · {v.isShort ? 'Short' : 'Video'}</span>
                        </div>
                        <span className="wb-top-time">{v.minutes}m</span>
                      </div>
                    ))}
                  </div>
                )
              }
            </motion.div>
          </div>

          {/* ── Row 5: Focus deep-dive (full width) ── */}
          <motion.div className="wb-card wb-card-full wb-focus-full"
            initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}>

            <div className="wb-focus-header">
              {/* Title & hint tightly grouped */}
              <div className="wb-focus-header-text">
                <h3 className="wb-card-title">🎯 Focus Activity</h3>
                <p className="wb-card-hint">Your most important habit — tracked in detail</p>
              </div>
              <Link to="/focus" className="wb-focus-cta">Start a session →</Link>
            </div>

            <div className="wb-focus-kpi-row">
              {[
                { val: data.focusCompleted,   label: 'Sessions completed', icon: '✅' },
                { val: `${data.focusMinutes}m`, label: 'Total focus time',  icon: '⏳' },
                { val: `${Math.round(focusRatio * 100)}%`, label: 'Focus ratio', icon: '📊',
                  sub: 'focus vs watch time' },
                { val: data.focusMinutes > 0 && data.focusCompleted > 0
                    ? `${Math.round(data.focusMinutes / data.focusCompleted)}m` : '—',
                  label: 'Avg session length', icon: '🕐' },
              ].map((k, i) => (
                <div key={i} className="wb-focus-kpi">
                  <span className="wb-focus-kpi-icon">{k.icon}</span>
                  <div className="wb-focus-kpi-val">{k.val}</div>
                  <div className="wb-focus-kpi-label">{k.label}</div>
                  {k.sub && <div className="wb-focus-kpi-sub">{k.sub}</div>}
                </div>
              ))}
              <div className="wb-focus-kpi wb-focus-ring-kpi">
                <FocusRing ratio={focusRatio} size={72} strokeWidth={7} />
                <div className="wb-focus-kpi-label" style={{ textAlign: 'center' }}>
                  {Math.round(focusRatio * 100)}% focused
                </div>
              </div>
            </div>

            <div className="wb-focus-charts-row">
              <div className="wb-focus-chart-block">
                <div className="wb-focus-chart-title">Focus minutes by day</div>
                <FocusDayBars byDay={sortedDaysWithFocus} />
              </div>
              <div className="wb-focus-chart-block">
                <div className="wb-focus-chart-title">Focus active hours</div>
                <HourHeatmap byHour={
                  (data.byHour || []).map(h => ({ ...h, minutes: h.minutes }))
                } />
                <div className="wb-hour-labels">
                  <span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>11pm</span>
                </div>
              </div>
            </div>

            {data.focusCompleted === 0 && (
              <div className="wb-focus-cta-banner">
                <span>🧘 You haven't started any focus sessions this period.</span>
                <Link to="/focus" className="wb-cta-btn" style={{ fontSize: 13, padding: '8px 20px' }}>
                  Try Focus Mode
                </Link>
              </div>
            )}
          </motion.div>

        </div>
      )}
    </motion.div>
  )
}