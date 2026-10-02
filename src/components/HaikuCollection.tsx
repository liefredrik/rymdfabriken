import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { Search, Shuffle, X } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import type { Chapter, Haiku } from '../data/haiku'
import { HaikuCard } from './HaikuCard'
import { HaikuModal } from './HaikuModal'

type Props = { chapters: Chapter[] }

/**
 * Filterable, searchable grid of haiku with chapter chips, a shuffle
 * button and a full-screen reader modal with keyboard navigation.
 */
export function HaikuCollection({ chapters }: Props) {
  const [active, setActive] = useState<string | 'all'>('all')
  const [query, setQuery] = useState('')
  const [seed, setSeed] = useState(0)
  const [open, setOpen] = useState<Haiku | null>(null)

  const all = useMemo(() => chapters.flatMap((c) => c.haiku), [chapters])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = all.filter((h) => active === 'all' || h.chapter === active)
    if (q) list = list.filter((h) => h.lines.join(' ').toLowerCase().includes(q))
    if (seed) {
      // Deterministic shuffle so React keys stay stable per seed.
      let s = seed
      const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280)
      list = [...list].sort(() => rnd() - 0.5)
    }
    return list
  }, [all, active, query, seed])

  const idx = open ? visible.findIndex((h) => h.id === open.id) : -1
  const prev = useCallback(() => idx > 0 && setOpen(visible[idx - 1]), [idx, visible])
  const next = useCallback(() => idx < visible.length - 1 && setOpen(visible[idx + 1]), [idx, visible])
  const close = useCallback(() => setOpen(null), [])

  const activeChapter = chapters.find((c) => c.numeral === active)

  return (
    <LayoutGroup>
      <div className="z-30 -mx-4 px-4 py-3 sm:-mx-6 sm:px-6 md:sticky md:top-[76px]">
        <div className="glass flex flex-col gap-3 rounded-2xl p-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Samlingar">
            <Chip label="Alla" count={all.length} active={active === 'all'} onClick={() => setActive('all')} />
            {chapters.map((c) => (
              <Chip
                key={c.numeral}
                label={c.numeral}
                count={c.haiku.length}
                active={active === c.numeral}
                onClick={() => setActive(c.numeral)}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <label className="relative flex-1 md:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Sök i dikterna…"
                className="w-full rounded-full border border-line bg-fg/5 py-2 pl-9 pr-9 text-sm text-fg placeholder:text-muted transition-all focus:border-ember-500/60 focus:bg-fg/[0.07] focus:outline-none focus:ring-2 focus:ring-ember-500/30"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Rensa sökning"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted hover:text-fg"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </label>
            <button
              type="button"
              onClick={() => setSeed((s) => s + 1)}
              aria-label="Blanda dikterna"
              title="Blanda"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-fg/5 text-fg transition-all hover:rotate-180 hover:border-ember-500/60 hover:text-ember-500 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500 [transition-duration:500ms]"
            >
              <Shuffle className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeChapter && (
          <motion.div
            key={activeChapter.numeral}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="mt-8 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-6"
          >
            <span className="font-display text-5xl leading-none text-ember-gradient">{activeChapter.numeral}</span>
            <div>
              <h3 className="font-serif text-2xl text-fg">{activeChapter.title}</h3>
              <p className="mt-1 max-w-xl text-muted">{activeChapter.blurb}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.ul layout className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {visible.map((h, i) => (
            <HaikuCard key={h.id} haiku={h} index={i} onOpen={setOpen} />
          ))}
        </AnimatePresence>
      </motion.ul>

      {visible.length === 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-16 text-center font-serif text-2xl italic text-muted"
        >
          Ingen dikt matchar „{query}”. Rymden är stor men inte så stor.
        </motion.p>
      )}

      <HaikuModal
        haiku={open}
        onClose={close}
        onPrev={idx > 0 ? prev : undefined}
        onNext={idx >= 0 && idx < visible.length - 1 ? next : undefined}
      />
    </LayoutGroup>
  )
}

function Chip({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`relative rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500 ${
        active ? 'text-void-950' : 'text-muted hover:text-fg'
      }`}
    >
      {active && (
        <motion.span
          layoutId="chip-pill"
          className="absolute inset-0 -z-10 rounded-full bg-ember-500 shadow-[0_0_24px_-6px_var(--glow)]"
          transition={{ type: 'spring', stiffness: 450, damping: 34 }}
        />
      )}
      <span className="font-display tracking-wide">{label}</span>
      <span className={`ml-1.5 text-xs ${active ? 'text-void-950/70' : 'text-muted/70'}`}>{count}</span>
    </button>
  )
}
