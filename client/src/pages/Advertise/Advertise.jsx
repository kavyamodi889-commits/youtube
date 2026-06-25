// FILE: client/src/pages/Advertise/Advertise.jsx
import { motion } from 'framer-motion'
import '../FooterPages.css'

const fade = (i = 0) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.08, duration: 0.45, ease: [0.16, 1, 0.3, 1] } })

const AD_FORMATS = [
  { icon: '▶', title: 'Pre-roll & Mid-roll', desc: 'Skippable and non-skippable video ads before and during content. Reach viewers when engagement is highest.' },
  { icon: '◻', title: 'Display & Overlay', desc: 'Non-intrusive banners alongside video content. Great for brand awareness campaigns.' },
  { icon: '◈', title: 'Sponsored Cards', desc: 'Contextual product cards that appear in relevant videos. Native and frictionless.' },
  { icon: '🎯', title: 'Targeted Shorts Ads', desc: 'Full-screen vertical ads in the Shorts feed. Ideal for mobile-first campaigns.' },
  { icon: '🔴', title: 'Live Sponsorships', desc: 'Branded integrations during live streams with direct creator collaboration.' },
  { icon: '◆', title: 'Homepage Takeover', desc: 'Premium placement on the AURA homepage. Maximum reach for major campaign moments.' },
]

export default function Advertise() {
  return (
    <div className="fp-page">
      <div className="fp-hero">
        <motion.p className="fp-hero-eyebrow" {...fade(0)}>ADVERTISING</motion.p>
        <motion.h1 className="fp-hero-title" {...fade(1)}>Reach 180M viewers<br />who actually care.</motion.h1>
        <motion.p className="fp-hero-sub" {...fade(2)}>
          AURA Ads connects brands with highly engaged audiences through ethical, contextual advertising. No surveillance. No dark patterns. Just results.
        </motion.p>
      </div>

      <div className="fp-body">
        <motion.div className="fp-stats" {...fade(3)}>
          {[['180M+','Monthly Viewers'],['4.2×','Avg. Engagement vs TV'],['94%','Brand Safety Score'],['$12 CPM','Avg. Cost Per Mille']].map(([v,l])=>(
            <div key={l} className="fp-stat"><div className="fp-stat-val">{v}</div><div className="fp-stat-lbl">{l}</div></div>
          ))}
        </motion.div>

        <motion.div className="fp-section" {...fade(4)}>
          <p className="fp-section-title">Ad Formats</p>
          <div className="fp-grid">
            {AD_FORMATS.map((f, i) => (
              <motion.div key={f.title} className="fp-card" {...fade(4 + i * 0.3)}>
                <div className="fp-card-icon" style={{ fontSize: 18 }}>{f.icon}</div>
                <div className="fp-card-title">{f.title}</div>
                <div className="fp-card-text">{f.desc}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div className="fp-section" {...fade(7)}>
          <p className="fp-section-title">Why AURA Ads?</p>
          <div className="fp-list">
            {[
              ['Contextual Targeting', 'We match your ad to relevant content — not surveillance profiles. GDPR and CCPA compliant by design.'],
              ['Brand Safety', 'AI-powered content classification ensures your ads never appear next to inappropriate content.'],
              ['Transparent Reporting', 'Real-time dashboard with verified views, not inflated impressions. You only pay for what counts.'],
              ['Creator Partnership', 'Optional direct creator integrations for authentic, high-engagement placements.'],
            ].map(([t, d]) => (
              <div key={t} className="fp-list-item">
                <div className="fp-list-item-icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div className="fp-list-item-content">
                  <div className="fp-list-item-title">{t}</div>
                  <div className="fp-list-item-desc">{d}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div className="fp-section" {...fade(9)}>
          <p className="fp-section-title">Get Started</p>
          <p className="fp-prose">AURA Ads is currently in development. Visit <a href="http://localhost:5176">AURA Ads</a> to join the early access waitlist and be first to launch your campaign.</p>
        </motion.div>
      </div>
    </div>
  )
}