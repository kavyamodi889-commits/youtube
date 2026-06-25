// src/pages/Users/Users.jsx
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAdminFetch, adminAction } from '../../hooks/useAdminAPI.js'
import ExportBar from '../../components/ExportBar/ExportBar.jsx'
import FilterDropdown from '../../components/FilterDropdown/FilterDropdown.jsx'
import { exportUsersPDF, exportUsersCSV } from '../../utils/exportReports.js'

const SearchIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
const BanIcon    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
const CheckIcon  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const EditIcon   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const XIcon      = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>

const ROLE_BADGE = { admin:'red', moderator:'blue', creator:'teal', user:'green' }

// Role filter — no moderator/admin
const ROLE_OPTIONS = [
  { value:'all',     label:'All Users' },
  { value:'user',    label:'👤 User' },
  { value:'creator', label:'🎬 Creator' },
]

export default function Users() {
  const [page, setPage]       = useState(1)
  const [search, setSearch]   = useState('')
  const [searchQ, setSearchQ] = useState('')
  const [role, setRole]       = useState('all')
  const [banModal, setBan]    = useState(null)
  const [roleModal, setRole2] = useState(null)
  const [toast, setToast]     = useState('')

  const { data, loading, error, refetch } = useAdminFetch(
    '/admin/users', { page, limit: 20, search: searchQ, role },
    [page, searchQ, role]
  )

  const users = data?.users || []
  const total = data?.total || 0
  const pages = data?.pages || 1

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const doBan = async (userId, reason, isBanned) => {
    try {
      await adminAction('patch', isBanned ? `/admin/users/${userId}/unban` : `/admin/users/${userId}/ban`, { reason })
      showToast(isBanned ? 'User unbanned' : 'User banned')
      setBan(null); refetch()
    } catch (e) { showToast('Error: ' + (e.response?.data?.message || e.message)) }
  }

  const doRole = async (userId, newRole) => {
    try {
      await adminAction('patch', `/admin/users/${userId}/role`, { role: newRole })
      showToast('Role updated')
      setRole2(null); refetch()
    } catch (e) { showToast('Error: ' + (e.response?.data?.message || e.message)) }
  }

  const doVerify = async (userId) => {
    try {
      await adminAction('patch', `/admin/users/${userId}/verify`)
      showToast('Verification toggled')
      refetch()
    } catch (e) { showToast('Error: ' + (e.response?.data?.message || e.message)) }
  }

  useEffect(() => {
    const t = setTimeout(() => { setSearchQ(search); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [search])

  return (
    <div className="admin-page">
      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, background:'var(--s4)', border:'1px solid var(--s4)', borderRadius:'var(--r-md)', padding:'10px 18px', color:'var(--t1)', fontWeight:600, fontSize:'0.85rem', zIndex:999, boxShadow:'0 8px 32px rgba(0,0,0,0.4)' }}>
          {toast}
        </div>
      )}
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">{total.toLocaleString()} total users</p>
        </div>
        <ExportBar onPDF={() => exportUsersPDF(users)} onCSV={() => exportUsersCSV(users)} />
      </div>

      <div className="table-toolbar">
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <FilterDropdown label="All Users" value={role} options={ROLE_OPTIONS} onChange={v => { setRole(v); setPage(1) }} />
        </div>
        <div className="admin-search">
          <SearchIcon />
          <input placeholder="Search username, email…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'var(--t3)' }}>Loading users…</div>
      ) : error ? (
        <div style={{ color:'var(--err)', padding:'40px 0' }}>Error: {error}</div>
      ) : (
        <>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>User</th><th>Role</th><th>Status</th><th>Plan</th><th>Subs</th><th>Videos</th><th>Joined</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div className="user-avatar">
                          {u.avatar ? <img src={u.avatar} alt={u.username} /> : u.username?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight:600, fontSize:'0.875rem' }}>{u.displayName || u.username}</div>
                          <div style={{ fontSize:'0.72rem', color:'var(--t3)' }}>@{u.username} · {u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge ${ROLE_BADGE[u.role]}`}>{u.role}</span></td>
                    <td>
                      <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                        <span className={`badge ${u.isBanned?'red':'green'}`}>{u.isBanned?'Banned':'Active'}</span>
                        {u.isChannelVerified && <span className="badge teal">✓</span>}
                      </div>
                    </td>
                    <td>{u.membershipTier==='none'?<span style={{color:'var(--t3)'}}>—</span>:<span className="badge blue">{u.membershipTier}</span>}</td>
                    <td style={{ fontWeight:600 }}>{(u.subscriberCount||0).toLocaleString()}</td>
                    <td>{u.videoCount||0}</td>
                    <td style={{ color:'var(--t3)', fontSize:'0.78rem' }}>{new Date(u.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td>
                    <td>
                      <div style={{ display:'flex', gap:4 }}>
                        <button className="icon-btn" title="Change Role" onClick={() => setRole2(u)}><EditIcon /></button>
                        <button className="icon-btn success" title={u.isChannelVerified?'Unverify':'Verify'} onClick={() => doVerify(u._id)}>
                          {u.isChannelVerified ? <XIcon /> : <CheckIcon />}
                        </button>
                        <button className="icon-btn danger" title={u.isBanned?'Unban':'Ban'} onClick={() => setBan(u)}><BanIcon /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && <div className="empty-state">No users match your filter.</div>}
          {pages > 1 && (
            <div className="pagination">
              <button className="page-btn" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}>‹</button>
              {Array.from({ length: Math.min(7, pages) }, (_, i) => {
                const p = page <= 4 ? i+1 : page - 3 + i
                if (p < 1 || p > pages) return null
                return <button key={p} className={`page-btn ${page===p?'active':''}`} onClick={() => setPage(p)}>{p}</button>
              })}
              <button className="page-btn" onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page===pages}>›</button>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {banModal && <BanModal user={banModal} onClose={() => setBan(null)} onConfirm={doBan} />}
        {roleModal && <RoleModal user={roleModal} onClose={() => setRole2(null)} onConfirm={doRole} />}
      </AnimatePresence>
    </div>
  )
}

function BanModal({ user, onClose, onConfirm }) {
  const [reason, setReason] = useState(user.banReason || '')
  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div className="modal-box" onClick={e => e.stopPropagation()} initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}>
        <div className="modal-title" style={{ color: user.isBanned ? 'var(--ok)' : 'var(--err)' }}>
          {user.isBanned ? '🔓 Unban User' : '🚫 Ban User'}
        </div>
        <p style={{ color:'var(--t2)', fontSize:'0.875rem', marginBottom:16 }}>
          {user.isBanned ? `Remove ban from @${user.username}?` : `Ban @${user.username}?`}
        </p>
        {!user.isBanned && (
          <div className="field-group">
            <div className="field-label">Ban Reason</div>
            <input className="field-input" value={reason} onChange={e => setReason(e.target.value)} placeholder="Spam, harassment, policy violation…" />
          </div>
        )}
        <div className="modal-actions">
          <button className="action-btn secondary" onClick={onClose}>Cancel</button>
          <button className={`action-btn ${user.isBanned?'primary':'danger'}`} onClick={() => onConfirm(user._id, reason, user.isBanned)}>
            {user.isBanned ? 'Unban' : 'Ban User'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function RoleModal({ user, onClose, onConfirm }) {
  const [role, setR] = useState(user.role)
  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div className="modal-box" onClick={e => e.stopPropagation()} initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}>
        <div className="modal-title">Change Role — @{user.username}</div>
        <div className="field-group">
          <div className="field-label">New Role</div>
          {/* Only user and creator options — no moderator/admin */}
          <select className="field-select" value={role} onChange={e => setR(e.target.value)}>
            <option value="user">User</option>
            <option value="creator">Creator</option>
          </select>
        </div>
        <div className="modal-actions">
          <button className="action-btn secondary" onClick={onClose}>Cancel</button>
          <button className="action-btn primary" onClick={() => onConfirm(user._id, role)}>Update Role</button>
        </div>
      </motion.div>
    </div>
  )
}