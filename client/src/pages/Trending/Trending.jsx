// FILE: client/src/pages/Trending/Trending.jsx
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './Trending.css'
import { getTrending } from '../../services/recommendationService'
import { useFocus } from '../../context/FocusContext.jsx'


function formatViews(n) {
  if (!n) return '0'
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K'
  return String(n)
}
function formatDuration(s) {
  if (!s) return ''
  const m = Math.floor(s / 60), sec = s % 60
  return `${m}:${String(sec).padStart(2,'0')}`
}
function timeAgo(d) {
  if (!d) return ''
  const diff = (Date.now() - new Date(d)) / 1000
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
  if (diff < 2592000) return `${Math.floor(diff/86400)}d ago`
  return `${Math.floor(diff/2592000)}mo ago`
}

// ── ICONS ──
const FireIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 3z"/></svg>
const EyeIcon   = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
const ClockIcon = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
const TrendIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
const PlayIcon  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
const CheckIcon = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
const LiveIcon  = () => <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
const DotsIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
const ArrowIcon = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>
const SparkIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>

const GRADS = [
  'linear-gradient(135deg,#b5294e,#6654a8)',
  'linear-gradient(135deg,#6654a8,#3d9e8c)',
  'linear-gradient(135deg,#3d9e8c,#b8882a)',
  'linear-gradient(135deg,#b8882a,#b5294e)',
  'linear-gradient(135deg,#2d9e6e,#6654a8)',
  'linear-gradient(135deg,#b5294e,#3d9e8c)',
  'linear-gradient(135deg,#6654a8,#b8882a)',
]

const THUMB_BG = [
  ['#120818','#1e0826'],
  ['#081812','#0a2014'],
  ['#180808','#2a0a10'],
  ['#080818','#0c0c28'],
  ['#181008','#281800'],
  ['#081018','#0a1828'],
  ['#100818','#1c0a28'],
]

