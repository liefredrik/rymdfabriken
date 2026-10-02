import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

type Props = {
  eyebrow?: string
  title: ReactNode
  lead?: ReactNode
  align?: 'left' | 'center'
  /** Use the Frijole display face for the title (default) or the serif. */
  face?: 'display' | 'serif'
}

export function SectionHeading({ eyebrow, title, lead, align = 'left', face = 'display' }: Props) {
  const center = align === 'center'
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`max-w-3xl ${center ? 'mx-auto text-center' : ''}`}
    >
      {eyebrow && (
        <p className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-ember-500">
          <span className="h-1.5 w-1.5 rounded-full bg-ember-500 shadow-[0_0_10px_2px_var(--glow)]" />
          {eyebrow}
        </p>
      )}
      <h2
        className={
          face === 'display'
            ? 'font-display text-4xl leading-[1.05] text-fg sm:text-5xl md:text-6xl'
            : 'font-serif text-4xl font-light leading-[1.05] tracking-tight text-fg sm:text-5xl md:text-6xl'
        }
      >
        {title}
      </h2>
      {lead && <p className="mt-6 text-lg leading-relaxed text-muted">{lead}</p>}
    </motion.div>
  )
}
