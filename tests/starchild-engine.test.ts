import test from 'node:test'
import assert from 'node:assert/strict'
import { Game, GROUND, ARENA, emptyInput } from '../src/games/starchild/engine.ts'
import type { Input } from '../src/games/starchild/engine.ts'

function advance(g: Game, seconds: number, input: Partial<Input> = {}) { for (let i = 0; i < seconds * 120; i++) g.update(1 / 120, { ...emptyInput(), ...input }) }
test('movement, landing and double jump work; holding jump never repeats indefinitely', () => {
  const g = new Game(); g.start(); advance(g, 1, { right: true }); assert(g.player.x > 150)
  advance(g, .2, { jump: true }); const first = g.player.y; assert(first < GROUND - 20)
  advance(g, .05); advance(g, .15, { jump: true }); assert(g.player.y < first - 10 && g.player.jumps === 2)
  advance(g, 2, { jump: true }); assert(g.player.grounded && g.player.jumps === 0)
})
test('power tiers improve fire and heal one heart; collected stars cannot be counted twice', () => {
  const g = new Game(); g.start(); g.player.hp = 2
  for (let i = 0; i < 38; i++) g.collect(g.collectibles[i])
  assert.equal(g.level, 3); assert.equal(g.player.hp, 5); assert.equal(g.stars, 38)
  g.collect(g.collectibles[0]); assert.equal(g.stars, 38)
  advance(g, .01, { fire: true }); assert.equal(g.shots.length, 3); assert(g.shots.every(s => s.power === 2))
})
test('fireballs damage with an invulnerability window, death stops play and restart is fresh', () => {
  const g = new Game(); g.start(); g.fire(g.player.x, g.player.y - 14, 0, 0, false)
  advance(g, .01); assert.equal(g.player.hp, 4)
  g.hurt(100); assert.equal(g.player.hp, 4)
  for (let i = 0; i < 4; i++) { g.player.invulnerable = 0; g.hurt(100) }
  assert.equal(g.mode, 'dead'); const x = g.player.x; advance(g, 1, { right: true }); assert.equal(g.player.x, x)
  const fresh = new Game(); fresh.start(); assert.equal(fresh.player.hp, 5); assert.equal(fresh.stars, 0); assert.equal(fresh.player.x, 70)
})
test('roots emerge nearby and mimics reveal themselves instead of becoming collectibles', () => {
  const g = new Game(); g.start()
  g.collectibles = []
  const root = g.enemies.find(e => e.type === 'root')!, mimic = g.enemies.find(e => e.type === 'mimic')!
  g.player.x = root.x - 130; advance(g, .1); assert(root.awake && root.y > GROUND)
  g.player.x = mimic.x - 45; advance(g, .1); assert(mimic.awake); assert.equal(g.stars, 0)
})
test('boss shield blocks shots, open phases take damage and final hit wins', () => {
  const g = new Game(); g.start(); g.player.x = ARENA + 4; advance(g, .01); assert(g.boss.active)
  g.boss.time = 1; g.fire(g.boss.x, g.boss.y - 20, 0, 0, true, 10); advance(g, .01); assert.equal(g.boss.hp, g.boss.max)
  g.boss.time = 4; advance(g, .01); g.fire(g.boss.x, g.boss.y - 20, 0, 0, true, g.boss.max - 1); advance(g, .01); assert.equal(g.boss.hp, 1)
  g.fire(g.boss.x, g.boss.y - 20, 0, 0, true, 2); advance(g, .01); assert.equal(g.mode, 'won')
})
test('pause freezes time, position and hazards', () => {
  const g = new Game(); g.start(); advance(g, 1, { right: true }); g.pause()
  const state = JSON.stringify(g); advance(g, 3, { right: true, fire: true }); assert.equal(JSON.stringify(g), state)
  g.resume(); advance(g, .1, { right: true }); assert(g.time > 1)
})
test('a complete run can be won through ordinary controls, without state changes', () => {
  const g = new Game(); g.start()
  for (let i = 0; i < 180 * 120 && g.mode === 'playing'; i++) {
    const inArena = g.player.x > ARENA + 110
    const cycle = i / 120 % 1.8
    const danger = g.shots.some(s => !s.friendly && Math.abs(s.x - g.player.x) < 70 && Math.abs(s.y - (g.player.y - 14)) < 30)
    g.update(1 / 120, { left: false, right: !inArena, fire: true, dash: false, jump: inArena && (danger || cycle < .3) })
  }
  assert.equal(g.mode, 'won', `ended ${g.mode}, x=${g.player.x}, hp=${g.player.hp}, boss=${g.boss.hp}, stars=${g.stars}`)
  assert(g.level >= 2 && g.stars >= 20)
})

