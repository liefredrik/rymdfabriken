import test from 'node:test'
import assert from 'node:assert/strict'
import { Game, GROUND, ARENA, emptyInput } from '../src/games/megastar/engine.ts'
import type { Input } from '../src/games/megastar/engine.ts'

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
    g.update(1 / 120, { left: false, right: !inArena, fire: true, jump: inArena && (danger || cycle < .3) })
  }
  assert.equal(g.mode, 'won', `ended ${g.mode}, x=${g.player.x}, hp=${g.player.hp}, boss=${g.boss.hp}, stars=${g.stars}`)
  assert(g.level >= 2 && g.stars >= 20)
})
