import * as THREE from 'three';
import { clamp } from './math.js';

const v = new THREE.Vector3();
const material = (color, roughness = .8, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
function mesh(parent, geometry, mat, position, scale) {
  const m = new THREE.Mesh(geometry, mat); if (position) m.position.set(...position); if (scale) m.scale.set(...scale); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
function rod(parent, a, b, radius, mat) {
  const av = new THREE.Vector3(...a), bv = new THREE.Vector3(...b), d = bv.clone().sub(av);
  const m = mesh(parent, new THREE.CylinderGeometry(radius, radius, d.length(), 8), mat);
  m.position.copy(av.add(bv).multiplyScalar(.5)); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return m;
}
export class Aircraft {
  constructor(scene) {
    this.root = new THREE.Group(); scene.add(this.root);
    this.wing = new THREE.Group(); this.root.add(this.wing);
    this.pilot = new THREE.Group(); this.root.add(this.pilot);
    this.createWing(); this.createPilot(); this.createLines();
  }
  wingPoint(u, t, underside = false, state = null) {
    const edge = Math.abs(u), chord = 2.95 * Math.sqrt(1 - .68 * u * u);
    const x = u * 4.375;
    const brake = state ? (u < 0 ? state.leftBrake : state.rightBrake) : 0;
    const cell = Math.sin((u + 1) * .5 * 40 * Math.PI) ** 2;
    const billow = Math.sin(Math.PI * t) ** .7;
    const thickness = (underside ? -.045 : .27 + cell * .045) * billow * (1 - edge * .4);
    const deflection = brake * .48 * Math.max(0, (t - .55) / .45) ** 2 * (.55 + edge * .45);
    const stall = state ? (u < 0 ? state.leftStall : state.rightStall) ?? state.stall : 0;
    return new THREE.Vector3(x * (1 - stall * edge * .12), 6.8 - 1.9 * edge ** 2.15 + thickness - deflection - stall * edge * .55, (t - .46) * chord + edge ** 2 * .48 + stall * .3 * Math.sin(u * 8 + (state?.time ?? 0) * 3));
  }
  createWing() {
    this.panels = [];
    const lime = material('#d8ec73', .63), ivory = material('#f1efdf', .72), charcoal = material('#26373b', .6);
    for (const m of [lime, ivory, charcoal]) { m.side = THREE.DoubleSide; }
    for (let cell = 0; cell < 40; cell++) {
      const u0 = cell / 40 * 2 - 1, u1 = (cell + 1) / 40 * 2 - 1;
      for (let underside = 0; underside < 2; underside++) {
        const positions = [], indices = [], coordinates = [];
        for (let j = 0; j <= 16; j++) for (let k = 0; k <= 2; k++) { const u = u0 + (u1 - u0) * k / 2, t = j / 16; positions.push(...this.wingPoint(u, t, !!underside).toArray()); coordinates.push([u, t, !!underside]); }
        for (let j = 0; j < 16; j++) for (let k = 0; k < 2; k++) { const a = j * 3 + k; indices.push(a, a + 3, a + 1, a + 1, a + 3, a + 4); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); g.setIndex(indices); g.computeVertexNormals();
        // Deliberate graphic pattern: charcoal tips, pale outer panels, chartreuse center.
        const mat = cell < 3 || cell > 36 ? charcoal : cell < 8 || cell > 31 ? ivory : lime;
        const m = mesh(this.wing, g, mat); this.panels.push({ mesh: m, coordinates });
      }
    }
    const lines = new Float32Array(41 * 17 * 2 * 3);
    this.seamGeometry = new THREE.BufferGeometry(); this.seamGeometry.setAttribute('position', new THREE.BufferAttribute(lines, 3));
    this.seams = new THREE.LineSegments(this.seamGeometry, new THREE.LineBasicMaterial({ color: '#657545', transparent: true, opacity: .35 })); this.wing.add(this.seams);
    // Brand is a local canvas asset, with no external font or texture dependency.
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128; const ctx = canvas.getContext('2d'); ctx.fillStyle = '#243331'; ctx.font = 'bold 92px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('A E R', 256, 98);
    const label = new THREE.Mesh(new THREE.PlaneGeometry(1.6, .4), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    label.rotation.x = Math.PI / 2; label.position.set(0, 6.745, .48); this.wing.add(label);
  }
  createPilot() {
    const fabric = material('#273b40'), suit = material('#b46a41'), dark = material('#182329'), metal = material('#a6b1b0', .33, .75), skin = material('#c49a77'), boot = material('#242b2d');
    mesh(this.pilot, new THREE.SphereGeometry(.32, 20, 16), fabric, [0, .05, .04], [1.12, .55, 1.35]);
    mesh(this.pilot, new THREE.SphereGeometry(.3, 20, 16), fabric, [0, .35, .16], [1.05, 1.75, .8]);
    mesh(this.pilot, new THREE.SphereGeometry(.27, 24, 20), suit, [0, .56, -.02], [1.12, 1.5, .83]);
    mesh(this.pilot, new THREE.SphereGeometry(.19, 24, 20), material('#eee8d3', .3), [0, 1.12, -.065], [1, 1.12, 1.08]);
    mesh(this.pilot, new THREE.SphereGeometry(.18, 24, 16), material('#253c43', .15, .45), [0, 1.13, -.14], [.88, .57, .88]);
    for (const side of [-1, 1]) {
      rod(this.pilot, [side * .15, 0, -.08], [side * .22, -.13, -.55], .115, dark);
      rod(this.pilot, [side * .22, -.13, -.55], [side * .22, -.65, -.77], .085, fabric);
      mesh(this.pilot, new THREE.SphereGeometry(.13, 16, 12), boot, [side * .22, -.69, -.84], [.78, .67, 1.5]);
      rod(this.pilot, [side * .22, .72, -.02], [side * .16, .02, -.22], .025, dark);
      rod(this.pilot, [side * .29, .15, .02], [side * .4, .4, .03], .025, metal);
    }
    this.arms = [];
    for (const side of [-1, 1]) {
      const arm = new THREE.Group(); this.pilot.add(arm);
      const upper = mesh(arm, new THREE.CylinderGeometry(.085, .09, 1, 12), suit);
      const lower = mesh(arm, new THREE.CylinderGeometry(.065, .075, 1, 12), suit);
      const hand = mesh(arm, new THREE.SphereGeometry(.072, 12, 10), skin);
      this.arms.push({ side, upper, lower, hand });
    }
    // Cage, safety net, engine block, fuel tank, exhaust and spinning wooden propeller.
    const motor = new THREE.Group(); this.pilot.add(motor);
    for (const z of [.46, .66]) mesh(motor, new THREE.TorusGeometry(.79, .016, 8, 72), metal, [0, .34, z]);
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2, x = Math.cos(a) * .78, y = .34 + Math.sin(a) * .78;
      rod(motor, [0, .34, .47], [x, y, .47], .006, dark);
      if (i % 3 === 0) rod(motor, [0, .25, .32], [x, y, .65], .013, metal);
      rod(motor, [x, y, .46], [x, y, .66], .009, metal);
    }
    for (const radius of [.25, .42, .59, .71]) mesh(motor, new THREE.TorusGeometry(radius, .003, 4, 48), dark, [0, .34, .47]);
    mesh(motor, new THREE.BoxGeometry(.32, .37, .24), dark, [0, .37, .31]);
    for (let i = 0; i < 8; i++) mesh(motor, new THREE.BoxGeometry(.35, .014, .25), metal, [0, .28 + i * .03, .31]);
    mesh(motor, new THREE.SphereGeometry(.2, 16, 12), material('#e0d7b8', .4), [0, -.28, .34], [1.1, .78, .67]);
    rod(motor, [.23, .3, .28], [.34, -.12, .33], .072, metal);
    this.propeller = new THREE.Group(); this.propeller.position.set(0, .34, .59); motor.add(this.propeller);
    mesh(this.propeller, new THREE.SphereGeometry(.095, 12, 12), metal, [0, 0, 0], [1, 1, .5]);
    for (const sign of [-1, 1]) { const blade = mesh(this.propeller, new THREE.SphereGeometry(1, 16, 10), material('#6b4631', .4), [0, sign * .34, 0], [.055, .36, .017]); blade.rotation.z = sign * .1; }
    this.propBlur = mesh(motor, new THREE.CircleGeometry(.69, 64), new THREE.MeshBasicMaterial({ color: '#928b79', transparent: true, opacity: .07, side: THREE.DoubleSide, depthWrite: false }), [0, .34, .6]);
  }
  createLines() {
    this.lineGeometry = new THREE.BufferGeometry(); this.lineGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(300 * 6), 3));
    this.root.add(new THREE.LineSegments(this.lineGeometry, new THREE.LineBasicMaterial({ color: '#c3c6b9', transparent: true, opacity: .43 })));
  }
  update(s, dt) {
    this.root.position.set(s.x, s.y, s.z); this.root.rotation.set(0, -s.heading, 0);
    this.wing.rotation.set(s.pitch * .35, 0, -s.bank);
    this.pilot.position.set(s.weight * .16 + Math.sin(s.lateralSwing) * 1.2, 0, -Math.sin(s.swing) * 1.8);
    this.pilot.rotation.set(-s.swing * .7, 0, -s.bank * .72 - s.weight * .16 + s.lateralSwing);
    for (const { mesh: m, coordinates } of this.panels) {
      const pos = m.geometry.attributes.position;
      for (let i = 0; i < coordinates.length; i++) { const [u, t, under] = coordinates[i]; const p = this.wingPoint(u, t, under, s); pos.setXYZ(i, p.x, p.y, p.z); }
      pos.needsUpdate = true; m.geometry.computeVertexNormals();
    }
    let offset = 0; const seams = this.seamGeometry.attributes.position.array;
    for (let i = 0; i <= 40; i++) for (let j = 0; j < 17; j++) {
      for (const t of [j / 17, (j + 1) / 17]) { const p = this.wingPoint(i / 20 - 1, t, true, s); seams[offset++] = p.x; seams[offset++] = p.y - .007; seams[offset++] = p.z; }
    }
    this.seamGeometry.attributes.position.needsUpdate = true;
    this.propeller.rotation.z += s.rpm / 2.68 * Math.PI / 30 * dt; this.propBlur.material.opacity = .03 + s.throttle * .09;
    for (const arm of this.arms) {
      const brake = arm.side < 0 ? s.leftBrake : s.rightBrake;
      const shoulder = new THREE.Vector3(arm.side * .25, .79, -.02);
      const elbow = new THREE.Vector3(arm.side * .44, .77 - brake * .45, -.06);
      const hand = new THREE.Vector3(arm.side * .43, 1.2 - brake * .95, -.15);
      for (const [m, a, b] of [[arm.upper, shoulder, elbow], [arm.lower, elbow, hand]]) { m.position.copy(a).add(b).multiplyScalar(.5); v.copy(b).sub(a); m.scale.y = v.length(); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize()); }
      arm.hand.position.copy(hand);
    }
    this.wing.updateMatrix(); this.pilot.updateMatrix();
    const array = this.lineGeometry.attributes.position.array; let n = 0;
    const segment = (a, b) => { a.toArray(array, n); b.toArray(array, n + 3); n += 6; };
    for (const side of [-1, 1]) for (let row = 0; row < 3; row++) {
      const attachment = new THREE.Vector3(side * .36, .45, -.07 + row * .075).applyMatrix4(this.pilot.matrix);
      const riser = new THREE.Vector3(side * .43, 1.65, -.13 + row * .16).applyMatrix4(this.pilot.matrix);
      segment(attachment, riser);
      for (let branch = 0; branch < 3; branch++) {
        const u = side * (.14 + branch * .29), t = .14 + row * .29;
        const anchor = this.wingPoint(u, t, true, s).applyMatrix4(this.wing.matrix);
        const junction = riser.clone().lerp(anchor, .6); segment(riser, junction);
        for (const delta of [-.09, 0, .09]) segment(junction, this.wingPoint(clamp(u + delta, -.97, .97), t, true, s).applyMatrix4(this.wing.matrix));
      }
    }
    for (const arm of this.arms) {
      const hand = arm.hand.position.clone().applyMatrix4(this.pilot.matrix);
      const junction = hand.clone().lerp(this.wingPoint(arm.side * .65, 1, true, s).applyMatrix4(this.wing.matrix), .7);
      segment(hand, junction);
      for (let i = 0; i < 6; i++) segment(junction, this.wingPoint(arm.side * (.15 + i * .15), 1, true, s).applyMatrix4(this.wing.matrix));
    }
    this.lineGeometry.setDrawRange(0, n / 3); this.lineGeometry.attributes.position.needsUpdate = true;
    this.lineGeometry.computeBoundingSphere();
  }
}
