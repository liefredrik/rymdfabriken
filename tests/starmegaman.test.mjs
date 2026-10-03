import test from 'node:test'
import assert from 'node:assert/strict'
import { Night, FLOOR, GATE, freshControls } from '../src/games/starmegaman/model.ts'

function advance(game, seconds, controls = freshControls()) {
  for (let i = 0; i < Math.round(seconds * 60); i++) game.update(1 / 60, controls)
}
test('title and pause freeze simulation; resume advances', () => {
  const game = new Night(); advance(game, 2, { ...freshControls(), right: true }); assert.equal(game.player.x, 64)
  game.start(); advance(game, 1, { ...freshControls(), right: true }); assert.ok(game.player.x > 140)
  game.pause(); const before = JSON.stringify(game); advance(game, 2); assert.equal(JSON.stringify(game), before)
  game.resume(); advance(game, 1); assert.ok(game.elapsed > 1.9)
})
test('double jump requires release, third jump is rejected, landing resets it', () => {
  const game = new Night(); game.start()
  const input = { ...freshControls(), jump: true }; advance(game, .1, input); assert.equal(game.player.jumps, 1)
  advance(game, .1, input); assert.equal(game.player.jumps, 1)
  advance(game, .02); advance(game, .02, input); assert.equal(game.player.jumps, 2)
  advance(game, .08); const vy = game.player.vy; advance(game, .02, input)
  assert.equal(game.player.jumps, 2); assert.ok(game.player.vy > vy)
  advance(game, 2); assert.equal(game.player.y, FLOOR); assert.equal(game.player.jumps, 0)
})
test('one-way platforms catch falling player and permit upward passage', () => {
  const game = new Night(); game.start(); game.enemies = []
  const platform = game.platforms[0]; game.player.x = platform.x + 25; game.player.y = platform.y - 12; game.player.vy = 40
  advance(game, .3); assert.equal(game.player.y, platform.y); assert.equal(game.player.grounded, true)
  game.player.y = platform.y + 10; game.player.vy = -180; game.player.grounded = false
  advance(game, .1, { ...freshControls(), jump: true }); assert.ok(game.player.y < platform.y)
})
test('star upgrades heal, increase firepower, and collectibles cannot be counted twice', () => {
  const game = new Night(); game.start(); game.player.health = 2
  const pickup = { x: 64, y: 238, value: 10, collected: false }; game.collect(pickup); game.collect(pickup)
  assert.equal(game.stars, 10); assert.equal(game.power, 1); assert.equal(game.player.health, 3)
  game.collect({ ...pickup, value: 35, collected: false }); assert.equal(game.power, 3)
  game.update(1 / 60, { ...freshControls(), fire: true }); assert.equal(game.bolts.length, 3); assert.ok(game.bolts.every(b => b.damage === 2))
})
test('fireballs hurt once during immunity and five separate hits end the run', () => {
  const game = new Night(); game.start(); game.projectile(64, FLOOR - 14, 0, 0, false)
  game.update(1 / 60, freshControls()); assert.equal(game.player.health, 4)
  game.hurt(100); assert.equal(game.player.health, 4)
  for (let i = 0; i < 4; i++) { game.player.immune = 0; game.hurt(100) }
  assert.equal(game.phase, 'lost'); assert.equal(game.player.health, 0)
  const x = game.player.x; advance(game, 1, { ...freshControls(), right: true }); assert.equal(game.player.x, x)
  const restarted = new Night(); assert.equal(restarted.stars, 0); assert.equal(restarted.player.health, 5); assert.equal(restarted.boss.active, false)
})
test('buried roots awaken near player, emerge, and fire hostile shots', () => {
  const game = new Night(); game.start(); const root = game.enemies.find(e => e.kind === 'root')
  game.player.x = root.x - 120; advance(game, .02); assert.equal(root.awake, true); assert.ok(root.y > FLOOR)
  advance(game, 2); assert.equal(root.y, FLOOR); assert.ok(game.bolts.some(b => !b.friendly))
})
test('false stars reveal themselves only at close range', () => {
  const game = new Night(); game.start(); const enemy = game.enemies.find(e => e.kind === 'star')
  game.player.x = enemy.x - 100; advance(game, .02); assert.equal(enemy.awake, false)
  game.player.x = enemy.x - 55; advance(game, .02); assert.equal(enemy.awake, true)
})
test('comets award three stars and spawn ahead of the player', () => {
  const game = new Night(); game.start(); advance(game, 8.1)
  const comet = game.pickups.find(p => p.value === 3); assert.ok(comet); assert.ok(comet.x > game.player.x)
  game.collect(comet); assert.equal(game.stars, 3)
})
test('boss arena locks, bubbles block damage, openings permit victory', () => {
  const game = new Night(); game.start(); game.player.x = GATE + 1; game.update(1 / 60, freshControls()); assert.equal(game.boss.active, true)
  game.player.x = GATE - 100; game.update(1 / 60, freshControls()); assert.equal(game.player.x, GATE - 70)
  game.boss.age = 6; game.boss.health = 2
  game.projectile(game.boss.x, game.boss.y - 25, 0, 0, true); game.update(1 / 60, freshControls()); assert.equal(game.boss.health, 2)
  game.boss.age = 8; game.power = 3
  game.projectile(game.boss.x, game.boss.y - 25, 0, 0, true); game.update(1 / 60, freshControls()); assert.equal(game.phase, 'won'); assert.equal(game.boss.health, 0)
})
test('a full run can be won with normal movement, collection, jumping and shooting', () => {
  const game = new Night(); game.start()
  for (let frame = 0; frame < 60 * 180 && game.phase === 'playing'; frame++) {
    const p = game.player, boss = game.boss
    const right = boss.active ? p.x < boss.x - 130 : true
    const left = boss.active && p.x > boss.x - 110
    const jump = frame % 70 < 24 || frame % 70 >= 32 && frame % 70 < 45
    game.update(1 / 60, { right, left, jump, fire: true })
  }
  assert.equal(game.phase, 'won', `Run ended ${game.phase}, x=${game.player.x}, stars=${game.stars}, health=${game.player.health}, boss=${game.boss.health}`)
})
