// FILE: client/src/pages/ContactUs/ContactUs.jsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import '../FooterPages.css'
import './ContactUs.css'

const fade = (i = 0) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.08, duration: 0.45, ease: [0.16, 1, 0.3, 1] } })

const TOPICS = ['General Enquiry', 'Account Issue', 'Creator Support', 'Business Partnership', 'Press / Media', 'Legal / Copyright', 'Technical Bug', 'Other']

const CHANNELS = [
  { icon: '💬', title: 'Live Chat', desc: 'Available Mon–Fri, 9am–6pm PST', badge: 'Fastest' },
  { icon: '📧', title: 'Email Support', desc: 'Response within 24–48 hours', badge: null },
  { icon: '🐦', title: '@AURASupport', desc: 'Twitter/X — for quick questions', badge: null },
  { icon: '📖', title: 'Help Centre', desc: 'Self-serve guides and FAQs', badge: null },
]

export default function ContactUs() {
  const [topic, setTopic]     = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent]       = useState(false)

  const submit = e => { e.preventDefault(); if (topic && message.trim()) setSent(true) }

  return (
    <div className="fp-page">
      <div className="fp-hero">
        <motion.p className="fp-hero-eyebrow" {...fade(0)}>GET IN TOUCH</motion.p>
        <motion.h1 className="fp-hero-title" {...fade(1)}>Contact Us</motion.h1>
        <motion.p className="fp-hero-sub" {...fade(2)}>
          We're here to help. Choose the channel that works best for you, or send us a message directly.
        </motion.p>
      </div>

      <div className="fp-body">
        {/* Channels */}
        <motion.div className="fp-section" {...fade(3)}>
          <p className="fp-section-title">Ways to Reach Us</p>
          <div className="fp-grid">
            {CHANNELS.map((c, i) => (
              <motion.div key={c.title} className="fp-card" style={{ position: 'relative' }} {...fade(3 + i * 0.4)}>
                {c.badge && <span className="contact-badge">{c.badge}</span>}
                <div className="fp-card-icon" style={{ fontSize: 20 }}>{c.icon}</div>
                <div className="fp-card-title">{c.title}</div>
                <div className="fp-card-text">{c.desc}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Form */}
        <motion.div className="fp-section" {...fade(5)}>
          <p className="fp-section-title">Send a Message</p>
          {!sent ? (
            <form className="contact-form" onSubmit={submit}>
              <div className="contact-form-row">
                <div className="contact-field">
                  <label className="contact-label">Topic</label>
                  <select className="contact-select" value={topic} onChange={e => setTopic(e.target.value)} required>
                    <option value="">Select a topic…</option>
                    {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="contact-field">
                <label className="contact-label">Your Message</label>
                <textarea
                  className="contact-textarea"
                  rows={5}
                  placeholder="Describe your issue or question…"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="contact-submit">Send Message</button>
            </form>
          ) : (
            <motion.div className="contact-sent" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="contact-sent-icon">✓</div>
              <div className="contact-sent-title">Message Sent</div>
              <div className="contact-sent-sub">We'll get back to you within 24–48 hours.</div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}