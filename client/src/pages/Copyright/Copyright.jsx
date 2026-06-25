// FILE: client/src/pages/Copyright/Copyright.jsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import '../FooterPages.css'

const fade = (i = 0) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.08, duration: 0.45, ease: [0.16, 1, 0.3, 1] } })

const FAQS = [
  { q: 'What is AURA\'s copyright policy?', a: 'AURA complies with the Digital Millennium Copyright Act (DMCA) and equivalent international copyright laws. We take copyright infringement seriously and remove content that violates rights upon valid notice.' },
  { q: 'How do I submit a copyright takedown?', a: 'You can submit a DMCA takedown notice via our online form. You\'ll need to provide: identification of the copyrighted work, the infringing URL, your contact information, and a statement of good faith.' },
  { q: 'What is Content ID?', a: 'Content ID is AURA\'s automated rights management system. Rights holders can upload reference files and choose to block, monetise, or track content that matches their works.' },
  { q: 'What happens after I file a claim?', a: 'The uploader is notified and has 30 days to respond. They may dispute the claim, remove the video, or acknowledge it. During this time the video may be restricted depending on your chosen action.' },
  { q: 'Can I appeal a copyright strike?', a: 'Yes. If you believe a claim was made in error, you can file a counter-notification. If the claimant does not respond within 10 business days, the content is restored.' },
  { q: 'What is fair use?', a: 'Fair use allows limited use of copyrighted material without permission for purposes such as commentary, criticism, parody, education, and news reporting. AURA cannot determine what is or isn\'t fair use — that\'s a legal determination.' },
]

function Accordion({ items }) {
  const [open, setOpen] = useState(null)
  return (
    <div className="fp-accordion">
      {items.map((item, i) => (
        <div key={i} className="fp-accordion-item">
          <button className="fp-accordion-btn" onClick={() => setOpen(open === i ? null : i)}>
            {item.q}
            <svg className={`fp-accordion-chevron ${open === i ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div
                className="fp-accordion-body"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                style={{ overflow: 'hidden' }}
              >
                {item.a}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}

export default function Copyright() {
  return (
    <div className="fp-page">
      <div className="fp-hero">
        <motion.p className="fp-hero-eyebrow" {...fade(0)}>LEGAL</motion.p>
        <motion.h1 className="fp-hero-title" {...fade(1)}>Copyright & IP Policy</motion.h1>
        <motion.p className="fp-hero-sub" {...fade(2)}>
          AURA respects intellectual property rights and expects our community to do the same. Here's how copyright works on AURA.
        </motion.p>
      </div>

      <div className="fp-body">
        <motion.div className="fp-section" {...fade(3)}>
          <p className="fp-section-title">How We Handle Copyright</p>
          <div className="fp-grid">
            {[
              { icon: '⚡', title: 'Content ID', desc: 'Automated system matches uploads against a database of copyrighted works registered by rights holders.' },
              { icon: '📋', title: 'DMCA Takedowns', desc: 'Submit a formal notice and we\'ll review and act within 24–48 hours.' },
              { icon: '🔄', title: 'Counter Claims', desc: 'Uploaders can dispute claims they believe are invalid through our appeals process.' },
              { icon: '🛡️', title: 'Repeat Infringer Policy', desc: 'Three copyright strikes in 90 days results in permanent channel termination.' },
            ].map((c, i) => (
              <motion.div key={c.title} className="fp-card" {...fade(3 + i * 0.4)}>
                <div className="fp-card-icon" style={{ fontSize: 18 }}>{c.icon}</div>
                <div className="fp-card-title">{c.title}</div>
                <div className="fp-card-text">{c.desc}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div className="fp-section" {...fade(5)}>
          <p className="fp-section-title">Frequently Asked Questions</p>
          <Accordion items={FAQS} />
        </motion.div>

        <motion.div className="fp-section" {...fade(6)}>
          <p className="fp-section-title">Submit a Takedown Notice</p>
          <div className="fp-card" style={{ maxWidth: 420 }}>
            <div className="fp-card-title">DMCA Notification Form</div>
            <div className="fp-card-text" style={{ marginBottom: 14 }}>For copyright infringement claims, please use our official form. Misuse of the DMCA process may result in legal liability.</div>
            <a href="mailto:copyright@aura.com" className="fp-link-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              copyright@aura.com
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  )
}