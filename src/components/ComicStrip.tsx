import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Maximize2, MapPin, X, ZoomIn, ZoomOut } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Episode } from '../data/comics'
import { useLockBody } from '../hooks/useLockBody'

/**
 * A horizontally scrolling photo-comic strip. The original strips are
 * 4819×300 px, so they are shown as a filmstrip you drag or step through,
 * with a full-screen reader for the small speech bubbles.
 */
export function ComicStrip({ episode, index }: { episode: Episode; index: number }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.7, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="glass relative overflow-hidden rounded-[2rem]"
      >
        <header className="flex flex-col gap-4 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-8">
          <div>
            <p className="font-display text-xs tracking-[0.3em] text-ember-500">Avsnitt {String(episode.number).padStart(2, '0')}</p>
            <h3 className="mt-2 font-serif text-3xl text-fg sm:text-4xl">{episode.title}</h3>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
              <MapPin className="h-3.5 w-3.5 text-ember-500" />
              {episode.place}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-ember-500 px-4 py-2 text-sm font-semibold text-void-950 transition-all hover:bg-ember-400 hover:shadow-[0_0_30px_-6px_var(--glow)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-300 sm:self-auto"
          >
            <Maximize2 className="h-4 w-4" />
            Läs i helskärm
          </button>
        </header>

        <Filmstrip episode={episode} height={220} onOpen={() => setOpen(true)} />

        <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-[1fr_auto]">
          <p className="max-w-2xl leading-relaxed text-muted">{episode.synopsis}</p>
          <blockquote className="relative max-w-xs self-end rounded-2xl rounded-bl-sm bg-paper-50 px-5 py-4 font-serif text-lg italic leading-snug text-void-950 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)]">
            „{episode.quote}”
            <span className="mt-2 block font-sans text-xs font-semibold not-italic uppercase tracking-widest text-ember-700">
              {episode.speaker}
            </span>
          </blockquote>
        </div>
      </motion.article>

      <AnimatePresence>{open && <Reader episode={episode} onClose={() => setOpen(false)} />}</AnimatePresence>
    </>
  )
}

/* ------------------------------------------------------------ Filmstrip */

