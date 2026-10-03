// Original pixel sprites. One character is one pixel; no downloaded assets.
const palette: Record<string, string> = {
  o: '#142139', d: '#31455b', b: '#6873b4', c: '#9fe5fa', w: '#fff7e5', s: '#adc2dc',
  n: '#102941', e: '#a7ffef', g: '#347b83', G: '#87c6b7', h: '#74312f', r: '#d45e37',
  R: '#ffa868', f: '#f9d2ae', F: '#dc957d', p: '#63528c', P: '#b395d8', y: '#ffcf7c',
  Y: '#fff1bf', t: '#735762', m: '#c78899', k: '#44283f', a: '#876f83', l: '#beeaa3',
}
const designs = {
  robot: [
    '          yy          ', '          Yy          ', '          oo          ',
    '       oowwww oo      '.replaceAll(' ', '.'), '     owwwwwwwwwo      ',
    '    owwwwwsswwwwo     ', '   owwwwoooooowwwo    ', '  oswwooncccnnoowso   ',
    '  oswonnnnnnnnnows o  '.replaceAll(' ', '.'), '  owsonneenn eenoswo  '.replaceAll(' ', '.'),
    '  owsonneenn eenoswo  '.replaceAll(' ', '.'), '   osonnnnnnnnnoso    ',
    '    owooocccooowo     ', '     osswwwwsso       ', '    bboyyyyyoobb      ',
    '   bcowwyywwwocbb     ', '  obcowwwwwwwocbbo    ', '  osb owwcywwo bso    ',
    '  oww owwycwwo wwo    ', '   oo  oswwso  oo     ', '       obbbbo         ',
    '      ossoosso        ', '      owwoowwo        ', '     osww  wwso       ',
    '     obbb  bbbo       ',
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

/** Articulated feet, a wind-blown scarf and eye blinks keep the small pilot alive. */
export function drawPilot(c: CanvasRenderingContext2D, x: number, y: number, time: number, speed: number, airborne: boolean, face: number, scale = 1.3) {
  c.save(); c.translate(Math.round(x), Math.round(y)); c.scale(face < 0 ? -scale : scale, scale)
  c.fillStyle = '#ffcb80'
  const wave = Math.round(Math.sin(time * 9) * 2)
  c.fillRect(-13, -12, 7, 3); c.fillRect(-18, -12 + wave, 6, 3); c.fillRect(-21, -11 + wave, 4, 2)
  const img = sprite('robot')
  c.drawImage(img, 0, 0, img.width, img.height - 4, -Math.floor(img.width / 2), -img.height, img.width, img.height - 4)
  const stride = airborne ? 2 : Math.abs(speed) > 10 ? Math.round(Math.sin(time * 19) * 2) : 0
  c.fillStyle = '#c5d8e6'; c.fillRect(-5, -5, 4, 3 + stride); c.fillRect(2, -5, 4, 3 - stride)
  c.fillStyle = '#7789c4'; c.fillRect(-7, -2 + stride, 6, 2); c.fillRect(2, -2 - stride, 6, 2)
  if (time % 4.7 > 4.55) { c.fillStyle = '#102941'; c.fillRect(-3, -16, 2, 2); c.fillRect(3, -16, 2, 2) }
  c.restore()
}
