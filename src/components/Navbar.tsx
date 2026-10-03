import { AnimatePresence, motion, useScroll, useMotionValueEvent } from 'framer-motion'
import { Gamepad2, Menu, Plane, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { nav } from '../data/site'
import type { Theme } from '../hooks/useTheme'
import { useLockBody } from '../hooks/useLockBody'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'

export function Navbar({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: () => void }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { scrollY } = useScroll()
  const location = useLocation()

  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 24))
  useEffect(() => setOpen(false), [location.pathname])
  useLockBody(open)

  return (
    <>
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4"
      >
        <nav
          className={`flex w-full max-w-6xl items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-500 sm:px-5 ${
            scrolled ? 'glass shadow-[0_10px_40px_-15px_rgba(0,0,0,0.5)]' : 'border border-transparent'
          }`}
          aria-label="Huvudmeny"
        >
          <Logo />

          <ul className="hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <li key={item.to}>
                {item.external ? (
                  <a
                    href={item.to}
                    className="relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium text-muted transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500"
                  >
                    {item.label}
                    {item.icon === 'gamepad' ? (
                      <Gamepad2 className="h-3.5 w-3.5 text-ember-500" />
                    ) : (
                      <Plane className="h-3.5 w-3.5 text-ember-500" />
                    )}
                  </a>
                ) : (
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `relative rounded-full px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500 ${
                      isActive ? 'text-fg' : 'text-muted hover:text-fg'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span
                          layoutId="nav-pill"
                          className="absolute inset-0 -z-10 rounded-full bg-ember-500/15 ring-1 ring-ember-500/40"
                          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                        />
                      )}
                      {item.label}
                    </>
                  )}
                </NavLink>
                )}
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? 'Stäng meny' : 'Öppna meny'}
              className="glass inline-flex h-10 w-10 items-center justify-center rounded-full text-fg transition-all hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500 md:hidden"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex flex-col bg-[var(--bg)]/80 px-6 pb-10 pt-28 backdrop-blur-2xl md:hidden"
          >
            <ul className="flex flex-col gap-2">
              {nav.map((item, i) => (
                <motion.li
                  key={item.to}
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ delay: 0.05 * i, duration: 0.35, ease: 'easeOut' }}
                >
                  {item.external ? (
                    <a
                      href={item.to}
                      className="glass flex items-center justify-between rounded-2xl px-5 py-4 transition-all active:scale-[0.98]"
                    >
                      <span className="font-display text-2xl text-ember-500">{item.label}</span>
                      <span className="text-xs uppercase tracking-[0.2em] text-muted">{item.eyebrow}</span>
                    </a>
                  ) : (
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `glass flex items-center justify-between rounded-2xl px-5 py-4 transition-all active:scale-[0.98] ${
                        isActive ? 'glow-ring' : ''
                      }`
                    }
                  >
                    <span className="font-display text-2xl text-ember-500">{item.label}</span>
                    <span className="text-xs uppercase tracking-[0.2em] text-muted">{item.eyebrow}</span>
                  </NavLink>
                  )}
                </motion.li>
              ))}
            </ul>
            <p className="mt-auto text-center font-serif italic text-muted">
              En fabrik någonstans i rymden.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
