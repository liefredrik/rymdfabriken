export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export const damp = (a, b, rate, dt) => lerp(a, b, 1 - Math.exp(-rate * dt));
export const wrapAngle = a => Math.atan2(Math.sin(a), Math.cos(a));
export function random(seed = 12345) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function hash(x, z) { const v = Math.sin(x * 127.1 + z * 311.7) * 43758.5453123; return v - Math.floor(v); }
export function noise(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
  const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  return lerp(lerp(hash(ix, iz), hash(ix + 1, iz), u), lerp(hash(ix, iz + 1), hash(ix + 1, iz + 1), u), v);
}
export function fbm(x, z) {
  return noise(x, z) * .55 + noise(x * 2.03, z * 2.03) * .27 + noise(x * 4.07, z * 4.07) * .12 + noise(x * 8.1, z * 8.1) * .06;
}
export const LAKE_LEVEL = 24;
export function lakeDistance(x, z) { return Math.hypot((x - 420) / 600, (z + 1600) / 1450); }
export function terrainHeight(x, z) {
  const valley = Math.abs(x + Math.sin(z * .00055) * 340);
  const mountains = smoothstep(550, 3600, valley) * (500 + fbm(x * .00065 + 9, z * .00065) * 1350);
  const endRange = smoothstep(3000, 6500, Math.abs(z + 500)) * (400 + fbm(x * .0007, z * .0007) * 800);
  let h = 32 + (fbm(x * .002, z * .002) - .4) * 100 + mountains + endRange;
  const lake = 1 - smoothstep(.83, 1.17, lakeDistance(x, z));
  h = lerp(h, 7 + noise(x * .003, z * .003) * 8, lake);
  const field = 1 - smoothstep(.7, 1.25, Math.hypot(x / 260, (z - 700) / 600));
  return lerp(h, 34, field);
}
export const surfaceHeight = (x, z) => Math.max(LAKE_LEVEL, terrainHeight(x, z));
