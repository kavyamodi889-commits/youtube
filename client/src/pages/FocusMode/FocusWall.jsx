// FILE: client/src/pages/FocusMode/FocusWall.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useFocus } from '../../context/FocusContext.jsx'
import './FocusWall.css'

const QUOTES = [
  'The secret of getting ahead is getting started.',
  'It does not matter how slowly you go as long as you do not stop.',
  'Focus on being productive instead of busy.',
  'Discipline is choosing what you want most over what you want now.',
  'Your future is created by what you do today.',
  'Concentrate all your thoughts upon the work at hand.',
  'Small steps every day lead to big results.',
  'You don\'t have to be great to start, but you have to start to be great.',
  'The more you sweat in practice, the less you bleed in battle.',
  'Perfection is not attainable, but if we chase perfection we can catch excellence.',
]

const EMERGENCY_PHRASE = 'I am not worried about my future and I want to waste my time'
const EMERGENCY_REASONS = [
  'I completed my work early',
  'This is a genuine emergency',
  'I need a break for health reasons',
  'I changed my mind about focusing',
]

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  return `${m}:${String(s).padStart(2,'0')}`
}

// ── GSAP-style SVG ring using CSS animation + JS for stroke calculation ──
function FocusRing({ progressPct, remaining, plannedDuration }) {
  const ringRef = useRef(null)
  const SIZE    = 280
  const STROKE  = 12
  const R       = (SIZE - STROKE) / 2
  const CIRC    = 2 * Math.PI * R

  const offset  = CIRC - (progressPct / 100) * CIRC

  // Ring colour changes at milestones
  let ringColor = 'var(--b)'
  if (progressPct >= 75)  ringColor = 'var(--a)'
  if (progressPct >= 90)  ringColor = 'var(--err)'

  return (
    <div className="focus-ring-wrap">
      <svg
        width={SIZE} height={SIZE}
        className="focus-ring-svg"
        style={{ transform: 'rotate(-90deg)', background: 'transparent', overflow: 'visible' }}
      >
        {/* Track */}
        <circle cx={SIZE/2} cy={SIZE/2} r={R}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={STROKE} />
        {/* Progress */}
        <circle ref={ringRef} cx={SIZE/2} cy={SIZE/2} r={R}
          fill="none" stroke={ringColor} strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease', filter: `drop-shadow(0 0 8px ${ringColor})` }}
        />
      </svg>
      {/* Center content */}
      <div className="focus-ring-center">
        <div className="focus-ring-time">{formatTime(remaining)}</div>
        <div className="focus-ring-label">remaining</div>
        <div className="focus-ring-pct">{Math.round(progressPct)}%</div>
      </div>
    </div>
  )
}

// ── Focus Reward Celebration Modal ────────────────────────────────────────────
function FocusRewardModal({ reward, onClose }) {
  const isUltra = reward?.tier === 'ultra'
  return (
    <motion.div className="focus-reward-backdrop"
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      onClick={onClose}>
      <motion.div className={`focus-reward-modal ${isUltra ? 'reward-ultra' : 'reward-premium'}`}
        initial={{ opacity:0, scale:0.82, y:32 }}
        animate={{ opacity:1, scale:1, y:0 }}
        exit={{ opacity:0, scale:0.88, y:24 }}
        transition={{ type:'spring', stiffness:340, damping:26 }}
        onClick={e => e.stopPropagation()}>

        <div className="focus-reward-glow" />

        <div className="focus-reward-emoji">
          {isUltra ? '👑' : '⭐'}
        </div>

        <div className={`focus-reward-badge ${isUltra ? 'badge-ultra' : 'badge-premium'}`}>
          🎯 Focus Milestone Reached!
        </div>

        <h2 className="focus-reward-title">
          You just earned<br />
          <span className={isUltra ? 'reward-ultra-text' : 'reward-premium-text'}>
            1 Month AURA {isUltra ? 'Ultra' : 'Premium'} — Free!
          </span>
        </h2>

        <p className="focus-reward-sub">
          {isUltra
            ? 'You completed 100 one-hour focus sessions this month. That\'s incredible dedication. Enjoy Ultra on us!'
            : 'You completed 100 thirty-minute focus sessions this month. Your consistency paid off. Enjoy Premium on us!'}
        </p>

        <div className="focus-reward-perks">
          {(isUltra
            ? ['Ad-free viewing', '4K Ultra HD', 'AURA Music', 'Offline downloads', 'Family sharing', 'Exclusive content']
            : ['Ad-free viewing', '4K Ultra HD', 'AURA Music', 'Offline downloads', 'Background play']
          ).map((p, i) => (
            <motion.div key={p} className="focus-reward-perk"
              initial={{ opacity:0, x:-10 }}
              animate={{ opacity:1, x:0 }}
              transition={{ delay: 0.3 + i * 0.07 }}>
              <span className="focus-perk-check">✓</span> {p}
            </motion.div>
          ))}
        </div>

        <motion.button className={`focus-reward-cta ${isUltra ? 'cta-ultra' : 'cta-premium'}`}
          onClick={onClose}
          whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}>
          Start Watching →
        </motion.button>

        <p className="focus-reward-fine">Active for 1 month · Check /premium for expiry details</p>
      </motion.div>
    </motion.div>
  )
}

