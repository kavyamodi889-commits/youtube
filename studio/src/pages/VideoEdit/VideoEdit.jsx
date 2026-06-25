// studio/src/pages/VideoEdit/VideoEdit.jsx
import { useState, useEffect, useRef } from 'react'
import { useCategoryList } from '../../hooks/useCategoryList'
import CategoryPicker from '../../components/CategoryPicker/CategoryPicker'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import './VideoEdit.css'

// ── Icons ──────────────────────────────────────────────────────────────────
const BackIco    = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
const SaveIco    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
const CheckIco   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
const SpinIco    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="ve-spin"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
const ImgIco     = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
const EyeIco     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
const GlobeIco   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
const LockIco    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
const LinkIco    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
const TagIco     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
const CopyIco    = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
const SubIco     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="6" y1="16" x2="12" y2="16"/></svg>
const CommIco    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
const PlayIco    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
const ExtIco     = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>

const TABS = ['Details','Subtitles','Comments']

const fmtDur = s => {
  if (!s) return '0:00'
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = Math.floor(s%60)
  return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${m}:${String(sec).padStart(2,'0')}`
}
const fmtNum = n => {
  if (!n) return '0'
  if (n >= 1e6) return (n/1e6).toFixed(1).replace(/\.0$/,'') + 'M'
  if (n >= 1e3) return (n/1e3).toFixed(1).replace(/\.0$/,'') + 'K'
  return String(n)
}
const timeAgo = d => {
  const diff = Math.floor((Date.now() - new Date(d)) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
  return `${Math.floor(diff/86400)}d ago`
}

// ── DETAILS TAB ────────────────────────────────────────────────────────────
function DetailsTab({ form, onChange, thumbPreview, onThumbChange, saving, onSave, categories, categoryDocs, addCategory, addSubCategory }) {
  const fileRef  = useRef()
  const [tagInput, setTagInput] = useState('')
  const [copied,   setCopied]   = useState(false)

  const addTag = e => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault()
      const tag = tagInput.trim().replace(/^#/,'')
      if (!form.tags.includes(tag) && form.tags.length < 15)
        onChange('tags', [...form.tags, tag])
      setTagInput('')
    }
  }
  const copyLink = () => {
    navigator.clipboard.writeText(`http://localhost:5173/watch/${form._id}`)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="ve-panel">
      <div className="ve-two-col">
        {/* ── LEFT ── */}
        <div className="ve-left">

          {/* Title */}
          <div className="ve-field">
            <label className="ve-label">Title <span className="ve-req">*</span></label>
            <div className="ve-rel">
              <input className="ve-input" maxLength={100} placeholder="Add a title that describes your video"
                value={form.title} onChange={e => onChange('title', e.target.value)} />
              <span className="ve-count">{form.title?.length||0}/100</span>
            </div>
          </div>

          {/* Description */}
          <div className="ve-field">
            <label className="ve-label">Description</label>
            <div className="ve-rel">
              <textarea className="ve-textarea" rows={5} maxLength={5000}
                placeholder="Tell viewers about your video..."
                value={form.description} onChange={e => onChange('description', e.target.value)} />
              <span className="ve-count">{form.description?.length||0}/5000</span>
            </div>
          </div>

          {/* Thumbnail */}
          <div className="ve-field">
            <label className="ve-label">Thumbnail</label>
            <p className="ve-hint">Upload a picture that shows what's in your video. Recommended: 1280×720</p>
            <div className="ve-thumb-row">
              <button className="ve-thumb-btn" onClick={() => fileRef.current?.click()}>
                <ImgIco /><span>Upload thumbnail</span>
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={onThumbChange} />
              {(thumbPreview || form.thumbnailUrl) && (
                <div className="ve-thumb-preview-wrap">
                  <img src={thumbPreview || form.thumbnailUrl} alt="thumbnail" className="ve-thumb-preview" />
                  <span className="ve-thumb-badge">Custom</span>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="ve-field">
            <label className="ve-label"><TagIco /> Tags</label>
            <p className="ve-hint">Press Enter or comma to add a tag. Max 15.</p>
            <div className="ve-tags-wrap">
              {form.tags?.map(t => (
                <span key={t} className="ve-tag">
                  #{t}<button className="ve-tag-x" onClick={() => onChange('tags', form.tags.filter(x=>x!==t))}>×</button>
                </span>
              ))}
              <input className="ve-tag-input" placeholder={form.tags?.length >= 15 ? 'Max reached' : 'Add tag...'}
                value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag}
                disabled={form.tags?.length >= 15} />
            </div>
            <span className="ve-tag-count">{form.tags?.length||0}/15</span>
          </div>

          {/* Visibility */}
          <div className="ve-field">
            <label className="ve-label">Visibility</label>
            <div className="ve-vis-grid">
              {[
                { v:'public',   icon:<GlobeIco />, label:'Public',   sub:'Everyone can watch' },
                { v:'unlisted', icon:<LinkIco />,  label:'Unlisted', sub:'Anyone with the link' },
                { v:'private',  icon:<LockIco />,  label:'Private',  sub:'Only you can watch' },
              ].map(opt => (
                <button key={opt.v}
                  className={`ve-vis-card ${form.visibility===opt.v ? 'active' : ''}`}
                  onClick={() => onChange('visibility', opt.v)}>
                  <span className="ve-vis-ico">{opt.icon}</span>
                  <span className="ve-vis-lbl">{opt.label}</span>
                  <span className="ve-vis-sub">{opt.sub}</span>
                  {form.visibility===opt.v && <span className="ve-vis-check"><CheckIco /></span>}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="ve-field">
            <label className="ve-label">Category</label>
<CategoryPicker
              value={form.category || ''}
              subValue={form.subCategory || ''}
              categories={categories}
              categoryDocs={categoryDocs}
              addCategory={addCategory}
              addSubCategory={addSubCategory}
              selectClass="ve-select"
              onChange={(cat, sub) => { onChange('category', cat); onChange('subCategory', sub || '') }}
            />
          </div>

          {/* Comments toggle */}
          <div className="ve-field">
            <div className="ve-toggle-row">
              <div>
                <label className="ve-label"><CommIco /> Allow comments</label>
                <p className="ve-hint">Let viewers comment on your video</p>
              </div>
              <label className="ve-toggle">
                <input type="checkbox" checked={form.commentsEnabled !== false}
                  onChange={e => onChange('commentsEnabled', e.target.checked)} />
                <span className="ve-toggle-track" />
              </label>
            </div>
          </div>

          {/* Save */}
          <div className="ve-save-row">
            <button className="ve-save-btn" onClick={onSave} disabled={saving}>
              {saving ? <><SpinIco /> Saving...</> : <><SaveIco /> Save changes</>}
            </button>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="ve-right">
          {/* Video preview card */}
          <div className="ve-preview-card">
            <div className="ve-preview-thumb">
              {(thumbPreview || form.thumbnailUrl)
                ? <img src={thumbPreview || form.thumbnailUrl} alt="preview" />
                : <div className="ve-preview-placeholder"><PlayIco /></div>
              }
              <span className="ve-preview-dur">{fmtDur(form.duration)}</span>
            </div>
            <div className="ve-preview-info">
              <p className="ve-preview-title">{form.title || 'Untitled video'}</p>
              <span className={`ve-preview-vis ${form.visibility||'public'}`}>
                {form.visibility==='private' ? <LockIco /> : form.visibility==='unlisted' ? <LinkIco /> : <GlobeIco />}
                {form.visibility||'public'}
              </span>
            </div>
          </div>

          {/* Video link */}
          <div className="ve-link-card">
            <p className="ve-link-lbl">Video link</p>
            <div className="ve-link-row">
              <a href={`http://localhost:5173/watch/${form._id}`} target="_blank" rel="noopener noreferrer"
                className="ve-link-url">
                localhost:5173/watch/{form._id?.slice(-8)}… <ExtIco />
              </a>
              <button className="ve-copy-btn" onClick={copyLink} title="Copy link">
                {copied ? <CheckIco /> : <CopyIco />}
              </button>
            </div>
          </div>

          {/* Quick stats */}
          <div className="ve-stats-card">
            <div className="ve-stat-row"><EyeIco /><span>{fmtNum(form.viewCount)} views</span></div>
            <div className="ve-stat-row"><SubIco /><span>{fmtNum(form.likeCount)} likes</span></div>
            <div className="ve-stat-row"><CommIco /><span>{form.commentCount||0} comments</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── ANALYTICS TAB ──────────────────────────────────────────────────────────
function AnalyticsTab({ form }) {
  const stats = [
    { label:'Views',    value:fmtNum(form.viewCount),  color:'var(--sn-teal)' },
    { label:'Likes',    value:fmtNum(form.likeCount),  color:'#4ade80' },
    { label:'Comments', value:form.commentCount||0,    color:'var(--st-rose)' },
    { label:'Duration', value:fmtDur(form.duration),   color:'var(--st-gold)' },
  ]
  return (
    <div className="ve-panel">
      <div className="ve-analytics-grid">
        {stats.map(s => (
          <div key={s.label} className="ve-analytics-card" style={{'--ac':s.color}}>
            <div className="ve-analytics-val">{s.value}</div>
            <div className="ve-analytics-lbl">{s.label}</div>
          </div>
        ))}
      </div>
      <p className="ve-analytics-note">Full analytics available in the Analytics section. This shows a quick overview for this video.</p>
    </div>
  )
}

// ── SUBTITLES TAB ──────────────────────────────────────────────────────────
function SubtitlesTab({ videoId, subtitles }) {
  const fileRef = useRef()
  const [generating, setGenerating] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3000) }

  const handleAuto = async () => {
    setGenerating(true)
    try {
      await api.post(`/videos/${videoId}/subtitles/auto`)
      showToast('Auto-captions generated successfully')
    } catch { showToast('Failed to generate captions', 'error') }
    setGenerating(false)
  }

  return (
    <div className="ve-panel">
      <div className="ve-section-header">
        <div>
          <h3 className="ve-section-title">Subtitles & Captions</h3>
          <p className="ve-hint">Add subtitles to reach a wider audience</p>
        </div>
        <div className="ve-section-actions">
          <button className="ve-btn-secondary" onClick={() => fileRef.current?.click()}>
            Upload .srt / .vtt
          </button>
          <button className="ve-btn-primary" onClick={handleAuto} disabled={generating}>
            {generating ? <><SpinIco /> Generating...</> : '✨ Auto-generate'}
          </button>
          <input ref={fileRef} type="file" accept=".srt,.vtt" hidden />
        </div>
      </div>
      {subtitles?.length > 0 ? (
        <div className="ve-subs-list">
          {subtitles.map(s => (
            <div key={s.language} className="ve-sub-row">
              <SubIco />
              <span className="ve-sub-lang">{s.language}</span>
              <span className="ve-sub-type">{s.type||'uploaded'}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="ve-empty">
          <SubIco />
          <p>No subtitles added yet</p>
          <p className="ve-empty-sub">Upload a file or use auto-generation</p>
        </div>
      )}
      {toast && <div className={`ve-toast ve-toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  )
}

// ── COMMENTS TAB ──────────────────────────────────────────────────────────
function CommentsTab({ videoId }) {
  const [comments, setComments] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    api.get(`/comments/${videoId}`)
      .then(r => { setComments(r.data.comments||[]); setLoading(false) })
      .catch(() => setLoading(false))
  }, [videoId])

  return (
    <div className="ve-panel">
      <h3 className="ve-section-title">Comments ({comments.length})</h3>
      {loading ? (
        <div className="ve-empty"><SpinIco /><p>Loading...</p></div>
      ) : comments.length === 0 ? (
        <div className="ve-empty"><CommIco /><p>No comments yet</p></div>
      ) : (
        <div className="ve-comments-list">
          {comments.map(c => (
            <div key={c._id} className="ve-comment">
              <img src={c.author?.avatar || `https://ui-avatars.com/api/?name=${c.author?.displayName||'U'}&background=0d0d18&color=fff`}
                alt="" className="ve-comment-av" />
              <div className="ve-comment-body">
                <div className="ve-comment-meta">
                  <span className="ve-comment-author">{c.author?.displayName||'Unknown'}</span>
                  <span className="ve-comment-time">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="ve-comment-text">{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── MAIN ───────────────────────────────────────────────────────────────────
export default function VideoEdit() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const [tab,          setTab]          = useState('Details')
  const [video,        setVideo]        = useState(null)
  const { categories, categoryDocs, addCategory, addSubCategory } = useCategoryList()
  const [form,         setForm]         = useState({})
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [saved,        setSaved]        = useState(false)
  const [error,        setError]        = useState('')
  const [thumbFile,    setThumbFile]    = useState(null)
  const [thumbPreview, setThumbPreview] = useState('')

  useEffect(() => {
    api.get(`/videos/${id}`)
      .then(r => {
        const v = r.data.video
        setVideo(v)
        setForm({
          _id:             v._id,
          title:           v.title           || '',
          description:     v.description     || '',
          tags:            v.tags            || [],
          visibility:      v.visibility      || 'public',
          category:        v.category        || '',
          commentsEnabled: v.commentsEnabled !== false,
          thumbnailUrl:    v.thumbnailUrl    || '',
          viewCount:       v.viewCount       || 0,
          likeCount:       v.likeCount       || 0,
          commentCount:    v.commentCount    || 0,
          duration:        v.duration        || 0,
        })
        setLoading(false)
      })
      .catch(() => { setError('Could not load video.'); setLoading(false) })
  }, [id])

  const onChange = (key, val) => setForm(f => ({...f, [key]: val}))

  const onThumbChange = e => {
    const file = e.target.files?.[0]
    if (!file) return
    setThumbFile(file)
    setThumbPreview(URL.createObjectURL(file))
  }

  const onSave = async () => {
    setSaving(true); setError('')
    try {
      const fd = new FormData()
      fd.append('title',           form.title)
      fd.append('description',     form.description)
      fd.append('visibility',      form.visibility)
      fd.append('category',        form.category || '')
      if (form.subCategory) fd.append('subCategory', form.subCategory)
      fd.append('commentsEnabled', form.commentsEnabled)
      form.tags.forEach(t => fd.append('tags[]', t))
      if (thumbFile) fd.append('thumbnail', thumbFile)
      await api.patch(`/videos/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setSaved(true); setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed. Try again.')
    }
    setSaving(false)
  }

  if (loading) return (
    <div className="ve-loading"><SpinIco /><span>Loading video details...</span></div>
  )
  if (error && !video) return (
    <div className="ve-loading"><p style={{color:'var(--st-red)'}}>{error}</p></div>
  )

  return (
    <div className="ve-page">

      {/* ── Top bar ── */}
      <div className="ve-topbar">
        <div className="ve-topbar-left">
          <button className="ve-back" onClick={() => navigate('/content')} title="Back to Content">
            <BackIco />
          </button>
          <div className="ve-topbar-titles">
            <span className="ve-topbar-heading">Video details</span>
            <span className="ve-topbar-sub" title={form.title}>
              {form.title?.slice(0,50)||'Untitled'}{form.title?.length>50?'…':''}
            </span>
          </div>
        </div>
        <div className="ve-topbar-right">
          <a href={`http://localhost:5173/watch/${id}`} target="_blank" rel="noopener noreferrer"
            className="ve-topbar-preview">
            <EyeIco /> Preview <ExtIco />
          </a>
          {saved && (
            <span className="ve-saved-pill"><CheckIco /> Saved</span>
          )}
          <button className="ve-topbar-save" onClick={onSave} disabled={saving}>
            {saving ? <><SpinIco /> Saving...</> : <><SaveIco /> Save</>}
          </button>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="ve-tabbar">
        {TABS.map(t => (
          <button key={t} className={`ve-tab ${tab===t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t}
            {tab===t && <span className="ve-tab-line" />}
          </button>
        ))}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="ve-error-bar">{error}<button onClick={()=>setError('')}>×</button></div>
      )}

      {/* ── Tab content ── */}
      {tab === 'Details'   && <DetailsTab   form={form} onChange={onChange} thumbPreview={thumbPreview}
                                            onThumbChange={onThumbChange} saving={saving} onSave={onSave}
                                            categories={categories} categoryDocs={categoryDocs}
                                            addCategory={addCategory} addSubCategory={addSubCategory} />}
      {tab === 'Subtitles' && <SubtitlesTab videoId={id} subtitles={video?.subtitles} />}
      {tab === 'Comments'  && <CommentsTab  videoId={id} />}
    </div>
  )
}