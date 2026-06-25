// studio/src/pages/LiveStreams/LiveStreams.jsx
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStudioAuth } from '../../context/StudioAuthContext'
import './LiveStreams.css'

const LiveIco  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 010 8.49M7.76 16.24a6 6 0 010-8.49M19.07 4.93a10 10 0 010 14.14M4.93 19.07a10 10 0 010-14.14"/></svg>
const EyeIco   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
const PlusIco  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const CtrlIco  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><polygon points="10 8 16 11 10 14 10 8"/></svg>

const STUDIO_API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function timeAgo(date) {
  if (!date) return ''
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)   return 'Just now'
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30)  return `${d}d ago`
  return new Date(date).toLocaleDateString()
}

function fmtDuration(ms) {
  if (!ms) return '—'
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default function LiveStreams() {
  const { user }    = useStudioAuth()
  const navigate    = useNavigate()
  const [streams,   setStreams]  = useState([])
  const [loading,   setLoading] = useState(true)
  const [filter,    setFilter]  = useState('all') // all | live | ended

  useEffect(() => {
    fetch(`${STUDIO_API}/live/user/me`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => setStreams(d.streams || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user?._id])

  const filtered = filter === 'all'
    ? streams
    : streams.filter(s => s.status === filter)

  const liveCount = streams.filter(s => s.status === 'live').length

  return (
    <div className="lst-page">
      <div className="lst-header">
        <div>
          <h1 className="lst-title">Live Streams</h1>
          <p className="lst-sub">Manage your broadcasts and past streams</p>
        </div>
        <a href="http://localhost:5173" className="lst-go-live-btn" target="_blank" rel="noopener noreferrer">
          <PlusIco /> Create New Stream
        </a>
      </div>

      {/* Filter tabs */}
      <div className="lst-tabs">
        {['all','live','ended','scheduled'].map(f => (
          <button
            key={f}
            className={`lst-tab ${filter === f ? 'lst-tab-active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'live' && liveCount > 0 && (
              <span className="lst-live-dot" />
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="lst-empty"><div className="lc-spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="lst-empty">
          <div className="lst-empty-icon"><LiveIco /></div>
          <p>No {filter === 'all' ? '' : filter} streams yet.</p>
          {filter === 'all' && (
            <a href="http://localhost:5173" target="_blank" rel="noopener noreferrer" className="lst-empty-btn">
              <PlusIco /> Create your first stream
            </a>
          )}
        </div>
      ) : (
        <div className="lst-table">
          <div className="lst-thead">
            <span>Title</span>
            <span>Status</span>
            <span>Viewers</span>
            <span>Duration</span>
            <span>Date</span>
            <span>Actions</span>
          </div>
          {filtered.map(stream => (
            <div key={stream._id} className="lst-row">
              <div className="lst-cell lst-cell-title">
                <div className="lst-thumb">
                  {stream.thumbnailUrl
                    ? <img src={stream.thumbnailUrl} alt={stream.title} />
                    : <div className="lst-thumb-placeholder"><LiveIco /></div>
                  }
                  {stream.status === 'live' && <span className="lst-thumb-live-badge">LIVE</span>}
                </div>
                <div>
                  <div className="lst-stream-title">{stream.title}</div>
                  <div className="lst-stream-cat">{stream.category || 'General'}</div>
                </div>
              </div>
              <div className="lst-cell">
                <span className={`lst-status lst-status-${stream.status}`}>
                  {stream.status === 'live' && <span className="lst-live-dot-sm" />}
                  {stream.status.charAt(0).toUpperCase() + stream.status.slice(1)}
                </span>
              </div>
              <div className="lst-cell lst-cell-stat">
                <EyeIco />
                <span>{stream.peakViewers || 0} peak</span>
              </div>
              <div className="lst-cell lst-cell-stat">
                {stream.startedAt && stream.endedAt
                  ? fmtDuration(new Date(stream.endedAt) - new Date(stream.startedAt))
                  : stream.status === 'live' ? 'Live now' : '—'
                }
              </div>
              <div className="lst-cell lst-cell-date">{timeAgo(stream.createdAt)}</div>
              <div className="lst-cell lst-cell-actions">
                {(stream.status === 'live' || stream.status === 'scheduled') && (
                  <Link
                    to={`/live/${stream._id}`}
                    className="lst-action-btn lst-action-primary"
                  >
                    <CtrlIco /> Control
                  </Link>
                )}
                <a
                  href={`http://localhost:5173/live/${stream._id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lst-action-btn"
                >
                  View
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}