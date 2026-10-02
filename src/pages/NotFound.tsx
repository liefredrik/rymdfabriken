import { motion } from 'framer-motion'
import { Home } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageShell } from '../components/PageShell'

export function NotFound() {
  return (
    <PageShell className="flex min-h-[80svh] flex-col items-center justify-center text-center">
      <motion.p
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="font-display text-[8rem] leading-none text-ember-gradient sm:text-[12rem]"
      >
        404
      </motion.p>
      <p className="mt-4 max-w-md font-serif text-2xl italic text-fg/85">
        Soluppgång i intet. Rester av en rotation. Sidan du letar efter fyller inte längre sin funktion.
      </p>
      <Link
        to="/"
        className="mt-10 inline-flex items-center gap-2 rounded-full bg-ember-500 px-6 py-3 text-sm font-semibold text-void-950 transition-all hover:bg-ember-400 hover:shadow-[0_0_40px_-8px_var(--glow)] active:scale-95"
      >
        <Home className="h-4 w-4" />
        Tillbaka till fabriken
      </Link>
    </PageShell>
  )
}
