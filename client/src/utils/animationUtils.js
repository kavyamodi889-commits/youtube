// FILE: client/src/utils/animationUtils.js
export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] } },
  exit: { opacity: 0, y: -12, scale: 0.96, transition: { duration: 0.2 } }
}

export const fadeScale = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: [0.34, 1.56, 0.64, 1] } },
  exit: { opacity: 0, scale: 0.88, transition: { duration: 0.18 } }
}

export const slideFromLeft = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.38, ease: [0.34, 1.3, 0.64, 1] } },
  exit: { opacity: 0, x: -16, transition: { duration: 0.2 } }
}

export const popFromBottom = {
  hidden: { opacity: 0, y: 32, scale: 0.85, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', transition: { duration: 0.5, ease: [0.34, 1.4, 0.64, 1] } },
  exit: { opacity: 0, y: 16, scale: 0.9, transition: { duration: 0.22 } }
}

export const pillFromBottom = {
  hidden: { opacity: 0, y: 80, scale: 0.9 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.34, 1.56, 0.64, 1] } },
  exit: { opacity: 0, y: 40, scale: 0.88, transition: { duration: 0.25 } }
}

export const pageTransition = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } }
}

export const modalVariant = {
  hidden: { opacity: 0, scale: 0.88, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] } },
  exit: { opacity: 0, scale: 0.9, filter: 'blur(3px)', transition: { duration: 0.2 } }
}

export const dropdownVariant = {
  hidden: { opacity: 0, scale: 0.88, y: -8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.22, ease: [0.34, 1.4, 0.64, 1] } },
  exit: { opacity: 0, scale: 0.9, y: -4, transition: { duration: 0.15 } }
}

export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } }
}
