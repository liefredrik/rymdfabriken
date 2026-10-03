// The sleeping evening forest: sky, moon, parallax tree lines, ground, animals and ambience.

import { drawSprite, fillCircle, makeOak, makePine, sprite, type Sprite, type SpriteName } from './sprites'

export const LEVEL_W = 4400
export const GROUND_PAD = 34 // pixels of dirt below the ground line on screen

/** groundY is the screen row of the ground line; everything below it is dirt. */
export type Camera = { x: number; y: number; vw: number; vh: number; groundY: number; shakeX: number; shakeY: number }

function mulberry(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function hexLerp(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16)
  const pb = parseInt(b.slice(1), 16)
  const r = Math.round(lerp((pa >> 16) & 255, (pb >> 16) & 255, t))
  const g = Math.round(lerp((pa >> 8) & 255, (pb >> 8) & 255, t))
  const bl = Math.round(lerp(pa & 255, pb & 255, t))
  return `rgb(${r},${g},${bl})`
}

type Strip = { canvas: HTMLCanvasElement; parallax: number; baseline: number }

type Animal = { name: SpriteName; x: number; y: number; flip: boolean; zzz: number; spr: Sprite }
type Deco = { kind: 'mushroom' | 'tuft' | 'rock'; x: number; v: number }
type Firefly = { x: number; y: number; phase: number; speed: number; amp: number }
type NearTree = { x: number; img: HTMLCanvasElement }

const DUSK = { top: '#1a1030', mid: '#4a2458', low: '#b4523e', horizon: '#f0a060' }
const NIGHT = { top: '#05040f', mid: '#140f2e', low: '#2b1a46', horizon: '#4a2a4a' }

export class World {
  private strips: Strip[] = []
  private hills: number[] = []
  private stars: { x: number; y: number; s: number; tw: number }[] = []
  private animals: Animal[] = []
  private decos: Deco[] = []
  private fireflies: Firefly[] = []
  private nearTrees: NearTree[] = []
  private groundNoise: HTMLCanvasElement
  time = 0
  /** 0 = dusk, 1 = deep night. Driven by level progress. */
  night = 0

  constructor() {
    const rnd = mulberry(7)
    for (let i = 0; i < 140; i++) this.stars.push({ x: rnd() * 2000, y: rnd() * 400, s: rnd() < 0.15 ? 2 : 1, tw: rnd() * 6.28 })
    for (let i = 0; i < 400; i++) this.hills.push(Math.sin(i * 0.11) * 10 + Math.sin(i * 0.037 + 2) * 16 + Math.sin(i * 0.23) * 4)

    this.strips.push(this.makeStrip(11, 0.28, 90, 520, { leaf: '#1c1538', leafLight: '#221a44', trunk: '#1c1538', outline: null }, 0.5))
    this.strips.push(this.makeStrip(23, 0.5, 110, 680, { leaf: '#13203a', leafLight: '#1a2b48', trunk: '#101a30', outline: null }, 0.7))
    this.strips.push(this.makeStrip(37, 0.72, 96, 760, { leaf: '#0f2a2a', leafLight: '#164038', trunk: '#0b1a1c', outline: null }, 0.85))

    const r2 = mulberry(99)
    for (let x = 60; x < LEVEL_W - 120; x += 70 + r2() * 160) {
      const h = 70 + r2() * 60
      const style = { leaf: '#17432f', leafLight: '#2a6b45', trunk: '#3a2316', outline: '#0a0d16' }
      this.nearTrees.push({ x, img: r2() < 0.55 ? makePine(Math.floor(r2() * 1e6), h, style) : makeOak(Math.floor(r2() * 1e6), h * 0.85, style) })
    }

    const r3 = mulberry(5)
    for (let x = 30; x < LEVEL_W; x += 14 + r3() * 40) {
      const roll = r3()
      this.decos.push({ kind: roll < 0.12 ? 'mushroom' : roll < 0.2 ? 'rock' : 'tuft', x, v: r3() })
    }
    for (let i = 0; i < 90; i++) this.fireflies.push({ x: r3() * LEVEL_W, y: -8 - r3() * 60, phase: r3() * 6.28, speed: 0.3 + r3() * 0.6, amp: 4 + r3() * 10 })

    const placeAnimal = (name: SpriteName, x: number, y = 0, flip = false) => {
      const spr = sprite(name)
      this.animals.push({ name, x, y, flip, zzz: Math.random() * 3, spr })
    }
    placeAnimal('fox', 380)
    placeAnimal('rabbit', 560, 0, true)
    placeAnimal('hedgehog', 820)
    placeAnimal('bear', 1180)
    placeAnimal('rabbit', 1420)
    placeAnimal('fox', 1860, 0, true)
    placeAnimal('hedgehog', 2130, 0, true)
    placeAnimal('bear', 2520, 0, true)
    placeAnimal('rabbit', 2760)
    placeAnimal('fox', 3080)
    placeAnimal('hedgehog', 3390)
    placeAnimal('rabbit', 3620, 0, true)
    for (const t of this.nearTrees) {
      // Owls perch in some oaks.
      if (t.img.width > 60 && Math.abs(Math.sin(t.x)) > 0.6) placeAnimal('owl', t.x - 3, -t.img.height * 0.52, Math.sin(t.x * 3) > 0)
    }

    this.groundNoise = document.createElement('canvas')
    this.groundNoise.width = 256
    this.groundNoise.height = GROUND_PAD
    const g = this.groundNoise.getContext('2d')!
    g.fillStyle = '#1b1526'
    g.fillRect(0, 0, 256, GROUND_PAD)
    const r4 = mulberry(31)
    for (let i = 0; i < 420; i++) {
      g.fillStyle = r4() < 0.5 ? '#241b33' : '#140f1d'
      g.fillRect(Math.floor(r4() * 256), 3 + Math.floor(r4() * (GROUND_PAD - 3)), 1 + Math.floor(r4() * 3), 1)
    }
    g.fillStyle = '#2f7a4a'
    g.fillRect(0, 0, 256, 1)
    g.fillStyle = '#245c3a'
    g.fillRect(0, 1, 256, 2)
    g.fillStyle = '#3a2a22'
    g.fillRect(0, 3, 256, 1)
  }

