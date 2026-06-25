// FILE: client/src/pages/About/About.jsx
import { motion } from 'framer-motion'
import '../FooterPages.css'

const fade = (i = 0) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.08, duration: 0.45, ease: [0.16, 1, 0.3, 1] } })

const MILESTONES = [
  { year: '2021', title: 'Founded', desc: 'AURA was born with a simple mission: build the video platform people actually deserve.' },
  { year: '2022', title: 'First Million', desc: 'Reached 1M creators and 50M monthly viewers within the first year of public beta.' },
  { year: '2023', title: 'AURA Premium', desc: 'Launched our creator-first monetisation suite — no ads for viewers, fair revenue for creators.' },
  { year: '2024', title: 'Global Expansion', desc: 'Expanded to 180+ countries with full localisation and regional content hubs.' },
  { year: '2025', title: 'AURA Studio & Music', desc: 'Shipped a full creator ecosystem: Studio tools, Music streaming, and the Ads platform.' },
]

const VALUES = [
  { icon: '◈', title: 'Creator First', desc: 'Every product decision starts with one question: does this help creators make a living doing what they love?' },
  { icon: '◎', title: 'Open Platform', desc: 'No gatekeeping. Every voice deserves an audience, and every idea deserves to be seen.' },
  { icon: '◉', title: 'Privacy by Default', desc: 'We never sell your data. Advertising on AURA is contextual, not surveillance-based.' },
  { icon: '◆', title: 'Honest Metrics', desc: 'No inflated numbers. Real views, real engagement, real revenue — transparency at every layer.' },
]

export default function About() {
  return (
    <div className="fp-page">
      <div className="fp-hero">
        <motion.p className="fp-hero-eyebrow" {...fade(0)}>ABOUT AURA</motion.p>
        <motion.h1 className="fp-hero-title" {...fade(1)}>The platform built<br />for the next generation.</motion.h1>
        <motion.p className="fp-hero-sub" {...fade(2)}>
          AURA is a video and content platform designed from the ground up for creators, viewers, and the communities that connect them. We believe the internet's best ideas deserve the best stage.
        </motion.p>
      </div>

      <div className="fp-body">
        {/* Stats */}
        <motion.div className="fp-stats" {...fade(3)}>
          {[['180M+','Monthly Viewers'],['12M+','Active Creators'],['180+','Countries'],['99.9%','Uptime SLA']].map(([v,l])=>(
            <div key={l} className="fp-stat"><div className="fp-stat-val">{v}</div><div className="fp-stat-lbl">{l}</div></div>
          ))}
        </motion.div>

        {/* Mission */}
        <motion.div className="fp-section" {...fade(4)}>
          <p className="fp-section-title">Our Mission</p>
          <p className="fp-prose">AURA exists to give every creator the tools, audience, and revenue they need to build a sustainable creative career. We're not here to extract value from creators — we're here to amplify it.</p>
          <p className="fp-prose">We're building the platform we always wished existed: one that respects your time as a viewer, rewards your work as a creator, and never treats you as a product.</p>
        </motion.div>

        {/* Values */}
        <motion.div className="fp-section" {...fade(5)}>
          <p className="fp-section-title">What We Stand For</p>
          <div className="fp-grid">
            {VALUES.map((v, i) => (
              <motion.div key={v.title} className="fp-card" {...fade(5 + i * 0.5)}>
                <div className="fp-card-icon" style={{ fontSize: 18 }}>{v.icon}</div>
                <div className="fp-card-title">{v.title}</div>
                <div className="fp-card-text">{v.desc}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Timeline */}
        <motion.div className="fp-section" {...fade(7)}>
          <p className="fp-section-title">Our Story</p>
          <div className="fp-list">
            {MILESTONES.map(m => (
              <div key={m.year} className="fp-list-item">
                <div className="fp-list-item-icon">
                  <span style={{ fontSize: 10, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: 'var(--a)' }}>{m.year}</span>
                </div>
                <div className="fp-list-item-content">
                  <div className="fp-list-item-title">{m.title}</div>
                  <div className="fp-list-item-desc">{m.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Leadership */}
        <motion.div className="fp-section" {...fade(8)}>
          <p className="fp-section-title">Headquartered In</p>
          <p className="fp-prose">San Francisco, CA — with engineering hubs in London, Singapore, and Bangalore.</p>
          <div className="fp-tags">
            {['San Francisco','London','Singapore','Bangalore','Remote-first'].map(t => <span key={t} className="fp-tag">{t}</span>)}
          </div>
        </motion.div>
      </div>
    </div>
  )
}