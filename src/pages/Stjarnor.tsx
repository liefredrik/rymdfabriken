import { motion } from 'framer-motion'
import { HaikuCollection } from '../components/HaikuCollection'
import { PageShell } from '../components/PageShell'
import { SectionHeading } from '../components/SectionHeading'
import { stjarnor } from '../data/haiku'

export function Stjarnor() {
  return (
    <PageShell>
      <SectionHeading
        eyebrow="Stjärnor · Samling III–VIII"
        title={
          <>
            En himmel <span className="text-ember-gradient">brinner</span>
          </>
        }
        lead="Sex samlingar från plasmaskir till svarta hål. Här är tempot högre: rymdstrid i technocolor, nebulosor som skördas och maskiner som hittar någon att dra sitt ok. Filtrera på samling eller sök på ett ord."
      />

      <motion.ul
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        variants={{ show: { transition: { staggerChildren: 0.06 } } }}
        className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
      >
        {stjarnor.map((c) => (
          <motion.li
            key={c.numeral}
            variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
            className="glass group rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:border-ember-500/40"
          >
            <p className="font-display text-3xl leading-none text-ember-500 transition-colors group-hover:text-ember-400">
              {c.numeral}
            </p>
            <p className="mt-3 font-serif text-base leading-tight text-fg">{c.title}</p>
            <p className="mt-1 text-xs text-muted">
              {c.haiku.length} {c.haiku.length === 1 ? 'dikt' : 'dikter'}
            </p>
          </motion.li>
        ))}
      </motion.ul>

      <div className="mt-12">
        <HaikuCollection chapters={stjarnor} />
      </div>
    </PageShell>
  )
}
