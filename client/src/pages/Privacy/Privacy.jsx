// FILE: client/src/pages/Privacy/Privacy.jsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import '../FooterPages.css'
import './Privacy.css'

const fade = (i = 0) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.08, duration: 0.45, ease: [0.16, 1, 0.3, 1] } })

const DATA_TYPES = [
  { icon: '👤', title: 'Account Info', desc: 'Name, email, profile picture, and preferences you provide when signing up.' },
  { icon: '▶', title: 'Watch History', desc: 'Videos you watch and how long you watch them — used for recommendations only.' },
  { icon: '🔍', title: 'Search Queries', desc: 'What you search for on AURA. Never shared with third parties.' },
  { icon: '📍', title: 'Location', desc: 'Country-level location inferred from IP for content availability. Not sold.' },
  { icon: '📊', title: 'Usage Analytics', desc: 'How you interact with the platform — to improve features and fix bugs.' },
  { icon: '💳', title: 'Payment Info', desc: 'Processed via Stripe. AURA never stores your full card number.' },
]

const RIGHTS = [
  ['Access', 'Request a copy of all data we hold about you.'],
  ['Correction', 'Ask us to fix inaccurate or incomplete data.'],
  ['Deletion', 'Request deletion of your account and all associated data.'],
  ['Portability', 'Export your data in a machine-readable format.'],
  ['Objection', 'Opt out of certain types of data processing.'],
  ['Restriction', 'Limit how we process your data in specific circumstances.'],
]

export default function Privacy() {
  const [toggles, setToggles] = useState({ analytics: true, recommendations: true, marketing: false })
  const toggle = k => setToggles(t => ({ ...t, [k]: !t[k] }))

  return (
    <div className="fp-page">
      <div className="fp-hero">
        <motion.p className="fp-hero-eyebrow" {...fade(0)}>LEGAL</motion.p>
        <motion.h1 className="fp-hero-title" {...fade(1)}>Privacy Policy</motion.h1>
        <motion.p className="fp-hero-sub" {...fade(2)}>We don't sell your data. We never have. Here's exactly what we collect and why.</motion.p>
      </div>

      <div className="fp-body">
        <motion.div className="fp-section" {...fade(3)}>
          <p className="fp-section-title">Data We Collect</p>
          <div className="fp-grid">
            {DATA_TYPES.map((d, i) => (
              <motion.div key={d.title} className="fp-card" {...fade(3 + i * 0.3)}>
                <div className="fp-card-icon" style={{ fontSize: 20 }}>{d.icon}</div>
                <div className="fp-card-title">{d.title}</div>
                <div className="fp-card-text">{d.desc}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div className="fp-section" {...fade(6)}>
          <p className="fp-section-title">Your Privacy Controls</p>
          <div className="fp-toggle-row">
            <div className="fp-toggle-info">
              <div className="fp-toggle-label">Analytics & Improvement</div>
              <div className="fp-toggle-desc">Help us fix bugs and improve features by sharing usage data.</div>
            </div>
            <label className="fp-switch">
              <input type="checkbox" checked={toggles.analytics} onChange={() => toggle('analytics')} />
              <span className="fp-switch-track" />
            </label>
          </div>
          <div className="fp-toggle-row">
            <div className="fp-toggle-info">
              <div className="fp-toggle-label">Personalised Recommendations</div>
              <div className="fp-toggle-desc">Use your watch history to suggest content you'll enjoy.</div>
            </div>
            <label className="fp-switch">
              <input type="checkbox" checked={toggles.recommendations} onChange={() => toggle('recommendations')} />
              <span className="fp-switch-track" />
            </label>
          </div>
          <div className="fp-toggle-row">
            <div className="fp-toggle-info">
              <div className="fp-toggle-label">Marketing Emails</div>
              <div className="fp-toggle-desc">Receive occasional product updates and creator spotlights.</div>
            </div>
            <label className="fp-switch">
              <input type="checkbox" checked={toggles.marketing} onChange={() => toggle('marketing')} />
              <span className="fp-switch-track" />
            </label>
          </div>
        </motion.div>

        <motion.div className="fp-section" {...fade(8)}>
          <p className="fp-section-title">Your Rights (GDPR / CCPA)</p>
          <div className="fp-list">
            {RIGHTS.map(([r, d]) => (
              <div key={r} className="fp-list-item">
                <div className="fp-list-item-icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div>
                  <div className="fp-list-item-title">{r}</div>
                  <div className="fp-list-item-desc">{d}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div className="fp-section" {...fade(9)}>
          <p className="fp-section-title">Contact Our DPO</p>
          <p className="fp-prose">Data protection enquiries: <a href="mailto:privacy@aura.com">privacy@aura.com</a> · Last updated: 1 January 2025</p>
        </motion.div>
      </div>
    </div>
  )
}