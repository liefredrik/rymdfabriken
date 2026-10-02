export class Controls {
  constructor(onAction, touch = null) {
    this.keys = new Set();
    this.touch = touch;
    this.onAction = onAction;
    const flightKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'KeyA', 'KeyF'];
    window.addEventListener('keydown', e => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.target.tagName === 'BUTTON' && (e.code === 'Space' || e.code === 'Enter')) return;
      if (flightKeys.includes(e.code)) e.preventDefault();
      this.keys.add(e.code);
      if (!e.repeat) this.onAction(e.code);
    });
    window.addEventListener('keyup', e => { this.keys.delete(e.code); if (flightKeys.includes(e.code)) e.preventDefault(); });
    window.addEventListener('blur', () => { this.clear(); this.onAction('Blur'); });
  }
  clear() { this.keys.clear(); this.touch?.clear(); }
  sample() {
    const k = this.keys, t = this.touch?.sample() ?? {};
    return { ...t, leftPull: k.has('ArrowLeft') || t.leftPull, rightPull: k.has('ArrowRight') || t.rightPull, bothPull: k.has('ArrowDown'),
      release: k.has('ArrowUp'), leftRiser: k.has('KeyZ') ? 1 : t.leftRiser, rightRiser: k.has('KeyX') ? 1 : t.rightRiser,
      throttle: k.has('Space') ? 1 : t.throttle ?? 0,
      weight: Math.max(-1, Math.min(1, (k.has('KeyF') ? 1 : 0) - (k.has('KeyA') ? 1 : 0) + (t.weight ?? 0))) };
  }
}
