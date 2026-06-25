// FILE: client/src/pages/Help/Help.jsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './Help.css'

// ── ICONS ──
const SearchIcon   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
const ChevronIcon  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
const ArrowIcon    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
const PlayIcon     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
const AccountIcon  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const StarIcon     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
const ShieldIcon   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
const MusicIcon    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
const ChatIcon     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
const BillingIcon  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
const UploadIcon   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>
const DeviceIcon   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
const MailIcon     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
const BotIcon      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>
const ThumbUpIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/><path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>
const ThumbDnIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17"/></svg>
const XIcon        = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const SparkIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>

// ── DATA ──
const CATEGORIES = [
  {
    id: 'getting-started',
    icon: <PlayIcon />,
    label: 'Getting Started',
    color: 'cat-rose',
    desc: 'New to AURA? Start here.',
    articles: 8,
  },
  {
    id: 'account',
    icon: <AccountIcon />,
    label: 'Account & Profile',
    color: 'cat-indigo',
    desc: 'Manage your account settings.',
    articles: 14,
  },
  {
    id: 'premium',
    icon: <StarIcon />,
    label: 'AURA Premium',
    color: 'cat-gold',
    desc: 'Billing, plans, and features.',
    articles: 11,
  },
  {
    id: 'safety',
    icon: <ShieldIcon />,
    label: 'Safety & Privacy',
    color: 'cat-teal',
    desc: 'Keep your account safe.',
    articles: 9,
  },
  {
    id: 'music',
    icon: <MusicIcon />,
    label: 'AURA Music',
    color: 'cat-rose',
    desc: 'Streaming and offline play.',
    articles: 7,
  },
  {
    id: 'chat',
    icon: <ChatIcon />,
    label: 'Chat & Rooms',
    color: 'cat-indigo',
    desc: 'DMs, rooms, and messaging.',
    articles: 6,
  },
  {
    id: 'billing',
    icon: <BillingIcon />,
    label: 'Billing & Payments',
    color: 'cat-gold',
    desc: 'Subscriptions and invoices.',
    articles: 10,
  },
  {
    id: 'upload',
    icon: <UploadIcon />,
    label: 'Uploading Videos',
    color: 'cat-teal',
    desc: 'Create and publish content.',
    articles: 12,
  },
  {
    id: 'devices',
    icon: <DeviceIcon />,
    label: 'Devices & Apps',
    color: 'cat-rose',
    desc: 'iOS, Android, TV, and more.',
    articles: 8,
  },
]

