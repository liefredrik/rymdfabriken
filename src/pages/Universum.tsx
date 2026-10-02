import { motion } from 'framer-motion'
import { HaikuCollection } from '../components/HaikuCollection'
import { PageShell } from '../components/PageShell'
import { SectionHeading } from '../components/SectionHeading'
import { universum, universumEpilog } from '../data/haiku'

export function Universum() {
  return (
    <PageShell>
      <SectionHeading
        eyebrow="Universum · Samling I–II"
        title={
          <>
            Vintern på <span className="text-ember-gradient">Titan</span>
          </>
        }
        lead="Två samlingar skrivna i kryosömnens gränsland. Den första följer årstiderna genom andra solsystem, den andra frågar vilka som egentligen ska få vårt ljus. Klicka på en dikt för att läsa den i helskärm."
      />

      <div className="mt-12">
        <HaikuCollection chapters={universum} />
      </div>

      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative mt-28 overflow-hidden rounded-[2.5rem] glass p-10 sm:p-16"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-ember-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-80 w-80 rounded-full bg-nebula-500/25 blur-3xl" />
        <p className="relative text-xs font-semibold uppercase tracking-[0.25em] text-ember-500">Epilog</p>
        <blockquote className="relative mt-6 max-w-3xl font-serif text-2xl leading-snug text-fg sm:text-4xl">
          {universumEpilog.map((l, i) => (
            <span key={i} className={`block ${i === 1 ? 'italic text-ember-gradient' : ''}`}>
              {l}
            </span>
          ))}
        </blockquote>
      </motion.section>
    </PageShell>
  )
}
