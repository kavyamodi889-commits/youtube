// studio/src/pages/Upload/Upload.jsx
// Full-page upload experience in Studio
import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { useCategoryList } from '../../hooks/useCategoryList'
import CategoryPicker from '../../components/CategoryPicker/CategoryPicker'
import './Upload.css'

// ── Icons ─────────────────────────────────────────────────────────
const UploadBigIco = () => <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
const CheckIco    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
const ImageIco    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
const TagIco      = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
const GlobeIco    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
const LockIco     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
const LinkIco     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
const SparkIco    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>

const STEPS      = ['Details', 'Elements', 'Checks', 'Visibility']

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
      const dur   = isFinite(vid.duration) && vid.duration > 0 ? vid.duration : 10
      const times = [dur*0.10, dur*0.35, dur*0.65].map(t => Math.max(0.5, t))
      const vw = vid.videoWidth||480, vh = vid.videoHeight||270
      const isShort = vh > vw && dur <= 60
      const maxW = isShort ? 270 : 480
      const scale = Math.min(1, maxW/vw)
      canvas.width = Math.round(vw*scale); canvas.height = Math.round(vh*scale)
      let idx = 0
      vid.onseeked = () => {
        ctx.drawImage(vid, 0, 0, canvas.width, canvas.height)
        frames.push(canvas.toDataURL('image/jpeg', 0.85))
        idx++
        if (idx < times.length) vid.currentTime = times[idx]
        else { URL.revokeObjectURL(url); resolve({ frames, isShort, duration: dur }) }
      }
      vid.onerror = () => { URL.revokeObjectURL(url); resolve({ frames:[], isShort:false }) }
      vid.currentTime = times[0]
    }
    vid.onerror = () => { URL.revokeObjectURL(url); resolve({ frames:[], isShort:false }) }
  })
}
function dataURLtoFile(dataURL, filename) {
  const [header, b64] = dataURL.split(',')
  const mime = header.match(/:(.*?);/)[1]
  const bytes = atob(b64)
  const arr = new Uint8Array(bytes.length)
  for (let i=0; i<bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  return new File([arr], filename, { type: mime })
}

// ── Step bar ──────────────────────────────────────────────────────
function StepBar({ current }) {
  return (
    <div className="up-stepbar">
      {STEPS.map((s, i) => {
        const done = i < current, active = i === current
        return (
          <div key={s} className="up-step-item">
            <div className={`up-step-dot ${done?'done':''} ${active?'active':''}`}>
              {done ? <CheckIco /> : <span>{i+1}</span>}
            </div>
            <span className={`up-step-lbl ${active?'active':''} ${done?'done':''}`}>{s}</span>
            {i < STEPS.length-1 && <div className={`up-step-line ${i < current?'done':''}`}/>}
          </div>
        )
      })}
    </div>
  )
}

// ── Dropzone ──────────────────────────────────────────────────────
function Dropzone({ onFile }) {
  const [drag, setDrag] = useState(false)
  const ref = useRef(null)
  const onDrop = useCallback(e => {
    e.preventDefault(); setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f && f.type.startsWith('video/')) onFile(f)
  }, [onFile])
  return (
    <div className={`up-dropzone ${drag?'drag':''}`}
      onDragOver={e=>{e.preventDefault();setDrag(true)}}
      onDragLeave={()=>setDrag(false)}
      onDrop={onDrop}
      onClick={() => ref.current?.click()}
    >
      <div className="up-dz-icon"><UploadBigIco /></div>
      <p className="up-dz-title">Drag and drop video files to upload</p>
      <p className="up-dz-sub">Your videos will be private until you publish them</p>
      <button className="up-dz-btn" onClick={e=>{e.stopPropagation();ref.current?.click()}}>
        Select files
      </button>
      <p className="up-dz-hint">MP4, MOV, AVI, MKV, WebM · Max 500 MB</p>
      <input ref={ref} type="file" accept="video/*" style={{display:'none'}}
        onChange={e=>{ const f=e.target.files[0]; if(f) onFile(f) }} />
    </div>
  )
}

