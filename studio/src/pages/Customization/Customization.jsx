// studio/src/pages/Customization/Customization.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useStudioAuth } from '../../context/StudioAuthContext'
import api from '../../services/api'
import './Customization.css'

// ── Icons ──────────────────────────────────────────────────────────────────
const CamIco     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
const ImgIco     = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
const CheckIco   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
const SpinIco    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="cz-spin"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
const TrashIco   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
const PlusIco    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const InfoIco    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
const GlobeIco   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
const AtIco      = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 006 0v-1a10 10 0 10-3.92 7.94"/></svg>
const PinIco     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
const LinkIco    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
const VerifyIco  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--sn-teal)" stroke="none"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>

const TABS = [
  { id:'branding', label:'Branding' },
  { id:'basic',    label:'Basic info' },
  { id:'links',    label:'Links' },
]

// ── Image uploader ─────────────────────────────────────────────────────────
function ImageUploader({ label, hint, current, shape, uploading, onUpload, onRemove }) {
  const ref = useRef()
  const [drag, setDrag] = useState(false)

  const handle = f => { if (f && f.type.startsWith('image/')) onUpload(f) }

  return (
    <div className="cz-img-block">
      <div className="cz-img-hdr">
        <label className="cz-label">{label}</label>
        {current && !uploading && (
          <button className="cz-remove-btn" onClick={onRemove}><TrashIco /> Remove</button>
        )}
      </div>
      {hint && <p className="cz-hint">{hint}</p>}
      <div
        className={`cz-drop ${shape} ${drag ? 'drag' : ''} ${current ? 'filled' : ''}`}
        onClick={() => ref.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files[0]) }}
      >
        {current ? (
          <>
            <img src={current} alt={label} className={`cz-drop-img ${shape}`} />
            <div className="cz-drop-overlay">
              {uploading ? <><SpinIco /><span>Uploading...</span></> : <><CamIco /><span>Change</span></>}
            </div>
          </>
        ) : (
          <div className="cz-drop-empty">
            {uploading ? <><SpinIco /><span>Uploading...</span></> : <><ImgIco /><span>Click or drag to upload</span></>}
          </div>
        )}
        <input ref={ref} type="file" accept="image/*" hidden onChange={e => handle(e.target.files?.[0])} />
      </div>
    </div>
  )
}

// ── Links editor ───────────────────────────────────────────────────────────
function LinksEditor({ links, onChange }) {
  const add    = () => links.length < 5 && onChange([...links, { label:'', url:'' }])
  const update = (i, k, v) => onChange(links.map((l,idx) => idx===i ? {...l,[k]:v} : l))
  const remove = i => onChange(links.filter((_,idx) => idx!==i))

  return (
    <div className="cz-links">
      {links.map((l, i) => (
        <div key={i} className="cz-link-row">
          <input className="cz-input cz-link-label" placeholder="Label (e.g. Twitter)"
            value={l.label} onChange={e => update(i,'label',e.target.value)} maxLength={30} />
          <input className="cz-input cz-link-url" placeholder="https://..."
            value={l.url} onChange={e => update(i,'url',e.target.value)} maxLength={200} />
          <button className="cz-link-rm" onClick={() => remove(i)} title="Remove"><TrashIco /></button>
        </div>
      ))}
      {links.length < 5 && (
        <button className="cz-add-link" onClick={add}>
          <PlusIco /> Add link <span className="cz-link-counter">({links.length}/5)</span>
        </button>
      )}
    </div>
  )
}

