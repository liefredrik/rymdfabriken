import { clamp } from './math.js';

export const isTouchDevice = () => matchMedia('(pointer: coarse)').matches ||
  (navigator.maxTouchPoints > 0 && Math.min(screen.width, screen.height) <= 1024);

// Pointer capture gives each thumb independent ownership, even outside its pad.
export class TouchControls {
  constructor(root) {
    this.root = root; this.active = false; this.enabled = false; this.mode = 'brakes';
    this.pointers = new Map();
    this.state = {};
    this.setActive(isTouchDevice());
    matchMedia('(pointer: coarse)').addEventListener('change', () => { this.clear(); this.setActive(isTouchDevice()); });
    for (const side of ['left', 'right']) {
      const pad = root.querySelector(`[data-pad="${side}"]`);
      const release = e => { if (this.pointers.get(e.pointerId)?.side === side) { this.pointers.delete(e.pointerId); this.state[side] = null; pad.classList.remove('pressed'); pad.style.setProperty('--thumb-x', '0px'); pad.style.setProperty('--thumb-y', '0px'); } };
      pad.addEventListener('pointerdown', e => {
        if (!this.enabled || this.state[side]) return;
        e.preventDefault(); pad.setPointerCapture(e.pointerId);
        const bounds = pad.getBoundingClientRect();
        const pointer = { side, x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2, moved: false };
        this.pointers.set(e.pointerId, pointer); this.state[side] = { pull: true, travel: 0, weight: 0 };
        pad.classList.add('pressed');
      });
      pad.addEventListener('pointermove', e => {
        const p = this.pointers.get(e.pointerId); if (!p || p.side !== side) return;
        e.preventDefault();
        const dx = e.clientX - p.x, dy = e.clientY - p.y;
        if (Math.hypot(dx, dy) > 8) p.moved = true;
        if (!p.moved) return;
        this.state[side] = { pull: dy > 45, travel: Math.max(0, dy / 45), weight: clamp(dx / 50, -1, 1) };
        pad.style.setProperty('--thumb-x', `${clamp(dx, -36, 36)}px`); pad.style.setProperty('--thumb-y', `${clamp(dy, -36, 36)}px`);
      });
      for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) pad.addEventListener(type, release);
      pad.addEventListener('contextmenu', e => e.preventDefault());
    }
    const throttle = root.querySelector('#touch-throttle');
    root.querySelector('#touch-release').addEventListener('pointerdown', e => { e.preventDefault(); this.clear(); });
    throttle.addEventListener('pointerdown', e => { if (!this.enabled || this.state.throttle) return; e.preventDefault(); throttle.setPointerCapture(e.pointerId); this.pointers.set(e.pointerId, { side: 'throttle' }); this.state.throttle = 1; throttle.classList.add('pressed'); });
    const releaseThrottle = e => { if (this.pointers.get(e.pointerId)?.side !== 'throttle') return; this.pointers.delete(e.pointerId); this.state.throttle = 0; throttle.classList.remove('pressed'); };
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) throttle.addEventListener(type, releaseThrottle);
    root.querySelector('#touch-mode').addEventListener('click', () => {
      this.clear(); this.mode = this.mode === 'brakes' ? 'risers' : 'brakes';
      root.querySelector('#touch-mode').textContent = this.mode === 'brakes' ? 'A-RISERS' : 'BRAKES';
      root.querySelector('#touch-mode').setAttribute('aria-pressed', String(this.mode === 'risers'));
      for (const side of ['left', 'right']) {
        const pad = root.querySelector(`[data-pad="${side}"]`);
        pad.querySelector('.pad-label').textContent = `${side.toUpperCase()} ${this.mode === 'brakes' ? 'BRAKE' : 'A-RISER'}`;
        pad.querySelector('small').textContent = this.mode === 'brakes' ? '↓ BRAKE · ↔ LEAN' : 'HOLD TO FOLD';
        pad.setAttribute('aria-label', `${side === 'left' ? 'Left' : 'Right'} ${this.mode === 'brakes' ? 'brake' : 'A-riser'} touch control`);
      }
      root.classList.toggle('riser-mode', this.mode === 'risers');
    });
  }
  setActive(active) { this.active = active; document.body.classList.toggle('touch-device', active); }
  setEnabled(enabled) { this.enabled = enabled; if (!enabled) this.clear(); }
  clear() {
    this.state = {}; this.pointers.clear();
    for (const el of this.root.querySelectorAll('.pressed')) el.classList.remove('pressed');
    for (const pad of this.root.querySelectorAll('[data-pad]')) { pad.style.setProperty('--thumb-x', '0px'); pad.style.setProperty('--thumb-y', '0px'); }
  }
  sample() {
    if (!this.enabled) return {};
    const l = this.state.left, r = this.state.right;
    const result = { throttle: this.state.throttle ?? 0, weight: clamp((l?.weight ?? 0) + (r?.weight ?? 0), -1, 1) };
    for (const [side, pad] of [['left', l], ['right', r]]) {
      if (this.mode === 'risers') result[`${side}Riser`] = pad ? (pad.pull ? 1 : clamp(pad.travel, 0, 1)) : 0;
      else { result[side] = pad?.travel ?? 0; result[`${side}Pull`] = pad?.pull ?? false; }
    }
    return result;
  }
  update(s) {
    if (!this.active) return;
    for (const side of ['left', 'right']) {
      const value = this.mode === 'risers' ? s[`${side}Riser`] : s[`${side}Brake`];
      const pad = this.root.querySelector(`[data-pad="${side}"]`);
      pad.querySelector('output').textContent = `${Math.round(value * 100)}%`;
      pad.classList.toggle('deep', value > .85);
      pad.style.setProperty('--pull', `${Math.min(value, 1) * 360}deg`);
    }
    this.root.querySelector('#touch-power').textContent = `${Math.round(s.throttle * 100)}%`;
  }
}
