const base = process.env.STARMEGAMAN_URL || 'http://127.0.0.1:5187'
import { chromium } from '../paramotor/node_modules/@playwright/test/index.mjs'
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
await mkdir('test-results/starmegaman', { recursive: true })
const browser = await chromium.launch({ channel: 'msedge', headless: true })
try {
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } })
const errors = []; page.on('pageerror', error => errors.push(error.message))
await page.goto(base + '/starmegaman')
await page.getByRole('button', { name: 'Ta nattskiftet' }).waitFor(); await page.waitForTimeout(700)
await page.clock.install({ time: new Date('2026-10-03T18:00:00Z') })
await page.clock.pauseAt(new Date('2026-10-03T18:00:01Z'))
await page.getByRole('button', { name: 'Ta nattskiftet' }).click()
await page.keyboard.down('ArrowRight'); await page.keyboard.down('KeyX')
let bossCaptured = false
async function advance(ms) {
  for (let left = ms; left > 0; left -= 100) {
    if (await page.locator('.smm-boss').count()) {
      const progress = await page.locator('.smm-journey i').evaluate(element => parseFloat(element.style.width))
      if (progress > 93.5) await page.keyboard.up('ArrowRight')
      else if (progress < 93.1) await page.keyboard.down('ArrowRight')
    }
    await page.clock.runFor(Math.min(100, left))
  }
}
for (let cycle = 0; cycle < 130; cycle++) {
  await page.keyboard.down('Space'); await advance(400); await page.keyboard.up('Space'); await advance(133)
  await page.keyboard.down('Space'); await advance(217); await page.keyboard.up('Space'); await advance(417)
  if (await page.locator('.smm-boss').count()) {
    if (!bossCaptured) { await page.locator('.smm-game').screenshot({ path: 'test-results/starmegaman/boss.png' }); bossCaptured = true }
  }
  if (await page.getByRole('button', { name: 'En natt till' }).count()) break
}
await page.keyboard.up('KeyX'); await page.keyboard.up('ArrowRight')
await page.locator('.smm-game').screenshot({ path: 'test-results/starmegaman/ending.png' })
const ending = await page.locator('.smm-dialog h2').textContent()
assert.equal(ending, 'Du gav skogen stjärnorna tillbaka.', `Expected victory, got ${ending}`)
await page.getByRole('button', { name: 'En natt till' }).click()
assert.equal(await page.locator('.smm-score span').textContent(), '000')
await page.keyboard.down('ArrowRight')
for (let i = 0; i < 120; i++) { await page.clock.runFor(1000); if (await page.getByRole('button', { name: 'En natt till' }).count()) break }
await page.keyboard.up('ArrowRight')
assert.equal(await page.locator('.smm-dialog h2').textContent(), 'Natten vann. Den här gången.')
await page.getByRole('button', { name: 'En natt till' }).click()
await page.clock.runFor(120)
assert.equal(await page.locator('.smm-hearts').getAttribute('aria-label'), '5 av 5 hjärtan')
assert.equal(await page.locator('.smm-score span').textContent(), '000')
assert.ok(Number(await page.locator('.smm-record strong').textContent()) > 45)
await page.keyboard.press('KeyP'); await page.clock.runFor(150)
await page.getByRole('button', { name: 'Byt till ljust läge' }).click()
await page.clock.runFor(300)
assert.equal(await page.locator('html').evaluate(element => element.classList.contains('dark')), false)
await page.locator('.smm-game').screenshot({ path: 'test-results/starmegaman/restarted.png' })
assert.deepEqual(errors, [])
console.log('PASS: full browser journey to boss, victory, replay, death, fresh five-heart restart, retained best score; no runtime errors.')
} finally { await browser.close() }
