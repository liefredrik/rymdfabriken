import { AnimatePresence, motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'
import type { Theme } from '../hooks/useTheme'

export function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  const dark = theme === 'dark'
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={dark ? 'Byt till ljust läge' : 'Byt till mörkt läge'}
      className="glass group relative inline-flex h-10 w-10 items-center justify-center rounded-full text-fg transition-all duration-300 hover:scale-105 hover:glow-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500 active:scale-95"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="flex"
        >
          {dark ? (
            <Sun className="h-[18px] w-[18px] text-ember-400" />
          ) : (
            <Moon className="h-[18px] w-[18px] text-nebula-700" />
          )}
        </motion.span>
      </AnimatePresence>
    </button>
  )
}
