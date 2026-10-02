import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

/** Shared page transition + content width. */
export function PageShell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.main
      id="top"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={`relative z-10 mx-auto w-full max-w-6xl px-4 pt-32 sm:px-6 ${className}`}
    >
      {children}
    </motion.main>
  )
}
