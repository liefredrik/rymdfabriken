import { clamp } from './math.js';
export class FlightAudio {
  constructor() { this.muted = false; this.ctx = null; }
  async start() {
    if (this.ctx) { await this.ctx.resume(); return; }
    this.ctx = new AudioContext(); const c = this.ctx;
    this.master = c.createGain(); this.master.gain.value = this.muted ? 0 : .24; this.master.connect(c.destination);
    this.engineGain = c.createGain(); this.engineGain.gain.value = 0;
    const filter = c.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 420;
    this.engineGain.connect(filter).connect(this.master);
    this.engine = c.createOscillator(); this.engine.type = 'sawtooth'; this.engine.frequency.value = 40; this.engine.connect(this.engineGain); this.engine.start();
    this.sub = c.createOscillator(); this.sub.type = 'sine'; this.sub.frequency.value = 20; this.sub.connect(this.engineGain); this.sub.start();
    const buffer = c.createBuffer(1, c.sampleRate * 3, c.sampleRate), data = buffer.getChannelData(0);
    let last = 0; for (let i = 0; i < data.length; i++) { last = (last + Math.random() * .04 - .02) / 1.02; data[i] = last * 6; }
    this.wind = c.createBufferSource(); this.wind.buffer = buffer; this.wind.loop = true;
    this.windFilter = c.createBiquadFilter(); this.windFilter.type = 'highpass'; this.windFilter.frequency.value = 180;
    this.windGain = c.createGain(); this.windGain.gain.value = 0; this.wind.connect(this.windFilter).connect(this.windGain).connect(this.master); this.wind.start();
    this.vario = c.createOscillator(); this.vario.type = 'sine'; this.varioGain = c.createGain(); this.varioGain.gain.value = 0; this.vario.connect(this.varioGain).connect(this.master); this.vario.start();
  }
  update(s, running) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.muted || !running ? 0 : .24, t, .12);
    this.engine.frequency.setTargetAtTime(s.rpm / 60, t, .08); this.sub.frequency.setTargetAtTime(s.rpm / 120, t, .08);
    this.engineGain.gain.setTargetAtTime(.025 + s.throttle * .15, t, .08);
    this.windGain.gain.setTargetAtTime(clamp(s.airspeed / 22, 0, 1) * .9, t, .15);
    const climb = s.verticalSpeed > .5, pulse = Math.sin(s.time * (5 + Math.max(0, s.verticalSpeed) * 3)) > .2;
    this.vario.frequency.setTargetAtTime(650 + Math.max(0, s.verticalSpeed) * 110, t, .08);
    this.varioGain.gain.setTargetAtTime(climb && pulse ? .055 : 0, t, .015);
  }
  toggle() { this.muted = !this.muted; return this.muted; }
}