function Filmstrip({ episode, height, onOpen }: { episode: Episode; height: number; onOpen: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null)

  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setProgress(max > 0 ? el.scrollLeft / max : 0)
    setAtStart(el.scrollLeft < 4)
    setAtEnd(el.scrollLeft > max - 4)
  }, [])

  useEffect(() => {
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [update])

  const step = (dir: 1 | -1) => {
    const el = ref.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' })
  }

  const width = Math.round((episode.width / episode.height) * height)

  return (
    <div className="group/strip relative">
      <div
        ref={ref}
        onScroll={update}
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, left: e.currentTarget.scrollLeft, moved: false }
          e.currentTarget.setPointerCapture(e.pointerId)
        }}
        onPointerMove={(e) => {
          if (!drag.current) return
          const dx = e.clientX - drag.current.x
          if (Math.abs(dx) > 4) drag.current.moved = true
          e.currentTarget.scrollLeft = drag.current.left - dx
        }}
        onPointerUp={(e) => {
          const moved = drag.current?.moved
          drag.current = null
          e.currentTarget.releasePointerCapture(e.pointerId)
          if (!moved) onOpen()
        }}
        onPointerCancel={() => (drag.current = null)}
        className="cursor-grab overflow-x-auto overscroll-x-contain bg-paper-50 [scrollbar-width:none] active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
        style={{ height }}
        role="img"
        aria-label={`Seriestripp: Bengt & Lane i ${episode.title}`}
      >
        <img
          src={episode.src}
          alt=""
          draggable={false}
          loading="lazy"
          className="block max-w-none select-none"
          style={{ height, width }}
        />
      </div>

      {/* Edge fades */}
      <div
        className={`pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-paper-50 to-transparent transition-opacity ${atStart ? 'opacity-0' : 'opacity-100'}`}
      />
      <div
        className={`pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-paper-50 to-transparent transition-opacity ${atEnd ? 'opacity-0' : 'opacity-100'}`}
      />

      {/* Step buttons */}
      <button
        type="button"
        onClick={() => step(-1)}
        disabled={atStart}
        aria-label="Bläddra bakåt"
        className="absolute left-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-void-950/80 text-white shadow-lg transition-all hover:scale-105 hover:bg-ember-500 hover:text-void-950 active:scale-95 disabled:opacity-0"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => step(1)}
        disabled={atEnd}
        aria-label="Bläddra framåt"
        className="absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-void-950/80 text-white shadow-lg transition-all hover:scale-105 hover:bg-ember-500 hover:text-void-950 active:scale-95 disabled:opacity-0"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Progress */}
      <div className="absolute inset-x-6 bottom-3 h-1 overflow-hidden rounded-full bg-void-950/15">
        <motion.div
          className="h-full rounded-full bg-ember-500"
          animate={{ width: `${Math.max(progress * 100, 6)}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 30 }}
        />
      </div>
    </div>
  )
}

/* --------------------------------------------------------------- Reader */

function Reader({ episode, onClose }: { episode: Episode; onClose: () => void }) {
  const [zoom, setZoom] = useState(1)
  const ref = useRef<HTMLDivElement>(null)
  useLockBody(true)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = ref.current
      if (e.key === 'Escape') onClose()
      if (!el) return
      if (e.key === 'ArrowRight') el.scrollBy({ left: el.clientWidth * 0.8, behavior: 'smooth' })
      if (e.key === 'ArrowLeft') el.scrollBy({ left: -el.clientWidth * 0.8, behavior: 'smooth' })
      if (e.key === '+') setZoom((z) => Math.min(z + 0.25, 2.5))
      if (e.key === '-') setZoom((z) => Math.max(z - 0.25, 0.75))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Turn vertical wheel into horizontal travel so the strip reads like a page.
  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
    el.scrollLeft += e.deltaY
  }

  const baseHeight = Math.min(typeof window !== 'undefined' ? window.innerHeight * 0.55 : 420, 520)
  const height = baseHeight * zoom
  const width = (episode.width / episode.height) * height

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`Bengt & Lane i ${episode.title}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex flex-col bg-void-950/90 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between px-5 py-4 sm:px-8">
        <div>
          <p className="font-display text-xs tracking-[0.3em] text-ember-500">Avsnitt {String(episode.number).padStart(2, '0')}</p>
          <h3 className="font-serif text-xl text-white sm:text-2xl">{episode.title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(z - 0.25, 0.75))}
            aria-label="Zooma ut"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white transition-all hover:border-ember-500 hover:text-ember-500 active:scale-95"
          >
            <ZoomOut className="h-5 w-5" />
          </button>
          <span className="w-12 text-center font-mono text-xs text-white/70">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(z + 0.25, 2.5))}
            aria-label="Zooma in"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white transition-all hover:border-ember-500 hover:text-ember-500 active:scale-95"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Stäng"
            className="ml-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-ember-500 text-void-950 transition-all hover:bg-ember-400 active:scale-95"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-1 items-center overflow-hidden px-3 sm:px-6"
      >
        <div
          ref={ref}
          onWheel={onWheel}
          className="glow-ring w-full overflow-x-auto overflow-y-hidden rounded-3xl bg-paper-50 [scrollbar-color:var(--color-ember-500)_transparent] [scrollbar-width:thin]"
          style={{ height }}
        >
          <img
            src={episode.src}
            alt={`Seriestripp: Bengt & Lane i ${episode.title}`}
            draggable={false}
            className="block max-w-none select-none"
            style={{ height, width }}
          />
        </div>
      </motion.div>

      <p className="px-5 py-4 text-center text-xs uppercase tracking-[0.25em] text-white/50 sm:px-8">
        Skrolla eller använd piltangenterna · + / − för zoom · Esc stänger
      </p>
    </motion.div>
  )
}
