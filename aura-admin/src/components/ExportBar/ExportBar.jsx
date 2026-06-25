import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const DownloadIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
const PDFIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
const CSVIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>

export default function ExportBar({ onPDF, onCSV, label = 'Export' }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ position: 'relative' }}>
      <button
        className="action-btn secondary"
        onClick={() => setOpen(o => !o)}
        style={{ gap: 6 }}
      >
        <DownloadIcon />
        {label}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 2 }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0,  scale: 1 }}
              exit={{   opacity: 0, y: -4,  scale: 0.97 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                background: '#12121f', border: '1px solid var(--s4)',
                borderRadius: 'var(--r-md)', padding: '6px',
                minWidth: 160, zIndex: 50,
                boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
              }}
            >
              <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--t3)', padding: '4px 10px 6px' }}>Export As</div>
              <button
                onClick={() => { onPDF && onPDF(); setOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                  padding: '8px 10px', borderRadius: 'var(--r-sm)', background: 'none',
                  border: 'none', color: 'var(--t1)', fontSize: '0.82rem', fontWeight: 600,
                  cursor: 'pointer', transition: 'background 0.15s', textAlign: 'left',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--s3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <span style={{ color: '#f87171' }}><PDFIcon /></span>
                Export as PDF
              </button>
              <button
                onClick={() => { onCSV && onCSV(); setOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                  padding: '8px 10px', borderRadius: 'var(--r-sm)', background: 'none',
                  border: 'none', color: 'var(--t1)', fontSize: '0.82rem', fontWeight: 600,
                  cursor: 'pointer', transition: 'background 0.15s', textAlign: 'left',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--s3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <span style={{ color: '#34d399' }}><CSVIcon /></span>
                Export as CSV / Excel
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
