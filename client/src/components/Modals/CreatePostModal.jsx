// FILE: client/src/components/Modals/CreatePostModal.jsx
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import './CreatePostModal.css'

const CloseIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const ImgIcon   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
const PollIcon  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
const VidIcon   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
const QuizIcon  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
const PlusIcon  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const TrashIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
const GlobeIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>

const TYPES = [
  { id:'text',       label:'Text',        icon:<PollIcon /> },
  { id:'image',      label:'Image',       icon:<ImgIcon /> },
  { id:'image_poll', label:'Image poll',  icon:<PollIcon /> },
  { id:'text_poll',  label:'Text poll',   icon:<PollIcon /> },
  { id:'video',      label:'Video',       icon:<VidIcon /> },
  { id:'quiz',       label:'Quiz',        icon:<QuizIcon /> },
]

export default function CreatePostModal({ onClose }) {
  const [type,    setType]    = useState('text')
  const [text,    setText]    = useState('')
  const [image,   setImage]   = useState(null)
  const [opts,    setOpts]    = useState(['',''])
  const [vis,     setVis]     = useState('public')
  const imgRef = useRef(null)

  const addOpt    = () => setOpts(p=>[...p,''])
  const removeOpt = i => setOpts(p=>p.filter((_,idx)=>idx!==i))
  const updateOpt = (i,v) => setOpts(p=>p.map((x,idx)=>idx===i?v:x))

  const showPoll = type==='text_poll'||type==='image_poll'||type==='quiz'
  const showImg  = type==='image'||type==='image_poll'

  const content = (
    <motion.div className="cp-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.2}}
      onMouseDown={e=>{ if(e.target===e.currentTarget) onClose() }}>
      <motion.div className="cp-modal"
        initial={{opacity:0,scale:0.93,y:24}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.93,y:24}}
        transition={{type:'spring',stiffness:360,damping:28}}
        onMouseDown={e=>e.stopPropagation()}>

        <div className="cp-header">
          <h2 className="cp-title">Create post</h2>
          <button className="cp-close" onClick={onClose}><CloseIcon /></button>
        </div>

        <div className="cp-channel-row">
          <div className="cp-avatar">A</div>
          <div>
            <p className="cp-name">Your Channel</p>
            <div className="cp-vis-row">
              <GlobeIcon />
              <select className="cp-vis-sel" value={vis} onChange={e=>setVis(e.target.value)}>
                <option value="public">Public</option>
                <option value="unlisted">Unlisted</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>
        </div>

        <div className="cp-type-tabs">
          {TYPES.map(t=>(
            <button key={t.id} className={`cp-type-tab ${type===t.id?'active':''}`} onClick={()=>setType(t.id)}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        <div className="cp-body">
          <textarea className="cp-text" placeholder="Post an update to your fans..." value={text} onChange={e=>setText(e.target.value)} rows={4} maxLength={5000} />
          {showImg && (
            <div className="cp-img-upload" onClick={()=>imgRef.current?.click()}>
              {image ? <img src={image} alt="post" className="cp-img-preview" />
                     : <div className="cp-img-ph"><ImgIcon /><span>Click to upload image</span></div>}
              <input ref={imgRef} type="file" accept="image/*" style={{display:'none'}}
                onChange={e=>{ const f=e.target.files[0]; if(f) setImage(URL.createObjectURL(f)) }} />
            </div>
          )}
          {showPoll && (
            <div className="cp-poll">
              <p className="cp-poll-label">{type==='quiz'?'Quiz options':'Poll options'}</p>
              {opts.map((o,i)=>(
                <div key={i} className="cp-poll-row">
                  <input className="cp-poll-input" placeholder={`Option ${i+1}`} value={o} onChange={e=>updateOpt(i,e.target.value)} />
                  {opts.length>2 && <button className="cp-poll-del" onClick={()=>removeOpt(i)}><TrashIcon /></button>}
                </div>
              ))}
              {opts.length<5 && <button className="cp-poll-add" onClick={addOpt}><PlusIcon /> Add option</button>}
            </div>
          )}
        </div>

        <div className="cp-footer">
          <span className="cp-char">{text.length}/5000</span>
          <div style={{display:'flex',gap:8}}>
            <button className="cp-btn-cancel" onClick={onClose}>Cancel</button>
            <motion.button className="cp-btn-post" disabled={!text.trim()} onClick={onClose} whileHover={{scale:1.04}} whileTap={{scale:0.96}}>Post</motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )

  return createPortal(content, document.body)
}