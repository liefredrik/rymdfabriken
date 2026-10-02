import { motion } from 'framer-motion'
import { Headphones, Moon, Radio, Volume2 } from 'lucide-react'
import { Accordion } from '../components/Accordion'
import { PageShell } from '../components/PageShell'
import { SectionHeading } from '../components/SectionHeading'
import { soundcloudTrack } from '../data/site'

const playerSrc = `https://w.soundcloud.com/player/?url=${encodeURIComponent(
  soundcloudTrack,
)}&color=%23ff7a26&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true`

const faq = [
  {
    q: 'Vad är Rymdfabrikens radioteater?',
    a: 'Ett hörspel inspelat och klippt i fabriken. Det är samma röst som skrivit haikuerna, men här får tanken ta längre tid på sig än sjutton stavelser.',
  },
  {
    q: 'Hur lyssnar jag bäst?',
    a: 'Med hörlurar, i mörker, utan att göra något annat samtidigt. Spelaren streamar direkt från SoundCloud, så det kräver ingen nedladdning eller inloggning.',
  },
  {
    q: 'Går det att ladda ner avsnittet?',
    a: 'Inte härifrån. Öppna spåret på SoundCloud via spelaren så visas de alternativ som finns där. Rättigheterna till ljud och text tillhör Fredrik Lie.',
  },
  {
    q: 'Kommer det fler avsnitt?',
    a: 'Fabriken går långsamt men den går. När ett nytt avsnitt är klart dyker det upp här, på samma plats, utan förvarning.',
  },
]

const tips = [
  { icon: Headphones, title: 'Hörlurar', text: 'Mixen är gjord för stereo och tappar djup i en telefonhögtalare.' },
  { icon: Moon, title: 'Mörker', text: 'Släck lampan. Sidan är byggd för mörkt läge av en anledning.' },
  { icon: Volume2, title: 'Lagom volym', text: 'Börja lågt. Det finns partier som är tänkta att komma nära.' },
]

export function Radioteater() {
  return (
    <PageShell>
      <SectionHeading
        eyebrow="Radioteater"
        title={
          <>
            Lyssna i <span className="text-ember-gradient">mörkret</span>
          </>
        }
        lead="Ett hörspel från fabriken. Tryck på play, luta dig tillbaka och låt rummet bli lite större än det är."
      />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative mt-14"
      >
        <div className="pointer-events-none absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-ember-500/30 via-nebula-500/20 to-plasma-500/20 blur-2xl" />
        <div className="glass glow-ring relative overflow-hidden rounded-[2rem] p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between px-3 pt-2">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-ember-500">
              <Radio className="h-4 w-4" />
              Nu i etern
            </span>
            <span className="flex items-center gap-1" aria-hidden>
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.span
                  key={i}
                  className="block w-1 rounded-full bg-ember-500"
                  animate={{ height: [6, 16, 8, 20, 6] }}
                  transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                />
              ))}
            </span>
          </div>
          <iframe
            title="Rymdfabriken radioteater på SoundCloud"
            width="100%"
            height="420"
            scrolling="no"
            frameBorder="0"
            allow="autoplay"
            loading="lazy"
            src={playerSrc}
            className="block rounded-[1.4rem]"
          />
        </div>
      </motion.div>

      <section className="mt-24 grid gap-4 md:grid-cols-3">
        {tips.map((t, i) => (
          <motion.div
            key={t.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="glass group rounded-3xl p-7 transition-all hover:-translate-y-1 hover:border-ember-500/40"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-ember-500/15 text-ember-500 ring-1 ring-ember-500/30 transition-all group-hover:bg-ember-500 group-hover:text-void-950">
              <t.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-5 font-serif text-2xl text-fg">{t.title}</h3>
            <p className="mt-2 text-muted">{t.text}</p>
          </motion.div>
        ))}
      </section>

      <section className="mt-24">
        <SectionHeading eyebrow="Frågor" title="Vanliga frågor" face="serif" />
        <div className="mt-10">
          <Accordion items={faq} />
        </div>
      </section>
    </PageShell>
  )
}