  private makeStrip(seed: number, parallax: number, height: number, width: number, style: { leaf: string; leafLight: string; trunk: string; outline: string | null }, density: number): Strip {
    const rnd = mulberry(seed)
    const c = document.createElement('canvas')
    c.width = width
    c.height = height
    const ctx = c.getContext('2d')!
    let x = 0
    while (x < width) {
      const h = height * (0.55 + rnd() * 0.45)
      const tree = rnd() < 0.7 ? makePine(Math.floor(rnd() * 1e6), h, style) : makeOak(Math.floor(rnd() * 1e6), h * 0.8, style)
      const dx = Math.round(x - tree.width / 2)
      ctx.drawImage(tree, dx, Math.round(height - tree.height))
      if (dx + tree.width > width) ctx.drawImage(tree, dx - width, Math.round(height - tree.height))
      x += (tree.width * 0.45 + rnd() * 20) / density
    }
    // low undergrowth line so trunks never float
    ctx.fillStyle = style.leaf
    ctx.fillRect(0, height - 6, width, 6)
    return { canvas: c, parallax, baseline: 0 }
  }

  update(dt: number) {
    this.time += dt
  }

  drawBackground(ctx: CanvasRenderingContext2D, cam: Camera) {
    const { vw, vh } = cam
    const groundY = cam.groundY + cam.shakeY
    const t = this.night
    const grad = ctx.createLinearGradient(0, 0, 0, groundY)
    grad.addColorStop(0, hexLerp(DUSK.top, NIGHT.top, t))
    grad.addColorStop(0.45, hexLerp(DUSK.mid, NIGHT.mid, t))
    grad.addColorStop(0.82, hexLerp(DUSK.low, NIGHT.low, t))
    grad.addColorStop(1, hexLerp(DUSK.horizon, NIGHT.horizon, t))
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, vw, vh)

    // stars (fade in with night)
    const starAlpha = 0.35 + t * 0.65
    for (const s of this.stars) {
      const sx = ((s.x - cam.x * 0.04) % 2000 + 2000) % 2000 - 40
      if (sx < -2 || sx > vw + 2) continue
      const sy = (s.y % Math.max(60, groundY * 0.85))
      const tw = 0.55 + 0.45 * Math.sin(this.time * 2.2 + s.tw)
      ctx.globalAlpha = starAlpha * tw
      ctx.fillStyle = s.s === 2 ? '#fff6c7' : '#d8dcff'
      ctx.fillRect(Math.round(sx), Math.round(sy), s.s, s.s)
    }
    ctx.globalAlpha = 1

