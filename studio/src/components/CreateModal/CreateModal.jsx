import React, { useState, useRef, useEffect, useCallback } from 'react'
// Shown when Studio is opened with ?create=<id>
// Picker → selected create flow, all connected to backend via Studio api.js
import { io } from 'socket.io-client'
import api from '../../services/api'
import { useCategoryList } from '../../hooks/useCategoryList'
import CategoryPicker from '../CategoryPicker/CategoryPicker'
import './CreateModal.css'

// ── Icons ─────────────────────────────────────────────────────────
const CloseIco   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const UploadIco  = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
const LiveIco    = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 010 8.49M7.76 16.24a6 6 0 010-8.49M19.07 4.93a10 10 0 010 14.14M4.93 19.07a10 10 0 010-14.14"/></svg>
const CopyIco    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
const CheckIco   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
const BackIco    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>

const OPTIONS = [
  { id:'upload',  label:'Upload video',  icon:<UploadIco />, desc:'Upload a pre-recorded video to your channel', color:'#b5294e' },
  { id:'live',    label:'Go live',       icon:<LiveIco />,   desc:'Stream live to your audience via OBS or similar', color:'#c0392b' },
]

// ── Picker screen ─────────────────────────────────────────────────
function Picker({ initial, onSelect, onClose }) {
  return (
    <div className="cm-picker">
      <div className="cm-modal-header">
        <h2 className="cm-modal-title">What do you want to create?</h2>
        <button className="cm-close-btn" onClick={onClose}><CloseIco /></button>
      </div>
      <div className="cm-options">
        {OPTIONS.map(o => (
          <button
            key={o.id}
            className={`cm-option ${initial === o.id ? 'cm-option-highlight' : ''}`}
            onClick={() => onSelect(o.id)}
          >
            <div className="cm-option-icon" style={{ background: `${o.color}18`, color: o.color }}>
              {o.icon}
            </div>
            <div className="cm-option-text">
              <span className="cm-option-label">{o.label}</span>
              <span className="cm-option-desc">{o.desc}</span>
            </div>
            <span className="cm-option-arrow">›</span>
          </button>
        ))}
      </div>
    </div>
  )
}


// ── Upload flow — inline dropzone + form inside modal ─────────────

// ── helpers ───────────────────────────────────────────────────────
function extractFrames(file) {
  return new Promise(resolve => {
    const url = URL.createObjectURL(file)
    const vid = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const frames = []
    vid.preload = 'metadata'; vid.muted = true; vid.src = url
    vid.onloadedmetadata = () => {
      const dur = isFinite(vid.duration) && vid.duration > 0 ? vid.duration : 10
      const times = [dur * 0.1, dur * 0.35, dur * 0.65].map(t => Math.max(0.5, t))
      const vw = vid.videoWidth || 480, vh = vid.videoHeight || 270
      const isShort = vh > vw && dur <= 60
      const scale = Math.min(1, (isShort ? 270 : 480) / vw)
      canvas.width = Math.round(vw * scale); canvas.height = Math.round(vh * scale)
      let i = 0
      vid.onseeked = () => {
        ctx.drawImage(vid, 0, 0, canvas.width, canvas.height)
        frames.push(canvas.toDataURL('image/jpeg', 0.85))
        i++
        if (i < times.length) vid.currentTime = times[i]
        else { URL.revokeObjectURL(url); resolve({ frames, isShort, duration: dur }) }
      }
      vid.onerror = () => { URL.revokeObjectURL(url); resolve({ frames: [], isShort: false }) }
      vid.currentTime = times[0]
    }
    vid.onerror = () => { URL.revokeObjectURL(url); resolve({ frames: [], isShort: false }) }
  })
}
function dataURLtoFile(dataURL, name) {
  const [h, b] = dataURL.split(',')
  const mime = h.match(/:(.*?);/)[1]
  const arr = new Uint8Array([...atob(b)].map(c => c.charCodeAt(0)))
  return new File([arr], name, { type: mime })
}

const STEPS   = ['Details', 'Video elements', 'Checks', 'Visibility']
const LANGS   = ['English','Hindi','Spanish','French','German','Japanese','Portuguese','Arabic','Chinese','Korean']
const LICENSES = ['Standard YouTube Licence','Creative Commons - Attribution']

// ── Step progress bar ─────────────────────────────────────────────
function UpStepBar({ step }) {
  return (
    <div className="yt-stepbar">
      {STEPS.map((s, i) => (
        <div key={s} className="yt-step">
          <div className={`yt-step-circle ${i < step ? 'done' : i === step ? 'active' : ''}`}>
            {i < step
              ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              : <span>{i + 1}</span>
            }
          </div>
          <span className={`yt-step-label ${i === step ? 'active' : i < step ? 'done' : ''}`}>{s}</span>
          {i < STEPS.length - 1 && <div className={`yt-step-line ${i < step ? 'done' : ''}`} />}
        </div>
      ))}
    </div>
  )
}

// ── Upload progress bar (while uploading) ─────────────────────────
function UploadingView({ progress, filename, statusMsg }) {
  return (
    <div className="yt-uploading">
      <div className="yt-up-ring">
        <svg viewBox="0 0 36 36" className="yt-up-ring-svg">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--st-surf3)" strokeWidth="3"/>
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--st-rose)" strokeWidth="3"
            strokeDasharray={`${progress} 100`} strokeLinecap="round"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '18px 18px' }}/>
        </svg>
        <span className="yt-up-ring-pct">{progress}%</span>
      </div>
      <div className="yt-up-info">
        <p className="yt-up-title">{statusMsg || 'Uploading…'}</p>
        <p className="yt-up-file">{filename}</p>
        <p className="yt-up-hint">You can close this dialog — upload will continue in the background</p>
        <div className="yt-up-bar-wrap">
          <div className="yt-up-bar" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  )
}

