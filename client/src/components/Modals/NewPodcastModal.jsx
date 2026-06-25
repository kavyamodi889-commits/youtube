// FILE: client/src/components/Modals/NewPodcastModal.jsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import { createPortal } from 'react-dom'
import './NewPodcastModal.css'

const CloseIcon   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const PodcastIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>

const PODCAST_CATS = ['Technology','True Crime','Comedy','Education','Business','Health','Society & Culture','Science','Arts','Sports']

export default function NewPodcastModal({ onClose }) {
  const [title, setTitle] = useState('')
  const [desc,  setDesc]  = useState('')
  const [cat,   setCat]   = useState('')
  const [lang,  setLang]  = useState('English')

  const content = (
    <motion.div className="npd-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.2}}
      onMouseDown={e=>{ if(e.target===e.currentTarget) onClose() }}>
      <motion.div className="npd-modal"
        initial={{opacity:0,scale:0.93,y:24}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.93,y:24}}
        transition={{type:'spring',stiffness:360,damping:28}}
        onMouseDown={e=>e.stopPropagation()}>

        <div className="npd-header">
          <div className="npd-icon"><PodcastIcon /></div>
          <h2 className="npd-title">New podcast</h2>
          <button className="npd-close" onClick={onClose}><CloseIcon /></button>
        </div>

        <div className="npd-body">
          <p className="npd-intro">Create a podcast series. Episodes will be organised under this series.</p>
          <div className="npd-field">
            <label className="npd-label">Podcast title <span className="npd-req">*</span></label>
            <input className="npd-input" placeholder="Give your podcast a name" value={title} onChange={e=>setTitle(e.target.value)} autoFocus maxLength={80} />
          </div>
          <div className="npd-field">
            <label className="npd-label">Description</label>
            <textarea className="npd-textarea" placeholder="What is your podcast about?" value={desc} onChange={e=>setDesc(e.target.value)} rows={3} maxLength={500} />
          </div>
          <div className="npd-row">
            <div className="npd-field">
              <label className="npd-label">Category</label>
              <select className="npd-select" value={cat} onChange={e=>setCat(e.target.value)}>
                <option value="">Select category</option>
                {PODCAST_CATS.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="npd-field">
              <label className="npd-label">Language</label>
              <select className="npd-select" value={lang} onChange={e=>setLang(e.target.value)}>
                {['English','Hindi','Spanish','French','German','Japanese','Portuguese'].map(l=><option key={l}>{l}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="npd-footer">
          <button className="npd-cancel" onClick={onClose}>Cancel</button>
          <motion.button className="npd-create" disabled={!title.trim()} onClick={onClose} whileHover={{scale:1.04}} whileTap={{scale:0.96}}>
            Create podcast
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
  return createPortal(content, document.body)
}