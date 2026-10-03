// MegaStar — game state, entities, boss fight, HUD and menus.

import { Audio } from './audio'
import { drawText, measureText, wrapText, FONT_H } from './font'
import type { Input } from './input'
import { drawSprite, fillCircle, sprite, type Sprite } from './sprites'
import { LEVEL_W, World, type Camera } from './world'

const GRAVITY = 640
const BOSS_TRIGGER_X = LEVEL_W - 520
const DT_MAX = 1 / 50

export const POWER_THRESHOLDS = [0, 5, 11, 18, 26, 35, 45, 56, 70]
const POWER_NAMES = ['Nykomling', 'Snabba fötter', 'Dubbelhopp', 'Stjärnskott', 'Extra hjärta', 'Stjärnmagnet', 'Trippelskott', 'Stjärnaura', 'MEGASTAR']
const MAX_LEVEL = POWER_THRESHOLDS.length - 1

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  color: string
  size: number
  gravity: number
  glow?: boolean
}

type FloatText = { x: number; y: number; text: string; life: number; color: string; scale: number }

type Star = {
  x: number
  y: number
  vx: number
  vy: number
  big: boolean
  landed: number // seconds since landing, -1 while in the air
  trail: { x: number; y: number }[]
  spin: number
  dead: boolean
}

type MonsterStar = { x: number; y: number; vx: number; vy: number; hp: number; phase: number; flash: number; dead: boolean }

type Mole = {
  x: number
  state: 'warn' | 'rise' | 'shoot' | 'sink'
  t: number
  rise: number // 0..1 how far out of the ground
  shots: number
  nextShot: number
  hp: number
  flash: number
  mouth: number
  dead: boolean
}

type Fireball = { x: number; y: number; vx: number; vy: number; gravity: boolean; r: number; life: number; dead: boolean }
type Shot = { x: number; y: number; vx: number; vy: number; dmg: number; pierce: boolean; big: boolean; dead: boolean; hitIds: Set<object> }
type Shockwave = { x: number; dir: number; life: number; dead: boolean }

type Bubble = { text: string; life: number; who: 'mum' | 'girl' | 'player' }

type BossState = 'enter' | 'idle' | 'cast' | 'leap' | 'hurt' | 'defeated'

type Boss = {
  x: number
  y: number
  vx: number
  vy: number
  hp: number
  maxHp: number
  state: BossState
  t: number
  flash: number
  facing: number
  armUp: number
  attacks: number
  idleTime: number
  hairPhase: number
}

type Girl = {
  x: number
  y: number
  vx: number
  vy: number
  facing: number
  target: Star | null
  carrying: boolean
  anim: number
  throwTimer: number
  giggle: number
}

type Ball = { x: number; y: number; vx: number; vy: number; bounces: number; dead: boolean }

export type Scene = 'title' | 'playing' | 'paused' | 'dead' | 'win' | 'bossIntro'

export class Game {
  scene: Scene = 'title'
  private world = new World()
  private cam: Camera = { x: 0, y: 0, vw: 320, vh: 240, groundY: 206, shakeX: 0, shakeY: 0 }
  private shake = 0
  private hitstop = 0
  private slowmo = 1
  private time = 0
  private runTime = 0
  private sceneTime = 0

  // player
  private px = 60
  private py = 0
  private vx = 0
  private vy = 0
  private facing = 1
  private onGround = true
  private jumpsLeft = 1
  private coyote = 0
  private jumpBuffer = 0
  private anim = 0
  private hp = 3
  private maxHp = 3
  private invuln = 0
  private hurtT = 0
  private stars = 0
  private level = 0
  private combo = 0
  private comboT = 0
  private shootCd = 0
  private score = 0
  private best = 0
  private bestStars = 0
  private deadT = 0
  private levelBanner = 0
  private levelBannerText = ''
  private auraPhase = 0

  private starList: Star[] = []
  private monsters: MonsterStar[] = []
  private moles: Mole[] = []
  private fireballs: Fireball[] = []
  private shots: Shot[] = []
  private waves: Shockwave[] = []
  private balls: Ball[] = []
  private particles: Particle[] = []
  private floats: FloatText[] = []
  private bubbles: Bubble[] = []

  private starTimer = 1
  private monsterTimer = 9
  private moleTimer = 12

  private boss: Boss | null = null
  private girl: Girl | null = null
  private arenaL = 0
  private arenaR = LEVEL_W
  private bossIntroT = 0
  private bossDefeated = false
  private winT = 0

  private sp = {
    stand: sprite('player_stand'),
    run: [sprite('player_run1'), sprite('player_run2'), sprite('player_run3'), sprite('player_run2')],
    jump: sprite('player_jump'),
    hurt: sprite('player_hurt'),
    monster: sprite('monster_star'),
    star: sprite('star'),
    starSmall: sprite('star_small'),
    moleClosed: sprite('mole_closed'),
    moleOpen: sprite('mole_open'),
    heart: sprite('heart_full'),
    heartEmpty: sprite('heart_empty'),
    hudStar: sprite('hud_star'),
    mum: sprite('mum_idle'),
    mumArm: sprite('mum_arm_up'),
    girl: [sprite('girl_1'), sprite('girl_2')],
    shot: sprite('shot'),
    shotBig: sprite('shot_big'),
    ball: sprite('ball'),
  }

  constructor(private input: Input, private audio: Audio) {
    try {
      this.best = Number(localStorage.getItem('megastar.best') ?? 0) || 0
      this.bestStars = Number(localStorage.getItem('megastar.bestStars') ?? 0) || 0
    } catch {
      this.best = 0
    }
    this.resetRun()
    this.input.showControls(false)
  }

  resize(vw: number, vh: number, groundY: number) {
    this.cam.vw = vw
    this.cam.vh = vh
    this.cam.groundY = groundY
  }

  /* ------------------------------------------------------------- lifecycle */

  private resetRun() {
    this.px = 60
    this.py = 0
    this.vx = 0
    this.vy = 0
    this.facing = 1
    this.onGround = true
    this.jumpsLeft = 1
    this.hp = 3
    this.maxHp = 3
    this.invuln = 0
    this.hurtT = 0
    this.stars = 0
    this.level = 0
    this.combo = 0
    this.comboT = 0
    this.score = 0
    this.runTime = 0
    this.starList = []
    this.monsters = []
    this.moles = []
    this.fireballs = []
    this.shots = []
    this.waves = []
    this.balls = []
    this.particles = []
    this.floats = []
    this.bubbles = []
    this.starTimer = 1.2
    this.monsterTimer = 10
    this.moleTimer = 14
    this.boss = null
    this.girl = null
    this.arenaL = 0
    this.arenaR = LEVEL_W
    this.bossDefeated = false
    this.world.night = 0
    this.cam.x = 0
    this.slowmo = 1
    this.hitstop = 0
    this.levelBanner = 0
    this.input.setShootUnlocked(false)
  }

  private setScene(s: Scene) {
    this.scene = s
    this.sceneTime = 0
    this.input.consume()
    document.body.classList.toggle('playing', s === 'playing' || s === 'bossIntro')
    this.input.showControls(s === 'playing' || s === 'bossIntro')
  }

  startRun() {
    this.resetRun()
    this.setScene('playing')
    this.audio.setMusic('forest')
    this.say('player', 'Skogen sover. Jag inte.', 2.6)
  }

  /** Test hook: teleport along the level and grant stars. */
  debug = {
    warp: (x: number) => {
      this.px = x
      this.cam.x = x - this.cam.vw * 0.45
    },
    stars: (n: number) => {
      this.stars = n
      this.checkLevel()
    },
    state: () => ({ scene: this.scene, x: this.px, hp: this.hp, level: this.level, stars: this.stars, score: this.score, boss: this.boss ? { hp: this.boss.hp, state: this.boss.state } : null }),
    hurt: () => this.hurtPlayer(this.px + 1),
    damageBoss: (n: number) => this.damageBoss(n),
  }

  togglePause() {
    if (this.scene === 'playing') {
      this.setScene('paused')
      this.audio.setMusic('none')
    } else if (this.scene === 'paused') {
      this.setScene('playing')
      this.audio.setMusic(this.boss && !this.bossDefeated ? 'boss' : 'forest')
    }
  }

  /* ---------------------------------------------------------------- update */

  update(rawDt: number) {
    const input = this.input
    this.time += rawDt
    this.sceneTime += rawDt

    if (input.muteRequested) {
      this.audio.toggleMute()
      this.spawnFloat(this.cam.x + this.cam.vw / 2, this.cam.y + 30, this.audio.muted ? 'LJUD AV' : 'LJUD PÅ', '#cfd6e6', 1, true)
    }
    if (input.pauseRequested) this.togglePause()

    switch (this.scene) {
      case 'title':
        this.world.update(rawDt)
        this.cam.x = (this.time * 12) % (LEVEL_W - this.cam.vw - 200)
        this.ambientParticles(rawDt)
        this.updateParticles(rawDt)
        if (input.any && this.sceneTime > 0.4) this.startRun()
        return
      case 'paused':
        if (input.any && this.sceneTime > 0.3) this.togglePause()
        return
      case 'dead':
        this.world.update(rawDt)
        this.updateParticles(rawDt)
        this.updateFloats(rawDt)
        if (input.any && this.sceneTime > 1.2) this.startRun()
        return
      case 'win':
        this.world.update(rawDt)
        this.ambientParticles(rawDt)
        this.updateParticles(rawDt)
        this.updateFloats(rawDt)
        this.updateBubbles(rawDt)
        this.winT += rawDt
        if (input.any && this.sceneTime > 2) {
          this.setScene('title')
          this.audio.setMusic('none')
          this.resetRun()
        }
        return
      case 'bossIntro':
        this.bossIntroT += rawDt
        this.world.update(rawDt)
        this.updateParticles(rawDt)
        this.updateBubbles(rawDt)
        this.updateBossIntro(rawDt)
        return
      case 'playing':
        break
    }

    // hitstop freezes the world for a few frames after big impacts
    if (this.hitstop > 0) {
      this.hitstop -= rawDt
      this.updateShake(rawDt)
      return
    }
    let dt = rawDt * this.slowmo
    if (this.slowmo < 1) this.slowmo = Math.min(1, this.slowmo + rawDt * 1.5)
    this.runTime += dt
    this.world.update(dt)

    const steps = Math.max(1, Math.ceil(dt / DT_MAX))
    const sdt = dt / steps
    for (let i = 0; i < steps; i++) this.step(sdt)

    this.updateCamera(dt)
    this.updateShake(dt)
    this.updateParticles(dt)
    this.updateFloats(dt)
    this.updateBubbles(dt)
    this.ambientParticles(dt)
    if (this.levelBanner > 0) this.levelBanner -= dt
    this.world.night = Math.min(1, Math.max(0, this.px / BOSS_TRIGGER_X))
  }

