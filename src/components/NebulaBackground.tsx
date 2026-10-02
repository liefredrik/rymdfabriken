import { motion, useScroll, useTransform } from 'framer-motion'

/**
 * The old site's cosmic-web background, brought back as a slowly drifting
 * mesh layer under everything. Masked so it fades toward the edges and
 * blended differently in dark and light mode.
 */
export function NebulaBackground() {
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '-12%'])
  const opacity = useTransform(scrollYProgress, [0, 0.4, 1], [1, 0.55, 0.35])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        style={{ y, opacity }}
        className="absolute inset-[-10%] animate-drift [mask-image:radial-gradient(ellipse_at_50%_30%,black_30%,transparent_75%)]"
      >
        <img
          src="/images/rodblanebulosa.jpg"
          alt=""
          className="h-full w-full object-cover blur-[2px] opacity-25 mix-blend-multiply saturate-[1.1] brightness-125 contrast-[0.95] dark:opacity-100 dark:mix-blend-screen dark:saturate-[1.3] dark:brightness-90 dark:contrast-[1.05]"
          draggable={false}
        />
      </motion.div>

      {/* Mesh gradient blobs */}
      <div className="absolute -top-40 left-[-10%] h-[60vh] w-[60vw] rounded-full bg-ember-500/15 blur-[140px] animate-pulse-slow dark:bg-ember-500/20" />
      <div className="absolute top-[30%] right-[-15%] h-[55vh] w-[55vw] rounded-full bg-nebula-500/15 blur-[160px] animate-pulse-slow [animation-delay:2s] dark:bg-nebula-500/25" />
      <div className="absolute bottom-[-20%] left-[20%] h-[50vh] w-[50vw] rounded-full bg-plasma-500/15 blur-[160px] animate-pulse-slow [animation-delay:4s]" />

      {/* Grain */}
      <div className="absolute inset-0 opacity-[0.07] dark:opacity-[0.12] [background-image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22160%22 height=%22160%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%222%22 stitchTiles=%22stitch%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22 opacity=%220.6%22/></svg>')]" />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,var(--bg)_100%)]" />
    </div>
  )
}
