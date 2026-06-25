// FILE: client/src/components/CreateMenu/CreateMenu.jsx
// Single "Create" button — opens AURA Studio where the create popup appears
import { motion } from 'framer-motion'
import './CreateMenu.css'

const PlusIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>

const STUDIO = 'http://localhost:5174'

export default function CreateMenu() {
  const handleCreate = () => {
    window.open(`${STUDIO}?create=true`, '_blank')
  }

  return (
    <motion.button
      className="cm-btn"
      onClick={handleCreate}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
    >
      <PlusIcon />
      <span>Create</span>
    </motion.button>
  )
}