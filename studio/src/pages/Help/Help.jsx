// studio/src/pages/Help/Help.jsx
import { useState } from 'react'
import './Help.css'

// ── Icons ─────────────────────────────────────────────────────────
const HelpIco    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
const SearchIco  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
const ChevIco    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
const MailIco    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
const UploadIco  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>
const AnalytIco  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
const EarnIco    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
const ContentIco = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="m10 8 6 4-6 4V8z"/></svg>
const SettingsIco= () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
const LiveIco    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 010 8.49M7.76 16.24a6 6 0 010-8.49"/></svg>

const CATEGORIES = [
  {
    id: 'upload',
    icon: <UploadIco />,
    label: 'Uploading Videos',
    color: 'cat-rose',
    faqs: [
      {
        q: 'What video formats does AURA support?',
        a: 'AURA supports MP4, MOV, AVI, MKV, WebM, and most common video formats. We recommend MP4 with H.264 encoding for the best results. Maximum file size is 2GB.',
      },
      {
        q: 'Why is my video still processing?',
        a: 'Processing time depends on video length and resolution. A 10-minute 1080p video typically takes 3–8 minutes. You can check status under Content → the video\'s status badge. If stuck for over 30 minutes, try re-uploading.',
      },
      {
        q: 'How do I add subtitles?',
        a: 'Go to Subtitles in the sidebar. Select your video, then upload an .SRT or .VTT file, or use Auto-caption (powered by AI) to generate captions automatically.',
      },
      {
        q: 'Can I schedule a video to publish later?',
        a: 'Yes — during upload, set visibility to "Scheduled" and pick a date and time. The video will be set to private until that moment, then automatically publish.',
      },
    ],
  },
  {
    id: 'analytics',
    icon: <AnalytIco />,
    label: 'Analytics',
    color: 'cat-blue',
    faqs: [
      {
        q: 'How often does analytics data update?',
        a: 'Channel-level stats update approximately every 24–48 hours. Real-time view counts during live streams update every few seconds. Historical data is locked once finalised.',
      },
      {
        q: 'Why do my view counts look lower than expected?',
        a: 'AURA filters invalid views (bots, reloads, very short views) from counts. This can make counts appear 5–15% lower than raw server hits. This is correct behaviour.',
      },
      {
        q: 'What is watch time and how is it calculated?',
        a: 'Watch time is the total minutes viewers have spent watching your videos. It\'s calculated from player heartbeat events sent every 10 seconds during playback.',
      },
    ],
  },
  {
    id: 'earn',
    icon: <EarnIco />,
    label: 'Earn & Monetisation',
    color: 'cat-gold',
    faqs: [
      {
        q: 'When can I start monetising?',
        a: 'You need 1,000 subscribers and 4,000 watch hours in the past 12 months to join the AURA Partner Programme. Check your eligibility on the Earn page.',
      },
      {
        q: 'When and how do I get paid?',
        a: 'Payments are processed monthly via Razorpay to your registered bank account. Minimum payout threshold is ₹1,000. Payments are initiated on the 15th of each month.',
      },
      {
        q: 'Why was my payment withheld?',
        a: 'Payments may be withheld if we detect policy violations, invalid traffic, disputed copyright claims, or incomplete payment setup. Check your email for a detailed reason.',
      },
    ],
  },
  {
    id: 'content',
    icon: <ContentIco />,
    label: 'Content Manager',
    color: 'cat-teal',
    faqs: [
      {
        q: 'How do I delete a video?',
        a: 'Go to Content, find the video, click the three-dot menu or the Delete icon in the actions column. Deletion is permanent — the video and all its engagement data will be removed.',
      },
      {
        q: 'Can I change visibility after uploading?',
        a: 'Yes — click Edit on any video to change visibility between Public, Private, and Unlisted at any time. Changes take effect immediately.',
      },
      {
        q: 'How do I edit video details like title or description?',
        a: 'Go to Content, click the Edit icon on any video. You can update the title, description, tags, category, thumbnail, and more. Click Save to apply changes.',
      },
    ],
  },
  {
    id: 'settings',
    icon: <SettingsIco />,
    label: 'Settings & Account',
    color: 'cat-indigo',
    faqs: [
      {
        q: 'How do I change my channel name?',
        a: 'Go to the main AURA app at localhost:5173, then Settings → Profile. Display name changes take effect immediately across all your content.',
      },
      {
        q: 'I signed in with Google — can I set a password?',
        a: 'Google accounts don\'t use a password with AURA. Your authentication is handled by Google. You can set up a local password by adding an email + password in your Google account security settings.',
      },
      {
        q: 'How do I delete my account?',
        a: 'Go to Settings → Account → Danger Zone. Account deletion is permanent and removes all your videos, comments, and data. This cannot be undone.',
      },
    ],
  },
  {
    id: 'live',
    icon: <LiveIco />,
    label: 'Live Streaming',
    color: 'cat-red',
    faqs: [
      {
        q: 'How do I go live?',
        a: 'Click the Create button in the Studio navbar and choose "Go Live". You can stream from your browser\'s webcam, or via OBS/streaming software using the RTMP URL and stream key provided.',
      },
      {
        q: 'What is the maximum stream resolution?',
        a: 'AURA supports up to 1080p60 via RTMP and up to 720p30 via the browser webcam option. For the best quality, use OBS at 1080p with a bitrate of 4,000–6,000 kbps.',
      },
      {
        q: 'Why is my stream laggy for viewers?',
        a: 'Lag is usually caused by insufficient upload bandwidth. We recommend at least 10 Mbps upload speed for stable 1080p streaming. Try lowering your bitrate in OBS if viewers report lag.',
      },
    ],
  },
]

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`hp-faq-item${open ? ' open' : ''}`}>
      <button className="hp-faq-btn" onClick={() => setOpen(o => !o)}>
        <span>{q}</span>
        <span className={`hp-faq-chev${open ? ' open' : ''}`}><ChevIco /></span>
      </button>
      {open && <div className="hp-faq-body">{a}</div>}
    </div>
  )
}

