// FILE: client/src/pages/FocusMode/FocusMode.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useFocus, BLOCKABLE_CATEGORIES } from '../../context/FocusContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import api from '../../services/api'
import './FocusMode.css'

const DURATIONS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '90 min', value: 90 },
  { label: '2 hours', value: 120 },
  { label: 'Custom',  value: 0  },
]

const FOCUS_QUOTES = [
  'The secret of getting ahead is getting started.',
  'It does not matter how slowly you go as long as you do not stop.',
  'Focus on being productive instead of busy.',
  'You don\'t have to be great to start, but you have to start to be great.',
  'Small steps every day lead to big results.',
  'Discipline is choosing what you want most over what you want now.',
  'Your future is created by what you do today.',
  'Concentrate all your thoughts upon the work at hand.',
]

export default function FocusMode() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { startSession, active } = useFocus()

  const [step,       setStep]       = useState(1) // 1=duration, 2=blocks, 3=goal
  const [duration,   setDuration]   = useState(60)
  const [custom,     setCustom]     = useState('')
  const [useCustom,  setUseCustom]  = useState(false)
  const [blocked,    setBlocked]    = useState(['Gaming', 'Entertainment', 'Memes'])
  const [goal,       setGoal]       = useState('')
  const [customCat,  setCustomCat]  = useState('')
  const [progress,   setProgress]   = useState(null)  // monthly focus reward progress

  // Fetch monthly progress for reward tracker
  useEffect(() => {
    if (!user) return
    api.get('/focus/progress')
      .then(r => setProgress(r.data))
      .catch(() => {})
  }, [user])

  if (!user) return (
    <div className="focus-setup-page">
      <div className="focus-auth-wall">
        <div className="focus-auth-icon">🎯</div>
        <h2>Sign in to use Focus Mode</h2>
        <p>Track your sessions and monitor your digital wellbeing.</p>
        <button className="focus-start-btn" onClick={() => navigate('/auth')}>Sign in</button>
      </div>
    </div>
  )

  const finalDuration = useCustom ? (Number(custom) || 60) : duration
  const customIsValid = !useCustom || (Number(custom) >= 5 && Number(custom) <= 360)

  const toggleCategory = (cat) => {
    setBlocked(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  const addCustomCategory = () => {
    const val = customCat.trim()
    if (!val) return
    const normalised = val.charAt(0).toUpperCase() + val.slice(1)
    if (blocked.includes(normalised)) { setCustomCat(''); return }
    setBlocked(prev => [...prev, normalised])
    setCustomCat('')
  }

  const handleStart = async () => {
    const quote = FOCUS_QUOTES[Math.floor(Math.random() * FOCUS_QUOTES.length)]
    await startSession({ duration: finalDuration, categories: blocked, goal, quote })
    // Navigate back to home — user browses AURA normally with focus filters applied.
    // The timer pill in the navbar lets them open /focus-wall at any time.
    navigate('/')
  }

  return (
    <div className="focus-setup-page">
      <motion.div className="focus-setup-card"
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}>

        {/* Header */}
        <div className="focus-setup-header">
          <div className="focus-setup-icon">🎯</div>
          <div>
            <h1 className="focus-setup-title">Focus Mode</h1>
            <p className="focus-setup-sub">Block distractions. Get things done.</p>
          </div>
        </div>

        {/* Step indicators */}
        <div className="focus-steps">
          {[1,2,3].map(s => (
            <div key={s} className={`focus-step-dot ${step >= s ? 'active' : ''} ${step === s ? 'current' : ''}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" className="focus-step-content"
              initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }}
              exit={{ opacity:0, x:-20 }} transition={{ duration:0.2 }}>
              <h3 className="focus-step-title">How long will you focus?</h3>
              <div className="focus-duration-grid">
                {DURATIONS.map(d => (
                  <motion.button key={d.value}
                    className={`focus-duration-btn ${
                      d.value === 0
                        ? useCustom ? 'active' : ''
                        : !useCustom && duration === d.value ? 'active' : ''
                    }`}
                    onClick={() => {
                      if (d.value === 0) { setUseCustom(true) }
                      else { setUseCustom(false); setDuration(d.value) }
                    }}
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                    {d.label}
                  </motion.button>
                ))}
              </div>
              {useCustom && (
                <motion.div className="focus-custom-wrap"
                  initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}>
                  <input
                    className={`focus-custom-input ${useCustom && custom && Number(custom) < 5 ? 'focus-custom-input--error' : ''}`}
                    type="number" min="5" max="360"
                    placeholder="Minutes (5–360)"
                    value={custom}
                    onChange={e => setCustom(e.target.value)}
                  />
                  {useCustom && custom && Number(custom) < 5 && (
                    <p className="focus-custom-error">⚠️ Minimum session length is 5 minutes</p>
                  )}
                </motion.div>
              )}
              <motion.button
                className="focus-next-btn"
                onClick={() => { if (customIsValid) setStep(2) }}
                style={{ opacity: customIsValid ? 1 : 0.45, cursor: customIsValid ? 'pointer' : 'not-allowed' }}
                whileHover={{ scale: customIsValid ? 1.03 : 1 }}
                whileTap={{ scale: customIsValid ? 0.97 : 1 }}>
                Next →
              </motion.button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" className="focus-step-content"
              initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }}
              exit={{ opacity:0, x:-20 }} transition={{ duration:0.2 }}>
              <h3 className="focus-step-title">Block distracting content</h3>
              <p className="focus-step-hint">Shorts are always blocked. Toggle categories or add your own.</p>
              <div className="focus-category-grid">
                {BLOCKABLE_CATEGORIES.map(cat => (
                  <motion.button key={cat}
                    className={`focus-cat-btn ${blocked.includes(cat) ? 'blocked' : ''}`}
                    onClick={() => toggleCategory(cat)}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    {blocked.includes(cat) ? '🚫 ' : '✓ '}{cat}
                  </motion.button>
                ))}
                {/* Extra custom categories added by user */}
                {blocked.filter(c => !BLOCKABLE_CATEGORIES.includes(c)).map(cat => (
                  <motion.button key={cat}
                    className="focus-cat-btn blocked focus-cat-custom"
                    onClick={() => toggleCategory(cat)}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    🚫 {cat}
                  </motion.button>
                ))}
              </div>

              {/* Add custom category */}
              <div className="focus-custom-cat-row">
                <input
                  className="focus-custom-cat-input"
                  placeholder="Add custom category…"
                  value={customCat}
                  onChange={e => setCustomCat(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustomCategory()}
                  maxLength={30}
                />
                <motion.button
                  className="focus-custom-cat-add"
                  onClick={addCustomCategory}
                  whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                  disabled={!customCat.trim()}
                >
                  + Add
                </motion.button>
              </div>

              <div className="focus-nav-row">
                <button className="focus-back-btn" onClick={() => setStep(1)}>← Back</button>
                <motion.button className="focus-next-btn" onClick={() => setStep(3)}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  Next →
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" className="focus-step-content"
              initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }}
              exit={{ opacity:0, x:-20 }} transition={{ duration:0.2 }}>
              <h3 className="focus-step-title">What will you accomplish?</h3>
              <p className="focus-step-hint">Optional — gives your session a purpose.</p>
              <textarea
                className="focus-goal-input"
                placeholder="e.g. Finish Chapter 4 of my textbook..."
                value={goal}
                onChange={e => setGoal(e.target.value)}
                maxLength={200}
                rows={3}
              />
              <div className="focus-summary">
                <div className="focus-summary-item">
                  <span className="focus-summary-icon">⏱</span>
                  <span>{finalDuration} minutes</span>
                </div>
                <div className="focus-summary-item">
                  <span className="focus-summary-icon">🚫</span>
                  <span>{blocked.length} categories blocked</span>
                </div>
              </div>
              <div className="focus-nav-row">
                <button className="focus-back-btn" onClick={() => setStep(2)}>← Back</button>
                <motion.button className="focus-start-btn" onClick={handleStart}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                  🎯 Start Focus
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Monthly Focus Reward Progress ── */}
      {user && progress && (
        <motion.div className="focus-reward-tracker"
          initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
          transition={{ delay:0.2, type:'spring', stiffness:280, damping:26 }}>
          <div className="frt-header">
            <span className="frt-icon">🎁</span>
            <div>
              <div className="frt-title">Monthly Focus Rewards</div>
              <div className="frt-sub">Complete sessions this month to earn free subscriptions</div>
            </div>
          </div>

          {/* 30-min → Premium */}
          <div className="frt-row">
            <div className="frt-row-top">
              <div className="frt-reward-label">
                <span className="frt-reward-icon frt-premium-icon">⭐</span>
                <span>30-min sessions → <strong>1 Month Premium Free</strong></span>
              </div>
              <span className={`frt-count ${progress.premiumRewardClaimed ? 'frt-claimed' : ''}`}>
                {progress.premiumRewardClaimed ? '✓ Claimed' : `${progress.count30}/100`}
              </span>
            </div>
            <div className="frt-bar-track">
              <motion.div className="frt-bar-fill frt-bar-premium"
                initial={{ width:0 }}
                animate={{ width: progress.premiumRewardClaimed ? '100%' : `${progress.count30}%` }}
                transition={{ duration: 0.8, ease:'easeOut' }} />
            </div>
          </div>

          {/* 1-hr → Ultra */}
          <div className="frt-row">
            <div className="frt-row-top">
              <div className="frt-reward-label">
                <span className="frt-reward-icon frt-ultra-icon">👑</span>
                <span>1-hour sessions → <strong>1 Month Ultra Free</strong></span>
              </div>
              <span className={`frt-count ${progress.ultraRewardClaimed ? 'frt-claimed' : ''}`}>
                {progress.ultraRewardClaimed ? '✓ Claimed' : `${progress.count60}/100`}
              </span>
            </div>
            <div className="frt-bar-track">
              <motion.div className="frt-bar-fill frt-bar-ultra"
                initial={{ width:0 }}
                animate={{ width: progress.ultraRewardClaimed ? '100%' : `${progress.count60}%` }}
                transition={{ duration: 0.8, ease:'easeOut', delay: 0.1 }} />
            </div>
          </div>

          <p className="frt-note">Progress resets each month · Rewards activate automatically on completion</p>
        </motion.div>
      )}
    </div>
  )
}