// ── Main Upload flow ──────────────────────────────────────────────
function UploadFlow({ onClose, onBack }) {
  // -1 = dropzone, 'x' = analysing, 0-3 = steps
  const { categories, categoryDocs, addCategory, addSubCategory } = useCategoryList()
  const [step,          setStep]          = useState(-1)
  const [file,          setFile]          = useState(null)
  const [frames,        setFrames]        = useState([])
  const [isShort,       setIsShort]       = useState(false)
  const [thumbIdx,      setThumbIdx]      = useState(0)
  const [customThumb,   setCustomThumb]   = useState(null)
  const [customPrev,    setCustomPrev]    = useState(null)
  const [uploading,     setUploading]     = useState(false)
  const [progress,      setProgress]      = useState(0)
  const [statusMsg,     setStatusMsg]     = useState('')
  const [done,          setDone]          = useState(false)
  const [videoId,       setVideoId]       = useState(null)
  const [error,         setError]         = useState('')
  const [checksOk,      setChecksOk]      = useState(false)
  const [aiLoading,     setAiLoading]     = useState(false)
  const [tagInput,      setTagInput]      = useState('')
  const [scheduleDate,  setScheduleDate]  = useState('')

  const [form, setForm] = useState({
    title: '', description: '', tags: [],
    category: '', language: 'English',
    license: 'Standard YouTube Licence',
    madeForKids: 'no', ageRestriction: 'no',
    paidPromo: false, allowComments: true, showLikes: true,
    visibility: 'private',
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const fileRef  = useRef(null)
  const thumbRef = useRef(null)

  // ── Pick file ──────────────────────────────────────────────────
  const onFile = async f => {
    setFile(f)
    set('title', f.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '))
    setStep('x')
    const { frames: fr, isShort: sh } = await extractFrames(f)
    setFrames(fr); setIsShort(sh)
    setThumbIdx(fr.length > 0 ? 0 : 'custom')
    setStep(0)
  }

  // ── AI generate ───────────────────────────────────────────────
  const handleAI = async () => {
    if (!form.title.trim()) return
    setAiLoading(true)
    try {
      const r = await api.post('/ai/video-metadata', { title: form.title })
      if (r.data.description) set('description', r.data.description)
      if (r.data.tags?.length) set('tags', r.data.tags)
      if (r.data.category)    set('category', r.data.category)
    } catch {}
    finally { setAiLoading(false) }
  }

  // ── Tags ──────────────────────────────────────────────────────
  const addTag = e => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault()
      if (!form.tags.includes(tagInput.trim())) set('tags', [...form.tags, tagInput.trim()])
      setTagInput('')
    }
  }

  // ── Get thumb file ────────────────────────────────────────────
  const getThumbFile = () => {
    if (thumbIdx === 'custom' && customThumb) return customThumb
    if (typeof thumbIdx === 'number' && frames[thumbIdx])
      return dataURLtoFile(frames[thumbIdx], `thumb_${thumbIdx}.jpg`)
    return null
  }

  // ── Poll processing ───────────────────────────────────────────
  const pollStatus = id => new Promise((res, rej) => {
    const iv = setInterval(async () => {
      try {
        const r = await api.get(`/videos/${id}/status`)
        const { status, progress: prog, qualities } = r.data
        if (status === 'published') {
          setProgress(100)
          setStatusMsg(`Processing complete · ${qualities?.length || 1} quality variants`)
          clearInterval(iv); res(id)
        } else if (status === 'rejected') {
          clearInterval(iv); rej(new Error('Processing failed on server'))
        } else {
          setProgress(50 + Math.round((prog || 0) / 2))
          setStatusMsg(`Processing video… ${prog || 0}%`)
        }
      } catch (e) { clearInterval(iv); rej(e) }
    }, 2000)
  })

  // ── Publish ───────────────────────────────────────────────────
  const handlePublish = async () => {
    if (!file)              return setError('No video file selected')
    if (!form.title.trim()) return setError('Title is required')
    setUploading(true); setError(''); setProgress(0); setStatusMsg('Uploading…')
    try {
      const fd = new FormData()
      fd.append('video',       file)
      fd.append('title',       form.title.trim())
      fd.append('description', form.description)
      fd.append('tags',        JSON.stringify(form.tags))
      fd.append('category',    form.category || 'General')
      if (form.subCategory) fd.append('subCategory', form.subCategory)
      fd.append('madeForKids', form.madeForKids)
      fd.append('visibility',  form.visibility)
      const tf = getThumbFile()
      if (tf) fd.append('thumbnail', tf)

      const res = await api.post('/videos/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: e => {
          const pct = Math.round((e.loaded / e.total) * 50)
          setProgress(pct)
          setStatusMsg(`Uploading… ${pct * 2}%`)
        },
      })
      setStatusMsg('Processing with FFmpeg…')
      const id = res.data.videoId
      await pollStatus(id)
      setVideoId(id); setDone(true); setUploading(false)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Upload failed')
      setUploading(false)
    }
  }

  // ── Step advance (trigger checks animation on step 2) ─────────
  const goNext = () => {
    if (step === 1) {
      setChecksOk(false)
      setTimeout(() => setChecksOk(true), 2000)
    }
    setStep(s => s + 1)
  }

  // ── DONE screen ───────────────────────────────────────────────
  if (done) return (
    <div className="yt-done">
      <div className="yt-done-tick">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <h3 className="yt-done-title">Your video has been published</h3>
      <p className="yt-done-sub">"{form.title}"</p>
      <div className="yt-done-actions">
        <button className="yt-btn-secondary" onClick={onClose}>Close</button>
        <a className="yt-btn-primary" href={`http://localhost:5173/watch/${videoId}`} target="_blank" rel="noopener noreferrer" onClick={onClose}>
          Watch on AURA →
        </a>
      </div>
    </div>
  )

  // ── ANALYSING screen ──────────────────────────────────────────
  if (step === 'x') return (
    <div className="yt-analysing">
      <div className="yt-analysing-spinner" />
      <p className="yt-analysing-title">Analysing your video</p>
      <p className="yt-analysing-sub">Generating thumbnail options…</p>
    </div>
  )

  // ── DROP ZONE ─────────────────────────────────────────────────
  if (step === -1) return (
    <div className="yt-modal-wrap">
      {/* Header — matches YouTube "Upload videos" title */}
      <div className="yt-modal-header yt-dz-header">
        <h2 className="yt-modal-title" style={{fontSize:18}}>Upload videos</h2>
        <button className="cm-close-btn" onClick={onClose}><CloseIco /></button>
      </div>

      {/* Main drop area */}
      <div className="yt-dz-body"
        onClick={() => fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('video/')) onFile(f) }}
      >
        <div className="yt-dz-circle">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>
        <p className="yt-dz-title">Drag and drop video files to upload</p>
        <p className="yt-dz-sub">Your videos will be private until you publish them</p>
        <button className="yt-dz-select-btn" onClick={e => { e.stopPropagation(); fileRef.current?.click() }}>
          Select files
        </button>
        <input ref={fileRef} type="file" accept="video/*" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files[0]; if (f) onFile(f) }} />
      </div>

      {/* Footer — like YouTube */}
      <div className="yt-dz-footer">
        <p>By uploading your videos to AURA, you agree to our <a href="#" className="yt-dz-link">Terms of Service</a> and <a href="#" className="yt-dz-link">Community Guidelines</a>.</p>
        <p>Please be sure not to violate others' copyright or privacy rights.</p>
      </div>
    </div>
  )

  // ── STEPS 0-3 ─────────────────────────────────────────────────
  return (
    <div className="yt-modal-wrap">
      {/* Header */}
      <div className="yt-modal-header">
        <div className="yt-modal-title-row">
          {onBack && (
            <button className="cm-back-btn" onClick={onBack} style={{marginRight:4}}>
              <BackIco /> Back
            </button>
          )}
          <h2 className="yt-modal-title">{form.title || 'Untitled video'}</h2>
          {!uploading && <span className="yt-autosave">Draft saved</span>}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <UpStepBar step={step} />
          <button className="cm-close-btn" onClick={onClose}><CloseIco /></button>
        </div>
      </div>

      {/* Body */}
      <div className="yt-modal-body">
        {uploading
          ? <UploadingView progress={progress} filename={file?.name} statusMsg={statusMsg} />
          : <>
            {/* ══ STEP 0 — Details ══ */}
            {step === 0 && (
              <div className="yt-details-grid">
                {/* LEFT column */}
                <div className="yt-details-left">

                  {/* AI bar */}
                  <div className="yt-ai-bar">
                    <span className="yt-ai-spark">✦</span>
                    <span>Auto-generate description, tags & category</span>
                    <button className="yt-ai-btn" onClick={handleAI} disabled={aiLoading || !form.title.trim()}>
                      {aiLoading ? 'Generating…' : 'Generate with AI'}
                    </button>
                  </div>

                  {/* Title */}
                  <div className="yt-field">
                    <div className="yt-field-header">
                      <label className="yt-label">Title (required)</label>
                      <span className="yt-charcount">{form.title.length}/100</span>
                    </div>
                    <input className="yt-input" value={form.title}
                      onChange={e => set('title', e.target.value)} maxLength={100}
                      placeholder="Add a title that describes your video" />
                  </div>

                  {/* Description */}
                  <div className="yt-field">
                    <div className="yt-field-header">
                      <label className="yt-label">Description</label>
                      <span className="yt-charcount">{form.description.length}/5000</span>
                    </div>
                    <textarea className="yt-textarea" rows={5} value={form.description}
                      onChange={e => set('description', e.target.value)} maxLength={5000}
                      placeholder="Tell viewers about your video (type # to search for a chapter)" />
                  </div>

                  {/* Thumbnail */}
                  <div className="yt-field">
                    <label className="yt-label">Thumbnail</label>
                    <p className="yt-field-hint">Select or upload a picture that shows what's in your video.</p>
                    <div className="yt-thumb-row">
                      {/* Custom upload first */}
                      <div
                        className={`yt-thumb-card yt-thumb-upload ${thumbIdx === 'custom' ? 'selected' : ''}`}
                        onClick={() => thumbRef.current?.click()}
                      >
                        {customPrev
                          ? <img src={customPrev} alt="custom" />
                          : <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                            <span>Upload thumbnail</span>
                          </>
                        }
                        {thumbIdx === 'custom' && <div className="yt-thumb-selected-ring" />}
                      </div>
                      {/* Auto frames */}
                      {frames.map((src, i) => (
                        <div key={i}
                          className={`yt-thumb-card ${thumbIdx === i ? 'selected' : ''}`}
                          onClick={() => setThumbIdx(i)}
                        >
                          <img src={src} alt={`frame ${i + 1}`} />
                          <span className="yt-thumb-label">Auto {i + 1}</span>
                          {thumbIdx === i && <div className="yt-thumb-selected-ring" />}
                        </div>
                      ))}
                    </div>
                    <input ref={thumbRef} type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={e => { const f = e.target.files[0]; if (f) { setCustomThumb(f); setCustomPrev(URL.createObjectURL(f)); setThumbIdx('custom') } }} />
                  </div>

                  {/* Audience */}
                  <div className="yt-field">
                    <label className="yt-label">Audience</label>
                    <p className="yt-field-hint">Is this video made for kids?</p>
                    <div className="yt-radio-group">
                      <label className={`yt-radio-card ${form.madeForKids === 'yes' ? 'active' : ''}`}>
                        <input type="radio" name="kids" checked={form.madeForKids === 'yes'} onChange={() => set('madeForKids', 'yes')} />
                        <div>
                          <p className="yt-radio-title">Yes, it's made for kids</p>
                          <p className="yt-radio-sub">I'll always set this as made for kids</p>
                        </div>
                      </label>
                      <label className={`yt-radio-card ${form.madeForKids === 'no' ? 'active' : ''}`}>
                        <input type="radio" name="kids" checked={form.madeForKids === 'no'} onChange={() => set('madeForKids', 'no')} />
                        <div>
                          <p className="yt-radio-title">No, it's not made for kids</p>
                          <p className="yt-radio-sub">I'll always set this as not made for kids</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* More options accordion */}
                  <details className="yt-more-options">
                    <summary className="yt-more-summary">More options ↓</summary>
                    <div className="yt-more-body">
                      {/* Tags */}
                      <div className="yt-field">
                        <label className="yt-label">Tags</label>
                        <p className="yt-field-hint">Tags can be useful if content in your video is commonly misspelled.</p>
                        <div className="yt-tags-box">
                          {form.tags.map(t => (
                            <span key={t} className="yt-tag">{t}
                              <button onClick={() => set('tags', form.tags.filter(x => x !== t))}>×</button>
                            </span>
                          ))}
                          <input className="yt-tag-input" placeholder="Add tag"
                            value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag} />
                        </div>
                        <p className="yt-field-hint" style={{ marginTop: 4 }}>{form.tags.join(', ')}</p>
                      </div>

                      {/* Language & Category row */}
                      <div className="yt-two-col">
                        <div className="yt-field">
                          <label className="yt-label">Video language</label>
                          <select className="yt-select" value={form.language} onChange={e => set('language', e.target.value)}>
                            {LANGS.map(l => <option key={l}>{l}</option>)}
                          </select>
                        </div>
                        <CategoryPicker
                          value={form.category}
                          subValue={form.subCategory || ''}
                          categories={categories}
                          categoryDocs={categoryDocs}
                          addCategory={addCategory}
                          addSubCategory={addSubCategory}
                          selectClass="yt-select"
                          onChange={(cat, sub) => { set('category', cat); set('subCategory', sub || '') }}
                        />
                      </div>

                      {/* License */}
                      <div className="yt-field">
                        <label className="yt-label">Licence</label>
                        <select className="yt-select" value={form.license} onChange={e => set('license', e.target.value)}>
                          {LICENSES.map(l => <option key={l}>{l}</option>)}
                        </select>
                      </div>

                      {/* Comments & Ratings */}
                      <div className="yt-field">
                        <label className="yt-label">Comments and ratings</label>
                        <div className="yt-check-row">
                          <label className="yt-check-label">
                            <input type="checkbox" checked={form.allowComments} onChange={e => set('allowComments', e.target.checked)} />
                            <span>Allow comments</span>
                          </label>
                          <label className="yt-check-label">
                            <input type="checkbox" checked={form.showLikes} onChange={e => set('showLikes', e.target.checked)} />
                            <span>Show like count</span>
                          </label>
                        </div>
                      </div>

                      {/* Paid promotion */}
                      <div className="yt-field">
                        <label className="yt-check-label">
                          <input type="checkbox" checked={form.paidPromo} onChange={e => set('paidPromo', e.target.checked)} />
                          <span>My video contains paid promotion like a product placement, sponsorship or endorsement</span>
                        </label>
                      </div>
                    </div>
                  </details>

                </div>

                {/* RIGHT column — preview */}
                <div className="yt-details-right">
                  <div className="yt-preview-box">
                    <div className={`yt-preview-thumb ${isShort ? 'yt-preview-thumb-short' : ''}`}>
                      {(() => {
                        const src = thumbIdx === 'custom' ? customPrev : frames[thumbIdx]
                        return src ? <img src={src} alt="" /> : <div className="yt-preview-ph">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        </div>
                      })()}
                    </div>
                    <div className="yt-preview-info">
                      <p className="yt-preview-title">{form.title || 'Video title'}</p>
                      <p className="yt-preview-meta">{isShort ? '📱 Short detected' : '🎬 Regular video'}</p>
                    </div>
                  </div>
                  {/* File info */}
                  <div className="yt-file-info">
                    <p className="yt-file-info-label">Filename</p>
                    <p className="yt-file-info-val">{file?.name}</p>
                  </div>
                  {/* Upload status */}
                  <div className="yt-upload-status">
                    <div className="yt-upload-status-dot active" />
                    <span>Video uploaded and ready to publish</span>
                  </div>
                </div>
              </div>
            )}

            {/* ══ STEP 1 — Video elements ══ */}
            {step === 1 && (
              <div className="yt-elements">
                <p className="yt-section-hint">Use cards and end screens to show viewers related videos, websites, and calls to action.</p>
                {[
                  { icon: 'CC', title: 'Add subtitles', desc: 'Help people who are deaf or hard-of-hearing, or who speak a different language', action: 'Add', href: '/subtitles' },
                  { icon: '⬜', title: 'Add an end screen', desc: 'Promote related content at the end of your video', action: 'Add', href: null },
                  { icon: '🃏', title: 'Add cards', desc: 'Promote related content during your video', action: 'Add', href: null },
                ].map((el, i) => (
                  <div key={i} className="yt-element-row">
                    <div className="yt-element-icon">{el.icon}</div>
                    <div className="yt-element-body">
                      <p className="yt-element-title">{el.title}</p>
                      <p className="yt-element-desc">{el.desc}</p>
                    </div>
                    <button className="yt-element-btn">{el.action}</button>
                  </div>
                ))}
              </div>
            )}

            {/* ══ STEP 2 — Checks ══ */}
            {step === 2 && (
              <div className="yt-checks">
                <p className="yt-section-hint">We'll check your video for issues that may affect its visibility or monetisation on AURA.</p>
                <div className="yt-check-item">
                  <div className="yt-check-item-icon">
                    {checksOk
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      : <div className="yt-check-spinner" />
                    }
                  </div>
                  <div className="yt-check-item-body">
                    <p className="yt-check-item-title">Copyright</p>
                    <p className="yt-check-item-status" style={{ color: checksOk ? 'var(--st-green)' : 'var(--st-t3)' }}>
                      {checksOk ? 'No issues found' : 'Checking…'}
                    </p>
                  </div>
                </div>
                <div className="yt-check-item">
                  <div className="yt-check-item-icon">
                    {checksOk
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      : <div className="yt-check-spinner" />
                    }
                  </div>
                  <div className="yt-check-item-body">
                    <p className="yt-check-item-title">Ad suitability</p>
                    <p className="yt-check-item-status" style={{ color: checksOk ? 'var(--st-green)' : 'var(--st-t3)' }}>
                      {checksOk ? 'Suitable for most advertisers' : 'Checking…'}
                    </p>
                  </div>
                </div>
                {checksOk && (
                  <div className="yt-checks-ok">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    No issues found. You're good to go.
                  </div>
                )}
                <p className="yt-checks-note">Check results are not final and may change after publishing.</p>
              </div>
            )}

            {/* ══ STEP 3 — Visibility ══ */}
            {step === 3 && (
              <div className="yt-visibility">
                <p className="yt-section-hint">Choose when to publish and who can see your video.</p>

                <div className="yt-vis-section">
                  <h4 className="yt-vis-section-title">Save or publish</h4>
                  <p className="yt-vis-section-sub">Make your video public, unlisted or private.</p>
                  {[
                    { v: 'private',  l: 'Private',  d: 'Only you and people you choose can watch your video' },
                    { v: 'unlisted', l: 'Unlisted', d: 'Anyone with the video link can watch your video' },
                    { v: 'public',   l: 'Public',   d: 'Everyone can watch your video' },
                  ].map(o => (
                    <label key={o.v} className={`yt-vis-option ${form.visibility === o.v ? 'active' : ''}`}>
                      <input type="radio" name="visibility" checked={form.visibility === o.v}
                        onChange={() => set('visibility', o.v)} />
                      <div className={`yt-vis-radio-outer ${form.visibility === o.v ? 'active' : ''}`}>
                        {form.visibility === o.v && <div className="yt-vis-radio-inner" />}
                      </div>
                      <div>
                        <p className="yt-vis-opt-title">{o.l}</p>
                        <p className="yt-vis-opt-desc">{o.d}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Schedule (if public) */}
                {form.visibility === 'public' && (
                  <div className="yt-vis-section">
                    <h4 className="yt-vis-section-title">Schedule</h4>
                    <p className="yt-vis-section-sub">Select a date to make your video public.</p>
                    <div className="yt-field" style={{ maxWidth: 240 }}>
                      <label className="yt-label">Publish date (optional)</label>
                      <input type="datetime-local" className="yt-input"
                        value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} />
                    </div>
                  </div>
                )}

                {/* Checklist */}
                <div className="yt-vis-checklist">
                  <p className="yt-vis-checklist-title">Before you publish, make sure:</p>
                  <ul>
                    <li>You own or have rights to all content in the video</li>
                    <li>You've complied with our Community Guidelines</li>
                    <li>Age-restricted content is correctly marked</li>
                  </ul>
                </div>
              </div>
            )}
          </>
        }
      </div>

      {/* Footer */}
      {!uploading && (
        <div className="yt-modal-footer">
          <div className="yt-footer-left">
            <span className="yt-footer-filename">📁 {file?.name}</span>
          </div>
          <div className="yt-footer-right">
            {error && <span className="yt-footer-error">{error}</span>}
            {step > 0 && (
              <button className="yt-btn-secondary" onClick={() => setStep(s => s - 1)}>Back</button>
            )}
            {step < 3 ? (
              <button className="yt-btn-primary" onClick={goNext}>Next</button>
            ) : (
              <button className="yt-btn-publish" onClick={handlePublish}>
                {form.visibility === 'private' ? 'Save' : 'Publish'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}


// ── Go Live flow ──────────────────────────────────────────────────
// QRCode canvas — must be top-level component (hooks rule)
function QRCodeCanvas({ url }) {
  const canvasRef = React.useRef(null)
  React.useEffect(() => {
    if (!url || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    canvas.width = 200; canvas.height = 200
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}&bgcolor=ffffff&color=000000`
    img.onload = () => ctx.drawImage(img, 0, 0, 200, 200)
    img.onerror = () => {
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 200, 200)
      ctx.fillStyle = '#333'; ctx.font = '11px sans-serif'
      ctx.fillText('QR load failed', 10, 100)
    }
  }, [url])
  return <canvas ref={canvasRef} style={{ borderRadius: 8, border: '4px solid white', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }} />
}

function LiveFlow({ onClose }) {
  const { categories, addCategory } = useCategoryList()
  const [step,         setStep]         = React.useState('setup')
  const [source,       setSource]       = React.useState(null)
  // Stream metadata
  const [title,        setTitle]        = React.useState('')
  const [description,  setDescription]  = React.useState('')
  const [category,     setCategory]     = React.useState('')
  const [showLiveCatNew, setShowLiveCatNew] = React.useState(false)
  const [liveCatNewName, setLiveCatNewName] = React.useState('')
  const [vis,          setVis]          = React.useState('public')
  const [chatEnabled,  setChatEnabled]  = React.useState(true)
  const [thumbFile,    setThumbFile]    = React.useState(null)
  const [thumbPreview, setThumbPreview] = React.useState('')
  const [tags,         setTags]         = React.useState([])
  const [tagInput,     setTagInput]     = React.useState('')
  // Runtime state
  const [loading,      setLoading]      = React.useState(false)
  const [error,        setError]        = React.useState('')
  const [stream,       setStream]       = React.useState(null)
  const [viewers,      setViewers]      = React.useState(0)
  const [mobileUrl,    setMobileUrl]    = React.useState('')
  const [copied,       setCopied]       = React.useState({ server: false, key: false })
  const [duration,     setDuration]     = React.useState(0) // elapsed seconds
  const [chatMessages, setChatMessages] = React.useState([])
  const [hostChatInput,setHostChatInput]= React.useState('')

  const videoRef        = React.useRef(null)
  const chatMessagesRef = React.useRef(null)
  const mediaRecRef     = React.useRef(null)
  const socketRef       = React.useRef(null)
  const localStream     = React.useRef(null)
  const activeStreamRef = React.useRef(null)
  const thumbRef        = React.useRef(null)
  const durationTimer   = React.useRef(null)

  // Duration counter while streaming
  React.useEffect(() => {
    if (step === 'streaming') {
      durationTimer.current = setInterval(() => setDuration(d => d + 1), 1000)
    } else {
      clearInterval(durationTimer.current)
      setDuration(0)
    }
    return () => clearInterval(durationTimer.current)
  }, [step])

  // Auto-scroll chat
  React.useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight
    }
  }, [chatMessages])

  const fmtDur = s => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  }

  const addTag = e => {
    if (['Enter',','].includes(e.key) && tagInput.trim()) {
      e.preventDefault()
      const t = tagInput.trim().replace(/^#/,'')
      if (t && !tags.includes(t) && tags.length < 15) setTags(p => [...p, t])
      setTagInput('')
    }
  }

  // ── Create stream in DB ──────────────────────────────────────
  const createStream = React.useCallback(async () => {
    if (!title.trim()) { setError('Stream title is required'); return null }
    setLoading(true); setError('')
    try {
      const fd = new FormData()
      fd.append('title',       title.trim())
      fd.append('description', description)
      fd.append('category',    category || 'General')
      fd.append('visibility',  vis)
      fd.append('chatEnabled', String(chatEnabled))
      fd.append('tags',        JSON.stringify(tags))
      if (thumbFile) fd.append('thumbnail', thumbFile)

      const r = await api.post('/live', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      const s = r.data.stream
      setStream(s)
      activeStreamRef.current = s
      return s
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create stream')
      return null
    } finally { setLoading(false) }
  }, [title, description, category, vis, chatEnabled, tags, thumbFile])

  const copy = async (text, field) => {
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(p => ({ ...p, [field]: true }))
    setTimeout(() => setCopied(p => ({ ...p, [field]: false })), 2000)
  }

  const handleSelectSource = src => {
    setSource(src)
    if (src === 'webcam')      setStep('webcam')
    else if (src === 'obs')    setStep('obs')
    else if (src === 'mobile') setStep('mobile')
  }

  const handleObsGo = async () => {
    const s = await createStream()
    if (s) setStep('obs_ready')
  }

  // ── Webcam: start recording immediately, connect socket ──────
  const handleWebcamStart = async () => {
    let activeStream = activeStreamRef.current || stream
    if (!activeStream) {
      activeStream = await createStream()
      if (!activeStream) return
    }
    setError('')
    setStep('streaming')

    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
        audio: true,
      })
      localStream.current = media

      if (videoRef.current) {
        videoRef.current.srcObject = media
        videoRef.current.muted = true
        videoRef.current.play().catch(() => {})
      }

      const mimeType = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ].find(m => MediaRecorder.isTypeSupported(m)) || 'video/webm'

      // Start recording IMMEDIATELY — don't wait for socket
      const recorder = new MediaRecorder(media, {
        mimeType,
        videoBitsPerSecond: 2_500_000,
        audioBitsPerSecond: 128_000,
      })
      mediaRecRef.current = recorder

      let sending = false
      const chunkQueue = []

      async function flushQueue() {
        if (sending) return
        sending = true
        while (chunkQueue.length > 0) {
          const blob = chunkQueue.shift()
          try {
            const buf = await blob.arrayBuffer()
            if (socketRef.current?.connected) {
              socketRef.current.emit('stream:chunk', new Uint8Array(buf))
            }
          } catch {}
        }
        sending = false
      }

      recorder.ondataavailable = e => {
        if (e.data.size > 0) {
          chunkQueue.push(e.data)
          if (socketRef.current?.connected) flushQueue()
        }
      }
      recorder.onerror = e => setError(`Recorder error: ${e.error?.message || 'unknown'}`)
      recorder.start(250)

      // Connect socket
      const { io: ioConnect } = await import('socket.io-client')
      const socket = ioConnect(window.location.origin, {
        withCredentials: true,
        path: '/socket.io',
        transports: ['websocket', 'polling'],
      })
      socketRef.current = socket

      socket.on('connect', () => {
        socket.emit('stream:start', {
          streamId:  activeStream._id,
          streamKey: activeStream.streamKey,
          mimeType,
        })
        if (chunkQueue.length > 0) flushQueue()
      })

      socket.on('connect_error', err => {
        setError(`Socket failed: ${err.message}`)
        setStep('webcam')
      })

      socket.on('stream:ready', ({ hlsUrl }) => {
        console.log('[Studio] Stream live:', hlsUrl)
      })

      socket.on('stream:viewers', ({ count }) => setViewers(count))
      socket.on('chat:message',   msg => setChatMessages(p => [...p.slice(-199), msg]))
      socket.on('stream:error',   msg => setError(typeof msg === 'string' ? msg : 'Stream error'))
      socket.on('disconnect', reason => {
        if (reason !== 'io client disconnect') setError('Connection lost.')
      })

    } catch (err) {
      setError(err.name === 'NotAllowedError'
        ? 'Camera permission denied. Allow access and try again.'
        : `Error: ${err.message}`)
      setStep('webcam')
    }
  }

  // ── End stream — studio side just stops media + socket ───────
  // The actual "end" is handled by LivePage (client). Studio just stops sending.
  const handleStopStream = async () => {
    try { mediaRecRef.current?.stop() } catch {}
    try { localStream.current?.getTracks().forEach(t => t.stop()) } catch {}
    try {
      socketRef.current?.emit('stream:end')
      socketRef.current?.disconnect()
    } catch {}
    const s = activeStreamRef.current || stream
    if (s?._id) await api.post(`/live/${s._id}/end`).catch(() => {})
    onClose()
  }

  const handleMobileGo = async () => {
    const s = await createStream()
    if (!s) return
    try {
      const r = await api.get(`/live/${s._id}/mobile-token`)
      setMobileUrl(r.data.mobileUrl)
      setStep('mobile_qr')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate mobile link')
    }
  }

  // ── Icons ────────────────────────────────────────────────────
  const WebcamIco = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
  const ObsIco    = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
  const MobileIco = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
  const CopyIco   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
  const CheckIco2 = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
  const ImgIco    = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>

  const activeStreamId = (activeStreamRef.current || stream)?._id

  // ── SETUP ────────────────────────────────────────────────────
  if (step === 'setup') return (
    <div className="gl-setup">
      <div className="gl-setup-header">
        <div className="cm-flow-icon" style={{ background: 'rgba(192,57,43,0.12)', color: '#c0392b', margin: '0 0 8px' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 010 8.49M7.76 16.24a6 6 0 010-8.49M19.07 4.93a10 10 0 010 14.14M4.93 19.07a10 10 0 010-14.14"/></svg>
        </div>
        <h3 className="cm-flow-title">Go live</h3>
      </div>

      <div className="gl-setup-body">
        {/* Left: form */}
        <div className="gl-setup-form">
          <div className="cm-field">
            <label className="cm-label">Stream title <span className="cm-req">*</span></label>
            <input className="cm-input" placeholder="What are you streaming?" value={title}
              onChange={e => setTitle(e.target.value)} autoFocus maxLength={200} />
          </div>

          <div className="cm-field">
            <label className="cm-label">Description</label>
            <textarea className="cm-textarea" placeholder="Tell viewers what this stream is about…"
              value={description} onChange={e => setDescription(e.target.value)}
              rows={3} maxLength={2000} />
          </div>

          <div className="cm-two-col">
            <div className="cm-field">
              <label className="cm-label">Category</label>
<div className="cp-row">
                  <select className="cm-select" value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="">Select</option>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  <button type="button" className="cp-add-btn"
                    onClick={() => setShowLiveCatNew(v => !v)}>+ New</button>
                </div>
                {showLiveCatNew && (
                  <div className="cp-new-row" style={{marginTop:6}}>
                    <input className="cp-input" placeholder="New category…"
                      value={liveCatNewName}
                      onChange={e => setLiveCatNewName(e.target.value)}
                      onKeyDown={async e => {
                        if (e.key === 'Enter' && liveCatNewName.trim()) {
                          const saved = await addCategory(liveCatNewName.trim())
                          setCategory(saved)
                          setLiveCatNewName('')
                          setShowLiveCatNew(false)
                        }
                      }}
                      autoFocus />
                    <button className="cp-save-btn" disabled={!liveCatNewName.trim()}
                      onClick={async () => {
                        const saved = await addCategory(liveCatNewName.trim())
                        setCategory(saved)
                        setLiveCatNewName('')
                        setShowLiveCatNew(false)
                      }}>Add</button>
                    <button className="cp-cancel-btn"
                      onClick={() => setShowLiveCatNew(false)}>✕</button>
                  </div>
                )}
            </div>
            <div className="cm-field">
              <label className="cm-label">Visibility</label>
              <select className="cm-select" value={vis} onChange={e => setVis(e.target.value)}>
                <option value="public">Public</option>
                <option value="unlisted">Unlisted</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>

          <div className="cm-field">
            <label className="cm-label">Tags</label>
            <div className="gl-tags-wrap" onClick={() => document.getElementById('gl-tag-input')?.focus()}>
              {tags.map(t => (
                <span key={t} className="gl-tag">
                  #{t}
                  <button onClick={() => setTags(p => p.filter(x => x !== t))}>×</button>
                </span>
              ))}
              <input id="gl-tag-input" className="gl-tag-input"
                value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={addTag} placeholder={tags.length === 0 ? 'Add tags…' : ''}
                maxLength={50} />
            </div>
          </div>

          <div className="cm-two-col">
            <div className="cm-field">
              <label className="cm-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>Live chat</span>
                <label className="gl-toggle">
                  <input type="checkbox" checked={chatEnabled} onChange={e => setChatEnabled(e.target.checked)} />
                  <span className="gl-toggle-slider" />
                </label>
                <span style={{ fontSize: 11, color: 'var(--st-t3)' }}>{chatEnabled ? 'On' : 'Off'}</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right: thumbnail */}
        <div className="gl-setup-right">
          <label className="cm-label">Thumbnail</label>
          <div className="gl-thumb-drop" onClick={() => thumbRef.current?.click()}>
            <input ref={thumbRef} type="file" accept="image/*" hidden
              onChange={e => {
                const f = e.target.files?.[0]
                if (f) { setThumbFile(f); setThumbPreview(URL.createObjectURL(f)) }
              }} />
            {thumbPreview
              ? <img src={thumbPreview} alt="thumbnail" className="gl-thumb-preview" />
              : <div className="gl-thumb-placeholder"><ImgIco /><p>Upload thumbnail</p><span>1280×720 recommended</span></div>
            }
          </div>
          {thumbPreview && (
            <button className="gl-thumb-remove" onClick={() => { setThumbFile(null); setThumbPreview('') }}>
              Remove
            </button>
          )}

<p className="gl-source-section-label" style={{marginTop:14}}>Choose source</p>
          <div className="gl-source-grid-compact">
            <button className={`gl-source-card-sm ${source === 'webcam' ? 'active' : ''}`} onClick={() => setSource('webcam')}>
              <WebcamIco /><span>Webcam</span>
            </button>
            <button className={`gl-source-card-sm ${source === 'obs' ? 'active' : ''}`} onClick={() => setSource('obs')}>
              <ObsIco /><span>OBS</span>
            </button>
            <button className={`gl-source-card-sm ${source === 'mobile' ? 'active' : ''}`} onClick={() => setSource('mobile')}>
              <MobileIco /><span>Mobile</span>
            </button>
          </div>
        </div>
      </div>

      {error && <div className="cm-error" style={{margin:'0 20px'}}>{error}</div>}
      <div className="gl-setup-footer">
        <button className="cm-flow-secondary" onClick={onClose}>Cancel</button>
        <button className="cm-flow-primary cm-flow-live-btn"
          disabled={!source || !title.trim() || loading}
          onClick={() => handleSelectSource(source)}>
          {loading ? 'Creating…' : 'Next →'}
        </button>
      </div>
    </div>
  )

  // ── WEBCAM confirm ───────────────────────────────────────────
  if (step === 'webcam') return (
    <div className="cm-flow">
      <div className="cm-flow-icon" style={{ background: 'rgba(192,57,43,0.12)', color: '#c0392b' }}><WebcamIco /></div>
      <h3 className="cm-flow-title">Start webcam stream</h3>
      <p className="cm-flow-desc">Your browser will ask for camera and microphone permission.</p>
      <div className="gl-stream-summary">
        {thumbPreview && <img src={thumbPreview} alt="" className="gl-summary-thumb" />}
        <div>
          <p className="gl-summary-title">"{title}"</p>
          <p className="gl-summary-meta">👥 {vis} · 🎯 {category || 'General'} · 💬 Chat {chatEnabled ? 'on' : 'off'}</p>
        </div>
      </div>
      {error && <div className="cm-error">{error}</div>}
      <div className="cm-flow-actions">
        <button className="cm-flow-secondary" onClick={() => setStep('setup')}>Back</button>
        <button className="cm-flow-primary cm-flow-live-btn" disabled={loading} onClick={handleWebcamStart}>
          {loading ? 'Starting…' : '🔴 Go Live'}
        </button>
      </div>
    </div>
  )

  // ── STREAMING — YouTube Studio-style creator dashboard ─────────
  if (step === 'streaming') return (
    <div className="gl-creator-dashboard">

      {/* ── LEFT: preview + controls ── */}
      <div className="gl-creator-left">
        <div className="gl-dash-topbar">
          <div className="gl-live-badge"><span className="gl-live-dot" />LIVE</div>
          <span className="gl-dash-title-sm" title={title}>{title}</span>
          <span className="gl-dash-timer">{fmtDur(duration)}</span>
        </div>

        <div className="gl-webcam-wrap">
          <video ref={videoRef} className="gl-webcam-preview" autoPlay muted playsInline />
          <div className="gl-webcam-overlay-viewers">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            {viewers}
          </div>
        </div>

        <div className="gl-dash-stats-row">
          <div className="gl-dash-stat-box">
            <div className="gl-dash-stat-num">{viewers}</div>
            <div className="gl-dash-stat-key">Viewers</div>
          </div>
          <div className="gl-dash-stat-div" />
          <div className="gl-dash-stat-box">
            <div className="gl-dash-stat-num">{fmtDur(duration)}</div>
            <div className="gl-dash-stat-key">Duration</div>
          </div>
          <div className="gl-dash-stat-div" />
          <div className="gl-dash-stat-box">
            <div className="gl-dash-stat-num" style={{ textTransform:'capitalize' }}>{vis}</div>
            <div className="gl-dash-stat-key">Visibility</div>
          </div>
        </div>

        {error && <div className="cm-error" style={{ margin: '6px 16px' }}>{error}</div>}

        <div className="gl-dash-actions">
          {activeStreamId && (
            <a href={`http://localhost:5173/live/${activeStreamId}`} target="_blank"
              rel="noopener noreferrer" className="gl-dash-view-btn">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              Open viewer page
            </a>
          )}
          <button className="gl-dash-stop-btn" onClick={handleStopStream}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
            End Stream
          </button>
        </div>
        <p className="gl-dash-save-note">Saved automatically as a replay when ended.</p>
      </div>

      {/* ── RIGHT: live chat ── */}
      <div className="gl-creator-chat">
        <div className="gl-chat-header">
          <span className="gl-chat-title">Live Chat</span>
          <span className="gl-chat-viewcount">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            {viewers}
          </span>
        </div>

        <div className="gl-chat-msgs" ref={chatMessagesRef}>
          {chatMessages.length === 0 && (
            <div className="gl-chat-empty-state">
              <p>Chat will appear here</p>
              <p>when viewers send messages</p>
            </div>
          )}
          {chatMessages.map(msg => (
            <div key={msg.id} className="gl-chat-msg-item">
              <div className="gl-chat-msg-avatar">
                {msg.avatar
                  ? <img src={msg.avatar} alt="" />
                  : <span>{msg.username?.[0]?.toUpperCase() || '?'}</span>
                }
              </div>
              <div>
                <span className="gl-chat-msg-user">{msg.username}</span>
                <span className="gl-chat-msg-text"> {msg.message}</span>
              </div>
            </div>
          ))}
        </div>

        {chatEnabled && (
          <div className="gl-chat-composer">
            <input
              className="gl-chat-compose-input"
              placeholder="Say something…"
              value={hostChatInput}
              onChange={e => setHostChatInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && hostChatInput.trim() && socketRef.current?.connected) {
                  socketRef.current.emit('chat:message', {
                    streamId: activeStreamId,
                    message:  hostChatInput.trim(),
                    username: title.slice(0,24) + ' (Host)',
                    avatar:   null,
                  })
                  setHostChatInput('')
                }
              }}
              maxLength={300}
            />
            <button
              className="gl-chat-send-btn"
              disabled={!hostChatInput.trim()}
              onClick={() => {
                if (hostChatInput.trim() && socketRef.current?.connected) {
                  socketRef.current.emit('chat:message', {
                    streamId: activeStreamId,
                    message:  hostChatInput.trim(),
                    username: title.slice(0,24) + ' (Host)',
                    avatar:   null,
                  })
                  setHostChatInput('')
                }
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )

  // ── OBS setup ────────────────────────────────────────────────
  if (step === 'obs') return (
    <div className="cm-flow">
      <div className="cm-flow-icon" style={{ background: 'rgba(192,57,43,0.12)', color: '#c0392b' }}><ObsIco /></div>
      <h3 className="cm-flow-title">OBS Studio setup</h3>
      <div className="gl-stream-summary">
        {thumbPreview && <img src={thumbPreview} alt="" className="gl-summary-thumb" />}
        <div><p className="gl-summary-title">"{title}"</p></div>
      </div>
      {error && <div className="cm-error">{error}</div>}
      <div className="cm-flow-actions">
        <button className="cm-flow-secondary" onClick={() => setStep('setup')}>Back</button>
        <button className="cm-flow-primary cm-flow-live-btn" disabled={loading} onClick={handleObsGo}>
          {loading ? 'Creating…' : 'Create Stream →'}
        </button>
      </div>
    </div>
  )

  if (step === 'obs_ready') return (
    <div className="cm-flow" style={{ gap: 12 }}>
      <div className="cm-flow-icon" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}><ObsIco /></div>
      <h3 className="cm-flow-title">Stream ready — open OBS</h3>
      <p className="cm-flow-desc">Go to <strong>Settings → Stream</strong> in OBS:</p>
      <div className="gl-obs-fields">
        <div className="gl-obs-row-item">
          <span className="gl-obs-lbl">Server</span>
          <div className="gl-obs-copy">
            <code>rtmp://localhost:1935/live</code>
            <button onClick={() => copy('rtmp://localhost:1935/live', 'server')}>
              {copied.server ? <CheckIco2 /> : <CopyIco />}
            </button>
          </div>
        </div>
        <div className="gl-obs-row-item">
          <span className="gl-obs-lbl">Stream Key</span>
          <div className="gl-obs-copy">
            <code className="gl-obs-key-val">{stream?.streamKey}</code>
            <button onClick={() => copy(stream?.streamKey, 'key')}>
              {copied.key ? <CheckIco2 /> : <CopyIco />}
            </button>
          </div>
        </div>
      </div>
      <div className="cm-flow-actions">
        <button className="cm-flow-secondary" onClick={onClose}>Close</button>
        <a href={activeStreamId ? `http://localhost:5173/live/${activeStreamId}` : '#'}
          target="_blank" rel="noopener noreferrer" className="cm-flow-primary" onClick={onClose}>
          Open stream page →
        </a>
      </div>
    </div>
  )

  if (step === 'mobile') return (
    <div className="cm-flow">
      <div className="cm-flow-icon" style={{ background: 'rgba(102,84,168,0.12)', color: '#6654a8' }}><MobileIco /></div>
      <h3 className="cm-flow-title">Mobile camera stream</h3>
      <p className="cm-flow-desc">Scan the QR code on your phone (same WiFi network).</p>
      {error && <div className="cm-error">{error}</div>}
      <div className="cm-flow-actions">
        <button className="cm-flow-secondary" onClick={() => setStep('setup')}>Back</button>
        <button className="cm-flow-primary" disabled={loading} onClick={handleMobileGo}>
          {loading ? 'Generating…' : 'Generate QR Code'}
        </button>
      </div>
    </div>
  )

  if (step === 'mobile_qr') return (
    <div className="cm-flow" style={{ gap: 14 }}>
      <div className="cm-flow-icon" style={{ background: 'rgba(102,84,168,0.12)', color: '#6654a8' }}><MobileIco /></div>
      <h3 className="cm-flow-title">Scan with your phone</h3>
      <QRCodeCanvas url={mobileUrl} />
      <div style={{ fontSize: 11, color: 'var(--st-t4)', textAlign: 'center', wordBreak: 'break-all', maxWidth: 280 }}>
        {mobileUrl}
      </div>
      <div className="cm-flow-actions">
        <button className="cm-flow-secondary" onClick={onClose}>Close</button>
        <a href={activeStreamId ? `http://localhost:5173/live/${activeStreamId}` : '#'}
          target="_blank" rel="noopener noreferrer" className="cm-flow-primary" onClick={onClose}>
          Watch stream →
        </a>
      </div>
    </div>
  )

  return null
}

// ── Post flow ──────────────────────────────────────────────────────

// ── Main CreateModal ───────────────────────────────────────────────
export default function CreateModal({ initial = null, onClose }) {
  const [active, setActive] = useState(initial)

  const handleBack = () => setActive(null)

  // Upload uses its own wide yt-modal-wrap — no cm-modal wrapper needed
  if (active === 'upload') {
    return (
      <div className="cm-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
        <UploadFlow onClose={onClose} onBack={handleBack} />
      </div>
    )
  }

  // Live flow gets a wider modal so the two-column layout fits
  if (active === 'live') {
    return (
      <div className="cm-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
        <div className="cm-modal-live" onClick={e => e.stopPropagation()}>
          <div className="cm-nav">
            <button className="cm-back-btn" onClick={handleBack}><BackIco /> Back</button>
            <button className="cm-close-btn" onClick={onClose}><CloseIco /></button>
          </div>
          <LiveFlow onClose={onClose} />
        </div>
      </div>
    )
  }

  return (
    <div className="cm-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="cm-modal" onClick={e => e.stopPropagation()}>

        {active && (
          <div className="cm-nav">
            <button className="cm-back-btn" onClick={handleBack}><BackIco /> Back</button>
            <button className="cm-close-btn" onClick={onClose}><CloseIco /></button>
          </div>
        )}

        {!active
          ? <Picker initial={initial} onSelect={setActive} onClose={onClose} />
          : null
        }

      </div>
    </div>
  )
}