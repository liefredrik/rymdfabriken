import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUp, Crosshair, Heart, Maximize2, Minimize2, Moon, Pause, Play, RotateCcw, Sparkles, Volume2, VolumeX, X, Zap } from 'lucide-react'
import { starChild } from '../../data/starchild'
import { Game, END, emptyInput } from './engine'
import type { Input, Mode } from './engine'
import { Renderer } from './renderer'
import { GameAudio } from './audio'
import './starchild.css'

type View = { mode: Mode; hp: number; stars: number; level: number; zone: number; banner: string; progress: number; time: number; boss: boolean; bossHp: number; shield: boolean; kills: number; dash: number; relics: number; comets: number; warning: boolean }
const snapshot = (g: Game): View => ({ mode: g.mode, hp: g.player.hp, stars: g.stars, level: g.level, zone: g.zone, banner: g.bannerTime > 0 ? g.banner : '', progress: g.player.x / END, time: g.time, boss: g.boss.active, bossHp: g.boss.hp / g.boss.max, shield: g.boss.shield, kills: g.kills, dash: g.player.dashCooldown, relics: g.relics.filter(r => r.taken).length, comets: g.comets, warning: g.boss.warning > 0 })
const timeLabel = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`

export function StarChildGame() {
  const stage = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null)
  const [initialGame] = useState(() => new Game())
  const game = useRef(initialGame), renderer = useRef<Renderer | null>(null), audio = useRef<GameAudio | null>(null)
  const held = useRef(new Map<string, keyof Input>())
  const pressed = useRef(new Set<keyof Input>())
  const [view, setView] = useState(() => snapshot(initialGame)), [muted, setMuted] = useState(() => { try { return localStorage.getItem('starchild-muted') === 'true' } catch { return false } }), [expanded, setExpanded] = useState(false), [guide, setGuide] = useState(false)
  const [best, setBest] = useState(() => { try { const n = Number(localStorage.getItem('starchild-best')); return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0 } catch { return 0 } })
  const refresh = () => setView(snapshot(game.current))
  const clear = () => { held.current.clear(); pressed.current.clear(); stage.current?.querySelectorAll<HTMLElement>('[data-held]').forEach(button => { button.dataset.held = 'false' }) }
  const start = () => { game.current = new Game(); game.current.start(); if (renderer.current) renderer.current.camera = 0; clear(); setGuide(false); refresh(); stage.current?.focus({ preventScroll: true }); void audio.current?.unlock().catch(() => {}); stage.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }
  const pause = () => { game.current.pause(); clear(); refresh() }
  const resume = () => { game.current.resume(); clear(); setGuide(false); refresh(); stage.current?.focus({ preventScroll: true }); void audio.current?.unlock().catch(() => {}) }
  const toggleSound = () => { const next = !muted; setMuted(next); try { localStorage.setItem('starchild-muted', String(next)) } catch { /* Storage is optional. */ } if (audio.current) { audio.current.muted = next; if (!next) void audio.current.unlock().catch(() => {}) } }
  const closeGuide = () => { setGuide(false); requestAnimationFrame(() => stage.current?.querySelector<HTMLButtonElement>('.child-help-link')?.focus({ preventScroll: true })) }

  useEffect(() => {
    const surface = canvas.current!, shell = stage.current!, r = new Renderer(surface), sound = new GameAudio()
    renderer.current = r; audio.current = sound
    try { sound.muted = localStorage.getItem('starchild-muted') === 'true' } catch { /* Storage is optional. */ }
    const heldInputs = held.current
    const observer = new ResizeObserver(entries => { const box = entries[0].contentRect; if (box.width && box.height) r.resize(box.width, box.height) }); observer.observe(shell)
    const keys: Record<string, keyof Input> = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'jump', KeyW: 'jump', Space: 'jump', KeyX: 'fire', KeyJ: 'fire', ShiftLeft: 'dash', ShiftRight: 'dash', KeyC: 'dash' }
    const keydown = (e: KeyboardEvent) => {
      if (!shell.contains(document.activeElement)) return
      if (e.target instanceof HTMLElement && (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName) || (e.target.tagName === 'BUTTON' && ['Space', 'Enter'].includes(e.code)))) return
      if ((e.code === 'Escape' || e.code === 'KeyP') && !e.repeat) { e.preventDefault(); if (game.current.mode === 'playing') pause(); else if (game.current.mode === 'paused' && !shell.querySelector('.child-guide')) resume(); return }
      if (keys[e.code] && game.current.mode === 'playing') { e.preventDefault(); held.current.set(e.code, keys[e.code]); if (!e.repeat) pressed.current.add(keys[e.code]) }
    }
    const keyup = (e: KeyboardEvent) => held.current.delete(e.code)
    const blur = () => { clear(); if (game.current.mode === 'playing') { game.current.pause(); setView(snapshot(game.current)) } }
    const visibility = () => { if (document.hidden) blur() }
    const focusout = (event: FocusEvent) => { if (!shell.contains(event.relatedTarget as Node | null)) blur() }
    window.addEventListener('keydown', keydown); window.addEventListener('keyup', keyup); window.addEventListener('blur', blur); document.addEventListener('visibilitychange', visibility); shell.addEventListener('focusout', focusout)
    let id = 0, last = 0, accumulated = 0, publish = 0, recorded = false
    const frame = (now: number) => {
      const dt = Math.min(.05, (now - (last || now)) / 1000); last = now; accumulated += dt; publish += dt
      const g = game.current, input = emptyInput()
      for (const action of held.current.values()) input[action] = true
      for (const action of pressed.current) input[action] = true
      if (accumulated >= 1 / 120) pressed.current.clear()
      while (accumulated >= 1 / 120) { g.update(1 / 120, input); accumulated -= 1 / 120 }
      if (g.mode === 'playing') recorded = false
      if ((g.mode === 'won' || g.mode === 'dead') && !recorded) {
        recorded = true; clear()
        setBest(previous => { const score = Math.max(previous, g.stars); try { localStorage.setItem('starchild-best', String(score)) } catch { /* Private browsing may deny storage. */ } return score })
      }
      for (const event of g.events.splice(0)) sound.event(event)
      sound.update(g.mode === 'playing' || g.mode === 'won', g.boss.active && g.mode !== 'won')
      r.draw(g, dt)
      if (publish > .1) { setView(snapshot(g)); publish = 0 }
      id = requestAnimationFrame(frame)
    }
    id = requestAnimationFrame(frame)
    // Local-only QA access; excluded from the production bundle by Vite.
    if (import.meta.env.DEV && new URLSearchParams(location.search).has('qa')) (window as unknown as { starChildQA: unknown }).starChildQA = { game: () => game.current, snapshot: () => snapshot(game.current) }
    return () => { cancelAnimationFrame(id); observer.disconnect(); sound.dispose(); heldInputs.clear(); window.removeEventListener('keydown', keydown); window.removeEventListener('keyup', keyup); window.removeEventListener('blur', blur); document.removeEventListener('visibilitychange', visibility); shell.removeEventListener('focusout', focusout); delete (window as unknown as { starChildQA?: unknown }).starChildQA }
  }, [])

  useEffect(() => {
    if (!expanded) return
    const previous = document.body.style.overflow; document.body.style.overflow = 'hidden'; document.body.classList.add('starchild-expanded')
    return () => { document.body.style.overflow = previous; document.body.classList.remove('starchild-expanded') }
  }, [expanded])

  useEffect(() => {
    if (!guide && !['paused', 'dead', 'won'].includes(view.mode)) return
    const panel = stage.current?.querySelector<HTMLElement>('[role=dialog]')
    panel?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true })
    const trap = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && guide) { event.preventDefault(); closeGuide(); return }
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
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => { if (game.current.mode !== 'playing') return; e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); held.current.set(`touch-${e.pointerId}`, action); pressed.current.add(action); e.currentTarget.dataset.held = 'true' },
    onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => { held.current.delete(`touch-${e.pointerId}`); e.currentTarget.dataset.held = 'false' },
    onPointerCancel: (e: React.PointerEvent<HTMLButtonElement>) => { held.current.delete(`touch-${e.pointerId}`); e.currentTarget.dataset.held = 'false' },
    onLostPointerCapture: (e: React.PointerEvent<HTMLButtonElement>) => { held.current.delete(`touch-${e.pointerId}`); e.currentTarget.dataset.held = 'false' },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  })
  const tier = starChild.powers[view.level], next = starChild.powers[view.level + 1], xp = next ? (view.stars - tier.stars) / (next.stars - tier.stars) : 1
  return (
    <div className={`child-stage ${expanded ? 'child-expanded' : ''}`} ref={stage} tabIndex={-1} aria-label="StarChild spelplan" data-mode={view.mode}>
      <canvas ref={canvas} className="child-canvas" aria-label="Pixelspel i en kvällsskog. Styr med pilarna, dubbelhoppa med mellanslag, skjut med X och rusa med Shift." />
      <div className="child-vignette" aria-hidden="true" />
      <div className="child-toolbar">
        <span className="child-wordmark"><span>✦</span> SC <i>EN NATT ATT MINNAS</i></span>
        <div className="child-tools">
          {view.mode === 'playing' && <button onClick={pause} aria-label="Pausa spelet"><Pause size={17} /></button>}
          <button onClick={toggleSound} aria-label={muted ? 'Slå på spelljud' : 'Stäng av spelljud'} aria-pressed={!muted}>{muted ? <VolumeX size={17} /> : <Volume2 size={17} />}</button>
          <button onClick={() => setExpanded(!expanded)} aria-label={expanded ? 'Lämna storbild' : 'Spela i storbild'}>{expanded ? <Minimize2 size={17} /> : <Maximize2 size={17} />}</button>
        </div>
      </div>
      {view.mode !== 'title' && <>
        <div className="child-hud">
          <div className="child-vitals"><div className="child-hearts" aria-label={`${view.hp} av 5 hjärtan`}>{Array.from({ length: 5 }, (_, i) => <Heart key={i} size={17} className={i < view.hp ? 'full' : ''} />)}</div><span>{tier.name}</span><div className="child-xp" role="progressbar" aria-label="Stjärnkraft" aria-valuenow={Math.round(xp * 100)} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${xp * 100}%`, background: tier.color }} /></div></div>
          <div className="child-star-count"><span>✦</span> {String(view.stars).padStart(2, '0')}<small>{next ? `${next.stars} → ${next.name}` : 'MAXIMAL GLÖD'}</small></div>
        </div>
        {view.boss && view.mode === 'playing' ? <div className="child-bossbar"><div><span>{starChild.boss.name}</span><b>{view.warning ? 'HOPPA ELLER RUSA!' : view.shield ? 'LOS BUBBELSKÖLD' : 'SKJUT NU'}</b></div><i role="progressbar" aria-label="Auroras glöd" aria-valuenow={Math.round(view.bossHp * 100)} aria-valuemin={0} aria-valuemax={100}><b style={{ width: `${view.bossHp * 100}%` }} /></i><small>{starChild.boss.helper}</small></div> : <div className="child-zone"><span>0{view.zone + 1} / 03</span> {starChild.zones[view.zone].name}</div>}
        <div className="child-relics" aria-label={`${view.relics} av 3 månskärvor`}>{[0, 1, 2].map(i => <Moon key={i} size={12} className={i < view.relics ? 'found' : ''} />)}</div>
        {view.banner && view.mode === 'playing' && <div className="child-message" role="status">{view.banner}</div>}
      </>}
      {view.mode === 'title' && <div className="child-intro">
        <div className="child-kicker"><span /> ETT ÄVENTYR EFTER LÄGGDAGS</div>
        <h2>STAR<span>CHILD<span className="child-title-star">✦</span></span></h2>
        <p className="child-tagline">{starChild.subtitle}</p><p className="child-intro-text">{starChild.intro}</p>
        <button className="child-primary" onClick={start}><Play size={18} fill="currentColor" />{starChild.start}<ArrowRight size={18} /></button>
        <button className="child-help-link" onClick={() => setGuide(true)}>Hur spelar man?</button>
        <div className="child-intro-meta"><span>03 OMRÅDEN</span><span>04 KRAFTER</span><span>01 GOD NATT</span></div>
      </div>}
      {view.mode === 'title' && <div className="child-postcard" aria-hidden="true"><span>01 — SÖMNSKOGEN</span><p>Alla sover.<br />Nästan.</p></div>}
      {view.mode === 'playing' && <div className="child-controls">
        <div className="child-direction"><button {...control('left')} aria-label="Gå vänster"><ArrowLeft /></button><button {...control('right')} aria-label="Gå höger"><ArrowRight /></button></div>
        <div className="child-keyboard-hint">← → GÅ · SPACE HOPPA · X SKJUT · SHIFT RUSA<span>{timeLabel(view.time)} <i>·</i> REKORD {best} ✦</span></div>
        <div className="child-actions"><button {...control('dash')} className={`child-dash ${view.dash > 0 ? 'charging' : ''}`} aria-label="Ljusrusning" aria-description="Skyddar och reflekterar eldklot. Två sekunders laddning."><Zap size={18} /><span>{view.dash > 0 ? `${view.dash.toFixed(1)} S` : 'RUSA'}</span></button><button {...control('fire')} className="child-fire" aria-label="Skjut stjärnljus"><Crosshair size={23} /><span>SKOTT</span></button><button {...control('jump')} className="child-jump" aria-label="Hoppa"><ArrowUp size={25} /><span>HOPP</span></button></div>
      </div>}
      {view.mode === 'playing' && <div className="child-journey" aria-label="Framsteg genom skogen"><i style={{ width: `${view.progress * 100}%` }} /></div>}
      {(view.mode === 'paused' || view.mode === 'dead' || view.mode === 'won' || guide) && <div className="child-overlay">
        <section className="child-dialog" role="dialog" aria-modal="true" aria-label={guide ? 'Så spelar du' : view.mode === 'paused' ? 'Spelet pausat' : 'Nattens resultat'}>
          {guide ? <><button className="child-close" onClick={closeGuide} aria-label="Stäng spelguide"><X size={20} /></button><div className="child-kicker">INNAN SKOGEN VAKNAR</div><h3>Lite handlag.</h3><div className="child-guide">{starChild.controls.map(c => <div key={c.title}><strong>{c.title}</strong><p>{c.text}</p></div>)}</div><button className="child-primary" onClick={view.mode === 'paused' ? resume : start}>{view.mode === 'paused' ? 'Fortsätt' : 'Jag är redo'} <ArrowRight size={18} /></button></> : view.mode === 'paused' ? <><div className="child-kicker">INGEN BRÅDSKA</div><h3>Skogen väntar.</h3><p>Ta ett andetag. Stjärnorna ligger kvar.</p><button className="child-primary" onClick={resume}><Play size={18} />Fortsätt</button><button className="child-help-link" onClick={() => setGuide(true)}>Visa kontroller</button><button className="child-secondary" onClick={start}><RotateCcw size={16} />Börja om</button></> : <><div className="child-result-star">{view.mode === 'won' ? '✦' : '☾'}</div><div className="child-kicker">{view.mode === 'won' ? 'SKOGENS NYA STJÄRNA' : 'NATTENS RESULTAT'}</div><h3>{view.mode === 'won' ? starChild.victory : starChild.defeat}</h3><p>{view.mode === 'won' ? starChild.victoryLead : starChild.defeatLead}</p><div className="child-results"><div><b>{view.stars}</b><span>STJÄRNOR</span></div><div><b>{timeLabel(view.time)}</b><span>I NATTEN</span></div><div><b>{view.level + 1}</b><span>KRAFTNIVÅ</span></div></div><p className="child-achievements">{view.relics}/3 månskärvor · {view.comets} kometer · {view.kills} monster</p><button className="child-primary" onClick={start}><RotateCcw size={18} />En natt till</button></>}
        </section>
      </div>}
      <span className="sr-only" aria-live="polite">{view.mode === 'dead' ? starChild.defeat : view.mode === 'won' ? starChild.victory : ''}</span>
      <div className="child-corner" aria-hidden="true"><Sparkles size={11} /> RYMDFABRIKEN ARCADE</div>
    </div>
  )
}
