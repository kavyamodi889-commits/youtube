// studio/src/pages/Earn/Earn.jsx
import { useState, useEffect } from 'react'
import api from '../../services/api'
import { useStudioAuth } from '../../context/StudioAuthContext'
import './Earn.css'

// ── helpers ──────────────────────────────────────────────────────
const fmtNum = n => {
  if (!n) return '0'
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n/1_000).toFixed(1)}K`
  return String(n)
}

// ── Icons ─────────────────────────────────────────────────────────
const DollarIco  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
const CheckIco   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
const LockIco    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
const SubIco     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
const ClockIco   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
const SpinIco    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="en-spin"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
const ArrowIco   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>

// ── Eligibility thresholds ────────────────────────────────────────
const SUBS_NEEDED  = 1000
const HOURS_NEEDED = 4000

// ── Revenue stream cards ──────────────────────────────────────────
const STREAMS = [
  {
    emoji: '📺',
    title: 'Ad Revenue',
    desc: 'Earn from ads displayed before and during your videos. Revenue is based on CPM (cost per thousand views).',
    est: 'Est. ₹20–₹400 per 1K views',
    available: true,
  },
  {
    emoji: '⭐',
    title: 'Channel Memberships',
    desc: 'Offer monthly membership tiers with exclusive perks, badges, and members-only content.',
    est: '₹79 – ₹1,999 / month tiers',
    available: true,
  },
  {
    emoji: '🙏',
    title: 'Super Thanks',
    desc: 'Let viewers send one-time payments to show support during regular videos.',
    est: '₹49 – ₹5,000 per thanks',
    available: true,
  },
  {
    emoji: '🎁',
    title: 'Live Donations',
    desc: 'Receive real-time tips during live streams. Donors get highlighted in the chat.',
    est: 'Any amount, any time',
    available: true,
  },
  {
    emoji: '🎓',
    title: 'Course Sales',
    desc: 'Sell premium courses directly to your audience through the AURA Courses platform.',
    est: 'You set the price',
    available: true,
  },
  {
    emoji: '🛍️',
    title: 'Merchandise',
    desc: 'Display your merch store below every video. Integration with major print-on-demand providers.',
    est: 'Coming soon',
    available: false,
  },
]

// ── Skeleton ──────────────────────────────────────────────────────
const Skel = ({ w = '100%', h = 14, r = 6 }) => (
  <div className="en-skel" style={{ width: w, height: h, borderRadius: r }} />
)

export default function Earn() {
  const { user } = useStudioAuth()
  const [videos,  setVideos]  = useState([])
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState('overview') // overview | eligibility | history

  useEffect(() => {
    api.get('/videos/user/me')
      .then(r => setVideos(r.data.videos || []))
      .catch(() => setVideos([]))
      .finally(() => setLoading(false))
  }, [])

  // Derive stats from videos
  const totalWatchSec  = videos.reduce((a, v) => a + (v.duration || 0) * (v.viewCount || 0), 0)
  const watchHours     = Math.round(totalWatchSec / 3600)
  const subscribers    = user?.subscriberCount || user?.subscribers || 0
  const isEligible     = subscribers >= SUBS_NEEDED && watchHours >= HOURS_NEEDED

  const subPct  = Math.min(100, Math.round((subscribers / SUBS_NEEDED)  * 100))
  const hrPct   = Math.min(100, Math.round((watchHours  / HOURS_NEEDED) * 100))

  return (
    <div className="en-page">

      {/* ── Header ── */}
      <div className="en-header">
        <div className="en-header-left">
          <div className="en-header-icon">
            <DollarIco />
          </div>
          <div>
            <h1 className="en-title">Earn</h1>
            <p className="en-sub">Monetise your content and grow your revenue</p>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="en-tabs">
        {[
          { id: 'overview',     label: 'Overview' },
          { id: 'eligibility',  label: 'Eligibility' },
          { id: 'history',      label: 'Revenue history' },
        ].map(t => (
          <button
            key={t.id}
            className={`en-tab${tab === t.id ? ' en-tab-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════ OVERVIEW ══════════════ */}
      {tab === 'overview' && (
        <>
          {/* Status banner */}
          <div className={`en-status-banner${isEligible ? ' eligible' : ''}`}>
            <div className="en-status-icon">
              {isEligible ? <CheckIco /> : <LockIco />}
            </div>
            <div className="en-status-body">
              <p className="en-status-title">
                {isEligible
                  ? 'You\'re eligible for monetisation!'
                  : 'You\'re not yet eligible for monetisation'}
              </p>
              <p className="en-status-desc">
                {isEligible
                  ? 'All requirements met. Enable monetisation to start earning.'
                  : 'Complete the requirements below to unlock revenue features.'}
              </p>
            </div>
            {isEligible && (
              <button className="en-enable-btn">
                Enable monetisation <ArrowIco />
              </button>
            )}
          </div>

          {/* Quick stats */}
          <div className="en-stats-row">
            {[
              { label: 'Subscribers',  value: loading ? null : fmtNum(subscribers), icon: <SubIco />,   color: 'var(--st-indigo)' },
              { label: 'Watch hours',  value: loading ? null : fmtNum(watchHours),  icon: <ClockIco />, color: 'var(--sn-teal)' },
              { label: 'Total videos', value: loading ? null : String(videos.length), icon: null,        color: 'var(--st-rose)' },
            ].map(s => (
              <div key={s.label} className="en-stat-card">
                <div className="en-stat-top">
                  <span className="en-stat-label">{s.label}</span>
                  {s.icon && <span style={{ color: s.color }}>{s.icon}</span>}
                </div>
                <div className="en-stat-val" style={{ color: s.color }}>
                  {s.value === null ? <Skel w={60} h={28} /> : s.value}
                </div>
              </div>
            ))}
          </div>

          {/* Revenue streams */}
          <div className="en-section-label">Revenue streams</div>
          <div className="en-streams-grid">
            {STREAMS.map(s => (
              <div key={s.title} className={`en-stream-card${!s.available ? ' en-stream-soon' : ''}`}>
                <div className="en-stream-head">
                  <span className="en-stream-emoji">{s.emoji}</span>
                  <div className="en-stream-title-row">
                    <span className="en-stream-title">{s.title}</span>
                    {!s.available
                      ? <span className="en-badge en-badge-amber">Soon</span>
                      : isEligible
                        ? <span className="en-badge en-badge-green"><CheckIco /> Active</span>
                        : <span className="en-badge en-badge-lock"><LockIco /> Locked</span>
                    }
                  </div>
                </div>
                <p className="en-stream-desc">{s.desc}</p>
                <p className="en-stream-est">{s.est}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ══════════════ ELIGIBILITY ══════════════ */}
      {tab === 'eligibility' && (
        <div className="en-elig-wrap">
          <div className="en-elig-card">
            <p className="en-elig-heading">Monetisation Partner Program Requirements</p>
            <p className="en-elig-intro">
              Meet these thresholds to unlock ad revenue and other paid features on AURA.
            </p>

            {/* Subscribers */}
            <div className="en-req-item">
              <div className="en-req-head">
                <div className={`en-req-icon${subscribers >= SUBS_NEEDED ? ' met' : ''}`}>
                  {subscribers >= SUBS_NEEDED ? <CheckIco /> : <SubIco />}
                </div>
                <div className="en-req-info">
                  <p className="en-req-label">1,000 Subscribers</p>
                  <p className="en-req-current">
                    {loading ? '—' : `${fmtNum(subscribers)} / ${fmtNum(SUBS_NEEDED)}`}
                  </p>
                </div>
                <span className={`en-req-pct${subscribers >= SUBS_NEEDED ? ' met' : ''}`}>
                  {loading ? '—' : `${subPct}%`}
                </span>
              </div>
              <div className="en-req-bar-wrap">
                <div
                  className={`en-req-bar${subscribers >= SUBS_NEEDED ? ' met' : ''}`}
                  style={{ width: loading ? '0%' : `${subPct}%` }}
                />
              </div>
            </div>

            {/* Watch hours */}
            <div className="en-req-item">
              <div className="en-req-head">
                <div className={`en-req-icon${watchHours >= HOURS_NEEDED ? ' met' : ''}`}>
                  {watchHours >= HOURS_NEEDED ? <CheckIco /> : <ClockIco />}
                </div>
                <div className="en-req-info">
                  <p className="en-req-label">4,000 Watch Hours (last 12 months)</p>
                  <p className="en-req-current">
                    {loading ? '—' : `${fmtNum(watchHours)}h / ${fmtNum(HOURS_NEEDED)}h`}
                  </p>
                </div>
                <span className={`en-req-pct${watchHours >= HOURS_NEEDED ? ' met' : ''}`}>
                  {loading ? '—' : `${hrPct}%`}
                </span>
              </div>
              <div className="en-req-bar-wrap">
                <div
                  className={`en-req-bar${watchHours >= HOURS_NEEDED ? ' met' : ''}`}
                  style={{ width: loading ? '0%' : `${hrPct}%` }}
                />
              </div>
            </div>

            {/* Community guidelines */}
            <div className="en-req-item">
              <div className="en-req-head">
                <div className="en-req-icon met"><CheckIco /></div>
                <div className="en-req-info">
                  <p className="en-req-label">No active Community Guidelines strikes</p>
                  <p className="en-req-current">Account in good standing</p>
                </div>
                <span className="en-req-pct met">✓</span>
              </div>
            </div>

            <p className="en-elig-note">
              Watch hours are estimated from your uploaded video durations × view counts.
              Actual watch time tracked server-side may differ.
            </p>
          </div>
        </div>
      )}

      {/* ══════════════ REVENUE HISTORY ══════════════ */}
      {tab === 'history' && (
        <div className="en-history-empty">
          <span className="en-history-empty-icon"><DollarIco /></span>
          <p className="en-history-empty-title">No revenue data yet</p>
          <p className="en-history-empty-sub">
            Once you start earning, your payments and transaction history will appear here.
          </p>
        </div>
      )}

    </div>
  )
}