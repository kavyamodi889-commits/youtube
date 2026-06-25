// FILE: client/src/pages/SendFeedback/SendFeedback.jsx
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './SendFeedback.css'

// ── ICONS ──
const MsgIcon     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
const BugIcon     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 2l1.5 1.5"/><path d="M14.5 3.5L16 2"/><path d="M9 8h6"/><path d="M10 3.5C8 4 6 6.5 6 9v2a6 6 0 0012 0V9c0-2.5-2-5-4-5.5"/><path d="M6 13H2"/><path d="M22 13h-4"/><path d="M6 17l-2 2"/><path d="M18 17l2 2"/><path d="M6 9L4 7"/><path d="M18 9l2-2"/></svg>
const LightIcon   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
const HeartIcon   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
const StarIcon    = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
const PaperclipIcon=()=> <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
const XIcon       = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const SendIcon    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
const CheckIcon   = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
const ImgIcon     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
const ArrowIcon   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>

// ── FEEDBACK TYPES ──
const TYPES = [
  { id: 'general',     label: 'General Feedback', icon: <MsgIcon />,   color: 'type-rose',   desc: 'Share your overall experience' },
  { id: 'bug',         label: 'Bug Report',        icon: <BugIcon />,   color: 'type-red',    desc: 'Something is broken or wrong'  },
  { id: 'suggestion',  label: 'Feature Idea',      icon: <LightIcon />, color: 'type-gold',   desc: 'Suggest something new'         },
  { id: 'compliment',  label: 'Compliment',        icon: <HeartIcon />, color: 'type-teal',   desc: 'Tell us what you love'         },
]

const CATEGORIES = [
  'Video Playback', 'Chat & Rooms', 'Search', 'Homepage Feed',
  'Notifications', 'AURA Premium', 'AURA Music', 'Creator Tools',
  'Mobile App', 'Performance', 'Accessibility', 'Other',
]

const RECENT = [
  { id: 1, type: 'bug',        title: 'Video stutters at 4K on Safari',               date: '3 days ago',  status: 'received'    },
  { id: 2, type: 'suggestion', title: 'Dark mode scheduling would be amazing',         date: '1 week ago',  status: 'in_review'   },
  { id: 3, type: 'general',    title: 'AURA is genuinely the best platform I\'ve used',date: '2 weeks ago', status: 'appreciated' },
]

const STATUS_META = {
  received:    { label: 'Received',    color: 'st-received'   },
  in_review:   { label: 'In Review',   color: 'st-review'     },
  appreciated: { label: 'Appreciated', color: 'st-appreciate' },
}
const TYPE_COLOR = {
  general:    'type-rose',
  bug:        'type-red',
  suggestion: 'type-gold',
  compliment: 'type-teal',
}

// ── STAR RATING ──
function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="star-rating">
      {[1,2,3,4,5].map(n => (
        <motion.button
          key={n}
          className={`star-btn ${n <= (hovered || value) ? 'star-lit' : ''}`}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          whileTap={{ scale: 0.8 }}
          animate={{ scale: n <= (hovered || value) ? 1.15 : 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          <StarIcon />
        </motion.button>
      ))}
      <span className="star-label">
        {value === 0 && 'Rate your experience'}
        {value === 1 && 'Very dissatisfied 😞'}
        {value === 2 && 'Dissatisfied 😕'}
        {value === 3 && 'Neutral 😐'}
        {value === 4 && 'Satisfied 😊'}
        {value === 5 && 'Love it! 🤩'}
      </span>
    </div>
  )
}

