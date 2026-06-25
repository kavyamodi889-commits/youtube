// studio/src/pages/SendFeedback/SendFeedback.jsx
import { useState } from 'react'
import api from '../../services/api'
import { useStudioAuth } from '../../context/StudioAuthContext'
import './SendFeedback.css'

// ── Icons ─────────────────────────────────────────────────────────
const FeedbackIco = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
const BugIco      = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 2l1.5 1.5"/><path d="M14.5 3.5L16 2"/><path d="M9 8h6"/><path d="M10 3.5C8 4 6 6.5 6 9v2a6 6 0 0012 0V9c0-2.5-2-5-4-5.5"/><path d="M6 13H2"/><path d="M22 13h-4"/><path d="M6 17l-2 2"/><path d="M18 17l2 2"/><path d="M6 9L4 7"/><path d="M18 9l2-2"/></svg>
const LightIco    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
const HeartIco    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
const MsgIco      = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
const SendIco     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
const CheckIco    = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
const SpinIco     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="fb-spin"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
const StarIco     = ({ filled }) => <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>

const TYPES = [
  { id: 'bug',        label: 'Bug Report',     icon: <BugIco />,   desc: 'Something is broken or wrong' },
  { id: 'suggestion', label: 'Feature Idea',   icon: <LightIco />, desc: 'Suggest something new' },
  { id: 'general',    label: 'General',        icon: <MsgIco />,   desc: 'Share your experience' },
  { id: 'compliment', label: 'Compliment',     icon: <HeartIco />, desc: 'Tell us what you love' },
]

const CATEGORIES = [
  'Dashboard', 'Content Manager', 'Analytics', 'Comments', 'Monetisation',
  'Audio Library', 'Content Detection', 'Customization', 'Settings', 'Upload Flow', 'Other',
]

const RECENT = [
  { type: 'bug',        title: 'Analytics chart doesn\'t load on mobile', date: '3 days ago',  status: 'received' },
  { type: 'suggestion', title: 'Bulk edit visibility for multiple videos',  date: '1 week ago',  status: 'in_review' },
  { type: 'general',    title: 'Studio UI is incredibly polished',          date: '2 weeks ago', status: 'appreciated' },
]

const STATUS = {
  received:    { label: 'Received',    color: 'var(--st-t3)' },
  in_review:   { label: 'In Review',   color: 'var(--sn-amber)' },
  appreciated: { label: 'Appreciated', color: 'var(--st-green)' },
}

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="fb-stars">
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          className={`fb-star${n <= (hovered || value) ? ' lit' : ''}`}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          title={['Terrible','Poor','Okay','Good','Excellent'][n-1]}
        >
          <StarIco filled={n <= (hovered || value)} />
        </button>
      ))}
      {value > 0 && (
        <span className="fb-star-label">
          {['Terrible','Poor','Okay','Good','Excellent'][value-1]}
        </span>
      )}
    </div>
  )
}

