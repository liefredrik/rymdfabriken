import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { terrainHeight, lakeDistance, LAKE_LEVEL, fbm, noise, random, smoothstep } from './math.js';
import { createTerrainGeometry } from './terrain.js';

const temp = new THREE.Object3D();
export class Environment {
  constructor(scene, quality = 'high') {
    this.scene = scene; this.obstacles = new Map();
    scene.fog = new THREE.FogExp2(0xb1c7cf, .00016);
    const sky = new Sky(); sky.scale.setScalar(450000);
    sky.material.uniforms.turbidity.value = 2.2;
    sky.material.uniforms.rayleigh.value = 2.6;
    sky.material.uniforms.mieCoefficient.value = .004;
    sky.material.uniforms.mieDirectionalG.value = .82;
    this.sunDirection = new THREE.Vector3(-.62, .38, -.68).normalize();
    sky.material.uniforms.sunPosition.value.copy(this.sunDirection);
    scene.add(sky);
    scene.add(new THREE.HemisphereLight(0xc4e3ff, 0x616145, 2.1));
    this.sun = new THREE.DirectionalLight(0xffedd0, 3.2);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    Object.assign(this.sun.shadow.camera, { left: -65, right: 65, top: 65, bottom: -65, near: 1, far: 450 });
    this.sun.shadow.bias = -.00015; this.sun.shadow.normalBias = .3;
    scene.add(this.sun, this.sun.target);
    this.createTerrain(quality); this.createWater(); this.createVegetation(quality);
    this.createAirfield(); this.createClouds(); this.createRoad();
  }
  addObstacle(x, z, radius, height) {
    const key = `${Math.floor(x / 40)},${Math.floor(z / 40)}`;
    if (!this.obstacles.has(key)) this.obstacles.set(key, []);
    this.obstacles.get(key).push({ x, z, radius, top: terrainHeight(x, z) + height });
  }
  collision(s) {
    const cx = Math.floor(s.x / 40), cz = Math.floor(s.z / 40);
    for (let x = cx - 1; x <= cx + 1; x++) for (let z = cz - 1; z <= cz + 1; z++) {
      for (const o of this.obstacles.get(`${x},${z}`) ?? []) if (s.y - .8 < o.top && Math.hypot(s.x - o.x, s.z - o.z) < o.radius + .5) return true;
    }
    return false;
  }
  createTerrain(quality) {
    const geo = createTerrainGeometry(quality === 'high' ? 440 : 280);
    const pos = geo.attributes.position, colors = new Float32Array(pos.count * 3), c = new THREE.Color();
    const meadow = new THREE.Color('#798455'), forest = new THREE.Color('#485e42'), rock = new THREE.Color('#88887b'), snow = new THREE.Color('#d6dfdf');
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i), h = terrainHeight(x, z);
      pos.setY(i, h);
      const n = fbm(x * .008, z * .008);
      c.copy(meadow).lerp(forest, smoothstep(.38, .75, n) * .7);
      c.lerp(rock, smoothstep(420, 1150, h + n * 350));
      c.lerp(snow, smoothstep(1280, 1620, h + n * 180));
      if (h < 30) c.set('#96937b');
      c.multiplyScalar(.84 + n * .32); c.toArray(colors, i * 3);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3)); geo.computeVertexNormals();
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
    const ctx = canvas.getContext('2d'), img = ctx.createImageData(512, 512), rng = random(8712);
    for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) {
      const i = (y * 512 + x) * 4;
      const coarse = noise(x * .032, y * .032), detail = noise(x * .17 + 17, y * .17);
      const value = 100 + coarse * 100 + detail * 36 + rng() * 19;
      img.data[i] = value; img.data[i + 1] = value; img.data[i + 2] = value * .96; img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    const texture = new THREE.CanvasTexture(canvas); texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(100, 100); texture.anisotropy = 8;
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, map: texture });
    // World-space detail persists between vertices, with rocky exposed slopes and
    // mottled grass. This adds meter-scale structure without a huge terrain mesh.
    mat.onBeforeCompile = shader => {
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 terrainWorld; varying vec3 terrainNormal;');
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nterrainWorld = position; terrainNormal = normal;');
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>
        varying vec3 terrainWorld; varying vec3 terrainNormal;
        float terrainHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float terrainNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(terrainHash(i),terrainHash(i+vec2(1,0)),f.x),mix(terrainHash(i+vec2(0,1)),terrainHash(i+vec2(1,1)),f.x),f.y);}`);
      shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
        float terrainDetail=terrainNoise(terrainWorld.xz*.13)*.55+terrainNoise(terrainWorld.xz*.53)*.28+terrainNoise(terrainWorld.xz*1.8)*.17;
        float rockMask=smoothstep(.15,.5,1.-terrainNormal.y)*smoothstep(180.,600.,terrainWorld.y);
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.26,.265,.235),rockMask*.7);
        diffuseColor.rgb*=.73+terrainDetail*.55;`);
    };
    const mesh = new THREE.Mesh(geo, mat); mesh.name = 'terrain'; mesh.receiveShadow = true; this.scene.add(mesh);
    // Cultivated meadow patches follow the same height function as the collision surface.
    const rng2 = random(336);
    for (let n = 0; n < 54; n++) {
      const x = (rng2() - .5) * 2000, z = (rng2() - .5) * 6500;
      if (lakeDistance(x, z) < 1.25 || Math.hypot(x / 320, (z - 700) / 700) < 1.2) continue;
      const w = 90 + rng2() * 190, d = 100 + rng2() * 240;
      const p = new THREE.PlaneGeometry(w, d, 9, 9); p.rotateX(-Math.PI / 2);
      const a = p.attributes.position;
      for (let i = 0; i < a.count; i++) { const px = a.getX(i) + x, pz = a.getZ(i) + z; a.setXYZ(i, px, terrainHeight(px, pz) + .45, pz); }
      p.computeVertexNormals();
      const m = new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(.16 + rng2() * .07, .2 + rng2() * .15, .25 + rng2() * .13), roughness: 1, map: texture });
      const patch = new THREE.Mesh(p, m); patch.receiveShadow = true; this.scene.add(patch);
    }
  }
  createWater() {
    this.water = new THREE.Mesh(new THREE.PlaneGeometry(14000, 14000), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { time: { value: 0 }, sun: { value: this.sunDirection } },
      vertexShader: `varying vec3 vWorld; void main(){vec4 w=modelMatrix*vec4(position,1.);vWorld=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
      fragmentShader: `varying vec3 vWorld; uniform float time; uniform vec3 sun;
        void main(){vec3 v=normalize(cameraPosition-vWorld); float w=sin(vWorld.x*.12+vWorld.z*.17+time*.65)*.012+sin(vWorld.z*.24+time*.8+sin(vWorld.x*.075)*3.)*.009;
        vec3 n=normalize(vec3(w,1.,cos(vWorld.z*.09+vWorld.x*.13+time+sin(vWorld.z*.11))*.018));
        float fres=pow(1.-max(dot(v,n),0.),3.);float glint=pow(max(dot(reflect(-sun,n),v),0.),170.);
        vec3 col=mix(vec3(.085,.25,.26),vec3(.48,.63,.68),fres*.8)+vec3(1.,.88,.65)*glint*.95;
        gl_FragColor=vec4(col,.96); #include <tonemapping_fragment> \n #include <colorspace_fragment> }`.replace('; #include', ';\n #include'),
    }));
    this.water.rotation.x = -Math.PI / 2; this.water.position.y = LAKE_LEVEL; this.scene.add(this.water);
  }
  createVegetation(quality) {
    const rng = random(9321), trees = [], rocks = [];
    for (let i = 0; i < (quality === 'high' ? 36000 : 18000); i++) {
      const near = i % 3 !== 0;
      const x = (rng() - .5) * (near ? 4500 : 10000), z = (rng() - .5) * (near ? 8000 : 11000), h = terrainHeight(x, z);
      const airport = Math.hypot(x / 330, (z - 700) / 780) < 1.2;
      if (h < LAKE_LEVEL + 5 || h > 1180 || airport || Math.abs(x - this.roadX(z)) < 15) continue;
      if (noise(x * .003 + 7, z * .003) < .51) continue;
      const scale = 7 + rng() * 12;
      trees.push({ x, z, h, scale, r: rng() });
      this.addObstacle(x, z, scale * .19, scale);
    }
    const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(.11, .19, 1, 5), new THREE.MeshStandardMaterial({ color: 0x625447, roughness: 1 }), trees.length);
    const foliageGeo = new THREE.BufferGeometry();
    const layers = [];
    for (let j = 0; j < 3; j++) { const g = new THREE.ConeGeometry(.27 - j * .058, .57 - j * .1, 7); g.translate(0, .42 + j * .2, 0); layers.push(g.toNonIndexed()); }
    const vertices = [], normals = [];
    for (const g of layers) { vertices.push(...g.attributes.position.array); normals.push(...g.attributes.normal.array); }
    foliageGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); foliageGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    const crowns = new THREE.InstancedMesh(foliageGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 }), trees.length);
    const color = new THREE.Color();
    trees.forEach((t, i) => {
      temp.position.set(t.x, t.h + t.scale * .23, t.z); temp.scale.set(t.scale * .45, t.scale * .46, t.scale * .45); temp.rotation.set(0, t.r * 6.28, 0); temp.updateMatrix(); trunks.setMatrixAt(i, temp.matrix);
      temp.position.y = t.h; temp.scale.setScalar(t.scale); temp.updateMatrix(); crowns.setMatrixAt(i, temp.matrix);
      color.setHSL(.27 + t.r * .055, .19 + t.r * .16, .15 + t.r * .07); crowns.setColorAt(i, color);
    });
    crowns.castShadow = true; crowns.receiveShadow = true; this.scene.add(trunks, crowns);
    for (let i = 0; i < 550; i++) { const x = (rng() - .5) * 9000, z = (rng() - .5) * 9500, h = terrainHeight(x, z); if (h > 180 && h < 1600) rocks.push({ x, z, h, s: 2 + rng() * 10 }); }
    const rock = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: '#85847a', roughness: 1 }), rocks.length);
    rocks.forEach((r, i) => { temp.position.set(r.x, r.h, r.z); temp.rotation.set(r.x, r.z, 0); temp.scale.set(r.s, r.s * .6, r.s * .8); temp.updateMatrix(); rock.setMatrixAt(i, temp.matrix); }); this.scene.add(rock);
  }
  roadX(z) { return -640 + Math.sin(z * .0014) * 100; }
  createRoad() {
    const p = [], indices = [];
    for (let i = 0; i <= 300; i++) { const z = -5500 + i / 300 * 11000; for (const dx of [-3.2, 3.2]) { const x = this.roadX(z) + dx; p.push(x, terrainHeight(x, z) + .5, z); } if (i < 300) { const a = i * 2; indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setIndex(indices); g.computeVertexNormals();
    this.scene.add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: '#777873', roughness: 1 })));
  }
  createAirfield() {
    const ground = 34;
    const mat = new THREE.MeshStandardMaterial({ color: '#9a9c69', roughness: 1 });
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(32, 470), mat); strip.rotation.x = -Math.PI / 2; strip.position.set(0, ground + .16, 700); strip.receiveShadow = true; this.scene.add(strip);
    const white = new THREE.MeshStandardMaterial({ color: '#eee9d4', roughness: 1 });
    for (let z = 485; z <= 915; z += 43) for (const x of [-17, 17]) { const m = new THREE.Mesh(new THREE.BoxGeometry(1.5, .18, 3), white); m.position.set(x, ground + .2, z); this.scene.add(m); }
    const target = new THREE.Mesh(new THREE.RingGeometry(11.5, 12.3, 64), white); target.rotation.x = -Math.PI / 2; target.position.set(65, ground + .2, 700); this.scene.add(target);
    for (const [x, z, w, d] of [[-105, 700, 26, 20], [-120, 740, 14, 18], [-105, 660, 12, 16]]) {
      const h = terrainHeight(x, z), building = new THREE.Mesh(new THREE.BoxGeometry(w, 7, d), new THREE.MeshStandardMaterial({ color: '#d2c9b5', roughness: .9 }));
      building.position.set(x, h + 3.5, z); building.castShadow = true; building.receiveShadow = true; this.scene.add(building);
      const roof = new THREE.Mesh(new THREE.CylinderGeometry(w * .72, w * .72, d + 2, 3), new THREE.MeshStandardMaterial({ color: '#655c52', roughness: .8 })); roof.rotation.set(Math.PI / 2, 0, Math.PI / 2); roof.position.set(x, h + 7.8, z); this.scene.add(roof);
      this.addObstacle(x, z, Math.max(w, d) * .6, 10);
    }
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.06, .08, 7, 8), white); pole.position.set(42, ground + 3.5, 860); this.scene.add(pole);
    this.sock = new THREE.Group(); this.sock.position.set(42, ground + 6.6, 860);
    for (let i = 0; i < 5; i++) { const seg = new THREE.Mesh(new THREE.CylinderGeometry(.33 - i * .046, .33 - (i + 1) * .046, .42, 12, 1, true), new THREE.MeshStandardMaterial({ color: i % 2 ? '#efead6' : '#e56e32', side: THREE.DoubleSide })); seg.rotation.x = Math.PI / 2; seg.position.z = i * .42; this.sock.add(seg); }
    this.scene.add(this.sock);
  }
  createClouds() {
    const rng = random(557);
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256; const ctx = canvas.getContext('2d');
    for (let i = 0; i < 45; i++) { const x = 48 + rng() * 160, y = 92 + rng() * 80, r = 18 + rng() * 45; const grad = ctx.createRadialGradient(x, y, 0, x, y, r); grad.addColorStop(0, 'rgba(255,255,250,.28)'); grad.addColorStop(.5, 'rgba(244,247,244,.14)'); grad.addColorStop(1, 'rgba(235,242,244,0)'); ctx.fillStyle = grad; ctx.fillRect(x - r, y - r, r * 2, r * 2); }
    const map = new THREE.CanvasTexture(canvas);
    for (let i = 0; i < 48; i++) { const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map, color: '#fffcf3', transparent: true, opacity: .55 + rng() * .3, depthWrite: false, fog: false, toneMapped: false })); sprite.position.set((rng() - .5) * 17000, 1700 + rng() * 700, (rng() - .5) * 16000); const w = 600 + rng() * 1400; sprite.scale.set(w, w * .46, 1); this.scene.add(sprite); }
  }
  update(s, time) {
    this.water.material.uniforms.time.value = time;
    this.sun.position.set(s.x, s.y, s.z).addScaledVector(this.sunDirection, 180); this.sun.target.position.set(s.x, s.y, s.z);
    this.sock.rotation.y = Math.atan2(s.wind.x, s.wind.z); this.sock.rotation.x = Math.sin(time * 3) * .06;
  }
}