const FAQS = [
  {
    cat: 'getting-started',
    q: 'How do I create an AURA account?',
    a: 'Go to aura.com and click "Sign Up". Enter your email address, create a password, and verify your email. Your account is ready instantly — no credit card needed.',
  },
  {
    cat: 'getting-started',
    q: 'What is AURA and how is it different from other platforms?',
    a: 'AURA is a next-generation video platform with integrated music streaming, real-time chat rooms, DMs, Shorts, and creator tools — all in one dark, beautiful interface built for creators and viewers alike.',
  },
  {
    cat: 'account',
    q: 'How do I change my username or profile picture?',
    a: 'Go to Settings → Profile. You can update your display name, handle, profile photo, and banner image. Changes save automatically and reflect across the platform within minutes.',
  },
  {
    cat: 'account',
    q: 'I forgot my password. How do I reset it?',
    a: 'On the sign-in page, click "Forgot password". Enter the email associated with your account and we\'ll send a secure reset link valid for 30 minutes.',
  },
  {
    cat: 'premium',
    q: 'How do I start an AURA Premium free trial?',
    a: 'Visit the Premium page and click "Start Free Trial". You\'ll get 30 days completely free — no ads, offline downloads, 4K, and AURA Music included. Cancel anytime before the trial ends.',
  },
  {
    cat: 'premium',
    q: 'Can I cancel Premium anytime?',
    a: 'Yes. Go to Settings → Billing → Cancel Subscription. You keep all Premium features until the end of your current billing period. No cancellation fees ever.',
  },
  {
    cat: 'safety',
    q: 'How do I report a video or channel?',
    a: 'Click the three-dot menu (⋮) on any video or channel and select "Report". Choose a reason, add details, and submit. You can track all your reports in Report History.',
  },
  {
    cat: 'safety',
    q: 'How do I make my account private?',
    a: 'Go to Settings → Privacy. Toggle "Private Account" to on. Your subscriptions, liked videos, and playlists will be hidden from other users. Your public videos remain visible.',
  },
  {
    cat: 'chat',
    q: 'What are AURA Rooms?',
    a: 'Rooms are group chats — like WhatsApp groups but built into AURA. You can join public rooms around topics you love or create private rooms for your community.',
  },
  {
    cat: 'chat',
    q: 'Can I delete a message I sent?',
    a: 'Yes. Right-click (or long-press on mobile) on any message you sent and select "Delete". The message is removed immediately with a satisfying particle animation.',
  },
  {
    cat: 'upload',
    q: 'What video formats does AURA support?',
    a: 'AURA supports MP4, MOV, AVI, MKV, WebM, and FLV. Maximum file size is 128GB. For best quality we recommend H.264 or H.265 encoded MP4 at up to 8K resolution.',
  },
  {
    cat: 'billing',
    q: 'How do I get an invoice for my Premium subscription?',
    a: 'Go to Settings → Billing → Billing History. Click on any transaction to download a PDF invoice. Invoices are also emailed to you automatically after each payment.',
  },
  {
    cat: 'devices',
    q: 'How many devices can I use AURA on at the same time?',
    a: 'Free accounts: 2 devices simultaneously. Premium: 4 devices. Ultra: 6 devices (including family members). Manage active sessions in Settings → Devices.',
  },
  {
    cat: 'music',
    q: 'Does AURA Music work offline?',
    a: 'Yes — with Premium or Ultra. Open the AURA Music tab, find any song or playlist and tap the download icon. Offline music is available even without an internet connection.',
  },
]

const POPULAR = [
  'How to reset my password',
  'Cancel Premium subscription',
  'Download videos offline',
  'Report a channel',
  'Change profile picture',
  'Parental controls setup',
  'How to go live on AURA',
]

