import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUp, Crosshair, Heart, Maximize2, Minimize2, Pause, Play, RotateCcw, Sparkles, Volume2, VolumeX, X } from 'lucide-react'
import { megaStar } from '../../data/megastar'
import { Game, END, emptyInput } from './engine'
import type { Input, Mode } from './engine'
import { Renderer } from './renderer'
import { GameAudio } from './audio'
import './megastar.css'

type View = { mode: Mode; hp: number; stars: number; level: number; zone: number; banner: string; progress: number; time: number; boss: boolean; bossHp: number; shield: boolean; kills: number }
const snapshot = (g: Game): View => ({ mode: g.mode, hp: g.player.hp, stars: g.stars, level: g.level, zone: g.zone, banner: g.bannerTime > 0 ? g.banner : '', progress: g.player.x / END, time: g.time, boss: g.boss.active, bossHp: g.boss.hp / g.boss.max, shield: g.boss.shield, kills: g.kills })
const timeLabel = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`

export function MegaStarGame() {
  const stage = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null)
  const [initialGame] = useState(() => new Game())
  const game = useRef(initialGame), renderer = useRef<Renderer | null>(null), audio = useRef<GameAudio | null>(null)
  const held = useRef(new Map<string, keyof Input>())
  const [view, setView] = useState(() => snapshot(initialGame)), [muted, setMuted] = useState(false), [expanded, setExpanded] = useState(false), [guide, setGuide] = useState(false)
  const [best, setBest] = useState(() => { try { return Number(localStorage.getItem('megastar-best') || '0') || 0 } catch { return 0 } })
  const refresh = () => setView(snapshot(game.current))
  const clear = () => held.current.clear()
  const start = () => { game.current = new Game(); game.current.start(); if (renderer.current) renderer.current.camera = 0; clear(); setGuide(false); refresh(); stage.current?.focus({ preventScroll: true }); void audio.current?.unlock().catch(() => {}); stage.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }
  const pause = () => { game.current.pause(); clear(); refresh() }
  const resume = () => { game.current.resume(); clear(); setGuide(false); refresh(); stage.current?.focus({ preventScroll: true }); void audio.current?.unlock().catch(() => {}) }
  const toggleSound = () => { const next = !muted; setMuted(next); if (audio.current) { audio.current.muted = next; if (!next) void audio.current.unlock().catch(() => {}) } }

  useEffect(() => {
    const surface = canvas.current!, shell = stage.current!, r = new Renderer(surface), sound = new GameAudio()
    renderer.current = r; audio.current = sound
    const heldInputs = held.current
    const observer = new ResizeObserver(entries => { const box = entries[0].contentRect; if (box.width && box.height) r.resize(box.width, box.height) }); observer.observe(shell)
    const keys: Record<string, keyof Input> = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'jump', KeyW: 'jump', Space: 'jump', KeyX: 'fire', KeyJ: 'fire' }
    const keydown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName) || (e.target.tagName === 'BUTTON' && ['Space', 'Enter'].includes(e.code)))) return
      if (e.code === 'Escape' || e.code === 'KeyP') { if (game.current.mode === 'playing') pause(); else if (game.current.mode === 'paused') resume(); return }
      if (keys[e.code] && game.current.mode === 'playing') { e.preventDefault(); held.current.set(e.code, keys[e.code]) }
    }
    const keyup = (e: KeyboardEvent) => held.current.delete(e.code)
    const blur = () => { clear(); if (game.current.mode === 'playing') { game.current.pause(); setView(snapshot(game.current)) } }
    const visibility = () => { if (document.hidden) blur() }
    window.addEventListener('keydown', keydown); window.addEventListener('keyup', keyup); window.addEventListener('blur', blur); document.addEventListener('visibilitychange', visibility)
    let id = 0, last = 0, accumulated = 0, publish = 0, recorded = false
    const frame = (now: number) => {
      const dt = Math.min(.05, (now - (last || now)) / 1000); last = now; accumulated += dt; publish += dt
      const g = game.current, input = emptyInput()
      for (const action of held.current.values()) input[action] = true
      while (accumulated >= 1 / 120) { g.update(1 / 120, input); accumulated -= 1 / 120 }
      if (g.mode === 'playing') recorded = false
      if ((g.mode === 'won' || g.mode === 'dead') && !recorded) {
        recorded = true; clear()
        setBest(previous => { const score = Math.max(previous, g.stars); try { localStorage.setItem('megastar-best', String(score)) } catch { /* Private browsing may deny storage. */ } return score })
      }
      for (const event of g.events.splice(0)) sound.event(event)
      sound.update(g.mode === 'playing' || g.mode === 'won', g.boss.active && g.mode !== 'won')
      r.draw(g, dt)
      if (publish > .1) { setView(snapshot(g)); publish = 0 }
      id = requestAnimationFrame(frame)
    }
    id = requestAnimationFrame(frame)
    // Local-only QA access; excluded from the production bundle by Vite.
    if (import.meta.env.DEV && new URLSearchParams(location.search).has('qa')) (window as unknown as { megaStarQA: unknown }).megaStarQA = { game: () => game.current, snapshot: () => snapshot(game.current) }
    return () => { cancelAnimationFrame(id); observer.disconnect(); sound.dispose(); heldInputs.clear(); window.removeEventListener('keydown', keydown); window.removeEventListener('keyup', keyup); window.removeEventListener('blur', blur); document.removeEventListener('visibilitychange', visibility); delete (window as unknown as { megaStarQA?: unknown }).megaStarQA }
  }, [])

  useEffect(() => {
    if (!expanded) return
    const previous = document.body.style.overflow; document.body.style.overflow = 'hidden'; document.body.classList.add('megastar-expanded')
    return () => { document.body.style.overflow = previous; document.body.classList.remove('megastar-expanded') }
  }, [expanded])

  useEffect(() => {
    if (!guide && !['paused', 'dead', 'won'].includes(view.mode)) return
    const panel = stage.current?.querySelector<HTMLElement>('[role=dialog]')
    panel?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true })
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !panel) return
      const buttons = Array.from(panel.querySelectorAll<HTMLButtonElement>('button'))
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
      if (event.shiftKey && index <= 0) { event.preventDefault(); buttons.at(-1)?.focus() }
      else if (!event.shiftKey && index === buttons.length - 1) { event.preventDefault(); buttons[0]?.focus() }
    }
    window.addEventListener('keydown', trap)
    return () => window.removeEventListener('keydown', trap)
  }, [guide, view.mode])

  const control = (action: keyof Input) => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => { if (game.current.mode !== 'playing') return; e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); held.current.set(`touch-${e.pointerId}`, action); e.currentTarget.dataset.held = 'true' },
    onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => { held.current.delete(`touch-${e.pointerId}`); e.currentTarget.dataset.held = 'false' },
    onPointerCancel: (e: React.PointerEvent<HTMLButtonElement>) => { held.current.delete(`touch-${e.pointerId}`); e.currentTarget.dataset.held = 'false' },
    onLostPointerCapture: (e: React.PointerEvent<HTMLButtonElement>) => { held.current.delete(`touch-${e.pointerId}`); e.currentTarget.dataset.held = 'false' },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  })
  const tier = megaStar.powers[view.level], next = megaStar.powers[view.level + 1], xp = next ? (view.stars - tier.stars) / (next.stars - tier.stars) : 1
  return (
    <div className={`mega-stage ${expanded ? 'mega-expanded' : ''}`} ref={stage} tabIndex={-1} aria-label="MegaStar spelplan" data-mode={view.mode}>
      <canvas ref={canvas} className="mega-canvas" aria-label="Pixelspel i en kvällsskog. Styr roboten med pilarna, dubbelhoppa med mellanslag och skjut med X." />
      <div className="mega-vignette" aria-hidden="true" />
      <div className="mega-toolbar">
        <span className="mega-wordmark">M<span>✦</span>S <i>MEGASTAR</i></span>
        <div className="mega-tools">
          {view.mode === 'playing' && <button onClick={pause} aria-label="Pausa spelet"><Pause size={17} /></button>}
          <button onClick={toggleSound} aria-label={muted ? 'Slå på spelljud' : 'Stäng av spelljud'} aria-pressed={!muted}>{muted ? <VolumeX size={17} /> : <Volume2 size={17} />}</button>
          <button onClick={() => setExpanded(!expanded)} aria-label={expanded ? 'Lämna storbild' : 'Spela i storbild'}>{expanded ? <Minimize2 size={17} /> : <Maximize2 size={17} />}</button>
        </div>
      </div>
      {view.mode !== 'title' && <>
        <div className="mega-hud">
          <div className="mega-vitals"><div className="mega-hearts" aria-label={`${view.hp} av 5 hjärtan`}>{Array.from({ length: 5 }, (_, i) => <Heart key={i} size={17} className={i < view.hp ? 'full' : ''} />)}</div><span>{tier.name}</span><div className="mega-xp" role="progressbar" aria-label="Stjärnkraft" aria-valuenow={Math.round(xp * 100)} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${xp * 100}%`, background: tier.color }} /></div></div>
          <div className="mega-star-count"><span>✦</span> {String(view.stars).padStart(2, '0')}<small>{next ? `${next.stars} → ${next.name}` : 'MAXIMAL GLÖD'}</small></div>
        </div>
        {view.boss && view.mode === 'playing' ? <div className="mega-bossbar"><div><span>{megaStar.boss.name}</span><b>{view.shield ? 'BUBBELSKÖLD' : 'ÖPPNING'}</b></div><i><b style={{ width: `${view.bossHp * 100}%` }} /></i></div> : <div className="mega-zone"><span>0{view.zone + 1} / 03</span> {megaStar.zones[view.zone].name}</div>}
        {view.banner && view.mode === 'playing' && <div className="mega-message" role="status">{view.banner}</div>}
      </>}
      {view.mode === 'title' && <div className="mega-intro">
        <div className="mega-kicker"><span /> ETT LITET SPEL OM STORA KRAFTER</div>
        <h2>MEGA<span>STAR<span className="mega-title-star">✦</span></span></h2>
        <p className="mega-tagline">{megaStar.subtitle}</p><p className="mega-intro-text">{megaStar.intro}</p>
        <button className="mega-primary" onClick={start}><Play size={18} fill="currentColor" />{megaStar.start}<ArrowRight size={18} /></button>
        <button className="mega-help-link" onClick={() => setGuide(true)}>Hur spelar man?</button>
        <div className="mega-intro-meta"><span>03 OMRÅDEN</span><span>04 KRAFTNIVÅER</span><span>01 MYCKET BESTÄMD MAMMA</span></div>
      </div>}
      {view.mode === 'playing' && <div className="mega-controls">
        <div className="mega-direction"><button {...control('left')} aria-label="Gå vänster"><ArrowLeft /></button><button {...control('right')} aria-label="Gå höger"><ArrowRight /></button></div>
        <div className="mega-keyboard-hint">A D / ← → · SPACE · X<span>{timeLabel(view.time)} <i>·</i> REKORD {best} ✦</span></div>
        <div className="mega-actions"><button {...control('fire')} className="mega-fire" aria-label="Skjut stjärnljus"><Crosshair size={23} /><span>SKOTT</span></button><button {...control('jump')} className="mega-jump" aria-label="Hoppa"><ArrowUp size={25} /><span>HOPP</span></button></div>
      </div>}
      {view.mode === 'playing' && <div className="mega-journey" aria-label="Framsteg genom skogen"><i style={{ width: `${view.progress * 100}%` }} /></div>}
      {(view.mode === 'paused' || view.mode === 'dead' || view.mode === 'won' || guide) && <div className="mega-overlay">
        <section className="mega-dialog" role="dialog" aria-modal="true" aria-label={guide ? 'Så spelar du' : view.mode === 'paused' ? 'Spelet pausat' : 'Nattens resultat'}>
          {guide ? <><button className="mega-close" onClick={() => setGuide(false)} aria-label="Stäng spelguide"><X size={20} /></button><div className="mega-kicker">INNAN SKOGEN VAKNAR</div><h3>Lite handlag.</h3><div className="mega-guide">{megaStar.controls.map(c => <div key={c.title}><strong>{c.title}</strong><p>{c.text}</p></div>)}</div><button className="mega-primary" onClick={start}>Jag är redo <ArrowRight size={18} /></button></> : view.mode === 'paused' ? <><div className="mega-kicker">INGEN BRÅDSKA</div><h3>Skogen väntar.</h3><p>Ta ett andetag. Stjärnorna ligger kvar.</p><button className="mega-primary" onClick={resume}><Play size={18} />Fortsätt</button><button className="mega-secondary" onClick={start}><RotateCcw size={16} />Börja om</button></> : <><div className="mega-result-star">{view.mode === 'won' ? '✦' : '☾'}</div><div className="mega-kicker">{view.mode === 'won' ? 'SKOGENS NYA STJÄRNA' : 'NATTENS RESULTAT'}</div><h3>{view.mode === 'won' ? megaStar.victory : megaStar.defeat}</h3><p>{view.mode === 'won' ? megaStar.victoryLead : megaStar.defeatLead}</p><div className="mega-results"><div><b>{view.stars}</b><span>STJÄRNOR</span></div><div><b>{timeLabel(view.time)}</b><span>I NATTEN</span></div><div><b>{view.level + 1}</b><span>KRAFTNIVÅ</span></div></div><button className="mega-primary" onClick={start}><RotateCcw size={18} />En natt till</button></>}
        </section>
      </div>}
      <span className="sr-only" aria-live="polite">{view.mode === 'dead' ? megaStar.defeat : view.mode === 'won' ? megaStar.victory : ''}</span>
      <div className="mega-corner" aria-hidden="true"><Sparkles size={11} /> RYMDFABRIKEN ARCADE</div>
    </div>
  )
}
