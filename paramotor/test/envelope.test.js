import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FlightModel } from '../src/physics.js';

const model = () => { const m = new FlightModel({ weather: 'calm', ground: () => -1e6 }); m.state.y = 1800; return m; };
function fly(m, seconds, input = {}) { for (let i = 0; i < seconds * 120; i++) m.step(1 / 120, input); return m.state; }
test('brake demand and held travel are not capped at the old full-travel limit', () => {
  const m = model(); fly(m, 5, { leftPull: true, rightPull: true });
  assert(m.state.leftBrake > 2 && m.state.rightBrake > 2);
  assert(m.state.stall > .9 && m.state.vy < -4);
  fly(m, 2, { left: 4, right: 4 }); assert(m.state.leftBrake > 3.8);
  fly(m, 4, { release: true, leftPull: true }); assert(m.state.leftBrake < .01);
});
test('A-riser input folds one side; release permits pressure-driven reopening', () => {
  const m = model(); fly(m, 2, { leftRiser: 1 });
  assert(m.state.leftCollapse > .7 && m.state.rightCollapse < .25);
  assert(m.state.heading < -.1 && m.state.inflation < .8);
  const height = m.state.y; fly(m, 25);
  assert(m.state.leftCollapse < .1 && m.state.inflation > .9);
  assert(m.state.y < height);
});
test('both A-risers induce a frontal collapse with loss of lift', () => {
  const m = model(); fly(m, 2, { leftRiser: 1, rightRiser: 1 });
  assert(m.state.leftCollapse > .7 && m.state.rightCollapse > .7);
  assert(m.state.inflation < .5 && m.state.vy < -2);
});
test('steady normal flight never generates an arbitrary collapse', () => {
  const m = model(); fly(m, 90, { throttle: .3 });
  assert(m.state.leftCollapse < .01 && m.state.rightCollapse < .01);
});
test('release after a deep stall can surge through low incidence into a frontal collapse', () => {
  const m = model(); fly(m, 3, { bothPull: true });
  let alpha = 1, collapse = 0;
  for (let i = 0; i < 15 * 120; i++) {
    m.step(1 / 120, { release: true });
    alpha = Math.min(alpha, m.state.alpha);
    collapse = Math.max(collapse, Math.min(m.state.leftCollapse, m.state.rightCollapse));
  }
  assert(alpha < -.05 && collapse > .5);
});
test('continued extreme input remains numerically finite', () => {
  const m = model(); fly(m, 90, { left: 1000, right: 1000, throttle: 1 });
  assert(m.state.leftBrake > 999);
  for (const key of ['x', 'y', 'z', 'bank', 'airspeed', 'alpha', 'inflation']) assert(Number.isFinite(m.state[key]), key);
});
test('alternating inputs retain roll energy for wingovers and an unloaded outer-wing collapse', () => {
  const m = model(); let low = 0, high = 0, collapse = 0;
  for (let i = 0; i < 45 * 120; i++) {
    const turn = Math.sin(i / 120 * Math.PI * 2 / 4.5);
    m.step(1 / 120, { left: Math.max(0, -turn) * .65, right: Math.max(0, turn) * .65, weight: turn });
    low = Math.min(low, m.state.bank); high = Math.max(high, m.state.bank);
    collapse = Math.max(collapse, m.state.leftCollapse, m.state.rightCollapse);
  }
  assert(low < -1 && high > 1, 'banks build in both directions beyond 57 degrees');
  assert(collapse > .3, 'poorly loaded high wingover can collapse without riser input');
});
