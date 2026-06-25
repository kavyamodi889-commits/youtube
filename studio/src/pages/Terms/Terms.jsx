// studio/src/pages/Terms/Terms.jsx
import { useState } from 'react'
import './Terms.css'

// ── Icon ──────────────────────────────────────────────────────────
const DocIco  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
const ChevIco = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: 'By accessing or using AURA Studio, you agree to be bound by these Terms of Service and all applicable laws. If you do not agree, you are prohibited from using this service. These terms apply to all creators, visitors, and users who access or use the Studio.',
  },
  {
    title: '2. Creator Accounts',
    body: 'You must be at least 13 years of age to use AURA Studio. When you create an account, you must provide accurate and complete information. You are responsible for maintaining the security of your account credentials and for all activities that occur under your account.',
  },
  {
    title: '3. Content Ownership & Licensing',
    body: 'You retain full ownership of all content you upload. By uploading, you grant AURA a non-exclusive, worldwide, royalty-free licence to host, store, transcode, display, and distribute your content on the platform. This licence ends when you delete your content or close your account.',
  },
  {
    title: '4. Prohibited Content',
    body: 'You must not upload content that: infringes third-party intellectual property rights; contains illegal material or promotes illegal activity; constitutes harassment, hate speech, or threats; includes private information about others without consent; contains malware, spam, or deceptive content; or violates any applicable law.',
  },
  {
    title: '5. Monetisation & Revenue Share',
    body: 'Creator revenue sharing is governed by the AURA Partner Programme Agreement, which forms part of these Terms. AURA reserves the right to withhold or reverse payments if policy violations, fraudulent activity, or invalid traffic is detected. Revenue share rates may change with 30 days\' notice.',
  },
  {
    title: '6. Content Moderation',
    body: 'AURA reserves the right to remove any content that violates these Terms, our Community Guidelines, or applicable law. We may issue strikes, restrict features, or terminate accounts for repeated or severe violations. You may appeal moderation decisions via our review process.',
  },
  {
    title: '7. Studio Tools',
    body: 'AURA Studio is provided "as is" for creator management purposes. We make no guarantees about uptime, feature availability, or data accuracy in analytics. Studio features may change, be added, or removed at any time. We will provide reasonable notice of significant changes.',
  },
  {
    title: '8. Intellectual Property',
    body: 'AURA\'s branding, platform code, design systems, and original content are protected by copyright and other intellectual property laws. You may not copy, modify, or distribute any part of the AURA platform without explicit written permission.',
  },
  {
    title: '9. Termination',
    body: 'We may terminate or suspend your account at any time for violations of these Terms. You may delete your account at any time via Settings. Upon termination, your content will be removed within 30 days. Certain data may be retained as required by law.',
  },
  {
    title: '10. Limitation of Liability',
    body: 'To the maximum extent permitted by law, AURA shall not be liable for indirect, incidental, or consequential damages arising from your use of the platform. Our total liability shall not exceed the revenue you earned through AURA in the 12 months preceding the claim.',
  },
  {
    title: '11. Governing Law',
    body: 'These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in the applicable jurisdiction. You agree to attempt informal resolution before initiating any formal legal proceedings.',
  },
  {
    title: '12. Changes to Terms',
    body: 'We may update these Terms at any time. Material changes will be communicated via email and in-app notification at least 14 days before taking effect. Your continued use of AURA Studio after the effective date constitutes acceptance of the revised Terms.',
  },
]

function Accordion({ items }) {
  const [open, setOpen] = useState(null)
  return (
    <div className="tm-accordion">
      {items.map((item, i) => (
        <div key={i} className={`tm-acc-item${open === i ? ' open' : ''}`}>
          <button className="tm-acc-btn" onClick={() => setOpen(open === i ? null : i)}>
            <span>{item.title}</span>
            <span className={`tm-acc-chev${open === i ? ' open' : ''}`}><ChevIco /></span>
          </button>
          {open === i && <div className="tm-acc-body">{item.body}</div>}
        </div>
      ))}
    </div>
  )
}

export default function Terms() {
  return (
    <div className="tm-page">

      {/* ── Header ── */}
      <div className="tm-header">
        <div className="tm-header-icon"><DocIco /></div>
        <div>
          <p className="tm-eyebrow">Legal</p>
          <h1 className="tm-title">Terms of Service</h1>
          <p className="tm-sub">
            Please read these terms carefully before using AURA Studio. By using the platform, you agree to be bound by them.
          </p>
          <p className="tm-date">Effective: March 2026 · Last updated: March 2026</p>
        </div>
      </div>

      {/* ── Quick summary ── */}
      <div className="tm-summary">
        <p className="tm-summary-label">TL;DR — The short version</p>
        <div className="tm-summary-grid">
          {[
            { emoji:'✅', text:'You own your content' },
            { emoji:'🚫', text:'No hate speech, illegal, or harmful content' },
            { emoji:'💰', text:'Revenue share via Partner Programme' },
            { emoji:'🛡️', text:'We can remove content that breaks the rules' },
            { emoji:'📧', text:'14 days notice for major changes' },
            { emoji:'🇮🇳', text:'Governed by Indian law' },
          ].map(s => (
            <div key={s.text} className="tm-summary-item">
              <span>{s.emoji}</span>
              <span>{s.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Full terms ── */}
      <section className="tm-section">
        <h2 className="tm-section-title">Full Terms</h2>
        <Accordion items={SECTIONS} />
      </section>

      {/* ── Footer ── */}
      <div className="tm-contact">
        <p className="tm-contact-title">Questions about our Terms?</p>
        <p className="tm-contact-desc">
          Contact us at <a href="mailto:dev.muktpatel@gmail.com">dev.muktpatel@gmail.com</a>
        </p>
      </div>

    </div>
  )
}