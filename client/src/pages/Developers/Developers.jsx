// FILE: client/src/pages/Developers/Developers.jsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import '../FooterPages.css'
import './Developers.css'

const fade = (i = 0) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.08, duration: 0.45, ease: [0.16, 1, 0.3, 1] } })

const ENDPOINTS = [
  { method: 'GET',    path: '/v1/videos/{id}',           desc: 'Fetch video metadata, stats, and stream URLs' },
  { method: 'GET',    path: '/v1/channels/{id}',         desc: 'Retrieve channel info and subscriber count' },
  { method: 'POST',   path: '/v1/videos/upload',         desc: 'Upload a video file with metadata' },
  { method: 'GET',    path: '/v1/search',                desc: 'Full-text search across videos and channels' },
  { method: 'POST',   path: '/v1/analytics/report',      desc: 'Query analytics data for your channel' },
  { method: 'DELETE', path: '/v1/videos/{id}',           desc: 'Delete a video from your channel' },
]

const METHOD_COLOR = { GET: '#22c55e', POST: '#3b82f6', DELETE: '#ef4444', PUT: '#f59e0b' }

const SDKS = [
  { lang: 'JavaScript', pkg: 'npm install @aura/sdk', icon: 'JS' },
  { lang: 'Python',     pkg: 'pip install aura-sdk',  icon: 'PY' },
  { lang: 'Go',         pkg: 'go get aura.dev/sdk',   icon: 'GO' },
  { lang: 'Ruby',       pkg: 'gem install aura-sdk',  icon: 'RB' },
]

export default function Developers() {
  const [copied, setCopied] = useState(null)
  const copy = (txt, key) => { navigator.clipboard.writeText(txt); setCopied(key); setTimeout(() => setCopied(null), 1800) }

  return (
    <div className="fp-page">
      <div className="fp-hero">
        <motion.p className="fp-hero-eyebrow" {...fade(0)}>DEVELOPERS</motion.p>
        <motion.h1 className="fp-hero-title" {...fade(1)}>Build on AURA</motion.h1>
        <motion.p className="fp-hero-sub" {...fade(2)}>
          The AURA API gives you programmatic access to videos, channels, analytics, and uploads. Build tools, integrations, and experiences on top of AURA.
        </motion.p>
      </div>

      <div className="fp-body">
        <motion.div className="fp-stats" {...fade(3)}>
          {[['REST','API Style'],['OAuth 2.0','Auth'],['99.99%','API Uptime'],['10K','Free Req/Day']].map(([v,l])=>(
            <div key={l} className="fp-stat"><div className="fp-stat-val" style={{ fontSize: 20 }}>{v}</div><div className="fp-stat-lbl">{l}</div></div>
          ))}
        </motion.div>

        <motion.div className="fp-section" {...fade(4)}>
          <p className="fp-section-title">Quick Start</p>
          <div className="dev-code-block">
            <div className="dev-code-header">
              <span>bash</span>
              <button className="dev-copy-btn" onClick={() => copy('curl -H "Authorization: Bearer YOUR_KEY" https://api.aura.com/v1/videos/dQw4w9WgXcQ', 'quickstart')}>
                {copied === 'quickstart' ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <pre className="dev-code">{`curl -H "Authorization: Bearer YOUR_KEY" \\
  https://api.aura.com/v1/videos/dQw4w9WgXcQ`}</pre>
          </div>
        </motion.div>

        <motion.div className="fp-section" {...fade(5)}>
          <p className="fp-section-title">SDKs</p>
          <div className="fp-grid">
            {SDKS.map((s, i) => (
              <motion.div key={s.lang} className="fp-card" {...fade(5 + i * 0.3)}>
                <div className="fp-card-icon">
                  <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, fontWeight: 700 }}>{s.icon}</span>
                </div>
                <div className="fp-card-title">{s.lang}</div>
                <div className="dev-code-inline" onClick={() => copy(s.pkg, s.lang)}>
                  <code>{s.pkg}</code>
                  <span>{copied === s.lang ? '✓' : '⎘'}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div className="fp-section" {...fade(7)}>
          <p className="fp-section-title">API Reference</p>
          <div className="fp-list">
            {ENDPOINTS.map(ep => (
              <div key={ep.path} className="fp-list-item">
                <span className="dev-method" style={{ color: METHOD_COLOR[ep.method] || '#888' }}>{ep.method}</span>
                <div>
                  <div className="fp-list-item-title" style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 13 }}>{ep.path}</div>
                  <div className="fp-list-item-desc">{ep.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div className="fp-section" {...fade(9)}>
          <p className="fp-section-title">Resources</p>
          <div className="fp-link-list">
            {[['Full API Docs', '#'], ['OAuth Guide', '#'], ['Rate Limits', '#'], ['Webhooks', '#'], ['Status Page', '#']].map(([label, href]) => (
              <a key={label} href={href} className="fp-link-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                {label}
              </a>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}