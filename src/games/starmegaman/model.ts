import { starMegaMan } from '../../data/starmegaman.ts'

export const FLOOR = 252
export const WORLD = 4620
export const GATE = 4180
export type Controls = { left: boolean; right: boolean; jump: boolean; fire: boolean }
export type Phase = 'ready' | 'playing' | 'paused' | 'lost' | 'won'
export type Cue = 'jump' | 'collect' | 'shoot' | 'hurt' | 'upgrade' | 'pop' | 'boss' | 'win'
export type Pickup = { x: number; y: number; value: number; collected: boolean }
export type Enemy = { x: number; y: number; origin: number; kind: 'root' | 'star' | 'wisp'; health: number; age: number; awake: boolean; timer: number; hit: number }
export type Bolt = { x: number; y: number; vx: number; vy: number; friendly: boolean; life: number; damage: number }
export type Mote = { x: number; y: number; vx: number; vy: number; life: number; color: string }
export const freshControls = (): Controls => ({ left: false, right: false, jump: false, fire: false })
export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
export function random(seed: number) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; return (seed >>> 0) / 4294967296 }
}

/** Deterministic simulation; DOM, rendering and audio live outside this module. */
export class Night {
  phase: Phase = 'ready'
  elapsed = 0
  stars = 0
  power = 0
  chapter = 0
  defeated = 0
  notice = 'Gå åt höger. Lita inte på allt som glittrar.'
  noticeTime = 6
  shake = 0
  cometIn = 8
  jumpHeld = false
  rng = random(92817)
  player = { x: 64, y: FLOOR, vx: 0, vy: 0, health: 5, facing: 1, grounded: true, jumps: 0, grace: .1, buffer: 0, immune: 0, shotIn: 0 }
  platforms: { x: number; y: number; width: number }[] = []
  pickups: Pickup[] = []
  enemies: Enemy[] = []
  bolts: Bolt[] = []
  motes: Mote[] = []
  cues: Cue[] = []
  boss = { active: false, x: 4475, y: FLOOR, health: 90, maxHealth: 90, age: 0, shield: false, shotIn: 1.8, hit: 0 }

  constructor() {
    for (let i = 0; i < 21; i++) {
      const x = 200 + i * 184, y = FLOOR - 48 - (i % 3) * 22
      this.platforms.push({ x, y, width: 72 })
      if (i % 3 === 1) this.platforms.push({ x: x + 84, y: y - 43, width: 48 })
      for (let j = 0; j < 3; j++) {
        this.pickups.push({ x: x + 12 + j * 22, y: y - 20, value: 1, collected: false })
        this.pickups.push({ x: x + 89 + j * 25, y: FLOOR - 18 - Math.sin(j * 1.5) * 12, value: 1, collected: false })
      }
      if (i > 0) this.enemies.push({ x: x + 105, origin: x + 105, y: FLOOR, kind: i % 3 === 0 ? 'star' : i % 4 === 0 ? 'wisp' : 'root', health: i < 8 ? 2 : 4, age: 0, awake: false, timer: 1.7, hit: 0 })
    }
  }