    // moon
    const mx = vw - 60 - cam.x * 0.06 + 200
    const my = Math.max(26, groundY * 0.22)
    const mxWrapped = ((mx % (vw + 400)) + vw + 400) % (vw + 400) - 200
    ctx.globalAlpha = 0.25
    fillCircle(ctx, mxWrapped, my, 24, '#fff2c0')
    ctx.globalAlpha = 1
    fillCircle(ctx, mxWrapped, my, 14, '#fff6d6')
    fillCircle(ctx, mxWrapped - 4, my - 3, 3, '#e9dcb0')
    fillCircle(ctx, mxWrapped + 5, my + 4, 2, '#e9dcb0')
    fillCircle(ctx, mxWrapped + 3, my - 7, 1.5, '#e9dcb0')

    // distant hills
    ctx.fillStyle = hexLerp('#3b2050', '#120d26', t)
    const hillBase = groundY - 60
    for (let sx = 0; sx < vw; sx++) {
      const wx = Math.floor(sx + cam.x * 0.15)
      const h = this.hills[((wx % 400) + 400) % 400] ?? 0
      ctx.fillRect(sx, Math.round(hillBase - h), 1, Math.round(groundY - hillBase + h + 2))
    }

    // horizon haze
    const haze = ctx.createLinearGradient(0, groundY - 70, 0, groundY)
    haze.addColorStop(0, 'rgba(255,160,100,0)')
    haze.addColorStop(1, `rgba(255,150,90,${0.22 * (1 - t)})`)
    ctx.fillStyle = haze
    ctx.fillRect(0, groundY - 70, vw, 70)

    // tree strips
    for (const s of this.strips) {
      const off = ((cam.x * s.parallax) % s.canvas.width + s.canvas.width) % s.canvas.width
      const y = Math.round(groundY - s.canvas.height + 6)
      for (let x = -off; x < vw; x += s.canvas.width) ctx.drawImage(s.canvas, Math.round(x), y)
    }

