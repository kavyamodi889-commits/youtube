// studio/src/pages/LiveControl/LiveControl.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { io } from 'socket.io-client'
import { useStudioAuth } from '../../context/StudioAuthContext'
import './LiveControl.css'

// ── Icons ──────────────────────────────────────────────────────────────────
const EyeIco    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
const HeartIco  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
const StopIco   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
const ChatIco   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
const ClockIco  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
const LinkIco   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
const ArrowIco  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
const SendIco   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
const SaveIco   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
const PeakIco   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>

function fmt(n) {
  if (!n) return '0'
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n/1_000).toFixed(1)}K`
  return String(n)
}

function fmtDuration(ms) {
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = s % 60
  return h > 0
    ? `${h}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`
    : `${m}:${String(ss).padStart(2,'0')}`
}

const STUDIO_API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

async function studioFetch(path, opts = {}) {
  const res = await fetch(`${STUDIO_API}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export default function LiveControl() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const { user }     = useStudioAuth()

  const socketRef    = useRef(null)
  const chatEndRef   = useRef(null)
  const startTimeRef = useRef(null)

  const [stream,       setStream]       = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [viewers,      setViewers]      = useState(0)
  const [peakViewers,  setPeakViewers]  = useState(0)
  const [likeCount,    setLikeCount]    = useState(0)
  const [messages,     setMessages]     = useState([])
  const [chatInput,    setChatInput]    = useState('')
  const [elapsed,      setElapsed]      = useState(0)          // ms
  const [ending,       setEnding]       = useState(false)
  const [showSaveModal,setShowSaveModal]= useState(false)
  const [saveStatus,   setSaveStatus]   = useState(null)       // null | 'saving' | 'saved' | 'error'
  const [copied,       setCopied]       = useState('')

  // ── Load stream data ──────────────────────────────────────────────────────
  useEffect(() => {
    studioFetch(`/live/${id}`)
      .then(d => {
        const s = d.stream
        if (!s) { setError('Stream not found'); return }
        if (String(s.host?._id || s.host) !== String(user?._id)) {
          setError('You are not the host of this stream.')
          return
        }
        setStream(s)
        setViewers(s.currentViewers || 0)
        setPeakViewers(s.peakViewers || 0)
        setLikeCount(s.likeCount    || 0)
        if (s.startedAt) startTimeRef.current = new Date(s.startedAt).getTime()
      })
      .catch(() => setError('Failed to load stream'))
      .finally(() => setLoading(false))
  }, [id, user?._id])

  // ── Load chat history ─────────────────────────────────────────────────────
  useEffect(() => {
    studioFetch(`/live/${id}/chat`)
      .then(d => {
        const msgs = (d.messages || []).map((m, i) => ({
          id: `h${i}`, username: m.username, avatar: m.avatar || null,
          message: m.message, ts: new Date(m.createdAt).getTime(), isHost: m.isHost,
        }))
        setMessages(msgs)
      })
      .catch(() => {})
  }, [id])

  // ── Elapsed timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      if (startTimeRef.current) setElapsed(Date.now() - startTimeRef.current)
    }
    const iv = setInterval(tick, 1000)
    return () => clearInterval(iv)
  }, [])

  // ── Socket connection ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!stream?._id) return
    const origin = STUDIO_API.replace('/api', '')
    const socket = io(origin, { path: '/socket.io', withCredentials: true })
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('user:join', { userId: user?._id })
      socket.emit('stream:join', { streamId: stream._id })
    })
    socket.on('stream:viewers', ({ count }) => {
      setViewers(count)
      setPeakViewers(p => Math.max(p, count))
    })
    socket.on('chat:message', msg => {
      setMessages(p => [...p.slice(-499), msg])
    })
    socket.on('stream:ended', () => {
      setStream(p => ({ ...p, status: 'ended' }))
    })
    return () => socket.disconnect()
  }, [stream?._id, user?._id])

  // ── Auto-scroll chat ──────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Send chat as host ─────────────────────────────────────────────────────
  const sendChat = useCallback(e => {
    e?.preventDefault()
    if (!chatInput.trim() || !socketRef.current || !stream?._id) return
    socketRef.current.emit('chat:message', {
      streamId: stream._id,
      message:  chatInput.trim(),
      username: user?.displayName || user?.username || 'Host',
      avatar:   user?.avatar || null,
      userId:   user?._id,
    })
    setChatInput('')
  }, [chatInput, stream?._id, user])

  // ── End stream (ONLY from here) ────────────────────────────────────────────
  const handleEndStream = async () => {
    if (!window.confirm('End this live stream? This cannot be undone.')) return
    setEnding(true)
    try {
      socketRef.current?.emit('stream:end')
      await studioFetch(`/live/${id}/end`, { method: 'POST' })
      setStream(p => ({ ...p, status: 'ended' }))
      setShowSaveModal(true)
    } catch {
      alert('Failed to end stream. Please try again.')
      setEnding(false)
    }
  }

  // ── Save as video ─────────────────────────────────────────────────────────
  const handleSaveAsVideo = async (save) => {
    if (!save) { navigate('/content'); return }
    setSaveStatus('saving')
    try {
      await studioFetch(`/live/${id}/save-as-video`, { method: 'POST' })
      setSaveStatus('saved')
      setTimeout(() => navigate('/content'), 2000)
    } catch {
      setSaveStatus('error')
    }
  }

  // ── Copy helper ───────────────────────────────────────────────────────────
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label)
      setTimeout(() => setCopied(''), 2000)
    })
  }

  const isLive = stream?.status === 'live'

  if (loading) return (
    <div className="lc-centered">
      <div className="lc-spinner" />
      <p>Loading stream…</p>
    </div>
  )

  if (error) return (
    <div className="lc-centered lc-error-page">
      <div className="lc-error-icon">⚠</div>
      <h2>{error}</h2>
      <Link to="/" className="lc-back-btn"><ArrowIco /> Back to Dashboard</Link>
    </div>
  )

  const clientUrl = `${window.location.origin.replace(':5174', ':5173')}/live/${id}`
  const rtmpUrl   = stream?.rtmpUrl  || ''
  const streamKey = stream?.streamKey || ''

  return (
    <div className="lc-page">

      {/* ── Save modal ── */}
      {showSaveModal && (
        <div className="lc-modal-bg">
          <div className="lc-modal">
            <div className="lc-modal-icon"><SaveIco /></div>
            <h3>Stream Ended</h3>
            <p>Would you like to save this stream as a video on your channel?</p>
            {!saveStatus && (
              <div className="lc-modal-btns">
                <button className="lc-modal-no"  onClick={() => handleSaveAsVideo(false)}>Discard</button>
                <button className="lc-modal-yes" onClick={() => handleSaveAsVideo(true)}>
                  <SaveIco /> Save to Channel
                </button>
              </div>
            )}
            {saveStatus === 'saving' && <p className="lc-modal-status">Saving stream as video…</p>}
            {saveStatus === 'saved'  && <p className="lc-modal-status lc-ok">✓ Saved! Redirecting to Content…</p>}
            {saveStatus === 'error'  && (
              <p className="lc-modal-status lc-err">
                Error saving.{' '}
                <button onClick={() => setSaveStatus(null)} className="lc-retry">Retry</button>
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="lc-header">
        <div className="lc-header-left">
          <Link to="/" className="lc-back"><ArrowIco /> Dashboard</Link>
          <div className="lc-title-wrap">
            <h1 className="lc-stream-title">{stream?.title || 'Live Stream'}</h1>
            <div className="lc-header-meta">
              {isLive
                ? <span className="lc-badge-live"><span className="lc-live-dot" />LIVE</span>
                : <span className="lc-badge-ended">ENDED</span>
              }
              <span className="lc-category">{stream?.category || 'General'}</span>
              {stream?.visibility && (
                <span className="lc-visibility">{stream.visibility}</span>
              )}
            </div>
          </div>
        </div>

        <div className="lc-header-right">
          <a
            href={clientUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="lc-view-btn"
          >
            <LinkIco /> View Stream
          </a>
          {isLive && (
            <button
              className="lc-end-btn"
              onClick={handleEndStream}
              disabled={ending}
            >
              <StopIco />
              {ending ? 'Ending…' : 'End Stream'}
            </button>
          )}
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="lc-grid">

        {/* ── Left column: stats + stream info ── */}
        <div className="lc-left">

          {/* Stats row */}
          <div className="lc-stats-row">
            <div className="lc-stat-card lc-stat-live">
              <div className="lc-stat-icon lc-icon-viewers"><EyeIco /></div>
              <div>
                <div className="lc-stat-val">{fmt(viewers)}</div>
                <div className="lc-stat-lbl">Live Viewers</div>
              </div>
            </div>
            <div className="lc-stat-card">
              <div className="lc-stat-icon lc-icon-peak"><PeakIco /></div>
              <div>
                <div className="lc-stat-val">{fmt(peakViewers)}</div>
                <div className="lc-stat-lbl">Peak Viewers</div>
              </div>
            </div>
            <div className="lc-stat-card">
              <div className="lc-stat-icon lc-icon-likes"><HeartIco /></div>
              <div>
                <div className="lc-stat-val">{fmt(likeCount)}</div>
                <div className="lc-stat-lbl">Likes</div>
              </div>
            </div>
            <div className="lc-stat-card">
              <div className="lc-stat-icon lc-icon-duration"><ClockIco /></div>
              <div>
                <div className="lc-stat-val">{fmtDuration(elapsed)}</div>
                <div className="lc-stat-lbl">{isLive ? 'Duration' : 'Total Duration'}</div>
              </div>
            </div>
          </div>

          {/* Stream connection info */}
          <div className="lc-section">
            <h2 className="lc-section-title">OBS / Encoder Settings</h2>
            <div className="lc-info-grid">
              <div className="lc-info-row">
                <span className="lc-info-label">RTMP Server</span>
                <div className="lc-info-val-row">
                  <code className="lc-code">{rtmpUrl}</code>
                  <button
                    className={`lc-copy-btn ${copied === 'rtmp' ? 'lc-copied' : ''}`}
                    onClick={() => copyToClipboard(rtmpUrl, 'rtmp')}
                  >
                    {copied === 'rtmp' ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>
              <div className="lc-info-row">
                <span className="lc-info-label">Stream Key</span>
                <div className="lc-info-val-row">
                  <code className="lc-code lc-key-blur">{streamKey}</code>
                  <button
                    className={`lc-copy-btn ${copied === 'key' ? 'lc-copied' : ''}`}
                    onClick={() => copyToClipboard(streamKey, 'key')}
                  >
                    {copied === 'key' ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>
              <div className="lc-info-row">
                <span className="lc-info-label">Stream URL</span>
                <div className="lc-info-val-row">
                  <code className="lc-code">{clientUrl}</code>
                  <button
                    className={`lc-copy-btn ${copied === 'url' ? 'lc-copied' : ''}`}
                    onClick={() => copyToClipboard(clientUrl, 'url')}
                  >
                    {copied === 'url' ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {stream?.description && (
            <div className="lc-section">
              <h2 className="lc-section-title">Description</h2>
              <p className="lc-desc-text">{stream.description}</p>
            </div>
          )}

          {/* Ended state */}
          {!isLive && !showSaveModal && (
            <div className="lc-ended-banner">
              <span className="lc-ended-icon">⏹</span>
              <div>
                <div className="lc-ended-title">Stream has ended</div>
                <div className="lc-ended-sub">Go to <Link to="/content" className="lc-link">Content</Link> to manage your videos</div>
              </div>
            </div>
          )}
        </div>

        {/* ── Right column: live chat ── */}
        <div className="lc-chat-panel">
          <div className="lc-chat-header">
            <span className="lc-chat-label"><ChatIco /> Live Chat</span>
            <span className="lc-chat-count"><EyeIco /> {viewers} watching</span>
          </div>

          <div className="lc-chat-feed">
            {messages.length === 0 && (
              <div className="lc-chat-empty">
                <p>No messages yet.</p>
                <p>Chat will appear here in real time.</p>
              </div>
            )}
            {messages.map(msg => (
              <div key={msg.id} className={`lc-chat-row ${msg.isHost ? 'lc-chat-host' : ''}`}>
                <div className="lc-chat-avi">
                  {msg.avatar
                    ? <img src={msg.avatar} alt="" />
                    : <span>{msg.username?.[0]?.toUpperCase() || '?'}</span>
                  }
                </div>
                <div className="lc-chat-content">
                  <span className="lc-chat-name">
                    {msg.username}
                    {msg.isHost && <span className="lc-host-badge">HOST</span>}
                  </span>
                  <span className="lc-chat-text"> {msg.message}</span>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <form className="lc-chat-form" onSubmit={sendChat}>
            <input
              className="lc-chat-input"
              placeholder="Send a message as host…"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              maxLength={300}
              disabled={!isLive}
            />
            <button
              type="submit"
              className="lc-chat-send"
              disabled={!chatInput.trim() || !isLive}
            >
              <SendIco />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}