// ── FAQ ITEM ──
function FaqItem({ item, index }) {
  const [open, setOpen] = useState(false)
  const [voted, setVoted] = useState(null)

  return (
    <motion.div
      className={`faq-item ${open ? 'faq-open' : ''}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      layout
    >
      <button className="faq-q" onClick={() => setOpen(o => !o)}>
        <span>{item.q}</span>
        <motion.span
          className="faq-chevron"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        >
          <ChevronIcon />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div className="faq-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
          >
            <div className="faq-answer">{item.a}</div>
            <div className="faq-helpful">
              <span className="faq-helpful-label">Was this helpful?</span>
              <motion.button
                className={`faq-vote ${voted === 'yes' ? 'voted-yes' : ''}`}
                onClick={() => setVoted('yes')}
                whileTap={{ scale: 0.88 }}
              >
                <ThumbUpIcon /> Yes
              </motion.button>
              <motion.button
                className={`faq-vote ${voted === 'no' ? 'voted-no' : ''}`}
                onClick={() => setVoted('no')}
                whileTap={{ scale: 0.88 }}
              >
                <ThumbDnIcon /> No
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── CONTACT MODAL ──
function ContactModal({ onClose }) {
  const [form, setForm] = useState({ subject: '', message: '', email: '' })
  const [sent, setSent] = useState(false)

  const handleSend = () => {
    if (!form.subject || !form.message || !form.email) return
    setSent(true)
    setTimeout(onClose, 2200)
  }

  return (
    <motion.div className="modal-overlay"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}>
      <motion.div className="contact-modal"
        initial={{ scale: 0.88, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.88, y: 16, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 360, damping: 28 }}
        onClick={e => e.stopPropagation()}>

        <div className="cm-header">
          <div className="cm-title">Contact Support</div>
          <button className="cm-close" onClick={onClose}><XIcon /></button>
        </div>

        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div key="sent" className="cm-sent"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}>
              <div className="cm-sent-icon">✅</div>
              <div className="cm-sent-title">Message sent!</div>
              <div className="cm-sent-sub">Our team will get back to you within 24 hours.</div>
            </motion.div>
          ) : (
            <motion.div key="form" className="cm-body"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="cm-field">
                <label className="cm-label">Your email</label>
                <input className="cm-input" type="email" placeholder="you@example.com"
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="cm-field">
                <label className="cm-label">Subject</label>
                <input className="cm-input" placeholder="What do you need help with?"
                  value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
              </div>
              <div className="cm-field">
                <label className="cm-label">Message</label>
                <textarea className="cm-textarea" placeholder="Describe your issue in detail..."
                  rows={4} value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
              </div>
              <motion.button className="cm-send-btn"
                onClick={handleSend}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}>
                <MailIcon /> Send Message
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

// ── PAGE ──
export default function Help() {
  const [search, setSearch]         = useState('')
  const [activeCategory, setActive] = useState(null)
  const [showContact, setContact]   = useState(false)
  const [chatOpen, setChatOpen]     = useState(false)

  // Filter FAQs
  const visibleFaqs = FAQS.filter(f => {
    const matchCat    = activeCategory ? f.cat === activeCategory : true
    const matchSearch = search
      ? f.q.toLowerCase().includes(search.toLowerCase()) ||
        f.a.toLowerCase().includes(search.toLowerCase())
      : true
    return matchCat && matchSearch
  })

  const activeCategoryData = CATEGORIES.find(c => c.id === activeCategory)

  return (
    <div className="help-page">

      {/* ── HERO / SEARCH ── */}
      <div className="help-hero">
        <motion.div className="help-hero-glow"
          animate={{ opacity: [0.3, 0.55, 0.3], scale: [1, 1.06, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} />

        <motion.div className="help-hero-content"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 26 }}>
          <div className="help-eyebrow"><SparkIcon /> Help Center</div>
          <h1 className="help-title">How can we help you?</h1>
          <p className="help-subtitle">Search our knowledge base or browse categories below.</p>

          {/* Search bar */}
          <div className="help-search-wrap">
            <span className="help-search-icon"><SearchIcon /></span>
            <input
              className="help-search"
              placeholder="Search for answers... e.g. reset password, cancel subscription"
              value={search}
              onChange={e => { setSearch(e.target.value); setActive(null) }}
            />
            <AnimatePresence>
              {search && (
                <motion.button className="help-search-clear"
                  initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  onClick={() => setSearch('')}>
                  <XIcon />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Popular searches */}
          {!search && (
            <div className="popular-searches">
              <span className="popular-label">Popular:</span>
              {POPULAR.map((p, i) => (
                <motion.button key={i} className="popular-tag"
                  onClick={() => setSearch(p)}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.04 }}
                  whileHover={{ y: -2 }} whileTap={{ scale: 0.94 }}>
                  {p}
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* ── CATEGORIES ── */}
      {!search && (
        <motion.section className="help-section"
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 280, damping: 26 }}>
          <div className="help-section-head">
            <h2 className="help-section-title">Browse by topic</h2>
            {activeCategory && (
              <motion.button className="clear-cat-btn"
                onClick={() => setActive(null)}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }}>
                <XIcon /> Clear filter
              </motion.button>
            )}
          </div>
          <div className="categories-grid">
            {CATEGORIES.map((cat, i) => (
              <motion.button
                key={cat.id}
                className={`cat-card ${cat.color} ${activeCategory === cat.id ? 'cat-card-active' : ''}`}
                onClick={() => setActive(activeCategory === cat.id ? null : cat.id)}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 280, damping: 26 }}
                whileHover={{ y: -4 }} whileTap={{ scale: 0.97 }}>
                <div className="cat-card-icon">{cat.icon}</div>
                <div className="cat-card-label">{cat.label}</div>
                <div className="cat-card-desc">{cat.desc}</div>
                <div className="cat-card-count">{cat.articles} articles <ArrowIcon /></div>
              </motion.button>
            ))}
          </div>
        </motion.section>
      )}

      {/* ── FAQ LIST ── */}
      <motion.section className="help-section"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}>
        <div className="help-section-head">
          <h2 className="help-section-title">
            {search
              ? `Results for "${search}"`
              : activeCategory
                ? `${activeCategoryData?.label}`
                : 'Frequently Asked Questions'
            }
          </h2>
          <span className="faq-count">{visibleFaqs.length} articles</span>
        </div>

        {visibleFaqs.length === 0 ? (
          <motion.div className="help-empty"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="help-empty-icon">🔍</div>
            <div className="help-empty-title">No results found</div>
            <div className="help-empty-desc">
              Try different keywords or <button className="help-empty-contact" onClick={() => setContact(true)}>contact support</button>
            </div>
          </motion.div>
        ) : (
          <div className="faq-list">
            <AnimatePresence>
              {visibleFaqs.map((f, i) => (
                <FaqItem key={f.q} item={f} index={i} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.section>

      {/* ── CONTACT / SUPPORT CARDS ── */}
      <motion.section className="help-section"
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
        viewport={{ once: true }}>
        <h2 className="help-section-title" style={{ marginBottom: 16 }}>Still need help?</h2>
        <div className="support-cards">
          <motion.div className="support-card"
            whileHover={{ y: -4 }}
            onClick={() => setContact(true)}>
            <div className="sc-icon sc-mail"><MailIcon /></div>
            <div className="sc-title">Email Support</div>
            <div className="sc-desc">Get a response from our team within 24 hours.</div>
            <div className="sc-cta">Send a message <ArrowIcon /></div>
          </motion.div>

          <motion.div className="support-card"
            whileHover={{ y: -4 }}
            onClick={() => setChatOpen(true)}>
            <div className="sc-icon sc-bot"><BotIcon /></div>
            <div className="sc-title">AURA Assistant</div>
            <div className="sc-desc">Chat with our AI assistant — available 24/7.</div>
            <div className="sc-cta">Start chat <ArrowIcon /></div>
          </motion.div>

          <motion.div className="support-card" whileHover={{ y: -4 }}>
            <div className="sc-icon sc-community"><ChatIcon /></div>
            <div className="sc-title">Community Forum</div>
            <div className="sc-desc">Ask the AURA creator community for help.</div>
            <div className="sc-cta">Visit forum <ArrowIcon /></div>
          </motion.div>
        </div>
      </motion.section>

      {/* ── CONTACT MODAL ── */}
      <AnimatePresence>
        {showContact && <ContactModal onClose={() => setContact(false)} />}
      </AnimatePresence>

      {/* ── AI CHAT BUBBLE (simple) ── */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div className="chat-bubble-panel"
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}>
            <div className="cbp-header">
              <div className="cbp-title-row">
                <div className="cbp-bot-av"><BotIcon /></div>
                <div>
                  <div className="cbp-title">AURA Assistant</div>
                  <div className="cbp-status"><span className="cbp-dot" /> Online</div>
                </div>
              </div>
              <button className="cbp-close" onClick={() => setChatOpen(false)}><XIcon /></button>
            </div>
            <div className="cbp-body">
              <div className="cbp-msg cbp-msg-bot">
                👋 Hi! I'm the AURA Assistant. What can I help you with today?
              </div>
              {POPULAR.slice(0, 4).map((p, i) => (
                <motion.button key={i} className="cbp-quick"
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                  onClick={() => { setSearch(p); setChatOpen(false) }}>
                  {p}
                </motion.button>
              ))}
            </div>
            <div className="cbp-footer">
              <input className="cbp-input" placeholder="Ask anything..." />
              <motion.button className="cbp-send" whileTap={{ scale: 0.9 }}>
                <ArrowIcon />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}