  private step(dt: number) {
    this.updatePlayer(dt)
    this.updateSpawns(dt)
    this.updateStars(dt)
    this.updateMonsters(dt)
    this.updateMoles(dt)
    this.updateFireballs(dt)
    this.updateShots(dt)
    this.updateWaves(dt)
    this.updateBalls(dt)
    if (this.boss) this.updateBoss(dt)
    if (this.girl) this.updateGirl(dt)
    if (!this.boss && this.px >= BOSS_TRIGGER_X) this.beginBossIntro()
  }

  /* ---------------------------------------------------------------- player */

  private get speed() {
    return 78 + this.level * 7
  }
  private get jumpVel() {
    return 225 + this.level * 9
  }
  private get maxJumps() {
    return this.level >= 8 ? 3 : this.level >= 2 ? 2 : 1
  }

  private updatePlayer(dt: number) {
    const inp = this.input
    const alive = this.hp > 0
    const control = alive && this.hurtT <= 0
    let ax = 0
    if (control) {
      if (inp.held.left) ax -= 1
      if (inp.held.right) ax += 1
    }
    const target = ax * this.speed
    const accel = this.onGround ? 900 : 520
    if (this.vx < target) this.vx = Math.min(target, this.vx + accel * dt)
    else if (this.vx > target) this.vx = Math.max(target, this.vx - accel * dt)
    if (ax !== 0) this.facing = ax

    this.coyote = this.onGround ? 0.1 : Math.max(0, this.coyote - dt)
    this.jumpBuffer = Math.max(0, this.jumpBuffer - dt)
    if (control && inp.pressed.jump) this.jumpBuffer = 0.12
    if (this.jumpBuffer > 0 && control) {
      const canGroundJump = this.onGround || this.coyote > 0
      if (canGroundJump || this.jumpsLeft > 0) {
        if (!canGroundJump) {
          this.jumpsLeft--
          this.audio.doubleJump()
          this.burst(this.px, this.py - 2, 8, '#9ff7ff', 60, 0.35, 0)
        } else {
          this.audio.jump()
          this.burst(this.px, this.py, 5, '#cfd6e6', 40, 0.3, 200)
        }
        this.vy = -this.jumpVel
        this.onGround = false
        this.coyote = 0
        this.jumpBuffer = 0
      }
    }
    // variable jump height
    if (!inp.held.jump && this.vy < -80) this.vy += GRAVITY * 1.6 * dt

    this.vy += GRAVITY * dt
    if (this.vy > 420) this.vy = 420
    this.px += this.vx * dt
    this.py += this.vy * dt

    const wasAir = !this.onGround
    if (this.py >= 0) {
      this.py = 0
      if (wasAir && this.vy > 60) {
        this.audio.land()
        this.burst(this.px, 0, 4, '#8a7a9a', 30, 0.3, 150)
      }
      this.vy = 0
      this.onGround = true
      this.jumpsLeft = this.maxJumps - 1
    } else this.onGround = false

    const minX = this.arenaL + 8
    const maxX = this.arenaR - 8
    if (this.px < minX) {
      this.px = minX
      this.vx = Math.max(0, this.vx)
    }
    if (this.px > maxX) {
      this.px = maxX
      this.vx = Math.min(0, this.vx)
    }

    this.anim += dt * (Math.abs(this.vx) > 10 ? Math.abs(this.vx) / 9 : 0)
    if (this.invuln > 0) this.invuln -= dt
    if (this.hurtT > 0) this.hurtT -= dt
    if (this.shootCd > 0) this.shootCd -= dt
    if (this.comboT > 0) {
      this.comboT -= dt
      if (this.comboT <= 0) this.combo = 0
    }
    this.auraPhase += dt

    // shooting
    if (control && this.level >= 3 && inp.held.shoot && this.shootCd <= 0) this.fire()

    // run dust + mega trail
    if (this.onGround && Math.abs(this.vx) > 40 && Math.random() < dt * 18)
      this.particles.push({ x: this.px - this.facing * 4, y: 0, vx: -this.facing * 15, vy: -12 - Math.random() * 10, life: 0.35, max: 0.35, color: '#8a7a9a', size: 1, gravity: 0 })
    if (this.level >= 8 && Math.random() < dt * 30)
      this.particles.push({ x: this.px + (Math.random() - 0.5) * 8, y: this.py - 8 + (Math.random() - 0.5) * 12, vx: -this.vx * 0.2, vy: -10, life: 0.5, max: 0.5, color: Math.random() < 0.5 ? '#ffd166' : '#fff6c7', size: 1, gravity: -30, glow: true })

    // aura destroys monster stars nearby (level 7+)
    if (this.level >= 7) {
      for (const m of this.monsters) {
        if (m.dead) continue
        if (dist(m.x, m.y, this.px, this.py - 9) < 22) this.killMonster(m, 25)
      }
    }
  }

  private fire() {
    const big = this.level >= 8
    const triple = this.level >= 6
    this.shootCd = big ? 0.26 : 0.3
    const oy = this.py - 10
    const mk = (vyy: number) =>
      this.shots.push({ x: this.px + this.facing * 6, y: oy, vx: this.facing * (big ? 260 : 220), vy: vyy, dmg: big ? 2 : 1, pierce: this.level >= 4, big, dead: false, hitIds: new Set() })
    mk(0)
    if (triple) {
      mk(-70)
      mk(70)
    }
    if (big) this.audio.bigShoot()
    else this.audio.shoot()
    this.vx -= this.facing * 6
    this.burst(this.px + this.facing * 8, oy, 3, '#fff6c7', 40, 0.15, 0)
  }

  private hurtPlayer(fromX: number, amount = 1) {
    if (this.invuln > 0 || this.hp <= 0) return
    this.hp -= amount
    this.invuln = 1.4
    this.hurtT = 0.35
    this.combo = 0
    this.comboT = 0
    this.vx = (this.px < fromX ? -1 : 1) * 120
    this.vy = -150
    this.onGround = false
    this.shake = Math.max(this.shake, 5)
    this.hitstop = 0.08
    this.audio.hurt()
    this.burst(this.px, this.py - 8, 14, '#ff7b7b', 110, 0.5, 150)
    this.spawnFloat(this.px, this.py - 24, '-1 ♥', '#ff7b7b', 1)
    try {
      navigator.vibrate?.(this.hp <= 0 ? [80, 40, 160] : 50)
    } catch {
      /* unsupported */
    }
    if (this.hp <= 0) this.die()
  }

  private die() {
    this.audio.die()
    this.audio.setMusic('none')
    this.slowmo = 0.25
    this.shake = 10
    this.burst(this.px, this.py - 8, 40, '#f7f8fc', 160, 1.2, 200)
    this.burst(this.px, this.py - 8, 20, '#4db5ff', 120, 1, 100)
    this.deadT = 0
    this.saveBest()
    window.setTimeout(() => this.setScene('dead'), 900)
  }

  private saveBest() {
    if (this.score > this.best) this.best = this.score
    if (this.stars > this.bestStars) this.bestStars = this.stars
    try {
      localStorage.setItem('megastar.best', String(this.best))
      localStorage.setItem('megastar.bestStars', String(this.bestStars))
    } catch {
      /* storage may be unavailable */
    }
  }

  private gainStar(s: Star) {
    s.dead = true
    this.combo++
    this.comboT = 2.6
    const mult = Math.min(8, 1 + Math.floor((this.combo - 1) / 3))
    const value = (s.big ? 50 : 10) * mult
    this.score += value
    this.stars += s.big ? 3 : 1
    this.audio.catchStar(this.combo)
    this.burst(s.x, s.y, s.big ? 24 : 12, s.big ? '#9ff7ff' : '#ffd166', 90, 0.6, 60, true)
    this.spawnFloat(s.x, s.y - 10, mult > 1 ? `+${value} ×${mult}` : `+${value}`, s.big ? '#9ff7ff' : '#fff6c7', 1)
    this.checkLevel()
  }

  private checkLevel() {
    while (this.level < MAX_LEVEL && this.stars >= POWER_THRESHOLDS[this.level + 1]!) {
      this.level++
      this.levelUp()
    }
  }

  private levelUp() {
    const name = POWER_NAMES[this.level] ?? ''
    this.levelBanner = 2.6
    this.levelBannerText = `NIVÅ ${this.level}: ${name.toUpperCase()}`
    this.audio.powerUp()
    this.hitstop = 0.12
    this.shake = Math.max(this.shake, 3)
    this.burst(this.px, this.py - 9, 30, '#ffd166', 120, 0.9, -40, true)
    this.burst(this.px, this.py - 9, 16, '#f7f8fc', 60, 0.7, -20, true)
    if (this.level === 4 || this.level === 7) {
      this.maxHp++
      this.hp = this.maxHp
      this.audio.heal()
    } else if (this.level === 8) {
      this.hp = this.maxHp
    }
    if (this.level >= 3) this.input.setShootUnlocked(true)
    this.score += 100
  }

  /* ---------------------------------------------------------------- spawns */

