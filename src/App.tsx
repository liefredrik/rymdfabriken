import { AnimatePresence } from 'framer-motion'
import { lazy, Suspense } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Footer } from './components/Footer'
import { Navbar } from './components/Navbar'
import { NebulaBackground } from './components/NebulaBackground'
import { ScrollProgress } from './components/ScrollProgress'
import { ScrollToTop } from './components/ScrollToTop'
import { Starfield } from './components/Starfield'
import { useTheme } from './hooks/useTheme'
import { Home } from './pages/Home'
import { Livet } from './pages/Livet'
import { NotFound } from './pages/NotFound'
import { Radioteater } from './pages/Radioteater'
import { Stjarnor } from './pages/Stjarnor'
import { Universum } from './pages/Universum'
import { University } from './pages/University'

const StarMegaMan = lazy(() => import('./pages/StarMegaMan').then(module => ({ default: module.StarMegaMan })))

export default function App() {
  const { theme, toggle } = useTheme()
  const location = useLocation()

  return (
    <div className="relative flex min-h-screen flex-col">
      <a
        href="#top"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-full focus:bg-ember-500 focus:px-4 focus:py-2 focus:text-void-950"
      >
        Hoppa till innehåll
      </a>
      <ScrollProgress />
      <NebulaBackground />
      <Starfield />
      <ScrollToTop />
      <Navbar theme={theme} onToggleTheme={toggle} />

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/universum" element={<Universum />} />
          <Route path="/stjarnor" element={<Stjarnor />} />
          <Route path="/livet" element={<Livet />} />
          <Route path="/radioteater" element={<Radioteater />} />
          <Route path="/university" element={<University />} />
          <Route path="/starmegaman" element={<Suspense fallback={<main className="min-h-screen pt-40 text-center text-muted">Skogen vaknar…</main>}><StarMegaMan /></Suspense>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>

      <Footer />
    </div>
  )
}
