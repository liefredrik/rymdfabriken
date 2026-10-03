// All art is drawn here as pixel strings and baked to canvases at start-up. No image files.

export const PAL: Record<string, string> = {
  K: '#0d0b16', // outline
  W: '#f7f8fc', // white
  w: '#cfd6e6', // light grey
  G: '#7d879c', // grey
  g: '#454c60', // dark grey
  B: '#1d2d64', // visor navy
  b: '#4db5ff', // blue
  C: '#9ff7ff', // cyan
  Y: '#ffd166', // star yellow
  y: '#fff6c7', // pale yellow
  O: '#ff8c42', // orange
  o: '#ffb347', // light orange
  R: '#e63946', // red
  r: '#ff7b7b', // light red
  D: '#7a1427', // dark red
  P: '#7b3fb8', // purple
  p: '#b57ce8', // light purple
  M: '#3a1d5c', // dark purple
  Q: '#3e4a2c', // moss body
  q: '#5f7140', // moss light
  F: '#7a4a2a', // brown
  f: '#b57a48', // light brown
  T: '#3f2416', // dark brown
  H: '#d6451c', // red hair
  h: '#f5804a', // red hair highlight
  S: '#f8d9bf', // skin
  s: '#e3b593', // skin shadow
  E: '#2a9d8f', // teal dress
  e: '#5fd0c0', // teal light
  I: '#ff7fa8', // pink
  i: '#ffc2d6', // light pink
  N: '#1f5d3a', // green
  n: '#3f9a5a', // light green
}

export type SpriteDef = { rows: string[]; pal?: Record<string, string> }

const PLAYER_HEAD_BODY = [
  '.....KKKK.....',
  '...KKWWWWKK...',
  '..KWWWWWWWWK..',
  '..KWKBBBBKWK..',
  '.KWKBbbBBBKWK.',
  '.KWKBbBBBBKWK.',
  '.KWWKBBBBKWWK.',
  '..KWWKKKKWWK..',
  '..KGWWWWWWGK..',
  '.KGKWWCCWWKGK.',
  '.KGK.WWWW.KGK.',
  '.KKK.KWWK.KKK.',
  '.....KWWK.....',
]

const LEGS: Record<string, string[]> = {
  stand: ['....KGKKGK....', '....KGKKGK....', '....KgKKgK....', '...KwwKKwwK...', '...KKKKKKKK...'],
  run1: ['...KGK..KGK...', '..KGK....KGK..', '..KgK....KgK..', '.KwwK....KwwK.', '.KKKK....KKKK.'],
  run3: ['....KGK.KGK...', '...KGK..KgK...', '..KgK..KwwK...', '.KwwK..KKKK...', '.KKKK.........'],
  jump: ['...KGK..KGK...', '...KgK...KgK..', '..KwwK...KwwK.', '..KKKK...KKKK.', '..............'],
  hurt: ['...KGKKKKGK...', '..KGK....KGK..', '..KgK....KgK..', '.KwwK....KwwK.', '.KKKK....KKKK.'],
}

function playerFrame(legs: string): SpriteDef {
  return { rows: [...PLAYER_HEAD_BODY, ...LEGS[legs]!] }
}