// ── THUMBNAIL ──
function Thumb({ idx = 0, duration, live, size = 'normal' }) {
  const [hov, setHov] = useState(false)
  const bg = THUMB_BG[idx % THUMB_BG.length]
  return (
    <div className={`tr-thumb tr-thumb-${size}`}
      style={{ background: `linear-gradient(135deg, ${bg[0]}, ${bg[1]})` }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div className="tr-thumb-glow" />
      <AnimatePresence>
        {hov && (
          <motion.div className="tr-thumb-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}>
            <motion.div className="tr-play-btn"
              initial={{ scale: 0.6 }} animate={{ scale: 1 }} exit={{ scale: 0.6 }}
              transition={{ type: 'spring', stiffness: 420, damping: 22 }}>
              <PlayIcon />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {live
        ? <span className="tr-live-badge"><LiveIcon /> LIVE</span>
        : <span className="tr-dur">{duration}</span>
      }
    </div>
  )
}

// ── RANK NUMBER ──
function RankNum({ rank }) {
  const isTop = rank <= 3
  return (
    <div className={`rank-num ${isTop ? 'rank-top' : ''}`}>
      {rank <= 3 ? ['🥇','🥈','🥉'][rank - 1] : `#${rank}`}
    </div>
  )
}

// ── HERO CARD (rank 1-3) ──
function HeroCard({ video, index }) {
  const dest = video.isShort ? `/shorts?id=${video.videoId}` : `/watch/${video.videoId}`
  return (
    <motion.div className="hero-card"
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24, delay: index * 0.08 }}
      whileHover={{ y: -5 }}>
      <a href={dest} className="hero-thumb-wrap">
        {video.thumbnail
          ? <img src={video.thumbnail} alt={video.title} className="hero-thumb-img" />
          : <div className="hero-thumb-fallback" style={{ background: GRADS[video.grad % GRADS.length] }} />
        }
        {video.isShort
          ? <span className="tr-short-badge">Short</span>
          : <span className="tr-dur">{video.duration}</span>
        }
        <div className="hero-rank-badge"><RankNum rank={video.rank} /></div>
        {video.hot && <div className="hero-hot-badge"><FireIcon /> Hot</div>}
      </a>
      <div className="hero-info">
        <div className="hero-spike"><ArrowIcon /> {video.spike} views</div>
        <a href={dest} className="hero-title">{video.title}</a>
        <div className="hero-channel">
          {video.avatar
            ? <img src={video.avatar} alt={video.channel} className="hero-av-img" />
            : <div className="hero-av" style={{ background: GRADS[video.grad % GRADS.length] }}>{video.chanAv}</div>
          }
          <span>{video.channel}</span>
          {video.verified && <span className="hero-check"><CheckIcon /></span>}
        </div>
        <div className="hero-meta">
          <span><EyeIcon /> {video.views}</span>
          <span>·</span>
          <span><ClockIcon /> {video.time}</span>
        </div>
      </div>
    </motion.div>
  )
}

// ── LIST ROW (rank 4+) ──
function TrendRow({ video, index }) {
  const dest = video.isShort ? `/shorts?id=${video.videoId}` : `/watch/${video.videoId}`
  return (
    <motion.div className="trend-row"
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26, delay: index * 0.04 }}
      whileHover={{ x: 4 }}>
      <RankNum rank={video.rank} />
      <a href={dest} className="tr-thumb tr-thumb-row tr-thumb-real">
        {video.thumbnail
          ? <img src={video.thumbnail} alt={video.title} className="tr-real-img" />
          : <div className="tr-thumb-fallback" style={{ background: GRADS[video.grad % GRADS.length] }} />
        }
        {video.isShort
          ? <span className="tr-short-badge">Short</span>
          : <span className="tr-dur">{video.duration}</span>
        }
      </a>
      <div className="trend-row-info">
        <a href={dest} className="trend-row-title">{video.title}</a>
        <div className="trend-row-channel">
          {video.avatar
            ? <img src={video.avatar} alt={video.channel} className="tr-av-img" />
            : <div className="tr-av" style={{ background: GRADS[video.grad % GRADS.length] }}>{video.chanAv}</div>
          }
          <span>{video.channel}</span>
          {video.verified && <span className="tr-check"><CheckIcon /></span>}
        </div>
        <div className="trend-row-meta">
          <span><EyeIcon /> {video.views}</span>
          <span>·</span>
          <span>{video.time}</span>
          {video.hot && <span className="tr-hot-tag"><FireIcon /> Trending</span>}
        </div>
      </div>
      <div className="trend-row-right">
        <div className="tr-spike"><TrendIcon /> {video.spike}</div>
        <div className="tr-dur-badge">{video.duration}</div>
      </div>
    </motion.div>
  )
}

