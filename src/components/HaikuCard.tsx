import { motion } from 'framer-motion'
import { Maximize2 } from 'lucide-react'
import type { Haiku } from '../data/haiku'
import { useSpotlight } from '../hooks/useSpotlight'

type Props = {
  haiku: Haiku
  index: number
  onOpen: (h: Haiku) => void
}

export function HaikuCard({ haiku, index, onOpen }: Props) {
  const spotlight = useSpotlight()
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.03, 0.3), ease: [0.22, 1, 0.36, 1] }}
      className="list-none"
    >
      <button
        type="button"
        onClick={() => onOpen(haiku)}
        onMouseMove={spotlight}
        className="spotlight-card glass group relative flex h-full w-full flex-col rounded-3xl p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-ember-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500 active:scale-[0.99] sm:p-7"
        aria-label={`Öppna haiku: ${haiku.lines[0]}`}
      >
        <div className="mb-5 flex items-center justify-between">
          <span className="font-display text-sm tracking-widest text-ember-500/80">
            {haiku.chapter}
            <span className="text-muted">·</span>
            {haiku.id.split('-')[1].padStart(2, '0')}
          </span>
          <Maximize2 className="h-4 w-4 text-muted opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:text-ember-500" />
        </div>
        <p className="font-serif text-[1.35rem] leading-snug text-fg sm:text-2xl">
          {haiku.lines.map((line, i) => (
            <span
              key={i}
              className={`block transition-transform duration-500 group-hover:translate-x-1 ${
                i === 1 ? 'pl-4 italic text-fg/90' : ''
              }`}
              style={{ transitionDelay: `${i * 40}ms` }}
            >
              {line}
            </span>
          ))}
        </p>
        <span className="mt-auto block h-px w-8 bg-ember-500/60 transition-all duration-500 group-hover:w-full" />
      </button>
    </motion.li>
  )
}
