// FILE: client/src/utils/formatUtils.js

export function formatViews(views) {
  if (!views && views !== 0) return '0'
  if (views >= 1_000_000_000) return (views / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B'
  if (views >= 1_000_000) return (views / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (views >= 1_000) return (views / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return views.toString()
}

export function formatDuration(duration) {
  if (!duration) return '0:00'
  // Already formatted like "18:42" or "3:22:10"
  if (typeof duration === 'string' && duration.includes(':')) return duration
  // If seconds number
  const secs = parseInt(duration)
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export function formatSubscribers(count) {
  if (!count && count !== 0) return '0'
  if (count >= 1_000_000) return (count / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (count >= 1_000) return (count / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return count.toString()
}

export function timeAgo(dateStr) {
  if (!dateStr) return ''
  const now = new Date()
  const past = new Date(dateStr)
  const seconds = Math.floor((now - past) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `${weeks} week${weeks !== 1 ? 's' : ''} ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`
  const years = Math.floor(days / 365)
  return `${years} year${years !== 1 ? 's' : ''} ago`
}

export function formatNumber(num) {
  if (!num && num !== 0) return '0'
  return new Intl.NumberFormat('en-IN').format(num)
}