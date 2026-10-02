export class Controls {
  constructor(onAction) {
    this.keys = new Set();
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
  clear() { this.keys.clear(); }
  sample() {
    const k = this.keys;
    return { left: k.has('ArrowLeft') ? 1 : 0, right: k.has('ArrowRight') ? 1 : 0, both: k.has('ArrowDown') ? 1 : 0,
      release: k.has('ArrowUp'), throttle: k.has('Space') ? 1 : 0, weight: (k.has('KeyF') ? 1 : 0) - (k.has('KeyA') ? 1 : 0) };
  }
}