export const DEFS = {
  player_stand: playerFrame('stand'),
  player_run1: playerFrame('run1'),
  player_run2: playerFrame('stand'),
  player_run3: playerFrame('run3'),
  player_jump: playerFrame('jump'),
  player_hurt: playerFrame('hurt'),

  monster_star: {
    rows: [
      '......K......',
      '.....KPK.....',
      '.....KpK.....',
      '....KPpPK....',
      'KKKKKPpPKKKKK',
      '.KPPPPpPPPPK.',
      '..KPPPPPPPK..',
      '..KPRPpPRPK..',
      '...KPPPPPK...',
      '...KPWWWPK...',
      '..KPPKKKPPK..',
      '.KPPK...KPPK.',
      '.KKK.....KKK.',
    ],
  },

  star: {
    rows: [
      '....Y....',
      '....Y....',
      '...YyY...',
      'YYYyWyYYY',
      '.YyyWyyY.',
      '..YyyyY..',
      '..YyyyY..',
      '.YY...YY.',
      'Y.......Y',
    ],
  },

  star_small: {
    rows: ['..Y..', '.YyY.', 'YyWyY', '.YyY.', 'Y.Y.Y'],
  },

  mole_closed: {
    rows: [
      '.....KKKKKK.....',
      '...KKQqqqqQKK...',
      '..KQqQQQQQQqQK..',
      '.KQQYKQQQQKYQQK.',
      '.KQQYYQQQQYYQQK.',
      'KQQQQQQQQQQQQQQK',
      'KQQQQQQQQQQQQQQK',
      'KQQKKKKKKKKKKQQK',
      'KQQQQqQQQQqQQQQK',
      'KQQQQQQQQQQQQQQK',
      '.KQQQQQQQQQQQQK.',
      '.KQQQQQQQQQQQQK.',
      '..KQQQQQQQQQQK..',
      '...KKKKKKKKKK...',
    ],
  },

  mole_open: {
    rows: [
      '.....KKKKKK.....',
      '...KKQqqqqQKK...',
      '..KQqQQQQQQqQK..',
      '.KQQYKQQQQKYQQK.',
      '.KQQYYQQQQYYQQK.',
      'KQQQQQQQQQQQQQQK',
      'KQKKKKKKKKKKKKQK',
      'KQKWDWDWDWDWDKQK',
      'KQKDDDDDDDDDDKQK',
      'KQKDWDWDWDWDWKQK',
      '.KQKKKKKKKKKKQK.',
      '.KQQQQQQQQQQQQK.',
      '..KQQQQQQQQQQK..',
      '...KKKKKKKKKK...',
    ],
  },

  fox: {
    rows: [
      '......KK...KK.....',
      '......KOK.KOK.....',
      '.....KOOOKOOOK....',
      '....KOOOOOOOOOK...',
      '...KOOKOOOKOOOOKK.',
      '..KOOOOOOOOOOOOWWK',
      '.KOOOOOOOOOOOOWWWK',
      '.KOOOOOOOOOOOKKWKK',
      '..KKKKKKKKKKK..KK.',
    ],
  },

  rabbit: {
    rows: [
      '..KK..KK..',
      '..KwK.KwK.',
      '..KwwKwwK.',
      '.KwwwwwwwK',
      'KwwKwwwKwK',
      'KwwwwwwwwK',
      'KwwwwwwwwK',
      '.KwwwwwwK.',
      '..KKKKKK..',
    ],
  },

  owl: {
    rows: [
      '.KK..KK.',
      'KFFKKFFK',
      'KFFFFFFK',
      'KKKFFKKK',
      'KFFoOFFK',
      'KFfffffK',
      'KFfFfFfK',
      'KFfffffK',
      'KFfFfFfK',
      '.KFFFFK.',
      '..KKKK..',
    ],
  },

  bear: {
    rows: [
      '.KK......KKKKKKKK.....',
      'KTTKKK.KKTTTTTTTTKK...',
      'KTTTTTKTTTTTTTTTTTTK..',
      'KTTTTTTTTTTTTTTTTTTTK.',
      'KTKKTTTTTTTTTTTTTTTTTK',
      'KTfffTTTTTTTTTTTTTTTTK',
      'KTfKfTTTTTTTTTTTTTTTTK',
      'KTfffTTTTTTTTTTTTTTTTK',
      '.KTTTTTTTTTTTTTTTTTTTK',
      '..KTTTTTTTTTTTTTTTTTK.',
      '...KTTTKKKKKKKKKTTTK..',
      '....KKK.........KKK...',
    ],
  },

  hedgehog: {
    rows: [
      '....KKKKKKK.',
      '...KgKgKgKgK',
      '..KgKgKgKgKK',
      '.KfKgKgKgKgK',
      'KffffggggggK',
      'KKffffffffK.',
      '.KKKKKKKKK..',
    ],
  },

  mum_idle: {
    rows: [
      '........KKKKKKKK........',
      '......KKHHHHHHHHKK......',
      '.....KHHHHHHHHHHHHK.....',
      '....KHHHhHHHHHHhHHHK....',
      '....KHHHHHHHHHHHHHHK....',
      '...KHHHKSSSSSSSSKHHHK...',
      '...KHHKSSSSSSSSSSKHHK...',
      '...KHHKSKbSSSSbKSKHHK...',
      '...KHHKSSSSSSSSSSKHHK...',
      '...KHHKSSSSsSSSSSKHHK...',
      '...KHHKSSSRRRSSSSKHHK...',
      '...KHHKSSSSSSSSSSKHHK...',
      '...KHHHKSSSSSSSSKHHHK...',
      '..KHHHHHKKSSKKHHHHHK....',
      '..KHHHHKEEESSEEEKHHHHK..',
      '.KHHHHKEEEEEEEEEEKHHHHK.',
      '.KHHHHKEEEEEEEEEEKHHHHK.',
      '.KHHHKSKEEEEEEEEKSKHHHK.',
      '.KHHHKSKEEEEEEEEKSKHHHK.',
      '.KHHHKSKEEEEEEEEKSKHHHK.',
      '.KHHHKSKEEEEEEEEKSKHHHK.',
      '.KHHHKSKEEEEEEEEKSKHHHK.',
      '.KHHHKSKEEEEEEEEKSKHHHK.',
      '.KHHKSSKEEEEEEEEKSSKHHK.',
      '.KHHKSSKEEEEEEEEKSSKHHK.',
      '..KHKKKKEEEEEEEEKKKKHK..',
      '..KKK.KEEEEEEEEEEK.KKK..',
      '......KEEEEEEEEEEK......',
      '.....KEEEEEEEEEEEEK.....',
      '.....KEEEEEEEEEEEEK.....',
      '....KEEEEEEEEEEEEEEK....',
      '....KEEEeEEEEEEEeEEK....',
      '...KEEEEEEEEEEEEEEEEK...',
      '...KEEEEEEEEEEEEEEEEK...',
      '..KEEEEEEEEEEEEEEEEEEK..',
      '..KEEEEEEEEEEEEEEEEEEK..',
      '..KKKKKKKKKKKKKKKKKKKK..',
      '.....KSSK....KSSK.......',
      '....KKKKK...KKKKK.......',
    ],
  },

  mum_arm_up: {
    rows: ['...KSSK', '..KSSK.', '..KSK..', '.KSK...', '.KSK...', 'KSSK...', 'KSSK...'],
  },

  girl_1: {
    rows: [
      '...KKKKKK...',
      '..KHHHHHHK..',
      '.KHHHhHHHHK.',
      'KHKHHHHHHKHK',
      'KHKSSSSSSKHK',
      'KHKSKSSKSKHK',
      'KHKSSSSSSKHK',
      'KKKSSRRSSKKK',
      '...KSSSSK...',
      '..KIIIIIIK..',
      '..KIIiIIIK..',
      '.KSKIIIIKSK.',
      '.KSKIIIIKSK.',
      '..KIIIIIIK..',
      '.KIIIIIIIIK.',
      '.KKKKKKKKKK.',
      '...KSK.KSK..',
      '...KKK.KKK..',
    ],
  },

  girl_2: {
    rows: [
      '...KKKKKK...',
      '..KHHHHHHK..',
      '.KHHHhHHHHK.',
      'KHKHHHHHHKHK',
      'KHKSSSSSSKHK',
      'KHKSKSSKSKHK',
      'KHKSSSSSSKHK',
      'KKKSSRRSSKKK',
      '...KSSSSK...',
      '..KIIIIIIK..',
      '..KIIiIIIK..',
      '.KSKIIIIKSK.',
      '.KSKIIIIKSK.',
      '..KIIIIIIK..',
      '.KIIIIIIIIK.',
      '.KKKKKKKKKK.',
      '..KSK...KSK.',
      '..KKK...KKK.',
    ],
  },

  heart_full: {
    rows: ['.KK.KK.', 'KRRKRRK', 'KRrRRRK', 'KRRRRRK', '.KRRRK.', '..KRK..', '...K...'],
  },
  heart_empty: {
    rows: ['.KK.KK.', 'KggKggK', 'KgggggK', 'KgggggK', '.KgggK.', '..KgK..', '...K...'],
  },
  hud_star: {
    rows: ['...Y...', '...Y...', '.YYyYY.', '..yWy..', '.YyyyY.', '.Y...Y.', '.......'],
  },
  mushroom: {
    rows: ['.KKKK.', 'KpWppK', 'KpppWK', '.KKKK.', '..Kw..', '..KwK.', '..KKK.'],
  },
  shot: {
    rows: ['.Y.', 'YWY', '.Y.'],
  },
  shot_big: {
    rows: ['..Y..', '.YyY.', 'YyWyY', '.YyY.', '..Y..'],
  },
  ball: {
    rows: ['.KKK.', 'KiIIK', 'KIIIK', 'KIIRK', '.KKK.'],
  },
} satisfies Record<string, SpriteDef>

