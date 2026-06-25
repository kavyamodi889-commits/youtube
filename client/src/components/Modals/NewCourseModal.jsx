// FILE: client/src/components/Modals/NewCourseModal.jsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import { createPortal } from 'react-dom'
import './NewCourseModal.css'

const CloseIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const CourseIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>

const CATS   = ['Development','Design','Data Science','Marketing','Business','Music','Photography','Health & Fitness','Personal Development']
const LEVELS = ['Beginner','Intermediate','Advanced','All levels']

export default function NewCourseModal({ onClose }) {
  const [title, setTitle] = useState('')
  const [desc,  setDesc]  = useState('')
  const [cat,   setCat]   = useState('')
  const [level, setLevel] = useState('')
  const [price, setPrice] = useState('free')

  const content = (
    <motion.div className="nc-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.2}}
      onMouseDown={e=>{ if(e.target===e.currentTarget) onClose() }}>
      <motion.div className="nc-modal"
        initial={{opacity:0,scale:0.93,y:24}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.93,y:24}}
        transition={{type:'spring',stiffness:360,damping:28}}
        onMouseDown={e=>e.stopPropagation()}>

        <div className="nc-header">
          <div className="nc-icon"><CourseIcon /></div>
          <h2 className="nc-title">New course</h2>
          <button className="nc-close" onClick={onClose}><CloseIcon /></button>
        </div>

        <div className="nc-body">
          <p className="nc-intro">Create a structured learning experience for your audience.</p>
          <div className="nc-field">
            <label className="nc-label">Course title <span className="nc-req">*</span></label>
            <input className="nc-input" placeholder="What will students learn?" value={title} onChange={e=>setTitle(e.target.value)} autoFocus maxLength={80} />
          </div>
          <div className="nc-field">
            <label className="nc-label">Description</label>
            <textarea className="nc-textarea" placeholder="Describe what students will learn..." value={desc} onChange={e=>setDesc(e.target.value)} rows={3} maxLength={500} />
          </div>
          <div className="nc-row">
            <div className="nc-field">
              <label className="nc-label">Category</label>
              <select className="nc-select" value={cat} onChange={e=>setCat(e.target.value)}>
                <option value="">Select category</option>
                {CATS.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="nc-field">
              <label className="nc-label">Level</label>
              <select className="nc-select" value={level} onChange={e=>setLevel(e.target.value)}>
                <option value="">Select level</option>
                {LEVELS.map(l=><option key={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <div className="nc-field">
            <label className="nc-label">Pricing</label>
            <div className="nc-price-row">
              {[{v:'free',l:'Free'},{v:'paid',l:'Paid'}].map(p=>(
                <button key={p.v} className={`nc-price-btn ${price===p.v?'active':''}`} onClick={()=>setPrice(p.v)}>
                  {p.l}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="nc-footer">
          <button className="nc-cancel" onClick={onClose}>Cancel</button>
          <motion.button className="nc-create" disabled={!title.trim()} onClick={onClose} whileHover={{scale:1.04}} whileTap={{scale:0.96}}>
            Create course
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
  return createPortal(content, document.body)
}