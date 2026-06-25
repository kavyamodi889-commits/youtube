// FILE: client/src/components/PermissionsGate/PermissionsGate.jsx
// Asks for mic + notifications only (camera is asked in Studio, not client).
// Saves granted/denied status to DB via /api/user/settings so we never re-ask
// across devices or after clearing localStorage.
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext.jsx'
import api from '../../services/api.js'
import './PermissionsGate.css'

const LOCAL_KEY = 'aura_perms_asked_v2'

const PERMISSIONS = [
  {
    id:    'notifications',
    icon:  '🔔',
    title: 'Notifications',
    desc:  'Get notified when channels you follow go live, upload new videos, or reply to your comments.',
    why:   'Required for browser push notifications',
    request: async () => {
      if (!('Notification' in window)) return 'unsupported'
      const result = await Notification.requestPermission()
      return result
    },
  },
  {
    id:    'microphone',
    icon:  '🎤',
    title: 'Microphone',
    desc:  'Enables voice search and live streaming with audio.',
    why:   'Required for Voice Search and Live streaming',
    request: async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        stream.getTracks().forEach(t => t.stop())
        return 'granted'
      } catch (err) {
        return err.name === 'NotAllowedError' ? 'denied' : 'unsupported'
      }
    },
  },
]

export default function PermissionsGate() {
  const { user }                = useAuth()
  const [visible,  setVisible]  = useState(false)
  const [statuses, setStatuses] = useState({ notifications: 'idle', microphone: 'idle' })
  const [allDone,  setAllDone]  = useState(false)
  const [saving,   setSaving]   = useState(false)

  useEffect(() => {
    if (!user) return
    const dbPerms = user.browserPermissions || {}
    const alreadyHandled = PERMISSIONS.every(p => dbPerms[p.id] != null)
    if (alreadyHandled) return
    if (localStorage.getItem(LOCAL_KEY)) return
    const t = setTimeout(() => setVisible(true), 1400)
    return () => clearTimeout(t)
  }, [user])

  useEffect(() => {
    const done = Object.values(statuses).every(s => s !== 'idle' && s !== 'requesting')
    if (done) setAllDone(true)
  }, [statuses])

  const requestPermission = async (perm) => {
    setStatuses(prev => ({ ...prev, [perm.id]: 'requesting' }))
    const result = await perm.request()
    setStatuses(prev => ({ ...prev, [perm.id]: result }))
  }

  const skipPermission = (id) => setStatuses(prev => ({ ...prev, [id]: 'denied' }))

  const saveToDB = async (finalStatuses) => {
    const perms = {}
    PERMISSIONS.forEach(p => { perms[p.id] = finalStatuses[p.id] || 'denied' })
    setSaving(true)
    try { await api.patch('/user/settings', { browserPermissions: perms }) } catch {}
    setSaving(false)
  }

  const handleDone = async (currentStatuses = statuses) => {
    localStorage.setItem(LOCAL_KEY, '1')
    await saveToDB(currentStatuses)
    setVisible(false)
  }

  const handleAllowAll = async () => {
    const next = { ...statuses }
    for (const perm of PERMISSIONS) {
      if (next[perm.id] === 'idle') {
        setStatuses(prev => ({ ...prev, [perm.id]: 'requesting' }))
        const result = await perm.request()
        next[perm.id] = result
        setStatuses({ ...next })
      }
    }
    await handleDone(next)
  }

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div className="pg-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }} />
          <div className="pg-modal-wrap">
            <motion.div className="pg-modal"
              initial={{ opacity: 0, scale: 0.94, y: 24 }}
              animate={{ opacity: 1, scale: 1,    y: 0  }}
              exit={{   opacity: 0, scale: 0.96,  y: 16 }}
              transition={{ type: 'spring', stiffness: 340, damping: 30 }}>

              <div className="pg-header">
                <div className="pg-logo">AURA</div>
                <h2 className="pg-title">Enable permissions</h2>
                <p className="pg-subtitle">AURA needs a couple of permissions for the best experience. You can change these any time in your browser settings.</p>
              </div>

              <div className="pg-list">
                {PERMISSIONS.map(perm => {
                  const status = statuses[perm.id]
                  return (
                    <motion.div key={perm.id} className={`pg-row ${status !== 'idle' && status !== 'requesting' ? 'pg-row-done' : ''}`} layout>
                      <div className="pg-row-icon">{perm.icon}</div>
                      <div className="pg-row-body">
                        <div className="pg-row-title">{perm.title}</div>
                        <div className="pg-row-desc">{perm.desc}</div>
                        <div className="pg-row-why">{perm.why}</div>
                      </div>
                      <div className="pg-row-action">
                        {status === 'idle' && (
                          <div className="pg-row-btns">
                            <motion.button className="pg-allow-btn" onClick={() => requestPermission(perm)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Allow</motion.button>
                            <button className="pg-skip-btn" onClick={() => skipPermission(perm.id)}>Skip</button>
                          </div>
                        )}
                        {status === 'requesting' && <div className="pg-status pg-requesting"><span className="pg-spinner" /> Asking…</div>}
                        {status === 'granted'     && <div className="pg-status pg-granted"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> Allowed</div>}
                        {(status === 'denied' || status === 'default') && <div className="pg-status pg-denied"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Blocked</div>}
                        {status === 'unsupported' && <div className="pg-status pg-unsupported">Not supported</div>}
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              <div className="pg-footer">
                {!allDone ? (
                  <motion.button className="pg-allow-all-btn" onClick={handleAllowAll} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>Allow all</motion.button>
                ) : (
                  <motion.button className="pg-done-btn" onClick={() => handleDone()} disabled={saving}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    {saving ? 'Saving…' : 'Continue to AURA'}
                  </motion.button>
                )}
                <button className="pg-close-link" onClick={() => handleDone()} disabled={saving}>Maybe later</button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}