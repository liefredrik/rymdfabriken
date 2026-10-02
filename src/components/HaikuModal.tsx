import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronLeft, ChevronRight, Copy, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Haiku } from '../data/haiku'
import { useLockBody } from '../hooks/useLockBody'

type Props = {
  haiku: Haiku | null
  onClose: () => void
  onPrev?: () => void
  onNext?: () => void
}

export function HaikuModal({ haiku, onClose, onPrev, onNext }: Props) {
  const [copied, setCopied] = useState(false)
  useLockBody(Boolean(haiku))

  useEffect(() => {
    if (!haiku) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev?.()
      if (e.key === 'ArrowRight') onNext?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [haiku, onClose, onPrev, onNext])

  useEffect(() => setCopied(false), [haiku?.id])

  const copy = async () => {
    if (!haiku) return
    try {
      await navigator.clipboard.writeText(haiku.lines.join('\n'))
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <AnimatePresence>
      {haiku && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Haiku i helskärm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-void-950/70 p-4 backdrop-blur-xl"
          onClick={onClose}
        >
          <motion.div
            key={haiku.id}
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="glass glow-ring relative w-full max-w-2xl overflow-hidden rounded-[2rem] p-8 sm:p-12"
          >
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-ember-500/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-nebula-500/25 blur-3xl" />

            <div className="relative flex items-center justify-between">
              <span className="font-display text-base tracking-widest text-ember-500">
                Samling {haiku.chapter} · {haiku.id.split('-')[1].padStart(2, '0')}
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Stäng"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition-all hover:bg-fg/10 hover:text-fg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="relative my-10 font-serif text-3xl leading-tight text-fg sm:text-[2.6rem] sm:leading-[1.15]">
              {haiku.lines.map((line, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + i * 0.12, duration: 0.5 }}
                  className={`block ${i === 1 ? 'pl-6 italic text-ember-gradient' : ''}`}
                >
                  {line}
                </motion.span>
              ))}
            </p>

            <div className="relative flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onPrev}
                  disabled={!onPrev}
                  aria-label="Föregående haiku"
                  className="glass inline-flex h-10 w-10 items-center justify-center rounded-full text-fg transition-all hover:scale-105 hover:border-ember-500/50 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  disabled={!onNext}
                  aria-label="Nästa haiku"
                  className="glass inline-flex h-10 w-10 items-center justify-center rounded-full text-fg transition-all hover:scale-105 hover:border-ember-500/50 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <button
                type="button"
                onClick={copy}
                className="inline-flex items-center gap-2 rounded-full bg-ember-500 px-4 py-2 text-sm font-semibold text-void-950 transition-all hover:bg-ember-400 hover:shadow-[0_0_30px_-5px_var(--glow)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-300"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Kopierad' : 'Kopiera dikten'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
