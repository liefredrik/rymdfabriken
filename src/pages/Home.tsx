import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, BookOpen, GraduationCap, Orbit, Radio, Sparkles, Telescope, RefreshCw } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { allHaiku, stjarnor, universum } from '../data/haiku'
import { creatures } from '../data/creatures'
import { episodes } from '../data/comics'
import { manifesto } from '../data/site'
import { useSpotlight } from '../hooks/useSpotlight'
import { PageShell } from '../components/PageShell'
import { SectionHeading } from '../components/SectionHeading'

const ease = [0.22, 1, 0.36, 1] as const

export function Home() {
  return (
    <PageShell className="pt-0">
      <Hero />
      <Manifesto />
      <Bento />
      <Quote />
    </PageShell>
  )
}

/* ---------------------------------------------------------------- Hero */

function Hero() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [0, 160])
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const word = 'Rymdfabriken'

  return (
    <section ref={ref} className="relative flex min-h-[100svh] flex-col items-center justify-center pt-28 text-center">
      <motion.div style={{ y, opacity }} className="relative w-full max-w-full px-2">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="glass mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-line px-4 py-1.5 text-[10px] font-medium uppercase tracking-[0.25em] text-muted sm:text-xs sm:tracking-[0.3em]"
        >
          <Sparkles className="h-3.5 w-3.5 text-ember-500" />
          Sedan 2015 · någonstans i rymden
        </motion.p>

        <h1
          aria-label={word}
          className="whitespace-nowrap font-display text-[clamp(1.6rem,6.5vw,6.4rem)] leading-[0.95] text-ember-500 drop-shadow-[0_0_40px_rgba(255,122,38,0.35)]"
        >
          {word.split('').map((ch, i) => (
            <motion.span
              key={i}
              aria-hidden
              initial={{ opacity: 0, y: 60, rotate: -8, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, rotate: 0, filter: 'blur(0px)' }}
              transition={{ delay: 0.3 + i * 0.045, duration: 0.8, ease }}
              whileHover={{ y: -10, color: '#a67cff', transition: { duration: 0.2 } }}
              className="inline-block cursor-default"
            >
              {ch}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.7, ease }}
          className="mx-auto mt-8 max-w-2xl font-serif text-2xl font-light italic leading-snug text-fg/85 sm:text-3xl"
        >
          Haiku från universum, varelser från livet och en radioteater från en fabrik som
          tillverkar tankar om att inte vara den man trodde.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.7, ease }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            to="/universum"
            className="group inline-flex items-center gap-2 rounded-full bg-ember-500 px-6 py-3 text-sm font-semibold text-void-950 transition-all hover:bg-ember-400 hover:shadow-[0_0_40px_-8px_var(--glow)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-300"
          >
            Läs dikterna
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            to="/radioteater"
            className="glass inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-fg transition-all hover:border-ember-500/50 hover:glow-ring active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500"
          >
            <Radio className="h-4 w-4 text-ember-500" />
            Lyssna på radioteatern
          </Link>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-8 flex flex-col items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted"
        aria-hidden
      >
        Skrolla
        <motion.span
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          className="h-8 w-px bg-gradient-to-b from-ember-500 to-transparent"
        />
      </motion.div>
    </section>
  )
}

/* ----------------------------------------------------------- Manifesto */

function Manifesto() {
  return (
    <section className="relative mx-auto mt-10 max-w-4xl py-24 sm:py-32">
      <motion.span
        aria-hidden
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="pointer-events-none absolute -left-6 -top-6 select-none font-display text-[11rem] leading-none text-ember-500/10 sm:-left-16 sm:text-[16rem]"
      >
        ”
      </motion.span>
      <p className="mb-8 text-xs font-semibold uppercase tracking-[0.25em] text-ember-500">Fabriken</p>
      <div className="space-y-6">
        {manifesto.map((para, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, delay: i * 0.08, ease }}
            className={
              i === 0
                ? 'font-serif text-3xl font-light leading-tight text-fg sm:text-5xl'
                : 'font-serif text-xl leading-relaxed text-fg/80 sm:text-2xl'
            }
          >
            {para}
          </motion.p>
        ))}
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------- Bento */

