// FILE: client/src/pages/PolicySafety/PolicySafety.jsx
import { motion } from 'framer-motion'
import '../FooterPages.css'

const fade = (i = 0) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.08, duration: 0.45, ease: [0.16, 1, 0.3, 1] } })

const POLICIES = [
  { icon: '🚫', title: 'Harmful Content', desc: 'Content that depicts or incites violence, self-harm, or abuse of any kind is prohibited and removed immediately.', severity: 'critical' },
  { icon: '👶', title: 'Child Safety', desc: 'Any content that exploits or endangers minors results in immediate termination and reporting to authorities.', severity: 'critical' },
  { icon: '❌', title: 'Hate Speech', desc: 'Content promoting hatred based on race, religion, gender, sexual orientation, or disability is not permitted.', severity: 'critical' },
  { icon: '🎭', title: 'Misinformation', desc: 'We label and reduce distribution of content that spreads dangerous medical or electoral misinformation.', severity: 'high' },
  { icon: '🔞', title: 'Adult Content', desc: 'Explicit content is not permitted on AURA. Age-restricted mature themes may be allowed with proper labelling.', severity: 'high' },
  { icon: '©️', title: 'Copyright Violations', desc: 'Content that infringes on intellectual property rights is removed upon valid notice. Three strikes = termination.', severity: 'medium' },
  { icon: '🤖', title: 'Spam & Manipulation', desc: 'Artificial view counts, fake comments, and coordinated inauthentic behaviour violate our policies.', severity: 'medium' },
  { icon: '🔒', title: 'Privacy Violations', desc: 'Sharing personal information without consent, doxxing, or non-consensual intimate images are strictly banned.', severity: 'high' },
]

const SEVERITY_STYLE = {
  critical: { border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.04)' },
  high:     { border: '1px solid rgba(245,158,11,0.25)', background: 'rgba(245,158,11,0.03)' },
  medium:   {},
}

export default function PolicySafety() {
  return (
    <div className="fp-page">
      <div className="fp-hero">
        <motion.p className="fp-hero-eyebrow" {...fade(0)}>COMMUNITY</motion.p>
        <motion.h1 className="fp-hero-title" {...fade(1)}>Policy & Safety</motion.h1>
        <motion.p className="fp-hero-sub" {...fade(2)}>
          AURA's Community Guidelines define what's allowed on our platform. We're committed to keeping AURA safe, respectful, and open.
        </motion.p>
      </div>

      <div className="fp-body">
        <motion.div className="fp-section" {...fade(3)}>
          <p className="fp-section-title">Our Core Principles</p>
          <div className="fp-grid">
            {[
              { icon: '🌍', title: 'Freedom of Expression', desc: 'We support open dialogue and diverse viewpoints within the limits of law and safety.' },
              { icon: '🛡️', title: 'Protection from Harm', desc: 'We act quickly to remove content that puts people in danger — physically or psychologically.' },
              { icon: '⚖️', title: 'Consistent Enforcement', desc: 'Our policies apply equally to all creators, regardless of subscriber count or influence.' },
              { icon: '🔍', title: 'Transparency', desc: 'We publish quarterly transparency reports on takedowns, appeals, and enforcement actions.' },
            ].map((c, i) => (
              <motion.div key={c.title} className="fp-card" {...fade(3 + i * 0.3)}>
                <div className="fp-card-icon" style={{ fontSize: 20 }}>{c.icon}</div>
                <div className="fp-card-title">{c.title}</div>
                <div className="fp-card-text">{c.desc}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div className="fp-section" {...fade(5)}>
          <p className="fp-section-title">Community Guidelines</p>
          <div className="fp-list">
            {POLICIES.map((p, i) => (
              <div key={p.title} className="fp-list-item" style={SEVERITY_STYLE[p.severity]}>
                <div className="fp-list-item-icon" style={{ fontSize: 18 }}>{p.icon}</div>
                <div>
                  <div className="fp-list-item-title">{p.title}</div>
                  <div className="fp-list-item-desc">{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div className="fp-section" {...fade(7)}>
          <p className="fp-section-title">Report Harmful Content</p>
          <p className="fp-prose">See something that violates our guidelines? Use the "…" menu on any video to report it. Our Trust & Safety team reviews all reports within 24 hours.</p>
          <p className="fp-prose" style={{ marginTop: 8 }}>For urgent safety concerns: <a href="mailto:safety@aura.com">safety@aura.com</a></p>
        </motion.div>
      </div>
    </div>
  )
}