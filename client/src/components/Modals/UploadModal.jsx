// FILE: client/src/components/Modals/UploadModal.jsx
import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { useCategoryList } from '../../hooks/useCategoryList'
import './UploadModal.css'

// ── ICONS ─────────────────────────────────────────────────────────────────────
const CloseIcon     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const UploadBigIcon = () => <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
const CheckIcon     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const ImageIcon     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
const GlobeIcon     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
const LockIcon      = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
const LinkIcon      = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
const SubIcon       = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 15h4m4 0h2M7 11h2m4 0h4"/></svg>
const EndIcon       = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/></svg>
const CardIcon      = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
const TagIcon       = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>

const STEPS      = ['Details', 'Video elements', 'Checks', 'Visibility']

// ── CANVAS FRAME EXTRACTOR (runs in browser, no deps needed) ──────────────────
// Seeks to 3 timestamps and snapshots each frame via <canvas>
function extractFrames(file) {
  return new Promise((resolve) => {
    const url    = URL.createObjectURL(file)
    const vid    = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx    = canvas.getContext('2d')
    const frames = []

    vid.preload = 'metadata'
    vid.muted   = true
    vid.src     = url

    vid.onloadedmetadata = () => {
      const dur      = isFinite(vid.duration) && vid.duration > 0 ? vid.duration : 10
      const times    = [dur * 0.10, dur * 0.35, dur * 0.65].map(t => Math.max(0.5, t))
      const vw       = vid.videoWidth  || 480
      const vh       = vid.videoHeight || 270
      const isShort  = vh > vw && dur <= 60   // vertical + ≤60s = Short

      // For shorts: cap at 270px wide (portrait), for videos: cap at 480px wide
      const maxW     = isShort ? 270 : 480
      const scale    = Math.min(1, maxW / vw)
      canvas.width   = Math.round(vw * scale)
      canvas.height  = Math.round(vh * scale)

      let idx = 0

      vid.onseeked = () => {
        ctx.drawImage(vid, 0, 0, canvas.width, canvas.height)
        frames.push(canvas.toDataURL('image/jpeg', 0.85))
        idx++
        if (idx < times.length) {
          vid.currentTime = times[idx]
        } else {
          URL.revokeObjectURL(url)
          resolve({ frames, isShort, width: vw, height: vh, duration: dur })
        }
      }

      vid.onerror = () => { URL.revokeObjectURL(url); resolve({ frames: [], isShort: false }) }
      vid.currentTime = times[0]
    }

    vid.onerror = () => { URL.revokeObjectURL(url); resolve({ frames: [], isShort: false }) }
  })
}

// dataURL  →  File  (so we can append to FormData as a real image file)
function dataURLtoFile(dataURL, filename) {
  const [header, b64] = dataURL.split(',')
  const mime  = header.match(/:(.*?);/)[1]
  const bytes = atob(b64)
  const arr   = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  return new File([arr], filename, { type: mime })
}



// ── File size limit ───────────────────────────────────────────────────────────
const MAX_FILE_BYTES = 500 * 1024 * 1024   // 500 MB
const MAX_FILE_LABEL = '500 MB'

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
  if (bytes >= 1024 * 1024)        return (bytes / (1024 * 1024)).toFixed(0) + ' MB'
  return (bytes / 1024).toFixed(0) + ' KB'
}