  private updateSpawns(dt: number) {
    const bossFight = this.boss !== null && !this.bossDefeated
    const progress = Math.min(1, this.runTime / 150)
    this.starTimer -= dt
    if (this.starTimer <= 0) {
      this.starTimer = (bossFight ? 1.5 : 1.45 - progress * 0.75) * (0.7 + Math.random() * 0.6)
      this.spawnStar()
    }
    if (!bossFight && !this.bossDefeated) {
      this.monsterTimer -= dt
      const maxMon = this.px > 2400 ? 4 : 3
      if (this.monsterTimer <= 0 && this.px > 240) {
        this.monsterTimer = (6 - progress * 3) * (0.8 + Math.random() * 0.5)
        if (this.monsters.length < maxMon) this.spawnMonster()
      }
      this.moleTimer -= dt
      if (this.moleTimer <= 0 && this.px > 520) {
        this.moleTimer = (7.5 - progress * 3.5) * (0.8 + Math.random() * 0.5)
        if (this.moles.length < (this.px > 2000 ? 2 : 1)) this.spawnMole()
      }
    } else if (bossFight) {
      this.monsterTimer -= dt
      if (this.monsterTimer <= 0 && this.monsters.length < 2) {
        this.monsterTimer = 9
        this.spawnMonster()
      }
    }
  }

  private spawnStar() {
    const ahead = this.facing >= 0 ? 0.65 : 0.35
    let x = this.px + (Math.random() - 1 + ahead) * this.cam.vw * 0.9
    x = Math.max(this.arenaL + 12, Math.min(this.arenaR - 12, x))
    const big = Math.random() < 0.08
    const topY = -this.cam.groundY - 20
    this.starList.push({ x, y: topY, vx: (Math.random() - 0.5) * 70, vy: 70 + Math.random() * 60, big, landed: -1, trail: [], spin: Math.random() * 6, dead: false })
  }

  private spawnMonster() {
    const side = Math.random() < 0.5 ? -1 : 1
    const x = Math.max(this.arenaL + 10, Math.min(this.arenaR - 10, this.px + side * (this.cam.vw * 0.5 + 20)))
    const y = -this.cam.groundY * 0.5 - Math.random() * 40
    this.monsters.push({ x, y, vx: -side * 30, vy: 20, hp: this.px > 2200 ? 2 : 1, phase: Math.random() * 6, flash: 0, dead: false })
  }

  private spawnMole() {
    const side = Math.random() < 0.6 ? this.facing : -this.facing
    const x = Math.max(this.arenaL + 20, Math.min(this.arenaR - 20, this.px + side * (70 + Math.random() * 70)))
    this.moles.push({ x, state: 'warn', t: 0, rise: 0, shots: 0, nextShot: 0.4, hp: 2, flash: 0, mouth: 0, dead: false })
    this.audio.rumble()
  }

  /* ----------------------------------------------------------------- stars */

  private updateStars(dt: number) {
    const magnet = this.level >= 5
    for (const s of this.starList) {
      if (s.dead) continue
      if (s.landed < 0) {
        s.trail.push({ x: s.x, y: s.y })
        if (s.trail.length > 7) s.trail.shift()
        if (magnet) {
          const d = dist(s.x, s.y, this.px, this.py - 9)
          if (d < 64) {
            const k = (1 - d / 64) * 420
            s.vx += ((this.px - s.x) / d) * k * dt
            s.vy += ((this.py - 9 - s.y) / d) * k * dt
          }
        }
        s.x += s.vx * dt
        s.y += s.vy * dt
        if (s.x < this.arenaL + 6 || s.x > this.arenaR - 6) s.vx = -s.vx
        if (s.y >= -3) {
          s.y = -3
          s.landed = 0
          s.trail = []
          this.burst(s.x, -2, 6, s.big ? '#9ff7ff' : '#ffd166', 40, 0.4, 120)
        }
      } else {
        s.landed += dt
        if (s.landed > 6) {
          s.dead = true
          continue
        }
        if (magnet) {
          const d = dist(s.x, s.y, this.px, this.py - 9)
          if (d < 64) {
            s.landed = -1
            s.vx = 0
            s.vy = -40
          }
        }
      }
      s.spin += dt * 4
      const r = s.big ? 11 : 8
      if (dist(s.x, s.y, this.px, this.py - 9) < r + 6) this.gainStar(s)
    }
    this.starList = this.starList.filter((s) => !s.dead)
  }

  /* -------------------------------------------------------------- monsters */

  private updateMonsters(dt: number) {
    for (const m of this.monsters) {
      if (m.dead) continue
      m.phase += dt
      const tx = this.px
      const ty = this.py - 10
      const hoverY = -34 - Math.sin(m.phase * 1.3) * 10
      const dx = tx - m.x
      const dy = (m.y < hoverY ? hoverY : ty) - m.y
      const sp = 26 + Math.min(40, this.runTime * 0.3)
      m.vx += Math.sign(dx) * sp * dt * 2.2
      m.vy += Math.sign(dy) * 30 * dt
      m.vx = clamp(m.vx, -sp, sp)
      m.vy = clamp(m.vy, -40, 40)
      m.x += m.vx * dt
      m.y += m.vy * dt
      if (m.y > -8) m.y = -8
      if (m.flash > 0) m.flash -= dt
      // contact with player
      const d = dist(m.x, m.y, this.px, this.py - 9)
      if (d < 12) {
        if (!this.onGround && this.vy > 40 && this.py - 9 < m.y - 2) {
          this.vy = -200
          this.jumpsLeft = this.maxJumps - 1
          this.killMonster(m, 25)
        } else this.hurtPlayer(m.x)
      }
    }
    this.monsters = this.monsters.filter((m) => !m.dead)
  }

  private killMonster(m: MonsterStar, points: number) {
    m.dead = true
    this.score += points
    this.audio.enemyDie()
    this.burst(m.x, m.y, 16, '#b57ce8', 110, 0.6, 100)
    this.burst(m.x, m.y, 6, '#ff7b7b', 60, 0.4, 100)
    this.spawnFloat(m.x, m.y - 8, `+${points}`, '#b57ce8', 1)
    this.shake = Math.max(this.shake, 2)
  }

  private damageMonster(m: MonsterStar, dmg: number) {
    m.hp -= dmg
    m.flash = 0.1
    if (m.hp <= 0) this.killMonster(m, 25)
    else {
      this.audio.blip()
      this.burst(m.x, m.y, 4, '#b57ce8', 50, 0.3, 50)
    }
  }

  /* ----------------------------------------------------------------- moles */

  private updateMoles(dt: number) {
    for (const mo of this.moles) {
      if (mo.dead) continue
      mo.t += dt
      if (mo.flash > 0) mo.flash -= dt
      if (mo.mouth > 0) mo.mouth -= dt
      switch (mo.state) {
        case 'warn':
          if (Math.random() < dt * 40)
            this.particles.push({ x: mo.x + (Math.random() - 0.5) * 14, y: 0, vx: (Math.random() - 0.5) * 40, vy: -40 - Math.random() * 60, life: 0.5, max: 0.5, color: Math.random() < 0.5 ? '#5a4330' : '#3a2a22', size: 1 + Math.round(Math.random()), gravity: 300 })
          if (mo.t > 0.9) {
            mo.state = 'rise'
            mo.t = 0
            this.shake = Math.max(this.shake, 2)
          }
          break
        case 'rise':
          mo.rise = Math.min(1, mo.t / 0.35)
          if (Math.random() < dt * 30)
            this.particles.push({ x: mo.x + (Math.random() - 0.5) * 16, y: 0, vx: (Math.random() - 0.5) * 60, vy: -60 - Math.random() * 60, life: 0.5, max: 0.5, color: '#5a4330', size: 1, gravity: 300 })
          if (mo.rise >= 1) {
            mo.state = 'shoot'
            mo.t = 0
            mo.nextShot = 0.5
          }
          break
        case 'shoot': {
          mo.nextShot -= dt
          if (mo.nextShot <= 0) {
            mo.shots++
            mo.nextShot = 1.1
            mo.mouth = 0.4
            this.lobFireball(mo.x, -10)
          }
          if (mo.shots >= (this.px > 2000 ? 4 : 3) && mo.nextShot < 0.6) {
            mo.state = 'sink'
            mo.t = 0
          }
          // contact
          if (Math.abs(this.px - mo.x) < 10 && this.py > -14 * mo.rise) {
            if (!this.onGround && this.vy > 40) {
              this.vy = -210
              this.jumpsLeft = this.maxJumps - 1
              this.damageMole(mo, 2)
            } else this.hurtPlayer(mo.x)
          }
          break
        }
        case 'sink':
          mo.rise = Math.max(0, 1 - mo.t / 0.4)
          if (mo.rise <= 0) mo.dead = true
          break
      }
    }
    this.moles = this.moles.filter((m) => !m.dead)
  }

  private damageMole(mo: Mole, dmg: number) {
    if (mo.state === 'warn' || mo.state === 'sink') return
    mo.hp -= dmg
    mo.flash = 0.1
    if (mo.hp <= 0) {
      mo.dead = true
      this.score += 40
      this.audio.enemyDie()
      this.burst(mo.x, -7, 20, '#5f7140', 100, 0.6, 150)
      this.burst(mo.x, -7, 8, '#ffd166', 70, 0.5, 100)
      this.spawnFloat(mo.x, -18, '+40', '#9ff7ff', 1)
      this.shake = Math.max(this.shake, 3)
    } else this.audio.blip()
  }

  private lobFireball(x: number, y: number) {
    const dx = this.px - x
    const t = 0.9
    const vx = dx / t
    const vy = (this.py - 8 - y - 0.5 * GRAVITY * 0.6 * t * t) / t
    this.fireballs.push({ x, y, vx: clamp(vx, -160, 160), vy: clamp(vy, -260, -60), gravity: true, r: 3, life: 4, dead: false })
    this.audio.fireball()
  }