function Bento() {
  const spotlight = useSpotlight()
  const haikuCount = allHaiku.length
  const chapterCount = universum.length + stjarnor.length

  return (
    <section className="py-16">
      <SectionHeading
        eyebrow="Avdelningar"
        title={
          <>
            Flera rum i <span className="text-ember-gradient">fabriken</span>
          </>
        }
        lead="Varje rum har sin egen temperatur. Dikterna är kalla och exakta, varelserna varma och obehagliga, radioteatern mitt emellan. Och längst in sitter Bengt och Lane och pluggar."
      />

      <div className="mt-14 grid auto-rows-[minmax(180px,auto)] gap-4 md:grid-cols-6">
        <BentoCard
          to="/starmegaman"
          onMouseMove={spotlight}
          className="md:col-span-6"
          icon={<Sparkles className="h-5 w-5" />}
          eyebrow="StarMegaMan · Pixeläventyr"
          title="Skogen sover. Du har nattskift."
          body="En liten robot, fallande stjärnor och en mamma som tycker att det är läggdags. Spela direkt i mobilen eller med tangentbordet."
        />
        {/* Universum */}
        <BentoCard
          to="/universum"
          onMouseMove={spotlight}
          className="md:col-span-4 md:row-span-2"
          icon={<Orbit className="h-5 w-5" />}
          eyebrow="Universum · Samling I–II"
          title="Årstider på andra världar"
          body="Vinter på Titan, vår på Centauri och en höst där vi lämnade våra ok. Tjugoåtta haiku om längtan i ljusår."
        >
          <OrbitDecoration />
        </BentoCard>

        {/* Stat */}
        <BentoCard
          to="/stjarnor"
          onMouseMove={spotlight}
          className="md:col-span-2"
          icon={<Telescope className="h-5 w-5" />}
          eyebrow="Arkivet"
          title={
            <span className="font-display text-6xl leading-none text-ember-gradient">{haikuCount}</span>
          }
          body={`haiku i ${chapterCount} samlingar, I till VIII.`}
        />

        {/* Random haiku */}
        <RandomHaiku onMouseMove={spotlight} />

        {/* Stjärnor */}
        <BentoCard
          to="/stjarnor"
          onMouseMove={spotlight}
          className="md:col-span-3"
          icon={<Sparkles className="h-5 w-5" />}
          eyebrow="Stjärnor · Samling III–VIII"
          title="Plasmaskir och svarta hål"
          body="Rymdstrid i technocolor, maskinernas rätt och en fadd horisont runt rummets avgrund."
        />

        {/* Livet */}
        <BentoCard
          to="/livet"
          onMouseMove={spotlight}
          className="md:col-span-3 md:row-span-2"
          icon={<BookOpen className="h-5 w-5" />}
          eyebrow="Livet · Galleri"
          title="Sex varelser"
          body="Exemplar som landade utan att fråga om lov. Klicka dig in och möt dem en i taget."
        >
          <div className="mt-6 grid grid-cols-3 gap-2">
            {creatures.slice(0, 6).map((c, i) => (
              <motion.img
                key={c.id}
                src={c.src}
                alt=""
                loading="lazy"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="aspect-square w-full rounded-xl object-cover saturate-[0.7] transition-all duration-500 hover:scale-105 hover:saturate-100"
              />
            ))}
          </div>
        </BentoCard>

        {/* Radioteater */}
        <BentoCard
          to="/radioteater"
          onMouseMove={spotlight}
          className="md:col-span-3"
          icon={<Radio className="h-5 w-5" />}
          eyebrow="Radioteater"
          title="Lyssna i mörkret"
          body="Ett hörspel från fabriken, direkt från SoundCloud. Släck lampan först."
        >
          <Waveform />
        </BentoCard>

        {/* University */}
        <BentoCard
          to="/university"
          onMouseMove={spotlight}
          className="md:col-span-3"
          icon={<GraduationCap className="h-5 w-5" />}
          eyebrow="University · Bengt & Lane"
          title="Vägen till rymden"
          body="En fotoserie i två avsnitt om två killar från Komvux som ska bli rymdingenjörer. Minst fyrtio år, hur svårt som helst."
        >
          <div className="mt-6 overflow-hidden rounded-xl bg-paper-50">
            <img
              src={episodes[0].src}
              alt=""
              loading="lazy"
              className="h-16 w-auto max-w-none object-cover transition-transform duration-[6s] ease-linear group-hover:-translate-x-1/3"
            />
          </div>
        </BentoCard>
      </div>
    </section>
  )
}

type BentoCardProps = {
  to: string
  className?: string
  icon: React.ReactNode
  eyebrow: string
  title: React.ReactNode
  body: string
  children?: React.ReactNode
  onMouseMove: (e: React.MouseEvent<HTMLElement>) => void
}

