import * as THREE from 'three';
import './style.css';
import { FlightModel } from './physics.js';
import { Controls } from './controls.js';
import { Environment } from './environment.js';
import { Aircraft } from './aircraft.js';
import { FlightAudio } from './audio.js';
import { UI } from './ui.js';
import { surfaceHeight, wrapAngle } from './math.js';

let stored = {};
try { stored = JSON.parse(localStorage.getItem('aer-settings') || '{}'); } catch { /* Private browsing can disable storage. */ }
const settings = { weather: 'breeze', quality: 'high', camera: 0, ...stored };
if (!['calm', 'breeze', 'thermal'].includes(settings.weather)) settings.weather = 'breeze';
const flight = new FlightModel({ weather: settings.weather });
const audio = new FlightAudio();
let running = false, started = false, ended = false, accumulator = 0, lastTime = 0, uiTime = 0, world, aircraft, cameraHeading = 0, cameraInitialized = false;
let renderer, scene, camera, controls;

const ui = new UI({
  start,
  resume,
  help: () => { pauseForPanel(); ui.help(); },
  settings: () => { pauseForPanel(); ui.settings(settings.weather, settings.quality, settings.camera); },
  apply: value => { Object.assign(settings, value); flight.weather = settings.weather; setQuality(); try { localStorage.setItem('aer-settings', JSON.stringify(settings)); } catch { /* Settings are optional. */ } resume(); },
  sound: () => { ui.el.sound.textContent = audio.toggle() ? '♪̸' : '♫'; ui.el.sound.setAttribute('aria-pressed', String(audio.muted)); },
  menu: () => { running = false; started = false; ended = false; controls?.clear(); flight.reset(); cameraInitialized = false; ui.flying(false); ui.el['session-label'].textContent = 'THE VALLEY'; },
});

function start(mode = 'air') {
  document.activeElement?.blur();
  controls.clear(); flight.reset(mode); flight.weather = settings.weather;
  started = true; running = true; ended = false; accumulator = 0; cameraInitialized = false;
  ui.flying(true); ui.el['session-label'].textContent = 'FREE FLIGHT';
  ui.el['flight-tip'].innerHTML = 'Hold <kbd>SPACE</kbd> to climb. Release to glide. Tap a brake to feel the wing.';
  audio.start().catch(() => { /* Flight remains available if browser audio is blocked. */ });
}
function pauseForPanel() { running = false; controls?.clear(); accumulator = 0; }
function resume() { ui.close(); document.activeElement?.blur(); controls?.clear(); running = started && !ended; accumulator = 0; if (running) audio.start().catch(() => {}); }
function togglePause() { if (!started || ended) return; if (ui.el.panel.open) resume(); else { pauseForPanel(); ui.pause(); } }
function setQuality() {
  if (!renderer) return;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, settings.quality === 'high' ? 1.65 : 1));
  renderer.shadowMap.enabled = settings.quality === 'high';
  renderer.setSize(window.innerWidth, window.innerHeight);
}
function init() {
  try {
    renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#world'), antialias: true, powerPreference: 'high-performance' });
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .88;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; setQuality();
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(53, innerWidth / innerHeight, .15, 28000);
    world = new Environment(scene, settings.quality); aircraft = new Aircraft(scene);
    controls = new Controls(code => {
      if (code === 'Blur') { if (running) { pauseForPanel(); ui.pause(); } return; }
      // Modal UI owns keys while open; its buttons retain normal Enter/Space behavior.
      if (ui.el.panel.open) { if (code === 'KeyP' || code === 'Escape' || code === 'KeyH') resume(); return; }
      if (code === 'KeyP' || code === 'Escape') togglePause();
      if (code === 'KeyH') { pauseForPanel(); ui.help(); }
      if (code === 'KeyC') settings.camera = (settings.camera + 1) % 2;
      if (code === 'KeyM') ui.el.sound.click();
      if (code === 'KeyR' && started) start('air');
      if (code === 'Enter' && !started) start('air');
    });
    window.addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
    document.addEventListener('visibilitychange', () => { if (document.hidden && running) { pauseForPanel(); ui.pause(); } });
    ui.ready(); requestAnimationFrame(frame);
    // Read-only snapshots for integration tests and flight-model inspection.
    window.__AER__ = Object.freeze({ snapshot: () => ({ ...flight.state, running, started, weather: flight.weather, drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles }), ready: true });
    if (import.meta.env.DEV && new URLSearchParams(location.search).has('debug')) window.__AER_DEBUG__ = { scene, camera, renderer, flight };
  } catch (error) {
    console.error(error); ui.ready(); ui.panel('The sky needs WebGL 2.', '<p class="dialog-intro">The renderer could not start. Use a current desktop browser with hardware acceleration enabled, then reload this page.</p>');
  }
}
const cameraPosition = new THREE.Vector3(), target = new THREE.Vector3();
function updateCamera(s, dt) {
  const distance = settings.camera === 0 ? 19 : 29;
  if (!cameraInitialized) cameraHeading = s.heading;
  cameraHeading += wrapAngle(s.heading - cameraHeading) * (1 - Math.exp(-2.4 * dt));
  const demoOffset = started ? 0 : -6;
  cameraPosition.set(s.x - Math.sin(cameraHeading) * distance, s.y + (settings.camera === 0 ? 5.2 : 8), s.z + Math.cos(cameraHeading) * distance);
  cameraPosition.y = Math.max(cameraPosition.y, surfaceHeight(cameraPosition.x, cameraPosition.z) + 2.1);
  target.set(s.x + Math.sin(cameraHeading) * 8 + demoOffset, s.y + 3.0, s.z - Math.cos(cameraHeading) * 8);
  if (!cameraInitialized) camera.position.copy(cameraPosition); else camera.position.lerp(cameraPosition, 1 - Math.exp(-5 * dt));
  // Keep the horizon nearly level; wing and pilot motion supply the pendulum cues.
  camera.up.set(-Math.sin(s.bank) * .025, 1, 0); camera.lookAt(target); cameraInitialized = true;
}
function frame(ms) {
  requestAnimationFrame(frame);
  const dt = Math.min((ms - (lastTime || ms)) / 1000, .08); lastTime = ms;
  if (running) {
    accumulator += dt;
    const input = controls.sample();
    while (accumulator >= 1 / 120) {
      flight.step(1 / 120, input); accumulator -= 1 / 120;
      const s = flight.state;
      if (s.status === 'flying' && world.collision(s)) { s.status = 'crashed'; s.obstacle = true; s.landingImpact = Math.hypot(s.vx, s.vy, s.vz); s.throttle = 0; }
      if (s.status === 'landed' || s.status === 'crashed') { running = false; ended = true; controls.clear(); ui.finish(s); break; }
    }
  }
  const s = flight.state;
  const visualState = !started ? { ...s, time: ms * .001, bank: Math.sin(ms * .00022) * .025, leftBrake: .03, rightBrake: .03, throttle: .1 } : s;
  aircraft.update(visualState, running || !started ? dt : 0); world.update(s, s.time); updateCamera(visualState, dt);
  uiTime += dt; if (uiTime > .1) { ui.update(s, settings.weather); uiTime = 0; }
  audio.update(s, running); renderer.render(scene, camera);
}
// Let the loading surface paint before generating local assets.
requestAnimationFrame(() => setTimeout(init, 30));
