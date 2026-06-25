// FILE: client/src/context/SocketContext.jsx
// Single Socket.IO connection for the whole app
// Handles: real-time notifications, live stream events
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext.jsx'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const { user }    = useAuth()
  const socketRef   = useRef(null)
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    // Connect when user logs in, disconnect on logout
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
        setSocket(null)
        setConnected(false)
      }
      return
    }

    const s = io('http://localhost:5000', {
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    })

    s.on('connect',    () => { setConnected(true) })
    s.on('disconnect', () => { setConnected(false) })

    // Join personal notification room
    s.on('connect', () => {
      s.emit('user:join', { userId: user._id })
    })

    socketRef.current = s
    setSocket(s)

    return () => {
      s.disconnect()
      socketRef.current = null
      setSocket(null)
      setConnected(false)
    }
  }, [user?._id])

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)