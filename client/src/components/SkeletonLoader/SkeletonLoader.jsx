// FILE: client/src/components/SkeletonLoader/SkeletonLoader.jsx
export default function SkeletonLoader({ type = 'video' }) {
  if (type === 'short') {
    return (
      <div className="skeleton-short" style={{ flexShrink: 0 }}>
        <div className="shimmer" style={{
          width: 160, height: 284,
          borderRadius: 'var(--r-lg)'
        }} />
        <div className="shimmer" style={{
          width: 120, height: 12,
          borderRadius: 4, marginTop: 8
        }} />
      </div>
    )
  }

  return (
    <div className="skeleton-video">
      <div className="shimmer" style={{
        width: '100%', aspectRatio: '16/9',
        borderRadius: 'var(--r-md)'
      }} />
      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        <div className="shimmer" style={{
          width: 36, height: 36,
          borderRadius: '50%', flexShrink: 0
        }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="shimmer" style={{ width: '90%', height: 14, borderRadius: 4 }} />
          <div className="shimmer" style={{ width: '60%', height: 12, borderRadius: 4 }} />
          <div className="shimmer" style={{ width: '40%', height: 12, borderRadius: 4 }} />
        </div>
      </div>
    </div>
  )
}