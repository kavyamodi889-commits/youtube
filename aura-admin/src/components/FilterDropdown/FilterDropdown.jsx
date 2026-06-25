// aura-admin/src/components/FilterDropdown/FilterDropdown.jsx
import { useState, useEffect, useRef } from 'react'

const ChevronIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)

export default function FilterDropdown({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const current = options.find(o => o.value === value)
  const isActive = value !== 'all'

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Trigger button — same visual as filter-chip */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`filter-chip${isActive ? ' active' : ''}`}
        style={{ display: 'flex', alignItems: 'center', gap: 5, userSelect: 'none' }}
      >
        <span>{current?.label || label}</span>
        <span style={{
          display: 'flex', alignItems: 'center',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease',
          opacity: 0.7,
        }}>
          <ChevronIcon />
        </span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          zIndex: 300,
          background: 'var(--modal-bg)',
          border: '1px solid var(--s4)',
          borderRadius: 'var(--r-md)',
          minWidth: 175,
          boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          backdropFilter: 'blur(12px)',
        }}>
          {options.map((opt, i) => {
            const isCurrent = opt.value === value
            return (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false) }}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '9px 14px',
                  fontSize: '0.8rem',
                  fontWeight: isCurrent ? 700 : 500,
                  fontFamily: 'inherit',
                  background: isCurrent ? 'var(--a-dim)' : 'transparent',
                  color: isCurrent ? 'var(--a)' : 'var(--t1)',
                  border: 'none',
                  borderBottom: i < options.length - 1 ? '1px solid var(--s2)' : 'none',
                  cursor: 'pointer',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = 'var(--s2)' }}
                onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = 'transparent' }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}