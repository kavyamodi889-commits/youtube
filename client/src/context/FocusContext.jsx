// FILE: client/src/context/FocusContext.jsx
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import api from '../services/api'

const FocusContext = createContext(null)

// Categories that can be blocked during focus
export const BLOCKABLE_CATEGORIES = [
  'Gaming', 'Entertainment', 'Music', 'Comedy',
  'Vlogs', 'Anime', 'Sports', 'News', 'Memes',
]

// ── Session storage key ──────────────────────────────────────
const SS_KEY = 'aura_focus_session'

function loadFromStorage() {
  try {
    const raw = sessionStorage.getItem(SS_KEY)
    if (!raw) return null
    const s = JSON.parse(raw)
    // If startedAt is stale (> 12h ago), discard
    if (!s.startedAt || Date.now() - s.startedAt > 12 * 60 * 60 * 1000) {
      sessionStorage.removeItem(SS_KEY)
      return null
    }
    return s
  } catch {
    return null
  }
}

function saveToStorage(state) {
  try { sessionStorage.setItem(SS_KEY, JSON.stringify(state)) } catch {}
}

function clearStorage() {
  try { sessionStorage.removeItem(SS_KEY) } catch {}
}

export function FocusProvider({ children }) {
  // Rehydrate from sessionStorage on mount
  const persisted = loadFromStorage()

  const [active,            setActive]           = useState(persisted?.active ?? false)
  const [sessionId,         setSessionId]         = useState(persisted?.sessionId ?? null)
  const [plannedDuration,   setPlannedDuration]   = useState(persisted?.plannedDuration ?? 60)
  const [blockedCategories, setBlockedCategories] = useState(persisted?.blockedCategories ?? [])
  const [goal,              setGoal]              = useState(persisted?.goal ?? '')
  const [startedAt,         setStartedAt]         = useState(persisted?.startedAt ?? null)
  const [emergencyCount,    setEmergencyCount]    = useState(persisted?.emergencyCount ?? 0)
  const [focusReward,       setFocusReward]       = useState(null)   // { tier, trigger } when reward earned
  const [monthlyProgress,   setMonthlyProgress]   = useState(null)   // { count30, count60, ... }

  // elapsed: recalculate from startedAt so it's accurate after refresh
  const calcElapsed = () => {
    if (!persisted?.startedAt || !persisted?.active) return 0
    return Math.floor((Date.now() - persisted.startedAt) / 1000)
  }
  const [elapsed, setElapsed] = useState(calcElapsed)

  const intervalRef = useRef(null)

  // Tick every second when active
  useEffect(() => {
    if (active) {
      intervalRef.current = setInterval(() => {
        setElapsed(e => e + 1)
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [active])

  // Auto-end when planned duration reached
  useEffect(() => {
    if (active && elapsed >= plannedDuration * 60) {
      endSession('timeout')
    }
  }, [elapsed, active, plannedDuration]) // eslint-disable-line

  // Persist to sessionStorage whenever key state changes
  useEffect(() => {
    if (active) {
      saveToStorage({ active, sessionId, plannedDuration, blockedCategories, goal, startedAt, emergencyCount })
    } else {
      clearStorage()
    }
  }, [active, sessionId, plannedDuration, blockedCategories, goal, startedAt, emergencyCount])

  const startSession = useCallback(async ({ duration, categories, goal: g }) => {
    const now = Date.now()
    setPlannedDuration(duration)
    setBlockedCategories(categories)
    setGoal(g)
    setStartedAt(now)
    setElapsed(0)
    setEmergencyCount(0)
    setActive(true)

    try {
      const res = await api.post('/focus/sessions', {
        plannedDuration: duration,
        blockedCategories: categories,
        goal: g,
      })
      setSessionId(res.data.session?._id || null)
    } catch {}
  }, [])

  const endSession = useCallback(async (method = 'natural') => {
    setActive(false)
    clearInterval(intervalRef.current)
    clearStorage()

    try {
      if (sessionId) {
        const res = await api.patch(`/focus/sessions/${sessionId}`, {
          status: method === 'timeout' ? 'completed' : method === 'emergency' ? 'aborted' : 'completed',
          actualDuration: Math.round(elapsed / 60),
          completionPercent: Math.min(100, Math.round((elapsed / (plannedDuration * 60)) * 100)),
          exitMethod: method,
          emergencyExitCount: emergencyCount,
        })
        // Capture reward & progress returned by server
        if (res.data?.reward) setFocusReward(res.data.reward)
        if (res.data?.progress) setMonthlyProgress(res.data.progress)
      }
    } catch {}

    setSessionId(null)
    setElapsed(0)
  }, [sessionId, elapsed, plannedDuration, emergencyCount])

  const isBlocked = useCallback((category) => {
    if (!active) return false
    return blockedCategories.includes(category)
  }, [active, blockedCategories])

  const remaining   = Math.max(0, plannedDuration * 60 - elapsed)
  const progressPct = Math.min(100, (elapsed / (plannedDuration * 60)) * 100)

  return (
    <FocusContext.Provider value={{
      active, sessionId, plannedDuration, blockedCategories, goal,
      startedAt, elapsed, remaining, progressPct, emergencyCount,
      setEmergencyCount,
      startSession, endSession, isBlocked,
      focusReward, setFocusReward,
      monthlyProgress, setMonthlyProgress,
    }}>
      {children}
    </FocusContext.Provider>
  )
}

export function useFocus() {
  const ctx = useContext(FocusContext)
  if (!ctx) throw new Error('useFocus must be used within FocusProvider')
  return ctx
}

export default FocusContext