export default function FocusWall() {
  const navigate = useNavigate()
  const {
    active, remaining, progressPct, plannedDuration, goal, blockedCategories,
    endSession, emergencyCount, setEmergencyCount,
    focusReward, setFocusReward,
  } = useFocus()

  const [quote,           setQuote]          = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)])
  const [showEmergency,   setShowEmergency]  = useState(false)
  const [emergencyStep,   setEmergencyStep]  = useState(1)
  const [emergencyPhrase, setEmergencyPhrase]= useState('')
  const [phraseShake,     setPhraseShake]    = useState(false)
  const [emergencyReason, setEmergencyReason]= useState('')
  const [exitCountdown,   setExitCountdown]  = useState(10)
  const [milestone,       setMilestone]      = useState(null)
  const [showReward,      setShowReward]      = useState(false)
  const exitTimerRef = useRef(null)

  // Redirect if no active session
  useEffect(() => {
    if (!active) navigate('/')
  }, [active, navigate])

  // Rotate quotes every 90 seconds
  useEffect(() => {
    const t = setInterval(() => {
      setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)])
    }, 90000)
    return () => clearInterval(t)
  }, [])

  // Show reward modal when focusReward arrives from context
  useEffect(() => {
    if (focusReward) setShowReward(true)
  }, [focusReward])

  // Milestone notifications
  const shownMilestones = useRef(new Set())
  useEffect(() => {
    const pct = Math.round(progressPct)
    if ([25, 50, 75].includes(pct) && !shownMilestones.current.has(pct)) {
      shownMilestones.current.add(pct)
      const msgs = { 25: '🚀 25% done! Keep going!', 50: '⚡ Halfway there!', 75: '🔥 75% done! Almost there!' }
      setMilestone(msgs[pct])
      setTimeout(() => setMilestone(null), 3500)
    }
  }, [progressPct])

  // Emergency exit countdown (step 3)
  useEffect(() => {
    if (emergencyStep === 3) {
      setExitCountdown(10)
      exitTimerRef.current = setInterval(() => {
        setExitCountdown(c => {
          if (c <= 1) {
            clearInterval(exitTimerRef.current)
            handleConfirmExit()
            return 0
          }
          return c - 1
        })
      }, 1000)
    } else {
      clearInterval(exitTimerRef.current)
    }
    return () => clearInterval(exitTimerRef.current)
  }, [emergencyStep])

  const openEmergency = () => {
    setEmergencyCount(c => c + 1)
    setEmergencyStep(1)
    setEmergencyPhrase('')
    setEmergencyReason('')
    setShowEmergency(true)
  }

  const handlePhraseSubmit = () => {
    if (emergencyPhrase.trim() === EMERGENCY_PHRASE) {
      setEmergencyStep(2)
    } else {
      setPhraseShake(true)
      setEmergencyPhrase('')
      setTimeout(() => setPhraseShake(false), 600)
    }
  }

  const handleReasonNext = () => {
    if (!emergencyReason) return
    setEmergencyStep(3)
  }

  const handleConfirmExit = async () => {
    setShowEmergency(false)
    await endSession('emergency')
    navigate('/')
  }

  const handleCancelEmergency = () => {
    setShowEmergency(false)
    setEmergencyStep(1)
    clearInterval(exitTimerRef.current)
  }

  const handleCloseReward = () => {
    setShowReward(false)
    setFocusReward(null)
    navigate('/')
  }

  if (!active) return null

  return (
    <div className="focus-wall">
      {/* Background ambient glow */}
      <div className="focus-wall-bg" />

      {/* Top bar */}
      <div className="focus-wall-topbar">
        <div className="focus-wall-brand">🎯 Focus Mode</div>
        {goal && <div className="focus-wall-goal">"{goal}"</div>}
        <div className="focus-wall-blocked">
          {blockedCategories.length > 0 && (
            <span>{blockedCategories.length} categories blocked</span>
          )}
        </div>
        <button className="focus-wall-back-btn" onClick={() => navigate('/')} title="Back to AURA">
          ← Browse AURA
        </button>
      </div>

      {/* Main ring */}
      <div className="focus-wall-main">
        <FocusRing progressPct={progressPct} remaining={remaining} plannedDuration={plannedDuration} />

        <motion.p className="focus-wall-quote"
          key={quote}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.6 }}>
          "{quote}"
        </motion.p>
      </div>

      {/* Bottom controls */}
      <div className="focus-wall-controls">
        <motion.button className="focus-emergency-btn" onClick={openEmergency}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
          ⚠️ Emergency Exit
        </motion.button>
      </div>

      {/* Milestone toast */}
      <AnimatePresence>
        {milestone && (
          <motion.div className="focus-milestone"
            initial={{ opacity:0, y:30, scale:0.88 }}
            animate={{ opacity:1, y:0, scale:1 }}
            exit={{ opacity:0, y:-20, scale:0.92 }}
            transition={{ type:'spring', stiffness:400, damping:28 }}>
            {milestone}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Focus Reward celebration modal */}
      <AnimatePresence>
        {showReward && focusReward && (
          <FocusRewardModal reward={focusReward} onClose={handleCloseReward} />
        )}
      </AnimatePresence>

      {/* Emergency exit modal */}
      <AnimatePresence>
        {showEmergency && (
          <motion.div className="focus-emergency-backdrop"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
            <motion.div className="focus-emergency-modal"
              initial={{ opacity:0, scale:0.88, y:16 }}
              animate={{ opacity:1, scale:1, y:0 }}
              exit={{ opacity:0, scale:0.9 }}
              transition={{ type:'spring', stiffness:380, damping:30 }}>

              <div className="focus-emergency-header">
                <span className="focus-emergency-icon">⚠️</span>
                <h3>Emergency Exit — Step {emergencyStep} of 3</h3>
              </div>

              {emergencyStep === 1 && (
                <div className="focus-emergency-body">
                  <p className="focus-emergency-instruction">
                    Type exactly to confirm you want to exit:
                  </p>
                  <p className="focus-emergency-phrase-target">
                    "{EMERGENCY_PHRASE}"
                  </p>
                  <motion.input
                    className={`focus-emergency-input ${phraseShake ? 'shake' : ''}`}
                    placeholder="Type the phrase exactly..."
                    value={emergencyPhrase}
                    onChange={e => setEmergencyPhrase(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handlePhraseSubmit() }}
                    animate={phraseShake ? { x: [-7,7,-7,7,-5,5,-3,3,0] } : {}}
                    transition={{ duration: 0.5 }}
                  />
                  <div className="focus-emergency-btns">
                    <button className="focus-emergency-cancel" onClick={handleCancelEmergency}>← Stay Focused</button>
                    <button className="focus-emergency-next" onClick={handlePhraseSubmit}>Confirm →</button>
                  </div>
                </div>
              )}

              {emergencyStep === 2 && (
                <div className="focus-emergency-body">
                  <p className="focus-emergency-instruction">Why are you exiting? (required)</p>
                  <div className="focus-reason-list">
                    {EMERGENCY_REASONS.map(r => (
                      <button key={r}
                        className={`focus-reason-btn ${emergencyReason === r ? 'selected' : ''}`}
                        onClick={() => setEmergencyReason(r)}>
                        {emergencyReason === r ? '● ' : '○ '}{r}
                      </button>
                    ))}
                  </div>
                  <div className="focus-emergency-btns">
                    <button className="focus-emergency-cancel" onClick={handleCancelEmergency}>← Stay Focused</button>
                    <button className="focus-emergency-next"
                      onClick={handleReasonNext}
                      style={{ opacity: emergencyReason ? 1 : 0.4 }}
                      disabled={!emergencyReason}>
                      Next →
                    </button>
                  </div>
                </div>
              )}

              {emergencyStep === 3 && (
                <div className="focus-emergency-body">
                  <p className="focus-emergency-instruction">
                    Exiting in <span className="focus-countdown-num">{exitCountdown}</span>s...
                  </p>
                  <div className="focus-countdown-bar">
                    <div className="focus-countdown-fill"
                      style={{ width: `${(exitCountdown / 10) * 100}%` }} />
                  </div>
                  <button className="focus-emergency-cancel" style={{ width:'100%', marginTop: 12 }}
                    onClick={handleCancelEmergency}>
                    ← No, stay focused
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}