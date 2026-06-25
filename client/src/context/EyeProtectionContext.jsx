// FILE: client/src/context/EyeProtectionContext.jsx
import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from './AuthContext.jsx'
import api from '../services/api'

const EyeProtectionContext = createContext(null)

const BLINK_INTERVAL    =  1 * 60 * 1000  //  1 min  — eye blink reminder (while watching)
const BREAK_INTERVAL    = 30 * 60 * 1000  // 30 min  — walk/stretch reminder
const BLINK_AUTO_DISMISS =  8 * 1000       //  8 sec  — blink card auto-hides

// ─── Fallbacks if Gemini API is unavailable ───────────────────────
const BLINK_FALLBACKS = [
  { message: "Look 20 feet away for 20 seconds!", fact: "We blink 66% less while using screens — dry eyes incoming." },
  { message: "Blink slowly 10 times right now.",  fact: "A full blink spreads fresh tear film across your cornea." },
  { message: "Give your eyes a 20-second rest.",  fact: "Eye strain affects 65% of people who regularly use screens." },
  { message: "Palming — cover eyes with warm hands for 10s.", fact: "Palming relieves eye muscle tension almost instantly." },
]
const BREAK_FALLBACKS = [
  { message: "Stand up and stretch — 30 minutes on screen!", fact: "Short breaks boost focus by up to 35% when you return." },
  { message: "Walk around and free your joints.",            fact: "2 minutes of walking every 30 min cuts circulation risks." },
  { message: "Roll your shoulders back. You earned it!",    fact: "Movement breaks lower cortisol and sharpen your mood." },
  { message: "Get some water and take a quick walk.",        fact: "Hydration + movement = measurably better focus after." },
]

function randomFallback(list) {
  return list[Math.floor(Math.random() * list.length)]
}

export function EyeProtectionProvider({ children }) {
  const { user } = useAuth()

  const [blinkVisible,  setBlinkVisible]  = useState(false)
  const [breakVisible,  setBreakVisible]  = useState(false)
  const [blinkContent,  setBlinkContent]  = useState(null)
  const [breakContent,  setBreakContent]  = useState(null)
  const [enabled,       setEnabled]       = useState(true)

  // One-shot timers — restarted manually after each trigger/dismiss
  const blinkTimeout   = useRef(null)
  const breakTimeout   = useRef(null)
  const autoDismiss    = useRef(null)
  const isRunning      = useRef(false)

  const fetchMessage = useCallback(async (type) => {
    try {
      const res = await api.get(`/wellness/message?type=${type}`)
      if (res.data?.message) return res.data
      throw new Error('empty')
    } catch {
      return type === 'blink'
        ? randomFallback(BLINK_FALLBACKS)
        : randomFallback(BREAK_FALLBACKS)
    }
  }, [])

  // ── Show blink pill ─────────────────────────────────────────────
  const showBlink = useCallback(async () => {
    if (!enabled) return
    const content = await fetchMessage('blink')
    setBlinkContent(content)
    setBlinkVisible(true)
    // Auto-dismiss after 8s, then restart blink timer from NOW
    clearTimeout(autoDismiss.current)
    autoDismiss.current = setTimeout(() => {
      setBlinkVisible(false)
      scheduleBlink()  // restart 20-min timer after pill hides
    }, BLINK_AUTO_DISMISS)
  }, [enabled, fetchMessage]) // eslint-disable-line

  // ── Dismiss blink pill (user clicked ×) ────────────────────────
  const dismissBlink = useCallback(() => {
    clearTimeout(autoDismiss.current)
    setBlinkVisible(false)
    scheduleBlink()  // restart 20-min timer from moment user dismissed
  }, []) // eslint-disable-line

  // ── Show break modal ────────────────────────────────────────────
  const showBreak = useCallback(async () => {
    if (!enabled) return
    const content = await fetchMessage('break')
    setBreakContent(content)
    setBreakVisible(true)
    // Timer does NOT restart until user closes the modal
  }, [enabled, fetchMessage])

  // ── Dismiss break modal (user clicked close) ────────────────────
  const dismissBreak = useCallback(() => {
    setBreakVisible(false)
    scheduleBreak()  // restart 30-min timer from moment user closes modal
  }, []) // eslint-disable-line

  // ── Schedule next blink (one-shot timeout) ─────────────────────
  const scheduleBlink = useCallback(() => {
    clearTimeout(blinkTimeout.current)
    blinkTimeout.current = setTimeout(() => showBlink(), BLINK_INTERVAL)
  }, [showBlink])

  // ── Schedule next break (one-shot timeout) ─────────────────────
  const scheduleBreak = useCallback(() => {
    clearTimeout(breakTimeout.current)
    breakTimeout.current = setTimeout(() => showBreak(), BREAK_INTERVAL)
  }, [showBreak])

  // ── DEV ONLY: instant test triggers ────────────────────────────
  const testBlink = useCallback(async () => {
    const content = await fetchMessage('blink')
    setBlinkContent(content)
    setBlinkVisible(true)
    clearTimeout(autoDismiss.current)
    autoDismiss.current = setTimeout(() => setBlinkVisible(false), BLINK_AUTO_DISMISS)
  }, [fetchMessage])

  const testBreak = useCallback(async () => {
    const content = await fetchMessage('break')
    setBreakContent(content)
    setBreakVisible(true)
  }, [fetchMessage])

  // ── Start timers when user logs in ─────────────────────────────
  // Timer starts from the moment of login (user object appears in context)
  useEffect(() => {
    if (!user || !enabled) {
      // Not logged in or disabled — clear everything
      clearTimeout(blinkTimeout.current)
      clearTimeout(breakTimeout.current)
      clearTimeout(autoDismiss.current)
      isRunning.current = false
      return
    }

    if (isRunning.current) return  // already running, don't restart on re-render
    isRunning.current = true

    // Both timers start from NOW (login time)
    scheduleBlink()
    scheduleBreak()

    return () => {
      clearTimeout(blinkTimeout.current)
      clearTimeout(breakTimeout.current)
      clearTimeout(autoDismiss.current)
      isRunning.current = false
    }
  }, [user, enabled, scheduleBlink, scheduleBreak])

  // ── If disabled mid-session, clear everything ──────────────────
  useEffect(() => {
    if (!enabled) {
      clearTimeout(blinkTimeout.current)
      clearTimeout(breakTimeout.current)
      clearTimeout(autoDismiss.current)
      setBlinkVisible(false)
      setBreakVisible(false)
      isRunning.current = false
    }
  }, [enabled])

  return (
    <EyeProtectionContext.Provider value={{
      blinkVisible, breakVisible,
      blinkContent, breakContent,
      enabled, setEnabled,
      dismissBlink, dismissBreak,
      testBlink, testBreak,      // dev preview only
    }}>
      {children}
    </EyeProtectionContext.Provider>
  )
}

export function useEyeProtection() {
  const ctx = useContext(EyeProtectionContext)
  if (!ctx) throw new Error('useEyeProtection must be used within EyeProtectionProvider')
  return ctx
}