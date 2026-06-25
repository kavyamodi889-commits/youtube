// studio/src/pages/Content/Content.jsx
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import './Content.css'

// ── helpers ──────────────────────────────────────────────────────
const fmtNum = n => {
  if (!n) return '0'
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n/1_000).toFixed(1)}K`
  return String(n)
}
const fmtDate = d => new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
const fmtDur  = s => {
  if (!s) return '—'
  const m = Math.floor(s/60), sec = Math.floor(s%60)
  return `${m}:${String(sec).padStart(2,'0')}`
}

// ── Icons ─────────────────────────────────────────────────────────
const SearchIco  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
const FilterIco  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
const EditIco    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const AnalytIco  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>
const DeleteIco  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
const EyeIco     = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
const LikeIco    = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/><path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>
const UploadIco  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>
const PlayIco    = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
const ShortIco   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 9l5 3-5 3V9z"/><rect x="2" y="3" width="20" height="18" rx="3"/></svg>

// ── Skeleton row ──────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="ct-row ct-row-skel">
      <td><div className="ct-skel ct-skel-thumb"/></td>
      <td><div className="ct-skel" style={{width:'60%',height:12}}/></td>
      <td><div className="ct-skel" style={{width:50,height:12}}/></td>
      <td><div className="ct-skel" style={{width:40,height:12}}/></td>
      <td><div className="ct-skel" style={{width:35,height:12}}/></td>
      <td><div className="ct-skel" style={{width:55,height:12}}/></td>
      <td/>
    </tr>
  )
}

// ── Delete confirm modal ──────────────────────────────────────────
function DeleteModal({ video, onConfirm, onCancel, deleting }) {
  return (
    <div className="ct-modal-backdrop" onClick={onCancel}>
      <div className="ct-modal" onClick={e => e.stopPropagation()}>
        <h3 className="ct-modal-title">Delete video?</h3>
        <p className="ct-modal-body">
          <strong>"{video.title}"</strong> will be permanently deleted. This cannot be undone.
        </p>
        <div className="ct-modal-actions">
          <button className="ct-modal-cancel" onClick={onCancel}>Cancel</button>
          <button className="ct-modal-delete" onClick={onConfirm} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────
export default function Content() {
  const navigate = useNavigate()
  const [videos,    setVideos]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [filter,    setFilter]    = useState('all')       // all|published|draft|private|short
  const [sort,      setSort]      = useState('newest')    // newest|views|likes
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting,  setDeleting]  = useState(false)
  const [toast,     setToast]     = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    api.get('/videos/user/me')
      .then(r => setVideos(r.data.videos || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const showToast = (msg, type='success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/videos/${deleteTarget._id}`)
      setVideos(prev => prev.filter(v => v._id !== deleteTarget._id))
      showToast(`"${deleteTarget.title}" deleted`)
    } catch {
      showToast('Failed to delete video', 'error')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  // Filter + sort
  const filtered = videos
    .filter(v => {
      if (filter === 'published') return v.status === 'published' && !v.isShort
      if (filter === 'draft')     return v.status === 'draft'
      if (filter === 'private')   return v.visibility === 'private'
      if (filter === 'short')     return v.isShort
      return true
    })
    .filter(v => !search || v.title?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'views') return (b.viewCount||0) - (a.viewCount||0)
      if (sort === 'likes') return (b.likeCount||0) - (a.likeCount||0)
      return new Date(b.createdAt) - new Date(a.createdAt)
    })

  const counts = {
    all:       videos.length,
    published: videos.filter(v => v.status==='published' && !v.isShort).length,
    draft:     videos.filter(v => v.status==='draft').length,
    private:   videos.filter(v => v.visibility==='private').length,
    short:     videos.filter(v => v.isShort).length,
  }

  return (
    <div className="ct-wrap">
      {/* Header */}
      <div className="ct-header">
        <div>
          <h1 className="ct-title">Content</h1>
          <p className="ct-subtitle">{videos.length} video{videos.length !== 1 ? 's' : ''} in your channel</p>
        </div>

      </div>

      {/* Filter tabs */}
      <div className="ct-tabs">
        {[
          { key:'all',       label:'All',       count: counts.all       },
          { key:'published', label:'Published',  count: counts.published },
          { key:'draft',     label:'Drafts',     count: counts.draft     },
          { key:'private',   label:'Private',    count: counts.private   },
          { key:'short',     label:'Shorts',     count: counts.short     },
        ].map(t => (
          <button
            key={t.key}
            className={`ct-tab ${filter === t.key ? 'ct-tab-active' : ''}`}
            onClick={() => setFilter(t.key)}
          >
            {t.label}
            {t.count > 0 && <span className="ct-tab-count">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="ct-toolbar">
        <div className="ct-search">
          <SearchIco />
          <input
            type="text"
            placeholder="Search videos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="ct-sort">
          <FilterIco />
          <select value={sort} onChange={e => setSort(e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="views">Most views</option>
            <option value="likes">Most likes</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="ct-table-wrap">
        <table className="ct-table">
          <thead>
            <tr>
              <th style={{width:100}}>Thumbnail</th>
              <th>Title</th>
              <th>Status</th>
              <th><EyeIco /> Views</th>
              <th><LikeIco /> Likes</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array(6).fill(0).map((_,i) => <SkeletonRow key={i}/>)
              : filtered.length === 0
                ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="ct-empty">
                        <div className="ct-empty-icon">📭</div>
                        <p>{search ? `No videos matching "${search}"` : 'No videos in this category yet'}</p>
                      </div>
                    </td>
                  </tr>
                )
                : filtered.map(v => (
                  <tr key={v._id} className="ct-row">
                    {/* Thumbnail */}
                    <td>
                      <div className="ct-thumb">
                        {v.thumbnailUrl
                          ? <img src={v.thumbnailUrl} alt={v.title}/>
                          : <div className="ct-thumb-empty"><PlayIco/></div>
                        }
                        <span className="ct-thumb-dur">{fmtDur(v.duration)}</span>
                        {v.isShort && <span className="ct-thumb-short"><ShortIco/></span>}
                      </div>
                    </td>

                    {/* Title + description */}
                    <td>
                      <div className="ct-video-title">{v.title}</div>
                      {v.description && (
                        <div className="ct-video-desc">
                          {v.description.slice(0, 80)}{v.description.length > 80 ? '…' : ''}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`ct-badge ct-badge-${v.status}`}>
                        {v.visibility === 'private' ? 'Private' : v.status}
                      </span>
                    </td>

                    {/* Views */}
                    <td className="ct-num">{fmtNum(v.viewCount||0)}</td>

                    {/* Likes */}
                    <td className="ct-num">{fmtNum(v.likeCount||0)}</td>

                    {/* Date */}
                    <td className="ct-date">{fmtDate(v.createdAt)}</td>

                    {/* Actions */}
                    <td>
                      <div className="ct-actions">
                        <button
                          className="ct-action-btn ct-action-edit"
                          onClick={() => navigate(`/content/edit/${v._id}`)}
                          title="Edit video"
                        >
                          <EditIco />
                        </button>
                        <button
                          className="ct-action-btn ct-action-analytics"
                          onClick={() => navigate(`/content/analytics/${v._id}`)}
                          title="Video analytics"
                        >
                          <AnalytIco />
                        </button>
                        <button
                          className="ct-action-btn ct-action-delete"
                          onClick={() => setDeleteTarget(v)}
                          title="Delete"
                        >
                          <DeleteIco />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>

      {/* Delete modal */}
      {deleteTarget && (
        <DeleteModal
          video={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`ct-toast ct-toast-${toast.type}`}>{toast.msg}</div>
      )}
    </div>
  )
}