  /* -------------------------------------------------------------- projectiles */

  private updateFireballs(dt: number) {
    for (const f of this.fireballs) {
      if (f.dead) continue
      if (f.gravity) f.vy += GRAVITY * 0.6 * dt
      f.x += f.vx * dt
      f.y += f.vy * dt
      f.life -= dt
      if (Math.random() < dt * 40)
        this.particles.push({ x: f.x, y: f.y, vx: -f.vx * 0.1 + (Math.random() - 0.5) * 20, vy: -20 - Math.random() * 20, life: 0.35, max: 0.35, color: Math.random() < 0.5 ? '#ff8c42' : '#ffd166', size: 1, gravity: -40, glow: true })
      if (f.y >= -1 || f.life <= 0 || f.x < this.cam.x - 60 || f.x > this.cam.x + this.cam.vw + 60) {
        f.dead = true
        if (f.y >= -1) this.burst(f.x, -1, 10, '#ff8c42', 70, 0.4, 200, true)
        continue
      }
      if (dist(f.x, f.y, this.px, this.py - 9) < f.r + 6) {
        f.dead = true
        this.burst(f.x, f.y, 10, '#ff8c42', 80, 0.4, 100, true)
        this.hurtPlayer(f.x)
      }
    }
    this.fireballs = this.fireballs.filter((f) => !f.dead)
  }

  private updateShots(dt: number) {
    for (const s of this.shots) {
      if (s.dead) continue
      s.x += s.vx * dt
      s.y += s.vy * dt
      if (s.y > -1 || s.x < this.cam.x - 20 || s.x > this.cam.x + this.cam.vw + 20) {
        s.dead = true
        continue
      }
      if (Math.random() < dt * 25)
        this.particles.push({ x: s.x, y: s.y, vx: 0, vy: 0, life: 0.2, max: 0.2, color: '#fff6c7', size: 1, gravity: 0, glow: true })
      for (const m of this.monsters) {
        if (m.dead || s.hitIds.has(m)) continue
        if (dist(m.x, m.y, s.x, s.y) < 8) {
          s.hitIds.add(m)
          this.damageMonster(m, s.dmg)
          if (!s.pierce) s.dead = true
          break
        }
      }
      if (s.dead) continue
      for (const mo of this.moles) {
        if (mo.dead || s.hitIds.has(mo) || mo.state === 'warn' || mo.state === 'sink') continue
        if (Math.abs(mo.x - s.x) < 9 && s.y > -14 * mo.rise - 2) {
          s.hitIds.add(mo)
          this.damageMole(mo, s.dmg)
          if (!s.pierce) s.dead = true
          break
        }
      }
      if (s.dead) continue
      // shots cancel fireballs
      for (const f of this.fireballs) {
        if (f.dead) continue
        if (dist(f.x, f.y, s.x, s.y) < 6) {
          f.dead = true
          s.dead = !s.big
          this.burst(f.x, f.y, 8, '#ff8c42', 60, 0.3, 50, true)
          this.audio.blip()
          this.score += 5
          break
        }
      }
      if (s.dead) continue
      const b = this.boss
      if (b && b.state !== 'enter' && b.state !== 'defeated' && !s.hitIds.has(b)) {
        if (Math.abs(b.x - s.x) < 9 && s.y > b.y - 38 && s.y < b.y) {
          s.hitIds.add(b)
          this.damageBoss(s.dmg)
          if (!s.pierce) s.dead = true
        }
      }
    }
    this.shots = this.shots.filter((s) => !s.dead)
  }

  private updateWaves(dt: number) {
    for (const w of this.waves) {
      w.x += w.dir * 150 * dt
      w.life -= dt
      if (w.life <= 0 || w.x < this.arenaL || w.x > this.arenaR) w.dead = true
      if (Math.random() < dt * 40)
        this.particles.push({ x: w.x + (Math.random() - 0.5) * 6, y: 0, vx: (Math.random() - 0.5) * 20, vy: -40 - Math.random() * 50, life: 0.4, max: 0.4, color: Math.random() < 0.5 ? '#5a4330' : '#ff8c42', size: 1, gravity: 250 })
      if (Math.abs(w.x - this.px) < 7 && this.py > -9) this.hurtPlayer(w.x)
    }
    this.waves = this.waves.filter((w) => !w.dead)
  }

  private updateBalls(dt: number) {
    for (const b of this.balls) {
      b.vy += GRAVITY * 0.7 * dt
      b.x += b.vx * dt
      b.y += b.vy * dt
      if (b.y >= -2) {
        b.y = -2
        b.vy = -Math.abs(b.vy) * 0.55
        b.bounces++
        if (b.bounces > 3) b.dead = true
        this.burst(b.x, -1, 3, '#ffc2d6', 30, 0.3, 100)
      }
      if (b.x < this.arenaL || b.x > this.arenaR) b.dead = true
      if (dist(b.x, b.y, this.px, this.py - 9) < 9) {
        b.dead = true
        this.burst(b.x, b.y, 8, '#ff7fa8', 60, 0.4, 100)
        this.hurtPlayer(b.x)
      }
    }
    this.balls = this.balls.filter((b) => !b.dead)
  }

  /* ------------------------------------------------------------------ boss */

  private beginBossIntro() {
    this.arenaL = LEVEL_W - Math.max(340, this.cam.vw + 10)
    this.arenaR = LEVEL_W - 6
    const bx = this.arenaR - 30
    this.boss = { x: this.arenaR + 40, y: 0, vx: 0, vy: 0, hp: 40, maxHp: 40, state: 'enter', t: 0, flash: 0, facing: -1, armUp: 0, attacks: 0, idleTime: 1.2, hairPhase: 0 }
    this.girl = { x: bx + 60, y: 0, vx: 0, vy: 0, facing: -1, target: null, carrying: false, anim: 0, throwTimer: 5, giggle: 0 }
    this.monsters = []
    this.moles = []
    this.fireballs = []
    this.bossIntroT = 0
    this.vx = 0
    this.setScene('bossIntro')
    this.audio.setMusic('none')
    this.audio.bossIntro()
  }

  private updateBossIntro(dt: number) {
    const b = this.boss!
    const g = this.girl!
    const t = this.bossIntroT
    // mum walks in from the right, girl toddles behind
    const targetX = this.arenaR - 60
    if (b.x > targetX) b.x -= 40 * dt
    if (g.x > targetX + 26) g.x -= 42 * dt
    g.anim += dt * 6
    b.hairPhase += dt
    if (t > 1.6 && t - dt <= 1.6) this.say('mum', 'Skogen sover. Och du väcker den.', 2.4)
    if (t > 4.1 && t - dt <= 4.1) this.say('girl', 'Tjäna!', 1.4)
    if (t > 5.4) {
      b.state = 'idle'
      b.t = 0
      this.setScene('playing')
      this.audio.setMusic('boss')
    }
    this.updateCamera(dt)
  }

  private say(who: Bubble['who'], text: string, life: number) {
    this.bubbles = this.bubbles.filter((b) => b.who !== who)
    this.bubbles.push({ text, life, who })
  }

  private updateBubbles(dt: number) {
    for (const b of this.bubbles) b.life -= dt
    this.bubbles = this.bubbles.filter((b) => b.life > 0)
  }

  private updateBoss(dt: number) {
    const b = this.boss!
    b.t += dt
    b.hairPhase += dt
    if (b.flash > 0) b.flash -= dt
    const phase = b.hp <= b.maxHp * 0.3 ? 2 : b.hp <= b.maxHp * 0.6 ? 1 : 0
    const dxp = this.px - b.x
    if (b.state !== 'leap' && b.state !== 'defeated') b.facing = dxp < 0 ? -1 : 1

    switch (b.state) {
      case 'enter':
        break
      case 'idle': {
        // slow drift to keep some distance
        const want = Math.abs(dxp) < 70 ? -Math.sign(dxp) : Math.abs(dxp) > 150 ? Math.sign(dxp) : 0
        b.vx += (want * (28 + phase * 10) - b.vx) * Math.min(1, dt * 3)
        b.x = clamp(b.x + b.vx * dt, this.arenaL + 20, this.arenaR - 16)
        b.armUp = Math.max(0, b.armUp - dt * 4)
        if (b.t > b.idleTime) {
          b.t = 0
          b.attacks++
          const roll = Math.random()
          if (phase >= 1 && roll < 0.35) {
            b.state = 'leap'
            b.vy = -300
            b.vx = Math.sign(dxp) * clamp(Math.abs(dxp) / 0.9, 40, 180)
            this.say('mum', ['Hoppsan.', 'Pass på.', 'Nu räcker det.'][Math.floor(Math.random() * 3)]!, 1.2)
          } else {
            b.state = 'cast'
          }
        }
        break
      }
      case 'cast': {
        b.armUp = Math.min(1, b.armUp + dt * 6)
        if (b.t > 0.45 && b.t - dt <= 0.45) {
          const fan = phase === 2 ? 5 : phase === 1 ? 4 : 3
          const ox = b.x + b.facing * 10
          const oy = b.y - 34
          const ang0 = Math.atan2(this.py - 8 - oy, this.px - ox)
          const spread = 0.22
          for (let i = 0; i < fan; i++) {
            const a = ang0 + (i - (fan - 1) / 2) * spread
            const sp = 95 + phase * 18
            this.fireballs.push({ x: ox, y: oy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, gravity: false, r: 3, life: 5, dead: false })
          }
          this.audio.fireball()
          this.burst(ox, oy, 10, '#ff8c42', 60, 0.4, 0, true)
        }
        if (b.t > 1.0) {
          b.state = 'idle'
          b.t = 0
          b.idleTime = 1.6 - phase * 0.35 + Math.random() * 0.6
        }
        break
      }
      case 'leap': {
        b.vy += GRAVITY * dt
        b.x = clamp(b.x + b.vx * dt, this.arenaL + 20, this.arenaR - 16)
        b.y += b.vy * dt
        if (b.y >= 0) {
          b.y = 0
          b.vy = 0
          b.vx = 0
          b.state = 'idle'
          b.t = 0
          b.idleTime = 1.3 - phase * 0.3
          this.audio.stomp()
          this.shake = Math.max(this.shake, 7)
          this.hitstop = 0.05
          this.waves.push({ x: b.x - 10, dir: -1, life: 2.2, dead: false }, { x: b.x + 10, dir: 1, life: 2.2, dead: false })
          this.burst(b.x, 0, 18, '#5a4330', 90, 0.6, 300)
          // landing on the player hurts
          if (Math.abs(this.px - b.x) < 14 && this.py > -16) this.hurtPlayer(b.x)
        }
        break
      }
      case 'hurt':
        b.armUp = Math.max(0, b.armUp - dt * 6)
        if (b.t > 0.25) {
          b.state = 'idle'
          b.t = 0
          b.idleTime = 0.8
        }
        break
      case 'defeated':
        break
    }

    // player stomping the boss
    if (b.state !== 'defeated' && b.state !== 'enter') {
      const headY = b.y - 38
      if (Math.abs(this.px - b.x) < 11 && this.py > headY - 4 && this.py < headY + 12 && this.vy > 60 && !this.onGround) {
        this.vy = -260
        this.jumpsLeft = this.maxJumps - 1
        this.damageBoss(3)
        this.spawnFloat(b.x, headY - 10, 'STAMP!', '#ffd166', 1)
      } else if (Math.abs(this.px - b.x) < 9 && this.py > headY + 10 && b.state !== 'hurt') {
        this.hurtPlayer(b.x)
      }
    }
  }

