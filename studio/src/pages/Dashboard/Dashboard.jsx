// studio/src/pages/Dashboard/Dashboard.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { useStudioAuth } from '../../context/StudioAuthContext'
import './Dashboard.css'

const fmtNum = n => {
  if (!n) return '0'
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n/1_000).toFixed(1)}K`
  return String(n)
}
const timeAgo = d => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000)
  if (s < 60)    return 'just now'
  if (s < 3600)  return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  return `${Math.floor(s/86400)}d ago`
}
const fmtDur = s => {
  if (!s) return '0:00'
  const m = Math.floor(s/60), sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2,'0')}`
}

const UploadIco = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>
const LiveIco   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 010 8.49M7.76 16.24a6 6 0 010-8.49M19.07 4.93a10 10 0 010 14.14M4.93 19.07a10 10 0 010-14.14"/></svg>
const EyeIco    = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
const LikeIco   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/><path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>
const ArrowIco  = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
const PlayIco   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>

const Skel = ({ w='100%', h=14, r=6 }) => (
  <div className="dash-skel" style={{ width: w, height: h, borderRadius: r }} />
)

export default function Dashboard() {
  const { user } = useStudioAuth()
  const [videos,  setVideos]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/videos/user/me')
      .then(r => setVideos(r.data.videos || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const latest    = videos[0] || null
  const totalViews= videos.reduce((a,v) => a + (v.viewCount||0), 0)
  const totalLikes= videos.reduce((a,v) => a + (v.likeCount||0), 0)
  const published = videos.filter(v => v.status === 'published').length
  const last28    = videos.filter(v => Date.now() - new Date(v.createdAt) < 28*86400*1000)
  const views28   = last28.reduce((a,v) => a + (v.viewCount||0), 0)
  const topVideos = [...videos].sort((a,b) => (b.viewCount||0)-(a.viewCount||0)).slice(0,3)

  return (
    <div className="dash-wrap">
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Channel dashboard</h1>
          {user && <p className="dash-subtitle">Welcome back, {user.displayName || user.username}</p>}
        </div>

      </div>

      {/* Stat row */}
      <div className="dash-stat-row">
        {[
          { label: 'Total views',    val: fmtNum(totalViews) },
          { label: 'Total likes',    val: fmtNum(totalLikes) },
          { label: 'Published',      val: published },
          { label: 'Subscribers',    val: fmtNum(user?.subscriberCount || 0) },
        ].map(s => (
          <div key={s.label} className="dash-stat-card">
            <div className="dash-stat-val">
              {loading ? <Skel w={60} h={28} r={6}/> : s.val}
            </div>
            <div className="dash-stat-lbl">{s.label}</div>
          </div>
        ))}
      </div>

      {/* 3-col grid */}
      <div className="dash-grid">

        {/* Latest video */}
        <div className="dash-card dash-card-latest">
          <div className="dash-card-header">
            <span className="dash-card-title">Latest video</span>
            <Link to="/content" className="dash-card-link">See all <ArrowIco /></Link>
          </div>

          {loading ? (
            <div className="dash-latest-skel">
              <Skel h={130} r={8}/>
              <Skel w="80%" h={14} r={5}/>
              <Skel w="50%" h={11} r={4}/>
            </div>
          ) : !latest ? (
            <div className="dash-empty-state">
              <div className="dash-empty-icon">📹</div>
              <p>Upload your first video to see how it performs</p>
              <Link to="/content" className="dash-upload-btn">Upload video</Link>
            </div>
          ) : (
            <div className="dash-latest">
              <div className="dash-latest-thumb">
                {latest.thumbnailUrl
                  ? <img src={latest.thumbnailUrl} alt={latest.title}/>
                  : <div className="dash-latest-thumb-empty"><PlayIco /></div>
                }
                <span className="dash-latest-dur">{fmtDur(latest.duration)}</span>
                <span className={`dash-latest-badge dash-badge-${latest.status}`}>{latest.status}</span>
              </div>
              <div className="dash-latest-title">{latest.title}</div>
              <div className="dash-latest-date">{timeAgo(latest.createdAt)}</div>
              <div className="dash-latest-stats">
                <span><EyeIco/> {fmtNum(latest.viewCount||0)} views</span>
                <span><LikeIco/> {fmtNum(latest.likeCount||0)} likes</span>
              </div>
              <Link to={`/content`} className="dash-latest-edit-btn">Edit video →</Link>
            </div>
          )}
        </div>

        {/* Analytics summary */}
        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-title">Channel analytics</span>
            <Link to="/analytics" className="dash-card-link">Go to analytics <ArrowIco /></Link>
          </div>

          <div className="dash-analy-sub">Current subscribers</div>
          <div className="dash-analy-num">
            {loading ? <Skel w={80} h={32} r={6}/> : fmtNum(user?.subscriberCount||0)}
          </div>

          <div className="dash-divider"/>
          <div className="dash-analy-section">Summary · Last 28 days</div>
          {[
            { label: 'Views',      val: fmtNum(views28)    },
            { label: 'New videos', val: last28.length       },
            { label: 'Likes',      val: fmtNum(totalLikes) },
          ].map(row => (
            <div key={row.label} className="dash-analy-row">
              <span>{row.label}</span>
              <span>{loading ? <Skel w={36} h={12} r={4}/> : row.val}</span>
            </div>
          ))}

          <div className="dash-divider"/>
          <div className="dash-analy-section">Top content · All time · Views</div>
          {loading ? (
            <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:8}}>
              <Skel h={12}/><Skel h={12} w="80%"/><Skel h={12} w="55%"/>
            </div>
          ) : topVideos.length === 0 ? (
            <div className="dash-analy-empty">Upload videos to see top content</div>
          ) : topVideos.map((v,i) => (
            <div key={v._id} className="dash-top-row">
              <span className="dash-top-num">{i+1}</span>
              <span className="dash-top-title">{v.title}</span>
              <span className="dash-top-views">{fmtNum(v.viewCount||0)}</span>
            </div>
          ))}
        </div>

        {/* What's new + quick links */}
        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-title">What's new in Studio</span>
          </div>
          <div className="dash-news-list">
            {[
              { text: 'Eye protection 20-20-20 reminders added to AURA',    tag: 'NEW' },
              { text: 'Focus Mode blocks distracting categories for viewers',tag: 'NEW' },
              { text: 'Improved comment moderation in Comments tab',         tag: null  },
              { text: 'Shorts monetisation — apply in the Earn section',     tag: null  },
              { text: 'Revenue milestone push notifications',                tag: null  },
            ].map((item, i) => (
              <div key={i} className="dash-news-item">
                <div className="dash-news-dot"/>
                <span>{item.text}</span>
                {item.tag && <span className="dash-news-tag">{item.tag}</span>}
              </div>
            ))}
          </div>

          <div className="dash-divider" style={{margin:'16px 0 12px'}}/>
          <div className="dash-card-title" style={{marginBottom:12}}>Quick links</div>
          <div className="dash-quick-links">
            {[
              { label:'Your videos',   to:'/content'       },
              { label:'Comments',      to:'/comments'      },
              { label:'Analytics',     to:'/analytics'     },
              { label:'Earn',          to:'/monetization'  },
              { label:'Customization', to:'/customization' },
            ].map(l => (
              <Link key={l.to} to={l.to} className="dash-quick-link">
                {l.label} <ArrowIco/>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}