test('dash reflects a fireball, protects the pilot and must recharge before another use', () => {
  const g = new Game(); g.start()
  g.fire(g.player.x + 15, g.player.y - 14, -90, 0, false)
  advance(g, .08, { dash: true })
  assert.equal(g.player.hp, 5); assert.equal(g.reflected, 1)
  assert(g.shots.some(s => s.friendly && s.power === 4 && s.vx > 0))
  advance(g, .4); advance(g, .05, { dash: true })
  assert.equal(g.player.dash, 0, 'early retrigger is ignored')
  advance(g, 2); advance(g, .01, { dash: true })
  assert(g.player.dash > 0)
})

test('comets fall through the sky, land, give three stars and eventually expire', () => {
  const g = new Game(); g.start(); g.cometTimer = 0
  advance(g, .01)
  const comet = g.collectibles.find(s => s.comet)!
  assert(comet.falling && comet.y < GROUND - 100)
  const y = comet.y; advance(g, .5); assert(comet.y > y)
  advance(g, 2); assert(!comet.falling && comet.y === GROUND - 20)
  const before = g.stars; g.collect(comet); assert.equal(g.stars, before + 3); assert.equal(g.comets, 1)
  g.cometTimer = 0; advance(g, .01); const fading = g.collectibles.find(s => s.comet)!
  advance(g, 13); assert(fading.taken); assert(!g.collectibles.includes(fading))
})

test('all three moon shards are reachable by moving and double jumping from their branches', () => {
  for (let index = 0; index < 3; index++) {
    const g = new Game(); g.start()
    const relic = g.relics[index]
    // Place at the lower branch to isolate each optional climbing challenge.
    const lower = g.platforms.find(p => p.x < relic.x && p.x + p.w > relic.x - 95 && p.y === 170)!
    assert(lower)
    g.player.x = lower.x + lower.w - 12; g.player.y = lower.y; g.player.hp = 3
    advance(g, .24, { right: true, jump: true }); advance(g, .01)
    advance(g, .23, { right: true, jump: true }); advance(g, .18)
    assert(relic.taken, `shard ${index + 1}, pilot ${g.player.x}, ${g.player.y}`)
    assert.equal(g.player.hp, 4)
    assert.equal(g.relics.filter(r => r.taken).length, 1)
  }
})

test('boss ground-fire attack is telegraphed and her second phase adds a spread', () => {
  const g = new Game(); g.start(); g.player.x = ARENA + 4
  advance(g, 5.1); assert(g.boss.warning > 0)
  advance(g, 1); assert(g.shots.some(s => !s.friendly && s.y === GROUND - 8))
  g.boss.hp = 80; g.boss.time = 3; g.boss.cooldown = 0; g.shots = []
  advance(g, .01); assert.equal(g.boss.phase, 2)
  assert.equal(g.shots.filter(s => !s.friendly).length, 3)
})

test('death cannot be replaced by victory from a later collision in the same frame', () => {
  const g = new Game(); g.start(); g.player.x = ARENA + 4
  advance(g, .01); g.player.hp = 1; g.boss.hp = 1; g.boss.time = 4
  g.fire(g.player.x, g.player.y - 14, 0, 0, false)
  g.fire(g.boss.x, g.boss.y - 20, 0, 0, true, 10)
  advance(g, .01); assert.equal(g.mode, 'dead')
})
