import { MoonStar, Sparkles, Trees } from 'lucide-react'
import { PageShell } from '../components/PageShell'
import { SectionHeading } from '../components/SectionHeading'
import { starMegaMan } from '../data/starmegaman'
import { StarMegaManGame } from '../games/starmegaman/StarMegaManGame'

export function StarMegaMan() {
  return (
    <PageShell className="pb-20">
      <div className="mb-9 flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0">
          <p className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.2em] text-ember-500"><MoonStar size={14} />{starMegaMan.eyebrow}</p>
          <h1 className="font-display text-[clamp(1.65rem,5vw,3.6rem)] leading-tight text-ember-gradient">{starMegaMan.title}</h1>
          <p className="mt-3 max-w-xl font-serif text-lg text-muted">{starMegaMan.lead}</p>
        </div>
        <span className="glass mb-1 inline-flex items-center gap-2 rounded-full px-3 py-2 text-[10px] uppercase tracking-widest text-muted"><span className="h-1.5 w-1.5 rounded-full bg-ember-400" />Mobil & tangentbord</span>
      </div>
      <StarMegaManGame />
      <div className="mt-6 flex flex-wrap justify-between gap-3 border-b border-line pb-6 text-[10px] uppercase tracking-[.16em] text-muted"><span className="flex items-center gap-2"><Trees size={13} />Tre delar av en natt</span><span className="flex items-center gap-2"><Sparkles size={13} />Fyra steg till supernova</span><span>Inga nedladdningar. Bara en skog.</span></div>
      <section className="mt-16">
        <SectionHeading eyebrow="Handbok för nattskiftet" title="Liten robot. Stor kväll." face="serif" lead="Djuren har redan somnat. Du har några saker kvar att göra." />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {starMegaMan.instructions.map((instruction, i) => <div key={instruction.title} className="glass rounded-2xl p-5"><span className="font-display text-sm text-ember-500">0{i + 1}</span><h3 className="mt-4 font-serif text-xl text-fg">{instruction.title}</h3><p className="mt-2 text-sm leading-relaxed text-muted">{instruction.text}</p></div>)}
        </div>
      </section>
      <section className="glass mt-8 flex flex-wrap items-center justify-between gap-6 rounded-2xl p-6 sm:p-8">
        <div className="max-w-xl"><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-ember-500">Sist i trädgården</p><h2 className="mt-3 font-serif text-2xl text-fg">{starMegaMan.boss.name} & lilla Lo</h2><p className="mt-3 text-sm leading-relaxed text-muted">En rödhårig väktare med varma händer och ett bestämt humör. Hennes tvååriga hjälpreda blåser skyddsbubblor. Undvik elden, vänta ut bubblan och låt stjärnljuset tala.</p></div><p className="font-serif text-xl italic text-muted">{starMegaMan.boss.line}</p>
      </section>
    </PageShell>
  )
}
