import { ArrowUp, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { author, foundedYear, nav } from '../data/site'

export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="relative z-10 mt-32 border-t border-line">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="font-display text-3xl leading-none text-ember-500">Rymdfabriken</p>
            <p className="mt-4 max-w-sm font-serif text-lg italic text-muted">
              Haiku från universum, varelser från livet och en radioteater från en fabrik
              någonstans i rymden.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Avdelningar</p>
            <ul className="mt-4 space-y-2">
              {nav.map((n) => (
                <li key={n.to}>
                  {n.external ? (
                    <a
                      href={n.to}
                      className="group inline-flex items-center gap-2 rounded-sm text-sm text-fg/80 transition-colors hover:text-ember-500 active:translate-x-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500"
                    >
                      <span className="h-px w-3 bg-current opacity-40 transition-all group-hover:w-6 group-hover:opacity-100" />
                      {n.label}
                    </a>
                  ) : (
                    <Link
                      to={n.to}
                      className="group inline-flex items-center gap-2 rounded-sm text-sm text-fg/80 transition-colors hover:text-ember-500 active:translate-x-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500"
                    >
                      <span className="h-px w-3 bg-current opacity-40 transition-all group-hover:w-6 group-hover:opacity-100" />
                      {n.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Kolofon</p>
            <ul className="mt-4 space-y-2 text-sm text-fg/80">
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-ember-500" />
                Satt i Frijole, Fraunces och Inter.
              </li>
              <li>Bakgrunden är samma kosmiska nät som på den gamla sidan.</li>
              <li>Byggd med React, Tailwind och Framer Motion.</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-line pt-6 text-sm text-muted sm:flex-row sm:items-center">
          <p>
            © {author} {foundedYear}–{year}. Alla dikter och texter tillhör författaren.
          </p>
          <a
            href="#top"
            className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wider text-fg transition-all hover:-translate-y-0.5 hover:glow-ring active:translate-y-0"
          >
            Upp till ytan <ArrowUp className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </footer>
  )
}
