// AURA Service Worker — handles push notifications and caching
const APP_NAME = 'AURA'
const CLIENT_URL = self.location.origin

// ── Push event — fires when server sends a push ──────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return

  let data
  try { data = event.data.json() }
  catch { data = { title: APP_NAME, body: event.data.text(), url: '/' } }

  const options = {
    body:    data.body    || '',
    icon:    data.icon    || '/aura-icon-192.png',
    badge:   data.badge   || '/aura-badge-72.png',
    image:   data.image   || undefined,
    tag:     data.tag     || 'aura-notification',
    data:    { url: data.url || '/' },
    vibrate: [100, 50, 100],
    actions: data.actions || [],
    requireInteraction: data.priority === 'critical',
  }

  event.waitUntil(
    self.registration.showNotification(data.title || APP_NAME, options)
  )
})

// ── Notification click — open the linked page ────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url || '/'
  const fullUrl = url.startsWith('http') ? url : `${CLIENT_URL}${url}`

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a tab for this URL is already open, focus it
      for (const client of windowClients) {
        if (client.url === fullUrl && 'focus' in client) {
          return client.focus()
        }
      }
      // Otherwise open a new tab
      if (clients.openWindow) return clients.openWindow(fullUrl)
    })
  )
})

// ── Notification close ───────────────────────────────────────────
self.addEventListener('notificationclose', () => {
  // Analytics could go here
})

// ── Activate — claim all clients immediately ─────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})