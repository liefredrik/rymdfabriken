import { chromium } from '../paramotor/node_modules/@playwright/test/index.mjs'
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'

// QA access only reads the simulation. Every action goes through real keyboard events.
const base = process.env.STARCHILD_URL || 'http://127.0.0.1:5193'
const browser = await chromium.launch({ channel: 'chrome', headless: true })
await mkdir('test-results', { recursive: true })
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const errors = []; page.on('pageerror', e => errors.push(e.message))
  await page.goto(`${base}/starchild?qa`)
  await page.getByRole('button', { name: 'Fånga natten' }).click()
  await page.keyboard.down('d'); await page.keyboard.down('x')
  let moving = true, jumping = false, state, previousZone = -1
  const deadline = Date.now() + 180000
  while (Date.now() < deadline) {
    state = await page.evaluate(() => {
      const g = window.starChildQA.game(), p = g.player
      return { mode: g.mode, x: p.x, hp: p.hp, time: g.time, stars: g.stars, level: g.level, zone: g.zone, boss: g.boss.hp,
        danger: g.shots.some(s => !s.friendly && Math.abs(s.x - p.x) < 85 && Math.abs(s.y - (p.y - 14)) < 32) }
    })
    if (state.mode !== 'playing') break
    if (state.zone !== previousZone) { previousZone = state.zone; await page.locator('.child-stage').screenshot({ path: `test-results/starchild-journey-${state.zone}.png` }) }
    const arena = state.x > 4090
    if (moving && arena) { await page.keyboard.up('d'); moving = false }
    const jump = arena && (state.danger || state.time % 1.8 < .3)
    if (jump !== jumping) { await page.keyboard[jump ? 'down' : 'up']('Space'); jumping = jump }
    await page.waitForTimeout(45)
  }
  await page.keyboard.up('x'); await page.keyboard.up('Space'); await page.keyboard.up('d')
  await page.waitForTimeout(150)
  await page.locator('.child-stage').screenshot({ path: 'test-results/starchild-journey-result.png' })
  assert.equal(state.mode, 'won', JSON.stringify(state))
  assert.deepEqual(errors, [])
  console.log(JSON.stringify({ result: 'PASS', input: 'real keyboard events, no game-state writes', ...state }, null, 2))
} finally { await browser.close() }
