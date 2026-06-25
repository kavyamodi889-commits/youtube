// FILE: client/src/pages/ReportHistory/ReportHistory.jsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './ReportHistory.css'

// ── ICONS ──
const FlagIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
const ClockIcon   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
const CheckIcon   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
const XCircIcon   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
const SearchIcon  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
const VideoIcon   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
const UserIcon    = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const MsgIcon     = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
const LiveIcon    = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 010 8.49m-8.48-.01a6 6 0 010-8.49m11.31-2.82a10 10 0 010 14.14m-14.14 0a10 10 0 010-14.14"/></svg>
const FilterIcon  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
const TrashIcon   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
const InfoIcon    = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
const ChevronIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>

// ── DATA ──
const REPORTS = [
  {
    id: 1,
    type: 'video',
    title: 'Building a Full Stack App with React',
    channel: 'CodeWithMe',
    thumb: 0,
    reason: 'Misleading content',
    detail: 'The thumbnail and title are misleading — the video does not actually cover what was promised.',
    status: 'reviewed',
    outcome: 'action_taken',
    date: '2025-02-18',
    timeAgo: '11 days ago',
  },
  {
    id: 2,
    type: 'comment',
    title: 'Comment on "Lo-fi Beats 24/7"',
    channel: 'ChillVibes',
    thumb: 1,
    reason: 'Spam or misleading',
    detail: 'Comment was promoting an unrelated website repeatedly.',
    status: 'reviewed',
    outcome: 'no_action',
    date: '2025-02-20',
    timeAgo: '9 days ago',
  },
  {
    id: 3,
    type: 'channel',
    title: 'Channel: ShadyPromos',
    channel: 'ShadyPromos',
    thumb: 2,
    reason: 'Scam / Fraud',
    detail: 'This channel is impersonating a popular creator and promoting fake giveaways.',
    status: 'pending',
    outcome: null,
    date: '2025-02-24',
    timeAgo: '5 days ago',
  },
  {
    id: 4,
    type: 'video',
    title: 'Top 10 Movies of 2025 — Honest Review',
    channel: 'CinemaHub',
    thumb: 3,
    reason: 'Hateful or abusive content',
    detail: 'Contains segments with discriminatory language targeting a specific group.',
    status: 'under_review',
    outcome: null,
    date: '2025-02-26',
    timeAgo: '3 days ago',
  },
  {
    id: 5,
    type: 'livestream',
    title: 'Late Night Q&A Session',
    channel: 'NightOwlCode',
    thumb: 4,
    reason: 'Harmful or dangerous acts',
    detail: 'Stream showed dangerous activities without any safety warnings.',
    status: 'reviewed',
    outcome: 'action_taken',
    date: '2025-02-15',
    timeAgo: '14 days ago',
  },
  {
    id: 6,
    type: 'comment',
    title: 'Comment on "React 19 Guide"',
    channel: 'TechMind',
    thumb: 5,
    reason: 'Harassment or bullying',
    detail: 'Comment was personally attacking another user with offensive language.',
    status: 'pending',
    outcome: null,
    date: '2025-02-28',
    timeAgo: '1 day ago',
  },
  {
    id: 7,
    type: 'video',
    title: 'Messi\'s Career Tribute Documentary',
    channel: 'SportsPulse',
    thumb: 0,
    reason: 'Copyright infringement',
    detail: 'This video uses copyrighted match footage without permission.',
    status: 'reviewed',
    outcome: 'no_action',
    date: '2025-02-10',
    timeAgo: '19 days ago',
  },
]

const THUMB_BG = [
  ['#120818','#1e0826'],
  ['#081812','#0a2014'],
  ['#180808','#2a0a10'],
  ['#080818','#0c0c28'],
  ['#181008','#281800'],
  ['#081018','#0a1828'],
]

const TYPE_META = {
  video:      { icon: <VideoIcon />, label: 'Video'      },
  comment:    { icon: <MsgIcon />,   label: 'Comment'    },
  channel:    { icon: <UserIcon />,  label: 'Channel'    },
  livestream: { icon: <LiveIcon />,  label: 'Livestream' },
}

const STATUS_META = {
  pending:      { label: 'Pending Review',  color: 'status-pending'  },
  under_review: { label: 'Under Review',    color: 'status-review'   },
  reviewed:     { label: 'Reviewed',        color: 'status-reviewed' },
}

