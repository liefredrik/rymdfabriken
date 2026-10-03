// Keyboard and multi-touch input. Touch buttons are DOM elements so they stay crisp and
// reliable at any scale; hit-testing is done per pointer so a thumb can slide between ◀ and ▶.

export type Button = 'left' | 'right' | 'jump' | 'shoot'

type Held = Record<Button, boolean>

const KEYMAP: Record<string, Button | 'pause' | 'mute' | 'start'> = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'jump',
  KeyW: 'jump',
  Space: 'jump',
  KeyZ: 'jump',
  KeyK: 'jump',
  KeyX: 'shoot',
  KeyJ: 'shoot',
  ShiftLeft: 'shoot',
  ShiftRight: 'shoot',
  ControlLeft: 'shoot',
  KeyL: 'shoot',
  Enter: 'start',
  KeyP: 'pause',
  Escape: 'pause',
  KeyM: 'mute',
}

export class Input {
  held: Held = { left: false, right: false, jump: false, shoot: false }
  private keyHeld: Held = { left: false, right: false, jump: false, shoot: false }
  private touchHeld: Held = { left: false, right: false, jump: false, shoot: false }
  private prev: Held = { left: false, right: false, jump: false, shoot: false }
  pressed: Held = { left: false, right: false, jump: false, shoot: false }
  /** Any key/tap this frame — used by menus. */
  any = false
  pauseRequested = false
  muteRequested = false
  startRequested = false
  touchActive = false
  /** Called when the user first interacts (needed to unlock audio). */
  onFirstGesture: (() => void) | null = null
  private gestured = false

  private buttons = new Map<Button, HTMLDivElement>()
  private pointers = new Map<number, Button | null>()
  private overlay: HTMLDivElement
  private controlsShown = false

