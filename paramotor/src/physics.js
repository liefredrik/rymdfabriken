import { clamp, damp, smoothstep, wrapAngle, terrainHeight, surfaceHeight, LAKE_LEVEL } from './math.js';

// SI units throughout. This is a reduced-order flight model, not a certified wing model.
export const SPEC = Object.freeze({ mass: 115, area: 26, projectedSpan: 8.75, lines: 6.6, maxThrust: 735, gravity: 9.80665 });
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
  constructor(options = {}) { this.weather = options.weather ?? 'breeze'; this.ground = options.ground ?? surfaceHeight; this.reset(); }
  reset(mode = 'air') {
    const ground = this.ground(0, 700);
    this.state = {
      x: 0, y: ground + (mode === 'ground' ? 1.25 : 180), z: 700,
      vx: 0, vy: mode === 'ground' ? 0 : -1.35, vz: mode === 'ground' ? 0 : -11.3,
      heading: 0, bank: 0, rollRate: 0, pitch: -.005, pitchRate: 0,
      swing: 0, swingRate: 0, lateralSwing: 0, lateralSwingRate: 0,
      leftBrake: 0, rightBrake: 0, weight: 0, throttle: 0, rpm: 1900,
      airspeed: 11.3, groundspeed: 11.3, verticalSpeed: -1.35, alpha: .09,
      load: 1, stall: 0, leftStall: 0, rightStall: 0, inflation: 1, fuel: 8, time: 0, distance: 0,
      status: mode === 'ground' ? 'ground' : 'flying', agl: mode === 'ground' ? 1.25 : 180,
      wind: { x: 0, y: 0, z: 0 }, maxAltitude: 180, maxSpeed: 0, landingImpact: 0, thrust: 0,
    };
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
    const g = SPEC.gravity;
    const release = input.release === true;
    const brakeTarget = (side) => release ? 0 : clamp(Math.max(input[side] ?? 0, input.both ?? 0), 0, 1);
    s.leftBrake = damp(s.leftBrake, brakeTarget('left'), 2.2, dt);
    s.rightBrake = damp(s.rightBrake, brakeTarget('right'), 2.2, dt);
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
    const brake = (s.leftBrake + s.rightBrake) * .5;
    const differential = s.rightBrake - s.leftBrake;
    const rho = 1.225 * Math.exp(-Math.max(0, s.y) / 8500);
    const q = .5 * rho * v * v;
    const alphaTrim = .09 + brake * .2 + s.throttle * .008;
    // Suspension provides restoring trim relative to the airflow. Integrate the
    // relative pitch mode, avoiding an artificial absolute-attitude limit in dives.
    s.pitchRate += ((alphaTrim - s.alpha) * 8 - s.pitchRate * 3) * dt;
    s.alpha = clamp(s.alpha + s.pitchRate * dt, -.15, .65);
    s.pitch = gamma + s.alpha;
    const stallFor = pull => Math.max(smoothstep(.33, .48, s.alpha), smoothstep(.85, 1, pull));
    const leftTarget = stallFor(s.leftBrake), rightTarget = stallFor(s.rightBrake);
    s.leftStall = damp(s.leftStall, leftTarget, leftTarget > s.leftStall ? 1.4 : .85, dt);
    s.rightStall = damp(s.rightStall, rightTarget, rightTarget > s.rightStall ? 1.4 : .85, dt);
    s.stall = (s.leftStall + s.rightStall) * .5;
    s.inflation = damp(s.inflation, 1 - s.stall * .32, 2, dt);
    const clAttached = clamp(.24 + 4.8 * s.alpha + .18 * brake, -.35, 1.85);
    const cl = clAttached * (1 - s.stall * .79);
    // Flat-area reference: profile + induced + pilot/lines + brake drag.
    const cd = .042 + .058 * clAttached ** 2 + .026 + .09 * brake ** 2 + .045 * Math.abs(differential) + s.stall * .48;
    const lift = q * SPEC.area * cl * s.inflation;
    const drag = q * SPEC.area * cd;
    s.thrust = SPEC.maxThrust * s.throttle ** 1.55 * clamp(1 - v / 48, .25, 1) * rho / 1.225;
    const authority = smoothstep(3, 10, v) * (1 - s.stall * .6);
    const asymmetricStall = s.rightStall - s.leftStall;
    const targetBank = clamp((differential * .93 + s.weight * .28 + s.throttle ** 2 * .035 + asymmetricStall * .25) * authority, -1.16, 1.16);
    s.rollRate += ((targetBank - s.bank) * 3.5 - s.rollRate * 1.65) * dt;
    s.bank = clamp(s.bank + s.rollRate * dt, -1.3, 1.3);
    const turnRate = lift * Math.sin(s.bank) / (SPEC.mass * Math.max(horizontal, 3));
    s.heading = wrapAngle(s.heading + (turnRate + wrapAngle(track - s.heading) * .75 + asymmetricStall * 1.1) * dt);
    const fx = Math.sin(track), fz = -Math.cos(track);
    const rx = Math.cos(track), rz = Math.sin(track);
    const liftVertical = lift * Math.cos(s.bank);
    const along = -drag * Math.cos(gamma) - liftVertical * Math.sin(gamma);
    const side = lift * Math.sin(s.bank);
    const thrustPitch = s.swing + .06;
    const accelerationX = (along * fx + side * rx + s.thrust * Math.sin(s.heading) * Math.cos(thrustPitch)) / SPEC.mass;
    const accelerationZ = (along * fz + side * rz - s.thrust * Math.cos(s.heading) * Math.cos(thrustPitch)) / SPEC.mass;
    const accelerationY = (liftVertical * Math.cos(gamma) - drag * Math.sin(gamma) + s.thrust * Math.sin(thrustPitch)) / SPEC.mass - g;
    s.vx += accelerationX * dt; s.vz += accelerationZ * dt; s.vy += accelerationY * dt;
    // Pilot displacement relative to the wing: a damped suspended mass excited by acceleration.
    const forwardAcceleration = accelerationX * Math.sin(s.heading) - accelerationZ * Math.cos(s.heading);
    s.swingRate += (-g / SPEC.lines * Math.sin(s.swing) - .75 * s.swingRate + (s.thrust / SPEC.mass - forwardAcceleration) / SPEC.lines * .55) * dt;
    s.swing = clamp(s.swing + s.swingRate * dt, -.65, .65);
    s.lateralSwingRate += (-(s.lateralSwing + s.bank * .22) * 1.8 - s.lateralSwingRate * .9 - s.rollRate * .35) * dt;
    s.lateralSwing = clamp(s.lateralSwing + s.lateralSwingRate * dt, -.5, .5);
    if (s.status === 'ground') {
      s.pitch = alphaTrim; s.pitchRate = 0; s.bank *= .95;
      if (s.throttle > .15 && horizontal < 7) { s.vx += Math.sin(s.heading) * 1.6 * dt; s.vz -= Math.cos(s.heading) * 1.6 * dt; }
      if (liftVertical > SPEC.mass * g * 1.02 && horizontal > 6) { s.status = 'flying'; s.vy = Math.max(s.vy, .4); }
      else { s.vy = 0; s.y = this.ground(s.x, s.z) + 1.25; s.vx *= Math.exp(-.2 * dt); s.vz *= Math.exp(-.2 * dt); }
    }
    s.x += s.vx * dt; s.z += s.vz * dt; s.y += s.vy * dt;
    s.airspeed = v; s.groundspeed = Math.hypot(s.vx, s.vz); s.verticalSpeed = s.vy;
    s.load = Math.abs(lift) / (SPEC.mass * g);
    s.agl = s.y - this.ground(s.x, s.z);
    s.distance += s.groundspeed * dt; s.maxAltitude = Math.max(s.maxAltitude, s.agl); s.maxSpeed = Math.max(s.maxSpeed, v);
    if (s.status === 'flying' && s.agl <= 1.25) {
      const water = terrainHeight(s.x, s.z) < LAKE_LEVEL;
      s.landingImpact = Math.abs(s.vy);
      s.status = !water && s.vy > -2.5 && s.groundspeed < 9.5 && Math.abs(s.bank) < .3 ? 'landed' : 'crashed';
      s.y = this.ground(s.x, s.z) + 1.25; s.agl = 1.25; s.vx = s.vy = s.vz = 0; s.throttle = 0;
    }
    if (Math.abs(s.x) > 5900 || Math.abs(s.z) > 5900) { s.status = 'crashed'; s.boundary = true; }
    return s;
  }
}
