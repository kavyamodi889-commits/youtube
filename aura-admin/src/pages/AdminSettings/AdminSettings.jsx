// src/pages/AdminSettings/AdminSettings.jsx
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAdminFetch, adminAction } from '../../hooks/useAdminAPI.js'
import { useTheme } from '../../context/ThemeContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

function Toggle({ value, onChange, disabled }) {
  return (
    <motion.button
      onClick={() => !disabled && onChange(!value)}
      whileTap={!disabled ? { scale: 0.94 } : {}}
      style={{
        width:44, height:24, borderRadius:99, border:'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: value ? 'var(--a)' : 'var(--s4)',
        position:'relative', transition:'background 0.2s',
        opacity: disabled ? 0.5 : 1, flexShrink:0,
      }}
    >
      <motion.div
        animate={{ x: value ? 22 : 2 }}
        transition={{ type:'spring', stiffness:500, damping:30 }}
        style={{ width:18, height:18, borderRadius:'50%', background:'#fff', position:'absolute', top:3 }}
      />
    </motion.button>
  )
}

function Row({ label, sub, children, danger }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid var(--s2)' }}>
      <div style={{ flex:1, minWidth:0, paddingRight:16 }}>
        <div style={{ fontSize:'0.875rem', fontWeight:600, color: danger ? 'var(--err)' : 'var(--t1)' }}>{label}</div>
        {sub && <div style={{ fontSize:'0.75rem', color:'var(--t3)', marginTop:2 }}>{sub}</div>}
      </div>
      <div style={{ flexShrink:0 }}>{children}</div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="glass-card" style={{ marginBottom:20 }}>
      <div className="section-title" style={{ marginBottom:4 }}>{title}</div>
      {children}
    </div>
  )
}

const DEFAULT_FLAGS = {
  maintenanceMode: false, registrationOpen: true, premiumEnabled: true,
  liveEnabled: true, shortsEnabled: true, adsEnabled: true,
  emailVerifRequired: true, autoModeration: true, profanityFilter: true,
  spamDetection: true, twoFARequired: false, focusModeEnabled: true,
  aiSummaries: true, pushNotifEnabled: true, analyticsEnabled: true,
}

