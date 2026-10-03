import { FLOOR, WORLD, clamp, random } from './model.ts'
import type { Night } from './model.ts'

type Context = CanvasRenderingContext2D
const palette: Record<string, string> = {
  o: '#162439', w: '#eef7ff', s: '#abc9df', b: '#448be2', c: '#8ceafa', d: '#101e32',
  g: '#397565', l: '#7dba8a', h: '#ffe2bb', r: '#e98245', R: '#a84935', y: '#ffe9a3',
  p: '#b48ccc', v: '#674e92', f: '#eec399', n: '#614a58', t: '#986241', k: '#ffd29c',
}
const robot = [
  '      cc      ', '      ob      ', '   oooooooo   ', '  owwwwwwwso  ',
  ' owwwwwwwwwso ', ' owooddddooso ', ' owoodccdooso ', ' owoodccdooso ',
  ' owwddddddwso ', '  osswwwwsso  ', '   obbbbbo    ', '  wobbcboww   ',
  ' wwobbbbowww  ', ' ssooooooss   ', '   wwwssw     ', '   ww  sw     ',
  '  bbb  bbb    ',
]
const mother = [
  '       RRRR       ', '     RRrrrrRR     ', '    RrrkkkkrrR    ', '   RrrkkkkkkrrR   ',
  '   RrrkdkkdkrrR   ', '   RrrkkkkkkrrR   ', '   RRrkkhhkkrrR   ', '    RrrkkkkrrR    ',
  '    RRggkkggRR    ', '   RRgggllgggRR   ', '   RggggllggggR   ', '   gggggllggggg   ',
  '  hhhgggyyggghhh  ', '  hhggggllgggghh  ', '    ggggllgggg    ', '   gggggllggggg   ',
  '  ggggggllgggggg  ', '  ggggggllgggggg  ', '  gggggggggggggg  ', '   gggggggggggg   ',
  '     nn  nn       ', '    nnn  nnn      ',
]
const child = [
  '  rr   rr  ', '  rrrrrrr  ', ' rrrkkkrrr ', ' rrkdkkdrr ', '  rkkkkkr  ',
  '   kkkk    ', '  ppkkpp   ', ' hpppppph  ', ' hpppppph  ', '  pppppp   ',
  '   kk kk   ', '   nn nn   ',
]
const fox = [
  ' rr            ', ' rRr      rrr  ', ' rrRrrrrrrrrrR ', ' rrrrrrrrrrrrrR',
  ' rrnrrkkkkkrrrR', '  kkkkrrrrrrkR ', '   kkkkkkkkkk  ',
]
const owl = [' rr  rr ', 'rrrrrrrr', 'rkkrrkkr', 'rnnrrnnr', 'rrrkkrrr', ' rrrrrr ', '  n  n  ']
const deer = [' n   n         ', ' nn nn         ', '  nnn          ', '  ttt    tttt  ', ' tnttttttttttt ', ' kttttktktktttt', '  ttttttttttttt', '   ttttttttttt ', '    nn     nn  ']