  private damageBoss(dmg: number) {
    const b = this.boss
    if (!b || b.state === 'defeated' || b.state === 'enter') return
    b.hp -= dmg
    b.flash = 0.12
    this.audio.bossHit()
    this.burst(b.x, b.y - 20, 10, '#f5804a', 80, 0.4, 80)
    this.score += 15 * dmg
    if (b.hp <= 0) {
      b.hp = 0
      this.defeatBoss()
      return
    }
    if (b.state === 'cast' || b.state === 'idle') {
      if (Math.random() < 0.3) {
        b.state = 'hurt'
        b.t = 0
      }
    }
    if (b.hp === Math.floor(b.maxHp * 0.6) || b.hp === Math.floor(b.maxHp * 0.3)) this.say('mum', 'Jaså. Du har tränat.', 1.6)
  }

  private defeatBoss() {
    const b = this.boss!
    b.state = 'defeated'
    b.t = 0
    this.bossDefeated = true
    this.slowmo = 0.3
    this.hitstop = 0.15
    this.shake = 8
    this.fireballs = []
    this.waves = []
    this.balls = []
    this.score += 1000 + Math.max(0, Math.round((240 - this.runTime) * 5))
    this.audio.enemyDie()
    this.burst(b.x, b.y - 20, 50, '#ffd166', 160, 1.2, 100, true)
    this.burst(b.x, b.y - 20, 30, '#f7f8fc', 100, 1, 50, true)
    this.spawnFloat(b.x, b.y - 48, '+1000', '#ffd166', 2)
    this.say('mum', 'Okej. Du vinner. Läggdags, Iris.', 3.2)
    if (this.girl) {
      this.girl.target = null
      this.girl.carrying = false
    }
    this.saveBest()
    window.setTimeout(() => {
      this.say('girl', 'Natti!', 2)
      this.audio.girlGiggle()
    }, 1500)
    window.setTimeout(() => {
      this.setScene('win')
      this.audio.setMusic('victory')
      this.audio.victory()
      this.winT = 0
    }, 3400)
  }

  private updateGirl(dt: number) {
    const g = this.girl!
    const b = this.boss!
    g.anim += dt * (Math.abs(g.vx) > 5 ? 7 : 0)
    if (g.giggle > 0) g.giggle -= dt
    const spd = 44 + (b.hp <= b.maxHp * 0.6 ? 14 : 0)
    if (this.bossDefeated) {
      // toddle to mum and stop
      const want = b.x + b.facing * -14
      g.vx += ((Math.abs(want - g.x) > 4 ? Math.sign(want - g.x) * 30 : 0) - g.vx) * Math.min(1, dt * 4)
    } else if (g.carrying) {
      const d = b.x - g.x
      g.vx += (Math.sign(d) * spd - g.vx) * Math.min(1, dt * 5)
      if (Math.abs(d) < 12) {
        g.carrying = false
        b.hp = Math.min(b.maxHp, b.hp + 3)
        this.audio.heal()
        this.audio.girlGiggle()
        g.giggle = 1
        this.burst(b.x, b.y - 24, 10, '#5fd0c0', 60, 0.6, -30, true)
        this.spawnFloat(b.x, b.y - 44, '+3', '#5fd0c0', 1)
        this.say('girl', 'Tjäna!', 1)
      }
    } else {
      // chase the nearest landed star
      if (!g.target || g.target.dead || g.target.landed < 0) {
        g.target = null
        let bestD = 1e9
        for (const s of this.starList) {
          if (s.dead || s.landed < 0) continue
          const d = Math.abs(s.x - g.x)
          if (d < bestD) {
            bestD = d
            g.target = s
          }
        }
      }
      if (g.target) {
        const d = g.target.x - g.x
        g.vx += (Math.sign(d) * spd - g.vx) * Math.min(1, dt * 5)
        if (Math.abs(d) < 6) {
          g.target.dead = true
          g.target = null
          g.carrying = true
          this.audio.blip()
          this.spawnFloat(g.x, g.y - 22, 'MIN!', '#ffc2d6', 1)
        }
      } else {
        // wander around mum
        const want = b.x + Math.sin(this.time * 0.8) * 40
        g.vx += ((Math.abs(want - g.x) > 6 ? Math.sign(want - g.x) * spd * 0.6 : 0) - g.vx) * Math.min(1, dt * 3)
      }
      g.throwTimer -= dt
      if (g.throwTimer <= 0 && Math.abs(this.px - g.x) < 140) {
        g.throwTimer = 4.5 + Math.random() * 3
        const dx = this.px - g.x
        this.balls.push({ x: g.x, y: g.y - 10, vx: clamp(dx / 1.1, -110, 110), vy: -190, bounces: 0, dead: false })
        this.say('girl', 'Boll!', 1)
        this.audio.blip()
      }
    }
    if (Math.abs(g.vx) > 1) g.facing = Math.sign(g.vx)
    g.x = clamp(g.x + g.vx * dt, this.arenaL + 8, this.arenaR - 8)
    // she is a toddler: nothing hurts her, bumping just nudges both apart
    if (Math.abs(this.px - g.x) < 10 && this.py > -16) {
      const push = Math.sign(this.px - g.x) || 1
      this.px += push * 40 * dt
      g.x -= push * 20 * dt
    }
  }

  /* -------------------------------------------------------- camera and fx */

  private updateCamera(dt: number) {
    const look = this.facing * 24
    let target = this.px - this.cam.vw * 0.45 + look
    const lo = this.arenaL
    const hi = Math.max(lo, this.arenaR - this.cam.vw)
    target = clamp(target, lo, hi)
    const k = Math.min(1, dt * 5)
    this.cam.x += (target - this.cam.x) * k
  }

