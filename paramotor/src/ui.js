import { WEATHER } from './physics.js';
import { terrainHeight, LAKE_LEVEL } from './math.js';
const compass = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const formatTime = t => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
export class UI {
  constructor(actions) {
    this.actions = actions;
    document.querySelector('#app').innerHTML = `
      <header class="topbar"><a class="brand" href="#" aria-label="AER home"><svg viewBox="0 0 50 28"><path d="M2 16Q25-8 48 16L43 20Q25 2 7 20Z" fill="currentColor"/><path d="m8 20 17 7 17-7" fill="none" stroke="currentColor" stroke-width="1"/></svg><span>AER<span class="brand-sub">PARAMOTOR SIMULATOR</span></span></a>
        <div class="session"><span class="live-dot"></span><span id="session-label">THE VALLEY</span><span class="divider"></span><span id="flight-time">00:00</span></div>
        <div class="top-actions"><button id="sound" class="icon-button" aria-label="Toggle sound" title="Sound · M">♫</button><button id="help-button" class="icon-button" aria-label="Flight guide" title="Flight guide · H">?</button><button id="settings-button" class="text-button">SETTINGS <span>☷</span></button></div>
      </header>
      <div id="compass" class="compass flight-only"><div class="compass-ticks">╵ &nbsp; ╵ &nbsp; ╵ &nbsp; ╵ &nbsp; ╵ &nbsp; ╵ &nbsp; ╵</div><span id="heading">000° N</span><i></i></div>
      <div class="location"><span class="location-line"></span> VAL D’AER <span>46° N &nbsp; / &nbsp; ALPINE FREE FLIGHT</span></div>
      <section id="welcome" class="welcome">
        <div class="eyebrow"><span></span> A LITTLE CLOSER TO THE SKY</div>
        <h1>Find your<br>own altitude<span>.</span></h1>
        <p>A wing, an engine, and an open valley.<br>Feel the air. Follow your own line.</p>
        <div class="launch-actions"><button id="start" class="primary">Enter flight <span>↗</span></button><button id="ground-start" class="secondary">Start on the field <span>→</span></button></div>
        <div class="flight-spec"><span>26 m² WING</span><b>·</b><span>185 cc ENGINE</span><b>·</b><span>115 kg ALL-UP</span></div>
      </section>
      <aside id="welcome-controls" class="welcome-controls"><div class="eyebrow">YOUR HANDS ON THE WING <span class="small-index">01 — 03</span></div>
        <div class="control-row"><div class="key-group"><kbd>←</kbd><kbd>→</kbd></div><div>Pull a brake<small>Hold progressively to turn</small></div></div>
        <div class="control-row"><div class="key-group"><kbd>A</kbd><kbd>F</kbd></div><div>Shift your weight<small>Lean left / right in the harness</small></div></div>
        <div class="control-row"><div class="key-group"><kbd class="wide">SPACE</kbd></div><div>Feed the engine<small>Hold for power. Release to glide.</small></div></div>
        <div class="control-foot"><kbd>↓</kbd> Both brakes / flare <span>·</span> <kbd>↑</kbd> Hands up</div>
      </aside>
      <div class="bottom-caption" id="welcome-caption"><span>BUILT FOR THE FEELING OF FLIGHT</span><span>HEADPHONES RECOMMENDED &nbsp; ◉</span></div>
      <section id="instruments" class="instruments flight-only" aria-label="Flight instruments">
        <div class="instrument"><span>AIRSPEED</span><div><b id="airspeed">0</b><small>km/h</small></div><canvas id="speed-tape" width="130" height="12"></canvas></div>
        <div class="instrument"><span>HEIGHT AGL</span><div><b id="altitude">0</b><small>m</small></div><small class="instrument-note" id="altitude-msl">0 m MSL</small></div>
        <div class="instrument vario"><span>VERTICAL SPEED</span><div><b id="vario">0.0</b><small>m/s</small></div><small class="instrument-note" id="flight-mode">GLIDING</small></div>
        <div class="instrument engine"><span>ENGINE</span><div><b id="throttle">0</b><small>%</small></div><div class="meter"><i id="throttle-fill"></i></div></div>
      </section>
      <aside class="flight-only input-panel"><div class="eyebrow">CONTROL INPUT</div><div class="brake-readouts"><div><span>L</span><div class="brake-track"><i id="brake-left"></i></div></div><div class="harness-icon">╲<span>●</span>╱<small id="weight-label">CENTERED</small></div><div><span>R</span><div class="brake-track"><i id="brake-right"></i></div></div></div><div class="weight-track"><i id="weight-dot"></i></div></aside>
      <aside class="map-panel flight-only"><div class="map-title"><span>VALLEY MAP</span><span id="wind-label">WIND 0.0 m/s</span></div><canvas id="map" width="240" height="180" aria-label="Live terrain map with pilot location and airfield"></canvas><div class="map-footer"><span id="distance">0.00 km</span><span id="load">1.0 G</span><span id="fuel">8.0 L</span></div></aside>
      <div class="flight-only flight-footer"><span><kbd>P</kbd> Pause <kbd>H</kbd> Guide <kbd>C</kbd> Camera <kbd>R</kbd> Restart</span><span id="weather-label">VALLEY BREEZE</span></div>
      <div id="notice" class="notice" role="status"></div>
      <div id="flight-tip" class="flight-tip flight-only">Hold <kbd>SPACE</kbd> to climb. Release to glide. Tap a brake to feel the wing.</div>
      <dialog id="panel"><div class="dialog-top"><span class="eyebrow" id="panel-eyebrow">FLIGHT DECK</span><button id="close-panel" class="icon-button" aria-label="Close panel">×</button></div><div id="panel-content"></div></dialog>
      <div id="loading" class="loading"><span class="loader"></span> PREPARING THE VALLEY</div>`;
    this.el = {};
    for (const el of document.querySelectorAll('[id]')) this.el[el.id] = el;
    this.el.start.onclick = () => actions.start('air'); this.el['ground-start'].onclick = () => actions.start('ground');
    this.el.sound.onclick = () => actions.sound(); this.el['help-button'].onclick = () => actions.help(); this.el['settings-button'].onclick = () => actions.settings(); this.el['close-panel'].onclick = () => actions.resume();
    document.querySelector('.brand').onclick = e => { e.preventDefault(); actions.menu(); };
    this.el.panel.addEventListener('cancel', e => { e.preventDefault(); actions.resume(); });
    this.mapCtx = this.el.map.getContext('2d'); this.makeMap(); this.mapTrail = []; this.lastTrail = 0;
  }
  ready() { this.el.loading.classList.add('hidden'); }
  flying(on) { document.body.classList.toggle('in-flight', on); this.close(); if (on) { this.mapTrail = []; this.lastTrail = 0; } }
  close() { if (this.el.panel.open) this.el.panel.close(); }
  panel(title, content, eyebrow = 'FLIGHT DECK') { this.el['panel-eyebrow'].textContent = eyebrow; this.el['panel-content'].innerHTML = `<h2>${title}</h2>${content}`; if (!this.el.panel.open) this.el.panel.showModal(); }
  help() {
    this.panel('A feel for flight.', `<p class="dialog-intro">Small inputs. Give the wing time to respond.</p><div class="guide-grid">
      <div><kbd>←</kbd> <kbd>→</kbd><h3>Brake steering</h3><p>Hold to progressively pull the left or right brake. Release the key to raise that hand. Longer pulls produce more bank and drag.</p></div>
      <div><kbd>A</kbd> <kbd>F</kbd><h3>Weight shift</h3><p>Lean into a turn before adding brake. Weight shift steers with less drag and can oppose engine torque.</p></div>
      <div><kbd class="wide">SPACE</kbd><h3>Power & altitude</h3><p>Hold for full power with gradual engine spool-up. Release for idle and an unpowered glide. Pulse power to manage height.</p></div>
      <div><kbd>↓</kbd> <kbd>↑</kbd><h3>Flare & release</h3><p>Down pulls both brakes. Up overrides all brake inputs to raise both hands. A brief flare trades airspeed for lift; sustained deep braking can stall.</p></div></div>
      <div class="guide-note">Landing: approach the marked grass field, release power, and progressively flare just above the ground. Trees, buildings, water and hard impacts end the flight. Ground starts begin with the canopy already inflated; hold Space to run and take off.</div>
      <div class="guide-shortcuts"><span><kbd>P</kbd> Pause</span><span><kbd>C</kbd> Chase distance</span><span><kbd>H</kbd> Guide</span><span><kbd>M</kbd> Audio</span><span><kbd>R</kbd> New flight</span></div>
      <p class="fine-print">A researched, reduced-order simulation. Not a validated aircraft model or a substitute for flight instruction.</p>`, 'PILOT’S FIELD NOTES');
  }
  settings(weather, quality, camera) {
    this.panel('Make the air your own.', `<p class="dialog-intro">Choose your conditions. The valley is yours to explore.</p><label class="setting-label" for="weather-select">AIR MASS</label><select id="weather-select">${Object.entries(WEATHER).map(([key, w]) => `<option value="${key}" ${weather === key ? 'selected' : ''}>${w.name}</option>`).join('')}</select><p class="setting-help">Still morning: no wind. Valley breeze: light wind and gentle lift. Thermal afternoon: gusts, thermal cores and surrounding sink.</p>
      <label class="setting-label" for="quality-select">RENDER QUALITY</label><select id="quality-select"><option value="high" ${quality === 'high' ? 'selected' : ''}>High — full resolution & shadows</option><option value="balanced" ${quality === 'balanced' ? 'selected' : ''}>Balanced — lighter GPU load</option></select>
      <label class="setting-label" for="camera-select">CHASE CAMERA</label><select id="camera-select"><option value="0" ${camera === 0 ? 'selected' : ''}>Close — feel the wing</option><option value="1" ${camera === 1 ? 'selected' : ''}>Wide — see the valley</option></select><button class="primary dialog-primary" id="apply-settings">Apply & return <span>↗</span></button>`);
    document.querySelector('#apply-settings').onclick = () => this.actions.apply({ weather: document.querySelector('#weather-select').value, quality: document.querySelector('#quality-select').value, camera: Number(document.querySelector('#camera-select').value) });
  }
  pause() { this.panel('Take a breath.', '<p class="dialog-intro">Your flight is paused. The sky can wait.</p><button id="resume-flight" class="primary dialog-primary">Continue flight <span>↗</span></button><button id="restart-flight" class="secondary dialog-primary">New flight</button>'); document.querySelector('#resume-flight').onclick = () => this.actions.resume(); document.querySelector('#restart-flight').onclick = () => this.actions.start('air'); }
  finish(s) {
    const good = s.status === 'landed';
    this.panel(good ? 'Back on solid ground.' : s.boundary ? 'Beyond the valley.' : 'Flight ended.', `<p class="dialog-intro">${good ? 'A clean arrival. There’s always another line to fly.' : s.boundary ? 'You reached the edge of the 12 km flight area.' : s.obstacle ? 'You made contact with a tree or building.' : 'Terrain or water contact. Try a slower, wings-level approach and time your flare.'}</p><div class="results"><div><span>FLIGHT TIME</span><b>${formatTime(s.time)}</b></div><div><span>DISTANCE</span><b>${(s.distance / 1000).toFixed(2)} <small>km</small></b></div><div><span>MAX HEIGHT</span><b>${Math.round(s.maxAltitude)} <small>m</small></b></div><div><span>TOUCHDOWN</span><b>${s.landingImpact.toFixed(1)} <small>m/s</small></b></div></div><button id="fly-again" class="primary dialog-primary">Fly again <span>↗</span></button><button id="field-again" class="secondary dialog-primary">Start on the field</button>`, good ? 'FLIGHT LOG · LANDED' : 'FLIGHT LOG');
    document.querySelector('#fly-again').onclick = () => this.actions.start('air'); document.querySelector('#field-again').onclick = () => this.actions.start('ground');
  }
  makeMap() {
    this.mapBase = document.createElement('canvas'); this.mapBase.width = 240; this.mapBase.height = 180;
    const ctx = this.mapBase.getContext('2d'), img = ctx.createImageData(240, 180);
    for (let py = 0; py < 180; py++) for (let px = 0; px < 240; px++) {
      const x = (px / 240 - .5) * 7000, z = (py / 180 - .5) * 8500, h = terrainHeight(x, z), i = (py * 240 + px) * 4;
      const contour = h % 100 < 8 ? 9 : 0;
      img.data[i] = h < LAKE_LEVEL ? 48 : 49 + h * .026 + contour;
      img.data[i + 1] = h < LAKE_LEVEL ? 84 : 68 + h * .021 + contour;
      img.data[i + 2] = h < LAKE_LEVEL ? 92 : 61 + h * .02 + contour; img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }
  update(s, weather) {
    const e = this.el, heading = (s.heading * 180 / Math.PI + 360) % 360;
    e['flight-time'].textContent = formatTime(s.time); e.heading.textContent = `${String(Math.round(heading) % 360).padStart(3, '0')}° ${compass[Math.round(heading / 45) % 8]}`;
    e.airspeed.textContent = Math.round(s.airspeed * 3.6); e.altitude.textContent = Math.round(s.agl); e['altitude-msl'].textContent = `${Math.round(s.y)} m MSL`;
    e.vario.textContent = `${s.verticalSpeed >= 0 ? '+' : '−'}${Math.abs(s.verticalSpeed).toFixed(1)}`; e.vario.style.color = s.verticalSpeed > .2 ? '#ddec8e' : '';
    e['flight-mode'].textContent = s.status === 'ground' ? 'READY TO LAUNCH' : s.stall > .3 ? 'STALL' : s.throttle > .25 ? 'POWERED FLIGHT' : s.wind.y > .7 ? 'THERMAL LIFT' : 'GLIDING';
    e.throttle.textContent = Math.round(s.throttle * 100); e['throttle-fill'].style.width = `${s.throttle * 100}%`;
    e['brake-left'].style.height = `${s.leftBrake * 100}%`; e['brake-right'].style.height = `${s.rightBrake * 100}%`;
    e['weight-dot'].style.left = `${50 + s.weight * 43}%`; e['weight-label'].textContent = s.weight < -.15 ? 'LEAN LEFT' : s.weight > .15 ? 'LEAN RIGHT' : 'CENTERED';
    e.distance.textContent = `${(s.distance / 1000).toFixed(2)} km`; e.load.textContent = `${s.load.toFixed(1)} G`; e.fuel.textContent = `${s.fuel.toFixed(1)} L`;
    e['wind-label'].textContent = `WIND ${Math.hypot(s.wind.x, s.wind.z).toFixed(1)} m/s`; e['weather-label'].textContent = WEATHER[weather].name.toUpperCase();
    const notice = Math.abs(s.leftStall - s.rightStall) > .5 ? 'ASYMMETRIC STALL · Ease the deep brake' : s.stall > .3 ? 'STALL · Release deep brake input' : Math.abs(s.bank) > .85 ? 'STEEP BANK · Increasing sink and load' : s.agl < 15 && s.status === 'flying' ? (s.verticalSpeed > .5 ? 'LOW ALTITUDE · Keep the wing level' : 'LOW ALTITUDE · Prepare to land') : '';
    e.notice.textContent = notice; e.notice.classList.toggle('visible', !!notice);
    e['flight-tip'].classList.toggle('hidden', s.time > 17);
    const tipMode = s.status === 'ground' ? 'ground' : 'air';
    if (e['flight-tip'].dataset.mode !== tipMode) {
      e['flight-tip'].dataset.mode = tipMode;
      e['flight-tip'].innerHTML = tipMode === 'ground' ? 'Wing inflated. Hold <kbd>SPACE</kbd> to run into the air.' : 'Hold <kbd>SPACE</kbd> to climb. Release to glide. Tap a brake to feel the wing.';
    }
    const ctx = e['speed-tape'].getContext('2d'); ctx.clearRect(0, 0, 130, 12); ctx.fillStyle = '#ffffff35'; for (let i = 0; i < 26; i++) ctx.fillRect(i * 5, 4, 1, i % 5 === 0 ? 8 : 4); ctx.fillStyle = '#e0ec92'; ctx.fillRect(Math.min(128, s.airspeed * 3.6 / 65 * 130), 0, 2, 12);
    this.drawMap(s);
  }
  drawMap(s) {
    const ctx = this.mapCtx, project = (x, z) => [120 + x / 7000 * 240, 90 + z / 8500 * 180];
    ctx.drawImage(this.mapBase, 0, 0); ctx.strokeStyle = '#ffffff10'; ctx.lineWidth = 1;
    for (let x = 0; x < 240; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 180); ctx.stroke(); }
    for (let y = 0; y < 180; y += 36) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(240, y); ctx.stroke(); }
    const [hx, hz] = project(0, 700); ctx.strokeStyle = '#ecebc6'; ctx.strokeRect(hx - 3, hz - 5, 6, 10); ctx.font = '9px sans-serif'; ctx.fillStyle = '#d0d4c6'; ctx.fillText('FIELD', hx + 7, hz + 3); ctx.fillText('N ↑', 12, 17);
    if (s.time - this.lastTrail > 1) { this.mapTrail.push(project(s.x, s.z)); if (this.mapTrail.length > 700) this.mapTrail.shift(); this.lastTrail = s.time; }
    ctx.beginPath(); this.mapTrail.forEach(([x, z], i) => i ? ctx.lineTo(x, z) : ctx.moveTo(x, z)); ctx.strokeStyle = '#ddec8e88'; ctx.stroke();
    const [px, pz] = project(s.x, s.z); ctx.save(); ctx.translate(px, pz); ctx.rotate(s.heading); ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(4, 5); ctx.lineTo(0, 3); ctx.lineTo(-4, 5); ctx.closePath(); ctx.fillStyle = '#e4f38b'; ctx.fill(); ctx.restore();
  }
}