function rect(c: Context, x: number, y: number, w: number, h: number, color: string) {
  c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), Math.ceil(w), Math.ceil(h))
}
function sprite(c: Context, pixels: string[], x: number, y: number, scale = 1, flip = false, flash = false) {
  c.save(); c.translate(Math.round(x), Math.round(y)); c.scale(flip ? -scale : scale, scale)
  const width = pixels[0].length
  for (let row = 0; row < pixels.length; row++) for (let col = 0; col < pixels[row].length; col++) {
    const color = palette[pixels[row][col]]
    if (color) rect(c, col - width / 2, row - pixels.length, 1, 1, flash ? '#fff5d4' : color)
  }
  c.restore()
}
function diamond(c: Context, x: number, y: number, radius: number, color: string) {
  for (let row = -radius; row <= radius; row++) {
    const width = radius - Math.abs(row)
    rect(c, x - width, y + row, width * 2 + 1, 1, color)
  }
}
function star(c: Context, x: number, y: number, color = '#ffe1a0', size = 1) {
  c.save(); c.translate(Math.round(x), Math.round(y)); c.scale(size, size)
  rect(c, -1, -6, 3, 13, color); rect(c, -6, -1, 13, 3, color)
  rect(c, -3, -3, 7, 7, color); rect(c, -1, -2, 2, 4, '#fff9df'); c.restore()
}
function pine(c: Context, x: number, base: number, height: number, color: string, detail = false) {
  const half = height * .23
  rect(c, x - 3, base - height * .8, 6, height * .8, detail ? '#344b43' : color)
  for (let i = 0; i < 7; i++) {
    const top = base - height + i * height * .11, spread = half * (.25 + i * .12), section = height * .24
    for (let row = 0; row < section; row += 3) {
      const ratio = row / section, branch = Math.floor(spread * ratio / 2) * 2, irregular = Math.sin(row * 2 + i) > .3 ? 3 : 0
      rect(c, x - branch - irregular, top + row, branch * 2 + irregular + 2, 3, color)
      if (detail && row > section * .55 && row % 9 === 0) {
        rect(c, x - branch + 2, top + row, Math.max(2, branch * .55), 1, '#2d5649')
        rect(c, x + branch * .35, top + row + 2, Math.max(1, branch * .45), 1, '#25483f')
      }
    }
  }
  if (detail) { rect(c, x - 1, base - 20, 1, 19, '#50705a'); rect(c, x - 6, base - 2, 14, 2, '#344b43') }
}
function glow(c: Context, x: number, y: number, radius: number, color: string) {
  const gradient = c.createRadialGradient(x, y, 0, x, y, radius)
  gradient.addColorStop(0, color); gradient.addColorStop(1, 'transparent')
  c.fillStyle = gradient; c.fillRect(x - radius, y - radius, radius * 2, radius * 2)
}