  private updateShake(dt: number) {
    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt * 18)
      this.cam.shakeX = (Math.random() - 0.5) * this.shake
      this.cam.shakeY = (Math.random() - 0.5) * this.shake
    } else {
      this.cam.shakeX = 0
      this.cam.shakeY = 0
    }
  }

  private burst(x: number, y: number, count: number, color: string, speed: number, life: number, gravity: number, glow = false) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2
      const s = speed * (0.3 + Math.random() * 0.7)
      this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: life * (0.5 + Math.random() * 0.5), max: life, color, size: Math.random() < 0.3 ? 2 : 1, gravity, glow })
    }
  }

  private updateParticles(dt: number) {
    for (const p of this.particles) {
      p.vy += p.gravity * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.life -= dt
      if (p.y > 0 && p.gravity > 0) {
        p.y = 0
        p.vy = -p.vy * 0.3
        p.vx *= 0.6
      }
    }
    this.particles = this.particles.filter((p) => p.life > 0)
    if (this.particles.length > 600) this.particles.splice(0, this.particles.length - 600)
  }

  private ambientParticles(dt: number) {
    // drifting leaves and dust in the camera view
    if (Math.random() < dt * 1.5) {
      const x = this.cam.x + Math.random() * this.cam.vw
      const top = -this.cam.groundY
      this.particles.push({ x, y: top, vx: 10 + Math.random() * 15, vy: 18 + Math.random() * 10, life: 9, max: 9, color: Math.random() < 0.5 ? '#6b4a2a' : '#8a5a2a', size: 2, gravity: 0 })
    }
  }

  private spawnFloat(x: number, y: number, text: string, color: string, scale: number, screenSpace = false) {
    this.floats.push({ x: screenSpace ? x : x, y, text, life: 1.1, color, scale })
  }

  private updateFloats(dt: number) {
    for (const f of this.floats) {
      f.y -= 18 * dt
      f.life -= dt
    }
    this.floats = this.floats.filter((f) => f.life > 0)
  }

  /* ------------------------------------------------------------------ draw */

  draw(ctx: CanvasRenderingContext2D) {
    const cam = this.cam
    const { vw, vh } = cam
    const groundScreenY = cam.groundY
    this.world.drawBackground(ctx, cam)

    ctx.save()
    ctx.translate(Math.round(-cam.x + cam.shakeX), Math.round(groundScreenY + cam.shakeY))
    this.world.drawMidground(ctx, cam)
    this.world.drawGround(ctx, cam)
    this.drawMoles(ctx)
    this.drawStars(ctx)
    this.drawWaves(ctx)
    if (this.boss) this.drawBoss(ctx)
    if (this.girl) this.drawGirl(ctx)
    this.drawMonsters(ctx)
    if (this.scene !== 'title') this.drawPlayer(ctx)
    this.drawShots(ctx)
    this.drawBalls(ctx)
    this.drawFireballs(ctx)
    this.drawParticles(ctx)
    this.drawFloats(ctx)
    this.drawBubbles(ctx)
    ctx.restore()

    this.world.drawOverlay(ctx, cam)
    if (this.invuln > 1.25 && this.hp > 0) {
      ctx.fillStyle = 'rgba(255,60,60,0.25)'
      ctx.fillRect(0, 0, vw, vh)
    }

    switch (this.scene) {
      case 'title':
        this.drawTitle(ctx)
        break
      case 'playing':
        this.drawHud(ctx)
        break
      case 'bossIntro':
        this.drawHud(ctx)
        this.drawBossCard(ctx)
        break
      case 'paused':
        this.drawHud(ctx)
        this.drawPaused(ctx)
        break
      case 'dead':
        this.drawDead(ctx)
        break
      case 'win':
        this.drawWin(ctx)
        break
    }
  }

  private drawPlayer(ctx: CanvasRenderingContext2D) {
    if (this.hp <= 0) return
    const blink = this.invuln > 0 && Math.floor(this.time * 20) % 2 === 0
    const px = this.px
    const py = this.py
    // aura
    if (this.level >= 1) {
      const r = 8 + this.level * 2.2 + Math.sin(this.auraPhase * 4) * 1.5
      ctx.globalAlpha = 0.05 + this.level * 0.012
      fillCircle(ctx, px, py - 9, r, this.level >= 8 ? '#ffd166' : this.level >= 5 ? '#9ff7ff' : '#4db5ff')
      ctx.globalAlpha = 1
      if (this.level >= 7) {
        ctx.globalAlpha = 0.25 + 0.1 * Math.sin(this.auraPhase * 6)
        const n = this.level >= 8 ? 6 : 4
        for (let i = 0; i < n; i++) {
          const a = this.auraPhase * 2 + (i / n) * Math.PI * 2
          const sx = px + Math.cos(a) * 20
          const sy = py - 9 + Math.sin(a) * 14
          drawSprite(ctx, this.sp.starSmall, sx - 2, sy - 2)
        }
        ctx.globalAlpha = 1
      }
    }
    // shadow
    ctx.globalAlpha = 0.35 * Math.max(0, 1 + py / 120)
    ctx.fillStyle = '#05030f'
    ctx.fillRect(Math.round(px - 5), -1, 10, 2)
    ctx.globalAlpha = 1
    if (blink) return
    let s: Sprite
    if (this.hurtT > 0) s = this.sp.hurt
    else if (!this.onGround) s = this.sp.jump
    else if (Math.abs(this.vx) > 10) s = this.sp.run[Math.floor(this.anim) % 4]!
    else s = this.sp.stand
    const bob = this.onGround && Math.abs(this.vx) < 10 ? (Math.floor(this.time * 2) % 2) : 0
    // cape at higher levels
    if (this.level >= 4) {
      const wave = Math.sin(this.time * 10) * 1.5
      ctx.fillStyle = this.level >= 8 ? '#ffd166' : '#ff8c42'
      const cx = Math.round(px - this.facing * 5)
      const cy = Math.round(py - 10 + bob)
      for (let i = 0; i < 5; i++) {
        const w = 2 + i
        ctx.fillRect(cx - (this.facing > 0 ? w : 0) + Math.round(wave * i * 0.3 * -this.facing), cy + i, w, 1)
      }
    }
    drawSprite(ctx, s, px - s.w / 2, py - s.h + bob, this.facing < 0, this.hurtT > 0.25)
  }

  private drawStars(ctx: CanvasRenderingContext2D) {
    for (const s of this.starList) {
      const spr = s.big ? this.sp.star : this.sp.star
      const col = s.big ? '#9ff7ff' : '#ffd166'
      if (s.landed < 0) {
        // comet trail
        for (let i = 0; i < s.trail.length; i++) {
          const t = s.trail[i]!
          ctx.globalAlpha = (i / s.trail.length) * 0.45
          fillCircle(ctx, t.x, t.y, 1 + (i / s.trail.length) * 2.5, col)
        }
        ctx.globalAlpha = 1
      }
      const blinkOut = s.landed > 4 && Math.floor(s.landed * 10) % 2 === 0
      if (blinkOut) continue
      const pulse = 1 + Math.sin(s.spin * 2) * 0.1
      ctx.globalAlpha = 0.2
      fillCircle(ctx, s.x, s.y, (s.big ? 9 : 6) * pulse, col)
      ctx.globalAlpha = 1
      if (s.big) {
        ctx.save()
        ctx.translate(Math.round(s.x), Math.round(s.y))
        ctx.scale(1.4, 1.4)
        ctx.globalAlpha = 1
        drawBigStar(ctx, spr)
        ctx.restore()
      } else drawSprite(ctx, spr, s.x - spr.w / 2, s.y - spr.h / 2)
    }
  }

  private drawMonsters(ctx: CanvasRenderingContext2D) {
    const s = this.sp.monster
    for (const m of this.monsters) {
      ctx.globalAlpha = 0.18
      fillCircle(ctx, m.x, m.y, 9, '#b57ce8')
      ctx.globalAlpha = 1
      const bob = Math.sin(m.phase * 5) * 1.5
      drawSprite(ctx, s, m.x - s.w / 2, m.y - s.h / 2 + bob, m.vx < 0, m.flash > 0)
      // glowing eyes
      if (m.flash <= 0) {
        ctx.fillStyle = '#ff2a2a'
        const ex = Math.round(m.x - s.w / 2)
        const ey = Math.round(m.y - s.h / 2 + bob) + 7
        ctx.fillRect(ex + 4, ey, 1, 1)
        ctx.fillRect(ex + 8, ey, 1, 1)
      }
    }
  }

  private drawMoles(ctx: CanvasRenderingContext2D) {
    for (const mo of this.moles) {
      if (mo.state === 'warn') {
        // cracked dirt mound warning
        ctx.fillStyle = '#3a2a22'
        const w = 6 + Math.round(mo.t * 10)
        ctx.fillRect(Math.round(mo.x - w / 2), -2, w, 2)
        continue
      }
      const s = mo.mouth > 0 ? this.sp.moleOpen : this.sp.moleClosed
      const h = Math.round(s.h * mo.rise)
      if (h <= 0) continue
      ctx.save()
      ctx.beginPath()
      ctx.rect(Math.round(mo.x - s.w), -h - 1, s.w * 2, h + 1)
      ctx.clip()
      drawSprite(ctx, s, mo.x - s.w / 2, -h, this.px < mo.x, mo.flash > 0)
      ctx.restore()
      ctx.fillStyle = '#3a2a22'
      ctx.fillRect(Math.round(mo.x - s.w / 2 - 2), -2, s.w + 4, 2)
    }
  }

  private drawFireballs(ctx: CanvasRenderingContext2D) {
    for (const f of this.fireballs) {
      const flick = Math.sin(this.time * 40 + f.x) * 0.5
      ctx.globalAlpha = 0.25
      fillCircle(ctx, f.x, f.y, 6 + flick, '#ff8c42')
      ctx.globalAlpha = 1
      fillCircle(ctx, f.x, f.y, 3.2, '#e63946')
      fillCircle(ctx, f.x, f.y, 2.2 + flick * 0.5, '#ff8c42')
      fillCircle(ctx, f.x - 0.5, f.y - 0.5, 1, '#fff6c7')
    }
  }

  private drawShots(ctx: CanvasRenderingContext2D) {
    for (const s of this.shots) {
      const spr = s.big ? this.sp.shotBig : this.sp.shot
      ctx.globalAlpha = 0.3
      fillCircle(ctx, s.x, s.y, s.big ? 5 : 3, '#ffd166')
      ctx.globalAlpha = 1
      drawSprite(ctx, spr, s.x - spr.w / 2, s.y - spr.h / 2)
    }
  }

  private drawWaves(ctx: CanvasRenderingContext2D) {
    for (const w of this.waves) {
      ctx.fillStyle = '#5a4330'
      ctx.fillRect(Math.round(w.x - 4), -5, 8, 5)
      ctx.fillStyle = '#ff8c42'
      ctx.fillRect(Math.round(w.x - 2), -7, 4, 3)
      ctx.fillStyle = '#ffd166'
      ctx.fillRect(Math.round(w.x - 1), -8, 2, 2)
    }
  }

  private drawBalls(ctx: CanvasRenderingContext2D) {
    for (const b of this.balls) drawSprite(ctx, this.sp.ball, b.x - 2, b.y - 2)
  }

  private drawBoss(ctx: CanvasRenderingContext2D) {
    const b = this.boss!
    const s = this.sp.mum
    const flip = b.facing > 0
    // shadow
    ctx.globalAlpha = 0.35 * Math.max(0, 1 + b.y / 150)
    ctx.fillStyle = '#05030f'
    ctx.fillRect(Math.round(b.x - 9), -1, 18, 2)
    ctx.globalAlpha = 1
    const sway = b.state === 'defeated' ? 0 : Math.round(Math.sin(b.hairPhase * 2) * 1)
    const y = b.y - s.h + (b.state === 'defeated' ? 6 : 0)
    // hair glow when casting
    if (b.armUp > 0) {
      ctx.globalAlpha = 0.25 * b.armUp
      fillCircle(ctx, b.x + (flip ? 10 : -10), b.y - 36, 7, '#ff8c42')
      ctx.globalAlpha = 1
    }
    drawSprite(ctx, s, b.x - s.w / 2 + sway * 0, y, flip, b.flash > 0)
    if (b.armUp > 0.2) {
      const arm = this.sp.mumArm
      const ax = flip ? b.x + 4 : b.x - 4 - arm.w
      drawSprite(ctx, arm, ax, y + 15 - Math.round(b.armUp * 3), flip, b.flash > 0)
      ctx.globalAlpha = 0.9
      fillCircle(ctx, flip ? b.x + 10 : b.x - 10, y + 13, 2.5, '#ffd166')
      ctx.globalAlpha = 1
    }
    if (b.state === 'defeated') {
      // little hearts drifting up
      if (Math.random() < 0.05) this.particles.push({ x: b.x + (Math.random() - 0.5) * 10, y: b.y - 40, vx: (Math.random() - 0.5) * 10, vy: -15, life: 1.5, max: 1.5, color: '#ff7fa8', size: 2, gravity: 0, glow: true })
    }
  }

  private drawGirl(ctx: CanvasRenderingContext2D) {
    const g = this.girl!
    const s = this.sp.girl[Math.floor(g.anim) % 2]!
    ctx.globalAlpha = 0.3
    ctx.fillStyle = '#05030f'
    ctx.fillRect(Math.round(g.x - 4), -1, 8, 2)
    ctx.globalAlpha = 1
    drawSprite(ctx, s, g.x - s.w / 2, g.y - s.h, g.facing > 0)
    if (g.carrying) drawSprite(ctx, this.sp.starSmall, g.x + (g.facing > 0 ? 4 : -9), g.y - 12)
    if (g.giggle > 0) {
      ctx.fillStyle = '#ff7fa8'
      const hy = g.y - s.h - 4 - (1 - g.giggle) * 8
      ctx.fillRect(Math.round(g.x - 1), Math.round(hy), 1, 1)
      ctx.fillRect(Math.round(g.x + 1), Math.round(hy), 1, 1)
      ctx.fillRect(Math.round(g.x - 1), Math.round(hy + 1), 3, 1)
      ctx.fillRect(Math.round(g.x), Math.round(hy + 2), 1, 1)
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      const a = Math.max(0, Math.min(1, p.life / p.max))
      ctx.globalAlpha = a
      if (p.glow) {
        ctx.globalAlpha = a * 0.3
        fillCircle(ctx, p.x, p.y, p.size + 1.5, p.color)
        ctx.globalAlpha = a
      }
      ctx.fillStyle = p.color
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size)
    }
    ctx.globalAlpha = 1
  }

  private drawFloats(ctx: CanvasRenderingContext2D) {
    for (const f of this.floats) {
      ctx.globalAlpha = Math.min(1, f.life * 2)
      drawText(ctx, f.text, f.x, f.y, { align: 'center', color: f.color, scale: f.scale, outline: '#0d0b16', shadow: null })
    }
    ctx.globalAlpha = 1
  }

  private drawBubbles(ctx: CanvasRenderingContext2D) {
    for (const bu of this.bubbles) {
      let x = this.px
      let y = this.py - 24
      if (bu.who === 'mum' && this.boss) {
        x = this.boss.x
        y = this.boss.y - 46
      } else if (bu.who === 'girl' && this.girl) {
        x = this.girl.x
        y = this.girl.y - 24
      }
      const maxW = Math.min(150, this.cam.vw - 24)
      const lines = wrapText(bu.text, maxW)
      const w = Math.max(...lines.map((l) => measureText(l))) + 8
      const h = lines.length * (FONT_H + 2) + 5
      let bx = Math.round(x - w / 2)
      bx = clamp(bx, this.cam.x + 4, this.cam.x + this.cam.vw - w - 4)
      const by = Math.round(y - h - 4)
      ctx.globalAlpha = Math.min(1, bu.life * 3)
      ctx.fillStyle = '#f7f8fc'
      ctx.fillRect(bx, by, w, h)
      ctx.fillStyle = '#0d0b16'
      ctx.fillRect(bx - 1, by + 1, 1, h - 2)
      ctx.fillRect(bx + w, by + 1, 1, h - 2)
      ctx.fillRect(bx + 1, by - 1, w - 2, 1)
      ctx.fillRect(bx + 1, by + h, w - 2, 1)
      // tail
      const tx = clamp(Math.round(x), bx + 4, bx + w - 6)
      ctx.fillStyle = '#f7f8fc'
      ctx.fillRect(tx, by + h, 3, 1)
      ctx.fillRect(tx + 1, by + h + 1, 1, 1)
      lines.forEach((l, i) => drawText(ctx, l, bx + 4, by + 3 + i * (FONT_H + 2), { color: '#0d0b16', shadow: null }))
      ctx.globalAlpha = 1
    }
  }

  /* ------------------------------------------------------------------- HUD */

  private drawHud(ctx: CanvasRenderingContext2D) {
    const { vw } = this.cam
    const top = 5
    // hearts
    for (let i = 0; i < this.maxHp; i++) {
      const s = i < this.hp ? this.sp.heart : this.sp.heartEmpty
      const beat = i < this.hp && this.hp === 1 ? Math.round(Math.sin(this.time * 8) * 1) : 0
      drawSprite(ctx, s, 6 + i * 9, top + 1 - beat)
    }
    // stars + power meter
    const cx = Math.round(vw / 2)
    drawSprite(ctx, this.sp.hudStar, cx - 24, top)
    drawText(ctx, String(this.stars), cx - 15, top, { color: '#fff6c7', outline: '#0d0b16', shadow: null })
    const lvlName = POWER_NAMES[this.level] ?? ''
    const next = POWER_THRESHOLDS[this.level + 1]
    const cur = POWER_THRESHOLDS[this.level] ?? 0
    const frac = next === undefined ? 1 : (this.stars - cur) / (next - cur)
    const barW = 56
    const bx = cx - barW / 2
    const by = top + 10
    ctx.fillStyle = '#0d0b16'
    ctx.fillRect(bx - 1, by - 1, barW + 2, 5)
    ctx.fillStyle = '#2b2440'
    ctx.fillRect(bx, by, barW, 3)
    ctx.fillStyle = this.level >= 8 ? '#ffd166' : '#4db5ff'
    ctx.fillRect(bx, by, Math.round(barW * clamp(frac, 0, 1)), 3)
    drawText(ctx, this.level >= 8 ? 'MEGASTAR' : `NIVÅ ${this.level} ${lvlName.toUpperCase()}`, cx, by + 6, { align: 'center', color: '#cfd6e6', outline: '#0d0b16', shadow: null })
    // score sits under the hearts; the top-right corner belongs to the pause and sound buttons
    drawText(ctx, String(this.score).padStart(6, '0'), 6, top + 10, { color: '#fff6c7', outline: '#0d0b16', shadow: null })
    if (this.combo >= 3) drawText(ctx, `KOMBO ×${this.combo}`, 6, top + 19, { color: '#ff8c42', outline: '#0d0b16', shadow: null })
    // boss bar
    const b = this.boss
    if (b && this.scene === 'playing' && !this.bossDefeated) {
      const w = Math.min(160, vw - 40)
      const x = Math.round(vw / 2 - w / 2)
      const y = by + 16
      drawText(ctx, 'MAMMA RUT', vw / 2, y, { align: 'center', color: '#ffb3a0', outline: '#0d0b16', shadow: null })
      ctx.fillStyle = '#0d0b16'
      ctx.fillRect(x - 1, y + 8, w + 2, 6)
      ctx.fillStyle = '#4a1a2a'
      ctx.fillRect(x, y + 9, w, 4)
      ctx.fillStyle = b.flash > 0 ? '#ffffff' : '#e63946'
      ctx.fillRect(x, y + 9, Math.round((w * b.hp) / b.maxHp), 4)
    }
    // level-up banner
    if (this.levelBanner > 0) {
      const a = Math.min(1, this.levelBanner, (2.6 - this.levelBanner) * 3)
      ctx.globalAlpha = a
      const y = Math.round(this.cam.vh * 0.3)
      ctx.fillStyle = 'rgba(13,11,22,0.7)'
      ctx.fillRect(0, y - 6, vw, 24)
      drawText(ctx, this.levelBannerText, vw / 2, y, { align: 'center', color: '#ffd166', outline: '#0d0b16', shadow: null, scale: vw < 300 ? 1 : 2 })
      const hint = LEVEL_HINTS[this.level] ?? ''
      drawText(ctx, hint, vw / 2, y + (vw < 300 ? 10 : 16), { align: 'center', color: '#cfd6e6', shadow: null })
      ctx.globalAlpha = 1
    }
    // early hint
    if (this.runTime < 6 && this.scene === 'playing' && !this.boss) {
      ctx.globalAlpha = Math.min(1, (6 - this.runTime) / 1.5)
      const hint = this.input.touchActive ? 'FÅNGA STJÄRNOR. HOPP TILL HÖGER.' : 'PILAR/WASD FLYTTAR. MELLANSLAG HOPPAR.'
      drawText(ctx, hint, vw / 2, this.cam.groundY - 60, { align: 'center', color: '#cfd6e6', outline: '#0d0b16', shadow: null })
      ctx.globalAlpha = 1
    }
  }

  private drawBossCard(ctx: CanvasRenderingContext2D) {
    const t = this.bossIntroT
    if (t < 1 || t > 5) return
    const a = Math.min(1, (t - 1) * 2, (5 - t) * 2)
    const { vw, vh } = this.cam
    ctx.globalAlpha = a
    const y = Math.round(vh * 0.26)
    ctx.fillStyle = 'rgba(13,11,22,0.75)'
    ctx.fillRect(0, y - 8, vw, 34)
    ctx.fillStyle = '#e63946'
    ctx.fillRect(0, y - 8, vw, 1)
    ctx.fillRect(0, y + 25, vw, 1)
    drawText(ctx, 'BOSS', vw / 2, y - 4, { align: 'center', color: '#ff7b7b', shadow: null })
    drawText(ctx, 'MAMMA RUT', vw / 2, y + 4, { align: 'center', color: '#fff6c7', outline: '#0d0b16', shadow: null, scale: vw < 300 ? 1 : 2 })
    drawText(ctx, '& LILLA IRIS, 2 ÅR', vw / 2, y + (vw < 300 ? 13 : 19), { align: 'center', color: '#ffc2d6', shadow: null })
    ctx.globalAlpha = 1
  }

  private panel(ctx: CanvasRenderingContext2D, w: number, h: number, yOff = 0): { x: number; y: number } {
    const { vw, vh } = this.cam
    const x = Math.round(vw / 2 - w / 2)
    const y = Math.round(vh / 2 - h / 2 + yOff)
    ctx.fillStyle = 'rgba(13,11,22,0.82)'
    ctx.fillRect(x, y, w, h)
    ctx.fillStyle = '#ff8c42'
    ctx.fillRect(x + 1, y, w - 2, 1)
    ctx.fillRect(x + 1, y + h - 1, w - 2, 1)
    ctx.fillRect(x, y + 1, 1, h - 2)
    ctx.fillRect(x + w - 1, y + 1, 1, h - 2)
    return { x, y }
  }

  private drawTitle(ctx: CanvasRenderingContext2D) {
    const { vw, vh } = this.cam
    ctx.fillStyle = 'rgba(5,3,15,0.35)'
    ctx.fillRect(0, 0, vw, vh)
    const big = vw >= 300 ? 4 : 3
    const ty = Math.round(vh * 0.26)
    const glow = 0.5 + 0.5 * Math.sin(this.time * 2)
    ctx.globalAlpha = 0.25 + glow * 0.2
    fillCircle(ctx, vw / 2, ty + 12, 70, '#ff8c42')
    ctx.globalAlpha = 1
    drawText(ctx, 'MEGA', vw / 2, ty - big * 8, { align: 'center', color: '#ffd166', outline: '#0d0b16', shadow: '#7a1427', scale: big })
    drawText(ctx, 'STAR', vw / 2, ty + 2, { align: 'center', color: '#ff8c42', outline: '#0d0b16', shadow: '#7a1427', scale: big })
    drawText(ctx, 'ETT PIXELSPEL FRÅN RYMDFABRIKEN', vw / 2, ty + big * 9 + 4, { align: 'center', color: '#cfd6e6', shadow: null })
    // little star orbiting the title
    const a = this.time * 1.5
    drawSprite(ctx, this.sp.starSmall, vw / 2 + Math.cos(a) * (vw * 0.3), ty + 4 + Math.sin(a) * 18)

    const pulse = Math.floor(this.time * 2) % 2 === 0
    const prompt = this.input.touchActive ? 'TRYCK FÖR ATT BÖRJA' : 'TRYCK MELLANSLAG FÖR ATT BÖRJA'
    if (pulse) drawText(ctx, prompt, vw / 2, Math.round(vh * 0.56), { align: 'center', color: '#fff6c7', outline: '#0d0b16', shadow: null })

    const narrow = vw < 300
    const lines = this.input.touchActive
      ? narrow
        ? ['< > SPRING  HOPP  SKJUT', 'FÅNGA STJÄRNOR. UNDVIK ELD.', 'HOPPA PÅ MONSTER. BLI MÄKTIG.']
        : ['< > SPRING   HOPP   SKJUT (FRÅN NIVÅ 3)', 'FÅNGA STJÄRNOR. UNDVIK ELD.', 'HOPPA PÅ MONSTER. BLI MÄKTIG.']
      : ['PILAR/WASD SPRING   MELLANSLAG HOPP   X SKJUT', 'FÅNGA STJÄRNOR. UNDVIK ELD.', 'HOPPA PÅ MONSTER. BLI MÄKTIG. P PAUSAR.']
    const rows: string[] = []
    for (const l of lines) rows.push(...wrapText(l, vw - 20))
    const blockY = Math.round(vh * 0.64)
    ctx.fillStyle = 'rgba(13,11,22,0.55)'
    ctx.fillRect(0, blockY - 5, vw, rows.length * 9 + 8)
    rows.forEach((r, i) => drawText(ctx, r, vw / 2, blockY + i * 9, { align: 'center', color: '#aeb6c8', shadow: null }))
    if (this.best > 0) drawText(ctx, `BÄSTA: ${this.best}  ★ ${this.bestStars}`, vw / 2, blockY + rows.length * 9 + 10, { align: 'center', color: '#ffd166', outline: '#0d0b16', shadow: null })
  }

  private drawPaused(ctx: CanvasRenderingContext2D) {
    const { vw, vh } = this.cam
    ctx.fillStyle = 'rgba(5,3,15,0.55)'
    ctx.fillRect(0, 0, vw, vh)
    const p = this.panel(ctx, Math.min(200, vw - 20), 60)
    drawText(ctx, 'PAUS', vw / 2, p.y + 10, { align: 'center', color: '#ffd166', scale: 2, shadow: null })
    drawText(ctx, 'TRYCK FÖR ATT FORTSÄTTA', vw / 2, p.y + 34, { align: 'center', color: '#cfd6e6', shadow: null })
    drawText(ctx, this.audio.muted ? 'LJUD AV (M)' : 'LJUD PÅ (M)', vw / 2, p.y + 46, { align: 'center', color: '#8f98ad', shadow: null })
  }

  private drawDead(ctx: CanvasRenderingContext2D) {
    const { vw, vh } = this.cam
    this.deadT += 0.016
    ctx.fillStyle = `rgba(40,5,15,${Math.min(0.7, this.sceneTime * 0.6)})`
    ctx.fillRect(0, 0, vw, vh)
    const p = this.panel(ctx, Math.min(220, vw - 16), 96)
    drawText(ctx, 'DU SLOCKNADE', vw / 2, p.y + 10, { align: 'center', color: '#ff7b7b', outline: '#0d0b16', shadow: null, scale: vw < 300 ? 1 : 2 })
    const rows: [string, string][] = [
      ['STJÄRNOR', String(this.stars)],
      ['POÄNG', String(this.score)],
      ['NIVÅ', `${this.level} ${POWER_NAMES[this.level] ?? ''}`],
      ['BÄSTA', String(this.best)],
    ]
    rows.forEach(([k, v], i) => {
      const y = p.y + 34 + i * 10
      drawText(ctx, k, p.x + 10, y, { color: '#8f98ad', shadow: null })
      drawText(ctx, v.toUpperCase(), p.x + p.x + Math.min(220, vw - 16) - p.x - 10, y, { align: 'right', color: '#fff6c7', shadow: null })
    })
    if (this.sceneTime > 1.2 && Math.floor(this.time * 2) % 2 === 0)
      drawText(ctx, 'TRYCK FÖR ATT BÖRJA OM', vw / 2, p.y + 80, { align: 'center', color: '#ffd166', shadow: null })
  }

  private drawWin(ctx: CanvasRenderingContext2D) {
    const { vw, vh } = this.cam
    ctx.fillStyle = `rgba(5,3,15,${Math.min(0.5, this.sceneTime * 0.5)})`
    ctx.fillRect(0, 0, vw, vh)
    // confetti
    if (Math.random() < 0.6)
      this.particles.push({ x: this.cam.x + Math.random() * vw, y: -this.cam.groundY, vx: (Math.random() - 0.5) * 30, vy: 30 + Math.random() * 40, life: 6, max: 6, color: ['#ffd166', '#9ff7ff', '#ff7fa8', '#f7f8fc'][Math.floor(Math.random() * 4)]!, size: 2, gravity: 10 })
    const p = this.panel(ctx, Math.min(230, vw - 16), 110)
    drawText(ctx, 'SKOGEN SOVER IGEN', vw / 2, p.y + 10, { align: 'center', color: '#ffd166', outline: '#0d0b16', shadow: null, scale: vw < 320 ? 1 : 2 })
    drawText(ctx, 'IRIS SOMNADE I TRAPPAN.', vw / 2, p.y + (vw < 320 ? 22 : 30), { align: 'center', color: '#ffc2d6', shadow: null })
    const mins = Math.floor(this.runTime / 60)
    const secs = Math.floor(this.runTime % 60)
    const rows: [string, string][] = [
      ['STJÄRNOR', String(this.stars)],
      ['POÄNG', String(this.score)],
      ['TID', `${mins}:${String(secs).padStart(2, '0')}`],
      ['BÄSTA', String(this.best)],
    ]
    const right = p.x + Math.min(230, vw - 16) - 10
    rows.forEach(([k, v], i) => {
      const y = p.y + 46 + i * 10
      drawText(ctx, k, p.x + 10, y, { color: '#8f98ad', shadow: null })
      drawText(ctx, v, right, y, { align: 'right', color: '#fff6c7', shadow: null })
    })
    if (this.sceneTime > 2 && Math.floor(this.time * 2) % 2 === 0)
      drawText(ctx, 'TRYCK FÖR TITELN', vw / 2, p.y + 94, { align: 'center', color: '#ffd166', shadow: null })
  }
}

const LEVEL_HINTS: Record<number, string> = {
  1: 'DU SPRINGER OCH HOPPAR BÄTTRE',
  2: 'HOPPA IGEN I LUFTEN',
  3: 'SKJUT MED X ELLER SKJUT-KNAPPEN',
  4: 'ETT HJÄRTA TILL. SKOTTEN GÅR IGENOM.',
  5: 'STJÄRNOR DRAS TILL DIG',
  6: 'TRE SKOTT I TAGET',
  7: 'MONSTERSTJÄRNOR BRINNER NÄRA DIG',
  8: 'TREDUBBELHOPP OCH STORA SKOTT',
}

function drawBigStar(ctx: CanvasRenderingContext2D, spr: Sprite) {
  // cyan variant drawn by tinting the yellow star
  ctx.save()
  ctx.filter = 'hue-rotate(140deg) saturate(1.2)'
  drawSprite(ctx, spr, -spr.w / 2, -spr.h / 2)
  ctx.restore()
}

function dist(ax: number, ay: number, bx: number, by: number) {
  const dx = ax - bx
  const dy = ay - by
  return Math.sqrt(dx * dx + dy * dy)
}

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v
}