const OUTCOME_META = {
  action_taken: { label: 'Action Taken', icon: <CheckIcon />,  color: 'outcome-action'    },
  no_action:    { label: 'No Action',    icon: <XCircIcon />,  color: 'outcome-no-action' },
}

const FILTER_TABS = ['All', 'Pending', 'Under Review', 'Reviewed']

// ── DETAIL MODAL ──
function DetailModal({ report, onClose }) {
  const typeMeta   = TYPE_META[report.type]
  const statusMeta = STATUS_META[report.status]
  const outcomeMeta = report.outcome ? OUTCOME_META[report.outcome] : null
  const bg = THUMB_BG[report.thumb % THUMB_BG.length]

  return (
    <motion.div className="modal-overlay"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}>
      <motion.div className="modal-card"
        initial={{ scale: 0.88, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.88, y: 16, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 360, damping: 28 }}
        onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <div className="modal-title-row">
            <span className={`modal-type-badge type-${report.type}`}>
              {typeMeta.icon} {typeMeta.label}
            </span>
            <button className="modal-close" onClick={onClose}>
              <XCircIcon />
            </button>
          </div>
        </div>

        <div className="modal-body">
          {/* Thumb */}
          <div className="modal-thumb" style={{ background: `linear-gradient(135deg,${bg[0]},${bg[1]})` }}>
            <div className="modal-thumb-glow" />
          </div>

          <div className="modal-info">
            <div className="modal-report-title">{report.title}</div>
            <div className="modal-channel">{report.channel}</div>
          </div>

          <div className="modal-divider" />

          <div className="modal-row">
            <span className="modal-label">Reported reason</span>
            <span className="modal-value highlight">{report.reason}</span>
          </div>
          <div className="modal-row">
            <span className="modal-label">Your description</span>
            <span className="modal-value">{report.detail}</span>
          </div>
          <div className="modal-row">
            <span className="modal-label">Date reported</span>
            <span className="modal-value mono">{report.date} · {report.timeAgo}</span>
          </div>
          <div className="modal-row">
            <span className="modal-label">Status</span>
            <span className={`modal-status-chip ${statusMeta.color}`}>{statusMeta.label}</span>
          </div>
          {outcomeMeta && (
            <div className="modal-row">
              <span className="modal-label">Outcome</span>
              <span className={`modal-outcome-chip ${outcomeMeta.color}`}>
                {outcomeMeta.icon} {outcomeMeta.label}
              </span>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <div className="modal-note">
            <InfoIcon />
            AURA reviews all reports within 24–72 hours. Thank you for keeping the community safe.
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── REPORT CARD ──
function ReportCard({ report, index, onOpen, onDelete }) {
  const typeMeta    = TYPE_META[report.type]
  const statusMeta  = STATUS_META[report.status]
  const outcomeMeta = report.outcome ? OUTCOME_META[report.outcome] : null
  const bg = THUMB_BG[report.thumb % THUMB_BG.length]

  return (
    <motion.div
      className="report-card"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26, delay: index * 0.05 }}
      layout
    >
      {/* Thumb */}
      <div className="rc-thumb" style={{ background: `linear-gradient(135deg,${bg[0]},${bg[1]})` }}>
        <div className="rc-thumb-glow" />
        <span className={`rc-type-icon type-icon-${report.type}`}>{typeMeta.icon}</span>
      </div>

      {/* Info */}
      <div className="rc-info">
        <div className="rc-top">
          <span className={`rc-type-badge type-${report.type}`}>
            {typeMeta.icon} {typeMeta.label}
          </span>
          <span className="rc-time"><ClockIcon /> {report.timeAgo}</span>
        </div>
        <div className="rc-title">{report.title}</div>
        <div className="rc-reason">{report.reason}</div>
      </div>

      {/* Status */}
      <div className="rc-status-col">
        <span className={`rc-status ${statusMeta.color}`}>{statusMeta.label}</span>
        {outcomeMeta && (
          <span className={`rc-outcome ${outcomeMeta.color}`}>
            {outcomeMeta.icon} {outcomeMeta.label}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="rc-actions">
        <motion.button className="rc-view-btn" onClick={() => onOpen(report)}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }}>
          View Details
        </motion.button>
        <motion.button className="rc-del-btn" onClick={() => onDelete(report.id)}
          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }}>
          <TrashIcon />
        </motion.button>
      </div>
    </motion.div>
  )
}

