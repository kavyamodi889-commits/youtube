// FILE: client/src/pages/Live/LivePage.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import Hls from 'hls.js'
import { io } from 'socket.io-client'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext.jsx'
import { timeAgo } from '../../utils/formatUtils.js'
import VideoCard from '../../components/VideoCard/VideoCard.jsx'
import './LivePage.css'

// ── Icons ──────────────────────────────────────────────────────────
const EyeIco    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
const HeartIco  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
const ShareIco  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
const DislikeIco = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17"/></svg>
const FlagIco    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
const StopIco   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
const SaveIco   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
const OffIco    = () => <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 010 8.49M7.76 16.24a6 6 0 010-8.49M19.07 4.93a10 10 0 010 14.14M4.93 19.07a10 10 0 010-14.14"/><line x1="2" y1="2" x2="22" y2="22" strokeWidth="2"/></svg>
const SendIco   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
const MuteIco   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
const VolumeIco = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>
const FullIco   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
const ChatIco   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>

const NO_THUMB = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='336' height='188'%3E%3Crect width='336' height='188' fill='%230e0e20'/%3E%3C/svg%3E"

// ── Latency options ──────────────────────────────────────────────
const LATENCY_OPTIONS = [
  { label: 'Ultra-low (3s)',  sync: 1, maxLatency: 3,  buffer: 3  },
  { label: 'Low (5s)',        sync: 2, maxLatency: 5,  buffer: 5  },
  { label: 'Normal (15s)',    sync: 4, maxLatency: 15, buffer: 15 },
  { label: 'Relaxed (30s)',   sync: 8, maxLatency: 30, buffer: 30 },
  { label: '1 min delay',     sync: 20,maxLatency: 60, buffer: 60 },
]

