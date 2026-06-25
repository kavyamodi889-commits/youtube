// FILE: client/src/pages/NotFound/NotFound.jsx
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import './NotFound.css'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <motion.div
      className="nf-page"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.34,1.56,0.64,1] }}
    >
      <div className="nf-glow" />

      <div className="nf-code">
        <span className="nf-4">4</span>
        <span className="nf-0">
          <span className="nf-0-ring" />
          <span className="nf-0-dot" />
        </span>
        <span className="nf-4">4</span>
      </div>

      <h1 className="nf-title">Page not found</h1>
      <p className="nf-sub">
        The page you're looking for doesn't exist, was moved, or the link is broken.
      </p>

      <div className="nf-actions">
        <motion.button
          className="nf-btn-primary"
          onClick={() => navigate('/')}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        >
          Go home
        </motion.button>
        <motion.button
          className="nf-btn-secondary"
          onClick={() => navigate(-1)}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        >
          Go back
        </motion.button>
      </div>

      <p className="nf-hint">
        Looking for something? Try searching on{' '}
        <button className="nf-link" onClick={() => navigate('/search')}>AURA Search</button>
      </p>
    </motion.div>
  )
}