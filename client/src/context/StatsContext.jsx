// FILE: client/src/context/StatsContext.jsx
// Global live-update context — components call updateVideoStats / updateChannelStats
// and any other component consuming the context re-renders instantly.
import { createContext, useContext, useState, useCallback } from 'react'

const StatsContext = createContext(null)

export function StatsProvider({ children }) {
  // videoStats: { [videoId]: { likeCount, dislikeCount, viewCount, commentCount, liked, disliked, saved, watchLater } }
  const [videoStats, setVideoStats] = useState({})
  // channelStats: { [channelId]: { subscriberCount, subscribed } }
  const [channelStats, setChannelStats] = useState({})
  // notifCount: number (unread notifications badge)
  const [notifCount, setNotifCount] = useState(0)

  const updateVideoStats = useCallback((videoId, patch) => {
    setVideoStats(prev => ({
      ...prev,
      [videoId]: { ...(prev[videoId] || {}), ...patch },
    }))
  }, [])

  const updateChannelStats = useCallback((channelId, patch) => {
    setChannelStats(prev => ({
      ...prev,
      [channelId]: { ...(prev[channelId] || {}), ...patch },
    }))
  }, [])

  const getVideoStats = useCallback((videoId) => {
    return videoStats[videoId] || {}
  }, [videoStats])

  const getChannelStats = useCallback((channelId) => {
    return channelStats[channelId] || {}
  }, [channelStats])

  return (
    <StatsContext.Provider value={{
      updateVideoStats,
      updateChannelStats,
      getVideoStats,
      getChannelStats,
      notifCount,
      setNotifCount,
    }}>
      {children}
    </StatsContext.Provider>
  )
}

export function useStats() {
  const ctx = useContext(StatsContext)
  if (!ctx) throw new Error('useStats must be used within StatsProvider')
  return ctx
}

export default StatsContext