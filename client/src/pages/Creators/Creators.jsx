// FILE: client/src/pages/Creators/Creators.jsx
import { motion } from 'framer-motion'
import '../FooterPages.css'

const fade = (i = 0) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.08, duration: 0.45, ease: [0.16, 1, 0.3, 1] } })

const TOOLS = [
  { icon: '🎬', title: 'AURA Studio', desc: 'Full-featured creator dashboard. Upload, schedule, manage analytics, and run your channel like a pro.' },
  { icon: '💰', title: 'Revenue Share', desc: '70% of ad revenue goes directly to creators — higher than any major platform.' },
  { icon: '🎵', title: 'Audio Library', desc: 'Royalty-free music and sound effects for every video, at no cost.' },
  { icon: '📊', title: 'Deep Analytics', desc: 'Understand exactly who\'s watching, when, and why they click away.' },
  { icon: '🛍️', title: 'Merch Integration', desc: 'Sell products directly under your videos with our native storefront.' },
  { icon: '🔴', title: 'Live & Premieres', desc: 'Go live or schedule a premiere. Superchat, polls, and real-time chat built in.' },
]

const TIERS = [
  { name: 'Starter', req: '0 subscribers', perks: ['Upload up to 4K', 'Basic analytics', 'Audio library access', 'Community tab'] },
  { name: 'Partner', req: '1,000 subscribers + 4,000 watch hours', perks: ['Ad revenue share', 'Channel memberships', 'Merch shelf', 'Priority support', 'Advanced analytics'] },
  { name: 'Pro', req: '100,000 subscribers', perks: ['Everything in Partner', 'Dedicated partner manager', 'Early feature access', 'Co-marketing opportunities', 'Custom revenue deals'] },
]

export default function Creators() {
  return (
    <div className="fp-page">
      <div className="fp-hero">
        <motion.p className="fp-hero-eyebrow" {...fade(0)}>FOR CREATORS</motion.p>
        <motion.h1 className="fp-hero-title" {...fade(1)}>Build your audience.<br />Own your income.</motion.h1>
        <motion.p className="fp-hero-sub" {...fade(2)}>
          AURA is built for creators first. Every feature, every policy, every revenue decision is made with your growth in mind.
        </motion.p>
      </div>

      <div className="fp-body">
        <motion.div className="fp-stats" {...fade(3)}>
          {[['70%','Revenue Share'],['12M+','Active Creators'],['$2.1B','Paid Out 2024'],['4K+','Avg Monthly Earnings']].map(([v,l])=>(
            <div key={l} className="fp-stat"><div className="fp-stat-val">{v}</div><div className="fp-stat-lbl">{l}</div></div>
          ))}
        </motion.div>

        <motion.div className="fp-section" {...fade(4)}>
          <p className="fp-section-title">Creator Tools</p>
          <div className="fp-grid">
            {TOOLS.map((t, i) => (
              <motion.div key={t.title} className="fp-card" {...fade(4 + i * 0.3)}>
                <div className="fp-card-icon" style={{ fontSize: 20 }}>{t.icon}</div>
                <div className="fp-card-title">{t.title}</div>
                <div className="fp-card-text">{t.desc}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div className="fp-section" {...fade(7)}>
          <p className="fp-section-title">Partner Tiers</p>
          <div className="fp-list">
            {TIERS.map(t => (
              <div key={t.name} className="fp-list-item" style={{ alignItems: 'flex-start' }}>
                <div className="fp-list-item-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </div>
                <div>
                  <div className="fp-list-item-title">{t.name} <span style={{ color: 'var(--t3)', fontWeight: 300, fontSize: 12 }}>— {t.req}</span></div>
                  <div className="fp-tags" style={{ marginTop: 6 }}>
                    {t.perks.map(p => <span key={p} className="fp-tag">{p}</span>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div className="fp-section" {...fade(9)}>
          <p className="fp-section-title">Get Started</p>
          <p className="fp-prose">Ready to start creating? Head to <a href="http://localhost:5174">AURA Studio</a> to set up your channel, upload your first video, and start growing your audience today.</p>
        </motion.div>
      </div>
    </div>
  )
}