// FILE: client/src/components/Modals/GoLiveModal.jsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { useCategoryList } from '../../hooks/useCategoryList'
import './GoLiveModal.css'

const CloseIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const LiveIcon   = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 010 8.49m-8.48-.01a6 6 0 010-8.49m11.31-2.82a10 10 0 010 14.14m-14.14 0a10 10 0 010-14.14"/></svg>
const CopyIcon   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
const CheckIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>

export default function GoLiveModal({ onClose }) {
  const navigate = useNavigate()
  const [title,    setTitle]    = useState('')
  const [category, setCategory] = useState('')
  const [vis,      setVis]      = useState('public')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [showNewCat, setShowNewCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [catSaving,  setCatSaving]  = useState(false)
  const { categories, addCategory } = useCategoryList()

  const handleAddNewCat = async () => {
    if (!newCatName.trim()) return
    setCatSaving(true)
    try {
      const saved = await addCategory(newCatName.trim())
      setCategory(saved)
      setNewCatName('')
      setShowNewCat(false)
    } catch {}
    finally { setCatSaving(false) }
  }

  // After creation — show OBS instructions
  const [streamInfo, setStreamInfo] = useState(null)
  const [copied,     setCopied]     = useState({ server: false, key: false })

  const handleGoLive = async () => {
    if (!title.trim()) return setError('Stream title is required')
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/live', {
        title:      title.trim(),
        category:   category || 'General',
        visibility: vis,
      })
      setStreamInfo(res.data.stream)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create stream')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text, field) => {
    await navigator.clipboard.writeText(text)
    setCopied(p => ({ ...p, [field]: true }))
    setTimeout(() => setCopied(p => ({ ...p, [field]: false })), 2000)
  }

  const goToStream = () => {
    onClose()
    navigate(`/live/${streamInfo._id}`)
  }

  const content = (
    <motion.div className="gl-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.2}}
      onMouseDown={e=>{ if(e.target===e.currentTarget && !streamInfo) onClose() }}>
      <motion.div className="gl-modal"
        initial={{opacity:0,scale:0.93,y:24}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.93,y:24}}
        transition={{type:'spring',stiffness:360,damping:28}}
        onMouseDown={e=>e.stopPropagation()}>

        <div className="gl-header">
          <h2 className="gl-title">{streamInfo ? 'Stream Created!' : 'Go live'}</h2>
          {!streamInfo && <button className="gl-close" onClick={onClose}><CloseIcon /></button>}
        </div>

        <div className="gl-body">
          {!streamInfo ? (
            /* ── SETUP FORM ── */
            <>
              <div className="gl-hero">
                <div className="gl-hero-ring" />
                <div className="gl-hero-icon"><LiveIcon /></div>
                <span className="gl-live-pill">LIVE</span>
              </div>

              <div className="gl-field">
                <label className="gl-label">Stream title</label>
                <input className="gl-input" placeholder="What are you streaming today?"
                  value={title} onChange={e=>setTitle(e.target.value)} autoFocus />
              </div>
              <div className="gl-field">
                <label className="gl-label">Category</label>
                <div className="um-cat-row">
                  <select className="gl-select" value={category} onChange={e=>setCategory(e.target.value)}>
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button type="button" className="um-cat-add-btn" onClick={() => setShowNewCat(v=>!v)}>+ New</button>
                </div>
                {showNewCat && (
                  <div className="um-cat-new-row" style={{marginTop:6}}>
                    <input className="um-input um-cat-input" placeholder="New category name…"
                      value={newCatName} onChange={e=>setNewCatName(e.target.value)}
                      onKeyDown={e=>e.key==='Enter'&&handleAddNewCat()} autoFocus />
                    <button type="button" className="um-cat-save-btn" onClick={handleAddNewCat} disabled={catSaving||!newCatName.trim()}>
                      {catSaving?'…':'Add'}
                    </button>
                    <button type="button" className="um-cat-cancel-btn" onClick={()=>setShowNewCat(false)}>✕</button>
                  </div>
                )}
              </div>
              <div className="gl-field">
                <label className="gl-label">Visibility</label>
                <div className="gl-vis-row">
                  {['public','unlisted','private'].map(v=>(
                    <button key={v} className={`gl-vis-btn ${vis===v?'active':''}`} onClick={()=>setVis(v)}>
                      {v.charAt(0).toUpperCase()+v.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              {error && <p className="gl-error">{error}</p>}
            </>
          ) : (
            /* ── OBS INSTRUCTIONS ── */
            <div className="gl-obs-instructions">
              <p className="gl-obs-intro">Open OBS Studio and go to <strong>Settings → Stream</strong></p>

              <div className="gl-obs-field">
                <label className="gl-obs-label">Service</label>
                <div className="gl-obs-value">Custom...</div>
              </div>

              <div className="gl-obs-field">
                <label className="gl-obs-label">Server (RTMP URL)</label>
                <div className="gl-obs-copy-row">
                  <code className="gl-obs-code">rtmp://localhost:1935/live</code>
                  <button className="gl-copy-btn" onClick={() => copyToClipboard('rtmp://localhost:1935/live', 'server')}>
                    {copied.server ? <CheckIcon /> : <CopyIcon />}
                  </button>
                </div>
              </div>

              <div className="gl-obs-field">
                <label className="gl-obs-label">Stream Key</label>
                <div className="gl-obs-copy-row">
                  <code className="gl-obs-code gl-obs-key">{streamInfo.streamKey}</code>
                  <button className="gl-copy-btn" onClick={() => copyToClipboard(streamInfo.streamKey, 'key')}>
                    {copied.key ? <CheckIcon /> : <CopyIcon />}
                  </button>
                </div>
              </div>

              <div className="gl-obs-steps">
                <p>1. Paste the Server URL and Stream Key into OBS</p>
                <p>2. Click <strong>Start Streaming</strong> in OBS</p>
                <p>3. Click <strong>Open Stream Page</strong> below to go live</p>
              </div>

              <p className="gl-obs-note">Keep this server running while streaming. Viewers watch at port 8888.</p>
            </div>
          )}
        </div>

        <div className="gl-footer">
          {!streamInfo ? (
            <>
              <button className="gl-cancel" onClick={onClose}>Cancel</button>
              <motion.button className="gl-go" disabled={!title.trim() || loading}
                onClick={handleGoLive} whileHover={{scale:1.04}} whileTap={{scale:0.96}}>
                {loading ? 'Creating...' : <><LiveIcon /> Go Live</>}
              </motion.button>
            </>
          ) : (
            <>
              <button className="gl-cancel" onClick={onClose}>Close</button>
              <motion.button className="gl-go" onClick={goToStream}
                whileHover={{scale:1.04}} whileTap={{scale:0.96}}>
                <LiveIcon /> Open Stream Page
              </motion.button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
  return createPortal(content, document.body)
}