// ── PAGE ──
export default function ReportHistory() {
  const [reports, setReports]     = useState(REPORTS)
  const [filter, setFilter]       = useState('All')
  const [search, setSearch]       = useState('')
  const [selected, setSelected]   = useState(null)
  const [typeFilter, setTypeFilter] = useState('All')

  const handleDelete = (id) => {
    setReports(prev => prev.filter(r => r.id !== id))
  }

  const filtered = reports.filter(r => {
    const matchStatus =
      filter === 'All'          ? true :
      filter === 'Pending'      ? r.status === 'pending' :
      filter === 'Under Review' ? r.status === 'under_review' :
      filter === 'Reviewed'     ? r.status === 'reviewed' : true

    const matchType =
      typeFilter === 'All' ? true : r.type === typeFilter.toLowerCase()

    const matchSearch =
      search === '' ? true :
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.reason.toLowerCase().includes(search.toLowerCase()) ||
      r.channel.toLowerCase().includes(search.toLowerCase())

    return matchStatus && matchType && matchSearch
  })

  const counts = {
    all:     reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    review:  reports.filter(r => r.status === 'under_review').length,
    done:    reports.filter(r => r.status === 'reviewed').length,
  }

  return (
    <div className="rh-page">

      {/* ── HEADER ── */}
      <motion.div className="rh-header"
        initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}>
        <div className="rh-header-left">
          <div className="rh-title-row">
            <span className="rh-flag-icon"><FlagIcon /></span>
            <h1 className="rh-title">Report History</h1>
          </div>
          <p className="rh-subtitle">Track the status of content you've reported to AURA.</p>
        </div>

        {/* Stats pills */}
        <div className="rh-stat-pills">
          <div className="rh-stat-pill">
            <span className="rsp-num">{counts.all}</span>
            <span className="rsp-label">Total</span>
          </div>
          <div className="rh-stat-pill pill-pending">
            <span className="rsp-num">{counts.pending}</span>
            <span className="rsp-label">Pending</span>
          </div>
          <div className="rh-stat-pill pill-review">
            <span className="rsp-num">{counts.review}</span>
            <span className="rsp-label">In Review</span>
          </div>
          <div className="rh-stat-pill pill-done">
            <span className="rsp-num">{counts.done}</span>
            <span className="rsp-label">Resolved</span>
          </div>
        </div>
      </motion.div>

      {/* ── FILTERS ── */}
      <div className="rh-controls">
        {/* Status tabs */}
        <div className="rh-status-tabs">
          {FILTER_TABS.map(f => (
            <motion.button key={f}
              className={`rh-tab ${filter === f ? 'rh-tab-active' : ''}`}
              onClick={() => setFilter(f)}
              whileHover={{ y: -1 }} whileTap={{ scale: 0.95 }}>
              {f}
            </motion.button>
          ))}
        </div>

        <div className="rh-right-controls">
          {/* Type filter */}
          <div className="rh-type-select-wrap">
            <FilterIcon />
            <select className="rh-type-select"
              value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="All">All types</option>
              <option value="video">Video</option>
              <option value="comment">Comment</option>
              <option value="channel">Channel</option>
              <option value="livestream">Livestream</option>
            </select>
            <ChevronIcon />
          </div>

          {/* Search */}
          <div className="rh-search-wrap">
            <span className="rh-search-icon"><SearchIcon /></span>
            <input className="rh-search" placeholder="Search reports..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      {/* ── CARDS ── */}
      <AnimatePresence mode="popLayout">
        {filtered.length === 0 ? (
          <motion.div className="rh-empty"
            key="empty"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="rh-empty-icon">🏳️</div>
            <div className="rh-empty-title">No reports found</div>
            <div className="rh-empty-desc">
              {search ? 'Try a different search term' : 'You have no reports matching this filter'}
            </div>
          </motion.div>
        ) : (
          <div className="rh-cards">
            {filtered.map((r, i) => (
              <ReportCard
                key={r.id}
                report={r}
                index={i}
                onOpen={setSelected}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* ── INFO BOX ── */}
      <motion.div className="rh-info-box"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}>
        <InfoIcon />
        <span>
          Reports are reviewed by AURA's Trust & Safety team within <strong>24–72 hours</strong>.
          You'll see status updates here automatically. Reports are kept for <strong>90 days</strong>.
        </span>
      </motion.div>

      {/* ── DETAIL MODAL ── */}
      <AnimatePresence>
        {selected && (
          <DetailModal report={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}