import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FlightModel, windAt } from '../src/physics.js';
import { surfaceHeight } from '../src/math.js';

function airborne() { const m = new FlightModel({ weather: 'calm', ground: () => -10000 }); m.state.y = 1000; return m; }
function fly(m, seconds, input = {}, hz = 120) { for (let i = 0; i < seconds * hz; i++) m.step(1 / hz, input); return m.state; }
test('hands-off equilibrium has plausible trim speed, sink and glide ratio', () => {
  const s = fly(airborne(), 60);
  assert(s.airspeed > 10 && s.airspeed < 12);
  assert(s.vy < -1 && s.vy > -1.9);
  assert(s.groundspeed / -s.vy > 6 && s.groundspeed / -s.vy < 9);
  assert.equal(s.stall, 0);
});
test('power primarily changes climb, not trim speed', () => {
  const glide = fly(airborne(), 50), power = fly(airborne(), 50, { throttle: 1 });
  assert(power.vy > 2 && power.vy < 4.8);
  assert(Math.abs(power.airspeed - glide.airspeed) < 2);
  assert(power.fuel < glide.fuel);
});
test('light symmetric braking reduces speed and sink without stalling', () => {
  const glide = fly(airborne(), 50), braked = fly(airborne(), 50, { both: .4 });
  assert(braked.airspeed < glide.airspeed - 1.5);
  assert(braked.vy > glide.vy);
  assert(braked.stall < .05);
});
test('brakes and weight shift steer in the requested direction; turns cost lift', () => {
  const right = fly(airborne(), 7, { right: .5 }), left = fly(airborne(), 7, { left: .5 }), weight = fly(airborne(), 7, { weight: 1 });
  assert(right.bank > .3 && right.heading > .4);
  assert(left.bank < -.3 && left.heading < -.4);
  assert(Math.abs(right.x + left.x) < .001);
  assert(weight.bank > .15 && weight.heading > .1);
  assert(Math.abs(right.vy) > Math.abs(fly(airborne(), 7).vy));
});
test('progressive brake travel and explicit release override', () => {
  const m = airborne(); fly(m, .15, { left: 1 }); assert(m.state.leftBrake > .1 && m.state.leftBrake < .5);
  fly(m, 3, { left: 1 }); assert(m.state.leftBrake > .99);
  fly(m, 2, { left: 1, both: 1, release: true }); assert(m.state.leftBrake < .02 && m.state.rightBrake < .02);
});
test('sustained deep brakes stall, and release recovers with altitude loss', () => {
  const m = airborne(); const stalled = { ...fly(m, 12, { both: 1 }) };
  assert(stalled.stall > .9 && stalled.vy < -5);
  const recovered = fly(m, 35);
  assert(recovered.stall < .01 && recovered.airspeed > 10 && recovered.vy > -2);
  assert(recovered.y < stalled.y);
});
test('wind affects ground track; air-relative flight remains stable', () => {
  const calm = airborne(), breeze = airborne(); breeze.weather = 'breeze';
  const wind = windAt(breeze.state.x, breeze.state.y, breeze.state.z, 0, 'breeze');
  breeze.state.vx += wind.x; breeze.state.vy += wind.y; breeze.state.vz += wind.z;
  const a = fly(calm, 30), b = fly(breeze, 30);
  assert(Math.abs(b.x - a.x) > 15);
  assert(Math.abs(a.airspeed - b.airspeed) < 1);
  assert.deepEqual(windAt(0, 200, 0, 0, 'calm'), { x: 0, y: 0, z: 0 });
});
test('overholding one brake stalls that side; neutral input restores inflation', () => {
  const m = airborne(); fly(m, 9, { right: 1 });
  assert(m.state.rightStall > .9 && m.state.leftStall < .01);
  assert(m.state.bank > .2 && m.state.inflation < .9);
  fly(m, 25);
  assert(m.state.rightStall < .01 && m.state.inflation > .99);
});
test('a brief flare exchanges kinetic energy for a transient lift increase', () => {
  const m = airborne(); fly(m, 30); const before = { ...m.state };
  fly(m, 1, { both: 1 });
  assert(m.state.load > before.load + .05);
  assert(m.state.airspeed < before.airspeed);
  assert(m.state.vy > before.vy);
});
test('fixed substep solutions converge across rates', () => {
  const a = fly(airborne(), 30, { throttle: .45, right: .12 }, 120), b = fly(airborne(), 30, { throttle: .45, right: .12 }, 240);
  assert(Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) < 1);
});
test('ground start lifts off under full power', () => {
  const m = new FlightModel({ weather: 'calm' }); m.reset('ground'); fly(m, 20, { throttle: 1 });
  assert.equal(m.state.status, 'flying'); assert(m.state.agl > 8);
});
test('landing, impact, fuel exhaustion and boundary terminate or reduce power correctly', () => {
  const landing = new FlightModel({ weather: 'calm' }); landing.state.y = surfaceHeight(0, 700) + 1.26; landing.state.vy = -1; landing.state.vz = -6;
  landing.step(1 / 120); landing.step(1 / 120); assert.equal(landing.state.status, 'landed');
  const crash = new FlightModel({ weather: 'calm' }); crash.state.y = surfaceHeight(0, 700) + 1.26; crash.state.vy = -7; crash.step(1 / 120); assert.equal(crash.state.status, 'crashed');
  const empty = airborne(); empty.state.fuel = 0; fly(empty, 3, { throttle: 1 }); assert.equal(empty.state.throttle, 0);
  const edge = airborne(); edge.state.x = 5901; edge.step(1 / 120); assert.equal(edge.state.status, 'crashed'); assert.equal(edge.state.boundary, true);
});
test('long thermal flight remains finite under varied inputs', () => {
  const m = airborne(); m.weather = 'thermal';
  for (let i = 0; i < 120 * 180; i++) {
    const t = i / 120; m.step(1 / 120, { throttle: .35 + .25 * Math.sin(t * .15), left: Math.max(0, Math.sin(t * .2)) * .4, right: Math.max(0, -Math.sin(t * .2)) * .4, weight: Math.sin(t * .2) * -.5 });
    for (const key of ['x', 'y', 'z', 'airspeed', 'pitch', 'bank', 'load']) assert(Number.isFinite(m.state[key]), key);
  }
});
