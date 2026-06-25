// FILE: client/src/pages/Live/MobileStream.jsx
// Mobile camera streaming page — opened on phone via QR code scan
// Phone captures camera → MediaRecorder chunks → Socket.IO → server FFmpeg → HLS
import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { io } from 'socket.io-client'
import './MobileStream.css'

export default function MobileStream() {
  const [params]      = useSearchParams()
  const streamId      = params.get('sid')
  const streamKey     = params.get('key')

  const [status,      setStatus]   = useState('idle')   // idle|requesting|streaming|done|error
  const [error,       setError]    = useState('')
  const [viewers,     setViewers]  = useState(0)
  const [camFacing,   setCamFacing] = useState('user')  // 'user'|'environment'

  const videoRef    = useRef(null)
  const socketRef   = useRef(null)
  const mediaRecRef = useRef(null)
  const streamRef   = useRef(null)

  // Validate params
  useEffect(() => {
    if (!streamId || !streamKey) {
      setError('Invalid QR code. Please scan the correct QR code from AURA Studio.')
      setStatus('error')
    }
  }, [streamId, streamKey])

  const startStream = async () => {
    setStatus('requesting')
    setError('')

    try {
      // Request camera + mic
      const media = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: camFacing,
          width:  { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
        audio: true,
      })
      streamRef.current = media

      // Show local preview
      if (videoRef.current) {
        videoRef.current.srcObject = media
        videoRef.current.muted = true
        videoRef.current.play()
      }

      // Connect to server
      const serverUrl = `http://${window.location.hostname}:5000`
      const socket    = io(serverUrl, { transports: ['websocket'] })
      socketRef.current = socket

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : 'video/mp4'

      socket.on('connect', () => {
        socket.emit('stream:start', { streamId, streamKey, mimeType })
      })

      socket.on('stream:ready', () => {
        setStatus('streaming')

        const recorder = new MediaRecorder(media, {
          mimeType,
          videoBitsPerSecond: 2_000_000,
        })
        mediaRecRef.current = recorder

        recorder.ondataavailable = async (e) => {
          if (e.data.size > 0 && socket.connected) {
            const buf = await e.data.arrayBuffer()
            socket.emit('stream:chunk', buf)
          }
        }

        recorder.start(500) // 500ms chunks
      })

      socket.on('stream:viewers', ({ count }) => setViewers(count))
      socket.on('stream:error',   (msg) => { setError(msg); setStatus('error') })
      socket.on('stream:ended',   () => { setStatus('done'); stopAll() })
      socket.on('disconnect',     () => { if (status === 'streaming') setError('Connection lost') })

    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera and microphone access in your browser settings.')
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.')
      } else {
        setError(`Error: ${err.message}`)
      }
      setStatus('error')
    }
  }

  const stopAll = () => {
    mediaRecRef.current?.stop()
    streamRef.current?.getTracks().forEach(t => t.stop())
    socketRef.current?.emit('stream:end')
    socketRef.current?.disconnect()
  }

  const handleStop = () => {
    stopAll()
    setStatus('done')
  }

  const flipCamera = async () => {
    const newFacing = camFacing === 'user' ? 'environment' : 'user'
    setCamFacing(newFacing)

    if (status === 'streaming') {
      // Stop current tracks
      streamRef.current?.getTracks().forEach(t => t.stop())
      try {
        const media = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: newFacing, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        })
        streamRef.current = media
        if (videoRef.current) {
          videoRef.current.srcObject = media
          videoRef.current.play()
        }
        // Restart recorder with new stream
        mediaRecRef.current?.stop()
        const mimeType = 'video/webm'
        const recorder = new MediaRecorder(media, { mimeType, videoBitsPerSecond: 2_000_000 })
        mediaRecRef.current = recorder
        recorder.ondataavailable = async (e) => {
          if (e.data.size > 0 && socketRef.current?.connected) {
            const buf = await e.data.arrayBuffer()
            socketRef.current.emit('stream:chunk', buf)
          }
        }
        recorder.start(500)
      } catch {}
    }
  }

  // ── DONE ────────────────────────────────────────────────────
  if (status === 'done') return (
    <div className="ms-root ms-center">
      <div className="ms-done-tick">✓</div>
      <h2 className="ms-title">Stream ended</h2>
      <p className="ms-sub">Thanks for streaming on AURA!</p>
    </div>
  )

  // ── ERROR ───────────────────────────────────────────────────
  if (status === 'error') return (
    <div className="ms-root ms-center">
      <div className="ms-error-icon">⚠️</div>
      <h2 className="ms-title">Something went wrong</h2>
      <p className="ms-sub">{error}</p>
      <button className="ms-retry-btn" onClick={() => { setStatus('idle'); setError('') }}>Try Again</button>
    </div>
  )

  return (
    <div className="ms-root">
      {/* Camera preview — always shown once we have stream */}
      <div className="ms-preview-wrap">
        <video ref={videoRef} className="ms-preview" autoPlay muted playsInline />
        {status === 'streaming' && (
          <div className="ms-live-badge">
            <span className="ms-live-dot" />
            LIVE · {viewers} watching
          </div>
        )}
        {status === 'streaming' && (
          <button className="ms-flip-btn" onClick={flipCamera}>
            🔄
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="ms-controls">
        {status === 'idle' && (
          <>
            <div className="ms-info">
              <p className="ms-info-title">Ready to stream</p>
              <p className="ms-info-sub">You're connected to AURA Studio.<br/>Press Start to go live.</p>
            </div>
            <div className="ms-cam-toggle">
              <button
                className={`ms-cam-btn ${camFacing === 'user' ? 'active' : ''}`}
                onClick={() => setCamFacing('user')}
              >Front Camera</button>
              <button
                className={`ms-cam-btn ${camFacing === 'environment' ? 'active' : ''}`}
                onClick={() => setCamFacing('environment')}
              >Back Camera</button>
            </div>
            <button className="ms-start-btn" onClick={startStream}>
              🔴 Start Streaming
            </button>
          </>
        )}

        {status === 'requesting' && (
          <div className="ms-info">
            <div className="ms-spinner" />
            <p className="ms-info-title">Connecting…</p>
            <p className="ms-info-sub">Requesting camera permission and connecting to server.</p>
          </div>
        )}

        {status === 'streaming' && (
          <>
            <div className="ms-streaming-info">
              <p className="ms-info-title">🔴 You're live</p>
              <p className="ms-info-sub">{viewers} {viewers === 1 ? 'viewer' : 'viewers'} watching</p>
            </div>
            <button className="ms-stop-btn" onClick={handleStop}>
              ⏹ End Stream
            </button>
          </>
        )}
      </div>
    </div>
  )
}