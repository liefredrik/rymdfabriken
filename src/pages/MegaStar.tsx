import { lazy, Suspense } from 'react'
import { Gamepad2, MoonStar, Sparkles } from 'lucide-react'
import { PageShell } from '../components/PageShell'
import { SectionHeading } from '../components/SectionHeading'
import { megaStar } from '../data/megastar'

const Game = lazy(() => import('../games/megastar/MegaStarGame').then(module => ({ default: module.MegaStarGame })))

export function MegaStar() {
  return <PageShell className="!pt-28">
    <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[.25em] text-ember-500">Rymdfabriken Arcade · 001</p><h1 className="font-display text-3xl text-fg sm:text-4xl">MegaStar<span className="text-ember-500">.</span></h1></div>
      <span className="glass flex items-center gap-2 rounded-full px-3 py-2 text-[10px] text-muted"><Gamepad2 size={14} className="text-ember-500" /> Mobil & tangentbord <span className="mx-1 opacity-40">/</span> Inget att installera</span>
    </div>
    <Suspense fallback={<div className="glass grid h-[600px] place-items-center rounded-2xl text-muted">Tänder stjärnorna…</div>}><Game /></Suspense>
    <section className="mt-16 pb-6">
      <SectionHeading eyebrow="Nattpasset" title={<>Liten robot. <span className="text-ember-gradient">Stor natt.</span></>} lead="Räven har somnat. Ugglan också, tydligen. Någon måste ta hand om stjärnorna." />
      <div className="mt-9 grid gap-4 md:grid-cols-3">{megaStar.zones.map((zone, i) => <div key={zone.name} className="glass rounded-2xl p-6"><div className="mb-5 flex items-center justify-between text-ember-500"><MoonStar size={21} /><span className="font-display text-2xl opacity-50">0{i + 1}</span></div><h3 className="font-serif text-xl text-fg">{zone.name}</h3><p className="mt-2 text-sm leading-relaxed text-muted">{zone.caption}</p></div>)}</div>
      <div className="mt-8 flex items-start gap-3 rounded-2xl border border-line p-5"><Sparkles className="mt-1 shrink-0 text-ember-500" size={18} /><p className="text-sm leading-relaxed text-muted">Samla stjärnor för att bli starkare. Hoppa en gång till i luften. Och om stjärnan får ögon: skjut först, önska sedan. Ditt stjärnrekord sparas bara i den här webbläsaren.</p></div>
    </section>
  </PageShell>
}
