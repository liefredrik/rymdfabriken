import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { ChevronLeft, ChevronRight, Eye, MapPin, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import type { MouseEvent } from 'react'
import { PageShell } from '../components/PageShell'
import { SectionHeading } from '../components/SectionHeading'
import { creatures } from '../data/creatures'
import type { Creature } from '../data/creatures'
import { useLockBody } from '../hooks/useLockBody'

export function Livet() {
  const [open, setOpen] = useState<number | null>(null)

  const close = useCallback(() => setOpen(null), [])
  const prev = useCallback(() => setOpen((i) => (i === null ? null : (i - 1 + creatures.length) % creatures.length)), [])
  const next = useCallback(() => setOpen((i) => (i === null ? null : (i + 1) % creatures.length)), [])

  useLockBody(open !== null)
  useEffect(() => {
    if (open === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close, prev, next])

  return (
    <PageShell>
      <SectionHeading
        eyebrow="Livet · Galleri"
        title={
          <>
            Sex <span className="text-ember-gradient">exemplar</span>
          </>
        }
        lead="Den gamla sidan visade varelserna utan ett ord. Här får de namn, habitat och en kort journalanteckning. Klicka på ett exemplar för att möta det på nära håll."
      />

      <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {creatures.map((c, i) => (
          <CreatureCard key={c.id} creature={c} index={i} onOpen={() => setOpen(i)} />
        ))}
      </ul>

      <AnimatePresence>
        {open !== null && (
          <Lightbox creature={creatures[open]} index={open} onClose={close} onPrev={prev} onNext={next} />
        )}
      </AnimatePresence>
    </PageShell>
  )
}

function CreatureCard({ creature, index, onOpen }: { creature: Creature; index: number; onOpen: () => void }) {
  const mx = useMotionValue(0.5)
  const my = useMotionValue(0.5)
  const rx = useSpring(useTransform(my, [0, 1], [8, -8]), { stiffness: 200, damping: 20 })
  const ry = useSpring(useTransform(mx, [0, 1], [-8, 8]), { stiffness: 200, damping: 20 })

  const onMove = (e: MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width)
    my.set((e.clientY - r.top) / r.height)
  }
  const reset = () => {
    mx.set(0.5)
    my.set(0.5)
  }

  return (
    <motion.li
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="list-none [perspective:1000px]"
    >
      <motion.button
        type="button"
        onClick={onOpen}
        onMouseMove={onMove}
        onMouseLeave={reset}
        style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
        className="glass group relative block w-full overflow-hidden rounded-3xl text-left transition-colors hover:border-ember-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500"
        aria-label={`Öppna ${creature.title}`}
      >
        <div className="relative aspect-[6/5] overflow-hidden">
          <img
            src={creature.src}
            alt={creature.title}
            loading="lazy"
            className="h-full w-full object-cover saturate-[0.75] contrast-[1.05] transition-all duration-700 group-hover:scale-110 group-hover:saturate-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-void-950/90 via-void-950/20 to-transparent" />
          <div className="absolute inset-0 bg-ember-500/0 mix-blend-color transition-colors duration-500 group-hover:bg-ember-500/20" />
          <span className="absolute left-4 top-4 rounded-full bg-void-950/60 px-3 py-1 font-display text-[11px] tracking-widest text-ember-400 backdrop-blur">
            {creature.specimen}
          </span>
          <Eye className="absolute right-4 top-4 h-5 w-5 text-white/60 opacity-0 transition-all duration-300 group-hover:opacity-100" />
          <div className="absolute inset-x-0 bottom-0 p-5" style={{ transform: 'translateZ(30px)' }}>
            <h3 className="font-serif text-2xl text-white">{creature.title}</h3>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-white/70">
              <MapPin className="h-3 w-3" />
              {creature.habitat}
            </p>
          </div>
        </div>
      </motion.button>
    </motion.li>
  )
}

function Lightbox({
  creature,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  creature: Creature
  index: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={creature.title}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-void-950/80 p-4 backdrop-blur-xl"
    >
      <motion.div
        key={creature.id}
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="glass glow-ring relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] md:grid-cols-[1.2fr_1fr]"
      >
        <div className="relative aspect-[6/5] md:aspect-auto">
          <img src={creature.src} alt={creature.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-void-950/40 md:bg-gradient-to-r" />
        </div>
        <div className="relative flex flex-col p-8 sm:p-10">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-ember-500/25 blur-3xl" />
          <div className="flex items-center justify-between">
            <span className="font-display text-sm tracking-widest text-ember-500">{creature.specimen}</span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Stäng"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition-all hover:bg-fg/10 hover:text-fg active:scale-95"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <h3 className="mt-6 font-serif text-4xl leading-tight text-fg">{creature.title}</h3>
          <p className="mt-3 flex items-center gap-2 text-sm text-muted">
            <MapPin className="h-4 w-4 text-ember-500" />
            {creature.habitat}
          </p>
          <p className="mt-6 font-serif text-lg italic leading-relaxed text-fg/85">{creature.note}</p>
          <div className="mt-auto flex items-center justify-between pt-10">
            <span className="text-xs uppercase tracking-[0.25em] text-muted">
              {index + 1} / {creatures.length}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onPrev}
                aria-label="Föregående"
                className="glass inline-flex h-10 w-10 items-center justify-center rounded-full text-fg transition-all hover:scale-105 hover:border-ember-500/50 active:scale-95"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={onNext}
                aria-label="Nästa"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-ember-500 text-void-950 transition-all hover:scale-105 hover:bg-ember-400 active:scale-95"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
