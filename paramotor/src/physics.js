import { clamp, damp, smoothstep, wrapAngle, terrainHeight, surfaceHeight, LAKE_LEVEL } from './math.js';

// SI units throughout. This is a reduced-order flight model, not a certified wing model.
export const SPEC = Object.freeze({ mass: 115, area: 26, projectedSpan: 8.75, lines: 6.6, maxThrust: 735, gravity: 9.80665 });
export const WING_RANGE = Object.freeze({ min: 14, max: 32, step: 1 });
export function wingSpec(area = 26) {
  area = Number.isFinite(Number(area)) ? clamp(Math.round(Number(area)), WING_RANGE.min, WING_RANGE.max) : 26;
  const scale = Math.sqrt(area / SPEC.area);
  return { ...SPEC, area, scale, projectedSpan: SPEC.projectedSpan * scale, lines: SPEC.lines * scale, loading: SPEC.mass / area, speedScale: 1 / scale };
}
export const WEATHER = {
  calm: { name: 'Still morning', wind: 0, gust: 0, thermal: 0, direction: .5 },
  breeze: { name: 'Valley breeze', wind: 2.5, gust: .55, thermal: .5, direction: .7 },
  thermal: { name: 'Thermal afternoon', wind: 3.5, gust: 1.1, thermal: 2.8, direction: .8 },
};
export const THERMALS = [{ x: -550, z: -400, radius: 180 }, { x: 1000, z: -2300, radius: 240 }, { x: -900, z: 1700, radius: 200 }];
export function windAt(x, y, z, t, weather = 'breeze') {
  const w = WEATHER[weather] ?? WEATHER.breeze;
  const agl = Math.max(0, y - terrainHeight(x, z));
  const gradient = .25 + .75 * smoothstep(0, 90, agl);
  const gust = w.gust * (Math.sin(t * .7 + z * .009) * .5 + Math.sin(t * 1.7 + x * .015) * .25);
  let up = w.gust * .35 * Math.sin(t * .9 + x * .004 + z * .005);
  for (const thermal of THERMALS) {
    const r = Math.hypot(x - thermal.x - y * .15, z - thermal.z) / thermal.radius;
    up += w.thermal * (Math.exp(-r * r * 2) - .17 * Math.exp(-r * r * .35)) * smoothstep(0, 60, agl);
  }
  return { x: Math.sin(w.direction) * w.wind * gradient + gust, y: up, z: Math.cos(w.direction) * w.wind * gradient + gust * .4 };
}