export default function Trending() {
  const [videos,    setVideos]  = useState([])
  const [loading,   setLoading] = useState(true)
  const [error,     setError]   = useState(null)
  const [activeTab, setTab]     = useState('All')

  const { active: focusActive, blockedCategories } = useFocus()

  // During focus, hide blocked category tabs
  const ALL_TABS = ['All', 'Music', 'Gaming', 'Sports', 'Technology', 'Comedy', 'Education']
  const FOCUS_HIDDEN_TABS = ['Music', 'Gaming', 'Sports', 'Comedy']
  const TABS = focusActive
    ? ALL_TABS.filter(t => !FOCUS_HIDDEN_TABS.includes(t) && !blockedCategories.includes(t))
    : ALL_TABS

  // If current tab is hidden by focus, reset to All
  useEffect(() => {
    if (focusActive && activeTab !== 'All' && !TABS.includes(activeTab)) {
      setTab('All')
    }
  }, [focusActive, blockedCategories]) // eslint-disable-line

  useEffect(() => {
    setLoading(true); setError(null)
    const category = activeTab !== 'All' ? activeTab : null
    getTrending({ limit: 30, category })
      .then(raw => {
        const adapted = raw.map((v, i) => ({
          id:       v._id,
          rank:     i + 1,
          title:    v.title,
          channel:  v.uploader?.displayName || v.uploader?.username || 'AURA Creator',
          chanAv:   (v.uploader?.displayName || v.uploader?.username || 'A')[0].toUpperCase(),
          avatar:   v.uploader?.avatar || '',
          views:    formatViews(v.viewCount || 0),
          duration: formatDuration(v.duration || 0),
          time:     timeAgo(v.createdAt),
          thumbnail:v.thumbnailUrl || '',
          isShort:  v.isShort || false,
          live:     false,
          verified: v.uploader?.isChannelVerified || false,
          hot:      (v.viewCount || 0) > 10000,
          spike:    formatViews(v.viewCount || 0),
          videoId:  v._id,
          grad:     i % GRADS.length,
          thumb:    i % THUMB_BG.length,
          trendScore: v.score || 0,
          category: v.category || '',
        }))
        // Filter out shorts and blocked categories during focus
        const filtered = focusActive
          ? adapted.filter(v => {
              if (v.isShort) return false
              if (blockedCategories.includes(v.category)) return false
              return true
            })
          : adapted
        setVideos(filtered)
      })
      .catch(() => setError('Failed to load trending'))
      .finally(() => setLoading(false))
  }, [activeTab, focusActive, blockedCategories])

  const hero    = videos.slice(0, 3)
  const theRest = videos.slice(3)

  const totalViews = videos.reduce((s, v) => {
    const n = parseFloat(String(v.views || '0').replace('M','e6').replace('K','e3'))
    return s + (isNaN(n) ? 0 : n)
  }, 0)
  const fmtViews = totalViews >= 1e6
    ? `${(totalViews / 1e6).toFixed(1)}M`
    : `${(totalViews / 1e3).toFixed(0)}K`

  return (
    <div className="trending-page">
      <motion.div className="trending-header"
        initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}>
        <div className="th-left">
          <div className="th-title-row">
            <span className="th-fire"><FireIcon /></span>
            <h1 className="th-title">Trending</h1>
            <span className="th-live-pill"><LiveIcon /> Live rankings</span>
          </div>
          <div className="th-stats">
            <span className="th-stat"><span className="th-stat-num">{videos.length}</span> videos trending</span>
            {videos.length > 0 && <span className="th-stat"><span className="th-stat-num">{fmtViews}</span> total views</span>}
            <span className="th-stat updated">Updated just now</span>
          </div>
        </div>
        {/* Category tabs */}
        <div className="tr-tabs">
          {TABS.map(t => (
            <motion.button key={t}
              className={`tr-tab ${activeTab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              {t}
            </motion.button>
          ))}
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}>

          {loading ? (
            <div className="tr-loading">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="tr-skeleton">
                  <div className="tr-sk-thumb sk-pulse" />
                  <div className="tr-sk-body">
                    <div className="tr-sk-line sk-pulse" style={{ width: '70%' }} />
                    <div className="tr-sk-line sk-pulse" style={{ width: '45%' }} />
                    <div className="tr-sk-line sk-pulse" style={{ width: '30%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="tr-empty">
              <div className="tr-empty-icon">⚠️</div>
              <div className="tr-empty-title">{error}</div>
            </div>
          ) : videos.length === 0 ? (
            <div className="tr-empty">
              <div className="tr-empty-icon">📭</div>
              <div className="tr-empty-title">Nothing trending here yet</div>
              <div className="tr-empty-desc">Check back soon or try another category</div>
            </div>
          ) : (
            <>
              {hero.length > 0 && (
                <div className="hero-section">
                  <div className="section-head">
                    <span className="section-icon"><SparkIcon /></span>
                    <span className="section-label">Top Right Now</span>
                  </div>
                  <div className="hero-grid">
                    {hero.map((v, i) => <HeroCard key={v.id} video={v} index={i} />)}
                  </div>
                </div>
              )}
              {theRest.length > 0 && (
                <div className="list-section">
                  <div className="section-head">
                    <span className="section-icon"><TrendIcon /></span>
                    <span className="section-label">Rising Fast</span>
                    <span className="section-count">{theRest.length} videos</span>
                  </div>
                  <div className="trend-list">
                    {theRest.map((v, i) => <TrendRow key={v.id} video={v} index={i} />)}
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}