  constructor(overlay: HTMLDivElement) {
    this.overlay = overlay
    this.touchActive = window.matchMedia('(pointer: coarse)').matches
    this.buildButtons()

    window.addEventListener('keydown', (e) => {
      const b = KEYMAP[e.code]
      if (!b) return
      if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault()
      this.gesture()
      if (b === 'pause') {
        if (!e.repeat) this.pauseRequested = true
        return
      }
      if (b === 'mute') {
        if (!e.repeat) this.muteRequested = true
        return
      }
      if (b === 'start') {
        if (!e.repeat) {
          this.startRequested = true
          this.any = true
        }
        return
      }
      if (!e.repeat) this.any = true
      this.keyHeld[b] = true
    })
    window.addEventListener('keyup', (e) => {
      const b = KEYMAP[e.code]
      if (!b || b === 'pause' || b === 'mute' || b === 'start') return
      this.keyHeld[b] = false
    })
    window.addEventListener('blur', () => {
      for (const k of Object.keys(this.keyHeld) as Button[]) {
        this.keyHeld[k] = false
        this.touchHeld[k] = false
      }
      this.pointers.clear()
      this.refreshButtonClasses()
    })

    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement | null)?.closest('#back, .ui-btn')) return
      this.gesture()
      if (e.pointerType === 'touch' || e.pointerType === 'pen') this.setTouchActive(true)
      this.any = true
      const b = this.hit(e.clientX, e.clientY)
      this.pointers.set(e.pointerId, b)
      this.recomputeTouch()
      e.preventDefault()
    }
    const onMove = (e: PointerEvent) => {
      if (!this.pointers.has(e.pointerId)) return
      const b = this.hit(e.clientX, e.clientY)
      if (this.pointers.get(e.pointerId) !== b) {
        this.pointers.set(e.pointerId, b)
        this.recomputeTouch()
      }
    }
    const onUp = (e: PointerEvent) => {
      if (!this.pointers.has(e.pointerId)) return
      this.pointers.delete(e.pointerId)
      this.recomputeTouch()
    }
    window.addEventListener('pointerdown', onDown, { passive: false })
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    // Block iOS double-tap zoom and context menus on long press.
    document.addEventListener('contextmenu', (e) => e.preventDefault())
    document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false })
    document.addEventListener('dblclick', (e) => e.preventDefault())
  }

  private gesture() {
    if (this.gestured) return
    this.gestured = true
    this.onFirstGesture?.()
  }

  private buildButtons() {
    const style = document.createElement('style')
    style.textContent = `
      .tbtn { position: fixed; display:flex; align-items:center; justify-content:center;
        border-radius: 999px; border: 2px solid rgba(255,255,255,0.22);
        background: rgba(20, 16, 40, 0.42); color: rgba(255,255,255,0.75);
        font: 700 22px/1 Inter, system-ui, sans-serif; letter-spacing: .02em;
        backdrop-filter: blur(6px); touch-action: none; user-select: none; pointer-events:none;
        transition: transform .08s, background .08s, opacity .25s; opacity: 0; }
      .tbtn.show { opacity: 1; }
      .tbtn.down { transform: scale(0.92); background: rgba(255,140,66,0.45); border-color: rgba(255,200,120,0.8); color:#fff; }
      .tbtn-left { left: calc(16px + var(--safe-left)); bottom: calc(22px + var(--safe-bottom)); width: 68px; height: 68px; }
      .tbtn-right { left: calc(96px + var(--safe-left)); bottom: calc(22px + var(--safe-bottom)); width: 68px; height: 68px; }
      .tbtn-jump { right: calc(16px + var(--safe-right)); bottom: calc(22px + var(--safe-bottom)); width: 80px; height: 80px; font-size: 14px; }
      .tbtn-shoot { right: calc(108px + var(--safe-right)); bottom: calc(40px + var(--safe-bottom)); width: 60px; height: 60px; font-size: 13px; }
      .tbtn-shoot.locked.show { opacity: 0.25; }
    `
    document.head.appendChild(style)
    const mk = (b: Button, cls: string, label: string) => {
      const d = document.createElement('div')
      d.className = `tbtn ${cls}`
      d.textContent = label
      this.overlay.appendChild(d)
      this.buttons.set(b, d)
    }
    mk('left', 'tbtn-left', '◀')
    mk('right', 'tbtn-right', '▶')
    mk('jump', 'tbtn-jump', 'HOPP')
    mk('shoot', 'tbtn-shoot', 'SKJUT')
  }

  setTouchActive(v: boolean) {
    this.touchActive = v
    this.applyVisibility()
  }

  showControls(v: boolean) {
    this.controlsShown = v
    this.applyVisibility()
  }

  setShootUnlocked(v: boolean) {
    this.buttons.get('shoot')?.classList.toggle('locked', !v)
  }

  private applyVisibility() {
    const show = this.controlsShown && this.touchActive
    for (const d of this.buttons.values()) d.classList.toggle('show', show)
  }

  private hit(x: number, y: number): Button | null {
    if (!this.controlsShown) return null
    for (const [b, el] of this.buttons) {
      const r = el.getBoundingClientRect()
      const pad = 10
      if (x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad) return b
    }
    // Empty areas of the lower screen act as big hidden move zones so misses still steer.
    const h = window.innerHeight
    const w = window.innerWidth
    if (y > h * 0.55) {
      if (x < w * 0.22) return 'left'
      if (x < w * 0.45) return 'right'
      if (x > w * 0.7) return 'jump'
    }
    return null
  }

  private recomputeTouch() {
    for (const k of Object.keys(this.touchHeld) as Button[]) this.touchHeld[k] = false
    for (const b of this.pointers.values()) if (b) this.touchHeld[b] = true
    this.refreshButtonClasses()
  }

  private refreshButtonClasses() {
    for (const [b, el] of this.buttons) el.classList.toggle('down', this.touchHeld[b] || this.keyHeld[b])
  }

  /** Call once per frame before game logic. */
  beginFrame() {
    for (const k of Object.keys(this.held) as Button[]) {
      this.held[k] = this.keyHeld[k] || this.touchHeld[k]
      this.pressed[k] = this.held[k] && !this.prev[k]
    }
  }

  /** Call once per frame after game logic. */
  endFrame() {
    for (const k of Object.keys(this.held) as Button[]) this.prev[k] = this.held[k]
    this.any = false
    this.pauseRequested = false
    this.muteRequested = false
    this.startRequested = false
  }

  /** Forget current presses (used when switching scenes so a tap does not fire twice). */
  consume() {
    for (const k of Object.keys(this.held) as Button[]) this.prev[k] = true
    this.any = false
    this.startRequested = false
  }
}