export default function SendFeedback() {
  const { user } = useStudioAuth()

  const [type,     setType]     = useState('general')
  const [category, setCategory] = useState('')
  const [title,    setTitle]    = useState('')
  const [body,     setBody]     = useState('')
  const [rating,   setRating]   = useState(0)
  const [sending,  setSending]  = useState(false)
  const [sent,     setSent]     = useState(false)
  const [error,    setError]    = useState('')

  const canSubmit = title.trim().length >= 5 && body.trim().length >= 10

  const submit = async () => {
    if (!canSubmit) return
    setSending(true); setError('')
    // Feedback doesn't have a dedicated backend endpoint — log to console
    // and simulate success. Wire to your preferred system (email, Notion, etc.)
    try {
      // If you add a POST /api/feedback endpoint, call it here:
      // await api.post('/feedback', { type, category, title, body, rating, user: user?._id })
      await new Promise(r => setTimeout(r, 900)) // simulate network
      setSent(true)
    } catch {
      setError('Failed to send. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const reset = () => {
    setSent(false); setTitle(''); setBody(''); setRating(0); setCategory('')
  }

  // ── Success state ──
  if (sent) {
    return (
      <div className="fb-page">
        <div className="fb-success">
          <div className="fb-success-icon"><CheckIco /></div>
          <h2 className="fb-success-title">Thank you!</h2>
          <p className="fb-success-sub">Your feedback has been received. We read every submission.</p>
          <button className="fb-send-btn" onClick={reset}>Send another</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fb-page">

      {/* ── Header ── */}
      <div className="fb-header">
        <div className="fb-header-left">
          <div className="fb-header-icon"><FeedbackIco /></div>
          <div>
            <h1 className="fb-title">Send Feedback</h1>
            <p className="fb-sub">Help us improve AURA Studio — we read every submission</p>
          </div>
        </div>
      </div>

      <div className="fb-layout">

        {/* ── Form ── */}
        <div className="fb-form-wrap">

          {/* Type */}
          <div className="fb-field">
            <label className="fb-label">Feedback type</label>
            <div className="fb-type-grid">
              {TYPES.map(t => (
                <button
                  key={t.id}
                  className={`fb-type-card${type === t.id ? ' active' : ''}`}
                  onClick={() => setType(t.id)}
                >
                  <span className="fb-type-icon">{t.icon}</span>
                  <span className="fb-type-label">{t.label}</span>
                  <span className="fb-type-desc">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="fb-field">
            <label className="fb-label">Category <span className="fb-optional">(optional)</span></label>
            <select className="fb-select" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">Select a category…</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Title */}
          <div className="fb-field">
            <label className="fb-label">
              Subject
              <span className={`fb-char-count${title.length > 90 ? ' warn' : ''}`}>
                {title.length}/100
              </span>
            </label>
            <input
              className="fb-input"
              placeholder="Short description of your feedback…"
              value={title}
              onChange={e => setTitle(e.target.value.slice(0, 100))}
            />
          </div>

          {/* Body */}
          <div className="fb-field">
            <label className="fb-label">
              Details
              <span className={`fb-char-count${body.length > 900 ? ' warn' : ''}`}>
                {body.length}/1000
              </span>
            </label>
            <textarea
              className="fb-textarea"
              rows={5}
              placeholder={
                type === 'bug'
                  ? 'Describe what happened, what you expected, and steps to reproduce…'
                  : type === 'suggestion'
                  ? 'Describe the feature and why it would be useful…'
                  : 'Share your thoughts in as much detail as you like…'
              }
              value={body}
              onChange={e => setBody(e.target.value.slice(0, 1000))}
            />
          </div>

          {/* Rating */}
          <div className="fb-field">
            <label className="fb-label">Overall rating <span className="fb-optional">(optional)</span></label>
            <StarRating value={rating} onChange={setRating} />
          </div>

          {error && <p className="fb-error">{error}</p>}

          <button
            className="fb-send-btn"
            disabled={!canSubmit || sending}
            onClick={submit}
          >
            {sending ? <><SpinIco /> Sending…</> : <><SendIco /> Send feedback</>}
          </button>
        </div>

        {/* ── Sidebar: recent ── */}
        <div className="fb-sidebar">
          <p className="fb-sidebar-title">Recent submissions</p>
          <div className="fb-recent-list">
            {RECENT.map((r, i) => {
              const st = STATUS[r.status]
              const tp = TYPES.find(t => t.id === r.type)
              return (
                <div key={i} className="fb-recent-item">
                  <div className="fb-recent-head">
                    <span className="fb-recent-type">{tp?.icon}</span>
                    <span className="fb-recent-date">{r.date}</span>
                    <span className="fb-recent-status" style={{ color: st.color }}>{st.label}</span>
                  </div>
                  <p className="fb-recent-title">{r.title}</p>
                </div>
              )
            })}
          </div>

          <div className="fb-contact-card">
            <p className="fb-contact-title">Need direct help?</p>
            <p className="fb-contact-desc">
              For urgent creator issues, reach our support team directly.
            </p>
            <a
              href="mailto:dev.muktpatel@gmail.com"
              className="fb-contact-link"
            >
              Contact support →
            </a>
          </div>
        </div>

      </div>
    </div>
  )
}