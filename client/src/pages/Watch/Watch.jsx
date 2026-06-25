// FILE: client/src/pages/Watch/Watch.jsx
import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext.jsx'
import { useStats } from '../../context/StatsContext.jsx'
import { useFocus } from '../../context/FocusContext.jsx'
import { formatViews, timeAgo, formatDuration } from '../../utils/formatUtils.js'
import { saveDownload, isDownloaded, getOfflineVideoUrl } from '../../utils/downloadsStore.js'
import Hls from 'hls.js'
import { io } from 'socket.io-client'
import SaveToPlaylistModal from '../../components/Modals/SaveToPlaylistModal.jsx'
import './Watch.css'

// ── ICONS ─────────────────────────────────────────────────────────────────────
const PlayIcon       = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
const PauseIcon      = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
const VolumeIcon     = ({ level }) => {
  if (level === 0) return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
  if (level < 0.5) return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 010 7.07"/></svg>
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>
}
const FullscreenIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>
const TheatreIcon    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
const MiniPlayerIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2"/><rect x="12" y="13" width="8" height="7" rx="1"/></svg>
const SettingsIcon   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
const LikeIcon       = ({ filled }) => <svg width="18" height="18" viewBox="0 0 24 24" fill={filled?'currentColor':'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/><path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>
const DislikeIcon    = ({ filled }) => <svg width="18" height="18" viewBox="0 0 24 24" fill={filled?'currentColor':'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17"/></svg>
const ShareIcon      = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
const SaveIcon       = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
const DownloadIcon   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
const VerifiedIcon   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const ChevronDownIcon= () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
const ChevronUpIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
const SortIcon       = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
const ReplyIcon      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 00-4-4H4"/></svg>
const CloseIcon      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>

// ── VIDEO PLAYER ──────────────────────────────────────────────────────────────
// ── VIDEO PLAYER ──────────────────────────────────────────────────────────────
const ExitFullscreenIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3"/></svg>
const SeekForwardIcon    = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M18 13a6 6 0 11-6-6h.5V4.5L16 8l-3.5 3.5V9H12a4 4 0 104 4z"/><text x="9.5" y="14.5" fontSize="5" fontWeight="bold" fill="white" fontFamily="sans-serif">10</text></svg>
const SeekBackIcon       = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M6 13a6 6 0 106-6h-.5V4.5L8 8l3.5 3.5V9H12a4 4 0 10-4 4z"/><text x="9.5" y="14.5" fontSize="5" fontWeight="bold" fill="white" fontFamily="sans-serif">10</text></svg>
const CaptionsIcon       = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M7 12h4M7 16h8"/></svg>

function VideoPlayer({ video, theatreMode, onTheatreToggle, onMiniPlayer, nextVideoId, prevVideoId, onTimeUpdate }) {
  const videoRef      = useRef(null)
  const hlsRef        = useRef(null)
  const containerRef  = useRef(null)
  const progressRef   = useRef(null)
  const hideTimer     = useRef(null)
  const scrubbing     = useRef(false)
  const volumeRef     = useRef(null)

  const [playing,       setPlaying]      = useState(false)
  const [progress,      setProgress]     = useState(0)
  const [buffered,      setBuffered]     = useState(0)
  const [volume,        setVolume]       = useState(0.8)
  const [muted,         setMuted]        = useState(false)
  const [currentTime,   setCurrentTime]  = useState(0)
  const [duration,      setDuration]     = useState(0)
  const [showControls,  setShowControls] = useState(true)
  const [fullscreen,    setFullscreen]   = useState(false)
  const [showSettings,  setShowSettings] = useState(false)
  const [settingsTab,   setSettingsTab]  = useState('main') // 'main'|'speed'|'quality'
  const [speed,         setSpeed]        = useState(1)
  const [quality,       setQuality]      = useState('Auto')
  const [currentSrc,    setCurrentSrc]   = useState(null)  // active video URL
  const [hoverTime,     setHoverTime]    = useState(null)
  const [hoverX,        setHoverX]       = useState(0)
  const [seekFlash,     setSeekFlash]    = useState(null)
  const [volumeVisible, setVolumeVisible]= useState(false)

  const viewCounted = useRef(false)

  const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

  // Build quality list from video.qualities[] (MP4 per quality) or HLS manifest
  // video.qualities = [{ label:'1080p', url:'...', bitrate:5000 }, ...]
  const qualityList = useMemo(() => {
    if (video?.qualities?.length) {
      // Sort highest → lowest, then append Auto
      const sorted = [...video.qualities].sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))
      return ['Auto', ...sorted.map(q => q.label)]
    }
    return ['Auto', '1080p', '720p', '480p', '360p', '240p', '144p']
  }, [video?.qualities])

  // Resolve the URL for a given quality label
  const resolveUrl = useCallback((q) => {
    if (q === 'Auto' || !video?.qualities?.length) return video?.videoUrl || ''
    const match = video.qualities.find(qo => qo.label === q)
    return match?.url || video?.videoUrl || ''
  }, [video?.qualities, video?.videoUrl])

  // Set initial source when video changes
  useEffect(() => {
    setCurrentSrc(video?.videoUrl || null)
    setQuality('Auto')
  }, [video?.videoUrl])

  // Apply currentSrc — use HLS.js for m3u8, plain src for everything else
  useEffect(() => {
    const v = videoRef.current
    if (!v || !currentSrc) return
    // Tear down any previous HLS instance
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }
    const wasPlaying = !v.paused
    const savedTime  = v.currentTime
    const isHLS = currentSrc.includes('.m3u8') || currentSrc.includes('mpegurl')
    if (isHLS && Hls.isSupported()) {
      const hls = new Hls({ maxBufferLength: 30, maxMaxBufferLength: 60 })
      hlsRef.current = hls
      hls.loadSource(currentSrc)
      hls.attachMedia(v)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        v.currentTime = savedTime
        if (wasPlaying) v.play().catch(() => {})
      })
    } else if (isHLS && v.canPlayType('application/vnd.apple.mpegurl')) {
      v.src = currentSrc
      v.load()
      v.addEventListener('loadedmetadata', () => {
        v.currentTime = savedTime
        if (wasPlaying) v.play().catch(() => {})
      }, { once: true })
    } else {
      v.src = currentSrc
      v.load()
      v.addEventListener('loadedmetadata', () => {
        v.currentTime = savedTime
        if (wasPlaying) v.play().catch(() => {})
      }, { once: true })
    }
    return () => { if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null } }
  }, [currentSrc])

  const showCtrl = useCallback(() => {
    setShowControls(true)
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setShowControls(false)
    }, 2800)
  }, [])

  // Video events
  useEffect(() => {
    const v = videoRef.current; if (!v) return
    const onTime     = () => { setCurrentTime(v.currentTime); setProgress(v.duration ? (v.currentTime/v.duration)*100 : 0); onTimeUpdate?.(v.currentTime) }
    const onLoaded   = () => { setDuration(v.duration); v.play().then(() => setPlaying(true)).catch(() => {}) }
    const onProgress = () => { if (v.buffered.length) setBuffered((v.buffered.end(v.buffered.length-1)/v.duration)*100) }
    const onEnded    = () => setPlaying(false)
    const onPlay     = () => {
      setPlaying(true)
      // Count one view per video session, only when it actually starts playing
      if (!viewCounted.current && video?._id) {
        viewCounted.current = true
        api.post(`/videos/${video._id}/view`).catch(() => {})
      }
    }
    const onPause    = () => setPlaying(false)
    v.addEventListener('timeupdate',     onTime)
    v.addEventListener('loadedmetadata', onLoaded)
    v.addEventListener('progress',       onProgress)
    v.addEventListener('ended',          onEnded)
    v.addEventListener('play',           onPlay)
    v.addEventListener('pause',          onPause)
    return () => {
      v.removeEventListener('timeupdate',     onTime)
      v.removeEventListener('loadedmetadata', onLoaded)
      v.removeEventListener('progress',       onProgress)
      v.removeEventListener('ended',          onEnded)
      v.removeEventListener('play',           onPlay)
      v.removeEventListener('pause',          onPause)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Progress heartbeat — saves watchedDuration to DB every 10s while playing,
  //    and on pause / component unmount. This powers the Wellbeing dashboard.
  //
  //    KEY DESIGN: use videoIdRef (always current) instead of video?._id inside
  //    useCallback — this avoids the stale-closure bug where flushProgress
  //    captured undefined when video prop hadn't loaded yet.
  // ─────────────────────────────────────────────────────────────────────────────
  const heartbeatRef  = useRef(null)
  const watchedSecRef = useRef(0)      // delta seconds since last flush
  const playStartRef  = useRef(null)   // Date.now() when play started / last interval tick
  const videoIdRef    = useRef(null)   // always-current video._id, never stale

  // Keep videoIdRef in sync with the video prop every render
  videoIdRef.current = video?._id ?? null

  // Reset counter when video changes (different video loaded)
  const prevVideoIdRef = useRef(null)
  if (prevVideoIdRef.current !== videoIdRef.current) {
    prevVideoIdRef.current = videoIdRef.current
    watchedSecRef.current  = 0
    playStartRef.current   = null
  }

  const flushProgress = useCallback(() => {
    const vid = videoIdRef.current
    if (!vid) return
    // Accumulate time since playStartRef if still playing (interval tick)
    if (playStartRef.current) {
      const diff = (Date.now() - playStartRef.current) / 1000
      watchedSecRef.current += diff
      playStartRef.current = Date.now()
    }
    const secs = Math.round(watchedSecRef.current)
    if (secs < 1) return
    watchedSecRef.current = 0   // reset BEFORE call — $inc on server adds delta
    const v   = videoRef.current
    const pct = v?.duration ? Math.round((v.currentTime / v.duration) * 100) : 0
    api.post(`/videos/${vid}/progress`, {
      watchedDuration: secs,
      progressPercent: pct,
      resumeAt:        Math.floor(v?.currentTime || 0),
    }).catch(() => {
      watchedSecRef.current += secs   // restore on network failure
    })
  }, []) // no deps — always reads refs which are always current

  // Start / stop heartbeat when play state changes
  useEffect(() => {
    if (playing) {
      playStartRef.current   = Date.now()
      heartbeatRef.current   = setInterval(flushProgress, 10_000)
    } else {
      clearInterval(heartbeatRef.current)
      flushProgress()   // flush whatever accumulated since last tick
      playStartRef.current = null
    }
    return () => clearInterval(heartbeatRef.current)
  }, [playing, flushProgress])

  // Flush on unmount (navigation away mid-video)
  useEffect(() => {
    return () => {
      clearInterval(heartbeatRef.current)
      flushProgress()
    }
  }, [flushProgress])

  // Fullscreen change listener
  useEffect(() => {
    const onFS = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFS)
    return () => document.removeEventListener('fullscreenchange', onFS)
  }, [])

  // ── Functions declared BEFORE keyboard useEffect ──────────────────
  const seekBy = (secs) => {
    const v = videoRef.current; if (!v) return
    v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + secs))
    setSeekFlash(secs > 0 ? 'forward' : 'back')
    setTimeout(() => setSeekFlash(null), 600)
  }

  const togglePlay = () => {
    const v = videoRef.current; if (!v) return
    if (v.paused) v.play().then(() => setPlaying(true)).catch(() => {})
    else { v.pause(); setPlaying(false) }
  }

  const changeVolume = (val) => {
    const v = videoRef.current; if (!v) return
    v.volume = val; v.muted = val === 0
    setVolume(val); setMuted(val === 0)
  }

  const toggleMute = useCallback(() => {
    const v = videoRef.current; if (!v) return
    const nowMuted = !v.muted
    v.muted = nowMuted
    if (!nowMuted && v.volume === 0) v.volume = 0.5
    setMuted(nowMuted)
    if (!nowMuted) setVolume(v.volume)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen()
    else document.exitFullscreen()
  }

  // ── Keyboard shortcuts ────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (['INPUT','TEXTAREA'].includes(e.target.tagName)) return
      const v = videoRef.current; if (!v) return
      switch (e.key) {
        case ' ': case 'k': e.preventDefault(); togglePlay(); break
        case 'ArrowLeft':  case 'j': e.preventDefault(); seekBy(-10); break
        case 'ArrowRight': case 'l': e.preventDefault(); seekBy( 10); break
        case 'ArrowUp':   e.preventDefault(); changeVolume(Math.min(1, volume + 0.05)); break
        case 'ArrowDown': e.preventDefault(); changeVolume(Math.max(0, volume - 0.05)); break
        case 'm': e.preventDefault(); toggleMute(); break
        case 'f': e.preventDefault(); toggleFullscreen(); break
        case 't': e.preventDefault(); onTheatreToggle?.(); break
        case 'i': e.preventDefault(); onMiniPlayer?.(); break
        case '.': e.preventDefault(); if (!playing) { v.currentTime += 0.04 } break
        case ',': e.preventDefault(); if (!playing) { v.currentTime -= 0.04 } break
        case '>': e.preventDefault(); { const s = Math.min(2, speed + 0.25); setSpeed(s); v.playbackRate = s } break
        case '<': e.preventDefault(); { const s = Math.max(0.25, speed - 0.25); setSpeed(s); v.playbackRate = s } break
        default:
          if (e.key >= '0' && e.key <= '9') {
            e.preventDefault()
            v.currentTime = v.duration * (parseInt(e.key) / 10)
          }
      }
      showCtrl()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [playing, volume, speed, showCtrl, toggleMute]) // eslint-disable-line

  // Progress bar
  const getTimeFromEvent = (e) => {
    const rect = progressRef.current?.getBoundingClientRect()
    if (!rect) return 0
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    return pct * (videoRef.current?.duration || 0)
  }

  const handleProgressMouseDown = (e) => {
    scrubbing.current = true
    const t = getTimeFromEvent(e)
    if (videoRef.current) videoRef.current.currentTime = t
    const onMove = (me) => { if (scrubbing.current && videoRef.current) videoRef.current.currentTime = getTimeFromEvent(me) }
    const onUp   = () => { scrubbing.current = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const handleProgressHover = (e) => {
    const rect = progressRef.current?.getBoundingClientRect()
    if (!rect) return
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    setHoverTime(pct * (videoRef.current?.duration || 0))
    setHoverX(e.clientX - rect.left)
  }

  const handleSpeedSelect = (s) => {
    setSpeed(s)
    if (videoRef.current) videoRef.current.playbackRate = s
    setSettingsTab('main')
  }

  const handleQualitySelect = (q) => {
    if (q === quality) { setSettingsTab('main'); setShowSettings(false); return }
    setQuality(q)
    setSettingsTab('main')
    setShowSettings(false)
    // Switch the video source to the chosen quality URL
    setCurrentSrc(resolveUrl(q))
  }

  // Build quality list from live HLS levels when available
  const availableQualities = qualityList

  const fmtTime = (s) => {
    if (!s || isNaN(s)) return '0:00'
    const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = Math.floor(s%60)
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
    return `${m}:${String(sec).padStart(2,'0')}`
  }

  return (
    <div
      ref={containerRef}
      className={`vp-container ${theatreMode?'theatre':''} ${fullscreen?'fullscreen':''} ${showControls?'show-ctrl':''}`}
      onMouseMove={showCtrl}
      onMouseLeave={() => { if (playing) setShowControls(false); setHoverTime(null) }}
      onClick={togglePlay}
      onDoubleClick={e => { e.stopPropagation() }}
    >
      <video
        ref={videoRef}
        className="vp-video"
        poster={video?.thumbnailUrl}
        preload="metadata"
        disablePictureInPicture
        disableRemotePlayback
        controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"
      />

      {/* ── Seek flash — left side for back, right side for forward ── */}
      <AnimatePresence>
        {seekFlash === 'back' && (
          <motion.div
            key="seek-back"
            className="vp-seek-flash vp-seek-flash--back"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}>
            <motion.div
              className="vp-seek-arrows"
              initial={{ x: 20 }}
              animate={{ x: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
                <polyline points="9 18 3 12 9 6"/>
              </svg>
            </motion.div>
            <span className="vp-seek-label">10 sec</span>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {seekFlash === 'forward' && (
          <motion.div
            key="seek-forward"
            className="vp-seek-flash vp-seek-flash--forward"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}>
            <motion.div
              className="vp-seek-arrows"
              initial={{ x: -20 }}
              animate={{ x: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
                <polyline points="15 18 21 12 15 6"/>
              </svg>
            </motion.div>
            <span className="vp-seek-label">10 sec</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Centre play button (shows on hover) ── */}
      <AnimatePresence>
        {showControls && (
          <motion.div className="vp-centre-controls"
            initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            transition={{duration:0.18}}
            onClick={e => e.stopPropagation()}>
            <button className="vp-centre-play-btn" onClick={togglePlay} title={playing ? 'Pause' : 'Play'}>
              {playing ? <PauseIcon /> : <PlayIcon />}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Controls overlay ── */}
      <div className="vp-controls" onClick={e => e.stopPropagation()}>

        {/* Progress bar */}
        <div className="vp-progress-area"
          ref={progressRef}
          onMouseDown={handleProgressMouseDown}
          onMouseMove={handleProgressHover}
          onMouseLeave={() => setHoverTime(null)}>

          {/* Hover time tooltip */}
          {hoverTime !== null && (
            <div className="vp-progress-tooltip" style={{left: Math.max(20, Math.min(hoverX, (progressRef.current?.offsetWidth || 0) - 20))}}>
              {fmtTime(hoverTime)}
            </div>
          )}

          <div className="vp-progress-track">
            <div className="vp-buffered"  style={{width:`${buffered}%`}} />
            <div className="vp-played"    style={{width:`${progress}%`}} />
            {/* Hover fill preview */}
            {hoverTime !== null && (
              <div className="vp-hover-fill" style={{width:`${(hoverTime/(duration||1))*100}%`}} />
            )}
            <div className="vp-thumb"     style={{left:`${progress}%`}} />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="vp-bottom-bar">
          {/* LEFT */}
          <div className="vp-left-controls">
            {/* Prev */}
            {prevVideoId && (
              <a href={`/watch/${prevVideoId}`} className="vp-btn" title="Previous video" onClick={e => e.stopPropagation()}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="4" x2="5" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </a>
            )}

            {/* Play/Pause */}
            <button className="vp-btn vp-btn-play" onClick={togglePlay} title={`${playing?'Pause':'Play'} (k)`}>
              {playing ? <PauseIcon /> : <PlayIcon />}
            </button>

            {/* Next */}
            {nextVideoId && (
              <a href={`/watch/${nextVideoId}`} className="vp-btn" title="Next video" onClick={e => e.stopPropagation()}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="4" x2="19" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </a>
            )}

            {/* Volume */}
            <div className="vp-volume-group"
              onMouseEnter={() => setVolumeVisible(true)}
              onMouseLeave={() => setVolumeVisible(false)}>
              <button className="vp-btn" onClick={toggleMute} title="Mute (m)">
                <VolumeIcon level={muted ? 0 : volume} />
              </button>
              <div className={`vp-volume-slider-wrap ${volumeVisible ? 'visible' : ''}`}>
                <input
                  type="range" min="0" max="1" step="0.02"
                  value={muted ? 0 : volume}
                  onChange={e => changeVolume(parseFloat(e.target.value))}
                  className="vp-volume-slider"
                  style={{'--vol': `${(muted ? 0 : volume) * 100}%`}}
                />
              </div>
            </div>

            {/* Time */}
            <span className="vp-time">{fmtTime(currentTime)} / {fmtTime(duration)}</span>
          </div>

          {/* RIGHT */}
          <div className="vp-right-controls">
            {/* Speed badge */}
            {speed !== 1 && <span className="vp-speed-badge">{speed}x</span>}

            {/* Settings */}
            <div className="vp-settings-wrap">
              <button className="vp-btn" onClick={e => { e.stopPropagation(); setShowSettings(v=>!v); setSettingsTab('main') }} title="Settings">
                <SettingsIcon />
              </button>

              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    className="vp-settings-panel"
                    initial={{opacity:0,y:8,scale:0.95}}
                    animate={{opacity:1,y:0,scale:1}}
                    exit={{opacity:0,y:8,scale:0.95}}
                    transition={{duration:0.16}}
                    onClick={e => e.stopPropagation()}>

                    {settingsTab === 'main' && (
                      <>
                        <button className="vp-settings-row" onClick={() => setSettingsTab('speed')}>
                          <span>Playback speed</span>
                          <span className="vp-settings-val">{speed === 1 ? 'Normal' : `${speed}x`} ›</span>
                        </button>
                        <button className="vp-settings-row" onClick={() => setSettingsTab('quality')}>
                          <span>Quality</span>
                          <span className="vp-settings-val">{quality} ›</span>
                        </button>
                      </>
                    )}

                    {settingsTab === 'speed' && (
                      <>
                        <button className="vp-settings-back" onClick={() => setSettingsTab('main')}>‹ Playback speed</button>
                        {SPEEDS.map(s => (
                          <button key={s} className={`vp-settings-row ${speed===s?'active':''}`} onClick={() => handleSpeedSelect(s)}>
                            {s === 1 ? 'Normal' : `${s}x`}
                            {speed === s && <span className="vp-settings-check">✓</span>}
                          </button>
                        ))}
                      </>
                    )}

                    {settingsTab === 'quality' && (
                      <>
                        <button className="vp-settings-back" onClick={() => setSettingsTab('main')}>‹ Quality</button>
                        {availableQualities.map(q => (
                          <button key={q} className={`vp-settings-row ${quality===q?'active':''}`} onClick={() => handleQualitySelect(q)}>
                            {q}
                            {quality === q && <span className="vp-settings-check">✓</span>}
                          </button>
                        ))}
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Captions */}
            <button className="vp-btn" title="Captions (c)"><CaptionsIcon /></button>

            {/* Mini player */}
            <button className="vp-btn" onClick={onMiniPlayer} title="Miniplayer (i)"><MiniPlayerIcon /></button>

            {/* Theatre */}
            <button className="vp-btn" onClick={onTheatreToggle} title="Theatre mode (t)"><TheatreIcon /></button>

            {/* Fullscreen */}
            <button className="vp-btn vp-btn-fullscreen" onClick={toggleFullscreen} title={`${fullscreen?'Exit ':''}Fullscreen (f)`}>
              {fullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── SKELETON ──────────────────────────────────────────────────────────────────
function WatchSkeleton() {
  return (
    <div className="watch-page">
      <div className="watch-layout">
        <div className="watch-main">
          <div style={{background:'#1a1a2e',borderRadius:12,aspectRatio:'16/9',width:'100%'}} className="skel" />
          <div style={{padding:'16px 0',display:'flex',flexDirection:'column',gap:12}}>
            <div style={{height:28,width:'70%',borderRadius:8}} className="skel" />
            <div style={{height:16,width:'40%',borderRadius:8}} className="skel" />
            <div style={{height:56,width:'100%',borderRadius:8,marginTop:8}} className="skel" />
          </div>
        </div>
        <div className="watch-sidebar">
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{display:'flex',gap:10,marginBottom:12}}>
              <div style={{width:168,height:94,borderRadius:8,flexShrink:0}} className="skel" />
              <div style={{flex:1,display:'flex',flexDirection:'column',gap:8}}>
                <div style={{height:14,borderRadius:6}} className="skel" />
                <div style={{height:12,width:'60%',borderRadius:6}} className="skel" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── SHORTS SHELF (YouTube-style shorts panel in Watch sidebar) ────────────────
function ShortsShelf({ shorts }) {
  const scrollRef = useRef(null)
  const [canLeft,  setCanLeft]  = useState(false)
  const [canRight, setCanRight] = useState(true)

  const updateArrows = () => {
    const el = scrollRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 4)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  const scroll = (dir) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir * 200, behavior: 'smooth' })
    setTimeout(updateArrows, 320)
  }

  if (!shorts || shorts.length === 0) return null

  return (
    <div className="shorts-shelf">
      <div className="shorts-shelf-header">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="shorts-shelf-icon">
          <path d="M17.77 10.32l-1.2-.5L18 9.06c1.84-.96 2.53-3.23 1.56-5.06s-3.23-2.53-5.06-1.56L6 6.94c-1.29.68-2.06 2.03-1.98 3.49.07 1.18.63 2.23 1.51 2.94-.07.23-.11.47-.11.73v4c0 2.21 2.69 4 6 4s6-1.79 6-4v-4c0-.67-.21-1.3-.58-1.84l.93-.38c.67-.28 1-.93.72-1.56z"/>
        </svg>
        <span>Shorts</span>
        <div className="shorts-shelf-arrows">
          <button
            className={`shorts-shelf-arrow ${!canLeft ? 'disabled' : ''}`}
            onClick={() => scroll(-1)}
            disabled={!canLeft}
            aria-label="Scroll left"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button
            className={`shorts-shelf-arrow ${!canRight ? 'disabled' : ''}`}
            onClick={() => scroll(1)}
            disabled={!canRight}
            aria-label="Scroll right"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>

      <div className="shorts-shelf-scroll" ref={scrollRef} onScroll={updateArrows}>
        {shorts.map(s => (
          <ShortShelfCard key={s._id} short={s} />
        ))}
      </div>
    </div>
  )
}

// ── SHARED CONTEXT MENU (used by both RelatedVideoCard and ShortShelfCard) ────
const WATCH_REPORT_REASONS = [
  { key: 'spam',           label: 'Spam or misleading' },
  { key: 'harassment',     label: 'Harassment or bullying' },
  { key: 'hateSpeech',     label: 'Hate speech' },
  { key: 'violence',       label: 'Violent or graphic content' },
  { key: 'sexualContent',  label: 'Sexual content' },
  { key: 'misinformation', label: 'Misinformation' },
  { key: 'copyright',      label: 'Copyright violation' },
  { key: 'childSafety',    label: 'Child safety' },
  { key: 'other',          label: 'Other' },
]

function WatchReportModal({ videoId, onClose }) {
  const [reason, setReason]        = useState('')
  const [details, setDetails]      = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]            = useState(false)
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  const submit = async () => {
    if (!reason || submitting) return
    setSubmitting(true)
    try { await api.post(`/interactions/${videoId}/report`, { reason, details }); setDone(true); setTimeout(onClose, 1800) }
    catch { setDone(true); setTimeout(onClose, 1800) }
  }
  return createPortal(
    <motion.div className="report-backdrop"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div className="report-modal"
        initial={{ opacity: 0, scale: 0.93, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 16 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        onMouseDown={e => e.stopPropagation()}>
        {done ? (
          <div className="report-done">
            <div className="report-done-icon">✓</div>
            <p className="report-done-title">Report submitted</p>
            <p className="report-done-sub">Thanks for helping keep AURA safe.</p>
          </div>
        ) : (
          <>
            <div className="report-header">
              <h3 className="report-title">Report video</h3>
              <button className="report-close" onClick={onClose}><CloseIcon /></button>
            </div>
            <p className="report-sub">What's wrong with this video?</p>
            <div className="report-reasons">
              {WATCH_REPORT_REASONS.map(r => (
                <button key={r.key} className={`report-reason-btn ${reason === r.key ? 'active' : ''}`}
                  onClick={() => setReason(r.key)}>
                  <span className="report-reason-check">{reason === r.key ? <CheckSmIcon /> : null}</span>
                  {r.label}
                </button>
              ))}
            </div>
            <textarea className="report-details" placeholder="Additional details (optional)"
              value={details} onChange={e => setDetails(e.target.value)} maxLength={500} rows={3} />
            <div className="report-footer">
              <button className="report-cancel-btn" onClick={onClose}>Cancel</button>
              <motion.button className={`report-submit-btn ${reason ? 'active' : ''}`}
                onClick={submit} disabled={!reason || submitting}
                whileHover={reason ? { scale: 1.03 } : {}} whileTap={reason ? { scale: 0.97 } : {}}>
                {submitting ? 'Submitting…' : 'Submit report'}
              </motion.button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>,
    document.body
  )
}

function CardContextMenu({ anchorRect, videoId, channelId, onClose, onDismiss, isShort = false }) {
  const menuRef = useRef(null)
  const [savedWL,       setSavedWL]       = useState(false)
  const [toast,         setToast]         = useState(null)
  const [showReport,    setShowReport]    = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)

  const MENU_W = 240, MENU_H = 290
  let left = anchorRect.right - MENU_W
  let top  = anchorRect.bottom + 6
  if (left < 8)                          left = anchorRect.left
  if (top + MENU_H > window.innerHeight) top  = anchorRect.top - MENU_H - 6
  if (top < 8)                           top  = 8

  useEffect(() => {
    const onDown   = (e) => { if (menuRef.current && !menuRef.current.contains(e.target) && !e.target.closest('.report-backdrop')) onClose() }
    const onScroll = () => onClose()
    document.addEventListener('mousedown', onDown, true)
    window.addEventListener('scroll', onScroll, true)
    return () => { document.removeEventListener('mousedown', onDown, true); window.removeEventListener('scroll', onScroll, true) }
  }, [onClose])

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2200) }

  const handleWatchLater = async (e) => {
    e.stopPropagation()
    try { const r = await api.post(`/interactions/${videoId}/watch-later`); setSavedWL(true); flash(r.data.watchLater ? 'Saved to Watch Later' : 'Removed'); setTimeout(onClose, 1100) }
    catch { flash('Sign in to save videos'); setTimeout(onClose, 1200) }
  }
  const handleSaveToPlaylist = (e) => {
    e.stopPropagation()
    setShowSaveModal(true)
  }
  const handleShare = async (e) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/${isShort ? 'shorts?id=' : 'watch/'}${videoId}`)
      api.post(`/interactions/${videoId}/share`).catch(() => {})
      flash('Link copied!')
    } catch { flash('Could not copy link') }
    setTimeout(onClose, 1000)
  }
  const handleNotInterested = async (e) => {
    e.stopPropagation()
    try { await api.post(`/interactions/${videoId}/not-interested`); flash('Got it — removed from feed'); onDismiss?.(); setTimeout(onClose, 900) }
    catch { flash('Sign in to customise your feed'); setTimeout(onClose, 1200) }
  }
  const handleHideChannel = async (e) => {
    e.stopPropagation()
    if (!channelId) { flash('Channel info unavailable'); return }
    try { await api.post(`/interactions/channel/${channelId}/hide`); flash('Channel hidden'); onDismiss?.(); setTimeout(onClose, 900) }
    catch { flash('Sign in to customise your feed'); setTimeout(onClose, 1200) }
  }

  const ITEMS = [
    { label: savedWL ? 'Saved ✓' : 'Save to Watch Later', icon: <WLIcon />, action: handleWatchLater, check: savedWL },
    { label: 'Share', icon: <ShareSmIcon />, action: handleShare },
    'divider',
    { label: 'Not Interested', icon: <NotIntIcon2 />, action: handleNotInterested },
    { label: "Don't Recommend Channel", icon: <HideChIcon />, action: handleHideChannel },
    'divider',
    { label: 'Report', icon: <FlagSmIcon />, action: (e) => { e.stopPropagation(); setShowReport(true) }, danger: true },
  ]

  return (
    <>
      {createPortal(
        <>
          <motion.div ref={menuRef} className="video-context-menu"
            style={{ position: 'fixed', top, left, width: MENU_W, zIndex: 99999 }}
            initial={{ opacity: 0, scale: 0.9, y: -6 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -6 }} transition={{ duration: 0.15, ease: [0.34, 1.4, 0.64, 1] }}>
            {ITEMS.map((item, i) =>
              item === 'divider'
                ? <div key={`d${i}`} className="context-menu-divider" />
                : (
                  <button key={item.label}
                    className={`context-menu-item ${item.danger ? 'danger' : ''} ${item.check ? 'checked' : ''}`}
                    onMouseDown={(e) => { e.stopPropagation(); item.action(e) }}>
                    <span className="context-menu-icon">{item.icon}</span>
                    <span className="context-menu-label">{item.label}</span>
                    {item.check && <span className="context-menu-check"><CheckSmIcon /></span>}
                  </button>
                )
            )}
          </motion.div>
          {toast && <div className="vc-toast">{toast}</div>}
        </>,
        document.body
      )}
      <AnimatePresence>
        {showReport && <WatchReportModal videoId={videoId} onClose={() => { setShowReport(false); onClose() }} />}
      </AnimatePresence>
      <AnimatePresence>
        {showSaveModal && (
          <SaveToPlaylistModal
            videoId={videoId}
            onClose={() => { setShowSaveModal(false); onClose() }}
          />
        )}
      </AnimatePresence>
    </>
  )
}

// ── SHORTS SHELF CARD — with 3-dots menu ─────────────────────────────────────
function ShortShelfCard({ short }) {
  const [menuOpen,   setMenuOpen]   = useState(false)
  const [anchorRect, setAnchorRect] = useState(null)
  const [dismissed,  setDismissed]  = useState(false)
  const btnRef = useRef(null)

  if (dismissed) return null

  const openMenu = (e) => {
    e.preventDefault(); e.stopPropagation()
    const rect = btnRef.current?.getBoundingClientRect()
    if (rect) { setAnchorRect(rect); setMenuOpen(true) }
  }
  const closeMenu = useCallback(() => { setMenuOpen(false); setAnchorRect(null) }, [])

  return (
    <div className="shorts-shelf-card-wrap">
      <Link to={`/shorts?id=${short._id}`} className="shorts-shelf-card">
        <div className="shorts-shelf-thumb-wrap">
          <img
            src={short.thumbnailUrl || short.thumbnail} alt={short.title}
            className="shorts-shelf-thumb"
            onLoad={e => {
              const img = e.currentTarget
              if (img.naturalWidth > img.naturalHeight) { img.style.objectFit = 'contain'; img.style.background = '#000' }
            }}
          />
          <div className="shorts-shelf-play-badge">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
        </div>
        <p className="shorts-shelf-title-text">{short.title}</p>
        <p className="shorts-shelf-views">{formatViews(short.viewCount ?? short.views ?? 0)} views</p>
      </Link>
      <button ref={btnRef} className="shelf-card-dots-btn" onMouseDown={openMenu} title="More options">
        <DotsHIcon />
      </button>
      <AnimatePresence>
        {menuOpen && anchorRect && (
          <CardContextMenu
            anchorRect={anchorRect}
            videoId={short._id}
            channelId={short.uploader?._id || short.channel?._id}
            onClose={closeMenu}
            onDismiss={() => setDismissed(true)}
            isShort={true}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ── RELATED VIDEO CARD — with 3-dots menu ────────────────────────────────────
function RelatedVideoCard({ video }) {
  const ch = video.uploader || {}
  const [menuOpen,   setMenuOpen]   = useState(false)
  const [anchorRect, setAnchorRect] = useState(null)
  const [dismissed,  setDismissed]  = useState(false)
  const btnRef = useRef(null)

  if (dismissed) return null

  const openMenu = useCallback((e) => {
    e.preventDefault(); e.stopPropagation()
    const rect = btnRef.current?.getBoundingClientRect()
    if (rect) { setAnchorRect(rect); setMenuOpen(true) }
  }, [])
  const closeMenu = useCallback(() => { setMenuOpen(false); setAnchorRect(null) }, [])

  return (
    <>
      <motion.div className="related-card" whileHover={{ x: 3 }} transition={{ duration: 0.18 }}>
        <Link to={`/watch/${video._id}`} className="related-thumb-wrap">
          <img src={video.thumbnailUrl || 'https://via.placeholder.com/336x188/1a1a2e/fff?text=No+Thumb'} alt={video.title} className="related-thumb" loading="lazy" />
          {video.duration > 0 && <span className="related-duration">{formatDuration(video.duration)}</span>}
        </Link>
        <div className="related-info">
          <Link to={`/watch/${video._id}`} className="related-title">{video.title}</Link>
          <Link to={`/channel/${ch._id}`} className="related-channel">{ch.displayName || ch.username}</Link>
          <div className="related-meta-row">
            <p className="related-meta">{formatViews(video.viewCount)} views · {timeAgo(video.createdAt)}</p>
            <button ref={btnRef} className="related-dots-btn" onMouseDown={openMenu} title="More options">
              <DotsHIcon />
            </button>
          </div>
        </div>
      </motion.div>
      <AnimatePresence>
        {menuOpen && anchorRect && (
          <CardContextMenu
            anchorRect={anchorRect}
            videoId={video._id}
            channelId={ch._id}
            onClose={closeMenu}
            onDismiss={() => setDismissed(true)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

// ── MINI PLAYER ───────────────────────────────────────────────────────────────
function MiniPlayer({ video, onClose }) {
  return (
    <motion.div className="mini-player"
      initial={{opacity:0,y:80,scale:0.9}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:80,scale:0.9}}
      transition={{duration:0.3,ease:[0.34,1.2,0.64,1]}} drag dragMomentum={false}
    >
      <video src={video?.videoUrl} autoPlay muted className="mini-player-video" />
      <div className="mini-player-info">
        <p className="mini-player-title">{video?.title}</p>
        <p className="mini-player-channel">{video?.uploader?.displayName || video?.uploader?.username}</p>
      </div>
      <button className="mini-player-close" onClick={onClose}><CloseIcon /></button>
    </motion.div>
  )
}



// ── PLAYLISTS PANEL (sidebar widget on Watch page) ─────────────────────────────
function PlaylistsPanel({ videoId }) {
  const { user } = useAuth()
  const [playlists,  setPlaylists]  = useState([])
  const [loading,    setLoading]    = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle,   setNewTitle]   = useState('')
  const [newPrivacy, setNewPrivacy] = useState('private')
  const [creating,   setCreating]   = useState(false)
  const [savedIn,    setSavedIn]    = useState({})  // { [playlistId]: boolean }

  useEffect(() => {
    if (!user) return
    setLoading(true)
    api.get('/playlists')
      .then(r => {
        const pls = r.data.playlists || []
        setPlaylists(pls)
        // Mark which playlists already contain this video
        const saved = {}
        pls.forEach(pl => {
          if (pl.videos?.includes(videoId)) saved[pl._id] = true
        })
        setSavedIn(saved)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user, videoId])

  const toggleSave = async (playlistId) => {
    const isIn = savedIn[playlistId]
    setSavedIn(p => ({ ...p, [playlistId]: !isIn }))
    try {
      if (isIn) {
        await api.delete(`/playlists/${playlistId}/videos/${videoId}`)
      } else {
        await api.post(`/playlists/${playlistId}/videos`, { videoId })
      }
    } catch {
      setSavedIn(p => ({ ...p, [playlistId]: isIn })) // revert
    }
  }

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      const res = await api.post('/playlists', { title: newTitle.trim(), privacy: newPrivacy })
      const pl = res.data.playlist
      setPlaylists(prev => [pl, ...prev])
      // Auto-add current video to new playlist
      await api.post(`/playlists/${pl._id}/videos`, { videoId })
      setSavedIn(p => ({ ...p, [pl._id]: true }))
      setNewTitle(''); setShowCreate(false)
    } catch {}
    setCreating(false)
  }

  if (!user) return null

  return (
    <div className="watch-playlists-panel">
      <div className="watch-playlists-header">
        <span className="watch-playlists-title">Save to playlist</span>
        <button className="watch-playlists-add-btn" onClick={() => setShowCreate(v => !v)} title="New playlist">
          <PlusIcon2 />
        </button>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div className="watch-pl-create"
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }}>
            <input className="watch-pl-input" placeholder="Playlist name…" value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()} autoFocus maxLength={80} />
            <div className="watch-pl-privacy-row">
              {[{v:'public',icon:<GlobeIcon2/>},{v:'private',icon:<LockIcon2/>}].map(({v,icon}) => (
                <button key={v} className={`watch-pl-priv-btn${newPrivacy===v?' active':''}`} onClick={() => setNewPrivacy(v)}>
                  {icon} {v}
                </button>
              ))}
            </div>
            <div className="watch-pl-create-actions">
              <button className="watch-pl-cancel-btn" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="watch-pl-confirm-btn" onClick={handleCreate} disabled={!newTitle.trim() || creating}>
                {creating ? 'Creating…' : 'Create'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="watch-pl-list">
        {loading ? (
          <div className="watch-pl-loading">Loading…</div>
        ) : playlists.length === 0 ? (
          <p className="watch-pl-empty">No playlists yet. Create one above.</p>
        ) : playlists.map(pl => (
          <label key={pl._id} className="watch-pl-row">
            <div className="watch-pl-checkbox-wrap">
              <input type="checkbox" className="watch-pl-checkbox" checked={!!savedIn[pl._id]}
                onChange={() => toggleSave(pl._id)} />
              <span className="watch-pl-checkmark">{savedIn[pl._id] && <CheckIcon2 />}</span>
            </div>
            <div className="watch-pl-info">
              <span className="watch-pl-name">{pl.title}</span>
              <span className="watch-pl-meta">
                {pl.privacy === 'private' ? <><LockIcon2 /> Private</> : <><GlobeIcon2 /> Public</>}
                {pl.count != null && <> · {pl.count} videos</>}
              </span>
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}

// ── LIVE WATCH PAGE ─────────────────────────────────────────────────────────────
// Icons shared with LiveWatchPage
const SendIco    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
const EyeIco     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
const HeartIco   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
const OfflineIco = () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 010 8.49M7.76 16.24a6 6 0 010-8.49M19.07 4.93a10 10 0 010 14.14M4.93 19.07a10 10 0 010-14.14"/><line x1="2" y1="2" x2="22" y2="22" strokeWidth="2"/></svg>
const PlusIcon2  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const LockIcon2  = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
const GlobeIcon2 = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
const CheckIcon2 = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const TrashIcon2 = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
const StopIco    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
const ChatIco    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
const MuteIco2   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
const ExitFSIco  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3"/></svg>

// Live chat collapsible panel — mirrors PlaylistWatchPanel's collapse pattern
function LiveChatPanel({ streamId, messages, chatInput, setChatInput, onSend, viewers, chatEnabled, user, streamEnded }) {
  const [collapsed, setCollapsed] = useState(false)
  const chatEndRef = useRef(null)
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const myUsername = user?.displayName || user?.username

  return (
    <div className="lchat-panel">
      {/* Header — same pattern as plw-header */}
      <div className="lchat-header">
        <div className="lchat-header-top">
          <div className="lchat-header-titles">
            <span className="lchat-title">Live chat</span>
            <span className="lchat-subtitle">
              <EyeIco /> {viewers} watching
            </span>
          </div>
          <button className="lchat-collapse-btn" onClick={() => setCollapsed(v => !v)} title={collapsed ? 'Expand chat' : 'Collapse chat'}>
            {collapsed ? <ExpandIcon /> : <CollapseIcon />}
          </button>
        </div>
      </div>

      {/* Body — animated like playlist panel */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            className="lchat-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 320, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="lchat-feed">
              {messages.length === 0 && (
                <div className="lchat-empty">
                  <p>Chat is quiet…</p>
                  <p>Be the first to say something!</p>
                </div>
              )}
              {messages.map(msg => {
                const isOwn = msg.isOwn || (myUsername && msg.username === myUsername)
                return (
                  <div key={msg.id} className={`lchat-row ${isOwn ? 'lchat-row--own' : ''}`}>
                    {!isOwn && (
                      <div className="lchat-avi">
                        {msg.avatar
                          ? <img src={msg.avatar} alt="" />
                          : <span>{msg.username?.[0]?.toUpperCase() || '?'}</span>
                        }
                      </div>
                    )}
                    <div className={`lchat-bubble ${isOwn ? 'lchat-bubble--own' : 'lchat-bubble--other'}`}>
                      {!isOwn && <span className="lchat-name">{msg.username}</span>}
                      <span className="lchat-text">{msg.message}</span>
                    </div>
                    {isOwn && (
                      <div className="lchat-avi lchat-avi--own">
                        {user?.avatar
                          ? <img src={user.avatar} alt="" />
                          : <span>{myUsername?.[0]?.toUpperCase() || '?'}</span>
                        }
                      </div>
                    )}
                  </div>
                )
              })}
              <div ref={chatEndRef} />
            </div>

            {chatEnabled !== false ? (
              <div className="lchat-form-wrap">
                <input
                  className="lchat-input"
                  placeholder={user ? 'Say something…' : 'Sign in to chat'}
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onSend() } }}
                  disabled={!user || streamEnded}
                  maxLength={300}
                />
                <button
                  className="lchat-send"
                  onClick={onSend}
                  disabled={!chatInput.trim() || !user || streamEnded}
                >
                  <SendIco />
                </button>
              </div>
            ) : (
              <div className="lchat-off">Chat is disabled</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Live player with full Watch-style custom controls (mute, volume, latency, fullscreen)
const LATENCY_OPTIONS2 = [
  { label: 'Ultra-low (3s)',  sync: 1, maxLatency: 3,  buffer: 3  },
  { label: 'Low (5s)',        sync: 2, maxLatency: 5,  buffer: 5  },
  { label: 'Normal (15s)',    sync: 4, maxLatency: 15, buffer: 15 },
  { label: 'Relaxed (30s)',   sync: 8, maxLatency: 30, buffer: 30 },
]

function LivePlayer({ stream, viewers }) {
  const videoRef     = useRef(null)
  const containerRef = useRef(null)
  const hlsRef       = useRef(null)
  const hideTimer    = useRef(null)
  const volumeRef    = useRef(null)

  const [playerErr,    setPlayerErr]    = useState(false)
  const [muted,        setMuted]        = useState(false)
  const [volume,       setVolume]       = useState(1)
  const [fullscreen,   setFullscreen]   = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [volumeVisible,setVolumeVisible]= useState(false)
  const [latencyIdx,   setLatencyIdx]   = useState(0)
  const [showSettings, setShowSettings] = useState(false)

  const showCtrl = useCallback(() => {
    setShowControls(true)
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setShowControls(false), 2800)
  }, [])

  useEffect(() => {
    const onFS = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFS)
    return () => document.removeEventListener('fullscreenchange', onFS)
  }, [])

  useEffect(() => {
    if (!stream?.hlsUrl || !videoRef.current || stream.status === 'ended') return
    const video = videoRef.current
    setPlayerErr(false)
    const opt = LATENCY_OPTIONS2[latencyIdx]
    if (Hls.isSupported()) {
      const hls = new Hls({
        liveSyncDurationCount:        opt.sync,
        liveMaxLatencyDurationCount:  opt.maxLatency,
        maxBufferLength:              opt.buffer,
        maxMaxBufferLength:           opt.buffer,
        manifestLoadingMaxRetry:      12,
        manifestLoadingRetryDelay:    2000,
        levelLoadingMaxRetry:         6,
        fragLoadingMaxRetry:          6,
      })
      hlsRef.current = hls
      hls.loadSource(stream.hlsUrl)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => { video.play().catch(() => {}); setPlayerErr(false) })
      hls.on(Hls.Events.ERROR, (_, d) => {
        if (d.fatal) {
          if (d.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad()
          else setPlayerErr(true)
        }
      })
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = stream.hlsUrl; video.play().catch(() => {})
    } else { setPlayerErr(true) }
    return () => hlsRef.current?.destroy()
  }, [stream?.hlsUrl, stream?.status]) // eslint-disable-line

  const toggleMute = () => {
    if (!videoRef.current) return
    const nowMuted = !videoRef.current.muted
    videoRef.current.muted = nowMuted
    if (!nowMuted && videoRef.current.volume === 0) videoRef.current.volume = 0.5
    setMuted(nowMuted)
    if (!nowMuted) setVolume(videoRef.current.volume)
  }
  const changeVolume = (v) => {
    if (!videoRef.current) return
    videoRef.current.volume = v; videoRef.current.muted = v === 0
    setVolume(v); setMuted(v === 0)
  }
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen()
    else document.exitFullscreen()
  }
  const applyLatency = (idx) => {
    setLatencyIdx(idx); setShowSettings(false)
    const opt = LATENCY_OPTIONS2[idx]
    if (hlsRef.current) {
      hlsRef.current.config.liveSyncDurationCount       = opt.sync
      hlsRef.current.config.liveMaxLatencyDurationCount = opt.maxLatency
      hlsRef.current.config.maxBufferLength             = opt.buffer
    }
  }

  const isLive = stream?.status === 'live'

  return (
    <div
      ref={containerRef}
      className={`vp-container ${fullscreen ? 'fullscreen' : ''} ${showControls ? 'show-ctrl' : ''}`}
      onMouseMove={showCtrl}
      onMouseLeave={() => setShowControls(false)}
      onClick={showCtrl}
    >
      {stream.status === 'ended' ? (
        <div className="lp-offline-overlay">
          <OfflineIco /><p className="lp-offline-title">Stream Ended</p>
          <p className="lp-offline-sub">Thanks for watching!</p>
        </div>
      ) : playerErr ? (
        <div className="lp-offline-overlay">
          <OfflineIco /><p className="lp-offline-title">Stream Starting…</p>
          <p className="lp-offline-sub">Waiting for the host to begin streaming.</p>
          <button className="lp-refresh-btn" onClick={() => window.location.reload()}>↺ Refresh</button>
        </div>
      ) : (
        <video ref={videoRef} className="vp-video" playsInline autoPlay style={{objectFit:'cover'}} />
      )}

      {/* No viewer pill overlay in player — count shown below title in info section */}

      {/* Controls — styled same as vp-controls */}
      {!playerErr && stream.status !== 'ended' && (
        <div className="vp-controls" onClick={e => e.stopPropagation()}>
          {/* Thin decorative bar in place of progress bar */}
          <div className="lp-live-bar">
            <div className="lp-live-bar-fill" />
          </div>

          <div className="vp-bottom-bar">
            {/* LEFT */}
            <div className="vp-left-controls">
              {/* Mute/volume */}
              <div className="vp-volume-group"
                onMouseEnter={() => setVolumeVisible(true)}
                onMouseLeave={() => setVolumeVisible(false)}>
                <button className="vp-btn" onClick={toggleMute} title="Mute (m)">
                  {muted || volume === 0
                    ? <MuteIco2 />
                    : <VolumeIcon level={volume} />
                  }
                </button>
                <div className={`vp-volume-slider-wrap ${volumeVisible ? 'visible' : ''}`}>
                  <input
                    type="range" min="0" max="1" step="0.02"
                    value={muted ? 0 : volume}
                    onChange={e => changeVolume(parseFloat(e.target.value))}
                    className="vp-volume-slider"
                    style={{'--vol': `${(muted ? 0 : volume) * 100}%`}}
                  />
                </div>
              </div>
              {/* LIVE label */}
              <span className="vp-live-label-ctrl">● LIVE</span>
            </div>

            {/* RIGHT */}
            <div className="vp-right-controls">
              {/* Latency settings */}
              <div className="vp-settings-wrap">
                <button className="vp-btn" onClick={e => { e.stopPropagation(); setShowSettings(v=>!v) }} title="Stream settings">
                  <SettingsIcon />
                </button>
                <AnimatePresence>
                  {showSettings && (
                    <motion.div className="vp-settings-panel"
                      initial={{opacity:0,y:8,scale:0.95}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:8,scale:0.95}}
                      transition={{duration:0.16}} onClick={e => e.stopPropagation()}>
                      <div className="vp-settings-row" style={{fontWeight:700,cursor:'default',opacity:0.6,fontSize:'0.7rem',letterSpacing:'0.05em'}}>
                        STREAM DELAY
                      </div>
                      {LATENCY_OPTIONS2.map((o, i) => (
                        <button key={i} className={`vp-settings-row ${latencyIdx === i ? 'active' : ''}`} onClick={() => applyLatency(i)}>
                          {o.label}
                          {latencyIdx === i && <span className="vp-settings-check">✓</span>}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {/* Theatre (disabled for live but keeps visual parity) */}
              <button className="vp-btn" onClick={toggleFullscreen} title="Fullscreen (f)">
                {fullscreen ? <ExitFSIco /> : <FullscreenIcon />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function LiveWatchPage() {
  const { id }    = useParams()
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const socketRef = useRef(null)

  const [stream,        setStream]        = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState('')
  const [viewers,       setViewers]       = useState(0)
  const [messages,      setMessages]      = useState([])
  const [chatInput,     setChatInput]     = useState('')
  const [liked,         setLiked]         = useState(false)
  const [likeCount,     setLikeCount]     = useState(0)
  const [subscribed,    setSubscribed]    = useState(false)
  const [subCount,      setSubCount]      = useState(0)
  const [related,       setRelated]       = useState([])
  const [shareMsg,      setShareMsg]      = useState('')
  const [descExpanded,  setDescExpanded]  = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saveStatus,    setSaveStatus]    = useState(null)
  const [ending,        setEnding]        = useState(false)

  // Load stream + related
  useEffect(() => {
    let timer = null
    const load = async () => {
      try {
        const r = await api.get(`/live/${id}`)
        const s = r.data.stream
        setStream(s)
        setViewers(s?.currentViewers || 0)
        setLikeCount(s?.likeCount || 0)
        // subscriberCount comes from populated host field
        setSubCount(s?.host?.subscriberCount || 0)
        // Also fetch fresh count for accuracy (host field may be stale)
        if (s?.host?._id) {
          api.get(`/users/${s.host._id}/public`)
            .then(r => { if (r.data?.user?.subscriberCount !== undefined) setSubCount(r.data.user.subscriberCount) })
            .catch(() => {})
        }
        if (s?.status === 'scheduled') timer = setTimeout(load, 3000)
        // Chat history
        const cr = await api.get(`/live/${id}/chat`).catch(() => ({ data: { messages: [] } }))
        setMessages((cr.data.messages || []).map((m, i) => ({
          id: `h${i}`, username: m.username, avatar: m.avatar || null,
          message: m.message, ts: new Date(m.createdAt).getTime(),
        })))
        // Related videos
        const cat = s?.category ? `&category=${encodeURIComponent(s.category)}` : ''
        const vr  = await api.get(`/videos?limit=15${cat}`).catch(() => ({ data: { videos: [] } }))
        setRelated((vr.data.videos || []).filter(v => !v.isShort).slice(0, 12))
      } catch { setError('Stream not found') }
      finally  { setLoading(false) }
    }
    load()
    return () => { if (timer) clearTimeout(timer) }
  }, [id])

  // Interaction state — fetch subscribed + fresh subscriber count
  useEffect(() => {
    if (!user || !stream?.host?._id) return
    api.get(`/interactions/channel/${stream.host._id}/state`)
      .then(r => {
        if (r.data.subscribed !== undefined) setSubscribed(r.data.subscribed)
        if (r.data.subscriberCount !== undefined) setSubCount(r.data.subscriberCount)
      })
      .catch(() => {})
    api.get(`/live/${id}/interactions`)
      .then(r => {
        if (r?.data?.liked     !== undefined) setLiked(r.data.liked)
        if (r?.data?.likeCount !== undefined) setLikeCount(r.data.likeCount)
      })
      .catch(() => {})
  }, [id, user, stream?.host?._id])

  // Socket.IO
  useEffect(() => {
    if (!stream?._id) return
    const socket = io(window.location.origin, { path: '/socket.io', withCredentials: true })
    socketRef.current = socket
    socket.on('connect', () => socket.emit('stream:join', { streamId: stream._id }))
    socket.on('stream:viewers', ({ count }) => setViewers(count))
    socket.on('chat:message', msg => {
      const myUsername = user?.displayName || user?.username
      // Skip messages we already added locally
      if (myUsername && msg.username === myUsername) return
      setMessages(prev => [...prev.slice(-299), { ...msg, id: msg.id || `s_${Date.now()}_${Math.random()}` }])
    })
    socket.on('stream:ended', () => {
      setStream(p => {
        if (user && p && String(user._id) === String(p.host?._id)) setShowSaveModal(true)
        return { ...p, status: 'ended' }
      })
    })
    return () => socket.disconnect()
  }, [stream?._id, user])

  const sendChat = useCallback(() => {
    if (!chatInput.trim() || !socketRef.current) return
    const myUsername = user?.displayName || user?.username || 'Guest'
    // Add message locally immediately so it shows on right side
    const localMsg = {
      id: `local_${Date.now()}`,
      username: myUsername,
      avatar: user?.avatar || null,
      message: chatInput.trim(),
      ts: Date.now(),
      isOwn: true,
    }
    setMessages(prev => [...prev.slice(-299), localMsg])
    socketRef.current.emit('chat:message', {
      streamId: stream._id, message: chatInput.trim(),
      username: myUsername, avatar: user?.avatar || null, userId: user?._id,
    })
    setChatInput('')
  }, [chatInput, stream?._id, user])

  const handleLike = async () => {
    if (!user) return
    try {
      const r = await api.post(`/live/${id}/like`)
      setLiked(r.data.liked)
      setLikeCount(r.data.likeCount ?? likeCount)
    } catch { setLiked(p => !p); setLikeCount(p => p + (liked ? -1 : 1)) }
  }

  const handleSubscribe = async () => {
    if (!user || !stream?.host?._id) return
    try {
      const r = await api.post(`/interactions/channel/${stream.host._id}/subscribe`)
      setSubscribed(r.data.subscribed)
      if (r.data.subscriberCount !== undefined) setSubCount(r.data.subscriberCount)
    } catch {}
  }

  const handleShare = async () => {
    try { await navigator.clipboard.writeText(window.location.href); setShareMsg('Copied!') }
    catch { setShareMsg('Failed') }
    setTimeout(() => setShareMsg(''), 2000)
  }

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
      try { await api.post(`/live/${id}/save-as-video`); setSaveStatus('saved'); setTimeout(() => navigate('/'), 1800) }
      catch { setSaveStatus('error') }
    } else { navigate('/') }
  }

  const isHost = user && stream && String(user._id) === String(stream.host?._id)
  const isOwnerLive = isHost
  // Derive isLive from stream state — this updates when socket fires stream:ended
  const isLive = stream?.status === 'live'
  const ch     = stream?.host || {}

  if (loading) return <div className="lp-loading"><div className="lp-spinner" /><p>Loading stream…</p></div>
  if (error)   return <div className="lp-error"><OfflineIco /><p>{error}</p><Link to="/" className="lp-home-btn">Go Home</Link></div>

  return (
    <motion.div className="watch-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>

      {/* Save-as-video modal */}
      {showSaveModal && (
        <div className="lp-modal-bg">
          <div className="lp-modal">
            <div className="lp-modal-icon"><DownloadIcon /></div>
            <h3>Stream Ended</h3>
            <p>Would you like to save this stream as a video on your channel?</p>
            {!saveStatus && (
              <div className="lp-modal-btns">
                <button className="lp-modal-no"  onClick={() => handleSaveAsVideo(false)}>Discard</button>
                <button className="lp-modal-yes" onClick={() => handleSaveAsVideo(true)}><SaveIcon /> Save to Channel</button>
              </div>
            )}
            {saveStatus === 'saving' && <p className="lp-modal-status">Saving stream…</p>}
            {saveStatus === 'saved'  && <p className="lp-modal-status lp-ok">✓ Saved to your channel!</p>}
            {saveStatus === 'error'  && <p className="lp-modal-status lp-err">Error saving. <button onClick={() => setSaveStatus(null)} className="lp-retry">Retry</button></p>}
          </div>
        </div>
      )}

      <div className="watch-layout">
        {/* ── MAIN COLUMN ── */}
        <div className="watch-main">
          {/* Video Player */}
          <LivePlayer stream={stream} viewers={viewers} />

          <div className="watch-info">
            <h1 className="watch-title">{stream.title}</h1>

            {/* Actions row */}
            <div className="watch-actions-row">
              <div className="watch-stats">
                {isLive
                  ? <><span className="lw-live-dot-inline" /><span style={{color:'#c0392b',fontWeight:700}}>LIVE</span><span className="watch-dot">·</span></>
                  : <><span className="lw-ended-badge">Ended</span><span className="watch-dot">·</span></>
                }
                <span style={{display:'flex',alignItems:'center',gap:4}}><EyeIco />{viewers} watching</span>
                <span className="watch-dot">·</span>
                <span>{timeAgo(stream.startedAt || stream.createdAt)}</span>
                {stream.category && <><span className="watch-dot">·</span><span>{stream.category}</span></>}
              </div>
              <div className="watch-action-btns">
                {/* Like — same pill style as Watch page */}
                <div className="like-dislike-pill">
                  <button className={`like-btn ${liked ? 'active' : ''}`} onClick={handleLike}>
                    <LikeIcon filled={liked} />
                    <span>{formatViews(likeCount)}</span>
                  </button>
                </div>
                {/* Share */}
                <button className="watch-action-btn" onClick={handleShare}>
                  <ShareIcon /><span>{shareMsg || 'Share'}</span>
                </button>
                {/* End stream (host only) */}
                {isHost && isLive && (
                  <button className="watch-action-btn lw-end-btn" onClick={handleEndStream} disabled={ending}>
                    <StopIco /><span>{ending ? 'Ending…' : 'End Stream'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Channel row */}
            <div className="watch-channel-row">
              <Link to={`/channel/${ch._id || '#'}`} className="watch-channel-left">
                <div className="lw-avatar-wrap">
                  {ch.avatar
                    ? <img src={ch.avatar} alt={ch.displayName || ch.username} className="watch-channel-avatar" />
                    : <div className="watch-channel-avatar lw-avatar-fallback">{(ch.displayName || ch.username || 'A')[0].toUpperCase()}</div>
                  }
                  {isLive && <div className="lw-avatar-live-ring" />}
                </div>
                <div className="watch-channel-info">
                  <div className="watch-channel-name-row">
                    <span className="watch-channel-name">{ch.displayName || ch.username}</span>
                    {ch.isChannelVerified && <VerifiedIcon />}
                  </div>
                  <span className="watch-channel-subs">{formatViews(subCount || ch.subscriberCount || 0)} subscribers</span>
                </div>
              </Link>
              <motion.button
                className={`subscribe-btn ${isOwnerLive ? 'manage' : subscribed ? 'subscribed' : ''}`}
                onClick={isOwnerLive ? () => window.open('http://localhost:5174', '_blank') : handleSubscribe}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                {isOwnerLive ? 'Manage Channel' : subscribed ? 'Subscribed ✓' : 'Subscribe'}
              </motion.button>
            </div>

            {/* Description */}
            {stream.description && (
              <div className={`watch-desc ${descExpanded ? 'expanded' : ''}`}>
                <p className="watch-desc-text">{stream.description}</p>
                <button className="watch-desc-toggle" onClick={() => setDescExpanded(v => !v)}>
                  {descExpanded ? <><ChevronUpIcon /> Show less</> : <><ChevronDownIcon /> Show more</>}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── SIDEBAR ── */}
        <div className="watch-sidebar">
          {/* Live Chat Panel — collapsible like playlist panel */}
          <LiveChatPanel
            streamId={stream._id}
            messages={messages}
            chatInput={chatInput}
            setChatInput={setChatInput}
            onSend={sendChat}
            viewers={viewers}
            chatEnabled={stream.chatEnabled}
            user={user}
            streamEnded={!isLive}
          />

          {/* Related videos */}
          <div className="related-list">
            {related.map(v => <RelatedVideoCard key={v._id} video={v} />)}
            {related.length === 0 && (
              <p style={{color:'var(--t3)',fontFamily:'DM Sans,sans-serif',fontSize:'0.875rem',textAlign:'center',padding:'32px 16px'}}>
                No related videos yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {shareMsg === 'Copied!' && null}
      </AnimatePresence>
    </motion.div>
  )
}

// ── PLAYLIST WATCH PANEL (YouTube-style sidebar panel) ────────────────────────
const ListIcon     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
const ChevRightIcon= () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
const LoopIcon     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
const ShuffleIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>
const CollapseIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
const ExpandIcon   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
// 3-dots icons for related cards
const DotsHIcon      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>
const WLIcon         = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
const PlaylistAddIcon= () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="16" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
const ShareSmIcon    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
const NotIntIcon2    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
const HideChIcon     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
const FlagSmIcon     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
const CheckSmIcon    = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>

function PlaylistWatchPanel({ playlistId, currentVideoId, currentIndex }) {
  const navigate   = useNavigate()
  const [playlist, setPlaylist]  = useState(null)
  const [loading,  setLoading]   = useState(true)
  const [collapsed,setCollapsed] = useState(false)
  const [loop,     setLoop]      = useState(false)
  const activeRef  = useRef(null)
  const scrollRef  = useRef(null)

  useEffect(() => {
    if (!playlistId) return
    setLoading(true)
    api.get(`/playlists/${playlistId}/details`)
      .then(r => setPlaylist(r.data.playlist))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [playlistId])

  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const el = activeRef.current
      const container = scrollRef.current
      const offset = el.offsetTop - container.offsetTop - (container.clientHeight / 2) + (el.clientHeight / 2)
      container.scrollTo({ top: offset, behavior: 'smooth' })
    }
  }, [playlist, currentIndex])

  if (!playlistId) return null

  const videos   = playlist?.videos || []
  const activeIdx = currentIndex != null ? Number(currentIndex) : videos.findIndex(v => v._id === currentVideoId)

  const goTo = (videoId, idx) => {
    navigate(`/watch/${videoId}?list=${playlistId}&index=${idx}`)
  }

  const handleShuffle = () => {
    if (!videos.length) return
    const idx = Math.floor(Math.random() * videos.length)
    goTo(videos[idx]._id, idx)
  }

  return (
    <div className={`plw-panel ${collapsed ? 'plw-panel--collapsed' : ''}`}>

      {/* Header */}
      <div className="plw-header">
        <div className="plw-header-top">
          <div className="plw-header-titles">
            <span className="plw-title">{loading ? 'Loading\u2026' : (playlist?.title || 'Playlist')}</span>
            {!loading && playlist && (
              <span className="plw-subtitle">
                {playlist.owner?.displayName || playlist.owner?.username}
                {' \u00b7 '}
                <span className="plw-progress">{activeIdx >= 0 ? activeIdx + 1 : '\u2013'} / {videos.length}</span>
              </span>
            )}
          </div>
          <button
            className="plw-collapse-btn"
            onClick={() => setCollapsed(v => !v)}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ExpandIcon /> : <CollapseIcon />}
          </button>
        </div>

        {!collapsed && (
          <div className="plw-header-controls">
            <button
              className={`plw-ctrl-btn ${loop ? 'active' : ''}`}
              onClick={() => setLoop(v => !v)}
              title="Loop"
            ><LoopIcon /></button>
            <button
              className="plw-ctrl-btn"
              onClick={handleShuffle}
              title="Shuffle"
            ><ShuffleIcon /></button>
          </div>
        )}
      </div>

      {/* Video list */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            ref={scrollRef}
            className="plw-scroll"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          >
            {loading ? (
              <>
                {[1,2,3,4].map(i => (
                  <div key={i} className="plw-skeleton-row">
                    <div className="plw-skel plw-skel-num" />
                    <div className="plw-skel plw-skel-thumb" />
                    <div className="plw-skel-info">
                      <div className="plw-skel plw-skel-line" />
                      <div className="plw-skel plw-skel-line-sm" />
                    </div>
                  </div>
                ))}
              </>
            ) : videos.length === 0 ? (
              <p className="plw-empty">No videos in this playlist.</p>
            ) : (
              videos.map((video, idx) => {
                const isActive = idx === activeIdx
                return (
                  <div
                    key={video._id}
                    ref={isActive ? activeRef : null}
                    className={`plw-item ${isActive ? 'plw-item--active' : ''}`}
                    onClick={() => !isActive && goTo(video._id, idx)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && !isActive && goTo(video._id, idx)}
                  >
                    <span className="plw-item-num">
                      {isActive
                        ? <span className="plw-playing-bars"><span/><span/><span/></span>
                        : idx + 1
                      }
                    </span>
                    <div className="plw-item-thumb-wrap">
                      <img
                        src={video.thumbnailUrl || 'https://via.placeholder.com/120x68/1a1a2e/fff?text=\u25ba'}
                        alt={video.title}
                        className="plw-item-thumb"
                        loading="lazy"
                      />
                      {video.duration > 0 && (
                        <span className="plw-item-dur">{formatDuration(video.duration)}</span>
                      )}
                    </div>
                    <div className="plw-item-info">
                      <p className="plw-item-title">{video.title}</p>
                      <p className="plw-item-channel">
                        {video.uploader?.displayName || video.uploader?.username}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── SHARE PANEL ───────────────────────────────────────────────────────────────
function SharePanel({ url, onClose, onShare }) {
  const [copied, setCopied] = useState(false)
  const [startTime, setStartTime] = useState('')
  const [useStartTime, setUseStartTime] = useState(false)

  const shareUrl = useStartTime && startTime ? `${url}&t=${startTime}s` : url

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      onShare?.()
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {}
  }

  const PLATFORMS = [
    { name: 'WhatsApp',  color: '#25D366', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.5 2C6.253 2 2 6.253 2 11.5c0 1.87.504 3.62 1.382 5.12L2 22l5.5-1.382A9.44 9.44 0 0011.5 21c5.247 0 9.5-4.253 9.5-9.5S16.747 2 11.5 2zm0 17.5a7.986 7.986 0 01-4.071-1.11l-.29-.173-3.006.755.77-2.935-.19-.302A7.951 7.951 0 013.5 11.5C3.5 7.082 7.082 3.5 11.5 3.5S19.5 7.082 19.5 11.5 15.918 19.5 11.5 19.5z"/></svg> },
    { name: 'Twitter',   color: '#1DA1F2', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg> },
    { name: 'Facebook',  color: '#1877F2', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg> },
    { name: 'Telegram',  color: '#2CA5E0', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg> },
    { name: 'Reddit',    color: '#FF4500', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/><path fill="white" d="M12 8a4 4 0 014 4 4 4 0 01-4 4 4 4 0 01-4-4 4 4 0 014-4zm-5 4a5 5 0 005 5 5 5 0 005-5 5 5 0 00-5-5 5 5 0 00-5 5z"/></svg> },
    { name: 'Email',     color: '#EA4335', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
  ]

  const handlePlatformShare = (name) => {
    const enc = encodeURIComponent(shareUrl)
    const urls = {
      WhatsApp: `https://wa.me/?text=${enc}`,
      Twitter:  `https://twitter.com/intent/tweet?url=${enc}`,
      Facebook: `https://www.facebook.com/sharer/sharer.php?u=${enc}`,
      Telegram: `https://t.me/share/url?url=${enc}`,
      Reddit:   `https://reddit.com/submit?url=${enc}`,
      Email:    `mailto:?subject=Check%20this%20out&body=${enc}`,
    }
    window.open(urls[name], '_blank', 'noopener')
  }

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <motion.div className="share-backdrop"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div className="share-panel"
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}>

        <div className="share-header">
          <h3 className="share-title">Share</h3>
          <button className="share-close-btn" onClick={onClose}><CloseIcon /></button>
        </div>

        {/* Platform icons */}
        <div className="share-platforms">
          {PLATFORMS.map(p => (
            <button key={p.name} className="share-platform-btn" onClick={() => handlePlatformShare(p.name)}>
              <div className="share-platform-icon" style={{ background: p.color + '22', color: p.color }}>
                {p.icon}
              </div>
              <span className="share-platform-name">{p.name}</span>
            </button>
          ))}
        </div>

        <div className="share-divider" />

        {/* Start time option */}
        <label className="share-start-time-row">
          <input type="checkbox" className="share-checkbox"
            checked={useStartTime} onChange={e => setUseStartTime(e.target.checked)} />
          <span className="share-start-label">Start at</span>
          <input type="text" className="share-time-input"
            placeholder="e.g. 42"
            value={startTime}
            onChange={e => setStartTime(e.target.value.replace(/\D/g, ''))}
            disabled={!useStartTime}
          />
          <span className="share-time-unit">seconds</span>
        </label>

        {/* Copy link */}
        <div className="share-copy-row">
          <div className="share-url-pill">
            <span className="share-url-text">{shareUrl.replace(/^https?:\/\//, '')}</span>
          </div>
          <motion.button
            className={`share-copy-btn ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
            whileTap={{ scale: 0.96 }}>
            {copied ? (
              <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copied!</>
            ) : (
              <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy link</>
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}

export default function Watch() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const playlistId    = searchParams.get('list')
  const playlistIndex = searchParams.get('index')
  const { user } = useAuth()
  const { updateVideoStats, updateChannelStats } = useStats()

  const [video,         setVideo]         = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState('')
  const [theatreMode,   setTheatreMode]   = useState(false)
  const [miniPlayer,    setMiniPlayer]    = useState(false)
  const [liked,         setLiked]         = useState(false)
  const [disliked,      setDisliked]      = useState(false)
  const [subscribed,    setSubscribed]    = useState(false)
  const [related,       setRelated]       = useState([])
  const [relatedShorts, setRelatedShorts] = useState([])
  const [saved,         setSaved]         = useState(false)
  const [watchLater,    setWatchLater]    = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showSharePanel, setShowSharePanel] = useState(false)
  const [likeCount,     setLikeCount]     = useState(0)
  const [subCount,      setSubCount]      = useState(0)
  const [shareMsg,      setShareMsg]      = useState('')
  const [dlState,       setDlState]       = useState('idle')
  const [dlProgress,    setDlProgress]    = useState(0)
  const [dlMsg,         setDlMsg]         = useState('')
  const [alreadyDled,   setAlreadyDled]   = useState(false)
  const [offlineUrl,    setOfflineUrl]    = useState(null)
  const [commentLoading,setCommentLoading]= useState(false)
  const [descExpanded,  setDescExpanded]  = useState(false)
  const [commentText,   setCommentText]   = useState('')
  const [commentFocused,setCommentFocused]= useState(false)
  const [sortBy,        setSortBy]        = useState('Top comments')
  const [showSort,      setShowSort]      = useState(false)
  const [comments,      setComments]      = useState([])
  // ── comment interactions ──────────────────────────────────────────
  const [replyingTo,    setReplyingTo]    = useState(null)
  const [replyText,     setReplyText]     = useState('')
  const [replyLoading,  setReplyLoading]  = useState(false)
  const [expandedReplies, setExpandedReplies] = useState({})
  const [loadingReplies,  setLoadingReplies]  = useState(null)
  const [commentLikes,    setCommentLikes]    = useState({})
  // ── Live VOD chat replay ──────────────────────────────────────────
  const [vodMessages,   setVodMessages]   = useState([])   // all chat msgs with streamOffsetMs
  const [visibleChat,   setVisibleChat]   = useState([])   // messages visible at currentTime
  const [chatPanelOpen, setChatPanelOpen] = useState(true)
  const [vodCurrentTime, setVodCurrentTime] = useState(0)

  // Fetch video
  useEffect(() => {
    let cancelled = false
    setLoading(true); setError('')
    api.get(`/videos/${id}`)
      .then(res => {
        if (!cancelled) {
          const v = res.data.video || res.data.data?.video
          setVideo(v)
          setLikeCount(v?.likeCount || 0)
          setSubCount(v?.uploader?.subscriberCount || 0)
          setLoading(false)
        }
      })
      .catch(err => { if (!cancelled) { setError(err.response?.data?.message || 'Video not found'); setLoading(false) } })
    return () => { cancelled = true }
  }, [id])

  // Check if already downloaded + get offline blob URL if available
  useEffect(() => {
    if (!id) return
    let blobUrl = null
    isDownloaded(id).then(async (downloaded) => {
      setAlreadyDled(downloaded)
      if (downloaded) {
        blobUrl = await getOfflineVideoUrl(id).catch(() => null)
        if (blobUrl) setOfflineUrl(blobUrl)
      }
    }).catch(() => {})
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl) }
  }, [id])

  // Fetch interaction state (liked/saved/subscribed) + comments
  useEffect(() => {
    if (!id || !user) return
    api.get(`/interactions/${id}`)
      .then(r => {
        setLiked(r.data.liked || false)
        setDisliked(r.data.disliked || false)
        setSaved(r.data.saved || false)
        setWatchLater(r.data.watchLater || false)
        setSubscribed(r.data.subscribed || false)
      })
      .catch(() => {})
    api.get(`/interactions/${id}/comments?sort=top`)
      .then(r => {
        const fetched = r.data.comments || []
        setComments(fetched)
        const likesMap = {}
        fetched.forEach(c => {
          likesMap[c._id] = { liked: c.likedByMe || false, count: c.likeCount || 0 }
        })
        setCommentLikes(likesMap)
      })
      .catch(() => {})
  }, [id, user])

  // Fetch related videos via recommendation engine
  const { active: focusActive, blockedCategories } = useFocus()
  useEffect(() => {
    if (!id) return
    import('../../services/recommendationService.js').then(({ getNext }) => {
      getNext(id, 25)
        .then(results => {
          let vids = results.filter(v => v._id !== id)
          if (focusActive && blockedCategories.length > 0) {
            vids = vids.filter(v => !blockedCategories.includes(v.category))
          }
          const shorts  = vids.filter(v =>  v.isShort).slice(0, 9)
          const regular = vids.filter(v => !v.isShort).slice(0, 20)
          setRelatedShorts(focusActive ? [] : shorts)
          setRelated(regular)
        })
        .catch(() => {})
    })
  }, [id, focusActive, blockedCategories])

  // ── Live VOD chat replay ──────────────────────────────────────────
  useEffect(() => {
    if (!video?.isLiveVOD || !video?.sourceStreamId) return
    api.get(`/live/${video.sourceStreamId}/vod-chat`)
      .then(r => setVodMessages(r.data.messages || []))
      .catch(() => {})
  }, [video?.isLiveVOD, video?.sourceStreamId])

  useEffect(() => {
    if (!vodMessages.length) return
    const visible = vodMessages.filter(m => (m.streamOffsetMs / 1000) <= vodCurrentTime)
    setVisibleChat(visible)
  }, [vodCurrentTime, vodMessages])

  const vodChatFeedRef = useRef(null)
  useEffect(() => {
    if (vodChatFeedRef.current) {
      vodChatFeedRef.current.scrollTop = vodChatFeedRef.current.scrollHeight
    }
  }, [visibleChat])

  const handleLike = async () => {
    if (!user) return
    try {
      const r = await api.post(`/interactions/${id}/like`)
      setLiked(r.data.liked)
      setDisliked(r.data.disliked)
      setLikeCount(r.data.likeCount ?? likeCount)
      // Broadcast to all components showing this video's stats
      updateVideoStats(id, { liked: r.data.liked, disliked: r.data.disliked, likeCount: r.data.likeCount })
    } catch {}
  }

  const handleDislike = async () => {
    if (!user) return
    try {
      const r = await api.post(`/interactions/${id}/dislike`)
      setDisliked(r.data.disliked)
      setLiked(r.data.liked)
      setLikeCount(r.data.likeCount ?? likeCount)
      updateVideoStats(id, { liked: r.data.liked, disliked: r.data.disliked, likeCount: r.data.likeCount })
    } catch {}
  }

  const handleSave = () => {
    if (!user) return
    setShowSaveModal(true)
  }

  const handleSubscribe = async () => {
    if (!user || !video?.uploader?._id) return
    try {
      const r = await api.post(`/interactions/channel/${video.uploader._id}/subscribe`)
      setSubscribed(r.data.subscribed)
      setSubCount(r.data.subscriberCount ?? subCount)
      // Broadcast to Channel page and any VideoCard showing this channel
      updateChannelStats(video.uploader._id, {
        subscribed:      r.data.subscribed,
        subscriberCount: r.data.subscriberCount,
      })
    } catch {}
  }

  const handleShare = () => {
    setShowSharePanel(true)
  }

  const handleDownload = async () => {
    if (!video?.videoUrl) return
    if (dlState === 'downloading') return
    if (alreadyDled) {
      setDlMsg('Already saved offline!'); setTimeout(() => setDlMsg(''), 2500); return
    }
    setDlState('downloading'); setDlProgress(0); setDlMsg('')
    try {
      await saveDownload(video, (pct) => setDlProgress(pct))
      setDlState('done'); setAlreadyDled(true); setDlMsg('Saved for offline!')
      setTimeout(() => { setDlState('idle'); setDlMsg('') }, 3000)
    } catch (err) {
      setDlState('error'); setDlMsg(err.message || 'Download failed')
      setTimeout(() => { setDlState('idle'); setDlMsg('') }, 3500)
    }
  }

  const handleComment = async () => {
    if (!commentText.trim() || !user) return
    setCommentLoading(true)
    try {
      const r = await api.post(`/interactions/${id}/comments`, { text: commentText })
      setComments(prev => [r.data.comment, ...prev])
      setCommentText('')
      setCommentFocused(false)
      // Broadcast updated comment count
      updateVideoStats(id, { commentCount: r.data.commentCount })
    } catch {}
    finally { setCommentLoading(false) }
  }

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/interactions/${id}/comments/${commentId}`)
      setComments(prev => prev.filter(c => c._id !== commentId))
      updateVideoStats(id, { commentCount: Math.max(0, (video?.commentCount || 1) - 1) })
    } catch {}
  }

  const handleSortChange = (sort) => {
    setSortBy(sort); setShowSort(false)
    const s = sort === 'Newest first' ? 'newest' : 'top'
    api.get(`/interactions/${id}/comments?sort=${s}`)
      .then(r => {
        const fetched = r.data.comments || []
        setComments(fetched)
        const likesMap = {}
        fetched.forEach(c => {
          likesMap[c._id] = { liked: c.likedByMe || false, count: c.likeCount || 0 }
        })
        setCommentLikes(likesMap)
      })
      .catch(() => {})
  }

  const handleLikeComment = async (commentId) => {
    if (!user) return
    const prev = commentLikes[commentId] || { liked: false, count: 0 }
    setCommentLikes(m => ({
      ...m,
      [commentId]: { liked: !prev.liked, count: prev.liked ? prev.count - 1 : prev.count + 1 }
    }))
    try {
      await api.post(`/interactions/${id}/comments/${commentId}/like`)
    } catch {
      setCommentLikes(m => ({ ...m, [commentId]: prev }))
    }
  }

  const handleReplySubmit = async (parentId) => {
    if (!replyText.trim() || !user) return
    setReplyLoading(true)
    try {
      const r = await api.post(`/interactions/${id}/comments`, { text: replyText.trim(), parentId })
      const newReply = r.data.comment
      setExpandedReplies(prev => ({
        ...prev,
        [parentId]: [...(prev[parentId] || []), newReply],
      }))
      setComments(prev => prev.map(c =>
        c._id === parentId ? { ...c, replyCount: (c.replyCount || 0) + 1 } : c
      ))
      setReplyText('')
      setReplyingTo(null)
    } catch {}
    finally { setReplyLoading(false) }
  }

  const toggleReplies = async (comment) => {
    const cid = comment._id
    if (expandedReplies[cid]) {
      setExpandedReplies(prev => { const n = { ...prev }; delete n[cid]; return n })
      return
    }
    setLoadingReplies(cid)
    try {
      const r = await api.get(`/interactions/${id}/comments/${cid}/replies`)
      const replies = r.data.replies || []
      setExpandedReplies(prev => ({ ...prev, [cid]: replies }))
      setCommentLikes(prev => {
        const m = { ...prev }
        replies.forEach(rep => {
          m[rep._id] = { liked: rep.likedByMe || false, count: rep.likeCount || 0 }
        })
        return m
      })
    } catch {}
    finally { setLoadingReplies(null) }
  }

  if (loading) return <WatchSkeleton />
  if (error)   return (
    <div style={{padding:64,textAlign:'center',color:'rgba(255,255,255,0.4)',fontFamily:'DM Sans,sans-serif'}}>
      <p style={{fontSize:'1.2rem',marginBottom:8}}>{error}</p>
      <p style={{fontSize:'0.85rem'}}>The video may have been deleted or made private.</p>
    </div>
  )

  const ch = video.uploader || {}
  const isOwner = !!(user && ch._id && (user._id === ch._id || user.id === ch._id))

  return (
    <motion.div className={`watch-page ${theatreMode?'theatre-mode':''}`}
      initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.3}}
    >
      <div className={`watch-layout ${playlistId ? 'watch-layout--has-playlist' : ''}`}>
        {/* ── MAIN COLUMN ── */}
        <div className="watch-main">
          <VideoPlayer
            video={offlineUrl ? { ...video, videoUrl: offlineUrl } : video}
            theatreMode={theatreMode}
            onTheatreToggle={() => setTheatreMode(v=>!v)}
            onMiniPlayer={() => setMiniPlayer(true)}
            nextVideoId={related[0]?._id}
            prevVideoId={null}
            onTimeUpdate={video?.isLiveVOD ? setVodCurrentTime : undefined}
          />

          <div className="watch-info">
            <h1 className="watch-title">{video.title}</h1>

            <div className="watch-actions-row">
              <div className="watch-stats">
                <span>{formatViews(video.viewCount)} views</span>
                <span className="watch-dot">·</span>
                <span>{timeAgo(video.createdAt)}</span>
              </div>
              <div className="watch-action-btns">
                <div className="like-dislike-pill">
                  <button className={`like-btn ${liked?'active':''}`} onClick={handleLike}>
                    <LikeIcon filled={liked} />
                    <span>{formatViews(likeCount)}</span>
                  </button>
                  <div className="pill-divider" />
                  <button className={`dislike-btn ${disliked?'active':''}`} onClick={handleDislike}>
                    <DislikeIcon filled={disliked} />
                  </button>
                </div>
                <button className="watch-action-btn" onClick={handleShare}><ShareIcon /><span>Share</span></button>
                <button className={`watch-action-btn ${watchLater?'active':''}`} onClick={handleSave}><SaveIcon /><span>{watchLater ? 'Saved' : 'Save'}</span></button>
                <div className="watch-dl-wrap">
                  <button
                    className={"watch-action-btn watch-dl-btn" + (alreadyDled ? ' active' : '') + (dlState === 'downloading' ? ' dl-busy' : '')}
                    onClick={handleDownload}
                    disabled={dlState === 'downloading'}
                    title={alreadyDled ? 'Already saved offline' : 'Save for offline'}
                  >
                    <DownloadIcon />
                    <span>
                      {dlState === 'downloading' ? `${dlProgress}%` : alreadyDled ? 'Saved' : 'Download'}
                    </span>
                  </button>
                  {dlState === 'downloading' && (
                    <div className="watch-dl-progress-bar">
                      <div className="watch-dl-progress-fill" style={{ width: dlProgress + '%' }} />
                    </div>
                  )}
                  {dlMsg && <span className={"watch-dl-msg" + (dlState === 'error' ? ' error' : '')}>{dlMsg}</span>}
                </div>
              </div>
            </div>

            {/* Channel row */}
            <div className="watch-channel-row">
              <Link to={`/channel/${ch.handle || ch._id}`} className="watch-channel-left">
                <img
                  src={ch.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${ch.displayName||ch.username}`}
                  alt={ch.displayName || ch.username}
                  className="watch-channel-avatar"
                />
                <div className="watch-channel-info">
                  <div className="watch-channel-name-row">
                    <span className="watch-channel-name">{ch.displayName || ch.username}</span>
                    {ch.isChannelVerified && <VerifiedIcon />}
                  </div>
                  <span className="watch-channel-subs">{formatViews(subCount || ch.subscriberCount || 0)} subscribers</span>
                </div>
              </Link>
              <motion.button
                className={`subscribe-btn ${isOwner ? 'manage' : subscribed ? 'subscribed' : ''}`}
                onClick={isOwner ? () => window.open('http://localhost:5174', '_blank') : handleSubscribe}
                whileHover={{scale:1.04}} whileTap={{scale:0.96}}
              >{isOwner ? 'Manage Video' : subscribed ? 'Subscribed ✓' : 'Subscribe'}</motion.button>
            </div>

            {/* Description */}
            <div className={`watch-desc ${descExpanded?'expanded':''}`}>
              {video.tags?.length > 0 && (
                <div className="watch-desc-tags">
                  {video.tags.map(tag => <span key={tag} className="watch-tag">#{tag}</span>)}
                </div>
              )}
              <p className="watch-desc-text">
                {video.description || 'No description provided for this video.'}
              </p>
              <button className="watch-desc-toggle" onClick={() => setDescExpanded(v=>!v)}>
                {descExpanded ? <><ChevronUpIcon /> Show less</> : <><ChevronDownIcon /> Show more</>}
              </button>
            </div>
            {/* Comments */}
            <div className="watch-comments">
              <div className="comments-header">
                <span className="comments-count">{formatViews(comments.length)} Comments</span>
                <div className="comments-sort-wrap">
                  <button className="comments-sort-btn" onClick={() => setShowSort(v=>!v)}>
                    <SortIcon /><span>{sortBy}</span><ChevronDownIcon />
                  </button>
                  <AnimatePresence>
                    {showSort && (
                      <motion.div className="sort-dropdown"
                        initial={{opacity:0,y:-8,scale:0.95}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-8,scale:0.95}} transition={{duration:0.16}}
                      >
                        {['Top comments','Newest first'].map(s => (
                          <button key={s} className={`sort-item ${sortBy===s?'active':''}`} onClick={() => handleSortChange(s)}>{s}</button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="add-comment-wrap">
                <img src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.username || 'u'}`} alt="you" className="comment-avatar" />
                <div className="add-comment-inner">
                  <input className={`comment-input ${commentFocused?'focused':''}`}
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onFocus={() => setCommentFocused(true)}
                  />
                  <AnimatePresence>
                    {commentFocused && (
                      <motion.div className="comment-input-actions"
                        initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.18}}
                      >
                        <button className="comment-cancel-btn" onClick={() => { setCommentFocused(false); setCommentText('') }}>Cancel</button>
                        <button className={`comment-submit-btn ${commentText.trim()?'active':''}`}
                          disabled={!commentText.trim() || commentLoading} onClick={handleComment}>{commentLoading ? 'Posting...' : 'Comment'}</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="comments-list">
                {comments.map(comment => {
                  const author       = comment.author || {}
                  const authorName   = author.displayName || author.username || 'Anonymous'
                  const authorAvatar = author.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${authorName}`
                  const isOwn        = user && (author._id === user._id || author._id === user.id)
                  const isCreator    = user && ch._id && (user._id === ch._id || user.id === ch._id)
                  const cLike        = commentLikes[comment._id] || { liked: false, count: comment.likeCount || 0 }
                  const isReplying   = replyingTo === comment._id
                  const replies      = expandedReplies[comment._id]
                  const hasReplies   = (comment.replyCount || 0) > 0 || (replies?.length > 0)

                  return (
                    <div key={comment._id}>
                      <div className="comment-card">
                        <img src={authorAvatar} alt={authorName} className="comment-avatar" />
                        <div className="comment-body">
                          <div className="comment-header">
                            <span className="comment-author">{authorName}</span>
                            {isCreator && author._id === ch._id && (
                              <span className="comment-creator-badge">Creator</span>
                            )}
                            <span className="comment-time">{timeAgo(comment.createdAt)}</span>
                            {(isOwn || isCreator) && (
                              <button className="comment-delete-btn"
                                onClick={() => handleDeleteComment(comment._id)}
                                title="Delete comment">✕</button>
                            )}
                          </div>
                          <p className="comment-text">{comment.text}</p>
                          <div className="comment-actions">
                            <button
                              className={`comment-action-btn ${cLike.liked ? 'active' : ''}`}
                              onClick={() => handleLikeComment(comment._id)}
                            >
                              <LikeIcon filled={cLike.liked} />
                              <span>{cLike.count > 0 ? cLike.count : ''}</span>
                            </button>
                            <button
                              className={`comment-action-btn ${isReplying ? 'active' : ''}`}
                              onClick={() => { setReplyingTo(isReplying ? null : comment._id); setReplyText('') }}
                            >
                              <ReplyIcon /><span>Reply</span>
                            </button>
                          </div>

                          {isReplying && (
                            <div className="reply-input-wrap">
                              <img
                                src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.username||'u'}`}
                                alt="you" className="comment-avatar" style={{ width:28, height:28 }}
                              />
                              <div className="reply-input-inner">
                                <input
                                  className="comment-input focused"
                                  placeholder={`Reply to ${authorName}…`}
                                  value={replyText}
                                  onChange={e => setReplyText(e.target.value)}
                                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReplySubmit(comment._id) } }}
                                  autoFocus
                                />
                                <div className="comment-input-actions">
                                  <button className="comment-cancel-btn" onClick={() => { setReplyingTo(null); setReplyText('') }}>Cancel</button>
                                  <button
                                    className={`comment-submit-btn ${replyText.trim() ? 'active' : ''}`}
                                    disabled={!replyText.trim() || replyLoading}
                                    onClick={() => handleReplySubmit(comment._id)}
                                  >{replyLoading ? 'Posting…' : 'Reply'}</button>
                                </div>
                              </div>
                            </div>
                          )}

                          {hasReplies && (
                            <button className="show-replies-btn" onClick={() => toggleReplies(comment)}>
                              <ChevronDownIcon />
                              {loadingReplies === comment._id
                                ? 'Loading…'
                                : replies
                                  ? `Hide ${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`
                                  : `View ${comment.replyCount} ${comment.replyCount === 1 ? 'reply' : 'replies'}`
                              }
                            </button>
                          )}
                        </div>
                      </div>

                      {replies && replies.map(reply => {
                        const rAuthor  = reply.author || {}
                        const rName    = rAuthor.displayName || rAuthor.username || 'Anonymous'
                        const rAvatar  = rAuthor.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${rName}`
                        const rIsOwn   = user && (rAuthor._id === user._id || rAuthor._id === user.id)
                        const rLike    = commentLikes[reply._id] || { liked: false, count: reply.likeCount || 0 }
                        return (
                          <div key={reply._id} className="comment-card reply">
                            <img src={rAvatar} alt={rName} className="comment-avatar" style={{ width:28, height:28 }} />
                            <div className="comment-body">
                              <div className="comment-header">
                                <span className="comment-author">{rName}</span>
                                <span className="comment-time">{timeAgo(reply.createdAt)}</span>
                                {(rIsOwn || isCreator) && (
                                  <button className="comment-delete-btn"
                                    onClick={() => handleDeleteComment(reply._id)}
                                    title="Delete reply">✕</button>
                                )}
                              </div>
                              <p className="comment-text">{reply.text}</p>
                              <div className="comment-actions">
                                <button
                                  className={`comment-action-btn ${rLike.liked ? 'active' : ''}`}
                                  onClick={() => handleLikeComment(reply._id)}
                                >
                                  <LikeIcon filled={rLike.liked} />
                                  <span>{rLike.count > 0 ? rLike.count : ''}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
                {comments.length === 0 && (
                  <p style={{color:'var(--t3)',fontFamily:'DM Sans,sans-serif',fontSize:'0.875rem',textAlign:'center',padding:'32px 0'}}>
                    No comments yet. Be the first to comment!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── SIDEBAR ── */}
        <div className="watch-sidebar">
          {/* Playlist panel — shown when ?list= param is present */}
          {playlistId && (
            <PlaylistWatchPanel
              playlistId={playlistId}
              currentVideoId={id}
              currentIndex={playlistIndex}
            />
          )}

          {/* ── Live VOD Chat Replay — sidebar panel, same style as live chat ── */}
          {video?.isLiveVOD && (
            <div className="lchat-panel">
              <div className="lchat-header">
                <div className="lchat-header-top">
                  <div className="lchat-header-titles">
                    <span className="lchat-title">
                      <ChatIco /> Chat Replay
                    </span>
                    <span className="lchat-subtitle">
                      {visibleChat.length} / {vodMessages.length} messages
                    </span>
                  </div>
                  <button
                    className="lchat-collapse-btn"
                    onClick={() => setChatPanelOpen(p => !p)}
                    title={chatPanelOpen ? 'Collapse' : 'Expand'}
                  >
                    {chatPanelOpen ? <CollapseIcon /> : <ExpandIcon />}
                  </button>
                </div>
              </div>
              <AnimatePresence initial={false}>
                {chatPanelOpen && (
                  <motion.div
                    className="lchat-body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 380, opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="lchat-feed" ref={vodChatFeedRef}>
                      {visibleChat.length === 0 ? (
                        <div className="lchat-empty">
                          <p>
                            {vodMessages.length === 0
                              ? 'No chat was recorded for this stream.'
                              : 'Chat appears as the video plays…'}
                          </p>
                        </div>
                      ) : (
                        visibleChat.map((msg, i) => (
                          <div key={msg._id || i} className="lchat-row">
                            <div className="lchat-avi">
                              {msg.avatar
                                ? <img src={msg.avatar} alt="" />
                                : <span>{msg.username?.[0]?.toUpperCase() || '?'}</span>
                              }
                            </div>
                            <div className={`lchat-bubble ${msg.isHost ? 'lchat-bubble--host' : 'lchat-bubble--other'}`}>
                              <span className="lchat-name" style={msg.isHost ? { color: 'var(--rose)' } : {}}>
                                {msg.username}
                                {msg.isHost && <span className="vod-host-badge" style={{ marginLeft: 5 }}>HOST</span>}
                              </span>
                              <span className="lchat-text"> {msg.message}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="lchat-off" style={{ fontSize: 12, color: 'var(--t3)', padding: '8px 14px', borderTop: '1px solid var(--border)' }}>
                      Replay only — chat plays back with the video
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <ShortsShelf shorts={relatedShorts} />
          <div className="related-list">
            {related.map(v => <RelatedVideoCard key={v._id} video={v} />)}
            {related.length === 0 && (
              <p style={{color:'var(--t3)',fontFamily:'DM Sans,sans-serif',fontSize:'0.875rem',textAlign:'center',padding:'32px 16px'}}>
                No related videos yet.
              </p>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {miniPlayer && <MiniPlayer video={video} onClose={() => setMiniPlayer(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {showSaveModal && (
          <SaveToPlaylistModal
            videoId={id}
            initialState={{ watchLater, liked }}
            onClose={() => setShowSaveModal(false)}
            onStateChange={(s) => {
              if (s.watchLater !== undefined) setWatchLater(s.watchLater)
              if (s.liked      !== undefined) setLiked(s.liked)
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSharePanel && (
          <SharePanel
            url={window.location.href}
            onClose={() => setShowSharePanel(false)}
            onShare={() => { api.post(`/interactions/${id}/share`).catch(() => {}) }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}