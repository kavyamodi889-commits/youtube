// studio/src/components/PermissionsGate/PermissionsGate.jsx
// Asks for camera, microphone, notifications for Studio creators.
// File manager access is shown as informational (browsers don't have a separate API for it).
// Saves results to DB so it never asks again.
import { useState, useEffect } from 'react'
import { useStudioAuth } from '../../context/StudioAuthContext'
import api from '../../services/api'
import './PermissionsGate.css'

const LOCAL_KEY = 'aura_studio_perms_asked_v2'

const PERMISSIONS = [
  {
    id:    'notifications',
    icon:  '🔔',
    title: 'Notifications',
    desc:  'Get alerted about comments, new subscribers, and live activity on your channel.',
    why:   'Required for creator alerts',
    request: async () => {
      if (!('Notification' in window)) return 'unsupported'
      return await Notification.requestPermission()
    },
  },
  {
    id:    'microphone',
    icon:  '🎤',
    title: 'Microphone',
    desc:  'Required for recording audio during live streams and monitoring audio levels.',
    why:   'Required for Live streaming with audio',
    request: async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        s.getTracks().forEach(t => t.stop())
        return 'granted'
      } catch (e) { return e.name === 'NotAllowedError' ? 'denied' : 'unsupported' }
    },
  },
  {
    id:    'camera',
    icon:  '📷',
    title: 'Camera',
    desc:  'Used for live streaming from your webcam and previewing your video before going live.',
    why:   'Required for Live streaming',
    request: async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        s.getTracks().forEach(t => t.stop())
        return 'granted'
      } catch (e) { return e.name === 'NotAllowedError' ? 'denied' : 'unsupported' }
    },
  },
]

export default function StudioPermissionsGate() {
  const { user }                = useStudioAuth()
  const [visible,  setVisible]  = useState(false)
  const [statuses, setStatuses] = useState({ notifications: 'idle', microphone: 'idle', camera: 'idle' })
  const [allDone,  setAllDone]  = useState(false)
  const [saving,   setSaving]   = useState(false)

  useEffect(() => {
    if (!user) return
    const dbPerms = user.browserPermissions || {}
    const alreadyHandled = PERMISSIONS.every(p => dbPerms[p.id] != null)
    if (alreadyHandled) return
    if (localStorage.getItem(LOCAL_KEY)) return
    const t = setTimeout(() => setVisible(true), 1600)
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

  const skip = (id) => setStatuses(prev => ({ ...prev, [id]: 'denied' }))

  const saveToDB = async (finalStatuses) => {
    const perms = {}
    PERMISSIONS.forEach(p => { perms[p.id] = finalStatuses[p.id] || 'denied' })
    setSaving(true)
    try { await api.patch('/user/settings', { browserPermissions: perms }) } catch {}
    setSaving(false)
  }

  const handleDone = async (current = statuses) => {
    localStorage.setItem(LOCAL_KEY, '1')
    await saveToDB(current)
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

  if (!visible) return null

  return (
    <div className="spg-backdrop">
      <div className="spg-modal">
        <div className="spg-header">
          <div className="spg-brand">
            <span className="spg-brand-aura">AURA</span>
            <span className="spg-brand-studio">Studio</span>
          </div>
          <h2 className="spg-title">Creator permissions</h2>
          <p className="spg-sub">Studio needs access to your devices for live streaming and alerts. Grant or skip each one individually.</p>
        </div>

        <div className="spg-list">
          {PERMISSIONS.map(perm => {
            const status = statuses[perm.id]
            const done = status !== 'idle' && status !== 'requesting'
            return (
              <div key={perm.id} className={`spg-row${done ? ' spg-row-done' : ''}`}>
                <div className="spg-row-icon">{perm.icon}</div>
                <div className="spg-row-body">
                  <div className="spg-row-title">{perm.title}</div>
                  <div className="spg-row-desc">{perm.desc}</div>
                  <div className="spg-row-why">{perm.why}</div>
                </div>
                <div className="spg-row-action">
                  {status === 'idle' && (
                    <div className="spg-row-btns">
                      <button className="spg-allow-btn" onClick={() => requestPermission(perm)}>Allow</button>
                      <button className="spg-skip-btn"  onClick={() => skip(perm.id)}>Skip</button>
                    </div>
                  )}
                  {status === 'requesting'  && <div className="spg-status spg-requesting"><span className="spg-spinner" /> Asking…</div>}
                  {status === 'granted'     && <div className="spg-status spg-granted">✓ Allowed</div>}
                  {(status === 'denied' || status === 'default') && <div className="spg-status spg-denied">✕ Blocked</div>}
                  {status === 'unsupported' && <div className="spg-status spg-unsupported">Not supported</div>}
                </div>
              </div>
            )
          })}
        </div>

        <div className="spg-footer">
          {!allDone ? (
            <button className="spg-allow-all-btn" onClick={handleAllowAll}>Allow all</button>
          ) : (
            <button className="spg-done-btn" onClick={() => handleDone()} disabled={saving}>
              {saving ? 'Saving…' : 'Continue to Studio'}
            </button>
          )}
          <button className="spg-skip-link" onClick={() => handleDone()} disabled={saving}>Maybe later</button>
        </div>
      </div>
    </div>
  )
}