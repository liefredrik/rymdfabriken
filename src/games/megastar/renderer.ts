import { Game, GROUND, ARENA, END, seedRandom } from './engine.ts'
import { drawSprite } from './art.ts'
import { megaStar } from '../../data/megastar.ts'

const rand = (n: number) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v) }
const rect = (c: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number) => { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), Math.ceil(w), Math.ceil(h)) }
export class Renderer {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  width = 640
  height = 360
  camera = 0
  clock = 0
  reduced = false
  trees: HTMLCanvasElement[] = []
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d', { alpha: false })!
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    for (let i = 0; i < 4; i++) this.trees.push(this.makeTree(i))
  }
  resize(w: number, h: number) {
    this.width = w / h < 1 ? 320 : Math.min(720, Math.round(w / 2))
    this.height = Math.round(this.width * h / w)
    this.canvas.width = this.width; this.canvas.height = this.height; this.ctx.imageSmoothingEnabled = false
  }
  makeTree(seed: number) {
    const canvas = document.createElement('canvas'); canvas.width = 140; canvas.height = 225
    const c = canvas.getContext('2d')!, r = seedRandom(910 + seed)
    rect(c, '#182e40', 63, 49, 16, 176); rect(c, '#26374c', 67, 75, 5, 150)
    for (let i = 0; i < 7; i++) { const y = 105 + i * 16; rect(c, '#182e40', 44 + (i % 2) * 30, y, 33, 5) }
    for (let tier = 0; tier < 5; tier++) {
      const y = 3 + tier * 22, wide = 25 + tier * 12
      for (let j = 0; j < 13; j++) {
        const dx = (r() - .5) * wide * 2, dy = r() * 34
        rect(c, ['#183c47', '#214b51', '#285b5b', '#32696a'][Math.floor(r() * 4)], 70 + dx - 13, y + dy, 16 + r() * 19, 9 + r() * 17)
      }
      for (let j = 0; j < 15; j++) rect(c, '#538177', 70 + (r() - .5) * wide * 2, y + 8 + r() * 12, 2 + r() * 5, 2)
    }
    return canvas
  }
  draw(g: Game, dt: number) {
    this.clock += dt
    const c = this.ctx, w = this.width, h = this.height, t = this.clock
    const target = Math.max(0, Math.min(END - w, g.player.x - w * .3))
    this.camera += (target - this.camera) * (1 - Math.exp(-5 * dt))
    if (g.mode === 'title') this.camera = 0
    const cam = Math.round(this.camera), floor = Math.round(h * (w < h ? .68 : .78)), oy = floor - GROUND
    const sky = c.createLinearGradient(0, 0, 0, h)
    sky.addColorStop(0, '#10162f'); sky.addColorStop(.45, g.zone === 2 ? '#493349' : '#343553'); sky.addColorStop(1, '#8a6572'); c.fillStyle = sky; c.fillRect(0, 0, w, h)
    // Dithered dusk bands, stars and a pixel moon.
    for (let i = 0; i < 95; i++) { const x = (rand(i + 4) * (w + 40) - cam * .03 % (w + 40) + w + 40) % (w + 40), y = rand(i + 510) * h * .6; c.globalAlpha = .3 + .5 * Math.abs(Math.sin(t * .7 + i)); rect(c, i % 4 === 0 ? '#ffd7a4' : '#c4d4ed', x, y, i % 8 === 0 ? 2 : 1, 1) }
    c.globalAlpha = 1
    const mx = w * .73 - cam * .015 % 40, my = h * .2
    this.disc(mx, my, 24, '#3c3a52'); this.disc(mx, my, 18, '#ddceb1'); this.disc(mx + 8, my - 6, 17, '#30304b')
    if (!this.reduced) for (let i = 0; i < 3; i++) { const progress = (t * .075 + i * .39) % 1; if (progress < .20) { const x = w * (.2 + i * .25) + progress * 600, y = h * .1 + progress * 160; for (let j = 0; j < 20; j++) { c.globalAlpha = (1 - j / 20) * .7; rect(c, '#b9e3eb', x - j * 3, y - j, 3, 1) } c.globalAlpha = 1; rect(c, '#fff4d4', x, y, 3, 3) } }
    // Three independent forest layers give depth without blurring the pixels.
    for (const layer of [0, 1]) {
      const spacing = layer ? 65 : 44, scroll = cam * (layer ? .37 : .14)
      for (let i = Math.floor(scroll / spacing) - 1; i < Math.floor((scroll + w) / spacing) + 2; i++) {
        const x = i * spacing - scroll, top = h * .19 + rand(i + layer * 98) * h * .23, base = floor + 10, color = layer ? '#263b4c' : '#333a50'
        rect(c, color, x, top, layer ? 10 : 5, base - top)
        for (let tier = 0; tier < 7; tier++) { const width = 9 + tier * (layer ? 9 : 6); rect(c, color, x - width / 2, top + tier * 14, width + 8, 17) }
      }
    }
    c.globalAlpha = .09; for (let i = 0; i < 4; i++) rect(c, '#dccbb4', i * 170 - cam * .2 % 170, h * .47 + i * 7, 120, 8); c.globalAlpha = 1
    const treeScroll = cam * .74
    for (let i = Math.floor(treeScroll / 147) - 1; i < Math.floor((treeScroll + w) / 147) + 2; i++) { const tree = this.trees[(i % 4 + 4) % 4], scale = .8 + rand(i + 100) * .5; c.drawImage(tree, Math.round(i * 147 - treeScroll), Math.round(floor - 225 * scale), Math.round(140 * scale), Math.round(225 * scale)) }
    c.save()
    if (!this.reduced && g.shake) c.translate(Math.sin(t * 91) * g.shake, Math.cos(t * 73) * g.shake * .5)
    c.translate(-cam, oy)
    this.ground(cam, w, h)
    // A small, quiet world alongside the action.
    for (let i = Math.floor(cam / 150) - 1; i < Math.ceil((cam + w) / 150) + 1; i++) {
      const x = i * 150 + 72
      if (i % 4 === 0) { drawSprite(c, 'fox', x, GROUND - 1, 1.3); this.sleep(x, GROUND - 22, t) }
      if (i % 5 === 2) { drawSprite(c, 'rabbit', x + 40, GROUND, 1.2); this.sleep(x + 40, GROUND - 25, t) }
      if (i % 4 === 1) { rect(c, '#344149', x, GROUND - 88, 38, 5); drawSprite(c, 'owl', x + 19, GROUND - 88, 1.3); this.sleep(x + 19, GROUND - 116, t) }
      if (i % 3 === 0) { rect(c, '#34354b', x + 60, GROUND - 48, 3, 48); rect(c, '#4d4c58', x + 52, GROUND - 50, 18, 4); this.disc(x + 61, GROUND - 36, 17, '#584950', .25); rect(c, '#ffc987', x + 57, GROUND - 46, 8, 12); rect(c, '#fff0bd', x + 59, GROUND - 44, 3, 7) }
    }
    for (const p of g.platforms) if (p.x + p.w > cam && p.x < cam + w) {
      rect(c, '#403647', p.x, p.y, p.w, 10); rect(c, '#65545b', p.x + 2, p.y + 3, p.w - 5, 3); rect(c, '#568975', p.x - 2, p.y - 3, p.w + 4, 4)
      for (let x = p.x + 7; x < p.x + p.w; x += 13) { rect(c, '#8cad87', x, p.y - 4, 5, 2); rect(c, '#41695c', x + 3, p.y + 9, 2, 8 + rand(x) * 17) }
    }
    for (const s of g.collectibles) if (!s.taken && s.x > cam - 15 && s.x < cam + w + 15) {
      const y = s.y + Math.sin(t * 2.4 + s.phase) * 3
      this.disc(s.x, y, s.comet ? 14 : 9, s.comet ? '#b5e8ef' : '#ffce7d', .10)
      drawSprite(c, 'star', s.x, y + 5, s.comet ? 1.4 : .85)
      if (s.comet) for (let j = 0; j < 9; j++) rect(c, '#7cbdd4', s.x - 9 - j * 2, y + 4 + j, 2, 1)
    }
    for (const e of g.enemies) if (e.hp > 0 && e.x > cam - 40 && e.x < cam + w + 40) {
      if (!e.awake) { if (e.type === 'mimic') { drawSprite(c, 'star', e.x, GROUND - 19 + Math.sin(t * 3) * 3); rect(c, '#e490bb', e.x - 2, GROUND - 24, 1, 1) } else { rect(c, '#5b4a58', e.x - 8, GROUND - 1, 18, 3); rect(c, '#b9869d', e.x - 5, GROUND - 2, 2, 2) } continue }
      c.save(); if (e.flash) c.globalAlpha = .45
      this.disc(e.x, GROUND, 12, '#111b2d', .4)
      drawSprite(c, e.type === 'root' ? 'root' : 'mimic', e.x, e.y, e.type === 'root' ? 1.5 : 1.6)
      if (e.cooldown < .5) this.disc(e.x, e.y - 15, 4 + (1 - e.cooldown * 2) * 5, '#ff9c78', .75)
      c.restore()
    }
    if (cam + w > ARENA - 100) this.boss(g, t)
    const p = g.player
    if (g.mode !== 'dead') {
      this.disc(p.x, Math.min(GROUND, p.y + 2), 10, '#0e1d2c', .45)
      const bob = p.grounded && Math.abs(p.vx) > 10 ? Math.sin(t * 18) * 1.3 : Math.sin(t * 3) * .45
      if (g.level) { this.disc(p.x, p.y - 14, 22 + g.level * 2, megaStar.powers[g.level].color, .07); for (let i = 0; i < g.level; i++) rect(c, megaStar.powers[g.level].color, p.x + Math.cos(t * 3 + i * 2) * 16, p.y - 17 + Math.sin(t * 3 + i * 2) * 13, 2, 2) }
      if (p.vy < 0) { rect(c, '#7ddef1', p.x - 5, p.y + 1, 3, 5 + rand(t) * 5); rect(c, '#e5f0c0', p.x + 3, p.y + 1, 2, 4) }
      c.globalAlpha = p.invulnerable && Math.sin(t * 28) > 0 ? .4 : 1
      drawSprite(c, 'robot', p.x, p.y + bob, 1.35, p.face < 0); c.globalAlpha = 1
    }
    for (const s of g.shots) {
      this.disc(s.x, s.y, s.friendly ? 7 : 10, s.friendly ? '#a1ebee' : '#ff987c', .12)
      for (let i = 4; i > 0; i--) rect(c, s.friendly ? '#4991ac' : '#a75b67', s.x - s.vx * .008 * i, s.y - s.vy * .008 * i, s.friendly ? 3 : 5, 3)
      rect(c, s.friendly ? '#dbffff' : '#ffe0a0', s.x - 2, s.y - 2, 5, 5); if (!s.friendly) rect(c, '#ffad75', s.x - 4, s.y - 1, 8, 3)
    }
    for (const part of g.particles) { c.globalAlpha = Math.max(0, part.life / part.max); rect(c, part.color, part.x, part.y, part.size, part.size) } c.globalAlpha = 1
    c.restore()
    // Foreground ferns and fireflies keep the world intimate, not empty.
    for (let i = 0; i < 18; i++) { const x = (rand(i + 37) * (w + 30) - cam * .95 % (w + 30) + w + 30) % (w + 30), y = floor - rand(i + 9) * 100 + Math.sin(t + i) * 5; this.disc(x, y, 5, '#cbe594', .07); rect(c, '#cbe594', x, y, 1, 1) }
    for (let i = Math.floor(cam / 53); i < Math.ceil((cam + w) / 53) + 1; i++) { const x = i * 53 - cam, y = floor + 12; for (let j = 0; j < 5; j++) { rect(c, '#133637', x + j * 3, y - j * 3, 2, 16 + j * 3); rect(c, '#24564b', x + j * 3 - 4, y - j * 3, 10, 2) } }
    const shade = c.createLinearGradient(0, h * .83, 0, h); shade.addColorStop(0, '#0c152800'); shade.addColorStop(1, '#080f25c0'); c.fillStyle = shade; c.fillRect(0, h * .83, w, h * .17)
  }
  disc(x: number, y: number, radius: number, color: string, alpha = 1) {
    const c = this.ctx; c.save(); c.globalAlpha *= alpha
    for (let dy = -radius; dy <= radius; dy += 2) { const half = Math.sqrt(Math.max(0, radius * radius - dy * dy)); rect(c, color, x - half, y + dy, half * 2, 2) } c.restore()
  }
  sleep(x: number, y: number, t: number) { const c = this.ctx; c.save(); c.globalAlpha = .35; c.fillStyle = '#c3d5d3'; c.font = '6px monospace'; c.fillText('z', x + 10, y - (t * 4 % 11)); c.fillText('z', x + 16, y - 9 - (t * 4 % 11)); c.restore() }
  ground(cam: number, w: number, h: number) {
    const c = this.ctx
    rect(c, '#27333e', cam, GROUND, w, h); rect(c, '#44645b', cam, GROUND, w, 5); rect(c, '#7d9878', cam, GROUND, w, 2)
    for (let x = Math.floor(cam / 8) * 8; x < cam + w + 10; x += 8) {
      rect(c, '#294c48', x, GROUND - 1, 2, -2 - rand(x) * 6)
      rect(c, '#47504c', x + 1, GROUND + 10 + rand(x + 8) * 22, 3 + rand(x) * 5, 2)
      rect(c, '#192835', x, GROUND + 42 + rand(x + 3) * 28, 5, 3)
      if (rand(x + 80) > .92) drawSprite(c, 'mushroom', x, GROUND, .8 + rand(x) * .3)
      if (rand(x + 90) > .9) { rect(c, '#63866e', x, GROUND - 6, 1, 6); rect(c, '#bba6c8', x - 1, GROUND - 7, 3, 2) }
    }
  }
  boss(g: Game, t: number) {
    const c = this.ctx, b = g.boss
    // Ancient stone arch and sleeping toddler's moon carriage.
    rect(c, '#3a4751', 4235, GROUND - 120, 12, 120); rect(c, '#3a4751', 4350, GROUND - 120, 12, 120); rect(c, '#4f6067', 4244, GROUND - 126, 109, 13)
    for (let i = 0; i < 6; i++) { rect(c, '#77918a', 4240, GROUND - 110 + i * 19, 3, 5); rect(c, '#ab9682', 4353, GROUND - 110 + i * 19, 2, 5) }
    rect(c, '#443952', 4366, GROUND - 16, 32, 13); this.disc(4372, GROUND - 1, 5, '#242a43'); this.disc(4390, GROUND - 1, 5, '#242a43')
    drawSprite(c, 'child', 4382, GROUND - 16 + Math.sin(t * 2) * .5, 1.35)
    c.save(); if (b.flash) c.globalAlpha = .45
    drawSprite(c, 'mother', b.x, b.y + Math.sin(t * 2) * .5, 1.75); c.restore()
    if (b.shield && b.hp > 0) {
      c.save(); c.strokeStyle = '#b5d6f4'; c.globalAlpha = .6; c.lineWidth = 1; c.beginPath(); c.ellipse(b.x, b.y - 28, 34, 40, 0, 0, Math.PI * 2); c.stroke(); c.restore()
      for (let i = 0; i < 7; i++) { const phase = (t + i / 2) % 3 / 3; this.disc(4380 - phase * (4380 - b.x), GROUND - 40 - Math.sin(phase * Math.PI) * 25, 2 + i % 3, '#adcee9', .4) }
    }
    if (b.cooldown < .6 && !b.shield && b.hp > 0) this.disc(b.x - 24, b.y - 30, 6 + Math.sin(t * 15) * 2, '#ffb17a', .7)
  }
}
