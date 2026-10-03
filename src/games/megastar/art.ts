// Original pixel sprites. One character is one pixel; no downloaded assets.
const palette: Record<string, string> = {
  o: '#15233b', d: '#31455b', b: '#417cac', c: '#83d7e9', w: '#eef8e5', s: '#b4cddd',
  n: '#092a3e', e: '#7ff8ef', g: '#468b76', G: '#92c59c', h: '#8f392e', r: '#d66d3f',
  R: '#ffb365', f: '#f2c3a1', F: '#cf8f7f', p: '#755881', P: '#b49cc1', y: '#ffdf8e',
  Y: '#fff1bf', t: '#735762', m: '#c78899', k: '#44283f', a: '#876f83', l: '#beeaa3',
}
const designs = {
  robot: [
    '        cc        ', '        oc        ', '     oowwww oo    '.replaceAll(' ', '.'),
    '    owwwwwwwwo    ', '   owwsswwwwswo   ', '  owwoooooooowwo  ', '  owonnnnnnnnowo  ',
    '  owonccnnccnowo  ', '  owoneenneenowo  ', '  owonnnnnnnnowo  ', '   owooooooowo    ',
    '    osswwssso     ', '   boowwwwwoob    ', '  bccoswcswoccb   ', '  bs owwccwo sb   ',
    '  os owwwwwo so   ', '  ow oobbooo wo   ', '  oo  bbbbo  oo   ', '     ossssso      ',
    '     ow  wo       ', '    osw  wso      ', '    obb  bbo      ',
  ],
  mother: [
    '          hhhhhh          ', '        hhrrRRrrhh        ', '       hrrRRRRRrrrh       ',
    '      hrrRRrrrrrrrh       ', '      hrRrffffffrrrh      ', '     hrrrffffffffrrh      ',
    '     hrrffof ff ofrrh     ', '    hrrrfffffFffffrrh     ', '    hrRrrfffFFfffrrrh     ',
    '    hrrrrrffFfffrrrrh     ', '    hrrrhhffffffhrrrh     ', '     hrrhggffggghrrh      ',
    '      hhgGGggGGgghh      ', '       ggGGggGGgg        ', '     ggfgGGgyGGgfgg      ',
    '    gfffggGGyGggfffg     ', '    fff gGGGyGGg fff     ', '    ff  ggGGyGgg  ff     ',
    '   fff  ggggyggg  fff    ', '    f   gGggggGg   f     ', '        ggGGGGgg         ',
    '       ggGGGGGGgg        ', '       gGGgGGgGGg        ', '      ggGGggggGGgg       ',
    '      gGGGgGGgGGGg       ', '     ggGGggGGggGGgg      ', '     gGGGggGGggGGGg      ',
    '    ggGGGggGGggGGGgg     ', '    ggggggyyyygggggg     ', '      oo      oo         ',
  ],
  child: [
    '   rr   rr   ', '  rRRr rRRr  ', '   hrrrrrh   ', '  hrRffRrrh  ', '  hrfffffrh  ',
    '  hrfofofrh  ', '   ffffff    ', '    fFFf     ', '   PPffPP    ', '  fPPyyPPf   ',
    '  fPPPPPPf   ', '   PPPPPP    ', '   PpPPpP    ', '    ff ff    ', '   oo   oo   ',
  ],
  root: [
    '   g     g    ', '    g   g     ', '    ppppp     ', '  ppPPPPpp    ', ' pPPPPPPPPp   ',
    ' pPkkPPkkPp   ', 'pPPykkkyPPp   ', 'pPPPPPPPPPPp  ', ' pPPkkkkPPp   ', ' pPkYkkYkPp   ',
    '  pkkkkkkp    ', '  pppppppp    ', ' pp pppp pp   ', 'pp  pp pp pp  ',
  ],
  mimic: [
    '      p       ', '     pPp      ', '     pYPp     ', '    pPYYp     ', 'ppppPYYYppppp ',
    ' pPPYkYkYPPp  ', '  pPYrYrYPp   ', '   pPYkYPp    ', '  pPkkYkkPp   ', '  pPYYYYYPp   ',
    '  pYPpppPYp   ', ' pPp     pPp  ', ' pp       pp  ',
  ],
  star: [
    '     y     ', '    yYy    ', '    yYy    ', ' yyyyYyyyy ', 'yYYYYYYYYYy', ' yyYYYYYyy ',
    '   yYYYy   ', '  yYYyYYy  ', '  yyy yyy  ',
  ],
  fox: [
    '                r       ', '    r      r   rRr      ', '   rRr    rRr rRRRr     ', '  rRRRrrrrRRrrRRRRr     ',
    ' rRRRRRRRRRRRRRRRRr     ', ' rRorrRRRroRRRRRRRr     ', '  rwwrrrwwRRRRRRrr      ', '   rwwowwwRRRrrwww      ',
    '    rwwwwRRRrwwww       ', '     rrrrrrrrrrr        ',
  ],
  owl: ['  t     t  ', ' taat taat ', 'taaaaaaaaat', 'taYYaaaYYat', 'taooayaoot ', ' taaaayaat ', '  taaaaat  ', '  ttaaatt  ', '   tt tt   '],
  rabbit: ['  ss  ss   ', '  sws sws  ', '  sws sws  ', '   sssss   ', '  swwwwws  ', '  swoows   ', 'sswwwwwws  ', 'swwwwwwwwws', ' sssssssss '],
  mushroom: ['    mmmm    ', '  mmYmmmYm  ', ' mmmmmmmmmm ', 'mmYYmmmmYYmm', 'mmmmmmmmmmmm', '    swws    ', '    swws    ', '   swwwws   '],
} as const
export type Sprite = keyof typeof designs
const cache = new Map<Sprite, HTMLCanvasElement>()
export function sprite(name: Sprite) {
  const existing = cache.get(name)
  if (existing) return existing
  const rows = designs[name], canvas = document.createElement('canvas')
  canvas.width = Math.max(...rows.map(row => row.length)); canvas.height = rows.length
  const c = canvas.getContext('2d')!
  rows.forEach((row, y) => Array.from(row).forEach((char, x) => { if (palette[char]) { c.fillStyle = palette[char]; c.fillRect(x, y, 1, 1) } }))
  cache.set(name, canvas); return canvas
}
export function drawSprite(c: CanvasRenderingContext2D, name: Sprite, x: number, y: number, scale = 1, flip = false) {
  const img = sprite(name)
  c.save(); c.translate(Math.round(x), Math.round(y)); c.scale(flip ? -scale : scale, scale); c.drawImage(img, -Math.floor(img.width / 2), -img.height); c.restore()
}
