// Procedural chiptune audio: every sound is synthesised with the Web Audio API.

type MusicMode = 'none' | 'forest' | 'boss' | 'victory'

const NOTE: Record<string, number> = {}
;(() => {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  for (let o = 1; o <= 7; o++)
    names.forEach((n, i) => {
      NOTE[`${n}${o}`] = 440 * Math.pow(2, (o - 4) + (i - 9) / 12)
    })
})()

const n = (name: string) => NOTE[name] ?? 440

// Four-bar loops, 16 steps per bar. '' is a rest, '-' holds the previous note.
const FOREST = {
  bpm: 108,
  bass: [
    'A2', '', 'A2', '', 'E3', '', 'A2', '', 'A2', '', 'A2', '', 'G2', '', 'E2', '',
    'F2', '', 'F2', '', 'C3', '', 'F2', '', 'F2', '', 'F2', '', 'E2', '', 'C2', '',
    'C2', '', 'C2', '', 'G2', '', 'C2', '', 'C2', '', 'C2', '', 'B2', '', 'G2', '',
    'G2', '', 'G2', '', 'D3', '', 'G2', '', 'G2', '', 'G2', '', 'B2', '', 'D3', '',
  ],
  lead: [
    'A4', '', 'C5', '', 'E5', '', 'C5', '', 'A4', '', '', '', 'B4', '', 'C5', '',
    'F4', '', 'A4', '', 'C5', '', 'A4', '', 'F4', '', '', '', 'E4', '', 'G4', '',
    'E4', '', 'G4', '', 'C5', '', 'G4', '', 'E4', '', '', '', 'D4', '', 'E4', '',
    'D4', '', 'G4', '', 'B4', '', 'D5', '', 'B4', '', 'G4', '', 'A4', '', 'B4', '',
  ],
  pad: ['A3', 'F3', 'C4', 'G3'],
}

const BOSS = {
  bpm: 148,
  bass: [
    'A2', 'A2', '', 'A2', '', 'A2', 'A3', '', 'A2', 'A2', '', 'A2', '', 'G2', '', 'G#2',
    'A2', 'A2', '', 'A2', '', 'A2', 'A3', '', 'A2', 'A2', '', 'A2', '', 'C3', '', 'B2',
    'F2', 'F2', '', 'F2', '', 'F2', 'F3', '', 'F2', 'F2', '', 'F2', '', 'E2', '', 'F2',
    'E2', 'E2', '', 'E2', '', 'E2', 'E3', '', 'E2', 'E2', '', 'E2', 'G#2', '', 'B2', '',
  ],
  lead: [
    'A5', '', 'E5', 'A5', '', 'C6', '', 'B5', 'A5', '', '', 'E5', '', 'G5', '', 'G#5',
    'A5', '', 'E5', 'A5', '', 'C6', '', 'D6', 'C6', '', '', 'B5', '', 'A5', '', 'G5',
    'F5', '', 'C5', 'F5', '', 'A5', '', 'G5', 'F5', '', '', 'E5', '', 'D5', '', 'C5',
    'E5', '', 'B4', 'E5', '', 'G#5', '', 'B5', 'E6', '', '', 'D6', '', 'B5', '', 'G#5',
  ],
  pad: ['A3', 'A3', 'F3', 'E3'],
}

const VICTORY = {
  bpm: 120,
  bass: [
    'C3', '', 'C3', '', 'G3', '', 'C3', '', 'F2', '', 'F2', '', 'C3', '', 'F2', '',
    'G2', '', 'G2', '', 'D3', '', 'G2', '', 'C3', '', 'E3', '', 'G3', '', 'C4', '',
    'C3', '', 'C3', '', 'G3', '', 'C3', '', 'F2', '', 'F2', '', 'C3', '', 'F2', '',
    'G2', '', 'G2', '', 'D3', '', 'G2', '', 'C3', '', 'E3', '', 'G3', '', 'C4', '',
  ],
  lead: [
    'E5', '', 'G5', '', 'C6', '', '', '', 'A5', '', 'C6', '', 'F5', '', '', '',
    'G5', '', 'B5', '', 'D6', '', '', '', 'C6', '', 'E6', '', 'G6', '', '', '',
    'E5', '', 'G5', '', 'C6', '', '', '', 'A5', '', 'C6', '', 'F5', '', '', '',
    'G5', '', 'B5', '', 'D6', '', '', '', 'C6', '', '', '', '', '', '', '',
  ],
  pad: ['C4', 'F3', 'G3', 'C4'],
}

export class Audio {
  private ctx: AudioContext | null = null
  private master!: GainNode
  private musicGain!: GainNode
  private sfxGain!: GainNode
  private noiseBuf!: AudioBuffer
  muted = false
  private mode: MusicMode = 'none'
  private step = 0
  private nextTime = 0
  private timer: number | null = null
  private sequencerStarted = false

