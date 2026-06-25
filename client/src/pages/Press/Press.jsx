// FILE: client/src/pages/Press/Press.jsx
import { motion } from 'framer-motion'
import '../FooterPages.css'

const fade = (i = 0) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.08, duration: 0.45, ease: [0.16, 1, 0.3, 1] } })

const PRESS_ITEMS = [
  { outlet: 'TechCrunch', date: 'Nov 2025', headline: 'AURA just hit 180M monthly viewers — and it\'s only getting started', tag: 'Growth' },
  { outlet: 'The Verge', date: 'Oct 2025', headline: 'How AURA\'s creator-first model is reshaping the video landscape', tag: 'Feature' },
  { outlet: 'Wired', date: 'Sep 2025', headline: 'AURA Studio is the creator tool YouTube never built', tag: 'Product' },
  { outlet: 'Forbes', date: 'Aug 2025', headline: 'AURA raised $400M Series C at a $4.2B valuation', tag: 'Funding' },
  { outlet: 'Bloomberg', date: 'Jul 2025', headline: 'AURA Music launches with 60M tracks and a new royalty model', tag: 'Launch' },
  { outlet: 'Fast Company', date: 'Jun 2025', headline: '50 Most Innovative Companies 2025: AURA takes #7', tag: 'Award' },
]

const ASSETS = [
  { label: 'Logo Pack (SVG + PNG)', desc: 'Light, dark, and monochrome variants' },
  { label: 'Brand Guidelines PDF', desc: 'Colours, typography, usage rules' },
  { label: 'Executive Headshots', desc: 'Hi-res photos for press use' },
  { label: 'Product Screenshots', desc: 'Latest UI across web and mobile' },
  { label: 'Fact Sheet 2025', desc: 'Key stats, milestones, and figures' },
]

export default function Press() {
  return (
    <div className="fp-page">
      <div className="fp-hero">
        <motion.p className="fp-hero-eyebrow" {...fade(0)}>PRESS & MEDIA</motion.p>
        <motion.h1 className="fp-hero-title" {...fade(1)}>Newsroom</motion.h1>
        <motion.p className="fp-hero-sub" {...fade(2)}>
          Official press releases, media assets, and coverage. For press enquiries contact <a href="mailto:press@aura.com">press@aura.com</a>
        </motion.p>
      </div>

      <div className="fp-body">
        <motion.div className="fp-section" {...fade(3)}>
          <p className="fp-section-title">In The News</p>
          <div className="fp-list">
            {PRESS_ITEMS.map((p, i) => (
              <div key={i} className="fp-list-item" style={{ cursor: 'pointer' }}>
                <div className="fp-list-item-icon">
                  <span style={{ fontSize: 9, fontWeight: 700, fontFamily: 'JetBrains Mono,monospace', color: 'var(--a)', textAlign: 'center', lineHeight: 1.2 }}>{p.outlet.slice(0,4)}</span>
                </div>
                <div className="fp-list-item-content" style={{ flex: 1 }}>
                  <div className="fp-list-item-title">{p.headline}</div>
                  <div className="fp-list-item-desc">{p.outlet} · {p.date}</div>
                </div>
                <span className="fp-tag" style={{ flexShrink: 0 }}>{p.tag}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div className="fp-section" {...fade(5)}>
          <p className="fp-section-title">Media Assets</p>
          <div className="fp-list">
            {ASSETS.map(a => (
              <div key={a.label} className="fp-list-item" style={{ cursor: 'pointer' }}>
                <div className="fp-list-item-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </div>
                <div className="fp-list-item-content">
                  <div className="fp-list-item-title">{a.label}</div>
                  <div className="fp-list-item-desc">{a.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div className="fp-section" {...fade(6)}>
          <p className="fp-section-title">Press Contact</p>
          <div className="fp-card" style={{ maxWidth: 400 }}>
            <div className="fp-card-title">Media Relations</div>
            <div className="fp-card-text">For interview requests, fact-checking, or image licensing, please reach out directly.</div>
            <div style={{ marginTop: 12 }}>
              <a href="mailto:press@aura.com" className="fp-link-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                press@aura.com
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}