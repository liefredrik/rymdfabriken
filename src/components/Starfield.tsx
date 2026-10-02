import { useEffect, useRef } from 'react'

type Star = {
  x: number
  y: number
  z: number
  r: number
  tw: number
  hue: number
}

/**
 * Canvas starfield with three parallax depths, slow twinkle and
 * gentle pointer parallax. Pauses when the tab is hidden and respects
 * prefers-reduced-motion.
 */
export function Starfield({ density = 0.00018 }: { density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let stars: Star[] = []
    let w = 0
    let h = 0
    let raf = 0
    let t = 0
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.floor(w * h * density)
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: Math.random(),
        r: Math.random() * 1.4 + 0.2,
        tw: Math.random() * Math.PI * 2,
        hue: Math.random() < 0.12 ? 28 : Math.random() < 0.5 ? 250 : 220,
      }))
    }

    const draw = () => {
      t += 0.016
      pointer.x += (pointer.tx - pointer.x) * 0.04
      pointer.y += (pointer.ty - pointer.y) * 0.04
      ctx.clearRect(0, 0, w, h)
      const dark = document.documentElement.classList.contains('dark')
      for (const s of stars) {
        const depth = 0.3 + s.z * 0.7
        const px = s.x + pointer.x * depth * 18
        const py = s.y + pointer.y * depth * 18
        const twinkle = reduce ? 1 : 0.6 + 0.4 * Math.sin(t * (0.6 + s.z) + s.tw)
        const alpha = (dark ? 0.9 : 0.55) * twinkle * (0.35 + s.z * 0.65)
        ctx.beginPath()
        ctx.fillStyle = `hsla(${s.hue}, ${s.hue === 28 ? 95 : 70}%, ${dark ? 85 : 45}%, ${alpha})`
        ctx.arc(px, py, s.r * depth, 0, Math.PI * 2)
        ctx.fill()
      }
      if (!reduce) raf = requestAnimationFrame(draw)
    }

    const onMove = (e: PointerEvent) => {
      pointer.tx = (e.clientX / w - 0.5) * 2
      pointer.ty = (e.clientY / h - 0.5) * 2
    }
    const onVis = () => {
      cancelAnimationFrame(raf)
      if (!document.hidden) raf = requestAnimationFrame(draw)
    }

    resize()
    draw()
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('visibilitychange', onVis)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [density])

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-0" />
}
