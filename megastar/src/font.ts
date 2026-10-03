// A hand-drawn 5x7 pixel font with the Swedish letters, baked once into a sprite atlas.

const GLYPHS: Record<string, string[]> = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.####', '#....', '#....', '#....', '#....', '#....', '.####'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.####', '#....', '#....', '#.###', '#...#', '#...#', '.####'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['###', '.#.', '.#.', '.#.', '.#.', '.#.', '###'],
  J: ['....#', '....#', '....#', '....#', '#...#', '#...#', '.###.'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  Å: ['..#..', '.....', '.###.', '#...#', '#####', '#...#', '#...#'],
  Ä: ['.#.#.', '.....', '.###.', '#...#', '#####', '#...#', '#...#'],
  Ö: ['.#.#.', '.....', '.###.', '#...#', '#...#', '#...#', '.###.'],
  É: ['..#..', '.....', '#####', '#....', '####.', '#....', '#####'],
  '0': ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  '1': ['.#.', '##.', '.#.', '.#.', '.#.', '.#.', '###'],
  '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  '3': ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
  '4': ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  '6': ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'],
  '7': ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  '9': ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
  '.': ['.', '.', '.', '.', '.', '.', '#'],
  ',': ['.', '.', '.', '.', '.', '#', '#'],
  '!': ['#', '#', '#', '#', '#', '.', '#'],
  '?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'],
  ':': ['.', '.', '#', '.', '.', '#', '.'],
  '-': ['...', '...', '...', '###', '...', '...', '...'],
  '+': ['...', '.#.', '.#.', '###', '.#.', '.#.', '...'],
  '/': ['....#', '....#', '...#.', '..#..', '.#...', '#....', '#....'],
  "'": ['#', '#', '.', '.', '.', '.', '.'],
  '×': ['.....', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '.....'],
  '♥': ['.#.#.', '#####', '#####', '#####', '.###.', '..#..', '.....'],
  '★': ['..#..', '..#..', '#####', '.###.', '.###.', '#...#', '.....'],
  '>': ['#....', '.#...', '..#..', '...#.', '..#..', '.#...', '#....'],
  '<': ['....#', '...#.', '..#..', '.#...', '..#..', '...#.', '....#'],
  '(': ['.#', '#.', '#.', '#.', '#.', '#.', '.#'],
  ')': ['#.', '.#', '.#', '.#', '.#', '.#', '#.'],
  '%': ['##..#', '##..#', '...#.', '..#..', '.#...', '#..##', '#..##'],
  '&': ['.##..', '#..#.', '#..#.', '.##..', '#.#.#', '#..#.', '.##.#'],
}

export const FONT_H = 7
const SPACE_W = 3
const GAP = 1

type Glyph = { x: number; w: number }

let atlas: HTMLCanvasElement | null = null
const index = new Map<string, Glyph>()

function bakeAtlas() {
  const keys = Object.keys(GLYPHS)
  let totalW = 0
  for (const k of keys) totalW += (GLYPHS[k]?.[0]?.length ?? 0) + 1
  const c = document.createElement('canvas')
  c.width = totalW
  c.height = FONT_H
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  let x = 0
  for (const k of keys) {
    const rows = GLYPHS[k]!
    const w = rows[0]!.length
    rows.forEach((row, ry) => {
      for (let rx = 0; rx < w; rx++) if (row[rx] === '#') ctx.fillRect(x + rx, ry, 1, 1)
    })
    index.set(k, { x, w })
    x += w + 1
  }
  atlas = c
}

const tinted = new Map<string, HTMLCanvasElement>()

function tintedAtlas(color: string): HTMLCanvasElement {
  if (!atlas) bakeAtlas()
  let t = tinted.get(color)
  if (t) return t
  t = document.createElement('canvas')
  t.width = atlas!.width
  t.height = atlas!.height
  const ctx = t.getContext('2d')!
  ctx.drawImage(atlas!, 0, 0)
  ctx.globalCompositeOperation = 'source-in'
  ctx.fillStyle = color
  ctx.fillRect(0, 0, t.width, t.height)
  tinted.set(color, t)
  return t
}

function glyphFor(ch: string): Glyph | null {
  if (!atlas) bakeAtlas()
  return index.get(ch.toUpperCase()) ?? null
}

export function measureText(text: string, scale = 1): number {
  let w = 0
  for (const ch of text) {
    if (ch === ' ') w += SPACE_W + GAP
    else {
      const g = glyphFor(ch)
      w += (g ? g.w : SPACE_W) + GAP
    }
  }
  return Math.max(0, w - GAP) * scale
}

export type TextAlign = 'left' | 'center' | 'right'

export type TextOptions = {
  scale?: number
  align?: TextAlign
  color?: string
  shadow?: string | null
  outline?: string | null
}

export function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, opts: TextOptions = {}) {
  const scale = opts.scale ?? 1
  const align = opts.align ?? 'left'
  const color = opts.color ?? '#ffffff'
  const width = measureText(text, scale)
  let startX = Math.round(x)
  if (align === 'center') startX = Math.round(x - width / 2)
  else if (align === 'right') startX = Math.round(x - width)
  const baseY = Math.round(y)

  const pass = (col: string, dx: number, dy: number) => {
    const img = tintedAtlas(col)
    let cx = startX + dx
    for (const ch of text) {
      if (ch === ' ') {
        cx += (SPACE_W + GAP) * scale
        continue
      }
      const g = glyphFor(ch)
      if (!g) {
        cx += (SPACE_W + GAP) * scale
        continue
      }
      ctx.drawImage(img, g.x, 0, g.w, FONT_H, cx, baseY + dy, g.w * scale, FONT_H * scale)
      cx += (g.w + GAP) * scale
    }
  }

  if (opts.outline) {
    const o = opts.outline
    const offsets: ReadonlyArray<readonly [number, number]> = [
      [-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1],
    ]
    for (const [dx, dy] of offsets) pass(o, dx * scale, dy * scale)
  }
  if (opts.shadow !== null) pass(opts.shadow ?? 'rgba(0,0,0,0.6)', scale, scale)
  pass(color, 0, 0)
}

/** Wraps text into lines not wider than maxWidth (in virtual pixels at the given scale). */
export function wrapText(text: string, maxWidth: number, scale = 1): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w
    if (measureText(next, scale) > maxWidth && cur) {
      lines.push(cur)
      cur = w
    } else cur = next
  }
  if (cur) lines.push(cur)
  return lines
}
