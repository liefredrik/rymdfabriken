import { starChild } from '../../data/starchild.ts'

export type Mode = 'title' | 'playing' | 'paused' | 'dead' | 'won'
export type Input = { left: boolean; right: boolean; jump: boolean; fire: boolean; dash: boolean }
export type Platform = { x: number; y: number; w: number }
export type Star = { x: number; y: number; taken: boolean; phase: number; comet?: boolean; falling?: boolean; life?: number }
export type Relic = { x: number; y: number; taken: boolean }
export type Enemy = { x: number; y: number; home: number; type: 'root' | 'mimic' | 'wisp'; hp: number; time: number; cooldown: number; awake: boolean; flash: number }
export type Shot = { x: number; y: number; vx: number; vy: number; life: number; power: number; friendly: boolean; radius: number }
export type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number }
export type GameEvent = 'jump' | 'shoot' | 'star' | 'hurt' | 'burst' | 'power' | 'boss' | 'win' | 'dash' | 'reflect' | 'relic' | 'comet'
export const GROUND = 240, END = 4440, ARENA = 3980
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))
export const emptyInput = (): Input => ({ left: false, right: false, jump: false, fire: false, dash: false })
export function seedRandom(seed: number) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 } }

export class Game {
  mode: Mode = 'title'
  time = 0
  player = { x: 70, y: GROUND, vx: 0, vy: 0, hp: 5, face: 1, jumps: 0, grounded: true, invulnerable: 0, shoot: 0, coyote: .1, jumpBuffer: 0, dash: 0, dashCooldown: 0 }
  stars = 0
  level = 0
  zone = 0
  kills = 0
  comets = 0
  reflected = 0
  relics: Relic[] = [{ x: 514, y: 82, taken: false }, { x: 1666, y: 82, taken: false }, { x: 3394, y: 82, taken: false }]
  shake = 0
  banner = starChild.hint as string
  bannerTime = 7
  platforms: Platform[] = []
  collectibles: Star[] = []
  enemies: Enemy[] = []
  shots: Shot[] = []
  particles: Particle[] = []
  events: GameEvent[] = []
  boss = { active: false, hp: 180, max: 180, x: 4290, y: GROUND, time: 0, shield: true, cooldown: 3, flash: 0, phase: 1, sweep: 6, warning: 0 }
  previousJump = false
  previousDash = false
  cometTimer = 6
  rng = seedRandom(43871)