  start() { if (this.phase === 'ready') this.phase = 'playing' }
  pause() { if (this.phase === 'playing') this.phase = 'paused' }
  resume() { if (this.phase === 'paused') this.phase = 'playing' }
  announce(text: string, duration = 3.5) { this.notice = text; this.noticeTime = duration }
  particles(x: number, y: number, color: string, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = this.rng() * Math.PI * 2, speed = 18 + this.rng() * 65
      this.motes.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 25, life: .4 + this.rng() * .5, color })
    }
  }
  collect(pickup: Pickup) {
    if (pickup.collected) return
    pickup.collected = true; this.stars += pickup.value; this.cues.push('collect')
    this.particles(pickup.x, pickup.y, '#ffe5a0', 8)
    const next = starMegaMan.powers.reduce((value, power, i) => this.stars >= power.at ? i : value, 0)
    if (next > this.power) {
      this.power = next; this.player.health = Math.min(5, this.player.health + 1); this.player.immune = 1.5
      this.announce(`${starMegaMan.powers[next].name} · ${starMegaMan.powers[next].description}`, 4)
      this.cues.push('upgrade'); this.particles(this.player.x, this.player.y - 14, starMegaMan.powers[next].color, 40)
    }
  }
  hurt(sourceX: number) {
    const p = this.player
    if (p.immune > 0 || this.phase !== 'playing') return
    p.health--; p.immune = 1.6; p.vx = p.x < sourceX ? -100 : 100; p.vy = -120
    this.shake = 4; this.cues.push('hurt'); this.particles(p.x, p.y - 12, '#ff9b9b', 18)
    if (p.health === 0) this.phase = 'lost'
  }
  projectile(x: number, y: number, vx: number, vy: number, friendly: boolean) {
    this.bolts.push({ x, y, vx, vy, friendly, life: friendly ? 1.6 : 5, damage: friendly && this.power > 0 ? 2 : 1 })
  }
  defeat(enemy: Enemy) {
    this.defeated++; this.cues.push('pop'); this.particles(enemy.x, enemy.y - 13, '#d4b0fc', 18)
    for (const offset of [-8, 8]) this.pickups.push({ x: enemy.x + offset, y: enemy.y - 18, value: 1, collected: false })
  }

  update(dt: number, input: Controls) {
    if (this.phase !== 'playing') return
    dt = clamp(dt, 0, 1 / 30)
    this.elapsed += dt; this.noticeTime -= dt; this.shake = Math.max(0, this.shake - dt * 16)
    const p = this.player
    p.immune = Math.max(0, p.immune - dt); p.shotIn -= dt; p.buffer -= dt
    if (input.jump && !this.jumpHeld) p.buffer = .12
    this.jumpHeld = input.jump
    p.grace = p.grounded ? .1 : Math.max(0, p.grace - dt)
    const direction = Number(input.right) - Number(input.left)
    p.vx += (direction * (100 + this.power * 7) - p.vx) * (1 - Math.exp(-dt * (p.grounded ? 17 : 9)))
    if (direction) p.facing = direction
    if (p.buffer > 0 && (p.grace > 0 || p.jumps < 2)) {
      p.vy = -228; p.jumps = p.grace > 0 ? 1 : p.jumps + 1; p.grace = 0; p.grounded = false; p.buffer = 0
      this.cues.push('jump'); this.particles(p.x, p.y, '#97d9fa', 7)
    }
    if (!input.jump && p.vy < -90) p.vy += 420 * dt
    const previousY = p.y
    p.vy += 560 * dt
    p.x = clamp(p.x + p.vx * dt, this.boss.active ? GATE - 70 : 14, WORLD - 18)
    p.y += p.vy * dt; p.grounded = false
    let landing = FLOOR
    for (const platform of this.platforms) {
      if (p.x + 8 > platform.x && p.x - 8 < platform.x + platform.width && previousY <= platform.y + .1 && p.y >= platform.y && p.vy >= 0) landing = Math.min(landing, platform.y)
    }
    if (p.y >= landing && p.vy >= 0) { p.y = landing; p.vy = 0; p.jumps = 0; p.grounded = true }
    if (input.fire && p.shotIn <= 0) {
      const angles = this.power === 3 ? [-.16, 0, .16] : this.power === 2 ? [-.07, .07] : [0]
      for (const angle of angles) this.projectile(p.x + p.facing * 12, p.y - 15, p.facing * 270, angle * 270, true)
      p.shotIn = .29 - this.power * .022; this.cues.push('shoot')
    }
    for (const pickup of this.pickups) {
      if (pickup.collected || Math.abs(pickup.x - p.x) > 100) continue
      const distance = Math.hypot(pickup.x - p.x, pickup.y - p.y + 14)
      if (distance < 17) this.collect(pickup)
      else if (distance < 23 + this.power * 14) { pickup.x += (p.x - pickup.x) * dt * 6; pickup.y += (p.y - 14 - pickup.y) * dt * 6 }
    }
    const chapter = p.x >= 3000 ? 2 : p.x >= 1500 ? 1 : 0
    if (chapter !== this.chapter) { this.chapter = chapter; this.announce(starMegaMan.chapters[chapter].name + ' · ' + starMegaMan.chapters[chapter].caption) }
    this.cometIn -= dt
    if (this.cometIn <= 0 && !this.boss.active) {
      this.cometIn = 11
      const x = Math.min(GATE - 100, p.x + 110)
      this.pickups.push({ x, y: FLOOR - 30, value: 3, collected: false }); this.particles(x, FLOOR - 30, '#b5f0ff', 24)
    }
    for (const enemy of this.enemies) {
      if (enemy.health <= 0 || Math.abs(enemy.x - p.x) > 380) continue
      enemy.hit = Math.max(0, enemy.hit - dt)
      if (!enemy.awake && Math.abs(enemy.x - p.x) < (enemy.kind === 'star' ? 66 : 148)) {
        enemy.awake = true; enemy.age = 0; this.particles(enemy.x, FLOOR, '#7f747b', 10)
      }
      if (!enemy.awake) continue
      enemy.age += dt; enemy.timer -= dt
      if (enemy.kind === 'root') enemy.y = FLOOR + Math.max(0, 1 - enemy.age * 2) * 25
      else { enemy.x = enemy.origin + Math.sin(enemy.age * 1.6) * 25; enemy.y = FLOOR - (enemy.kind === 'wisp' ? 48 : 23) + Math.sin(enemy.age * 2.7) * 10 }
      if (enemy.timer <= 0 && enemy.age > .6) {
        const angle = Math.atan2(p.y - enemy.y, p.x - enemy.x), speed = 63 + this.chapter * 10
        this.projectile(enemy.x, enemy.y - 14, Math.cos(angle) * speed, Math.sin(angle) * speed, false)
        enemy.timer = 2.65 - this.chapter * .2
      }
      if (enemy.age > .5 && Math.abs(p.x - enemy.x) < 18 && Math.abs(p.y - enemy.y) < 24) {
        if (p.vy > 80 && previousY < enemy.y - 17) { enemy.health -= 2; p.vy = -180; if (enemy.health <= 0) this.defeat(enemy) }
        else this.hurt(enemy.x)
      }
    }
    if (this.phase !== 'playing') return
    this.updateBoss(dt)
    for (const bolt of this.bolts) {
      bolt.life -= dt; bolt.x += bolt.vx * dt; bolt.y += bolt.vy * dt
      if (bolt.life <= 0) continue
      if (!bolt.friendly) {
        if (Math.hypot(bolt.x - p.x, bolt.y - p.y + 14) < 12) { this.hurt(bolt.x); bolt.life = 0 }
        if (this.phase !== 'playing') break
        continue
      }
      for (const enemy of this.enemies) {
        if (enemy.health <= 0 || !enemy.awake || enemy.age < .5) continue
        if (Math.abs(bolt.x - enemy.x) < 14 && Math.abs(bolt.y - enemy.y + 14) < 18) {
          enemy.health -= bolt.damage; enemy.hit = .1; bolt.life = 0; this.particles(bolt.x, bolt.y, '#dcc4ff', 5)
          if (enemy.health <= 0) this.defeat(enemy)
          break
        }
      }
      const boss = this.boss
      if (bolt.life > 0 && boss.active && Math.abs(bolt.x - boss.x) < 22 && Math.abs(bolt.y - boss.y + 27) < 31) {
        bolt.life = 0; this.particles(bolt.x, bolt.y, boss.shield ? '#a8dfff' : '#ffd19e', 5)
        if (!boss.shield) {
          boss.health = Math.max(0, boss.health - bolt.damage); boss.hit = .1
          if (boss.health === 0) { this.phase = 'won'; this.cues.push('win'); this.particles(boss.x, boss.y - 25, '#ffe3a1', 60); break }
        }
      }
    }
    this.bolts = this.bolts.filter(b => b.life > 0 && b.y < FLOOR + 16 && Math.abs(b.x - p.x) < 650)
    for (const mote of this.motes) { mote.life -= dt; mote.x += mote.vx * dt; mote.y += mote.vy * dt; mote.vy += 70 * dt }
    this.motes = this.motes.filter(m => m.life > 0).slice(-300)
  }

  updateBoss(dt: number) {
    const b = this.boss, p = this.player
    if (!b.active && p.x >= GATE) {
      b.active = true; this.bolts = []; this.cues.push('boss')
      this.announce(starMegaMan.boss.name + ' · ' + starMegaMan.boss.line, 5)
    }
    if (!b.active || b.health <= 0) return
    b.age += dt; b.shotIn -= dt; b.hit = Math.max(0, b.hit - dt)
    b.shield = b.age % 8 > 5.4; b.x = 4470 + Math.sin(b.age * .7) * 28
    if (b.shotIn <= 0 && !b.shield) {
      const angle = Math.atan2(p.y - 15 - (b.y - 32), p.x - b.x)
      for (const offset of b.health < 45 ? [-.24, 0, .24] : [0]) this.projectile(b.x - 17, b.y - 32, Math.cos(angle + offset) * 89, Math.sin(angle + offset) * 89, false)
      b.shotIn = b.health < 45 ? 1.3 : 1.85
      this.particles(b.x - 20, b.y - 32, '#ffba85', 6)
    }
    if (Math.abs(p.x - b.x) < 25 && p.y > b.y - 48) this.hurt(b.x)
  }
}
