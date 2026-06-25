// FILE: client/src/pages/TestNewFeatures/TestNewFeatures.jsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import '../FooterPages.css'
import './TestNewFeatures.css'

const fade = (i = 0) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.08, duration: 0.45, ease: [0.16, 1, 0.3, 1] } })

const EXPERIMENTS = [
  { id: 'ai_chapters', name: 'AI Chapter Markers', desc: 'Automatically generate chapter timestamps using speech and visual analysis.', status: 'beta', enrolled: 24820 },
  { id: 'live_translate', name: 'Live Translation', desc: 'Real-time caption translation in 40+ languages during live streams.', status: 'alpha', enrolled: 5140 },
  { id: 'collab_edit', name: 'Collaborative Editing', desc: 'Invite co-editors to work on drafts and scheduled uploads together.', status: 'beta', enrolled: 18300 },
  { id: 'smart_skip', name: 'Smart Skip', desc: 'Skip intros, sponsored segments, and filler content automatically.', status: 'alpha', enrolled: 9600 },
  { id: 'mood_radio', name: 'Mood Radio', desc: 'AI-curated continuous playlists based on your current mood and activity.', status: 'beta', enrolled: 41200 },
  { id: 'spatial_audio', name: 'Spatial Audio', desc: 'Immersive 3D audio for supported headphones and speakers.', status: 'alpha', enrolled: 3280 },
]

const STATUS_COLOR = { beta: 'var(--a)', alpha: '#f59e0b' }

export default function TestNewFeatures() {
  const [joined, setJoined] = useState({})
  const toggle = id => setJoined(j => ({ ...j, [id]: !j[id] }))

  return (
    <div className="fp-page">
      <div className="fp-hero">
        <motion.p className="fp-hero-eyebrow" {...fade(0)}>EARLY ACCESS</motion.p>
        <motion.h1 className="fp-hero-title" {...fade(1)}>Test New Features</motion.h1>
        <motion.p className="fp-hero-sub" {...fade(2)}>
          Help shape AURA's future. Join experiments and give feedback directly to our product team before features go live to everyone.
        </motion.p>
      </div>

      <div className="fp-body">
        <motion.div className="fp-section" {...fade(3)}>
          <div className="fp-card" style={{ marginBottom: 28 }}>
            <div className="fp-card-title">How it works</div>
            <div className="fp-card-text">Opt into experiments below. Features may change or be removed. Your usage and feedback helps us decide what ships. You can leave any experiment at any time.</div>
          </div>
        </motion.div>

        <motion.div className="fp-section" {...fade(4)}>
          <p className="fp-section-title">Active Experiments</p>
          <div className="fp-list">
            {EXPERIMENTS.map((exp, i) => (
              <motion.div key={exp.id} className="fp-list-item tnf-experiment-item" {...fade(4 + i * 0.3)}>
                <div className="fp-list-item-content" style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span className="fp-list-item-title">{exp.name}</span>
                    <span className="tnf-status-pill" style={{ background: STATUS_COLOR[exp.status] }}>{exp.status.toUpperCase()}</span>
                  </div>
                  <div className="fp-list-item-desc">{exp.desc}</div>
                  <div className="tnf-enrolled">{(exp.enrolled + (joined[exp.id] ? 1 : 0)).toLocaleString()} people enrolled</div>
                </div>
                <button
                  className={`tnf-join-btn ${joined[exp.id] ? 'joined' : ''}`}
                  onClick={() => toggle(exp.id)}
                >
                  {joined[exp.id] ? 'Leave' : 'Join'}
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div className="fp-section" {...fade(8)}>
          <p className="fp-section-title">Share Your Feedback</p>
          <p className="fp-prose">After using a feature, rate it from the three-dot menu. Direct feedback goes straight to the responsible product team. We read everything.</p>
        </motion.div>
      </div>
    </div>
  )
}