  constructor() {
    for (let i = 0; i < 19; i++) {
      const x = 220 + i * 192, y = GROUND - 48 - (i % 3) * 22
      this.platforms.push({ x, y, w: 65 + (i % 2) * 18 })
      if (i % 3 === 1) this.platforms.push({ x: x + 79, y: y - 48, w: 52 })
      for (let j = 0; j < 3; j++) this.collectibles.push({ x: x + 12 + j * 18, y: y - 19, taken: false, phase: this.rng() * 6 })
      for (let j = 0; j < 3; j++) this.collectibles.push({ x: x + 78 + j * 23, y: GROUND - 20 - Math.sin(j / 2 * Math.PI) * 14, taken: false, phase: this.rng() * 6 })
      if (i > 0) this.enemies.push({ x: x + 100, home: x + 100, y: GROUND, type: i % 3 === 0 ? 'mimic' : i % 4 === 0 ? 'wisp' : 'root', hp: i < 7 ? 2 : 3, time: this.rng() * 2, cooldown: 2, awake: false, flash: 0 })
    }
  }
  start() { this.mode = 'playing' }
  pause() { if (this.mode === 'playing') { this.mode = 'paused'; this.previousJump = false; this.previousDash = false } }
  resume() { if (this.mode === 'paused') this.mode = 'playing' }
  message(text: string, seconds = 3) { this.banner = text; this.bannerTime = seconds }
  burst(x: number, y: number, color: string, count = 12) {
    for (let i = 0; i < count; i++) { const a = this.rng() * Math.PI * 2, v = 15 + this.rng() * 65, life = .25 + this.rng() * .5; this.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, life, max: life, color, size: 1 + Math.floor(this.rng() * 3) }) }
  }
  collect(star: Star) {
    if (star.taken) return
    star.taken = true; this.stars += star.comet ? 3 : 1; this.events.push('star'); this.burst(star.x, star.y, '#ffdd91', 8)
    if (star.comet) { this.comets++; this.message('Komet fångad · +3 stjärnor', 2) }
    const next = starChild.powers.reduce((l, power, i) => this.stars >= power.stars ? i : l, 0)
    if (next > this.level) { this.level = next; this.player.hp = Math.min(5, this.player.hp + 1); this.player.invulnerable = 1.5; this.message(`${starChild.powers[next].name} · ${starChild.powers[next].detail}`, 4); this.burst(this.player.x, this.player.y - 15, starChild.powers[next].color, 36); this.events.push('power') }
  }
  hurt(fromX: number) {
    const p = this.player
    if (p.invulnerable > 0 || p.dash > 0 || this.mode !== 'playing') return
    p.hp--; p.invulnerable = 1.5; p.vx = p.x < fromX ? -95 : 95; p.vy = -115; this.shake = 5; this.events.push('hurt'); this.burst(p.x, p.y - 14, '#ff8588')
    if (p.hp <= 0) { this.mode = 'dead'; this.burst(p.x, p.y - 14, '#acdfff', 35) }
  }
  fire(x: number, y: number, vx: number, vy: number, friendly: boolean, power = 1) {
    this.shots.push({ x, y, vx, vy, life: friendly ? 1.4 + this.level * .12 : 4, power, friendly, radius: friendly ? 3 : 5 })
  }
  update(dt: number, input: Input) {
    if (this.mode !== 'playing') return
    dt = Math.min(dt, 1 / 30); this.time += dt; this.bannerTime -= dt; this.shake = Math.max(0, this.shake - dt * 20)
    const p = this.player
    p.dash = Math.max(0, p.dash - dt); p.dashCooldown = Math.max(0, p.dashCooldown - dt)
    if (input.dash && !this.previousDash && p.dashCooldown === 0) {
      p.dash = .23; p.dashCooldown = 2; p.invulnerable = Math.max(p.invulnerable, .3)
      this.events.push('dash'); this.burst(p.x, p.y - 12, '#b5f5ff', 16)
    }
    this.previousDash = input.dash
    p.invulnerable = Math.max(0, p.invulnerable - dt); p.shoot -= dt; p.jumpBuffer -= dt
    if (input.jump && !this.previousJump) p.jumpBuffer = .13
    this.previousJump = input.jump
    p.coyote = p.grounded ? .1 : Math.max(0, p.coyote - dt)
    const direction = Number(input.right) - Number(input.left), speed = 105 + this.level * 6
    p.vx += (direction * speed - p.vx) * (1 - Math.exp(-(p.grounded ? 16 : 8) * dt))
    if (direction) p.face = direction
    if (p.dash > 0) { p.vx = p.face * 310; p.vy *= .8 }
    if (p.jumpBuffer > 0 && (p.coyote > 0 || p.jumps < 2)) {
      p.vy = -225; p.jumps = p.coyote > 0 ? 1 : p.jumps + 1; p.grounded = false; p.coyote = 0; p.jumpBuffer = 0; this.events.push('jump'); this.burst(p.x, p.y, '#99cde8', 7)
    }
    if (!input.jump && p.vy < -80) p.vy += 420 * dt
    const oldY = p.y
    p.vy += 550 * dt; p.x = clamp(p.x + p.vx * dt, this.boss.active ? ARENA - 65 : 15, END - 20); p.y += p.vy * dt; p.grounded = false
    let floor = GROUND
    for (const plat of this.platforms) if (p.x + 8 > plat.x && p.x - 8 < plat.x + plat.w && oldY <= plat.y + 1 && p.y >= plat.y && p.vy >= 0) floor = Math.min(floor, plat.y)
    if (p.y >= floor && p.vy >= 0) { p.y = floor; p.vy = 0; p.grounded = true; p.jumps = 0 }
    if (input.fire && p.shoot <= 0) {
      const angles = this.level >= 3 ? [-.17, 0, .17] : this.level >= 2 ? [-.09, .09] : [0]
      for (const a of angles) this.fire(p.x + p.face * 13, p.y - 15, p.face * 260, a * 260, true, this.level >= 1 ? 2 : 1)
      p.shoot = .30 - this.level * .025; this.events.push('shoot')
    }
    for (const star of this.collectibles) {
      if (star.comet && !star.taken) {
        star.life = (star.life ?? 12) - dt
        if (star.life <= 0) { star.taken = true; this.burst(star.x, star.y, '#8396c8', 6); continue }
        if (star.falling) { star.x -= 28 * dt; star.y += 115 * dt; if (star.y >= GROUND - 20) { star.y = GROUND - 20; star.falling = false; this.burst(star.x, star.y, '#b3e5ff', 14) } }
      }
      if (star.taken || Math.abs(star.x - p.x) > 160) continue
      const distance = Math.hypot(star.x - p.x, star.y - (p.y - 15))
      if (distance < 16) this.collect(star)
      else if (distance < 25 + this.level * 13) { star.x += (p.x - star.x) * dt * 5; star.y += (p.y - 15 - star.y) * dt * 5 }
    }
    this.relics.forEach((relic, i) => {
      if (!relic.taken && Math.hypot(relic.x - p.x, relic.y - (p.y - 15)) < 22) {
        relic.taken = true; this.events.push('relic'); this.burst(relic.x, relic.y, '#d6c3ff', 30)
        p.hp = Math.min(5, p.hp + 1); this.message(`${starChild.relics[i]} · månskärva ${this.relics.filter(r => r.taken).length}/3`, 4)
      }
    })
    const newZone = p.x >= 2950 ? 2 : p.x >= 1450 ? 1 : 0
    if (newZone !== this.zone) { this.zone = newZone; this.message(starChild.zones[newZone].name + ' · ' + starChild.zones[newZone].caption, 4) }
    this.cometTimer -= dt
    if (this.cometTimer <= 0 && !this.boss.active) {
      this.cometTimer = this.zone === 1 ? 5 : 9
      this.collectibles.push({ x: Math.min(3890, p.x + 170), y: GROUND - 220, taken: false, phase: 0, comet: true, falling: true, life: 12 })
      this.events.push('comet')
    }
    for (const e of this.enemies) {
      if (e.hp <= 0 || Math.abs(e.x - p.x) > 370) continue
      e.flash = Math.max(0, e.flash - dt); e.time += dt
      if (!e.awake && Math.abs(e.x - p.x) < (e.type === 'mimic' ? 53 : 150)) { e.awake = true; e.time = 0; e.cooldown = 1.4; this.burst(e.x, GROUND, '#73666b', 9) }
      if (!e.awake) continue
      e.cooldown -= dt
      if (e.type === 'root') e.y = GROUND + Math.max(0, 1 - e.time * 2) * 24
      else { e.x = e.home + Math.sin(e.time * 1.7) * 30; e.y = GROUND - (e.type === 'wisp' ? 49 : 22) + Math.sin(e.time * 2.5) * 13 }
      if (e.time > .6 && e.cooldown <= 0) {
        const angle = Math.atan2(p.y - 16 - (e.y - 16), p.x - e.x)
        this.fire(e.x, e.y - 16, Math.cos(angle) * (68 + this.zone * 8), Math.sin(angle) * 68, false)
        e.cooldown = 2.5 - this.zone * .2
      }
      if (e.time > .5 && Math.abs(p.x - e.x) < 18 && Math.abs(p.y - e.y) < 25) {
        if (p.vy > 80 && oldY < e.y - 15) { e.hp -= 2; p.vy = -175; this.burst(e.x, e.y - 15, '#ddc1ff'); if (e.hp <= 0) this.defeat(e) }
        else this.hurt(e.x)
      }
    }
    if (this.mode !== 'playing') return
    this.updateBoss(dt)
    if (this.mode !== 'playing') return
    for (const shot of this.shots) {
      shot.x += shot.vx * dt; shot.y += shot.vy * dt; shot.life -= dt
      if (shot.life <= 0) continue
      if (shot.friendly) {
        for (const e of this.enemies) if (e.hp > 0 && e.awake && Math.abs(e.x - shot.x) < 14 && Math.abs(e.y - 14 - shot.y) < 18) {
          e.hp -= shot.power; e.flash = .1; shot.life = 0; this.burst(shot.x, shot.y, '#ddc1ff', 5); if (e.hp <= 0) this.defeat(e); break
        }
        const b = this.boss
        if (shot.life > 0 && b.active && b.hp > 0 && Math.abs(shot.x - b.x) < 23 && Math.abs(shot.y - (b.y - 26)) < 33) {
          shot.life = 0; this.burst(shot.x, shot.y, b.shield ? '#b8d7ff' : '#ffd58c', 5)
          if (!b.shield) { b.hp = Math.max(0, b.hp - shot.power); b.flash = .1; if (b.hp === 0) { this.mode = 'won'; this.shots = []; this.events.push('win'); this.burst(b.x, b.y - 35, '#ffdc95', 60); this.message(starChild.victory, 100) } }
        }
      } else if (Math.hypot(shot.x - p.x, shot.y - (p.y - 14)) < shot.radius + (p.dash > 0 ? 27 : 9)) {
        if (p.dash > 0) { shot.friendly = true; shot.vx = p.face * 290; shot.vy = 0; shot.power = 4; shot.life = 2; this.reflected++; this.events.push('reflect'); this.burst(shot.x, shot.y, '#c8f9ff', 9) }
        else { this.hurt(shot.x); shot.life = 0; if (p.hp <= 0) break }
      }
    }
    this.shots = this.shots.filter(s => s.life > 0 && s.y < GROUND + 15 && Math.abs(s.x - p.x) < 700)
    this.collectibles = this.collectibles.filter(s => !s.comet || !s.taken)
    for (const part of this.particles) { part.life -= dt; part.x += part.vx * dt; part.y += part.vy * dt; part.vy += 80 * dt }
    this.particles = this.particles.filter(p => p.life > 0).slice(-350)
  }
  defeat(e: Enemy) {
    this.kills++; this.events.push('burst'); this.burst(e.x, e.y - 14, '#c8a0eb', 18)
    for (let j = 0; j < 2; j++) this.collectibles.push({ x: e.x + j * 14 - 7, y: e.y - 20, taken: false, phase: j })
  }
  updateBoss(dt: number) {
    const b = this.boss, p = this.player
    if (!b.active && p.x > ARENA) { b.active = true; this.events.push('boss'); this.message(`${starChild.boss.name} · ${starChild.boss.intro}`, 5); this.shots = this.shots.filter(s => s.friendly) }
    if (!b.active || b.hp <= 0) return
    b.time += dt; b.cooldown -= dt; b.flash = Math.max(0, b.flash - dt); b.sweep -= dt
    b.warning = b.sweep < 1.1 ? 1.1 - b.sweep : 0
    if (b.sweep <= 0) {
      this.fire(b.x - 28, GROUND - 8, -120, 0, false)
      if (b.phase === 2) this.fire(b.x - 7, GROUND - 8, -120, 0, false)
      b.sweep = 6; b.warning = 0
    }
    b.phase = b.hp < b.max * .5 ? 2 : 1; b.shield = b.time % 8 < 2.5
    b.x = 4280 + Math.sin(b.time * .65) * 32
    if (b.cooldown <= 0 && !b.shield) {
      const angle = Math.atan2(p.y - 15 - (b.y - 31), p.x - b.x)
      for (const offset of b.phase === 2 ? [-.23, 0, .23] : [0]) this.fire(b.x - 18, b.y - 31, Math.cos(angle + offset) * 90, Math.sin(angle + offset) * 90, false)
      b.cooldown = b.phase === 2 ? 1.25 : 1.8
      this.burst(b.x - 20, b.y - 31, '#ff9f73', 7)
    }
    if (Math.abs(p.x - b.x) < 26 && p.y > b.y - 49) this.hurt(b.x)
  }
}
