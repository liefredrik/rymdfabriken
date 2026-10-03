import './style.css'
import { Audio } from './audio'
import { Game } from './game'
import { Input } from './input'

// Virtual resolution: phones in portrait show 190 px across, landscape screens show 220 px tall.
const PORTRAIT_W = 190
const LANDSCAPE_H = 220
const MAX_WIDTH = 520

const canvas = document.getElementById('game') as HTMLCanvasElement
const overlay = document.getElementById('controls') as HTMLDivElement
const screen = canvas.getContext('2d', { alpha: false })!
const buffer = document.createElement('canvas')
const ctx = buffer.getContext('2d', { alpha: false })!

const audio = new Audio()
const input = new Input(overlay)
input.onFirstGesture = () => audio.unlock()
overlay.classList.add('active')
const game = new Game(input, audio)

let scale = 1
let vw = 320
let vh = 240

function resize() {
  const dpr = Math.min(3, window.devicePixelRatio || 1)
  const pw = Math.round(window.innerWidth * dpr)
  const ph = Math.round(window.innerHeight * dpr)
  canvas.width = pw
  canvas.height = ph
  const portrait = ph > pw
  scale = portrait ? pw / PORTRAIT_W : ph / LANDSCAPE_H
  scale = Math.max(scale, pw / MAX_WIDTH, 1)
  // Snap to quarter steps so pixels stay reasonably even.
  scale = Math.max(1, Math.round(scale * 4) / 4)
  vw = Math.ceil(pw / scale)
  vh = Math.ceil(ph / scale)
  buffer.width = vw
  buffer.height = vh
  ctx.imageSmoothingEnabled = false
  screen.imageSmoothingEnabled = false
  // In portrait the ground is lifted above the thumb controls (which take ~120 CSS px).
  const controlsPx = (120 * dpr) / scale
  const groundY = portrait ? Math.round(Math.min(vh - controlsPx - 10, vh * 0.74)) : vh - 34
  game.resize(vw, vh, groundY)
}
window.addEventListener('resize', resize)
window.visualViewport?.addEventListener('resize', resize)
resize()

/* Small DOM buttons for pause and sound, outside the pixel canvas so they are always tappable. */
function uiButton(label: string, right: number, onClick: () => void): HTMLButtonElement {
  const b = document.createElement('button')
  b.type = 'button'
  b.className = 'ui-btn'
  b.textContent = label
  b.style.cssText = `position:fixed;top:calc(8px + var(--safe-top));right:calc(${right}px + var(--safe-right));z-index:10;width:34px;height:30px;border-radius:999px;border:1px solid rgba(255,255,255,0.18);background:rgba(11,10,26,0.55);color:rgba(255,255,255,0.8);font:600 13px/1 Inter,system-ui,sans-serif;cursor:pointer;backdrop-filter:blur(8px);transition:background .2s,transform .15s;`
  b.addEventListener('pointerdown', (e) => e.stopPropagation())
  b.addEventListener('click', (e) => {
    e.stopPropagation()
    audio.unlock()
    onClick()
    b.blur()
  })
  b.addEventListener('mouseenter', () => (b.style.background = 'rgba(255,140,66,0.3)'))
  b.addEventListener('mouseleave', () => (b.style.background = 'rgba(11,10,26,0.55)'))
  b.addEventListener('focus', () => (b.style.outline = '2px solid #ff8c42'))
  b.addEventListener('blur', () => (b.style.outline = 'none'))
  document.body.appendChild(b)
  return b
}
const muteBtn = uiButton(audio.muted ? '🔇' : '🔊', 10, () => {
  const muted = audio.toggleMute()
  muteBtn.textContent = muted ? '🔇' : '🔊'
})
muteBtn.setAttribute('aria-label', 'Ljud av/på')
const pauseBtn = uiButton('II', 50, () => {
  if (game.scene === 'playing' || game.scene === 'paused') game.togglePause()
})
pauseBtn.setAttribute('aria-label', 'Paus')

document.addEventListener('visibilitychange', () => {
  if (document.hidden && game.scene === 'playing') game.togglePause()
})

let last = performance.now()
function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  input.beginFrame()
  game.update(dt)
  input.endFrame()
  game.draw(ctx)
  screen.drawImage(buffer, 0, 0, vw * scale, vh * scale)
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)

declare global {
  interface Window {
    __MEGASTAR__?: { ready: boolean; game: Game; start: () => void }
  }
}
window.__MEGASTAR__ = { ready: true, game, start: () => game.startRun() }