// ── PAGE ──
export default function SendFeedback() {
  const [type, setType]           = useState('general')
  const [rating, setRating]       = useState(0)
  const [category, setCategory]   = useState('')
  const [title, setTitle]         = useState('')
  const [message, setMessage]     = useState('')
  const [email, setEmail]         = useState('')
  const [allowContact, setAllow]  = useState(true)
  const [attachments, setAttach]  = useState([])
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors]       = useState({})
  const fileRef = useRef()

  const MAX_CHARS = 1000

  const validate = () => {
    const e = {}
    if (!title.trim())   e.title   = 'Please add a title'
    if (!message.trim()) e.message = 'Please describe your feedback'
    if (message.length > MAX_CHARS) e.message = `Max ${MAX_CHARS} characters`
    if (allowContact && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = 'Enter a valid email'
    return e
  }

  const handleSubmit = () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setSubmitted(true)
  }

  const handleFile = (e) => {
    const files = Array.from(e.target.files)
    const valid = files.filter(f => f.size < 5 * 1024 * 1024)
    setAttach(prev => [...prev, ...valid.map(f => f.name)].slice(0, 3))
  }

  const removeAttach = (i) => setAttach(prev => prev.filter((_, idx) => idx !== i))

  const reset = () => {
    setType('general'); setRating(0); setCategory(''); setTitle('')
    setMessage(''); setEmail(''); setAllow(true); setAttach([])
    setErrors({}); setSubmitted(false)
  }

  if (submitted) {
    return (
      <div className="fb-page">
        <motion.div className="fb-success"
          initial={{ opacity: 0, scale: 0.88, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}>
          <div className="success-glow" />
          <motion.div className="success-check-wrap"
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 360, damping: 22, delay: 0.15 }}>
            <div className="success-check"><CheckIcon /></div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="success-title">Thank you for your feedback!</div>
            <div className="success-sub">
              We've received your {TYPES.find(t => t.id === type)?.label.toLowerCase()}.<br />
              {allowContact && email
                ? `We may follow up at ${email}.`
                : 'Your input helps make AURA better for everyone.'
              }
            </div>
            <div className="success-ref">
              Ref # <span className="success-ref-num">AURA-{Math.floor(100000 + Math.random() * 900000)}</span>
            </div>
            <motion.button className="success-btn" onClick={reset}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
              Send another <ArrowIcon />
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="fb-page">
      <div className="fb-layout">

        {/* ── LEFT: FORM ── */}
        <div className="fb-main">

          {/* Header */}
          <motion.div className="fb-header"
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}>
            <div className="fb-header-icon"><MsgIcon /></div>
            <div>
              <h1 className="fb-title">Send Feedback</h1>
              <p className="fb-subtitle">Your thoughts help shape the future of AURA.</p>
            </div>
          </motion.div>

          {/* ── STEP 1: Type ── */}
          <motion.div className="fb-section"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, type: 'spring', stiffness: 300, damping: 28 }}>
            <div className="fb-section-label">
              <span className="fb-step">01</span> What kind of feedback?
            </div>
            <div className="type-grid">
              {TYPES.map(t => (
                <motion.button
                  key={t.id}
                  className={`type-card ${t.color} ${type === t.id ? 'type-active' : ''}`}
                  onClick={() => setType(t.id)}
                  whileHover={{ y: -3 }} whileTap={{ scale: 0.96 }}>
                  <span className="type-icon">{t.icon}</span>
                  <span className="type-label">{t.label}</span>
                  <span className="type-desc">{t.desc}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* ── STEP 2: Rating ── */}
          <motion.div className="fb-section"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 28 }}>
            <div className="fb-section-label">
              <span className="fb-step">02</span> Overall experience
            </div>
            <StarRating value={rating} onChange={setRating} />
          </motion.div>

          {/* ── STEP 3: Category + Title ── */}
          <motion.div className="fb-section"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 28 }}>
            <div className="fb-section-label">
              <span className="fb-step">03</span> Details
            </div>

            {/* Category pills */}
            <div className="fb-field">
              <label className="fb-label">Area <span className="fb-optional">optional</span></label>
              <div className="cat-pills">
                {CATEGORIES.map(c => (
                  <motion.button key={c}
                    className={`cat-pill ${category === c ? 'cat-pill-active' : ''}`}
                    onClick={() => setCategory(category === c ? '' : c)}
                    whileHover={{ y: -2 }} whileTap={{ scale: 0.94 }}>
                    {c}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="fb-field">
              <label className="fb-label">
                Title <span className="fb-required">*</span>
              </label>
              <input
                className={`fb-input ${errors.title ? 'fb-input-err' : ''}`}
                placeholder="Give your feedback a short title..."
                value={title}
                onChange={e => { setTitle(e.target.value); setErrors(p => ({ ...p, title: '' })) }}
                maxLength={100}
              />
              {errors.title && <span className="fb-err-msg">{errors.title}</span>}
            </div>

            {/* Message */}
            <div className="fb-field">
              <label className="fb-label">
                Message <span className="fb-required">*</span>
                <span className={`fb-char-count ${message.length > MAX_CHARS * 0.9 ? 'char-warn' : ''}`}>
                  {message.length}/{MAX_CHARS}
                </span>
              </label>
              <textarea
                className={`fb-textarea ${errors.message ? 'fb-input-err' : ''}`}
                placeholder={
                  type === 'bug'
                    ? 'Describe the bug: what happened, what you expected, and steps to reproduce...'
                    : type === 'suggestion'
                    ? 'Describe your idea and how it would improve AURA...'
                    : type === 'compliment'
                    ? 'Tell us what you love about AURA...'
                    : 'Share your thoughts, ideas, or concerns...'
                }
                rows={5}
                value={message}
                onChange={e => { setMessage(e.target.value); setErrors(p => ({ ...p, message: '' })) }}
                maxLength={MAX_CHARS}
              />
              {errors.message && <span className="fb-err-msg">{errors.message}</span>}
            </div>

            {/* Attachments */}
            <div className="fb-field">
              <label className="fb-label">
                Attachments <span className="fb-optional">optional · max 3 files · 5MB each</span>
              </label>
              <div className="attach-row">
                <motion.button className="attach-btn"
                  onClick={() => fileRef.current?.click()}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}>
                  <PaperclipIcon /> Add file
                </motion.button>
                <motion.button className="attach-btn"
                  onClick={() => fileRef.current?.click()}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}>
                  <ImgIcon /> Add screenshot
                </motion.button>
                <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.txt"
                  style={{ display: 'none' }} onChange={handleFile} />
                <AnimatePresence>
                  {attachments.map((name, i) => (
                    <motion.div key={name + i} className="attach-chip"
                      initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}>
                      <PaperclipIcon />
                      <span>{name.length > 20 ? name.slice(0, 18) + '…' : name}</span>
                      <button className="attach-remove" onClick={() => removeAttach(i)}><XIcon /></button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* ── STEP 4: Contact ── */}
          <motion.div className="fb-section"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 28 }}>
            <div className="fb-section-label">
              <span className="fb-step">04</span> Follow-up
            </div>

            <label className="fb-toggle-row">
              <div className="fb-toggle-text">
                <span className="fb-toggle-label">Allow AURA to follow up with me</span>
                <span className="fb-toggle-sub">We may contact you about this feedback</span>
              </div>
              <div className={`toggle-switch ${allowContact ? 'toggle-on' : ''}`}
                onClick={() => setAllow(p => !p)}>
                <motion.div className="toggle-thumb"
                  animate={{ x: allowContact ? 20 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
              </div>
            </label>

            <AnimatePresence>
              {allowContact && (
                <motion.div
                  className="fb-field"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 340, damping: 32 }}>
                  <label className="fb-label">
                    Email <span className="fb-optional">optional</span>
                  </label>
                  <input
                    className={`fb-input ${errors.email ? 'fb-input-err' : ''}`}
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })) }}
                  />
                  {errors.email && <span className="fb-err-msg">{errors.email}</span>}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ── SUBMIT ── */}
          <motion.div className="fb-submit-row"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}>
            <motion.button className="fb-submit-btn"
              onClick={handleSubmit}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <SendIcon /> Send Feedback
            </motion.button>
            <p className="fb-privacy-note">
              By submitting, you agree to AURA's <a href="#">Privacy Policy</a>. Feedback is anonymous unless you provide your email.
            </p>
          </motion.div>
        </div>

        {/* ── RIGHT: SIDEBAR ── */}
        <div className="fb-sidebar">

          {/* Tips card */}
          <motion.div className="fb-tips-card"
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.12, type: 'spring', stiffness: 280, damping: 26 }}>
            <div className="tips-header">
              <LightIcon /> Tips for great feedback
            </div>
            <ul className="tips-list">
              <li>Be specific — describe exactly what happened</li>
              <li>Include steps to reproduce bugs</li>
              <li>Attach screenshots when possible</li>
              <li>One issue per report keeps things clear</li>
              <li>Tell us your device & browser for bugs</li>
            </ul>
          </motion.div>

          {/* Recent feedback */}
          <motion.div className="fb-recent-card"
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.18, type: 'spring', stiffness: 280, damping: 26 }}>
            <div className="recent-header">Your recent feedback</div>
            <div className="recent-list">
              {RECENT.map((r, i) => {
                const sm = STATUS_META[r.status]
                return (
                  <motion.div key={r.id} className="recent-item"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.07 }}>
                    <div className={`recent-type-dot ${TYPE_COLOR[r.type]}`} />
                    <div className="recent-info">
                      <div className="recent-title">{r.title}</div>
                      <div className="recent-meta">{r.date}</div>
                    </div>
                    <span className={`recent-status ${sm.color}`}>{sm.label}</span>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div className="fb-stats-card"
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.24, type: 'spring', stiffness: 280, damping: 26 }}>
            <div className="stats-row">
              <div className="stat-item">
                <span className="stat-num">24h</span>
                <span className="stat-label">Avg response</span>
              </div>
              <div className="stat-div" />
              <div className="stat-item">
                <span className="stat-num">94%</span>
                <span className="stat-label">Reviewed</span>
              </div>
              <div className="stat-div" />
              <div className="stat-item">
                <span className="stat-num">12K+</span>
                <span className="stat-label">Implemented</span>
              </div>
            </div>
            <div className="stats-note">Features built from user feedback this year</div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}