export default function AdminSettings() {
  const { theme, setTheme, saving: themeSaving } = useTheme()
  // Local pending theme — only applied to DB when user clicks Save to DB
  const [pendingTheme, setPendingTheme] = useState(theme)
  const { user, logout } = useAuth()

  // Keep pendingTheme in sync when theme changes externally (e.g. after DB save)
  useEffect(() => { setPendingTheme(theme) }, [theme])
  const [flags, setFlags]   = useState(DEFAULT_FLAGS)
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [toast,  setToast]  = useState('')

  const { data: flagsData, loading: flagsLoading } = useAdminFetch('/admin/settings/flags')
  const { data: teamData,  loading: teamLoading  } = useAdminFetch('/admin/settings/team')

  useEffect(() => {
    if (flagsData?.flags) setFlags(flagsData.flags)
  }, [flagsData])

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const setFlag = key => val => setFlags(prev => ({ ...prev, [key]: val }))

  const saveFlags = async () => {
    setSaving(true)
    try {
      await adminAction('patch', '/admin/settings/flags', { flags })
      // Also save theme if it changed
      if (pendingTheme !== theme) {
        await setTheme(pendingTheme)
      }
      setSaved(true); setTimeout(() => setSaved(false), 2500)
      showToast('Settings saved to database')
    } catch (e) {
      showToast('Error: ' + (e.response?.data?.message || e.message))
    } finally {
      setSaving(false)
    }
  }

  const team = teamData?.team || []

  return (
    <div className="admin-page">
      {toast && <div style={{ position:'fixed', bottom:24, right:24, background:'var(--s4)', borderRadius:'var(--r-md)', padding:'10px 18px', color:'var(--t1)', fontWeight:600, fontSize:'0.85rem', zIndex:999 }}>{toast}</div>}
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Settings</h1>
          <p className="page-subtitle">Platform feature flags — saved to MongoDB</p>
        </div>
        <button className="action-btn primary" onClick={saveFlags} disabled={saving}>
          {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save to DB'}
        </button>
      </div>

      {flags.maintenanceMode && (
        <div style={{ background:'rgba(166,60,60,0.12)', border:'1px solid rgba(166,60,60,0.35)', borderRadius:'var(--r-md)', padding:'12px 16px', marginBottom:20, color:'#f87171', fontWeight:600, fontSize:'0.875rem' }}>
          ⚠ Maintenance Mode is ON — platform inaccessible to regular users
        </div>
      )}

      {/* Appearance — connected to real DB via ThemeContext → PATCH /api/user/settings */}
      <Section title="Appearance">
        <Row label="Admin Panel Theme" sub={`Saved to your AdminUser account in MongoDB · ${themeSaving ? 'Saving…' : pendingTheme !== theme ? 'Click Save to DB to apply' : 'Saved'}`}>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {['dark','light'].map(t => (
              <button key={t}
                className={`filter-chip ${pendingTheme===t?'active':''}`}
                onClick={() => setPendingTheme(t)}
                style={{ opacity: 1 }}>
                {t === 'dark' ? '🌙 Dark' : '☀️ Light'}
              </button>
            ))}
            {pendingTheme !== theme && (
              <span style={{ fontSize:'0.72rem', color:'var(--t3)', fontStyle:'italic' }}>unsaved</span>
            )}
          </div>
        </Row>
        <Row label="Signed in as" sub={`Admin account · Role: ${user?.role || '—'} · Collection: adminusers`}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div className="user-avatar">
              {user?.avatar ? <img src={user.avatar} alt={user.username} /> : user?.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize:'0.85rem', fontWeight:600 }}>{user?.displayName || user?.username}</div>
              <div style={{ fontSize:'0.72rem', color:'var(--t3)' }}>{user?.email}</div>
            </div>
            <button className="action-btn danger" style={{ marginLeft:8 }} onClick={logout}>Sign Out</button>
          </div>
        </Row>
      </Section>

      {flagsLoading ? (
        <div style={{ textAlign:'center', padding:'40px 0', color:'var(--t3)' }}>Loading flags from DB…</div>
      ) : (
        <>
          {/* Platform Operations */}
          <Section title="Platform Operations">
            <Row label="Maintenance Mode" sub="Blocks all non-admin access" danger>
              <Toggle value={flags.maintenanceMode} onChange={setFlag('maintenanceMode')} />
            </Row>
            <Row label="User Registration Open" sub="Allow new accounts">
              <Toggle value={flags.registrationOpen} onChange={setFlag('registrationOpen')} />
            </Row>
            <Row label="Email Verification Required" sub="New accounts must verify email">
              <Toggle value={flags.emailVerifRequired} onChange={setFlag('emailVerifRequired')} />
            </Row>
            <Row label="Analytics Collection" sub="Platform-wide usage tracking">
              <Toggle value={flags.analyticsEnabled} onChange={setFlag('analyticsEnabled')} />
            </Row>
          </Section>

          {/* Feature Flags */}
          <Section title="Feature Flags">
            <Row label="AURA Premium" sub="Enable subscription plans & Razorpay payments">
              <Toggle value={flags.premiumEnabled} onChange={setFlag('premiumEnabled')} />
            </Row>
            <Row label="Live Streaming" sub="Allow RTMP/WebRTC live streams">
              <Toggle value={flags.liveEnabled} onChange={setFlag('liveEnabled')} />
            </Row>
            <Row label="Shorts" sub="Vertical short-form video feed">
              <Toggle value={flags.shortsEnabled} onChange={setFlag('shortsEnabled')} />
            </Row>
            <Row label="Advertisements" sub="Ad campaign system">
              <Toggle value={flags.adsEnabled} onChange={setFlag('adsEnabled')} />
            </Row>
            <Row label="Focus Mode" sub="Focus sessions & wellbeing features">
              <Toggle value={flags.focusModeEnabled} onChange={setFlag('focusModeEnabled')} />
            </Row>
            <Row label="AI Summaries" sub="Gemini AI chapter & description generation">
              <Toggle value={flags.aiSummaries} onChange={setFlag('aiSummaries')} />
            </Row>
            <Row label="Push Notifications" sub="VAPID push notification support">
              <Toggle value={flags.pushNotifEnabled} onChange={setFlag('pushNotifEnabled')} />
            </Row>
          </Section>

          {/* Auto Moderation */}
          <Section title="Auto Moderation">
            <Row label="Auto Moderation Engine" sub="Flag suspected violations automatically">
              <Toggle value={flags.autoModeration} onChange={setFlag('autoModeration')} />
            </Row>
            <Row label="Profanity Filter" sub="Filter profanity from comments">
              <Toggle value={flags.profanityFilter} onChange={setFlag('profanityFilter')} />
            </Row>
            <Row label="Spam Detection" sub="ML-based bot & spam detection">
              <Toggle value={flags.spamDetection} onChange={setFlag('spamDetection')} />
            </Row>
          </Section>

          {/* Security */}
          <Section title="Security">
            <Row label="Require 2FA for Admins" sub="Mandatory for admin & moderator accounts">
              <Toggle value={flags.twoFARequired} onChange={setFlag('twoFARequired')} />
            </Row>
          </Section>
        </>
      )}

      {/* Admin Team */}
      <Section title="Admin Team">
        {teamLoading
          ? <div style={{ textAlign:'center', padding:'20px 0', color:'var(--t3)', fontSize:'0.85rem' }}>Loading team…</div>
          : team.length === 0
            ? <div className="empty-state" style={{ padding:'20px 0' }}>No admin accounts found</div>
            : (
              <div className="data-table-wrap" style={{ margin:'12px -16px -16px', border:'none', borderRadius:'0 0 var(--r-lg) var(--r-lg)' }}>
                <table className="data-table">
                  <thead><tr><th>User</th><th>Role</th><th>Joined</th></tr></thead>
                  <tbody>
                    {team.map(a => (
                      <tr key={a._id}>
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <div className="user-avatar">
                              {a.avatar ? <img src={a.avatar} alt={a.username} /> : a.username?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight:600, fontSize:'0.875rem' }}>{a.displayName || a.username}</div>
                              <div style={{ fontSize:'0.72rem', color:'var(--t3)' }}>@{a.username}</div>
                            </div>
                          </div>
                        </td>
                        <td><span className={`badge ${a.role==='admin'?'red':'blue'}`}>{a.role}</span></td>
                        <td style={{ color:'var(--t3)', fontSize:'0.82rem' }}>
                          {new Date(a.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
        }
      </Section>

      {/* Danger Zone */}
      <div className="glass-card" style={{ border:'1px solid rgba(166,60,60,0.3)', marginBottom:20 }}>
        <div className="section-title" style={{ color:'var(--err)', marginBottom:12 }}>Danger Zone</div>
        <p style={{ fontSize:'0.82rem', color:'var(--t3)', marginBottom:14 }}>
          These actions are irreversible. They operate directly on the production MongoDB database.
        </p>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          <button className="action-btn danger" onClick={() => showToast('Cache clear would be triggered here')}>Clear Platform Cache</button>
          <button className="action-btn danger" onClick={() => showToast('CDN purge would be triggered here')}>Purge CDN Assets</button>
          <button className="action-btn danger" onClick={() => showToast('Rate limit reset would be triggered here')}>Reset Rate Limits</button>
        </div>
      </div>
    </div>
  )
}