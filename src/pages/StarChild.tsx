import { lazy, Suspense } from 'react'
import { Gamepad2, Moon, Sparkles, Zap } from 'lucide-react'
import { PageShell } from '../components/PageShell'
import { SectionHeading } from '../components/SectionHeading'
import { starChild } from '../data/starchild'

const Game = lazy(() => import('../games/starchild/StarChildGame').then(module => ({ default: module.StarChildGame })))

export function StarChild() {
  return (
    <PageShell className="!pt-28">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[.24em] text-ember-500">Rymdfabriken · Spelrummet</p>
          <h1 className="font-display text-2xl text-fg sm:text-3xl">StarChild<span className="text-ember-500">.</span></h1>
        </div>
        <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-2 text-[10px] text-muted"><Gamepad2 size={15} className="text-ember-500" /> Spela direkt · Mobil & tangentbord</span>
      </div>
      <Suspense fallback={<div className="glass grid min-h-[600px] place-items-center rounded-2xl text-muted" role="status">Skogen släcker lamporna…</div>}><Game /></Suspense>
      <section className="mt-16 pb-8">
        <SectionHeading eyebrow="En liten hjälte. En hel natthimmel." title={<>Himlen tappade <span className="text-ember-gradient">något.</span></>} lead={starChild.page.lead} />
        <div className="mt-9 grid gap-4 md:grid-cols-3">
          {starChild.zones.map((zone, i) => <article key={zone.name} className="glass spotlight-card rounded-2xl p-6">
            <div className="mb-5 flex items-center justify-between text-ember-500"><Moon size={20} /><span className="font-display text-2xl opacity-60">0{i + 1}</span></div>
            <h3 className="font-serif text-2xl text-fg">{zone.name}</h3><p className="mt-2 text-sm leading-relaxed text-muted">{zone.caption}</p>
          </article>)}
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="flex gap-3 rounded-2xl border border-line p-5"><Zap className="mt-1 shrink-0 text-plasma-400" size={18} /><p className="text-sm leading-relaxed text-muted">Gnista, stjärnbärare, komet, supernova. Mer ljus ger större krafter. En ljusrusning tar dig genom elden. Tre månskärvor väntar på den som tar omvägen.</p></div>
          <div className="flex gap-3 rounded-2xl border border-line p-5"><Sparkles className="mt-1 shrink-0 text-nebula-400" size={18} /><p className="text-sm leading-relaxed text-muted">Fem hjärtan och en ny chans när de tar slut. Inga konton. Inga köp. Rekord och ljudval stannar i din webbläsare. Hörlurar gör skogen lite större.</p></div>
        </div>
      </section>
    </PageShell>
  )
}
