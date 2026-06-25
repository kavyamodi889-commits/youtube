// studio/src/pages/Comments/Comments.jsx
import { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import './Comments.css'

const timeAgo = d => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000)
  if (s < 60)    return 'just now'
  if (s < 3600)  return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  return `${Math.floor(s/86400)}d ago`
}

const SearchIco  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
const DeleteIco  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
const ThumbIco   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/><path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>
const VideoIco   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="m10 8 6 4-6 4V8z"/></svg>
const FilterIco  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
const SparkIco   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
const WarnIco    = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
const ReplyIco   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 00-4-4H4"/></svg>
const FlagIco    = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
const ChevronIco = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>

export default function Comments() {
  const [comments,       setComments]       = useState([])
  const [loading,        setLoading]        = useState(true)
  const [search,         setSearch]         = useState('')
  const [filter,         setFilter]         = useState('all')
  const [toast,          setToast]          = useState(null)
  const [deleting,       setDeleting]       = useState(null)
  const [scanning,       setScanning]       = useState(false)
  const [flagged,        setFlagged]        = useState(new Set())
  const [expanded,       setExpanded]       = useState({})
  const [loadingReplies, setLoadingReplies] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), type === 'info' ? 2000 : 3000)
  }

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const vRes = await api.get('/videos/user/me')
      const vids = (vRes.data.videos || []).slice(0, 30)

      const results = await Promise.allSettled(
        vids.map(v => api.get(`/interactions/${v._id}/comments?sort=newest&limit=50`))
      )

      const all = []
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          const video = vids[i]
          ;(r.value.data.comments || []).forEach(c => all.push({ ...c, video }))
        }
      })

      all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      setComments(all)
    } catch {
      showToast('Failed to load comments', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const handleDelete = async (comment) => {
    setDeleting(comment._id)
    try {
      await api.delete(`/interactions/${comment.video._id}/comments/${comment._id}`)
      setComments(prev => prev.filter(c => c._id !== comment._id))
      // Remove from expanded replies too
      setExpanded(prev => {
        const n = { ...prev }
        Object.keys(n).forEach(k => {
          n[k] = n[k].filter(r => r._id !== comment._id)
        })
        return n
      })
      setFlagged(prev => { const n = new Set(prev); n.delete(comment._id); return n })
      showToast('Comment deleted')
    } catch {
      showToast('Failed to delete', 'error')
    } finally {
      setDeleting(null)
    }
  }

  const toggleReplies = async (comment) => {
    if (expanded[comment._id]) {
      setExpanded(prev => { const n = { ...prev }; delete n[comment._id]; return n })
      return
    }
    if (!comment.replyCount) return
    setLoadingReplies(comment._id)
    try {
      const r = await api.get(`/interactions/${comment.video._id}/comments/${comment._id}/replies`)
      setExpanded(prev => ({ ...prev, [comment._id]: r.data.replies || [] }))
    } catch {
      showToast('Failed to load replies', 'error')
    } finally {
      setLoadingReplies(null)
    }
  }

  const handleAIScan = async () => {
    if (!comments.length) return
    setScanning(true)
    showToast('Scanning comments with AI…', 'info')
    const newFlagged = new Set()
    await Promise.allSettled(
      comments.slice(0, 50).map(async c => {
        try {
          const r = await api.post('/ai/moderate-comment', { text: c.text })
          if (r.data.success && !r.data.safe) newFlagged.add(c._id)
        } catch {}
      })
    )
    setFlagged(newFlagged)
    setScanning(false)
    if (newFlagged.size > 0) {
      setFilter('flagged')
      showToast(`AI flagged ${newFlagged.size} comment${newFlagged.size !== 1 ? 's' : ''} for review`)
    } else {
      showToast('All comments look clean ✓')
    }
  }

  const filtered = comments
    .filter(c => {
      if (filter === 'recent')   return Date.now() - new Date(c.createdAt) < 7 * 86400 * 1000
      if (filter === 'liked')    return (c.likeCount || 0) > 0
      if (filter === 'reported') return (c.reportCount || 0) > 0
      if (filter === 'flagged')  return flagged.has(c._id) || c.isFlagged
      return true
    })
    .filter(c => {
      if (!search) return true
      const s = search.toLowerCase()
      return c.text?.toLowerCase().includes(s) ||
             c.author?.displayName?.toLowerCase().includes(s) ||
             c.video?.title?.toLowerCase().includes(s)
    })

  const recent7  = comments.filter(c => Date.now() - new Date(c.createdAt) < 7 * 86400 * 1000).length
  const totalVids = new Set(comments.map(c => c.video?._id)).size
  const reported  = comments.filter(c => (c.reportCount || 0) > 0).length

  return (
    <div className="cm-wrap">
      <div className="cm-header">
        <div>
          <h1 className="cm-title">Comments</h1>
          <p className="cm-subtitle">
            {loading ? '…' : `${comments.length} total · ${recent7} in last 7 days · across ${totalVids} videos${reported ? ` · ${reported} reported` : ''}`}
          </p>
        </div>
      </div>

      <div className="cm-toolbar">
        <div className="cm-search">
          <SearchIco />
          <input
            type="text"
            placeholder="Search comments, authors or videos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="cm-filters">
          <FilterIco />
          {[
            { key: 'all',      label: 'All' },
            { key: 'recent',   label: 'Last 7 days' },
            { key: 'liked',    label: 'Has likes' },
            { key: 'reported', label: `Reported${reported > 0 ? ` (${reported})` : ''}` },
            { key: 'flagged',  label: `AI Flagged${flagged.size > 0 ? ` (${flagged.size})` : ''}` },
          ].map(f => (
            <button
              key={f.key}
              className={`cm-filter-btn ${filter === f.key ? 'active' : ''} ${(f.key === 'flagged' && flagged.size > 0) || (f.key === 'reported' && reported > 0) ? 'cm-filter-warn' : ''}`}
              onClick={() => setFilter(f.key)}
            >{f.label}</button>
          ))}
        </div>
        <button
          className={`cm-ai-scan-btn ${scanning ? 'scanning' : ''}`}
          onClick={handleAIScan}
          disabled={scanning || loading || !comments.length}
        >
          {scanning ? <><span className="cm-spin" />Scanning…</> : <><SparkIco /> AI Scan</>}
        </button>
      </div>

      <div className="cm-list">
        {loading ? (
          Array(8).fill(0).map((_, i) => (
            <div key={i} className="cm-item cm-item-skel">
              <div className="cm-skel cm-skel-av" />
              <div className="cm-skel-body">
                <div className="cm-skel" style={{ width:'30%', height:11, marginBottom:6 }} />
                <div className="cm-skel" style={{ width:'80%', height:13, marginBottom:8 }} />
                <div className="cm-skel" style={{ width:'50%', height:10 }} />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="cm-empty">
            <div className="cm-empty-icon">💬</div>
            <p>{search ? `No comments matching "${search}"` : 'No comments yet'}</p>
            <span>Comments from viewers will appear here</span>
          </div>
        ) : (
          filtered.map(comment => (
            <div key={`${comment.video?._id}-${comment._id}`}>
              <div className={`cm-item ${flagged.has(comment._id) || comment.isFlagged ? 'cm-item-flagged' : ''} ${comment.reportCount > 0 ? 'cm-item-reported' : ''}`}>
                <div className="cm-avatar">
                  {comment.author?.avatar
                    ? <img src={comment.author.avatar} alt="" />
                    : <span>{comment.author?.displayName?.[0] || comment.author?.username?.[0] || '?'}</span>
                  }
                </div>

                <div className="cm-body">
                  <div className="cm-meta-row">
                    <span className="cm-author">{comment.author?.displayName || comment.author?.username || 'Unknown'}</span>
                    <span className="cm-dot">·</span>
                    <span className="cm-time">{timeAgo(comment.createdAt)}</span>
                    {(comment.likeCount || 0) > 0 && <><span className="cm-dot">·</span><span className="cm-likes"><ThumbIco /> {comment.likeCount}</span></>}
                    {(comment.replyCount || 0) > 0 && <><span className="cm-dot">·</span><span className="cm-replies"><ReplyIco /> {comment.replyCount}</span></>}
                    {(comment.reportCount || 0) > 0 && <span className="cm-reported-badge"><FlagIco /> {comment.reportCount} report{comment.reportCount !== 1 ? 's' : ''}</span>}
                    {(flagged.has(comment._id) || comment.isFlagged) && <span className="cm-flagged-badge"><WarnIco /> AI flagged</span>}
                  </div>

                  <p className="cm-text">{comment.text}</p>

                  <div className="cm-bottom-row">
                    <a href={`http://localhost:5173/watch/${comment.video?._id}`} target="_blank" rel="noopener noreferrer" className="cm-video-link">
                      <VideoIco /><span>{comment.video?.title || 'Video'}</span>
                    </a>
                    {(comment.replyCount || 0) > 0 && (
                      <button
                        className={`cm-replies-btn ${expanded[comment._id] ? 'open' : ''}`}
                        onClick={() => toggleReplies(comment)}
                        disabled={loadingReplies === comment._id}
                      >
                        <ChevronIco />
                        {loadingReplies === comment._id ? 'Loading…' : expanded[comment._id] ? 'Hide replies' : `View ${comment.replyCount} ${comment.replyCount === 1 ? 'reply' : 'replies'}`}
                      </button>
                    )}
                  </div>
                </div>

                <button className="cm-delete-btn" onClick={() => handleDelete(comment)} disabled={deleting === comment._id} title="Delete comment">
                  {deleting === comment._id ? <span className="cm-deleting" /> : <DeleteIco />}
                </button>
              </div>

              {/* Replies */}
              {expanded[comment._id] && (
                <div className="cm-replies-list">
                  {expanded[comment._id].map(reply => (
                    <div key={reply._id} className="cm-item cm-item-reply">
                      <div className="cm-reply-indent" />
                      <div className="cm-avatar cm-avatar-sm">
                        {reply.author?.avatar ? <img src={reply.author.avatar} alt="" /> : <span>{reply.author?.displayName?.[0] || '?'}</span>}
                      </div>
                      <div className="cm-body">
                        <div className="cm-meta-row">
                          <span className="cm-author">{reply.author?.displayName || reply.author?.username || 'Unknown'}</span>
                          <span className="cm-dot">·</span>
                          <span className="cm-time">{timeAgo(reply.createdAt)}</span>
                          {(reply.likeCount || 0) > 0 && <><span className="cm-dot">·</span><span className="cm-likes"><ThumbIco /> {reply.likeCount}</span></>}
                        </div>
                        <p className="cm-text">{reply.text}</p>
                      </div>
                      <button className="cm-delete-btn" onClick={() => handleDelete({ ...reply, video: comment.video })} disabled={deleting === reply._id} title="Delete reply">
                        {deleting === reply._id ? <span className="cm-deleting" /> : <DeleteIco />}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {toast && <div className={`cm-toast cm-toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  )
}