/** Pixel scene is rendered at a low native resolution, then enlarged with nearest-neighbour sampling. */
export class ForestArt {
  camera = 0
  private sky: { x: number; y: number; size: number; phase: number }[]
  private trees: { x: number; height: number }[]
  constructor() {
    const rng = random(8241)
    this.sky = Array.from({ length: 100 }, () => ({ x: rng() * 1100, y: rng() * 175, size: rng() > .9 ? 2 : 1, phase: rng() * 6 }))
    this.trees = Array.from({ length: 100 }, (_, i) => ({ x: i * 67 + rng() * 35, height: 80 + rng() * 140 }))
  }
  draw(c: Context, game: Night, width: number, height: number, time: number, reduced: boolean) {
    const preview = game.phase === 'ready'
    const target = clamp(game.player.x - width * .32, 0, WORLD - width)
    this.camera = preview ? 0 : target
    const cam = this.camera
    c.imageSmoothingEnabled = false
    const sky = c.createLinearGradient(0, 0, 0, FLOOR)
    sky.addColorStop(0, '#10182e'); sky.addColorStop(.45, '#34304e'); sky.addColorStop(.8, '#6a4b63'); sky.addColorStop(1, '#ac7771')
    c.fillStyle = sky; c.fillRect(0, 0, width, height)
    for (const dot of this.sky) {
      const x = ((dot.x - cam * .05) % (width + 40) + width + 40) % (width + 40)
      c.globalAlpha = .35 + .5 * (reduced ? .8 : (Math.sin(time * 1.2 + dot.phase) + 1) / 2)
      rect(c, x, dot.y, dot.size, dot.size, '#c6d4f1')
    }
    c.globalAlpha = 1
    const moonX = width * .75 - cam * .012, moonY = 51
    glow(c, moonX, moonY, 70, '#dbbfa322')
    for (let y = -18; y <= 18; y++) for (let x = -18; x <= 18; x++) {
      if (x * x + y * y <= 18 * 18 && (x + 7) ** 2 + (y + 5) ** 2 > 16 * 16) rect(c, moonX + x, moonY + y, 1, 1, x > 9 && y > 2 ? '#cfba9e' : '#efdab4')
    }
    if (!reduced) {
      const flight = (time * .13) % 1
      if (flight < .42) {
        const x = width * (1.12 - flight * 1.6), y = 18 + flight * 190
        for (let i = 18; i >= 0; i--) { c.globalAlpha = (1 - i / 19) * .7; rect(c, x + i * 3, y - i, 4, 1, '#beeaff') }
        c.globalAlpha = 1; star(c, x, y, '#edfcff', .55)
      }
    }
    for (let layer = 0; layer < 3; layer++) {
      const parallax = [.12, .27, .52][layer], colors = ['#303d50', '#233c42', '#173839']
      for (const tree of this.trees) {
        const x = tree.x - cam * parallax - 90
        if (x < -90 || x > width + 90) continue
        pine(c, x, FLOOR + 10, tree.height * (.72 + layer * .15), colors[layer], layer === 2)
      }
    }
    // Moonlit haze between distant trees and the playable forest floor.
    const haze = c.createLinearGradient(0, 160, 0, FLOOR)
    haze.addColorStop(0, '#a9c0a900'); haze.addColorStop(.75, '#a9c0a91a'); haze.addColorStop(1, '#a9c0a900')
    c.fillStyle = haze; c.fillRect(0, 160, width, FLOOR - 160)
    c.save(); c.translate(-Math.round(cam), 0)
    if (!reduced && game.shake > 0) c.translate(Math.sin(time * 80) * game.shake, Math.cos(time * 71) * game.shake * .5)
    const left = Math.floor(cam / 90) * 90
    for (let x = left; x < cam + width + 90; x += 90) {
      const variant = Math.abs(Math.floor(x / 90)) % 5
      if (variant === 1) { sprite(c, fox, x + 35, FLOOR - 1, 1.3); this.sleep(c, x + 37, FLOOR - 21, time) }
      if (variant === 3 && Math.floor(x / 90) % 3 === 0) { sprite(c, deer, x + 40, FLOOR, 1.3); this.sleep(c, x + 42, FLOOR - 25, time) }
      for (let j = 0; j < 4; j++) {
        const gx = x + j * 22, h = 3 + ((j * 7 + variant) % 9)
        rect(c, gx, FLOOR - h, 2, h, '#407361'); rect(c, gx - 2, FLOOR - h + 2, 2, 2, '#6b9778')
      }
      if (variant % 2 === 0) {
        rect(c, x + 60, FLOOR - 8, 2, 8, '#9cad98'); rect(c, x + 56, FLOOR - 10, 10, 3, '#88c7be')
        rect(c, x + 58, FLOOR - 12, 6, 2, '#b4e2cc'); glow(c, x + 61, FLOOR - 9, 18, '#82ffd016')
      }
      if (variant === 2) {
        rect(c, x + 30, FLOOR - 6, 18, 6, '#3a5351'); rect(c, x + 34, FLOOR - 9, 10, 4, '#4d6760'); rect(c, x + 34, FLOOR - 9, 8, 1, '#779182')
        for (let i = 0; i < 3; i++) { rect(c, x + 65 + i * 4, FLOOR - 6 - i % 2 * 4, 1, 7, '#5a896c'); rect(c, x + 64 + i * 4, FLOOR - 8 - i % 2 * 4, 3, 2, '#bb99b4') }
      }
    }
    for (const platform of game.platforms) {
      if (platform.x + platform.width < cam - 20 || platform.x > cam + width + 20) continue
      rect(c, platform.x + 6, platform.y + 4, platform.width - 10, 8, '#343837')
      rect(c, platform.x, platform.y, platform.width, 5, '#476d56'); rect(c, platform.x + 3, platform.y, platform.width - 8, 2, '#8dab70')
      for (let i = 6; i < platform.width; i += 16) { rect(c, platform.x + i, platform.y + 5, 2, 8 + i % 7, '#496957'); rect(c, platform.x + i - 2, platform.y + 9, 4, 2, '#628462') }
      if (Math.round(platform.x) % 3 === 1) { sprite(c, owl, platform.x + 60, platform.y, 1.2); this.sleep(c, platform.x + 62, platform.y - 20, time) }
    }
    for (const pickup of game.pickups) {
      if (pickup.collected || pickup.x < cam - 25 || pickup.x > cam + width + 25) continue
      const y = pickup.y + (reduced ? 0 : Math.sin(time * 2.5 + pickup.x) * 3)
      glow(c, pickup.x, y, pickup.value === 3 ? 23 : 14, pickup.value === 3 ? '#b5e9ff26' : '#ffcf7022')
      if (pickup.value === 3) for (let i = 1; i < 5; i++) rect(c, pickup.x + i * 4, y - i * 2, 3, 2, '#81b8d2')
      star(c, pickup.x, y, pickup.value === 3 ? '#b8efff' : '#ffdb8a', pickup.value === 3 ? 1 : .7)
    }
    for (const enemy of game.enemies) {
      if (enemy.health <= 0 || enemy.x < cam - 30 || enemy.x > cam + width + 30) continue
      const x = enemy.x, y = enemy.y
      if (!enemy.awake) {
        if (enemy.kind === 'star') star(c, x, FLOOR - 23, '#ffdb8a', .9)
        else { rect(c, x - 9, FLOOR - 2, 18, 3, '#51483f'); rect(c, x - 3, FLOOR - 3, 2, 2, '#d3a182') }
        continue
      }
      const base = enemy.hit ? '#fff3ce' : enemy.kind === 'star' ? '#d296e1' : '#6c779a'
      if (enemy.kind === 'star') { star(c, x, y - 13, base, 1.45); rect(c, x - 5, y - 17, 3, 4, '#44264b'); rect(c, x + 3, y - 17, 3, 4, '#44264b'); rect(c, x - 3, y - 9, 7, 2, '#fff3da') }
      else {
        diamond(c, x, y - 13, 13, '#26303d'); rect(c, x - 10, y - 22, 20, 20, base)
        rect(c, x - 7, y - 25, 5, 5, base); rect(c, x + 4, y - 25, 5, 5, base)
        rect(c, x - 6, y - 17, 4, 4, '#ffbca1'); rect(c, x + 3, y - 17, 4, 4, '#ffbca1')
        rect(c, x - 4, y - 8, 9, 3, '#272a41'); rect(c, x - 13, y - 5, 7, 5, '#485470'); rect(c, x + 6, y - 5, 7, 5, '#485470')
      }
      if (enemy.timer < .55) glow(c, x, y - 13, 20, '#ff90583a')
    }
    this.guardians(c, game, time)
    const p = game.player
    if (!(p.immune > 0 && Math.floor(time * 16) % 2 === 0)) {
      const bob = p.grounded && Math.abs(p.vx) > 10 ? Math.sin(time * 18) * 1.5 : Math.sin(time * 2) * .6
      glow(c, p.x, p.y - 13, 24 + game.power * 4, '#91dfff20')
      // A small blue scarf and running boots give the robot an animated silhouette.
      rect(c, p.x - p.facing * 14, p.y - 14 + bob, 12, 3, '#75c8e8')
      sprite(c, robot, p.x, p.y + bob, 1.5, p.facing < 0)
      if (!p.grounded) { rect(c, p.x - 5, p.y + 2, 3, 3 + Math.sin(time * 30) * 2, '#9deafa'); rect(c, p.x + 3, p.y + 2, 3, 4, '#ddf9ff') }
    }
    for (const bolt of game.bolts) {
      if (bolt.x < cam - 20 || bolt.x > cam + width + 20) continue
      glow(c, bolt.x, bolt.y, 16, bolt.friendly ? '#8eeaff30' : '#ff945c40')
      for (let i = 3; i >= 1; i--) rect(c, bolt.x - Math.sign(bolt.vx) * i * 3, bolt.y - 1, 4, 3, bolt.friendly ? '#45839f' : '#bb614b')
      diamond(c, bolt.x, bolt.y, bolt.friendly ? 3 : 5, bolt.friendly ? '#c7f8ff' : '#ffac68'); rect(c, bolt.x - 1, bolt.y - 1, 3, 3, '#fff2c7')
    }
    // Opaque terrain hides the roots as they emerge.
    rect(c, cam, FLOOR, width + 1, height - FLOOR, '#172d2e')
    rect(c, cam, FLOOR, width + 1, 3, '#658c66'); rect(c, cam, FLOOR + 3, width + 1, 4, '#3a5842')
    for (let x = Math.floor(cam / 13) * 13; x < cam + width + 13; x += 13) {
      const v = Math.abs(Math.floor(x / 13))
      rect(c, x, FLOOR + 8 + v % 13, 7, 2, '#30443c'); rect(c, x + 4, FLOOR + 33 + v % 9, 4, 2, '#273b35')
      if (v % 4 === 0) { rect(c, x, FLOOR + 5, 2, 10, '#74634c'); rect(c, x, FLOOR + 14, 7, 2, '#74634c') }
    }
    for (const mote of game.motes) { c.globalAlpha = Math.min(1, mote.life * 2); rect(c, mote.x, mote.y, 2, 2, mote.color) }
    c.globalAlpha = 1; c.restore()
    // Foreground fireflies and foliage frame the scene without covering hazards.
    for (let i = 0; i < 14; i++) {
      const x = ((i * 83 - cam * .8) % width + width) % width, y = 173 + Math.sin(i * 8 + (reduced ? 0 : time * .7)) * 42
      c.globalAlpha = .35 + Math.sin(time + i) * .2; glow(c, x, y, 8, '#d0ffa94a'); rect(c, x, y, 1, 1, '#e4ffc2')
    }
    c.globalAlpha = 1
    const shade = c.createLinearGradient(0, height - 28, 0, height)
    shade.addColorStop(0, '#0b1c2400'); shade.addColorStop(1, '#0b1c24bb'); c.fillStyle = shade; c.fillRect(0, height - 28, width, 28)
  }
  private sleep(c: Context, x: number, y: number, time: number) {
    c.fillStyle = '#a4b9b0'; c.font = '7px monospace'; c.fillText('z', Math.round(x), Math.round(y - Math.sin(time) * 2)); c.fillText('z', Math.round(x + 6), Math.round(y - 6))
  }
  private guardians(c: Context, game: Night, time: number) {
    const b = game.boss
    if (b.x < this.camera - 70 || b.x > this.camera + c.canvas.width + 70) return
    // Lantern arch and flowering garden behind the final encounter.
    rect(c, 4420, FLOOR - 101, 5, 101, '#443f40'); rect(c, 4550, FLOOR - 101, 5, 101, '#443f40'); rect(c, 4420, FLOOR - 103, 135, 5, '#615849')
    for (let i = 0; i < 5; i++) {
      const x = 4433 + i * 27; rect(c, x, FLOOR - 99, 1, 11 + i % 2 * 7, '#a39873'); glow(c, x, FLOOR - 85 + i % 2 * 7, 18, '#ffb67925'); diamond(c, x, FLOOR - 85 + i % 2 * 7, 4, '#ffd494')
    }
    sprite(c, mother, b.x, b.y, 2.25, false, b.hit > 0)
    sprite(c, child, b.x + 48, FLOOR + Math.sin(time * 3) * .5, 1.5)
    for (let i = 0; i < 4; i++) {
      const age = (time * .25 + i * .25) % 1, x = b.x + 47 - age * 30, y = FLOOR - 18 - age * 65
      c.strokeStyle = '#c0e5f280'; c.lineWidth = 1; c.beginPath(); c.arc(Math.round(x), Math.round(y), 3 + age * 4, 0, Math.PI * 2); c.stroke(); rect(c, x - 2, y - 2, 1, 1, '#e7faff')
    }
    if (b.shield) {
      glow(c, b.x, b.y - 27, 44, '#96d9ff26'); c.strokeStyle = '#a2d6f5aa'; c.lineWidth = 1; c.beginPath(); c.ellipse(b.x, b.y - 27, 32, 39, 0, 0, Math.PI * 2); c.stroke()
      star(c, b.x + Math.cos(time * 3) * 32, b.y - 27 + Math.sin(time * 3) * 39, '#e0f5ff', .5)
    }
  }
}