export default function LivePage() {
  const { id }   = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const videoRef     = useRef(null)
  const hlsRef       = useRef(null)
  const socketRef    = useRef(null)
  const chatEndRef   = useRef(null)
  const containerRef = useRef(null)
  const thumbTimerRef = useRef(null)

  // Stream state
  const [stream,        setStream]        = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState('')
  const [viewers,       setViewers]       = useState(0)
  const [messages,      setMessages]      = useState([])
  const [chatInput,     setChatInput]     = useState('')
  const [liked,         setLiked]         = useState(false)
  const [likeCount,     setLikeCount]     = useState(0)
  const [playerErr,     setPlayerErr]     = useState(false)
  const [ending,        setEnding]        = useState(false)
  const [shareMsg,      setShareMsg]      = useState('')
  const [related,       setRelated]       = useState([])
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saveStatus,    setSaveStatus]    = useState(null)
  const [disliked,      setDisliked]      = useState(false)
  const [subscribed,    setSubscribed]    = useState(false)
  const [subCount,      setSubCount]      = useState(0)
  const [showReport,    setShowReport]    = useState(false)
  const [reportReason,  setReportReason]  = useState('')
  const [reportDone,    setReportDone]    = useState(false)

  // Player custom controls state
  const [muted,         setMuted]         = useState(false)
  const [volume,        setVolume]        = useState(1)
  const [fullscreen,    setFullscreen]    = useState(false)
  const [showCtrl,      setShowCtrl]      = useState(true)
  const [chatOpen,      setChatOpen]      = useState(true)
  const [latencyIdx,    setLatencyIdx]    = useState(0) // index into LATENCY_OPTIONS

  const ctrlTimer = useRef(null)

  // Auto-hide controls
  const resetCtrlTimer = useCallback(() => {
    setShowCtrl(true)
    clearTimeout(ctrlTimer.current)
    ctrlTimer.current = setTimeout(() => setShowCtrl(false), 3000)
  }, [])

  // Fullscreen change
  useEffect(() => {
    const onFS = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFS)
    return () => document.removeEventListener('fullscreenchange', onFS)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen()
    else document.exitFullscreen()
  }
  const toggleMute = () => {
    if (!videoRef.current) return
    videoRef.current.muted = !videoRef.current.muted
    setMuted(videoRef.current.muted)
  }
  const changeVolume = (v) => {
    if (!videoRef.current) return
    videoRef.current.volume = v
    videoRef.current.muted  = v === 0
    setVolume(v); setMuted(v === 0)
  }

  // Apply latency setting to running HLS instance
  const applyLatency = useCallback((idx) => {
    setLatencyIdx(idx)
    const opt = LATENCY_OPTIONS[idx]
    if (hlsRef.current) {
      hlsRef.current.config.liveSyncDurationCount        = opt.sync
      hlsRef.current.config.liveMaxLatencyDurationCount  = opt.maxLatency
      hlsRef.current.config.maxBufferLength              = opt.buffer
    }
  }, [])

  // Auto-capture thumbnail from video every 30s
  const captureThumbnail = useCallback(() => {
    const video = videoRef.current
    if (!video || !stream?._id || stream.thumbnailUrl) return // skip if already has thumbnail
    try {
      const canvas = document.createElement('canvas')
      canvas.width  = video.videoWidth  || 1280
      canvas.height = video.videoHeight || 720
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(blob => {
        if (!blob) return
        const fd = new FormData()
        fd.append('thumbnail', blob, 'auto-thumb.jpg')
        api.post(`/live/${stream._id}/thumbnail`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        }).catch(() => {})
      }, 'image/jpeg', 0.8)
    } catch {}
  }, [stream?._id, stream?.thumbnailUrl])

  // Load stream data
  useEffect(() => {
    const load = async () => {
      try {
        const r = await api.get(`/live/${id}`)
        const s = r.data.stream
        setStream(s)
        setViewers(s?.currentViewers || 0)
        setLikeCount(s?.likeCount || 0)
        // Chat history
        const cr = await api.get(`/live/${id}/chat`).catch(() => ({ data: { messages: [] } }))
        setMessages((cr.data.messages || []).map((m, i) => ({
          id: `h${i}`, username: m.username, avatar: m.avatar || null,
          message: m.message, ts: new Date(m.createdAt).getTime(),
        })))
        // Related videos
        const cat = s?.category ? `&category=${encodeURIComponent(s.category)}` : ''
        const vr = await api.get(`/videos?limit=8${cat}`).catch(() => ({ data: { videos: [] } }))
        setRelated(vr.data.videos || [])
        setSubCount(s?.host?.subscriberCount || 0)
        // Subscription status
        if (s?.host?._id) {
          api.get(`/interactions/channel/${s.host._id}/status`)
            .then(r => { if (r.data.subscribed !== undefined) setSubscribed(r.data.subscribed) })
            .catch(() => {})
        }
      } catch { setError('Stream not found') }
      finally  { setLoading(false) }
    }
    load()
  }, [id])

  // HLS player with selectable latency
  useEffect(() => {
    if (!stream?.hlsUrl || !videoRef.current) return
    if (stream.status === 'ended') return
    const video = videoRef.current
    setPlayerErr(false)
    const opt = LATENCY_OPTIONS[latencyIdx]

    if (Hls.isSupported()) {
      const hls = new Hls({
        liveSyncDurationCount:        opt.sync,
        liveMaxLatencyDurationCount:  opt.maxLatency,
        maxBufferLength:              opt.buffer,
        maxMaxBufferLength:           opt.buffer,
        highBufferWatchdogPeriod:     0.5,
        manifestLoadingMaxRetry:      12,
        manifestLoadingRetryDelay:    2000,
        levelLoadingMaxRetry:         6,
        fragLoadingMaxRetry:          6,
      })
      hlsRef.current = hls
      hls.loadSource(stream.hlsUrl)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {})
        setPlayerErr(false)
        // Start auto-thumbnail capture every 30s
        thumbTimerRef.current = setInterval(captureThumbnail, 30000)
        setTimeout(captureThumbnail, 5000) // first capture after 5s
      })
      hls.on(Hls.Events.ERROR, (_, d) => {
        if (d.fatal) {
          if (d.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad()
          else setPlayerErr(true)
        }
      })
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = stream.hlsUrl
      video.play().catch(() => {})
    } else {
      setPlayerErr(true)
    }
    return () => {
      hlsRef.current?.destroy()
      clearInterval(thumbTimerRef.current)
    }
  }, [stream?.hlsUrl, stream?.status]) // eslint-disable-line

  // Socket
  useEffect(() => {
    if (!stream?._id) return
    const socket = io(window.location.origin, { path: '/socket.io', withCredentials: true })
    socketRef.current = socket
    socket.on('connect', () => socket.emit('stream:join', { streamId: stream._id }))
    socket.on('stream:viewers', ({ count }) => setViewers(count))
    socket.on('chat:message', msg => setMessages(p => [...p.slice(-299), msg]))
    socket.on('stream:ended', () => {
      setStream(p => {
        if (user && p && String(user._id) === String(p.host?._id)) setShowSaveModal(true)
        return { ...p, status: 'ended' }
      })
      hlsRef.current?.destroy()
      clearInterval(thumbTimerRef.current)
    })
    return () => socket.disconnect()
  }, [stream?._id, user])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendChat = useCallback((e) => {
    e?.preventDefault()
    if (!chatInput.trim() || !socketRef.current) return
    socketRef.current.emit('chat:message', {
      streamId: stream._id, message: chatInput.trim(),
      username: user?.displayName || user?.username || 'Guest',
      avatar: user?.avatar || null, userId: user?._id,
    })
    setChatInput('')
  }, [chatInput, stream?._id, user])

  const handleEndStream = async () => {
    if (!window.confirm('End this live stream?')) return
    setEnding(true)
    try {
      socketRef.current?.emit('stream:end')
      await api.post(`/live/${id}/end`)
      setShowSaveModal(true)
    } catch { setEnding(false) }
  }

  const handleSaveAsVideo = async (save) => {
    if (save) {
      setSaveStatus('saving')
      try {
        await api.post(`/live/${id}/save-as-video`)
        setSaveStatus('saved')
        setTimeout(() => navigate('/'), 1800)
      } catch { setSaveStatus('error') }
    } else {
      navigate('/')
    }
  }

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href).catch(() => {})
    setShareMsg('Copied!'); setTimeout(() => setShareMsg(''), 2000)
  }

  const handleSubscribe = async () => {
    if (!user || !stream?.host?._id) return
    try {
      const r = await api.post(`/interactions/channel/${stream.host._id}/subscribe`)
      setSubscribed(r.data.subscribed)
      setSubCount(r.data.subscriberCount ?? subCount)
    } catch {}
  }

  const handleReport = async () => {
    if (!reportReason) return
    try {
      await api.post(`/live/${id}/report`, { reason: reportReason })
      setReportDone(true)
      setTimeout(() => { setShowReport(false); setReportDone(false); setReportReason('') }, 2000)
    } catch {}
  }

  const isHost    = user && stream && String(user._id) === String(stream.host?._id)
  const isLive    = stream?.status === 'live'
  const ch        = stream?.host || {}
  const hostAvatar = ch.avatar || null
  const hostName   = ch.displayName || ch.username || 'Host'

  const adaptVideo = v => ({
    _id: v._id, title: v.title,
    thumbnail: v.thumbnailUrl || NO_THUMB, thumbnailUrl: v.thumbnailUrl || NO_THUMB,
    duration: v.duration || 0, views: v.viewCount || 0,
    uploadedAt: v.createdAt, tags: [], videoUrl: v.videoUrl || '',
    channel: {
      _id: v.uploader?._id,
      name: v.uploader?.displayName || v.uploader?.username || 'Unknown',
      avatar: v.uploader?.avatar || '', verified: false,
    },
  })

  if (loading) return <div className="lp-loading"><div className="lp-spinner"/><p>Loading stream…</p></div>
  if (error)   return <div className="lp-error"><OffIco/><p>{error}</p><Link to="/" className="lp-home-btn">Go Home</Link></div>

  return (
    <div className="lp-page">

      {/* ── Report modal ── */}
      {showReport && (
        <div className="lp-modal-bg" onClick={() => setShowReport(false)}>
          <div className="lp-modal" onClick={e => e.stopPropagation()}>
            {reportDone ? (
              <>
                <div className="lp-modal-icon" style={{color:'var(--success,#22c55e)'}}>✓</div>
                <h3>Report Submitted</h3>
                <p>Thanks for helping keep AURA safe.</p>
              </>
            ) : (
              <>
                <h3 className="lp-modal-title">Report Stream</h3>
                <p style={{marginBottom:12,color:'var(--text-secondary,#aaa)',fontSize:13}}>What's wrong with this stream?</p>
                <div className="lp-report-reasons">
                  {['Spam or misleading','Harassment or hate speech','Violence or dangerous acts','Sexual content','Copyright violation','Other'].map(r => (
                    <button key={r}
                      className={`lp-report-reason ${reportReason === r ? 'lp-report-reason-active' : ''}`}
                      onClick={() => setReportReason(r)}
                    >{r}</button>
                  ))}
                </div>
                <div className="lp-modal-btns" style={{marginTop:16}}>
                  <button className="lp-modal-no" onClick={() => setShowReport(false)}>Cancel</button>
                  <button className="lp-modal-yes" onClick={handleReport} disabled={!reportReason}>Submit Report</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Save-as-video modal ── */}
      {showSaveModal && (
        <div className="lp-modal-bg">
          <div className="lp-modal">
            <div className="lp-modal-icon"><SaveIco/></div>
            <h3>Stream Ended</h3>
            <p>Would you like to save this stream as a video on your channel?</p>
            {!saveStatus && (
              <div className="lp-modal-btns">
                <button className="lp-modal-no"  onClick={() => handleSaveAsVideo(false)}>Discard</button>
                <button className="lp-modal-yes" onClick={() => handleSaveAsVideo(true)}>
                  <SaveIco/> Save to Channel
                </button>
              </div>
            )}
            {saveStatus === 'saving' && <p className="lp-modal-status">Saving stream…</p>}
            {saveStatus === 'saved'  && <p className="lp-modal-status lp-ok">✓ Saved to your channel!</p>}
            {saveStatus === 'error'  && (
              <p className="lp-modal-status lp-err">
                Error saving.{' '}
                <button onClick={() => setSaveStatus(null)} className="lp-retry">Retry</button>
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Layout ── */}
      <div className={`lp-layout ${chatOpen ? '' : 'lp-no-chat'}`}>

        {/* Left: player + info */}
        <div className="lp-left">

          {/* ── Custom video player ── */}
          <div
            ref={containerRef}
            className={`lp-player ${fullscreen ? 'lp-fs' : ''} ${showCtrl ? 'lp-show-ctrl' : ''}`}
            onMouseMove={resetCtrlTimer}
            onMouseLeave={() => setShowCtrl(false)}
            onClick={resetCtrlTimer}
          >
            {stream.status === 'ended' ? (
              <div className="lp-offline">
                <OffIco/><p className="lp-offline-title">Stream Ended</p>
                <p className="lp-offline-sub">Thanks for watching!</p>
              </div>
            ) : playerErr ? (
              <div className="lp-offline">
                <OffIco/><p className="lp-offline-title">Stream Starting…</p>
                <p className="lp-offline-sub">Waiting for the host to begin streaming.</p>
                <button className="lp-refresh-btn" onClick={() => window.location.reload()}>↺ Refresh</button>
              </div>
            ) : (
              /* NO controls attribute — we build our own below */
              <video ref={videoRef} className="lp-video" playsInline autoPlay />
            )}

            {/* LIVE badge + viewer count overlays */}
            {isLive && !playerErr && (
              <>
                <div className="lp-badge-live"><span className="lp-live-dot"/>LIVE</div>
                <div className="lp-viewer-pill"><EyeIco/> {viewers} watching</div>
              </>
            )}

            {/* ── Custom controls bar (only on live, no time) ── */}
            {isLive && !playerErr && (
              <div className="lp-controls">
                <div className="lp-ctrl-left">
                  {/* Mute / volume */}
                  <button className="lp-ctrl-btn" onClick={toggleMute} title={muted ? 'Unmute' : 'Mute'}>
                    {muted || volume === 0 ? <MuteIco/> : <VolumeIco/>}
                  </button>
                  <input type="range" className="lp-vol-slider" min="0" max="1" step="0.05"
                    value={muted ? 0 : volume}
                    onChange={e => changeVolume(parseFloat(e.target.value))} />
                </div>

                <div className="lp-ctrl-center">
                  {/* Latency selector */}
                  <select
                    className="lp-latency-select"
                    value={latencyIdx}
                    onChange={e => applyLatency(Number(e.target.value))}
                    title="Stream delay"
                  >
                    {LATENCY_OPTIONS.map((o, i) => <option key={i} value={i}>{o.label}</option>)}
                  </select>
                </div>

                <div className="lp-ctrl-right">
                  {/* Chat toggle */}
                  <button className={`lp-ctrl-btn ${chatOpen ? 'lp-ctrl-active' : ''}`}
                    onClick={() => setChatOpen(p => !p)} title="Toggle chat">
                    <ChatIco/>
                  </button>
                  {/* Fullscreen */}
                  <button className="lp-ctrl-btn" onClick={toggleFullscreen} title="Fullscreen">
                    <FullIco/>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Title + meta */}
          <div className="lp-info">
            <h1 className="lp-title">{stream.title}</h1>
            <div className="lp-meta-row">
              {isLive
                ? <span className="lp-live-label"><span className="lp-live-dot-sm"/>Live</span>
                : <span className="lp-ended-label">Ended</span>
              }
              <span className="lp-sep">·</span>
              <span><EyeIco/> {viewers} watching</span>
              {stream.totalViews > 0 && <><span className="lp-sep">·</span><span>{stream.totalViews.toLocaleString()} views</span></>}
              {stream.category && <><span className="lp-sep">·</span><span>{stream.category}</span></>}
              <span className="lp-sep">·</span>
              <span>{timeAgo(stream.startedAt || stream.createdAt)}</span>
            </div>

            <div className="lp-actions">
              <button className={`lp-btn ${liked ? 'lp-btn-liked' : ''}`} onClick={async () => {
                if (!user) return
                try {
                  const r = await api.post(`/live/${id}/like`)
                  setLiked(r.data.liked)
                  setLikeCount(r.data.likeCount ?? likeCount)
                } catch { setLiked(p => !p) }
              }}>
                <HeartIco/>{liked ? `Liked ${likeCount > 0 ? likeCount : ''}` : `Like ${likeCount > 0 ? likeCount : ''}`}
              </button>
              <button className={`lp-btn ${disliked ? 'lp-btn-disliked' : ''}`} onClick={() => setDisliked(p => !p)}>
                <DislikeIco/>{disliked ? 'Disliked' : 'Dislike'}
              </button>
              <button className="lp-btn" onClick={handleShare}>
                <ShareIco/>{shareMsg || 'Share'}
              </button>
              <button className={`lp-btn ${chatOpen ? 'lp-btn-active' : ''}`} onClick={() => setChatOpen(p => !p)}>
                <ChatIco/>{chatOpen ? 'Hide chat' : 'Show chat'}
              </button>
              {!isHost && (
                <button className="lp-btn lp-btn-report" onClick={() => setShowReport(true)}>
                  <FlagIco/>Report
                </button>
              )}
            </div>
          </div>

          <div className="lp-divider"/>

          {/* Channel row — red glow avatar if live */}
          <div className="lp-channel-row">
            <Link to={`/channel/${ch._id || '#'}`} className="lp-channel-link">
              <div className={`lp-avatar-wrap ${isLive ? 'lp-avatar-live' : ''}`}>
                {hostAvatar
                  ? <img src={hostAvatar} alt={hostName} className="lp-avatar-img"/>
                  : <div className="lp-avatar-fallback">{hostName[0]?.toUpperCase()}</div>
                }
              </div>
              <div>
                <p className="lp-channel-name">{hostName}</p>
                {ch.handle && <p className="lp-channel-handle">@{ch.handle}</p>}
              </div>
            </Link>
            {!isHost && (
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <span className="lp-sub-count">{subCount > 0 ? `${subCount.toLocaleString()} subscribers` : '0 subscribers'}</span>
                <button
                  className={`lp-subscribe-btn ${subscribed ? 'lp-subscribed' : ''}`}
                  onClick={handleSubscribe}
                  disabled={!user}
                >
                  {subscribed ? 'Subscribed ✓' : 'Subscribe'}
                </button>
              </div>
            )}
          </div>

          {stream.description && <div className="lp-desc"><p>{stream.description}</p></div>}

          {/* Related videos */}
          {related.filter(v => !v.isShort).length > 0 && (
            <div className="lp-related">
              <h3 className="lp-related-title">Up Next</h3>
              <div className="lp-related-grid">
                {related.filter(v => !v.isShort).slice(0, 8).map(v => (
                  <VideoCard key={v._id} video={adaptVideo(v)}/>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Chat panel ── */}
        {chatOpen && (
          <div className="lp-chat-panel">
            <div className="lp-chat-top">
              <span className="lp-chat-label">Live chat</span>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <span className="lp-chat-count"><EyeIco/> {viewers}</span>
                <button className="lp-chat-close" onClick={() => setChatOpen(false)} title="Hide chat">×</button>
              </div>
            </div>

            <div className="lp-chat-feed">
              {messages.length === 0 && (
                <div className="lp-chat-empty">
                  <p>Chat is quiet…</p><p>Be the first to say something!</p>
                </div>
              )}
              {messages.map(msg => (
                <div key={msg.id} className="lp-chat-row">
                  <div className="lp-chat-avi">
                    {msg.avatar
                      ? <img src={msg.avatar} alt=""/>
                      : <span>{msg.username?.[0]?.toUpperCase() || '?'}</span>
                    }
                  </div>
                  <div className="lp-chat-content">
                    <span className="lp-chat-name">{msg.username}</span>
                    <span className="lp-chat-text"> {msg.message}</span>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef}/>
            </div>

            {stream.chatEnabled !== false ? (
              <form className="lp-chat-form" onSubmit={sendChat}>
                <input
                  className="lp-chat-input"
                  placeholder={user ? 'Say something…' : 'Sign in to chat'}
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  disabled={!user}
                  maxLength={300}
                />
                <button type="submit" className="lp-chat-send" disabled={!chatInput.trim() || !user}>
                  <SendIco/>
                </button>
              </form>
            ) : (
              <div className="lp-chat-off">Chat is disabled</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}