    // fog bands
    ctx.globalAlpha = 0.1 + 0.08 * (1 - t)
    for (let i = 0; i < 3; i++) {
      const fy = groundY - 10 - i * 9
      const fx = ((-cam.x * (0.6 + i * 0.1) + this.time * (4 + i * 3)) % 300 + 300) % 300
      ctx.fillStyle = '#c9b8ff'
      for (let x = fx - 300; x < vw + 300; x += 300) ctx.fillRect(Math.round(x), fy, 140, 3)
    }
    ctx.globalAlpha = 1
  }

  /** Near trees, animals and ground: drawn in world space (ctx already translated by camera). */
  drawMidground(ctx: CanvasRenderingContext2D, cam: Camera) {
    const left = cam.x - 80
    const right = cam.x + cam.vw + 80
    for (const tr of this.nearTrees) {
      if (tr.x + tr.img.width < left || tr.x - tr.img.width > right) continue
      ctx.drawImage(tr.img, Math.round(tr.x - tr.img.width / 2), Math.round(-tr.img.height + 3))
    }
    for (const a of this.animals) {
      if (a.x + 30 < left || a.x - 30 > right) continue
      const breathe = Math.sin(this.time * 1.6 + a.x) > 0.6 ? 1 : 0
      drawSprite(ctx, a.spr, a.x - a.spr.w / 2, a.y - a.spr.h + 1 - breathe * 0, a.flip)
      if (breathe) {
        ctx.fillStyle = 'rgba(0,0,0,0.0)'
      }
      // Zzz
      const z = (this.time * 0.6 + a.zzz) % 1
      const zx = a.x + (a.flip ? -a.spr.w / 2 : a.spr.w / 2) + z * 6
      const zy = a.y - a.spr.h - 4 - z * 12
      ctx.globalAlpha = 1 - z
      ctx.fillStyle = '#e8e4ff'
      const sz = z < 0.5 ? 1 : 2
      // tiny Z glyph
      ctx.fillRect(Math.round(zx), Math.round(zy), 3 * sz, sz)
      ctx.fillRect(Math.round(zx + sz), Math.round(zy + sz), sz, sz)
      ctx.fillRect(Math.round(zx), Math.round(zy + 2 * sz), 3 * sz, sz)
      ctx.globalAlpha = 1
    }
  }

  drawGround(ctx: CanvasRenderingContext2D, cam: Camera) {
    const left = cam.x - 40
    const right = cam.x + cam.vw + 40
    const start = Math.floor(left / 256) * 256
    for (let x = start; x < right; x += 256) ctx.drawImage(this.groundNoise, x, 0)
    const below = cam.vh - cam.groundY - GROUND_PAD + 4
    if (below > 0) {
      // deeper soil fades to black, with a few buried stones and roots
      const g = ctx.createLinearGradient(0, GROUND_PAD, 0, GROUND_PAD + below)
      g.addColorStop(0, '#1b1526')
      g.addColorStop(1, '#070510')
      ctx.fillStyle = g
      ctx.fillRect(Math.floor(left), GROUND_PAD, Math.ceil(right - left), below)
      const s0 = Math.floor(left / 40) * 40
      for (let x = s0; x < right; x += 40) {
        const h = Math.abs(Math.sin(x * 12.9898) * 43758.5453) % 1
        const depth = GROUND_PAD + 6 + Math.floor(h * Math.max(1, below - 12))
        ctx.fillStyle = h < 0.5 ? '#2a2238' : '#3a2a22'
        ctx.fillRect(x + Math.floor(h * 30), depth, 3 + Math.floor(h * 4), 2)
        if (h > 0.6) {
          ctx.fillStyle = '#3a2a22'
          ctx.fillRect(x + 10, GROUND_PAD, 1, 4 + Math.floor(h * 8))
          ctx.fillRect(x + 11, GROUND_PAD + 4 + Math.floor(h * 8), 1, 3)
        }
      }
    }
    const mush = sprite('mushroom')
    for (const d of this.decos) {
      if (d.x < left || d.x > right) continue
      if (d.kind === 'tuft') {
        ctx.fillStyle = d.v < 0.5 ? '#3f9a5a' : '#2f7a4a'
        const h = 2 + Math.round(d.v * 3)
        ctx.fillRect(Math.round(d.x), -h, 1, h)
        ctx.fillRect(Math.round(d.x) + 2, -h + 1, 1, h - 1)
        ctx.fillRect(Math.round(d.x) - 2, -h + 2, 1, h - 2)
      } else if (d.kind === 'rock') {
        ctx.fillStyle = '#4a4258'
        ctx.fillRect(Math.round(d.x), -3, 5, 3)
        ctx.fillStyle = '#6a6280'
        ctx.fillRect(Math.round(d.x) + 1, -4, 3, 1)
      } else {
        const pulse = 0.5 + 0.5 * Math.sin(this.time * 3 + d.x)
        ctx.globalAlpha = 0.12 + 0.12 * pulse
        fillCircle(ctx, d.x + 3, -4, 9, '#c9a0ff')
        ctx.globalAlpha = 1
        drawSprite(ctx, mush, d.x, -mush.h + 1)
      }
    }
    // fireflies
    for (const f of this.fireflies) {
      if (f.x < left || f.x > right) continue
      const fx = f.x + Math.sin(this.time * f.speed + f.phase) * f.amp
      const fy = f.y + Math.cos(this.time * f.speed * 1.3 + f.phase) * f.amp * 0.5
      const glow = 0.5 + 0.5 * Math.sin(this.time * 4 + f.phase * 3)
      if (glow < 0.35) continue
      ctx.globalAlpha = glow * 0.35
      fillCircle(ctx, fx, fy, 2.5, '#d8ff9a')
      ctx.globalAlpha = glow
      ctx.fillStyle = '#eaffb0'
      ctx.fillRect(Math.round(fx), Math.round(fy), 1, 1)
    }
    ctx.globalAlpha = 1
  }

  /** Vignette and night tint over everything. */
  drawOverlay(ctx: CanvasRenderingContext2D, cam: Camera) {
    const { vw, vh } = cam
    const v = ctx.createRadialGradient(vw / 2, vh / 2, Math.min(vw, vh) * 0.45, vw / 2, vh / 2, Math.max(vw, vh) * 0.75)
    v.addColorStop(0, 'rgba(0,0,0,0)')
    v.addColorStop(1, 'rgba(5,3,15,0.55)')
    ctx.fillStyle = v
    ctx.fillRect(0, 0, vw, vh)
  }
}
