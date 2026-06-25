// FILE: client/src/pages/HowAURAWorks/HowAURAWorks.jsx
import { motion } from 'framer-motion'
import '../FooterPages.css'

const fade = (i = 0) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.08, duration: 0.45, ease: [0.16, 1, 0.3, 1] } })

const ALGORITHM_STEPS = [
  { step: '01', title: 'Content Ingestion', desc: 'When you upload, AURA transcodes into 8 quality levels from 144p to 4K, extracts speech for captions, and runs content safety classification — all within minutes.' },
  { step: '02', title: 'Indexing & Metadata', desc: 'AI models extract topics, entities, mood, and quality signals. This powers search, recommendations, and content matching across 180M+ videos.' },
  { step: '03', title: 'Recommendation Engine', desc: 'A two-stage system first retrieves hundreds of candidates using collaborative filtering, then ranks them using your watch history, session context, and quality signals.' },
  { step: '04', title: 'Search Ranking', desc: 'Search results are ranked by relevance, watch time quality, upload recency, and engagement rate — not by who paid more.' },
  { step: '05', title: 'Ad Matching', desc: 'Contextual ad matching reads video content (not viewer profiles) to find relevant ads. No third-party cookies or surveillance tracking.' },
  { step: '06', title: 'Revenue Distribution', desc: 'Ad revenue is calculated per video based on verified watch time with ads enabled. 70% goes to creators, paid monthly with full transparency.' },
]

export default function HowAURAWorks() {
  return (
    <div className="fp-page">
      <div className="fp-hero">
        <motion.p className="fp-hero-eyebrow" {...fade(0)}>TRANSPARENCY</motion.p>
        <motion.h1 className="fp-hero-title" {...fade(1)}>How AURA Works</motion.h1>
        <motion.p className="fp-hero-sub" {...fade(2)}>
          We believe platforms should be transparent about how they surface content, run algorithms, and distribute revenue. Here's exactly how it works.
        </motion.p>
      </div>

      <div className="fp-body">
        <motion.div className="fp-section" {...fade(3)}>
          <p className="fp-section-title">The Platform at a Glance</p>
          <div className="fp-stats">
            {[['CDN','Global Delivery'],['< 2s','Time to Play'],['8 Layers','Quality Tiers'],['Real-time','Revenue Reports']].map(([v,l])=>(
              <div key={l} className="fp-stat"><div className="fp-stat-val" style={{ fontSize: 18 }}>{v}</div><div className="fp-stat-lbl">{l}</div></div>
            ))}
          </div>
        </motion.div>

        <motion.div className="fp-section" {...fade(4)}>
          <p className="fp-section-title">From Upload to Viewer — Step by Step</p>
          <div className="fp-list">
            {ALGORITHM_STEPS.map((s, i) => (
              <motion.div key={s.step} className="fp-list-item" {...fade(4 + i * 0.4)}>
                <div className="fp-list-item-icon">
                  <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, fontWeight: 800, color: 'var(--a)' }}>{s.step}</span>
                </div>
                <div>
                  <div className="fp-list-item-title">{s.title}</div>
                  <div className="fp-list-item-desc">{s.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div className="fp-section" {...fade(8)}>
          <p className="fp-section-title">What We Don't Do</p>
          <div className="fp-list">
            {[
              ['We don\'t pay for promoted positions in recommendations', 'Recommendation slots are never for sale.'],
              ['We don\'t suppress content for political reasons', 'Ranking is based on quality signals, not political content.'],
              ['We don\'t sell your watch history', 'Your data stays on AURA. Always.'],
              ['We don\'t use third-party ad tracking', 'All ad targeting is contextual and first-party.'],
            ].map(([t, d]) => (
              <div key={t} className="fp-list-item">
                <div className="fp-list-item-icon" style={{ color: '#22c55e' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div>
                  <div className="fp-list-item-title">{t}</div>
                  <div className="fp-list-item-desc">{d}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}