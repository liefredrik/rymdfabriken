import { motion } from 'framer-motion'
import { GraduationCap, Snowflake, Rocket } from 'lucide-react'
import { ComicStrip } from '../components/ComicStrip'
import { PageShell } from '../components/PageShell'
import { SectionHeading } from '../components/SectionHeading'
import { cast, episodes } from '../data/comics'

const ease = [0.22, 1, 0.36, 1] as const

export function University() {
  return (
    <PageShell>
      <SectionHeading
        eyebrow="University · Bengt & Lane"
        title={
          <>
            Vägen till <span className="text-ember-gradient">rymden</span>
          </>
        }
        lead="En fotoserie i två avsnitt om Bengt och Lane, två killar från Komvux i Mjölby som bestämmer sig för att bli rymdingenjörer. Dra i stripparna eller öppna dem i helskärm för att läsa pratbubblorna."
      />

      {/* Curriculum strip */}
      <motion.ul
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        variants={{ show: { transition: { staggerChildren: 0.08 } } }}
        className="mt-12 grid gap-4 sm:grid-cols-3"
      >
        {[
          { icon: GraduationCap, k: 'Termin 1', v: 'Fylla i en lapp', d: 'Hur svårt kan det vara.' },
          { icon: Snowflake, k: 'Termin 2', v: 'Minus trettio', d: 'Läpparna sväller. Hitta ett hus.' },
          { icon: Rocket, k: 'Examen', v: 'Om 40 år', d: 'Rymdteknik, helst. Minst.' },
        ].map((s) => (
          <motion.li
            key={s.k}
            variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
            className="glass group flex items-start gap-4 rounded-3xl p-6 transition-all hover:-translate-y-0.5 hover:border-ember-500/40"
          >
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ember-500/15 text-ember-500 ring-1 ring-ember-500/30 transition-all group-hover:bg-ember-500 group-hover:text-void-950">
              <s.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted">{s.k}</p>
              <p className="mt-1 font-serif text-2xl text-fg">{s.v}</p>
              <p className="mt-1 text-sm text-muted">{s.d}</p>
            </div>
          </motion.li>
        ))}
      </motion.ul>

      {/* Episodes */}
      <section className="mt-16 space-y-10">
        {episodes.map((ep, i) => (
          <ComicStrip key={ep.id} episode={ep} index={i} />
        ))}
      </section>

      {/* Cast */}
      <section className="mt-28">
        <SectionHeading eyebrow="Rollista" title="Två mössor, en plan" face="serif" />
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {cast.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, delay: i * 0.1, ease }}
              className="glass relative overflow-hidden rounded-3xl p-8"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -right-6 -top-10 select-none font-display text-[9rem] leading-none text-ember-500/10"
              >
                {c.name[0]}
              </span>
              <p className="font-display text-3xl text-ember-500">{c.name}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.25em] text-muted">{c.hat}</p>
              <p className="mt-5 max-w-md font-serif text-lg leading-relaxed text-fg/85">{c.bio}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="mt-24 text-center font-display text-5xl tracking-widest text-ember-gradient sm:text-7xl"
      >
        Slut
      </motion.p>
    </PageShell>
  )
}