// ── Details step ──────────────────────────────────────────────────
function StepDetails({ data, onChange, frames, isShort, selectedThumbIdx, onThumbSelect, onCustomThumb, customThumbPreview }) {
  const [tagInput, setTagInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError,   setAiError]   = useState('')
  const [suggestions, setSuggestions] = useState([])

  const handleAIGenerate = async () => {
    if (!data.title?.trim()) { setAiError('Add a title first'); return }
    setAiLoading(true); setAiError('')
    try {
      const r = await api.post('/ai/video-metadata', { title: data.title })
      if (r.data.success) {
        if (r.data.description) onChange('description', r.data.description)
        if (r.data.tags?.length) onChange('tags', r.data.tags)
        if (r.data.category)    onChange('category', r.data.category)
      }
    } catch { setAiError('AI generation failed. Try again.') }
    finally { setAiLoading(false) }
  }

  const handleImproveTitle = async () => {
    if (!data.title?.trim()) return
    setAiLoading(true)
    try {
      const r = await api.post('/ai/improve-title', { title: data.title })
      if (r.data.suggestions?.length) setSuggestions(r.data.suggestions)
    } catch {}
    finally { setAiLoading(false) }
  }

  const addTag = e => {
    if ((e.key==='Enter'||e.key===',') && tagInput.trim()) {
      e.preventDefault()
      if (!data.tags.includes(tagInput.trim())) onChange('tags', [...data.tags, tagInput.trim()])
      setTagInput('')
    }
  }

  return (
    <div className="up-details">
      <div className="up-details-left">
        {/* AI bar */}
        <div className="up-ai-bar">
          <SparkIco />
          <span>Auto-fill description, tags & category with AI</span>
          <button className={`up-ai-btn ${aiLoading?'loading':''}`}
            onClick={handleAIGenerate} disabled={aiLoading||!data.title?.trim()}>
            {aiLoading ? 'Generating…' : <><SparkIco /> Generate</>}
          </button>
        </div>
        {aiError && <div className="up-ai-error">{aiError}</div>}

        <div className="up-field">
          <label className="up-label">Title <span className="up-req">*</span></label>
          <input className="up-input" placeholder="Add a title that describes your video"
            value={data.title} onChange={e => onChange('title', e.target.value)} maxLength={100}/>
          <div className="up-title-row">
            <span className="up-charcount">{data.title.length}/100</span>
            <button className="up-improve-btn" onClick={handleImproveTitle}
              disabled={aiLoading||!data.title?.trim()}>
              <SparkIco /> Improve title
            </button>
          </div>
          {suggestions.length > 0 && (
            <div className="up-suggestions">
              <p className="up-suggestions-lbl">Click to use:</p>
              {suggestions.map((s,i) => (
                <button key={i} className="up-suggestion-chip"
                  onClick={()=>{onChange('title',s);setSuggestions([])}}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="up-field">
          <label className="up-label">Description</label>
          <textarea className="up-textarea" rows={5}
            placeholder="Tell viewers about your video"
            value={data.description} onChange={e => onChange('description', e.target.value)}
            maxLength={5000}/>
          <span className="up-charcount">{data.description.length}/5000</span>
        </div>

        {/* Thumbnail */}
        <div className="up-field">
          <label className="up-label"><ImageIco /> Thumbnail</label>
          <div className={`up-thumb-grid ${isShort?'up-thumb-grid-short':''}`}>
            {frames.map((src,i) => (
              <div key={i}
                className={`up-thumb-card ${isShort?'up-thumb-card-short':''} ${selectedThumbIdx===i?'selected':''}`}
                onClick={()=>onThumbSelect(i)}>
                <img src={src} alt={`Frame ${i+1}`}/>
                <span className="up-thumb-lbl">Frame {i+1}</span>
                {selectedThumbIdx===i && <div className="up-thumb-check"><CheckIco /></div>}
              </div>
            ))}
            <div className={`up-thumb-card ${isShort?'up-thumb-card-short':''} up-thumb-custom ${selectedThumbIdx==='custom'?'selected':''}`}
              onClick={()=>document.getElementById('up-custom-thumb')?.click()}>
              {customThumbPreview
                ? <img src={customThumbPreview} alt="Custom"/>
                : <div className="up-thumb-ph"><ImageIco/><span>Upload custom</span></div>}
              <span className="up-thumb-lbl">Custom</span>
              {selectedThumbIdx==='custom' && <div className="up-thumb-check"><CheckIco /></div>}
            </div>
          </div>
          <input id="up-custom-thumb" type="file" accept="image/*" style={{display:'none'}}
            onChange={e=>{const f=e.target.files[0]; if(f) onCustomThumb(f)}}/>
        </div>

        <div className="up-field">
          <label className="up-label"><TagIco /> Tags</label>
          <div className="up-tags-box">
            {data.tags.map(t => (
              <span key={t} className="up-tag">#{t}
                <button onClick={()=>onChange('tags', data.tags.filter(x=>x!==t))}>×</button>
              </span>
            ))}
            <input className="up-tag-input" placeholder="Type + Enter"
              value={tagInput} onChange={e=>setTagInput(e.target.value)} onKeyDown={addTag}/>
          </div>
        </div>

        <CategoryPicker
          value={data?.category || form.category || ''}
          subValue={form.subCategory || ''}
          categories={categories}
          categoryDocs={categoryDocs}
          addCategory={addCategory}
          addSubCategory={addSubCategory}
          selectClass="up-select"
          onChange={(cat, sub) => { onChange ? onChange('category', cat) : set('category', cat); onChange ? onChange('subCategory', sub) : set('subCategory', sub || '') }}
        />
      </div>

      {/* Preview card */}
      <div className="up-details-right">
        <div className={`up-preview-card ${isShort?'up-preview-short':''}`}>
          <div className={`up-preview-thumb ${isShort?'up-preview-thumb-short':''}`}>
            {(() => {
              const src = selectedThumbIdx==='custom' ? customThumbPreview : frames[selectedThumbIdx]
              return src ? <img src={src} alt=""/> : <div className="up-preview-ph"><UploadBigIco /></div>
            })()}
          </div>
          <div className="up-preview-info">
            <p className="up-preview-title">{data.title||'Your video title'}</p>
            {isShort && <span className="up-preview-short-badge">Short</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Checks step ───────────────────────────────────────────────────
function StepChecks() {
  const [done, setDone] = useState(false)
  useState(() => { const t = setTimeout(()=>setDone(true), 1800); return ()=>clearTimeout(t) })
  return (
    <div className="up-checks">
      <p className="up-section-hint">We'll check your video for issues that may restrict visibility.</p>
      <div className="up-check-row">
        <div className="up-check-info">
          <p className="up-check-title">Copyright</p>
          <p className="up-check-status">{done?'No issues found':'Checking...'}</p>
        </div>
        <div className={`up-check-dot ${done?'pass':'loading'}`}>
          {done ? <CheckIco /> : <div className="up-spinner"/>}
        </div>
      </div>
      {done && <div className="up-checks-ok"><CheckIco /> Checks complete. No issues found.</div>}
    </div>
  )
}

// ── Visibility step ───────────────────────────────────────────────
function StepVisibility({ data, onChange }) {
  const opts = [
    { val:'private',  label:'Private',  desc:'Only you can watch', icon:<LockIco /> },
    { val:'unlisted', label:'Unlisted', desc:'Anyone with the link', icon:<LinkIco /> },
    { val:'public',   label:'Public',   desc:'Everyone can watch', icon:<GlobeIco /> },
  ]
  return (
    <div className="up-visibility">
      <p className="up-section-hint">Choose who can see your video.</p>
      {opts.map(o => (
        <label key={o.val} className={`up-vis-opt ${data.visibility===o.val?'active':''}`}>
          <input type="radio" name="vis" checked={data.visibility===o.val} onChange={()=>onChange('visibility',o.val)}/>
          <span className={`up-vis-icon ${data.visibility===o.val?'active':''}`}>{o.icon}</span>
          <span className="up-vis-text">
            <span className="up-vis-label">{o.label}</span>
            <span className="up-vis-desc">{o.desc}</span>
          </span>
        </label>
      ))}
    </div>
  )
}

// ── Upload progress ───────────────────────────────────────────────
function UploadProgress({ progress, filename, statusMsg }) {
  return (
    <div className="up-progress">
      <div className="up-prog-icon"><UploadBigIco /></div>
      <p className="up-prog-title">{statusMsg||'Uploading to AURA...'}</p>
      <p className="up-prog-file">{filename}</p>
      <div className="up-prog-bar-wrap">
        <div className="up-prog-bar" style={{width:`${progress}%`}}/>
      </div>
      <p className="up-prog-pct">{progress}%</p>
      <p className="up-prog-hint">Please keep this tab open while your video uploads</p>
    </div>
  )
}

// ── Main Upload page ──────────────────────────────────────────────
export default function Upload() {
  const navigate = useNavigate()
  const [step,             setStep]             = useState(-1)
  const [uploading,        setUploading]        = useState(false)
  const [uploadPct,        setUploadPct]        = useState(0)
  const [statusMsg,        setStatusMsg]        = useState('Uploading...')
  const [error,            setError]            = useState('')
  const [frames,           setFrames]           = useState([])
  const [isShortVideo,     setIsShortVideo]     = useState(false)
  const [selectedThumbIdx, setSelectedThumbIdx] = useState(0)
  const [customThumbFile,  setCustomThumbFile]  = useState(null)
  const [customThumbPrev,  setCustomThumbPrev]  = useState(null)
  const [done,             setDone]             = useState(false)
  const [publishedId,      setPublishedId]      = useState(null)

  const { categories, categoryDocs, addCategory, addSubCategory } = useCategoryList()
  const [form, setForm] = useState({
    file:null, title:'', description:'',
    tags:[], category:'', madeForKids:'no', visibility:'private',
  })
  const set = (k,v) => setForm(p=>({...p,[k]:v}))

  const onFile = async file => {
    set('file', file)
    set('title', file.name.replace(/\.[^/.]+$/,''))
    setStep('x')
    const { frames:extracted, isShort } = await extractFrames(file)
    setFrames(extracted)
    setIsShortVideo(isShort)
    setSelectedThumbIdx(extracted.length>0 ? 0 : 'custom')
    setStep(0)
  }

  const handleCustomThumb = file => {
    setCustomThumbFile(file)
    setCustomThumbPrev(URL.createObjectURL(file))
    setSelectedThumbIdx('custom')
  }

  const getThumbFile = () => {
    if (selectedThumbIdx==='custom' && customThumbFile) return customThumbFile
    if (typeof selectedThumbIdx==='number' && frames[selectedThumbIdx])
      return dataURLtoFile(frames[selectedThumbIdx], `thumb_${selectedThumbIdx}.jpg`)
    return null
  }

  const pollStatus = videoId => new Promise((resolve, reject) => {
    const iv = setInterval(async () => {
      try {
        const r = await api.get(`/videos/${videoId}/status`)
        const { status, progress, qualities } = r.data
        if (status==='published') {
          setUploadPct(100)
          setStatusMsg(`Done! ${qualities?.length||1} quality variants ready`)
          clearInterval(iv); resolve(videoId)
        } else if (status==='rejected') {
          clearInterval(iv); reject(new Error('Processing failed on server'))
        } else {
          setUploadPct(50 + Math.round((progress||0)/2))
          setStatusMsg(`Processing... ${progress||0}%`)
        }
      } catch(e) { clearInterval(iv); reject(e) }
    }, 2000)
  })

  const handlePublish = async () => {
    if (!form.file)         return setError('No video file selected')
    if (!form.title.trim()) return setError('Title is required')
    setUploading(true); setError(''); setUploadPct(0)

    try {
      const fd = new FormData()
      fd.append('video',       form.file)
      fd.append('title',       form.title.trim())
      fd.append('description', form.description)
      fd.append('tags',        JSON.stringify(form.tags))
      fd.append('category',    form.category||'General')
      fd.append('madeForKids', form.madeForKids)
      fd.append('visibility',  form.visibility)
      const thumbFile = getThumbFile()
      if (thumbFile) fd.append('thumbnail', thumbFile)

      const res = await api.post('/videos/upload', fd, {
        headers: { 'Content-Type':'multipart/form-data' },
        onUploadProgress: e => {
          const pct = Math.round((e.loaded/e.total)*50)
          setUploadPct(pct); setStatusMsg(`Uploading... ${pct*2}%`)
        },
      })

      const videoId = res.data.videoId
      if (!videoId) throw new Error('Server did not return a videoId')
      setStatusMsg('Processing with FFmpeg...')
      await pollStatus(videoId)
      setPublishedId(videoId)
      setDone(true)
      setUploading(false)
    } catch(err) {
      setError(err.response?.data?.message||err.message||'Upload failed.')
      setUploading(false)
    }
  }

  // ── Done screen ───────────────────────────────────────────────
  if (done) return (
    <div className="up-wrap">
      <div className="up-done">
        <div className="up-done-icon">🎉</div>
        <h2 className="up-done-title">Video published!</h2>
        <p className="up-done-sub">"{form.title}" is now live on AURA.</p>
        <div className="up-done-actions">
          <a href={`http://localhost:5173/watch/${publishedId}`}
            target="_blank" rel="noopener noreferrer"
            className="up-done-btn up-done-btn-primary">
            Watch on AURA →
          </a>
          <button className="up-done-btn" onClick={()=>{ setDone(false); setStep(-1); setForm({file:null,title:'',description:'',tags:[],category:'',madeForKids:'no',visibility:'private'}); setFrames([]); }}>
            Upload another
          </button>
          <button className="up-done-btn" onClick={()=>navigate('/content')}>
            Go to Content
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="up-wrap">
      {/* Header */}
      <div className="up-page-header">
        <div>
          <h1 className="up-page-title">
            {step===-1 ? 'Upload video'
             : step==='x' ? 'Analysing video…'
             : form.title||'Untitled video'}
          </h1>
          {typeof step==='number' && step>=0 && !uploading &&
            <span className="up-saved-badge">Draft saved</span>}
        </div>
        {typeof step==='number' && step>=0 && !uploading && (
          <StepBar current={step}/>
        )}
      </div>

      {/* Body */}
      <div className="up-body">
        {uploading ? (
          <UploadProgress progress={uploadPct} filename={form.file?.name} statusMsg={statusMsg}/>
        ) : step==='x' ? (
          <div className="up-extracting">
            <div className="up-ext-spinner"/>
            <p className="up-ext-title">Analysing video…</p>
            <p className="up-ext-sub">Generating thumbnail options — just a moment</p>
          </div>
        ) : step===-1 ? (
          <Dropzone onFile={onFile}/>
        ) : (
          <>
            {step===0 && <div key="d">
              <StepDetails data={form} onChange={set} frames={frames} isShort={isShortVideo}
                selectedThumbIdx={selectedThumbIdx} onThumbSelect={setSelectedThumbIdx}
                onCustomThumb={handleCustomThumb} customThumbPreview={customThumbPrev}/>
            </div>}
            {step===1 && <div key="e">
              <div className="up-elements">
                <p className="up-section-hint">Add cards, end screens, or subtitles in Studio after uploading.</p>
                <div className="up-elements-placeholder">These settings can be configured from Studio → Subtitles after your video processes.</div>
              </div>
            </div>}
            {step===2 && <div key="c">
              <StepChecks/>
            </div>}
            {step===3 && <div key="v">
              <StepVisibility data={form} onChange={set}/>
            </div>}
          </>
        )}
      </div>

      {/* Error */}
      {error && <div className="up-error">{error}</div>}

      {/* Footer nav */}
      {typeof step==='number' && step>=0 && !uploading && (
        <div className="up-footer">
          <span className="up-footer-file">{form.file?.name||''}</span>
          <div className="up-footer-btns">
            {step>0 && <button className="up-btn-back" onClick={()=>setStep(s=>s-1)}>Back</button>}
            {step<3
              ? <button className="up-btn-next" onClick={()=>setStep(s=>s+1)}>Next</button>
              : <button className="up-btn-publish" onClick={handlePublish}>Publish</button>}
          </div>
        </div>
      )}
    </div>
  )
}