import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useState } from 'react'

export type AccordionItem = { q: string; a: string }

export function Accordion({ items }: { items: AccordionItem[] }) {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <div className="divide-y divide-[var(--line)] overflow-hidden rounded-3xl glass">
      {items.map((item, i) => {
        const isOpen = open === i
        return (
          <div key={item.q}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              aria-controls={`acc-${i}`}
              className="group flex w-full items-center justify-between gap-6 px-6 py-5 text-left transition-colors hover:bg-fg/[0.03] focus-visible:outline-none focus-visible:bg-fg/[0.05] sm:px-8"
            >
              <span className={`font-serif text-xl transition-colors ${isOpen ? 'text-ember-500' : 'text-fg'}`}>
                {item.q}
              </span>
              <motion.span
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  isOpen ? 'border-ember-500 text-ember-500' : 'border-line text-muted group-hover:text-fg'
                }`}
              >
                <Plus className="h-4 w-4" />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`acc-${i}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="px-6 pb-6 leading-relaxed text-muted sm:px-8">{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