export type SpriteName = keyof typeof DEFS

export function bake(def: SpriteDef): HTMLCanvasElement {
  const pal = { ...PAL, ...(def.pal ?? {}) }
  const w = Math.max(...def.rows.map((r) => r.length))
  const h = def.rows.length
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  def.rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x]!
      if (ch === '.' || ch === ' ') continue
      const col = pal[ch]
      if (!col) continue
      ctx.fillStyle = col
      ctx.fillRect(x, y, 1, 1)
    }
  })
  return c
}

export function flipCanvas(src: HTMLCanvasElement): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = src.width
  c.height = src.height
  const ctx = c.getContext('2d')!
  ctx.translate(src.width, 0)
  ctx.scale(-1, 1)
  ctx.drawImage(src, 0, 0)
  return c
}

/** Solid single-colour silhouette of a sprite, used for hit flashes. */
export function tintCanvas(src: HTMLCanvasElement, color: string): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = src.width
  c.height = src.height
  const ctx = c.getContext('2d')!
  ctx.drawImage(src, 0, 0)
  ctx.globalCompositeOperation = 'source-in'
  ctx.fillStyle = color
  ctx.fillRect(0, 0, c.width, c.height)
  return c
}

export type Sprite = { img: HTMLCanvasElement; flipped: HTMLCanvasElement; white: HTMLCanvasElement; w: number; h: number }

