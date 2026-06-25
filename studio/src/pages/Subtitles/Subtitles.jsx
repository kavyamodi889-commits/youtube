// studio/src/pages/Subtitles/Subtitles.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../../services/api'
import './Subtitles.css'

// ── helpers ──────────────────────────────────────────────────────
const fmtDate = d => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
const fmtDur  = s => { if (!s) return '—'; const m = Math.floor(s/60), sec = Math.floor(s%60); return `${m}:${String(sec).padStart(2,'0')}` }

const LANGUAGES = [
  { code: 'en', label: 'English'    },
  { code: 'hi', label: 'Hindi'      },
  { code: 'es', label: 'Spanish'    },
  { code: 'fr', label: 'French'     },
  { code: 'de', label: 'German'     },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ja', label: 'Japanese'   },
  { code: 'ko', label: 'Korean'     },
  { code: 'zh', label: 'Chinese'    },
  { code: 'ar', label: 'Arabic'     },
]

// ── Icons ─────────────────────────────────────────────────────────
const CaptionIco  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="6" y1="16" x2="12" y2="16"/></svg>
const UploadIco   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>
const SparkIco    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
const DeleteIco   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
const DownloadIco = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
const ChevronIco  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
const PlayIco     = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
const SearchIco   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>

// ── Upload modal ──────────────────────────────────────────────────
function UploadModal({ video, onClose, onDone }) {
  const [language,  setLanguage]  = useState('en')
  const [label,     setLabel]     = useState('English')
  const [file,      setFile]      = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState('')
  const fileRef = useRef(null)

  const handleLangChange = (code) => {
    setLanguage(code)
    setLabel(LANGUAGES.find(l => l.code === code)?.label || code)
  }

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (!f) return
    if (!f.name.endsWith('.srt') && !f.name.endsWith('.vtt')) {
      setError('Only .srt and .vtt files are supported')
      return
    }
    setFile(f); setError('')
  }

  const handleUpload = async () => {
    if (!file) { setError('Please select a subtitle file'); return }
    setUploading(true); setError('')
    try {
      const form = new FormData()
      form.append('subtitle', file)
      form.append('language', language)
      form.append('label',    label)
      await api.post(`/videos/${video._id}/subtitles`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      onDone()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="sub-modal-backdrop" onClick={onClose}>
      <div className="sub-modal" onClick={e => e.stopPropagation()}>
        <div className="sub-modal-header">
          <h3 className="sub-modal-title">Upload subtitles</h3>
          <span className="sub-modal-video">{video.title}</span>
        </div>

        {error && <div className="sub-modal-error">{error}</div>}

        <div className="sub-modal-body">
          {/* Language select */}
          <div className="sub-field">
            <label className="sub-label">Language</label>
            <select
              className="sub-select"
              value={language}
              onChange={e => handleLangChange(e.target.value)}
            >
              {LANGUAGES.map(l => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>

          {/* Custom label */}
          <div className="sub-field">
            <label className="sub-label">Track label <span className="sub-label-hint">(shown to viewers)</span></label>
            <input
              type="text"
              className="sub-input"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. English (CC)"
            />
          </div>

          {/* File drop zone */}
          <div className="sub-field">
            <label className="sub-label">Subtitle file <span className="sub-label-hint">(.srt or .vtt)</span></label>
            <div
              className={`sub-dropzone ${file ? 'has-file' : ''}`}
              onClick={() => fileRef.current?.click()}
            >
              {file ? (
                <div className="sub-dropzone-file">
                  <CaptionIco />
                  <span>{file.name}</span>
                  <span className="sub-dropzone-size">{(file.size / 1024).toFixed(1)} KB</span>
                </div>
              ) : (
                <div className="sub-dropzone-empty">
                  <UploadIco />
                  <span>Click to select file</span>
                  <span className="sub-dropzone-hint">Supports .srt and .vtt</span>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".srt,.vtt"
              style={{ display: 'none' }}
              onChange={handleFile}
            />
          </div>
        </div>

        <div className="sub-modal-actions">
          <button className="sub-btn-cancel" onClick={onClose}>Cancel</button>
          <button
            className="sub-btn-upload"
            onClick={handleUpload}
            disabled={uploading || !file}
          >
            {uploading ? 'Uploading…' : <><UploadIco /> Upload</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Auto-caption confirm modal ────────────────────────────────────
function AutoModal({ video, onClose, onDone }) {
  const [generating, setGenerating] = useState(false)
  const [error,      setError]      = useState('')

  const handleGenerate = async () => {
    setGenerating(true); setError('')
    try {
      await api.post(`/videos/${video._id}/subtitles/auto`)
      onDone()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Auto-caption failed. Make sure the video is fully processed.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="sub-modal-backdrop" onClick={onClose}>
      <div className="sub-modal sub-modal-sm" onClick={e => e.stopPropagation()}>
        <div className="sub-modal-header">
          <h3 className="sub-modal-title">Auto-generate captions</h3>
        </div>
        <div className="sub-modal-body">
          <p className="sub-auto-desc">
            AURA will use AI to generate English captions for <strong>"{video.title}"</strong>.
            This may take a few minutes depending on video length.
          </p>
          <div className="sub-auto-info">
            <span className="sub-auto-badge">AI</span>
            Powered by Google Speech via Cloudinary. English only.
          </div>
          {error && <div className="sub-modal-error" style={{ marginTop: 12 }}>{error}</div>}
        </div>
        <div className="sub-modal-actions">
          <button className="sub-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="sub-btn-auto" onClick={handleGenerate} disabled={generating}>
            {generating ? 'Generating…' : <><SparkIco /> Generate captions</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Single video subtitle row ─────────────────────────────────────
function VideoSubRow({ video, onUpload, onAuto, onRefresh }) {
  const [expanded,  setExpanded]  = useState(false)
  const [deleting,  setDeleting]  = useState(null)
  const [toast,     setToast]     = useState(null)
  const subtitles = video.subtitles || []

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleDelete = async (lang) => {
    setDeleting(lang)
    try {
      // Delete by re-saving video without this subtitle track
      // We do this via a PATCH on the video endpoint
      await api.patch(`/videos/${video._id}/subtitles/${lang}`)
      showToast('Subtitle track removed')
      onRefresh()
    } catch {
      showToast('Failed to delete subtitle track', 'error')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className={`sub-row ${expanded ? 'expanded' : ''}`}>
      {/* Video info row */}
      <div className="sub-row-main" onClick={() => setExpanded(v => !v)}>
        <div className="sub-row-thumb">
          {video.thumbnailUrl
            ? <img src={video.thumbnailUrl} alt="" />
            : <div className="sub-row-thumb-fb"><PlayIco /></div>
          }
          <span className="sub-row-dur">{fmtDur(video.duration)}</span>
        </div>
        <div className="sub-row-info">
          <div className="sub-row-title">{video.title}</div>
          <div className="sub-row-meta">{fmtDate(video.createdAt)}</div>
        </div>
        <div className="sub-row-tracks">
          {subtitles.length === 0 ? (
            <span className="sub-no-tracks">No subtitles</span>
          ) : (
            subtitles.map(s => (
              <span key={s.language} className="sub-track-badge">{s.label || s.language}</span>
            ))
          )}
        </div>
        <div className="sub-row-actions" onClick={e => e.stopPropagation()}>
          <button className="sub-action-btn sub-action-upload" onClick={() => onUpload(video)} title="Upload subtitles">
            <UploadIco /> Upload
          </button>
          <button className="sub-action-btn sub-action-auto" onClick={() => onAuto(video)} title="Auto-generate captions">
            <SparkIco /> Auto
          </button>
        </div>
        <div className="sub-row-chevron">
          <ChevronIco />
        </div>
      </div>

      {/* Expanded subtitle tracks */}
      {expanded && (
        <div className="sub-row-tracks-detail">
          {subtitles.length === 0 ? (
            <div className="sub-tracks-empty">
              No subtitle tracks yet. Upload a .srt or .vtt file, or use Auto-generate.
            </div>
          ) : (
            <table className="sub-tracks-table">
              <thead>
                <tr>
                  <th>Language</th>
                  <th>Track label</th>
                  <th>Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subtitles.map(s => (
                  <tr key={s.language}>
                    <td>
                      <span className="sub-lang-code">{s.language.toUpperCase()}</span>
                    </td>
                    <td className="sub-track-label-cell">{s.label || s.language}</td>
                    <td>
                      <span className={`sub-type-badge ${s.label?.includes('Auto') ? 'auto' : 'manual'}`}>
                        {s.label?.includes('Auto') ? 'Auto-generated' : 'Manual'}
                      </span>
                    </td>
                    <td>
                      <div className="sub-track-actions">
                        {s.url && (
                          <a
                            href={s.url}
                            download={`${video.title}-${s.language}.vtt`}
                            className="sub-track-btn"
                            title="Download"
                          >
                            <DownloadIco />
                          </a>
                        )}
                        <button
                          className="sub-track-btn sub-track-btn-del"
                          onClick={() => handleDelete(s.language)}
                          disabled={deleting === s.language}
                          title="Remove track"
                        >
                          {deleting === s.language
                            ? <span className="sub-spinning" />
                            : <DeleteIco />
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {toast && (
            <div className={`sub-inline-toast sub-inline-toast-${toast.type}`}>{toast.msg}</div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────
export default function Subtitles() {
  const [videos,       setVideos]       = useState([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [uploadTarget, setUploadTarget] = useState(null)
  const [autoTarget,   setAutoTarget]   = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    api.get('/videos/user/me')
      .then(r => setVideos(r.data.videos || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = videos.filter(v =>
    !search || v.title?.toLowerCase().includes(search.toLowerCase())
  )

  const totalTracks = videos.reduce((a, v) => a + (v.subtitles?.length || 0), 0)
  const covered     = videos.filter(v => v.subtitles?.length > 0).length

  return (
    <div className="sub-wrap">
      {/* Header */}
      <div className="sub-header">
        <div>
          <h1 className="sub-title">Subtitles</h1>
          <p className="sub-subtitle">
            {loading ? '…' : `${totalTracks} subtitle track${totalTracks !== 1 ? 's' : ''} across ${covered} of ${videos.length} video${videos.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="sub-info-bar">
        <CaptionIco />
        <span>
          Adding subtitles improves accessibility and watch time. Upload a <strong>.srt</strong> or <strong>.vtt</strong> file per language, or use <strong>Auto-generate</strong> for English AI captions.
        </span>
      </div>

      {/* Search */}
      <div className="sub-search">
        <SearchIco />
        <input
          type="text"
          placeholder="Search videos..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Video list */}
      <div className="sub-list">
        {/* Table header */}
        <div className="sub-list-head">
          <span>Video</span>
          <span>Subtitle tracks</span>
          <span>Actions</span>
          <span />
        </div>

        {loading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="sub-row sub-row-skel">
              <div className="sub-skel sub-skel-thumb" />
              <div className="sub-skel-body">
                <div className="sub-skel" style={{ width: '55%', height: 12, marginBottom: 6 }} />
                <div className="sub-skel" style={{ width: '35%', height: 10 }} />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="sub-empty">
            <div className="sub-empty-icon">🎬</div>
            <p>{search ? `No videos matching "${search}"` : 'No videos yet'}</p>
          </div>
        ) : (
          filtered.map(v => (
            <VideoSubRow
              key={v._id}
              video={v}
              onUpload={setUploadTarget}
              onAuto={setAutoTarget}
              onRefresh={load}
            />
          ))
        )}
      </div>

      {/* Upload modal */}
      {uploadTarget && (
        <UploadModal
          video={uploadTarget}
          onClose={() => setUploadTarget(null)}
          onDone={load}
        />
      )}

      {/* Auto-caption modal */}
      {autoTarget && (
        <AutoModal
          video={autoTarget}
          onClose={() => setAutoTarget(null)}
          onDone={load}
        />
      )}
    </div>
  )
}