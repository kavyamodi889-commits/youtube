// FILE: client/src/pages/Terms/Terms.jsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import '../FooterPages.css'

const fade = (i = 0) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.08, duration: 0.45, ease: [0.16, 1, 0.3, 1] } })

const SECTIONS = [
  { title: '1. Acceptance of Terms', body: 'By accessing or using AURA, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing AURA. These terms apply to all visitors, users, and others who access or use the Service.' },
  { title: '2. User Accounts', body: 'When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms. You are responsible for safeguarding your password and for all activities that occur under your account.' },
  { title: '3. Content & Intellectual Property', body: 'Our platform allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material. You retain all rights to content you upload. By uploading, you grant AURA a non-exclusive, worldwide, royalty-free licence to host, store, and display your content on the platform.' },
  { title: '4. Prohibited Conduct', body: 'You agree not to use AURA to: upload content that is illegal, harmful, or violates third-party rights; spam, harass, or impersonate other users; attempt to gain unauthorised access to platform systems; distribute malware or engage in phishing; manipulate view counts, likes, or engagement metrics artificially.' },
  { title: '5. Monetisation & Revenue', body: 'Creator revenue share is governed by the AURA Partner Programme Agreement. AURA reserves the right to suspend payments if we detect policy violations, fraudulent activity, or invalid traffic. Revenue share percentages may change with 30 days notice.' },
  { title: '6. Termination', body: 'We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, AURA, third parties, or for any other reason at our sole discretion.' },
  { title: '7. Limitation of Liability', body: 'AURA shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your access to or use of the platform. Our total liability to you for any claims shall not exceed the amount you paid us in the 12 months preceding the claim.' },
  { title: '8. Changes to Terms', body: 'We reserve the right to modify these terms at any time. We will notify you of changes by updating the date at the top of this page and, for material changes, sending a notification. Your continued use of AURA after changes constitutes acceptance of the new terms.' },
]

function Accordion({ items }) {
  const [open, setOpen] = useState(null)
  return (
    <div className="fp-accordion">
      {items.map((item, i) => (
        <div key={i} className="fp-accordion-item">
          <button className="fp-accordion-btn" onClick={() => setOpen(open === i ? null : i)}>
            {item.title}
            <svg className={`fp-accordion-chevron ${open === i ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div className="fp-accordion-body" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28 }} style={{ overflow: 'hidden' }}>
                {item.body}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}

export default function Terms() {
  return (
    <div className="fp-page">
      <div className="fp-hero">
        <motion.p className="fp-hero-eyebrow" {...fade(0)}>LEGAL</motion.p>
        <motion.h1 className="fp-hero-title" {...fade(1)}>Terms of Service</motion.h1>
        <motion.p className="fp-hero-sub" {...fade(2)}>Last updated: 1 January 2025. Please read these terms carefully before using AURA.</motion.p>
      </div>
      <div className="fp-body">
        <motion.div className="fp-section" {...fade(3)}>
          <div className="fp-card" style={{ marginBottom: 28 }}>
            <div className="fp-card-title">Summary (not a substitute for the full terms)</div>
            <div className="fp-card-text">You own your content. We host it and take a revenue share. You must follow our Community Guidelines. We can terminate accounts that violate our policies. We're not liable for user-generated content.</div>
          </div>
          <Accordion items={SECTIONS} />
        </motion.div>
        <motion.div className="fp-section" {...fade(5)}>
          <p className="fp-section-title">Questions?</p>
          <p className="fp-prose">If you have questions about these terms, contact our legal team at <a href="mailto:legal@aura.com">legal@aura.com</a></p>
        </motion.div>
      </div>
    </div>
  )
}