export default function Help() {
  const [search,      setSearch]      = useState('')
  const [activeCategory, setCategory] = useState(null)

  const filteredCategories = CATEGORIES.map(cat => ({
    ...cat,
    faqs: cat.faqs.filter(f =>
      !search ||
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(cat => !search || cat.faqs.length > 0)

  const displayed = activeCategory
    ? filteredCategories.filter(c => c.id === activeCategory)
    : filteredCategories

  return (
    <div className="hp-page">

      {/* ── Header ── */}
      <div className="hp-header">
        <div className="hp-header-icon"><HelpIco /></div>
        <div>
          <h1 className="hp-title">Help Centre</h1>
          <p className="hp-sub">Find answers to common questions about AURA Studio</p>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="hp-search-wrap">
        <SearchIco />
        <input
          className="hp-search"
          placeholder="Search for anything… e.g. 'how to upload', 'analytics', 'monetisation'"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* ── Category pills ── */}
      <div className="hp-category-pills">
        <button
          className={`hp-pill${!activeCategory ? ' active' : ''}`}
          onClick={() => setCategory(null)}
        >All topics</button>
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            className={`hp-pill${activeCategory === c.id ? ' active' : ''}`}
            onClick={() => setCategory(c.id === activeCategory ? null : c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* ── FAQ sections ── */}
      {displayed.length === 0 ? (
        <div className="hp-empty">
          <HelpIco />
          <p>No results for "{search}"</p>
        </div>
      ) : (
        <div className="hp-sections">
          {displayed.map(cat => (
            <div key={cat.id} className="hp-section">
              <div className="hp-section-head">
                <div className={`hp-section-icon ${cat.color}`}>{cat.icon}</div>
                <h2 className="hp-section-title">{cat.label}</h2>
              </div>
              <div className="hp-faqs">
                {cat.faqs.map((faq, i) => (
                  <FaqItem key={i} q={faq.q} a={faq.a} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Contact ── */}
      <div className="hp-contact">
        <MailIco />
        <div>
          <p className="hp-contact-title">Still need help?</p>
          <p className="hp-contact-desc">
            Can't find what you're looking for? Email us at{' '}
            <a href="mailto:dev.muktpatel@gmail.com">dev.muktpatel@gmail.com</a> and we'll get back to you within 48 hours.
          </p>
        </div>
      </div>

    </div>
  )
}