import type { Cue } from './model.ts'

/** All sound is synthesized locally. Audio starts only after a player's gesture. */
export class NightAudio {
  private context: AudioContext | null = null
  private output: GainNode | null = null
  private nextNote = 0
  private step = 0
  muted = false

  unlock() {
    try {
      if (!this.context) {
        this.context = new AudioContext(); this.output = this.context.createGain()
        this.output.gain.value = this.muted ? 0 : .18; this.output.connect(this.context.destination)
      }
      void this.context.resume().catch(() => {})
    } catch { /* The game remains playable if this browser has no audio device. */ }
  }
  setMuted(value: boolean) {
    this.muted = value
    if (this.output && this.context) this.output.gain.setTargetAtTime(value ? 0 : .18, this.context.currentTime, .04)
  }
  private tone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = .25, delay = 0, end?: number) {
    const context = this.context
    if (!context || !this.output || context.state !== 'running' || this.muted) return
    const at = context.currentTime + delay, oscillator = context.createOscillator(), envelope = context.createGain()
    oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, at)
    if (end) oscillator.frequency.exponentialRampToValueAtTime(end, at + duration)
    envelope.gain.setValueAtTime(0, at); envelope.gain.linearRampToValueAtTime(volume, at + .012)
    envelope.gain.exponentialRampToValueAtTime(.0001, at + duration)
    oscillator.connect(envelope); envelope.connect(this.output); oscillator.start(at); oscillator.stop(at + duration + .03)
    oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect() }
  }
  cue(cue: Cue) {
    if (cue === 'jump') this.tone(230, .18, 'sine', .35, 0, 590)
    if (cue === 'shoot') this.tone(710, .09, 'triangle', .15, 0, 220)
    if (cue === 'collect') { this.tone(880, .14, 'sine', .4); this.tone(1320, .25, 'sine', .3, .07) }
    if (cue === 'hurt') this.tone(160, .3, 'sawtooth', .22, 0, 46)
    if (cue === 'pop') this.tone(280, .14, 'triangle', .3, 0, 65)
    if (cue === 'boss') [164.81, 196, 246.94].forEach((f, i) => this.tone(f, .9, 'triangle', .3, i * .18))
    if (cue === 'upgrade' || cue === 'win') [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, .6, 'triangle', .35, i * .12))
  }
  music(time: number, boss: boolean) {
    if (time < this.nextNote) return
    this.nextNote = time + (boss ? .3 : .46)
    const notes = boss ? [164.81, 246.94, 196, 293.66, 164.81, 246.94, 220, 196] : [261.63, 392, 329.63, 493.88, 293.66, 440, 329.63, 392]
    this.tone(notes[this.step % notes.length], .8, 'sine', .095)
    if (this.step % 4 === 0) this.tone(notes[this.step % notes.length] / 2, 1.4, 'triangle', .08)
    this.step++
  }
  reset() { this.nextNote = 0; this.step = 0 }
  suspend() { if (this.context?.state === 'running') void this.context.suspend().catch(() => {}) }
  dispose() { if (this.context && this.context.state !== 'closed') void this.context.close().catch(() => {}) }
}
