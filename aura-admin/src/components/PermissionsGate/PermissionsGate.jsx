// src/components/PermissionsGate/PermissionsGate.jsx
// Admin panel — asks for browser notifications only.
// Saved in localStorage (admin users are not in the User DB).
import { useState, useEffect } from 'react'
import './PermissionsGate.css'

const LOCAL_KEY = 'aura_admin_perms_asked_v1'

export default function AdminPermissionsGate() {
  const [visible,  setVisible]  = useState(false)
  const [status,   setStatus]   = useState('idle') // idle | requesting | granted | denied | unsupported
  const [done,     setDone]     = useState(false)

  useEffect(() => {
    // Only show if not already asked and notifications are not yet decided
    if (localStorage.getItem(LOCAL_KEY)) return
    if (!('Notification' in window)) { localStorage.setItem(LOCAL_KEY, '1'); return }
    if (Notification.permission !== 'default') { localStorage.setItem(LOCAL_KEY, '1'); return }
    const t = setTimeout(() => setVisible(true), 1800)
    return () => clearTimeout(t)
  }, [])

  const request = async () => {
    setStatus('requesting')
    try {
      const result = await Notification.requestPermission()
      setStatus(result === 'granted' ? 'granted' : 'denied')
      setDone(true)
    } catch {
      setStatus('unsupported')
      setDone(true)
    }
  }

  const dismiss = () => {
    localStorage.setItem(LOCAL_KEY, '1')
    setVisible(false)
  }

  const handleContinue = () => {
    localStorage.setItem(LOCAL_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="apg-backdrop">
      <div className="apg-modal">
        <div className="apg-icon">🔔</div>
        <h2 className="apg-title">Enable notifications</h2>
        <p className="apg-desc">
          Allow AURA Admin to send you browser notifications for critical alerts —
          new reports, flagged content, and system events.
        </p>

        {status === 'idle' && (
          <div className="apg-btns">
            <button className="apg-allow-btn" onClick={request}>Allow notifications</button>
            <button className="apg-skip-btn"  onClick={dismiss}>Skip</button>
          </div>
        )}

        {status === 'requesting' && (
          <div className="apg-status apg-requesting">
            <span className="apg-spinner" /> Waiting for browser…
          </div>
        )}

        {status === 'granted' && (
          <div className="apg-result">
            <div className="apg-status apg-granted">✓ Notifications enabled</div>
            <button className="apg-continue-btn" onClick={handleContinue}>Continue</button>
          </div>
        )}

        {(status === 'denied' || status === 'unsupported') && (
          <div className="apg-result">
            <div className="apg-status apg-denied">
              {status === 'denied' ? 'Notifications blocked — enable in browser settings' : 'Not supported in this browser'}
            </div>
            <button className="apg-continue-btn" onClick={handleContinue}>Continue anyway</button>
          </div>
        )}

        <p className="apg-note">You won't be asked again after this.</p>
      </div>
    </div>
  )
}