  constructor() {
    try {
      this.muted = localStorage.getItem('megastar.muted') === '1'
    } catch {
      this.muted = false
    }
  }

  get ready() {
    return this.ctx !== null
  }

  /** Must be called from a user gesture. */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume()
      return
    }
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return
    this.ctx = new Ctor()
    this.master = this.ctx.createGain()
    this.master.gain.value = this.muted ? 0 : 0.8
    this.master.connect(this.ctx.destination)
    this.musicGain = this.ctx.createGain()
    this.musicGain.gain.value = 0.42
    this.musicGain.connect(this.master)
    this.sfxGain = this.ctx.createGain()
    this.sfxGain.gain.value = 0.9
    this.sfxGain.connect(this.master)
    const len = this.ctx.sampleRate
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
    const d = this.noiseBuf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return
      if (document.hidden) void this.ctx.suspend()
      else void this.ctx.resume()
    })
    this.startSequencer()
  }

  toggleMute(): boolean {
    this.muted = !this.muted
    try {
      localStorage.setItem('megastar.muted', this.muted ? '1' : '0')
    } catch {
      /* storage may be unavailable */
    }
    if (this.ctx) this.master.gain.setTargetAtTime(this.muted ? 0 : 0.8, this.ctx.currentTime, 0.05)
    return this.muted
  }

  /* ----------------------------------------------------------- sound effects */

  private tone(
    type: OscillatorType,
    f0: number,
    f1: number,
    dur: number,
    vol: number,
    opts: { delay?: number; attack?: number; curve?: 'lin' | 'exp'; dest?: AudioNode } = {},
  ) {
    if (!this.ctx) return
    const t = this.ctx.currentTime + (opts.delay ?? 0)
    const o = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    o.type = type
    o.frequency.setValueAtTime(f0, t)
    if (opts.curve === 'lin') o.frequency.linearRampToValueAtTime(f1, t + dur)
    else o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(vol, t + (opts.attack ?? 0.005))
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g)
    g.connect(opts.dest ?? this.sfxGain)
    o.start(t)
    o.stop(t + dur + 0.02)
  }

  private noise(dur: number, vol: number, filterFreq: number, opts: { delay?: number; q?: number; type?: BiquadFilterType; sweepTo?: number } = {}) {
    if (!this.ctx) return
    const t = this.ctx.currentTime + (opts.delay ?? 0)
    const src = this.ctx.createBufferSource()
    src.buffer = this.noiseBuf
    src.loop = true
    const f = this.ctx.createBiquadFilter()
    f.type = opts.type ?? 'bandpass'
    f.frequency.setValueAtTime(filterFreq, t)
    if (opts.sweepTo) f.frequency.exponentialRampToValueAtTime(opts.sweepTo, t + dur)
    f.Q.value = opts.q ?? 1
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(vol, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    src.connect(f)
    f.connect(g)
    g.connect(this.sfxGain)
    src.start(t)
    src.stop(t + dur + 0.02)
  }

  jump() {
    this.tone('square', 320, 720, 0.14, 0.18)
  }
  doubleJump() {
    this.tone('square', 520, 1040, 0.12, 0.16)
    this.tone('triangle', 780, 1300, 0.1, 0.12, { delay: 0.04 })
  }
  land() {
    this.noise(0.06, 0.12, 400, { type: 'lowpass' })
  }
  catchStar(combo: number) {
    const base = 660 * Math.pow(2, Math.min(combo, 12) / 12)
    this.tone('triangle', base, base * 1.5, 0.16, 0.22)
    this.tone('sine', base * 2, base * 2.5, 0.22, 0.12, { delay: 0.03 })
  }
  powerUp() {
    const seq = [523, 659, 784, 1047, 1319]
    seq.forEach((f, i) => this.tone('square', f, f, 0.18, 0.16, { delay: i * 0.07 }))
    this.tone('triangle', 262, 523, 0.5, 0.18, { curve: 'lin' })
  }
  hurt() {
    this.tone('sawtooth', 380, 70, 0.32, 0.26)
    this.noise(0.18, 0.25, 900, { sweepTo: 150 })
  }
  die() {
    this.tone('sawtooth', 300, 40, 0.9, 0.3)
    this.tone('square', 220, 55, 1.1, 0.18, { delay: 0.1 })
    this.noise(0.6, 0.3, 500, { sweepTo: 60, type: 'lowpass' })
  }
  shoot() {
    this.tone('square', 1100, 300, 0.09, 0.12)
  }
  bigShoot() {
    this.tone('square', 900, 200, 0.16, 0.16)
    this.tone('sawtooth', 450, 120, 0.2, 0.1, { delay: 0.02 })
  }
  enemyDie() {
    this.noise(0.25, 0.35, 1800, { sweepTo: 200 })
    this.tone('square', 600, 90, 0.25, 0.14)
  }
  bossHit() {
    this.tone('sawtooth', 160, 60, 0.25, 0.3)
    this.noise(0.12, 0.3, 2500, { sweepTo: 400 })
  }
  stomp() {
    this.tone('sine', 120, 30, 0.35, 0.4)
    this.noise(0.3, 0.25, 220, { type: 'lowpass' })
  }
  fireball() {
    this.noise(0.3, 0.2, 700, { sweepTo: 2200, q: 0.6 })
  }
  rumble() {
    this.noise(0.9, 0.3, 90, { type: 'lowpass', q: 0.5 })
    this.tone('sine', 55, 40, 0.9, 0.25)
  }
  blip() {
    this.tone('square', 880, 1200, 0.06, 0.12)
  }
  heal() {
    ;[880, 1100, 1320].forEach((f, i) => this.tone('sine', f, f, 0.2, 0.14, { delay: i * 0.08 }))
  }
  bossIntro() {
    ;[110, 110, 146, 110].forEach((f, i) => this.tone('sawtooth', f, f * 0.98, 0.35, 0.25, { delay: i * 0.4 }))
    this.noise(1.5, 0.2, 120, { type: 'lowpass' })
  }
  victory() {
    const seq = [523, 659, 784, 1047, 784, 1047, 1319, 1568]
    seq.forEach((f, i) => this.tone('square', f, f, 0.22, 0.16, { delay: i * 0.11 }))
  }
  girlGiggle() {
    ;[1200, 1500, 1350, 1700].forEach((f, i) => this.tone('sine', f, f * 1.1, 0.09, 0.08, { delay: i * 0.08 }))
  }

  /* ------------------------------------------------------------------ music */

  setMusic(mode: MusicMode) {
    if (mode === this.mode) return
    this.mode = mode
    this.step = 0
    if (this.ctx) this.nextTime = this.ctx.currentTime + 0.08
  }

  private startSequencer() {
    if (this.sequencerStarted || !this.ctx) return
    this.sequencerStarted = true
    this.nextTime = this.ctx.currentTime + 0.1
    this.timer = window.setInterval(() => this.schedule(), 40)
  }

  private schedule() {
    if (!this.ctx || this.mode === 'none') return
    const song = this.mode === 'boss' ? BOSS : this.mode === 'victory' ? VICTORY : FOREST
    const stepDur = 60 / song.bpm / 4
    while (this.nextTime < this.ctx.currentTime + 0.18) {
      const i = this.step % 64
      const t = this.nextTime
      const bass = song.bass[i]
      if (bass) this.playNote('triangle', n(bass), t, stepDur * 1.8, 0.5)
      const lead = song.lead[i]
      if (lead) this.playNote(this.mode === 'boss' ? 'sawtooth' : 'square', n(lead), t, stepDur * (this.mode === 'boss' ? 1.1 : 1.6), this.mode === 'boss' ? 0.11 : 0.13)
      if (i % 16 === 0) {
        const pad = song.pad[(i / 16) % 4]!
        this.playNote('sine', n(pad), t, stepDur * 16, 0.16, true)
        this.playNote('sine', n(pad) * 1.5, t, stepDur * 16, 0.07, true)
      }
      // hi-hat on off-beats, kick on the beat for the boss
      if (i % 4 === 2) this.hat(t, this.mode === 'boss' ? 0.08 : 0.035)
      if (this.mode === 'boss' && i % 4 === 0) this.kick(t)
      this.nextTime += stepDur
      this.step++
    }
  }

  private playNote(type: OscillatorType, freq: number, t: number, dur: number, vol: number, soft = false) {
    if (!this.ctx) return
    const o = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    const f = this.ctx.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = type === 'sawtooth' ? 2400 : 3200
    o.type = type
    o.frequency.value = freq
    const a = soft ? dur * 0.3 : 0.01
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(vol, t + a)
    g.gain.setValueAtTime(vol, t + Math.max(a, dur * 0.6))
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(f)
    f.connect(g)
    g.connect(this.musicGain)
    o.start(t)
    o.stop(t + dur + 0.05)
  }

  private hat(t: number, vol: number) {
    if (!this.ctx) return
    const src = this.ctx.createBufferSource()
    src.buffer = this.noiseBuf
    const f = this.ctx.createBiquadFilter()
    f.type = 'highpass'
    f.frequency.value = 7000
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(vol, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)
    src.connect(f)
    f.connect(g)
    g.connect(this.musicGain)
    src.start(t)
    src.stop(t + 0.06)
  }

  private kick(t: number) {
    if (!this.ctx) return
    const o = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    o.type = 'sine'
    o.frequency.setValueAtTime(140, t)
    o.frequency.exponentialRampToValueAtTime(40, t + 0.12)
    g.gain.setValueAtTime(0.5, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16)
    o.connect(g)
    g.connect(this.musicGain)
    o.start(t)
    o.stop(t + 0.2)
  }

  dispose() {
    if (this.timer !== null) window.clearInterval(this.timer)
  }
}
