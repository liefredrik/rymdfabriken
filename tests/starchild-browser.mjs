import { chromium } from '../paramotor/node_modules/@playwright/test/index.mjs'
import { mkdir } from 'node:fs/promises'
import assert from 'node:assert/strict'

await mkdir('test-results', { recursive: true })
const base = process.argv[2] || process.env.STARCHILD_URL || 'http://127.0.0.1:5193'
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const errors = []
const observe = page => { page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !m.text().includes('net::ERR')) errors.push(m.text()) }) }
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); observe(page)
  await page.goto(base + '/starchild?qa'); await page.getByRole('button', { name: 'Fånga natten' }).waitFor(); await page.waitForTimeout(900)
  await page.locator('.child-stage').screenshot({ path: 'test-results/starchild-title.png' })
  await page.screenshot({ path: 'test-results/starchild-page.png', fullPage: true })
  const nav = await page.getByRole('navigation', { name: 'Huvudmeny' }).boundingBox()
  for (const link of await page.getByRole('navigation', { name: 'Huvudmeny' }).getByRole('link').all()) {
    const box = await link.boundingBox(); if (box) assert(box.x >= nav.x && box.x + box.width <= nav.x + nav.width, 'desktop navigation fits')
  }
  await page.getByRole('button', { name: 'Hur spelar man?' }).click(); await page.getByRole('dialog').waitFor()
  await page.getByRole('button', { name: 'Jag är redo' }).click()
  assert.equal(await page.locator('.child-stage').getAttribute('data-mode'), 'playing')
  await page.keyboard.down('d'); await page.keyboard.down('x'); await page.waitForTimeout(5000); await page.keyboard.up('d'); await page.keyboard.up('x')
  assert(Number((await page.locator('.child-star-count').innerText()).match(/\d+/)[0]) > 0, 'real keyboard movement collects stars')
  await page.keyboard.down('Space'); await page.waitForTimeout(180); await page.keyboard.up('Space'); await page.waitForTimeout(90); await page.keyboard.down('Space'); await page.waitForTimeout(150); await page.keyboard.up('Space')
  await page.locator('.child-stage').screenshot({ path: 'test-results/starchild-desktop.png' })
  await page.getByRole('button', { name: 'Pausa spelet' }).click(); assert.equal(await page.locator('.child-stage').getAttribute('data-mode'), 'paused')
  await page.getByRole('button', { name: 'Fortsätt', exact: true }).click()
  await page.evaluate(() => window.dispatchEvent(new Event('blur'))); await page.getByRole('dialog').waitFor(); assert.equal(await page.locator('.child-stage').getAttribute('data-mode'), 'paused')
  await page.getByRole('button', { name: 'Börja om', exact: true }).click(); assert((await page.locator('.child-star-count').innerText()).includes('00'))
  await page.getByRole('button', { name: 'Spela i storbild' }).click(); const fullscreen = await page.locator('.child-stage').boundingBox(); assert.equal(fullscreen.y, 0); assert.equal(fullscreen.height, 1000)
  await page.getByRole('button', { name: 'Lämna storbild' }).click()
  await page.locator('.child-stage').focus(); await page.keyboard.press('Shift'); await page.waitForTimeout(100)
  if (await page.evaluate(() => !!window.starChildQA)) assert(await page.evaluate(() => window.starChildQA.game().player.dashCooldown > 1))
  await page.getByRole('button', { name: 'Stäng av spelljud' }).click()
  assert.equal(await page.getByRole('button', { name: 'Slå på spelljud' }).getAttribute('aria-pressed'), 'false')
  // Validate dramatic states using dev-only fixtures; normal completion is separately tested through ordinary model inputs.
  if (await page.evaluate(() => !!window.starChildQA)) {
    await page.evaluate(() => { const g = window.starChildQA.game(); g.player.x = 4100; g.player.hp = 5; for (const star of g.collectibles.slice(0, 38)) g.collect(star) }); await page.waitForTimeout(900)
    await page.locator('.child-stage').screenshot({ path: 'test-results/starchild-boss.png' })
    await page.evaluate(() => { const g = window.starChildQA.game(); g.boss.time = 4; g.boss.hp = 1 }); await page.waitForTimeout(80)
    await page.evaluate(() => { const g = window.starChildQA.game(); g.fire(g.boss.x, g.boss.y - 20, 0, 0, true, 2) }); await page.waitForFunction(() => document.querySelector('.child-stage').dataset.mode === 'won')
    await page.getByText('En stjärna till morgonen.', { exact: true }).first().waitFor(); await page.locator('.child-stage').screenshot({ path: 'test-results/starchild-victory.png' })
  }
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 })
  const mobile = await context.newPage(); observe(mobile)
  await mobile.goto(base + '/starchild?qa'); await mobile.getByRole('button', { name: 'Fånga natten' }).waitFor(); await mobile.waitForTimeout(700)
  assert(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal overflow at 390px')
  await mobile.locator('.child-stage').screenshot({ path: 'test-results/starchild-mobile-title.png' })
  await mobile.getByRole('button', { name: 'Fånga natten' }).tap(); await mobile.getByRole('button', { name: 'Spela i storbild' }).tap()
  const cdp = await context.newCDPSession(mobile)
  const point = async (name, id) => { const r = await mobile.getByRole('button', { name, exact: true }).boundingBox(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, id } }
  const right = await point('Gå höger', 1), fire = await point('Skjut stjärnljus', 2), jump = await point('Hoppa', 3)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [right, fire, jump] }); await mobile.waitForTimeout(250)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [jump] }); await mobile.waitForTimeout(4700)
  assert.equal(await mobile.locator('.child-stage').getAttribute('data-mode'), 'playing')
  assert(Number((await mobile.locator('.child-star-count').innerText()).match(/\d+/)[0]) > 0)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] }); await mobile.waitForTimeout(300)
  if (await mobile.evaluate(() => !!window.starChildQA)) {
    const x = await mobile.evaluate(() => window.starChildQA.game().player.x)
    await mobile.waitForTimeout(500)
    assert(Math.abs(await mobile.evaluate(() => window.starChildQA.game().player.x) - x) < 3, 'cancelled fingers stop movement')
    await mobile.getByRole('button', { name: 'Ljusrusning', exact: true }).tap(); await mobile.waitForTimeout(80)
    assert(await mobile.evaluate(() => window.starChildQA.game().player.dashCooldown > 1), 'touch dash fires')
  }
  await mobile.locator('.child-stage').screenshot({ path: 'test-results/starchild-mobile.png' })
  await mobile.getByRole('button', { name: 'Pausa spelet' }).tap(); await mobile.getByRole('button', { name: 'Fortsätt', exact: true }).tap()
  // A real fireball ends a one-heart run, and restart restores all gameplay state.
  if (await mobile.evaluate(() => !!window.starChildQA)) {
    await mobile.evaluate(() => { const g = window.starChildQA.game(); g.player.hp = 1; g.player.invulnerable = 0; g.player.dash = 0; g.fire(g.player.x, g.player.y - 14, 0, 0, false) })
    await mobile.getByRole('button', { name: 'En natt till' }).waitFor()
    await mobile.locator('.child-stage').screenshot({ path: 'test-results/starchild-defeat.png' })
    await mobile.getByRole('button', { name: 'En natt till' }).tap()
    assert(await mobile.evaluate(() => { const g = window.starChildQA.game(); return g.player.hp === 5 && g.stars === 0 && g.relics.every(r => !r.taken) && !g.boss.active }))
  }
  await mobile.setViewportSize({ width: 844, height: 390 }); await mobile.waitForTimeout(400); await mobile.locator('.child-stage').screenshot({ path: 'test-results/starchild-landscape.png' })
  await mobile.getByRole('button', { name: 'Lämna storbild' }).tap(); await mobile.getByRole('button', { name: 'Pausa spelet' }).tap()
  await mobile.getByRole('button', { name: 'Fortsätt', exact: true }).tap()
  await mobile.goto(base + '/'); await mobile.getByRole('button', { name: 'Öppna meny' }).tap(); await mobile.locator('#mobile-menu').getByRole('link', { name: /StarChild/ }).tap(); await mobile.getByRole('button', { name: 'Fånga natten' }).waitFor()
  await mobile.goto(base + '/universum'); await mobile.getByRole('heading').first().waitFor()
  await page.reload(); await page.getByRole('button', { name: 'Slå på spelljud' }).waitFor()
  const light = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' }); observe(light)
  await light.addInitScript(() => localStorage.setItem('rf-theme', 'light'))
  await light.goto(base + '/starchild'); await light.getByRole('button', { name: 'Fånga natten' }).waitFor()
  assert(await light.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  assert(await light.evaluate(() => !document.documentElement.classList.contains('dark')))
  await light.screenshot({ path: 'test-results/starchild-light-reduced.png', fullPage: true })
  assert.deepEqual(errors, [], 'no JS runtime errors')
  console.log(JSON.stringify({ result: 'PASS', checks: ['route', 'title and guide', 'keyboard movement/shooting/jumping', 'star collection', 'pause/resume', 'blur pause', 'restart', 'expanded play', '390px layout', 'three simultaneous touches', 'independent release/cancel', 'landscape', 'navigation and existing route'], errors }, null, 2))
} finally { await browser.close() }