// ── Channel preview ────────────────────────────────────────────────────────
function ChannelPreview({ form, avPrev, bnPrev }) {
  const banner = bnPrev || form.bannerImage
  const avatar = avPrev || form.avatar
  const name   = form.displayName || form.username || 'Your Channel'
  const fmtSubs = n => n >= 1000 ? `${(n/1000).toFixed(1)}K` : String(n||0)

  return (
    <div className="cz-preview">
      <p className="cz-preview-lbl">Channel preview</p>

      {/* Banner */}
      <div className="cz-preview-banner">
        {banner
          ? <img src={banner} alt="banner" />
          : <div className="cz-preview-banner-empty"><ImgIco /></div>
        }
      </div>

      {/* Avatar + info */}
      <div className="cz-preview-av-row">
        <div className="cz-preview-av-wrap">
          {avatar
            ? <img src={avatar} alt={name} className="cz-preview-av" />
            : <div className="cz-preview-av-fb">{name[0].toUpperCase()}</div>
          }
          {form.isChannelVerified && (
            <span className="cz-preview-verify"><VerifyIco /></span>
          )}
        </div>
        <div className="cz-preview-meta">
          <div className="cz-preview-name">{name}</div>
          <div className="cz-preview-handle">@{form.handle || form.username || 'handle'}</div>
          <div className="cz-preview-subs">{fmtSubs(form.subscriberCount)} subscribers</div>
        </div>
      </div>

      {form.bio && <p className="cz-preview-bio">{form.bio.slice(0,120)}{form.bio.length>120?'…':''}</p>}
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function Customization() {
  const { user, setUser } = useStudioAuth()

  const [tab,    setTab]    = useState('branding')
  const [form,   setForm]   = useState({
    displayName:'', username:'', bio:'', handle:'', website:'', location:'',
    avatar:'', bannerImage:'', subscriberCount:0, videoCount:0,
    totalViews:0, isChannelVerified:false, links:[],
  })
  const [avPrev,    setAvPrev]    = useState('')
  const [bnPrev,    setBnPrev]    = useState('')
  const [upAv,      setUpAv]      = useState(false)
  const [upBn,      setUpBn]      = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [loading,   setLoading]   = useState(true)
  const [errors,    setErrors]    = useState({})
  const [errMsg,    setErrMsg]    = useState('')

  // Load profile on mount
  useEffect(() => {
    api.get('/user/profile')
      .then(r => {
        const u = r.data.user || r.data
        setForm({
          displayName:       u.displayName       || '',
          username:          u.username          || '',
          bio:               u.bio               || '',
          handle:            u.handle            || '',
          website:           u.website           || '',
          location:          u.location          || '',
          avatar:            u.avatar            || '',
          bannerImage:       u.bannerImage       || '',
          subscriberCount:   u.subscriberCount   || 0,
          videoCount:        u.videoCount        || 0,
          totalViews:        u.totalViews        || 0,
          isChannelVerified: u.isChannelVerified || false,
          links:             u.links             || [],
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const set = (k, v) => { setForm(f => ({...f, [k]:v})); setErrors(e => ({...e, [k]:''})) }

  // ── Avatar upload ──
  const handleAvatar = useCallback(async file => {
    setAvPrev(URL.createObjectURL(file))
    setUpAv(true)
    try {
      const fd = new FormData(); fd.append('avatar', file)
      const res = await api.post('/upload/avatar', fd, { headers:{ 'Content-Type':'multipart/form-data' } })
      const url = res.data.avatar || res.data.user?.avatar
      setForm(f => ({...f, avatar: url}))
      if (setUser) setUser(prev => ({...prev, avatar: url}))
    } catch { setErrMsg('Avatar upload failed') }
    setUpAv(false)
  }, [setUser])

  // ── Banner upload ──
  const handleBanner = useCallback(async file => {
    setBnPrev(URL.createObjectURL(file))
    setUpBn(true)
    try {
      const fd = new FormData(); fd.append('banner', file)
      const res = await api.post('/upload/banner', fd, { headers:{ 'Content-Type':'multipart/form-data' } })
      const url = res.data.bannerImage || res.data.user?.bannerImage
      setForm(f => ({...f, bannerImage: url}))
    } catch { setErrMsg('Banner upload failed') }
    setUpBn(false)
  }, [])

  // ── Validate ──
  const validate = () => {
    const errs = {}
    if (!form.displayName?.trim()) errs.displayName = 'Channel name is required'
    if (form.displayName?.length > 60) errs.displayName = 'Max 60 characters'
    if (form.bio?.length > 500) errs.bio = 'Max 500 characters'
    if (form.handle && !/^[a-z0-9_]{3,30}$/.test(form.handle))
      errs.handle = '3–30 chars: lowercase letters, numbers, underscores only'
    if (form.website && !/^https?:\/\/.+/.test(form.website))
      errs.website = 'Must start with https://'
    form.links?.forEach((l,i) => {
      if (l.url && !/^https?:\/\/.+/.test(l.url)) errs[`link_${i}`] = `Link ${i+1}: must start with https://`
    })
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ── Save ──
  const handleSave = async () => {
    if (!validate()) return
    setSaving(true); setErrMsg('')
    try {
      const res = await api.patch('/user/profile', {
        displayName: form.displayName,
        bio:         form.bio,
        handle:      form.handle,
        website:     form.website,
        location:    form.location,
        links:       JSON.stringify(form.links||[]),
      })
      const updated = res.data.user
      if (updated && setUser) setUser(prev => ({...prev, ...updated}))
      setSaved(true); setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setErrMsg(err.response?.data?.message || 'Save failed. Try again.')
    }
    setSaving(false)
  }

  if (loading) return (
    <div className="cz-loading"><SpinIco /><span>Loading channel...</span></div>
  )

  return (
    <div className="cz-page st-page">

      {/* ── Header ── */}
      <div className="cz-header">
        <div>
          <h1 className="cz-title">Channel customization</h1>
          <p className="cz-sub">Manage how your channel appears to viewers on AURA</p>
        </div>
        <div className="cz-header-actions">
          {saved && (
            <span className="cz-saved-pill"><CheckIco /> Saved</span>
          )}
          <button className="cz-save-btn" onClick={handleSave} disabled={saving||upAv||upBn}>
            {saving ? <><SpinIco /> Saving...</> : <><CheckIco /> Save changes</>}
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {errMsg && (
        <div className="cz-error-bar">
          {errMsg}
          <button onClick={() => setErrMsg('')}>×</button>
        </div>
      )}

      {/* ── Body ── */}
      <div className="cz-body">

        {/* LEFT: tabs + form */}
        <div className="cz-main">
          <div className="cz-tabs">
            {TABS.map(t => (
              <button key={t.id} className={`cz-tab ${tab===t.id?'active':''}`} onClick={() => setTab(t.id)}>
                {t.label}
                {tab===t.id && <span className="cz-tab-line" />}
              </button>
            ))}
          </div>

          {/* ── BRANDING ── */}
          {tab==='branding' && (
            <div className="cz-panel">
              <ImageUploader
                label="Profile picture"
                hint="Recommended 256×256 px. Appears wherever your channel is shown."
                current={avPrev || form.avatar}
                shape="circle"
                uploading={upAv}
                onUpload={handleAvatar}
                onRemove={() => { setAvPrev(''); setForm(f => ({...f, avatar:''})) }}
              />

              <div className="cz-divider" />

              <ImageUploader
                label="Banner image"
                hint="Recommended 2560×1440 px. Appears at the top of your channel page."
                current={bnPrev || form.bannerImage}
                shape="banner"
                uploading={upBn}
                onUpload={handleBanner}
                onRemove={() => { setBnPrev(''); setForm(f => ({...f, bannerImage:''})) }}
              />

              <div className="cz-info-box">
                <InfoIco />
                <div>
                  <p className="cz-info-title">Images stored on Cloudinary</p>
                  <p className="cz-info-text">Images are uploaded instantly to Cloudinary. Old images are automatically removed when replaced.</p>
                </div>
              </div>
            </div>
          )}

          {/* ── BASIC INFO ── */}
          {tab==='basic' && (
            <div className="cz-panel">

              {/* Channel name */}
              <div className="cz-field">
                <label className="cz-label">Channel name <span className="cz-req">*</span></label>
                <div className="cz-rel">
                  <input className={`cz-input ${errors.displayName?'err':''}`}
                    maxLength={60} placeholder="Your channel name"
                    value={form.displayName} onChange={e => set('displayName', e.target.value)} />
                  <span className="cz-count">{form.displayName?.length||0}/60</span>
                </div>
                {errors.displayName && <p className="cz-field-err">{errors.displayName}</p>}
              </div>

              {/* Handle */}
              <div className="cz-field">
                <label className="cz-label"><AtIco /> Handle</label>
                <p className="cz-hint">Unique to your channel. Letters, numbers, underscores only.</p>
                <div className="cz-handle-wrap">
                  <span className="cz-at">@</span>
                  <input className={`cz-input cz-handle-input ${errors.handle?'err':''}`}
                    maxLength={30} placeholder="yourhandle"
                    value={form.handle}
                    onChange={e => set('handle', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,''))} />
                  <span className="cz-count-inline">{form.handle?.length||0}/30</span>
                </div>
                {errors.handle && <p className="cz-field-err">{errors.handle}</p>}
              </div>

              {/* Description */}
              <div className="cz-field">
                <label className="cz-label">Description</label>
                <p className="cz-hint">Appears in your About section and search results.</p>
                <div className="cz-rel">
                  <textarea className={`cz-textarea ${errors.bio?'err':''}`}
                    rows={5} maxLength={500} placeholder="Tell viewers about your channel..."
                    value={form.bio} onChange={e => set('bio', e.target.value)} />
                  <span className="cz-count">{form.bio?.length||0}/500</span>
                </div>
                {errors.bio && <p className="cz-field-err">{errors.bio}</p>}
              </div>

              {/* Location */}
              <div className="cz-field">
                <label className="cz-label"><PinIco /> Location</label>
                <input className="cz-input" maxLength={80} placeholder="e.g. Mumbai, India"
                  value={form.location} onChange={e => set('location', e.target.value)} />
              </div>

              {/* Website */}
              <div className="cz-field">
                <label className="cz-label"><GlobeIco /> Website</label>
                <input className={`cz-input ${errors.website?'err':''}`}
                  maxLength={200} placeholder="https://yourwebsite.com"
                  value={form.website} onChange={e => set('website', e.target.value)} />
                {errors.website && <p className="cz-field-err">{errors.website}</p>}
              </div>

              {/* Username (read-only) */}
              <div className="cz-field cz-readonly-group">
                <label className="cz-label">Username</label>
                <p className="cz-hint">Used for login. Cannot be changed here.</p>
                <div className="cz-readonly">{form.username}<span className="cz-readonly-badge">Read-only</span></div>
              </div>
            </div>
          )}

          {/* ── LINKS ── */}
          {tab==='links' && (
            <div className="cz-panel">
              <div className="cz-field">
                <label className="cz-label"><LinkIco /> Channel links</label>
                <p className="cz-hint">Add up to 5 links shown on your channel page. All must start with https://</p>
                <LinksEditor links={form.links||[]} onChange={links => set('links', links)} />
                {Object.entries(errors).filter(([k])=>k.startsWith('link_')).map(([k,v])=>(
                  <p key={k} className="cz-field-err">{v}</p>
                ))}
              </div>
              <div className="cz-info-box">
                <InfoIco />
                <div>
                  <p className="cz-info-title">Visible on your channel page</p>
                  <p className="cz-info-text">These links appear publicly when viewers visit your AURA channel.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: preview + stats */}
        <div className="cz-right">
          <ChannelPreview form={form} avPrev={avPrev} bnPrev={bnPrev} />

          <div className="cz-stats-card">
            <p className="cz-stats-title">Channel stats</p>
            {[
              { label:'Subscribers', value:(form.subscriberCount||0).toLocaleString() },
              { label:'Videos',      value:(form.videoCount||0).toLocaleString() },
              { label:'Total views', value:(form.totalViews||0).toLocaleString() },
            ].map(s => (
              <div key={s.label} className="cz-stat-row">
                <span className="cz-stat-lbl">{s.label}</span>
                <span className="cz-stat-val">{s.value}</span>
              </div>
            ))}
            <div className="cz-stat-row">
              <span className="cz-stat-lbl">Status</span>
              <span className={`cz-status-badge ${form.isChannelVerified?'verified':'standard'}`}>
                {form.isChannelVerified ? <><VerifyIco /> Verified</> : 'Standard'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}