export class FlightModel {
  constructor(options = {}) { this.weather = options.weather ?? 'breeze'; this.ground = options.ground ?? surfaceHeight; this.spec = wingSpec(options.area); this.reset(); }
  setWingArea(area) { this.spec = wingSpec(area); return this.reset(); }
  reset(mode = 'air') {
    const ground = this.ground(0, 700);
    this.state = {
      area: this.spec.area, wingLoading: this.spec.loading, wingScale: this.spec.scale,
      x: 0, y: ground + (mode === 'ground' ? 1.25 : 180), z: 700,
      vx: 0, vy: mode === 'ground' ? 0 : -1.35, vz: mode === 'ground' ? 0 : -11.3,
      heading: 0, bank: 0, rollRate: 0, pitch: -.005, pitchRate: 0,
      swing: 0, swingRate: 0, lateralSwing: 0, lateralSwingRate: 0,
      leftBrake: 0, rightBrake: 0, weight: 0, throttle: 0, rpm: 1900,
      airspeed: 11.3, groundspeed: 11.3, verticalSpeed: -1.35, alpha: .09,
      load: 1, stall: 0, leftStall: 0, rightStall: 0, leftCollapse: 0, rightCollapse: 0,
      leftRiser: 0, rightRiser: 0, lineTension: 1, inflation: 1,
      trimAlpha: .09, surge: 0, surgeRate: 0, previousBrake: 0, previousStall: 0,
      previousGamma: -.12, maxBank: 0, fuel: 8, time: 0, distance: 0,
      status: mode === 'ground' ? 'ground' : 'flying', agl: mode === 'ground' ? 1.25 : 180,
      wind: { x: 0, y: 0, z: 0 }, maxAltitude: 180, maxSpeed: 0, landingImpact: 0, thrust: 0,
    };
    this.state.vz *= this.spec.speedScale; this.state.vy *= this.spec.speedScale;
    this.state.airspeed *= this.spec.speedScale; this.state.groundspeed *= this.spec.speedScale;
    if (mode !== 'ground') {
      const s = this.state, w = windAt(s.x, s.y, s.z, 0, this.weather);
      s.wind = w; s.vx += w.x; s.vy += w.y; s.vz += w.z;
    }
    return this.state;
  }
  step(dt, input = {}) {
    const s = this.state;
    if (s.status === 'crashed' || s.status === 'landed') return s;
    // Fixed 120 Hz stepping in the app keeps control response independent of render rate.
    const g = this.spec.gravity, size = this.spec.scale, response = 1 / Math.sqrt(size);
    const release = input.release === true;
    const demand = value => Number.isFinite(value) ? Math.max(0, value) : 0;
    for (const side of ['left', 'right']) {
      const key = `${side}Brake`;
      if (!release && (input[`${side}Pull`] || input.bothPull)) s[key] += .65 / size * dt;
      else s[key] = damp(s[key], release ? 0 : Math.max(demand(input[side]), demand(input.both)), 2.2, dt);
      s[`${side}Riser`] = damp(s[`${side}Riser`], clamp(demand(input[`${side}Riser`]), 0, 1), 5, dt);
    }
    s.weight = damp(s.weight, clamp(input.weight ?? 0, -1, 1), 3, dt);
    s.throttle = damp(s.throttle, s.fuel > 0 ? clamp(input.throttle ?? 0, 0, 1) : 0, 1.7, dt);
    s.rpm = 1900 + s.throttle * 6400;
    s.fuel = Math.max(0, s.fuel - (.35 + 4.3 * s.throttle ** 1.4) * dt / 3600);
    s.time += dt;
    s.wind = windAt(s.x, s.y, s.z, s.time, this.weather);
    const ax = s.vx - s.wind.x, ay = s.vy - s.wind.y, az = s.vz - s.wind.z;
    const horizontal = Math.hypot(ax, az);
    const v = Math.max(.2, Math.hypot(horizontal, ay));
    const gamma = Math.atan2(ay, Math.max(horizontal, .1));
    const track = horizontal > 1 ? Math.atan2(ax, -az) : s.heading;
    // Travel is unbounded. The response saturates only once fabric is fully
    // deformed: pulling a folded wing harder cannot create unlimited forces.
    const left = Math.min(s.leftBrake, 2.5), right = Math.min(s.rightBrake, 2.5);
    const brake = (left + right) * .5;
    const differential = right - left;
    const rho = 1.225 * Math.exp(-Math.max(0, s.y) / 8500);
    const q = .5 * rho * v * v;
    const alphaTrim = .09 + brake * .2 + s.throttle * .008;
    const brakeRate = (brake - s.previousBrake) / dt;
    const stallRate = (s.stall - s.previousStall) / dt;
    const gammaRate = wrapAngle(gamma - s.previousGamma) / dt;
    s.previousBrake = brake; s.previousStall = s.stall; s.previousGamma = gamma;
    // The relative pitch/surge oscillator retains maneuver energy. Abrupt
    // release after deep braking can unload the leading edge during the surge.
    s.surgeRate += (-1.7 / size * s.surge - .7 * response * s.surgeRate + .7 * brakeRate + .75 * stallRate - .08 * gammaRate) * dt;
    s.surge += s.surgeRate * dt;
    s.pitchRate += ((alphaTrim - s.trimAlpha) * 8 / size - s.pitchRate * 3 * response) * dt;
    s.trimAlpha += s.pitchRate * dt;
    s.alpha = s.trimAlpha + .20 * s.surge;
    s.pitch = gamma + s.alpha;
    const localLeftAlpha = s.alpha + .12 * (left - brake) - s.rollRate * .025;
    const localRightAlpha = s.alpha + .12 * (right - brake) + s.rollRate * .025;
    const stallFor = (pull, alpha, otherCollapse) => Math.max(smoothstep(.32, .45, alpha), smoothstep(.83 - .13 * otherCollapse, .98 - .13 * otherCollapse, pull));
    const leftTarget = stallFor(left, localLeftAlpha, s.rightCollapse), rightTarget = stallFor(right, localRightAlpha, s.leftCollapse);
    s.leftStall = damp(s.leftStall, leftTarget, leftTarget > s.leftStall ? 1.4 : .85, dt);
    s.rightStall = damp(s.rightStall, rightTarget, rightTarget > s.rightStall ? 1.4 : .85, dt);
    s.stall = (s.leftStall + s.rightStall) * .5;
    s.lineTension = Math.max(0, s.load * Math.cos(s.bank) + s.rollRate ** 2 * this.spec.lines / g * .3);
    const unloaded = smoothstep(.28, .02, s.lineTension) * smoothstep(.95, 1.7, Math.abs(wrapAngle(s.bank)));
    for (const [side, alpha, pull] of [['left', localLeftAlpha, left], ['right', localRightAlpha, right]]) {
      const key = `${side}Collapse`, riser = s[`${side}Riser`];
      const lossOfPressure = smoothstep(.005, -.085, alpha) * (1 - .5 * Math.min(pull, .5));
      const target = Math.max(riser * .96, lossOfPressure, unloaded * (side === (s.bank > 0 ? 'left' : 'right') ? 1 : .65));
      const recovery = (.12 + 1.9 * smoothstep(15, 90, q)) * smoothstep(.015, .10, alpha) * (1 - s[`${side}Stall`]) * (1 - riser);
      s[key] = damp(s[key], target, target > s[key] ? 3.5 : recovery, dt);
    }
    const collapse = (s.leftCollapse + s.rightCollapse) * .5;
    s.inflation = 1 - .72 * collapse - .25 * s.stall;
    const clAttached = clamp(.24 + 4.8 * s.alpha + .18 * brake, 0, 1.85);
    const leftLift = (1 - .79 * s.leftStall) * (1 - .85 * s.leftCollapse);
    const rightLift = (1 - .79 * s.rightStall) * (1 - .85 * s.rightCollapse);
    const cl = clAttached * (leftLift + rightLift) * .5;
    // Flat-area reference: profile + induced + pilot/lines + brake drag.
    const cd = .042 + .058 * clAttached ** 2 + .026 * 26 / this.spec.area + .09 * Math.min(brake, 1.4) ** 2 + .045 * Math.abs(differential) + s.stall * .48 + collapse * .28;
    const lift = q * this.spec.area * cl * (1 - .25 * s.stall);
    const drag = q * this.spec.area * cd;
    s.thrust = this.spec.maxThrust * s.throttle ** 1.55 * clamp(1 - v / 48, .25, 1) * rho / 1.225;
    const authority = smoothstep(3, 10, v) * (1 - s.stall * .6) * (1 - collapse * .65);
    const asymmetricStall = s.rightStall - s.leftStall;
    const asymmetricCollapse = s.rightCollapse - s.leftCollapse;
    const rollTorque = (differential * 2.4 + s.weight * .85 + s.throttle ** 2 * .09) * authority + asymmetricStall * .38 + asymmetricCollapse * .95;
    const restoring = 2.6 * Math.sin(s.bank) * (1 - .45 * smoothstep(.65, 1.6, Math.abs(wrapAngle(s.bank))));
    s.rollRate += ((rollTorque - restoring) / size - (.64 + .65 * s.stall + .3 * brake) * response * s.rollRate - .10 * s.rollRate * Math.abs(s.rollRate)) * dt;
    s.bank += s.rollRate * dt;
    s.maxBank = Math.max(s.maxBank, Math.abs(wrapAngle(s.bank)));
    const turnRate = lift * Math.sin(s.bank) / (this.spec.mass * Math.max(horizontal, 3));
    s.heading = wrapAngle(s.heading + (turnRate + wrapAngle(track - s.heading) * .75 + asymmetricStall * 1.1 + asymmetricCollapse * .7) * dt);
    const fx = Math.sin(track), fz = -Math.cos(track);
    const rx = Math.cos(track), rz = Math.sin(track);
    const liftVertical = lift * Math.cos(s.bank);
    const along = -drag * Math.cos(gamma) - liftVertical * Math.sin(gamma);
    const side = lift * Math.sin(s.bank);
    const thrustPitch = s.swing + .06;
    const accelerationX = (along * fx + side * rx + s.thrust * Math.sin(s.heading) * Math.cos(thrustPitch)) / this.spec.mass;
    const accelerationZ = (along * fz + side * rz - s.thrust * Math.cos(s.heading) * Math.cos(thrustPitch)) / this.spec.mass;
    const accelerationY = (liftVertical * Math.cos(gamma) - drag * Math.sin(gamma) + s.thrust * Math.sin(thrustPitch)) / this.spec.mass - g;
    s.vx += accelerationX * dt; s.vz += accelerationZ * dt; s.vy += accelerationY * dt;
    // Pilot displacement relative to the wing: a damped suspended mass excited by acceleration.
    const forwardAcceleration = accelerationX * Math.sin(s.heading) - accelerationZ * Math.cos(s.heading);
    s.swingRate += (-g / this.spec.lines * Math.sin(s.swing) - .75 * s.swingRate + (s.thrust / this.spec.mass - forwardAcceleration) / this.spec.lines * .55) * dt;
    s.swing += s.swingRate * dt;
    s.lateralSwingRate += (-(s.lateralSwing + s.bank * .22) * 1.8 / size - s.lateralSwingRate * .9 * response - s.rollRate * .35) * dt;
    s.lateralSwing += s.lateralSwingRate * dt;
    if (s.status === 'ground') {
      s.pitch = alphaTrim; s.pitchRate = 0; s.surge = 0; s.surgeRate = 0; s.bank *= Math.exp(-6 * dt);
      if (s.throttle > .15 && horizontal < 7) { s.vx += Math.sin(s.heading) * 1.6 * dt; s.vz -= Math.cos(s.heading) * 1.6 * dt; }
      if (liftVertical > this.spec.mass * g * 1.02 && horizontal > 6) { s.status = 'flying'; s.vy = Math.max(s.vy, .4); }
      else { s.vy = 0; s.y = this.ground(s.x, s.z) + 1.25; s.vx *= Math.exp(-.2 * dt); s.vz *= Math.exp(-.2 * dt); }
    }
    s.x += s.vx * dt; s.z += s.vz * dt; s.y += s.vy * dt;
    s.airspeed = v; s.groundspeed = Math.hypot(s.vx, s.vz); s.verticalSpeed = s.vy;
    s.load = Math.abs(lift) / (this.spec.mass * g);
    s.agl = s.y - this.ground(s.x, s.z);
    s.distance += s.groundspeed * dt; s.maxAltitude = Math.max(s.maxAltitude, s.agl); s.maxSpeed = Math.max(s.maxSpeed, v);
    if (s.status === 'flying' && s.agl <= 1.25) {
      const water = terrainHeight(s.x, s.z) < LAKE_LEVEL;
      s.landingImpact = Math.abs(s.vy);
      s.status = !water && s.vy > -2.5 && s.groundspeed < 9.5 && Math.abs(wrapAngle(s.bank)) < .3 ? 'landed' : 'crashed';
      s.y = this.ground(s.x, s.z) + 1.25; s.agl = 1.25; s.vx = s.vy = s.vz = 0; s.throttle = 0;
    }
    if (Math.abs(s.x) > 5900 || Math.abs(s.z) > 5900) { s.status = 'crashed'; s.boundary = true; }
    return s;
  }
}
