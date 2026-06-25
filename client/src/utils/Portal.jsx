// FILE: client/src/utils/Portal.jsx
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export default function Portal({ children }) {
  const el = useRef(null)
  if (!el.current) el.current = document.createElement('div')

  useEffect(() => {
    document.body.appendChild(el.current)
    return () => {
      if (document.body.contains(el.current)) {
        document.body.removeChild(el.current)
      }
    }
  }, [])

  return createPortal(children, el.current)
}