const cache = new Map<string, Sprite>()

export function sprite(name: SpriteName): Sprite {
  let s = cache.get(name)
  if (s) return s
  const img = bake(DEFS[name])
  s = { img, flipped: flipCanvas(img), white: tintCanvas(img, '#ffffff'), w: img.width, h: img.height }
  cache.set(name, s)
  return s
}

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  s: Sprite,
  x: number,
  y: number,
  flip = false,
  white = false,
) {
  const img = white ? s.white : flip ? s.flipped : s.img
  if (white && flip) {
    ctx.save()
    ctx.translate(Math.round(x) + s.w, Math.round(y))
    ctx.scale(-1, 1)
    ctx.drawImage(img, 0, 0)
    ctx.restore()
    return
  }
  ctx.drawImage(img, Math.round(x), Math.round(y))
}

/* ------------------------------------------------------------- procedural art */

function mulberry(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type TreeStyle = { leaf: string; leafLight: string; trunk: string; outline: string | null }

/** Pixel pine tree. Height in pixels; returns a canvas with the trunk base at the bottom centre. */
export function makePine(seed: number, height: number, style: TreeStyle): HTMLCanvasElement {
  const rnd = mulberry(seed)
  const w = Math.round(height * 0.62) | 1
  const c = document.createElement('canvas')
  c.width = w
  c.height = height
  const ctx = c.getContext('2d')!
  const cx = (w - 1) / 2
  const trunkW = Math.max(2, Math.round(height / 14))
  ctx.fillStyle = style.trunk
  ctx.fillRect(Math.round(cx - trunkW / 2), Math.round(height * 0.55), trunkW, Math.round(height * 0.45))
  const tiers = 3 + Math.floor(rnd() * 2)
  const top = Math.round(height * 0.04)
  const bottom = Math.round(height * 0.78)
  for (let t = 0; t < tiers; t++) {
    const tierTop = top + ((bottom - top) * t) / tiers
    const tierBottom = top + ((bottom - top) * (t + 1)) / tiers + height * 0.06
    const halfW = (w / 2) * ((t + 1.4) / (tiers + 0.6))
    for (let y = Math.round(tierTop); y < Math.min(height, Math.round(tierBottom)); y++) {
      const f = (y - tierTop) / (tierBottom - tierTop)
      const hw = Math.max(1, Math.round(halfW * f + (rnd() < 0.3 ? 1 : 0)))
      ctx.fillStyle = style.leaf
      ctx.fillRect(Math.round(cx - hw), y, hw * 2 + 1, 1)
      if (style.outline) {
        ctx.fillStyle = style.outline
        ctx.fillRect(Math.round(cx - hw), y, 1, 1)
        ctx.fillRect(Math.round(cx + hw), y, 1, 1)
      }
      if (rnd() < 0.5) {
        ctx.fillStyle = style.leafLight
        const lx = Math.round(cx - hw + rnd() * hw * 1.4)
        ctx.fillRect(lx, y, 1 + Math.floor(rnd() * 3), 1)
      }
    }
  }
  return c
}

/** Pixel deciduous tree with a blobby canopy. */
export function makeOak(seed: number, height: number, style: TreeStyle): HTMLCanvasElement {
  const rnd = mulberry(seed)
  const w = Math.round(height * 0.9) | 1
  const c = document.createElement('canvas')
  c.width = w
  c.height = height
  const ctx = c.getContext('2d')!
  const cx = (w - 1) / 2
  const trunkW = Math.max(3, Math.round(height / 9))
  ctx.fillStyle = style.trunk
  ctx.fillRect(Math.round(cx - trunkW / 2), Math.round(height * 0.5), trunkW, Math.round(height * 0.5))
  // branches
  ctx.fillRect(Math.round(cx - trunkW), Math.round(height * 0.5), trunkW * 2, 2)
  const blobs = 5 + Math.floor(rnd() * 4)
  const canopyR = height * 0.3
  const pixels = new Set<number>()
  const light = new Set<number>()
  for (let b = 0; b < blobs; b++) {
    const bx = cx + (rnd() - 0.5) * canopyR * 1.6
    const by = height * 0.32 + (rnd() - 0.5) * canopyR * 1.1
    const br = canopyR * (0.45 + rnd() * 0.45)
    for (let y = Math.max(0, Math.floor(by - br)); y <= Math.min(height - 1, Math.ceil(by + br)); y++) {
      for (let x = Math.max(0, Math.floor(bx - br)); x <= Math.min(w - 1, Math.ceil(bx + br)); x++) {
        const dx = x - bx
        const dy = (y - by) * 1.15
        if (dx * dx + dy * dy <= br * br) {
          pixels.add(y * w + x)
          if (dy < -br * 0.35 && dx < br * 0.3 && rnd() < 0.5) light.add(y * w + x)
        }
      }
    }
  }
  ctx.fillStyle = style.leaf
  for (const p of pixels) ctx.fillRect(p % w, Math.floor(p / w), 1, 1)
  ctx.fillStyle = style.leafLight
  for (const p of light) ctx.fillRect(p % w, Math.floor(p / w), 1, 1)
  if (style.outline) {
    ctx.fillStyle = style.outline
    for (const p of pixels) {
      const x = p % w
      const y = Math.floor(p / w)
      if (!pixels.has(p - w) || !pixels.has(p + w) || !pixels.has(p - 1) || !pixels.has(p + 1)) {
        if (y > 0 && x > 0 && x < w - 1) ctx.fillRect(x, y, 1, 1)
      }
    }
  }
  return c
}

/** Draws a filled pixel circle. */
export function fillCircle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.fillStyle = color
  const x0 = Math.round(cx)
  const y0 = Math.round(cy)
  const rr = Math.max(0.5, r)
  for (let dy = -Math.ceil(rr); dy <= Math.ceil(rr); dy++) {
    const span = Math.sqrt(Math.max(0, rr * rr - dy * dy))
    const hw = Math.round(span)
    if (hw <= 0 && rr < 1) {
      ctx.fillRect(x0, y0, 1, 1)
      continue
    }
    ctx.fillRect(x0 - hw, y0 + dy, hw * 2 + 1, 1)
  }
}
