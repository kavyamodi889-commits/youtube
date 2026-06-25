// FILE: client/src/components/EyeProtection/EyeProtection.jsx
import { motion, AnimatePresence } from 'framer-motion'
import { useEyeProtection } from '../../context/EyeProtectionContext.jsx'
import './EyeProtection.css'

// ── Cute CSS-based blinking eye ───────────────────────────────────
function CuteEye({ delay = 0, size = 'sm' }) {
  return (
    <div className={`cute-eye cute-eye--${size}`} style={{ '--blink-delay': `${delay}s` }}>
      <div className="cute-eye-ball">
        <div className="cute-iris">
          <div className="cute-pupil">
            <div className="cute-shine" />
          </div>
        </div>
      </div>
      <div className="cute-lid-top" />
      <div className="cute-lid-bot" />
      <div className="cute-lashes">
        <span/><span/><span/><span/><span/>
      </div>
    </div>
  )
}

// ── 1-min blink CARD — bottom-right corner, auto-dismisses ───────
export function BlinkPill() {
  const { blinkVisible, dismissBlink } = useEyeProtection()

  return (
    <AnimatePresence>
      {blinkVisible && (
        <motion.div
          className="ep-blink-card"
          initial={{ opacity: 0, x: 40, scale: 0.92 }}
          animate={{ opacity: 1, x: 0,  scale: 1    }}
          exit={{    opacity: 0, x: 40, scale: 0.9  }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        >
          {/* Top row: two eyes + close */}
          <div className="ep-card-header">
            <div className="ep-card-eyes">
              <CuteEye delay={0}    size="md" />
              <CuteEye delay={0.2}  size="md" />
            </div>
            <button className="ep-card-close" onClick={dismissBlink} aria-label="Dismiss">×</button>
          </div>

          {/* Message */}
          <p className="ep-card-title">Blink your eyes! 👁️</p>
          <p className="ep-card-sub">Look away from the screen for 20 seconds</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── 30-min break modal ────────────────────────────────────────────
export function BreakModal() {
  const { breakVisible, breakContent, dismissBreak } = useEyeProtection()

  return (
    <AnimatePresence>
      {breakVisible && breakContent && (
        <>
          <motion.div className="ep-break-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          />
          <div className="ep-break-outer">
            <motion.div
              className="ep-break-modal"
              initial={{ opacity: 0, scale: 0.85, y: 24 }}
              animate={{ opacity: 1, scale: 1,    y: 0  }}
              exit={{    opacity: 0, scale: 0.9,  y: 14  }}
              transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            >
              <div className="ep-break-eyes">
                <CuteEye delay={0}    size="lg" />
                <CuteEye delay={0.18} size="lg" />
              </div>

              <span className="ep-break-badge">⏱ 30 min screen time</span>
              <h2 className="ep-break-title">Time for a break!</h2>
              <p className="ep-break-msg">{breakContent.message}</p>

              <div className="ep-break-fact-box">
                <span className="ep-break-fact-icon">💡</span>
                <p className="ep-break-fact">{breakContent.fact}</p>
              </div>

              <div className="ep-break-chips">
                {[
                  { icon: '🚶', label: 'Walk'    },
                  { icon: '💧', label: 'Water'   },
                  { icon: '🧘', label: 'Stretch' },
                  { icon: '🪟', label: 'Outside' },
                ].map(a => (
                  <div key={a.label} className="ep-break-chip">
                    <span className="ep-chip-icon">{a.icon}</span>
                    <span className="ep-chip-label">{a.label}</span>
                  </div>
                ))}
              </div>

              <motion.button className="ep-break-cta" onClick={dismissBreak}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                I'll take a break ✓
              </motion.button>
              <button className="ep-break-skip" onClick={dismissBreak}>
                Skip for now
              </button>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}