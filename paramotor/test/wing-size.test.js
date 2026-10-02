import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FlightModel, wingSpec } from '../src/physics.js';

function model(area) { const m = new FlightModel({ area, weather: 'calm', ground: () => -1e6 }); m.state.y = 1000; return m; }
function fly(m, seconds, input = {}) { for (let i = 0; i < seconds * 120; i++) m.step(1 / 120, input); return m.state; }

test('smaller area produces higher loading, trim speed and sink at fixed all-up mass', () => {
  const areas = [14, 18, 22, 26, 32], states = areas.map(area => fly(model(area), 60));
  for (let i = 1; i < states.length; i++) {
    const small = states[i - 1], large = states[i];
    assert(small.wingLoading > large.wingLoading);
    assert(small.airspeed > large.airspeed && small.vy < large.vy);
    assert(Math.abs(small.airspeed / large.airspeed - Math.sqrt(large.area / small.area)) < .04);
    assert(small.stall < .01 && large.stall < .01);
  }
});
test('size changes roll response and actual time to deep brake, without reversing steering', () => {
  const small = model(14), large = model(32);
  fly(small, 30); fly(large, 30);
  fly(small, 1, { weight: 1 }); fly(large, 1, { weight: 1 });
  assert(small.state.bank > large.state.bank && large.state.bank > .1);
  small.reset(); large.reset(); small.state.y = large.state.y = 1000;
  fly(small, 1.5, { bothPull: true }); fly(large, 1.5, { bothPull: true });
  assert(small.state.leftBrake > large.state.leftBrake && small.state.stall > large.state.stall);
});
test('size reset preserves all-up mass and resets flight; invalid sizes stay inside supported range', () => {
  const m = model(26); fly(m, 3, { throttle: 1 }); m.setWingArea(18);
  assert.equal(m.state.area, 18); assert.equal(m.spec.mass, 115); assert.equal(m.state.time, 0);
  assert.equal(m.state.throttle, 0); assert.equal(m.state.wingScale, Math.sqrt(18 / 26));
  assert.equal(wingSpec('invalid').area, 26); assert.equal(wingSpec(100).area, 32); assert.equal(wingSpec(0).area, 14);
});
test('every supported area supports takeoff, deep stalls and recovery with finite dynamics', () => {
  for (let area = 14; area <= 32; area++) {
    const launch = new FlightModel({ area, weather: 'calm' }); launch.reset('ground'); fly(launch, 25, { throttle: 1 });
    assert.equal(launch.state.status, 'flying', `takeoff ${area}`);
    const m = model(area); fly(m, 5, { bothPull: true }); assert(m.state.stall > .9, `stall ${area}`);
    fly(m, 30); assert(m.state.stall < .01 && m.state.leftCollapse < .1, `recovery ${area}`);
    for (const key of ['x', 'y', 'z', 'bank', 'airspeed', 'alpha']) assert(Number.isFinite(m.state[key]), `${area} ${key}`);
  }
});
