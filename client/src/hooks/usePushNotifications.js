// client/src/hooks/usePushNotifications.js
// Registers the service worker, subscribes to push, saves subscription to server
import { useEffect, useRef } from 'react'
import api from '../services/api'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

// Convert VAPID base64 key to Uint8Array for browser API
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export default function usePushNotifications(user) {
  const attempted = useRef(false)

  useEffect(() => {
    // Only run once per session, only when logged in
    if (!user || attempted.current) return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    if (Notification.permission === 'denied') return

    attempted.current = true

    async function setup() {
      try {
        // 1. Register service worker
        const reg = await navigator.serviceWorker.register('/sw.js')

        // 2. Request notification permission if not yet granted
        if (Notification.permission === 'default') {
          const perm = await Notification.requestPermission()
          if (perm !== 'granted') return
        }
        if (Notification.permission !== 'granted') return

        // 3. Get or create push subscription
        let sub = await reg.pushManager.getSubscription()
        if (!sub) {
          if (!VAPID_PUBLIC_KEY) {
            console.warn('[push] VITE_VAPID_PUBLIC_KEY not set in client .env')
            return
          }
          sub = await reg.pushManager.subscribe({
            userVisibleOnly:      true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          })
        }

        // 4. Save subscription to server
        await api.post('/notifications/push/subscribe', { subscription: sub.toJSON() })
        console.log('[push] ✅ Subscribed to push notifications')
      } catch (err) {
        // Silent fail — push is non-critical
        console.warn('[push] Setup failed:', err.message)
      }
    }

    setup()
  }, [user])
}