function BentoCard({ to, className = '', icon, eyebrow, title, body, children, onMouseMove }: BentoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, ease }}
      className={className}
    >
      <Link
        to={to}
        onMouseMove={onMouseMove}
        className="spotlight-card glass group relative flex h-full flex-col overflow-hidden rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1 hover:border-ember-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500 active:scale-[0.995]"
      >
        <div className="flex items-center justify-between">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-ember-500/15 text-ember-500 ring-1 ring-ember-500/30 transition-all group-hover:scale-110 group-hover:bg-ember-500 group-hover:text-void-950">
            {icon}
          </span>
          <ArrowRight className="h-5 w-5 -translate-x-2 text-muted opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:text-ember-500 group-hover:opacity-100" />
        </div>
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.25em] text-muted">{eyebrow}</p>
        <h3 className="mt-2 font-serif text-2xl text-fg sm:text-3xl">{title}</h3>
        <p className="mt-3 max-w-md leading-relaxed text-muted">{body}</p>
        {children}
      </Link>
    </motion.div>
  )
}

function RandomHaiku({ onMouseMove }: { onMouseMove: (e: React.MouseEvent<HTMLElement>) => void }) {
  const [i, setI] = useState(() => Math.floor(Math.random() * allHaiku.length))
  const h = useMemo(() => allHaiku[i], [i])
  const shuffle = useCallback(
    () => setI((prev) => (prev + 1 + Math.floor(Math.random() * (allHaiku.length - 1))) % allHaiku.length),
    [],
  )
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, ease }}
      className="md:col-span-2"
    >
      <div
        onMouseMove={onMouseMove}
        className="spotlight-card glass relative flex h-full flex-col justify-between rounded-3xl bg-gradient-to-br from-nebula-500/20 to-transparent p-7"
      >
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted">Slumpad haiku</p>
          <button
            type="button"
            onClick={shuffle}
            aria-label="Ny slumpad haiku"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line text-muted transition-all hover:rotate-180 hover:border-ember-500 hover:text-ember-500 active:scale-90 [transition-duration:500ms]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
        <motion.blockquote
          key={h.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="my-6 font-serif text-xl leading-snug text-fg"
        >
          {h.lines.map((l, k) => (
            <span key={k} className={`block ${k === 1 ? 'pl-3 italic' : ''}`}>
              {l}
            </span>
          ))}
        </motion.blockquote>
        <p className="font-display text-xs tracking-widest text-ember-500">Samling {h.chapter}</p>
      </div>
    </motion.div>
  )
}

function OrbitDecoration() {
  return (
    <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 opacity-70 sm:h-96 sm:w-96">
      <div className="absolute inset-0 animate-spin-slow rounded-full border border-dashed border-ember-500/30" />
      <div className="absolute inset-10 animate-spin-slow rounded-full border border-nebula-400/30 [animation-direction:reverse] [animation-duration:28s]" />
      <div className="absolute inset-20 rounded-full border border-plasma-400/30" />
      <div className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ember-500 shadow-[0_0_16px_4px_var(--glow)]" />
      <div className="absolute inset-[42%] rounded-full bg-gradient-to-br from-ember-400 to-nebula-500 shadow-[0_0_40px_6px_var(--glow)]" />
    </div>
  )
}

function Waveform() {
  const bars = useMemo(() => Array.from({ length: 36 }, (_, i) => 0.25 + Math.abs(Math.sin(i * 0.7)) * 0.75), [])
  return (
    <div aria-hidden className="mt-6 flex h-12 items-end gap-[3px]">
      {bars.map((h, i) => (
        <motion.span
          key={i}
          className="w-full rounded-full bg-gradient-to-t from-ember-500 to-nebula-400"
          initial={{ scaleY: 0.2 }}
          whileInView={{ scaleY: [0.2, h, 0.35, h * 0.8, h] }}
          viewport={{ once: true }}
          transition={{ duration: 2.4, delay: i * 0.03, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
          style={{ height: '100%', transformOrigin: 'bottom' }}
        />
      ))}
    </div>
  )
}

/* ---------------------------------------------------------------- Quote */

function Quote() {
  return (
    <section className="py-24 text-center">
      <motion.p
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease }}
        className="mx-auto max-w-3xl font-serif text-3xl font-light italic leading-tight text-fg sm:text-5xl"
      >
        „Att bara dom som <span className="text-ember-gradient not-italic">kan älska ovillkorligt</span> ska få
        vårat ljus.”
      </motion.p>
      <p className="mt-6 font-display text-sm tracking-[0.3em] text-muted">Samling II · 06</p>
    </section>
  )
}
