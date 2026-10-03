import type { GameEvent } from './engine.ts'

export class GameAudio {
  context: AudioContext | null = null
  master: GainNode | null = null
  muted = false
  nextBeat = 0
  beat = 0
  async unlock() {
    if (!this.context) { this.context = new AudioContext(); this.master = this.context.createGain(); this.master.gain.value = .28; this.master.connect(this.context.destination) }
    await this.context.resume()
    this.nextBeat = this.context.currentTime
  }
  tone(frequency: number, length: number, type: OscillatorType, volume: number, when?: number, end?: number) {
    const c = this.context
    if (!c || !this.master || this.muted || c.state !== 'running') return
    const time = when ?? c.currentTime, o = c.createOscillator(), gain = c.createGain()
    o.type = type; o.frequency.setValueAtTime(frequency, time); if (end) o.frequency.exponentialRampToValueAtTime(end, time + length)
    gain.gain.setValueAtTime(.0001, time); gain.gain.exponentialRampToValueAtTime(volume, time + .009); gain.gain.exponentialRampToValueAtTime(.0001, time + length)
    o.connect(gain); gain.connect(this.master); o.start(time); o.stop(time + length + .02)
    o.onended = () => { o.disconnect(); gain.disconnect() }
  }
  event(event: GameEvent) {
    if (event === 'dash') this.tone(90, .24, 'triangle', .16, undefined, 750)
    if (event === 'reflect') this.tone(1200, .25, 'sine', .18, undefined, 1800)
    if (event === 'comet') this.tone(1500, .7, 'sine', .055, undefined, 400)
    if (event === 'relic') [659, 988, 1318, 1976].forEach((f, i) => this.tone(f, .6, 'sine', .13, (this.context?.currentTime ?? 0) + i * .16))
    if (event === 'star') { this.tone(1046, .13, 'sine', .15); this.tone(1568, .2, 'sine', .1, (this.context?.currentTime ?? 0) + .055) }
    if (event === 'jump') this.tone(220, .15, 'triangle', .14, undefined, 640)
    if (event === 'shoot') this.tone(700, .085, 'triangle', .10, undefined, 160)
    if (event === 'hurt') this.tone(150, .3, 'sawtooth', .1, undefined, 45)
    if (event === 'burst') this.tone(190, .2, 'triangle', .14, undefined, 50)
    if (event === 'boss') for (let i = 0; i < 3; i++) this.tone(110 + i * 27.5, .65, 'triangle', .12, (this.context?.currentTime ?? 0) + i * .2)
    if (event === 'power' || event === 'win') [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, .45, 'triangle', .14, (this.context?.currentTime ?? 0) + i * .12))
  }
  update(playing: boolean, boss: boolean) {
    const c = this.context
    if (!c || !this.master) return
    this.master.gain.setTargetAtTime(this.muted || !playing ? 0 : .28, c.currentTime, .09)
    if (!playing || this.muted) { this.nextBeat = c.currentTime; return }
    const notes = boss ? [57, 64, 60, 69, 64, 60, 67, 64] : [62, 69, 74, 77, 69, 74, 81, 77]
    const chord = Math.floor(this.beat / 32) % 4, transposition = [0, -2, 3, -5][chord]
    this.nextBeat = Math.max(this.nextBeat, c.currentTime)
    while (this.nextBeat < c.currentTime + .12) {
      const note = notes[this.beat % notes.length] + transposition
      this.tone(440 * 2 ** ((note - 69) / 12), .36, 'sine', .047, this.nextBeat)
      if (this.beat % 4 === 0) this.tone(440 * 2 ** ((note - 24 - 69) / 12), .65, 'triangle', .065, this.nextBeat)
      if (this.beat % 8 === 0) this.tone(70, .12, 'sine', .045, this.nextBeat, 35)
      this.nextBeat += boss ? .18 : .24; this.beat++
    }
  }
  dispose() { void this.context?.close(); this.context = null; this.master = null }
}