// ── STEP BAR ──────────────────────────────────────────────────────────────────
function StepBar({ current }) {
  return (
    <div className="um-stepbar">
      {STEPS.map((s, i) => {
        const done = i < current, active = i === current
        return (
          <div key={s} className="um-stepbar-item">
            <div className={`um-step-dot ${done?'done':''} ${active?'active':''}`}>
              {done ? <CheckIcon /> : <span>{i+1}</span>}
            </div>
            <span className={`um-step-lbl ${active?'active':''} ${done?'done':''}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`um-step-line ${i < current?'done':''}`} />}
          </div>
        )
      })}
    </div>
  )
}

// ── STEP 1: DETAILS ───────────────────────────────────────────────────────────
const SparkIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>


// ── CATEGORY PICKER ───────────────────────────────────────────────────────────
function CategoryPicker({ value, subValue, categories, categoryDocs, addCategory, addSubCategory, onChange }) {
  const [newCat,    setNewCat]    = useState('')
  const [newSub,    setNewSub]    = useState('')
  const [showNewCat, setShowNewCat] = useState(false)
  const [showNewSub, setShowNewSub] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')

  const selectedDoc = categoryDocs.find(d => d.name === value)
  const subCats     = selectedDoc?.subCategories || []

  const handleAddCat = async () => {
    if (!newCat.trim()) return
    setSaving(true); setError('')
    try {
      const saved = await addCategory(newCat.trim())
      onChange(saved, '')
      setNewCat(''); setShowNewCat(false)
    } catch(e) { setError(e.response?.data?.message || 'Failed to add category') }
    finally { setSaving(false) }
  }

  const handleAddSub = async () => {
    if (!newSub.trim() || !value) return
    setSaving(true); setError('')
    try {
      await addSubCategory(value, newSub.trim())
      onChange(value, newSub.trim())
      setNewSub(''); setShowNewSub(false)
    } catch(e) { setError(e.response?.data?.message || 'Failed to add subcategory') }
    finally { setSaving(false) }
  }

  return (
    <div className="um-field">
      <label className="um-label">Category</label>
      <div className="um-cat-row">
        <select className="um-select" value={value} onChange={e => onChange(e.target.value, '')}>
          <option value="">Select a category</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button type="button" className="um-cat-add-btn" title="Add new category"
          onClick={() => { setShowNewCat(v => !v); setShowNewSub(false) }}>
          + New
        </button>
      </div>

      {showNewCat && (
        <div className="um-cat-new-row">
          <input className="um-input um-cat-input" placeholder="New category name…"
            value={newCat} onChange={e => setNewCat(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddCat()} autoFocus />
          <button type="button" className="um-cat-save-btn" onClick={handleAddCat} disabled={saving || !newCat.trim()}>
            {saving ? '…' : 'Add'}
          </button>
          <button type="button" className="um-cat-cancel-btn" onClick={() => setShowNewCat(false)}>✕</button>
        </div>
      )}

      {value && (
        <>
          <label className="um-label" style={{marginTop:10}}>Subcategory <span className="um-optional">(optional)</span></label>
          <div className="um-cat-row">
            <select className="um-select" value={subValue} onChange={e => onChange(value, e.target.value)}>
              <option value="">None</option>
              {subCats.map(s => <option key={s._id || s.name} value={s.name}>{s.name}</option>)}
            </select>
            <button type="button" className="um-cat-add-btn" title="Add new subcategory"
              onClick={() => { setShowNewSub(v => !v); setShowNewCat(false) }}>
              + New
            </button>
          </div>
          {showNewSub && (
            <div className="um-cat-new-row">
              <input className="um-input um-cat-input" placeholder={`New subcategory under "${value}"…`}
                value={newSub} onChange={e => setNewSub(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddSub()} autoFocus />
              <button type="button" className="um-cat-save-btn" onClick={handleAddSub} disabled={saving || !newSub.trim()}>
                {saving ? '…' : 'Add'}
              </button>
              <button type="button" className="um-cat-cancel-btn" onClick={() => setShowNewSub(false)}>✕</button>
            </div>
          )}
        </>
      )}

      {error && <p className="um-cat-error">{error}</p>}
    </div>
  )
}

function StepDetails({ data, onChange, frames = [], isShort = false, selectedThumbIdx, onThumbSelect, onCustomThumb, customThumbPreview, categories = [], categoryDocs = [], addCategory, addSubCategory }) {
  const [tagInput,    setTagInput]    = useState('')
  const [aiLoading,   setAiLoading]   = useState(false)
  const [aiError,     setAiError]     = useState('')
  const [suggestions, setSuggestions] = useState([])

  const handleAIGenerate = async () => {
    if (!data.title?.trim()) { setAiError('Add a title first so AI knows what your video is about'); return }
    setAiLoading(true); setAiError(''); setSuggestions([])
    try {
      const r = await api.post('/ai/video-metadata', {
        title: data.title,
        // thumbnail intentionally omitted — title alone gives Gemini enough context
        // and avoids sending large base64 data over the wire
      })

      if (r.data.success) {
        if (r.data.description) onChange('description', r.data.description)
        if (r.data.tags?.length) onChange('tags', r.data.tags)
        if (r.data.category)    onChange('category', r.data.category)
      }
    } catch (err) {
      setAiError(err.response?.data?.message || 'AI generation failed. Try again.')
    } finally {
      setAiLoading(false)
    }
  }

  const handleImproveTitle = async () => {
    if (!data.title?.trim()) return
    setAiLoading(true); setAiError('')
    try {
      const r = await api.post('/ai/improve-title', { title: data.title })
      if (r.data.suggestions?.length) setSuggestions(r.data.suggestions)
    } catch {}
    finally { setAiLoading(false) }
  }

  const addTag = e => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault()
      if (!data.tags.includes(tagInput.trim())) onChange('tags', [...data.tags, tagInput.trim()])
      setTagInput('')
    }
  }

  return (
    <div className="um-details-layout">
      <div className="um-details-left">

        {/* ── AI Generate bar ── */}
        <div className="um-ai-bar">
          <SparkIcon />
          <span>Generate description, tags & category with AI</span>
          <button
            type="button"
            className={`um-ai-btn ${aiLoading ? 'loading' : ''}`}
            onClick={handleAIGenerate}
            disabled={aiLoading || !data.title?.trim()}
            title={!data.title?.trim() ? 'Add a title first' : 'Generate with Gemini AI'}
          >
            {aiLoading ? 'Generating…' : <><SparkIcon /> Generate</>}
          </button>
        </div>
        {aiError && <div className="um-ai-error">{aiError}</div>}

        <div className="um-field">
          <label className="um-label">Title <span className="um-req">*</span></label>
          <div className="um-input-rel">
            <input className="um-input" placeholder="Add a title that describes your video"
              value={data.title} onChange={e => onChange('title', e.target.value)} maxLength={100} />
            <span className="um-charcount">{data.title.length}/100</span>
          </div>
          {/* Title improvement suggestions */}
          <div className="um-title-suggest-row">
            <button type="button" className="um-title-improve-btn" onClick={handleImproveTitle} disabled={aiLoading || !data.title?.trim()}>
              <SparkIcon /> Improve title
            </button>
          </div>
          {suggestions.length > 0 && (
            <div className="um-suggestions">
              <p className="um-suggestions-label">AI suggestions — click to use:</p>
              {suggestions.map((s, i) => (
                <button key={i} type="button" className="um-suggestion-chip"
                  onClick={() => { onChange('title', s); setSuggestions([]) }}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="um-field">
          <label className="um-label">Description</label>
          <div className="um-input-rel">
            <textarea className="um-textarea" placeholder="Tell viewers about your video"
              value={data.description} onChange={e => onChange('description', e.target.value)}
              maxLength={5000} rows={4} />
            <span className="um-charcount">{data.description.length}/5000</span>
          </div>
        </div>
        {/* Thumbnail picker — frames extracted before this step */}
        <div className="um-field">
          <label className="um-label"><ImageIcon /> Thumbnail</label>
          <div className={`um-tp-grid um-tp-grid-left ${isShort ? 'um-tp-grid-short' : ''}`}>
            {frames.map((frameSrc, i) => (
              <div key={i}
                className={`um-tp-card ${isShort ? 'um-tp-card-short' : ''} ${selectedThumbIdx === i ? 'selected' : ''}`}
                onClick={() => onThumbSelect(i)}
              >
                <img src={frameSrc} alt={`Frame ${i + 1}`} />
                <span className="um-tp-card-lbl">Frame {i + 1}</span>
                {selectedThumbIdx === i && <div className="um-tp-check"><CheckIcon /></div>}
              </div>
            ))}
            <div
              className={`um-tp-card ${isShort ? 'um-tp-card-short' : ''} um-tp-custom ${selectedThumbIdx === 'custom' ? 'selected' : ''}`}
              onClick={() => document.getElementById('um-details-custom-thumb')?.click()}
            >
              {customThumbPreview
                ? <img src={customThumbPreview} alt="Custom" />
                : <div className="um-tp-custom-ph"><ImageIcon /><span>Upload custom</span></div>}
              <span className="um-tp-card-lbl">Custom</span>
              {selectedThumbIdx === 'custom' && <div className="um-tp-check"><CheckIcon /></div>}
            </div>
          </div>
          <input id="um-details-custom-thumb" type="file" accept="image/*" style={{display:'none'}}
            onChange={e => { const f = e.target.files[0]; if (f) onCustomThumb(f) }} />
        </div>
        <div className="um-field">
          <label className="um-label"><TagIcon /> Tags</label>
          <div className="um-tags-box">
            {data.tags.map(t => (
              <span key={t} className="um-tag">#{t}
                <button onClick={() => onChange('tags', data.tags.filter(x => x !== t))}>×</button>
              </span>
            ))}
            <input className="um-tag-input" placeholder="Type + Enter"
              value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag} />
          </div>
        </div>
        <CategoryPicker
          value={data.category}
          subValue={data.subCategory || ''}
          categories={categories}
          categoryDocs={categoryDocs}
          addCategory={addCategory}
          addSubCategory={addSubCategory}
          onChange={(cat, sub) => { onChange('category', cat); onChange('subCategory', sub || '') }}
        />
      </div>
      <div className="um-details-right">
        <div className={`um-preview-card ${isShort ? 'um-preview-short' : ''}`}>
          <div className={`um-preview-thumb ${isShort ? 'um-preview-thumb-short' : ''}`}>
            {(() => {
              const src = selectedThumbIdx === 'custom' ? customThumbPreview : frames[selectedThumbIdx]
              return src ? <img src={src} alt="" /> : <div className="um-preview-ph"><UploadBigIcon /></div>
            })()}
            <span className="um-preview-tag">Preview</span>
          </div>
          <div className="um-preview-info">
            <p className="um-preview-title">{data.title || 'Your video title'}</p>
            {data.file && <p className="um-preview-file">📁 {data.file.name}</p>}
          </div>
        </div>

        <div className="um-kids-card">
          <p className="um-kids-title">Made for kids?</p>
          <p className="um-kids-sub">Required by law. May limit some features.</p>
          {[{val:'no',label:"No, it's not made for kids"},{val:'yes',label:"Yes, it's made for kids"}].map(o => (
            <label key={o.val} className={`um-kids-opt ${data.madeForKids===o.val?'active':''}`}>
              <input type="radio" name="kids" checked={data.madeForKids===o.val} onChange={() => onChange('madeForKids', o.val)} />
              {o.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── STEP 2: VIDEO ELEMENTS ────────────────────────────────────────────────────
function StepElements() {
  const items = [
    { icon: <SubIcon />,  title: 'Add subtitles',     desc: 'Reach a broader audience by adding subtitles',    btns: ['Add'] },
    { icon: <EndIcon />,  title: 'Add an end screen', desc: 'Promote related content at the end of your video', btns: ['Import from video','Add'] },
    { icon: <CardIcon />, title: 'Add cards',          desc: 'Promote related content during your video',       btns: ['Add'] },
  ]
  return (
    <div className="um-elements">
      <p className="um-section-hint">Use cards and an end screen to show viewers related videos, websites, and calls to action.</p>
      {items.map((item, i) => (
        <div key={i} className="um-el-row">
          <div className="um-el-icon">{item.icon}</div>
          <div className="um-el-info">
            <p className="um-el-title">{item.title}</p>
            <p className="um-el-desc">{item.desc}</p>
          </div>
          <div className="um-el-btns">
            {item.btns.map(b => <button key={b} className="um-el-btn">{b}</button>)}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── STEP 3: CHECKS ────────────────────────────────────────────────────────────
function StepChecks() {
  const [done, setDone] = useState(false)
  useState(() => { const t = setTimeout(() => setDone(true), 1800); return () => clearTimeout(t) })
  return (
    <div className="um-checks">
      <p className="um-section-hint">We'll check your video for issues that may restrict its visibility.</p>
      <div className="um-check-row">
        <div className="um-check-info">
          <p className="um-check-title">Copyright</p>
          <p className="um-check-status">{done ? 'No issues found' : 'Checking...'}</p>
        </div>
        <div className={`um-check-dot ${done?'pass':'loading'}`}>
          {done ? <CheckIcon /> : <div className="um-spinner" />}
        </div>
      </div>
      <AnimatePresence>
        {done && (
          <motion.div className="um-checks-ok" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>
            <CheckIcon /> Checks complete. No issues found.
          </motion.div>
        )}
      </AnimatePresence>
      <p className="um-checks-note">Note: Check results aren't final. Issues may come up in the future.</p>
    </div>
  )
}

// ── STEP 4: VISIBILITY ────────────────────────────────────────────────────────
function StepVisibility({ data, onChange }) {
  const opts = [
    { val:'private',  label:'Private',  desc:'Only you and people you choose can watch', icon:<LockIcon /> },
    { val:'unlisted', label:'Unlisted', desc:'Anyone with the video link can watch',      icon:<LinkIcon /> },
    { val:'public',   label:'Public',   desc:'Everyone can watch your video',             icon:<GlobeIcon /> },
  ]
  return (
    <div className="um-visibility">
      <p className="um-section-hint">Choose when to publish and who can see your video.</p>
      <div className="um-vis-card">
        <p className="um-vis-card-title">Save or publish</p>
        <p className="um-vis-card-sub">Make your video <strong>public</strong>, <strong>unlisted</strong>, or <strong>private</strong></p>
        {opts.map(o => (
          <label key={o.val} className={`um-vis-opt ${data.visibility===o.val?'active':''}`}>
            <input type="radio" name="vis" checked={data.visibility===o.val} onChange={() => onChange('visibility', o.val)} />
            <span className={`um-vis-icon ${data.visibility===o.val?'active':''}`}>{o.icon}</span>
            <span className="um-vis-text">
              <span className="um-vis-label">{o.label}</span>
              <span className="um-vis-desc">{o.desc}</span>
            </span>
          </label>
        ))}
      </div>
      <div className="um-checklist-card">
        <p className="um-checklist-title">Before you publish, check:</p>
        <p className="um-checklist-q">Do kids appear in this video?</p>
        <p className="um-checklist-a">Make sure you follow policies to protect minors.</p>
        <p className="um-checklist-q" style={{marginTop:10}}>Looking for content guidance?</p>
        <p className="um-checklist-a">Our Community Guidelines help ensure AURA remains a safe community.</p>
      </div>
    </div>
  )
}


// ── EXTRACTING SCREEN ─────────────────────────────────────────────────────────
function ExtractingScreen({ filename }) {
  return (
    <div className="um-extracting">
      <div className="um-extracting-ring">
        <motion.div className="um-extracting-spinner"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}
        />
        <div className="um-extracting-icon"><UploadBigIcon /></div>
      </div>
      <p className="um-extracting-title">Analysing video...</p>
      <p className="um-extracting-file">{filename}</p>
      <p className="um-extracting-sub">Generating thumbnail options — just a moment</p>
      <div className="um-extracting-dots">
        {[0,1,2].map(i => (
          <motion.span key={i} className="um-ext-dot"
            animate={{ opacity: [0.25, 1, 0.25], scale: [0.8, 1.1, 0.8] }}
            transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.35 }}
          />
        ))}
      </div>
    </div>
  )
}

// ── THUMBNAIL PICKER (shown after extraction, before step 0) ──────────────────
function ThumbnailPicker({ frames, isShort = false, selectedIdx, onSelect, onCustom, customPreview }) {
  const fileRef = useRef(null)
  return (
    <div className="um-thumb-picker">
      <p className="um-tp-title">Choose a thumbnail</p>
      <p className="um-tp-sub">Pick a frame from your video or upload a custom image</p>
      <div className={`um-tp-grid ${isShort ? 'um-tp-grid-short' : ''}`}>
        {frames.map((src, i) => (
          <motion.div key={i}
            className={`um-tp-card ${isShort ? 'um-tp-card-short' : ''} ${selectedIdx === i ? 'selected' : ''}`}
            onClick={() => onSelect(i)}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          >
            <img src={src} alt={`Frame ${i + 1}`} />
            <span className="um-tp-card-lbl">Frame {i + 1}</span>
            {selectedIdx === i && <div className="um-tp-check"><CheckIcon /></div>}
          </motion.div>
        ))}
        <motion.div
          className={`um-tp-card ${isShort ? 'um-tp-card-short' : ''} um-tp-custom ${selectedIdx === 'custom' ? 'selected' : ''}`}
          onClick={() => fileRef.current?.click()}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
        >
          {customPreview
            ? <img src={customPreview} alt="Custom" />
            : <div className="um-tp-custom-ph"><ImageIcon /><span>Upload custom</span></div>
          }
          <span className="um-tp-card-lbl">Custom</span>
          {selectedIdx === 'custom' && <div className="um-tp-check"><CheckIcon /></div>}
        </motion.div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files[0]; if (f) onCustom(f) }} />
    </div>
  )
}

// ── DROPZONE ──────────────────────────────────────────────────────────────────
function Dropzone({ onFile }) {
  const [drag,    setDrag]    = useState(false)
  const [sizeErr, setSizeErr] = useState('')
  const ref = useRef(null)

  const checkAndLoad = useCallback((f) => {
    if (!f || !f.type.startsWith('video/')) return
    if (f.size > MAX_FILE_BYTES) {
      setSizeErr(
        `"${f.name}" is ${formatBytes(f.size)} — too large. ` +
        `Maximum allowed size is ${MAX_FILE_LABEL}.`
      )
      return
    }
    setSizeErr('')
    onFile(f)
  }, [onFile])

  const onDrop = useCallback(e => {
    e.preventDefault(); setDrag(false)
    checkAndLoad(e.dataTransfer.files[0])
  }, [checkAndLoad])

  return (
    <div className={`um-dropzone ${drag?'drag':''}`}
      onDragOver={e=>{e.preventDefault();setDrag(true)}}
      onDragLeave={()=>setDrag(false)}
      onDrop={onDrop}
      onClick={() => ref.current?.click()}
    >
      <motion.div className="um-dz-icon" animate={{y: drag?-10:0}} transition={{type:'spring',stiffness:300,damping:20}}>
        <UploadBigIcon />
      </motion.div>
      <p className="um-dz-title">Drag and drop video files to upload</p>
      <p className="um-dz-sub">Your videos will be private until you publish them</p>
      <motion.button className="um-dz-btn"
        onClick={e=>{e.stopPropagation();ref.current?.click()}}
        whileHover={{scale:1.04}} whileTap={{scale:0.96}}
      >Select files</motion.button>
      <p className="um-dz-hint">MP4, MOV, AVI, MKV, WebM · Max {MAX_FILE_LABEL}</p>
      {sizeErr && (
        <p className="um-dz-size-err">⚠ {sizeErr}</p>
      )}
      <input ref={ref} type="file" accept="video/*" style={{display:'none'}}
        onChange={e=>{ checkAndLoad(e.target.files[0]) }} />
    </div>
  )
}

// ── UPLOAD PROGRESS OVERLAY ───────────────────────────────────────────────────
function UploadProgress({ progress, filename, statusMsg }) {
  return (
    <div className="um-upload-progress">
      <div className="um-up-icon"><UploadBigIcon /></div>
      <p className="um-up-title">{statusMsg || 'Uploading to AURA...'}</p>
      <p className="um-up-file">{filename}</p>
      <div className="um-up-bar-wrap">
        <motion.div className="um-up-bar" initial={{width:0}} animate={{width:`${progress}%`}} transition={{ease:'linear'}} />
      </div>
      <p className="um-up-pct">{progress}%</p>
      <p className="um-up-hint">Please keep this window open</p>
    </div>
  )
}

// ── MAIN UPLOAD MODAL ─────────────────────────────────────────────────────────
export default function UploadModal({ onClose }) {
  const navigate = useNavigate()
  const { categories, categoryDocs, addCategory, addSubCategory } = useCategoryList()
  // -1=dropzone  'x'=extracting  'pick'=thumb picker  0-3=steps  'up'=uploading
  const [step,           setStep]           = useState(-1)
  const [uploading,      setUploading]      = useState(false)
  const [uploadPct,      setUploadPct]      = useState(0)
  const [statusMsg,      setStatusMsg]      = useState('Uploading...')
  const [error,          setError]          = useState('')
  const [frames,         setFrames]         = useState([])
  const [isShortVideo,   setIsShortVideo]   = useState(false)
  const [selectedThumbIdx, setSelectedThumbIdx] = useState(0)
  const [customThumbFile,  setCustomThumbFile]  = useState(null)
  const [customThumbPrev,  setCustomThumbPrev]  = useState(null)

  const [form, setForm] = useState({
    file: null, title: '', description: '',
    tags: [], category: '', subCategory: '', madeForKids: 'no',
    visibility: 'private',
  })

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const onFile = async (file) => {
    // Guard — should already be caught by Dropzone, but double-check here
    if (file.size > MAX_FILE_BYTES) {
      setError(
        `"${file.name}" is ${formatBytes(file.size)}. ` +
        `Maximum allowed size is ${MAX_FILE_LABEL}. Please compress your video and try again.`
      )
      return
    }
    set('file', file)
    set('title', file.name.replace(/\.[^/.]+$/, ''))
    setStep('x')                          // show extracting screen
    const { frames: extracted, isShort } = await extractFrames(file)
    setFrames(extracted)
    setIsShortVideo(isShort)
    setSelectedThumbIdx(extracted.length > 0 ? 0 : 'custom')
    setStep(0)  // go straight to Details
  }

  const handleCustomThumb = (file) => {
    setCustomThumbFile(file)
    setCustomThumbPrev(URL.createObjectURL(file))
    setSelectedThumbIdx('custom')
  }

  const getThumbFile = () => {
    if (selectedThumbIdx === 'custom' && customThumbFile) return customThumbFile
    if (typeof selectedThumbIdx === 'number' && frames[selectedThumbIdx])
      return dataURLtoFile(frames[selectedThumbIdx], `thumb_${selectedThumbIdx}.jpg`)
    return null
  }

  // Poll server until FFmpeg finishes
  const pollStatus = (videoId) => new Promise((resolve, reject) => {
    const iv = setInterval(async () => {
      try {
        const r = await api.get(`/videos/${videoId}/status`)
        const { status, progress, qualities } = r.data
        if (status === 'published') {
          setUploadPct(100)
          setStatusMsg(`Done! ${qualities?.length || 1} quality variants ready`)
          clearInterval(iv); resolve(videoId)
        } else if (status === 'rejected') {
          clearInterval(iv); reject(new Error('Processing failed on server'))
        } else {
          setUploadPct(50 + Math.round((progress || 0) / 2))
          setStatusMsg(`Processing... ${progress || 0}%`)
        }
      } catch (e) { clearInterval(iv); reject(e) }
    }, 2000)
  })

  const handleSave = async () => {
    if (!form.file)         return setError('No video file selected')
    if (!form.title.trim()) return setError('Title is required')
    if (form.file.size > MAX_FILE_BYTES)
      return setError(
        `File is ${formatBytes(form.file.size)} — exceeds the ${MAX_FILE_LABEL} limit. ` +
        `Please compress your video or use a shorter clip.`
      )

    setUploading(true)
    setError('')
    setUploadPct(0)
    setStatusMsg('Uploading...')

    try {
      const fd = new FormData()
      fd.append('video',       form.file)
      fd.append('title',       form.title.trim())
      fd.append('description', form.description)
      fd.append('tags',        JSON.stringify(form.tags))
      fd.append('category',    form.category || 'General')
      if (form.subCategory) fd.append('subCategory', form.subCategory)
      fd.append('madeForKids', form.madeForKids)
      fd.append('visibility',  form.visibility)
      const thumbFile = getThumbFile()
      if (thumbFile) fd.append('thumbnail', thumbFile)

      const res = await api.post('/videos/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: e => {
          const pct = Math.round((e.loaded / e.total) * 50)
          setUploadPct(pct)
          setStatusMsg(`Uploading... ${pct * 2}%`)
        },
      })

      const videoId = res.data.videoId
      if (!videoId) throw new Error('Server did not return a videoId')
      setStatusMsg('Processing with FFmpeg...')
      await pollStatus(videoId)
      setTimeout(() => { onClose(); navigate(`/watch/${videoId}`) }, 900)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Upload failed.')
      setUploading(false)
    }
  }

  const content = (
    <motion.div
      className="um-backdrop"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onMouseDown={e => { if (e.target === e.currentTarget && !uploading) onClose() }}
    >
      <motion.div
        className={`um-modal ${step === -1 || step === 'x' ? 'um-modal-sm' : ''}`}
        initial={{ opacity: 0, scale: 0.94, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 30 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="um-header">
          <div className="um-header-left">
            <h2 className="um-header-title">
              {step === -1 ? 'Upload video'
                : step === 'x' ? 'Analysing...'
                : (form.title || 'Untitled video')}
            </h2>
            {typeof step === 'number' && step >= 0 && !uploading && <span className="um-saved-badge">Saved as private</span>}
          </div>
          {!uploading && step !== 'x' && step !== -1 || step === -1 ? (!uploading && <button className="um-close" onClick={onClose}><CloseIcon /></button>) : null}
        </div>

        {/* Step bar */}
        {typeof step === 'number' && step >= 0 && !uploading && <StepBar current={step} />}

        {/* Body */}
        <div className="um-body">
          {uploading ? (
            <UploadProgress progress={uploadPct} filename={form.file?.name} statusMsg={statusMsg} />
          ) : step === 'x' ? (
            <ExtractingScreen filename={form.file?.name} />
          ) : (
            <AnimatePresence mode="wait">
              {step === -1 && <motion.div key="dz" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><Dropzone onFile={onFile} /></motion.div>}
              {step === 0  && <motion.div key="d"  initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.18}}><StepDetails data={form} onChange={set} frames={frames} isShort={isShortVideo} selectedThumbIdx={selectedThumbIdx} onThumbSelect={setSelectedThumbIdx} onCustomThumb={handleCustomThumb} customThumbPreview={customThumbPrev} categories={categories} categoryDocs={categoryDocs} addCategory={addCategory} addSubCategory={addSubCategory} /></motion.div>}
              {step === 1  && <motion.div key="e"  initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.18}}><StepElements /></motion.div>}
              {step === 2  && <motion.div key="c"  initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.18}}><StepChecks /></motion.div>}
              {step === 3  && <motion.div key="v"  initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.18}}><StepVisibility data={form} onChange={set} /></motion.div>}
            </AnimatePresence>
          )}
        </div>

        {/* Error */}
        {error && <p className="um-error">{error}</p>}

        {/* Footer */}
        {typeof step === 'number' && step >= 0 && !uploading && (
          <div className="um-footer">
            <span className="um-footer-file">{form.file?.name || ''}</span>
            <div className="um-footer-btns">
              {step > 0 && <motion.button className="um-btn-back" onClick={() => setStep(s=>s-1)} whileHover={{scale:1.03}} whileTap={{scale:0.97}}>Back</motion.button>}
              {step < 3
                ? <motion.button className="um-btn-next" onClick={() => setStep(s=>s+1)} whileHover={{scale:1.03}} whileTap={{scale:0.97}}>Next</motion.button>
                : <motion.button className="um-btn-save" onClick={handleSave} whileHover={{scale:1.03}} whileTap={{scale:0.97}}>Publish</motion.button>
              }
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )

  return createPortal(content, document.body)
}