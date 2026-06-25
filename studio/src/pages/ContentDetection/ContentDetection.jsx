// studio/src/pages/ContentDetection/ContentDetection.jsx
import { useState, useEffect } from 'react'
import api from '../../services/api'
import './ContentDetection.css'

// ── helpers ──────────────────────────────────────────────────────
const fmtDate = d => new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
const fmtNum  = n => { if(!n) return '0'; if(n>=1000) return `${(n/1000).toFixed(1)}K`; return String(n) }

// Deterministically assign a detection status from video id for demo
function detectStatus(video) {
  const seed = (video._id || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const roll = seed % 10
  if (roll < 7) return { status: 'clean',   label: 'No issues',       color: 'var(--st-green)' }
  if (roll < 9) return { status: 'warning', label: 'Match detected',  color: 'var(--st-yellow)' }
  return         { status: 'blocked', label: 'Content blocked',  color: 'var(--st-red)' }
}

// ── Icons ─────────────────────────────────────────────────────────
const ShieldIco  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
const CheckIco   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
const WarnIco    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
const BlockIco   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
const VideoIco   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="m10 8 6 4-6 4V8z"/></svg>
const MusicIco   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
const ChevIco    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
const InfoIco    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>

// ── Skeleton ──────────────────────────────────────────────────────
const Skel = ({ w = '100%', h = 14, r = 6 }) => (
  <div className="cd-skel" style={{ width: w, height: h, borderRadius: r }} />
)

// ── Detail panel for a flagged video ──────────────────────────────
function ClaimDetail({ video, onClose }) {
  return (
    <div className="cd-detail">
      <div className="cd-detail-head">
        <span className="cd-detail-title">
          <WarnIco /> Copyright claim details
        </span>
        <button className="cd-detail-close" onClick={onClose}>×</button>
      </div>
      <div className="cd-detail-rows">
        {[
          { key: 'Matched content',  val: 'Background music track' },
          { key: 'Rights holder',    val: 'Unknown Publisher' },
          { key: 'Match confidence', val: '87%', color: 'var(--st-yellow)' },
          { key: 'Segment matched',  val: '0:24 – 3:10' },
          { key: 'Impact',           val: 'Ad revenue may be shared with rights holder' },
        ].map(r => (
          <div key={r.key} className="cd-detail-row">
            <span className="cd-detail-key">{r.key}</span>
            <span className="cd-detail-val" style={r.color ? { color: r.color } : {}}>{r.val}</span>
          </div>
        ))}
      </div>
      <div className="cd-detail-actions">
        <button className="cd-action-btn">Dispute claim</button>
        <button className="cd-action-btn">Replace audio</button>
        <a
          href={`http://localhost:5173/watch/${video._id}`}
          target="_blank" rel="noopener"
          className="cd-action-btn"
        >View video</a>
      </div>
    </div>
  )
}

export default function ContentDetection() {
  const [videos,  setVideos]  = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('all')
  const [detail,  setDetail]  = useState(null) // video._id of expanded row

  useEffect(() => {
    api.get('/videos/user/me')
      .then(r => setVideos(r.data.videos || []))
      .catch(() => setVideos([]))
      .finally(() => setLoading(false))
  }, [])

  const withStatus = videos.map(v => ({ ...v, det: detectStatus(v) }))
  const filtered = filter === 'all' ? withStatus : withStatus.filter(v => v.det.status === filter)

  const counts = {
    clean:   withStatus.filter(v => v.det.status === 'clean').length,
    warning: withStatus.filter(v => v.det.status === 'warning').length,
    blocked: withStatus.filter(v => v.det.status === 'blocked').length,
  }

  return (
    <div className="cd-page">

      {/* ── Header ── */}
      <div className="cd-header">
        <div className="cd-header-left">
          <div className="cd-header-icon"><ShieldIco /></div>
          <div>
            <h1 className="cd-title">Content Detection</h1>
            <p className="cd-sub">Monitor copyright claims and content ID matches across your videos</p>
          </div>
        </div>
      </div>

      {/* ── Info banner ── */}
      <div className="cd-info-bar">
        <InfoIco />
        <p>
          Powered by <strong>ACRCloud</strong> audio fingerprinting. Videos are scanned automatically
          within 24 hours of upload. Results shown here are based on simulation — configure your
          ACRCloud API key in the server <code>.env</code> to enable live scanning.
        </p>
      </div>

      {/* ── Summary cards ── */}
      <div className="cd-summary">
        {[
          { id:'all',     label:'All videos',    val: loading ? null : withStatus.length, color:'var(--st-t2)',    icon: <VideoIco /> },
          { id:'clean',   label:'No issues',      val: loading ? null : counts.clean,     color:'var(--st-green)', icon: <CheckIco /> },
          { id:'warning', label:'Match detected', val: loading ? null : counts.warning,   color:'var(--st-yellow)',icon: <WarnIco />  },
          { id:'blocked', label:'Content blocked',val: loading ? null : counts.blocked,   color:'var(--st-red)',   icon: <BlockIco /> },
        ].map(s => (
          <button
            key={s.id}
            className={`cd-sum-card${filter === s.id ? ' active' : ''}`}
            onClick={() => setFilter(s.id)}
          >
            <div className="cd-sum-top">
              <span className="cd-sum-label">{s.label}</span>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div className="cd-sum-val" style={{ color: s.color }}>
              {s.val === null ? <Skel w={40} h={24} /> : s.val}
            </div>
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="cd-table-wrap">
          <table className="cd-table">
            <thead><tr><th>Video</th><th>Status</th><th>Uploaded</th><th>Views</th><th></th></tr></thead>
            <tbody>
              {Array(5).fill(0).map((_, i) => (
                <tr key={i}><td><Skel h={40}/></td><td><Skel w={80}/></td><td><Skel w={60}/></td><td><Skel w={40}/></td><td/></tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : filtered.length === 0 ? (
        <div className="cd-empty">
          <ShieldIco />
          <p>No videos in this category</p>
        </div>
      ) : (
        <div className="cd-table-wrap">
          <table className="cd-table">
            <thead>
              <tr>
                <th>Video</th>
                <th>Detection status</th>
                <th>Uploaded</th>
                <th>Views</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => (
                <>
                  <tr key={v._id} className={`cd-row${detail === v._id ? ' cd-row-open' : ''}`}>
                    {/* Video */}
                    <td>
                      <div className="cd-vid-cell">
                        <div className="cd-thumb">
                          {v.thumbnailUrl
                            ? <img src={v.thumbnailUrl} alt="" />
                            : <div className="cd-thumb-empty"><VideoIco /></div>
                          }
                        </div>
                        <div>
                          <p className="cd-vid-title">{v.title}</p>
                          <p className="cd-vid-id">ID: …{v._id?.slice(-8)}</p>
                        </div>
                      </div>
                    </td>
                    {/* Status */}
                    <td>
                      <div className="cd-status-cell">
                        <span className="cd-status-dot" style={{ background: v.det.color }} />
                        <span style={{ color: v.det.color, fontSize: 12.5, fontWeight: 500 }}>
                          {v.det.label}
                        </span>
                        {v.det.status !== 'clean' && (
                          <span style={{ color: 'var(--st-t4)', marginLeft: 4 }}><MusicIco /></span>
                        )}
                      </div>
                    </td>
                    {/* Date */}
                    <td className="cd-meta">{fmtDate(v.createdAt)}</td>
                    {/* Views */}
                    <td className="cd-meta">{fmtNum(v.viewCount)}</td>
                    {/* Expand */}
                    <td>
                      {v.det.status !== 'clean' ? (
                        <button
                          className={`cd-expand-btn${detail === v._id ? ' open' : ''}`}
                          onClick={() => setDetail(d => d === v._id ? null : v._id)}
                        >
                          Details <ChevIco />
                        </button>
                      ) : (
                        <span className="cd-clear-label"><CheckIco /> Clear</span>
                      )}
                    </td>
                  </tr>
                  {detail === v._id && (
                    <tr key={v._id + '_detail'} className="cd-detail-row">
                      <td colSpan={5} style={{ padding: 0 }}>
                        <ClaimDetail video={v} onClose={() => setDetail(null)} />
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  )
}