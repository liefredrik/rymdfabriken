import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowLeft, ArrowRight, ArrowUp, Heart, Maximize2, Minimize2, Pause, Play, RotateCcw, Sparkles, Volume2, VolumeX, Zap } from 'lucide-react'
import { starMegaMan as copy } from '../../data/starmegaman'
import { ForestArt } from './art'
import { NightAudio } from './audio'
import { Night, WORLD, freshControls } from './model'
import type { Controls } from './model'
import './game.css'

function snapshot(game: Night) {
  return { phase: game.phase, health: game.player.health, stars: game.stars, power: game.power, chapter: game.chapter, progress: game.player.x / WORLD, notice: game.noticeTime > 0 ? game.notice : '', boss: game.boss.active, bossHealth: game.boss.health, shield: game.boss.shield, elapsed: game.elapsed, defeated: game.defeated }
}
function readBest() { try { return Number(localStorage.getItem('starmegaman-best')) || 0 } catch { return 0 } }

export function StarMegaManGame() {
  const root = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [initialGame] = useState(() => new Night())
  const game = useRef(initialGame)
  const controls = useRef(freshControls())
  const audio = useRef<NightAudio | null>(null)
  const [view, setView] = useState(() => snapshot(initialGame))
  const [muted, setMuted] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [best, setBest] = useState(readBest)
  const [fullError, setFullError] = useState('')
  const publish = useCallback(() => setView(snapshot(game.current)), [])
  const clearControls = useCallback(() => { controls.current = freshControls(); game.current.jumpHeld = false }, [])
  const pause = useCallback(() => { game.current.pause(); clearControls(); audio.current?.suspend(); publish() }, [clearControls, publish])
  const begin = () => {
    if (game.current.phase === 'lost' || game.current.phase === 'won') { game.current = new Night(); audio.current?.reset() }
    clearControls(); game.current.start(); audio.current?.unlock(); publish(); root.current?.focus({ preventScroll: true })
  }
  const resume = () => { clearControls(); game.current.resume(); audio.current?.unlock(); publish(); root.current?.focus({ preventScroll: true }) }
  const toggleSound = () => { const next = !muted; setMuted(next); audio.current?.setMuted(next); if (!next && game.current.phase === 'playing') audio.current?.unlock() }
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else if (root.current?.requestFullscreen) await root.current.requestFullscreen()
      else setFullError('Helskärm stöds inte här. Spelet fungerar lika bra i webbläsaren.')
    } catch { setFullError('Helskärm kunde inte öppnas. Fortsätt spela här.') }
  }

  useEffect(() => {
    const surface = canvas.current, host = root.current
    if (!surface || !host) return
    const context = surface.getContext('2d', { alpha: false })
    if (!context) return
    const sound = new NightAudio(); audio.current = sound
    const art = new ForestArt(), reduced = matchMedia('(prefers-reduced-motion: reduce)')
    let width = 600, height = 300, frame = 0, previous = 0, accumulator = 0, lastPublished = 0, lastPhase = game.current.phase
    const resize = () => {
      const box = surface.getBoundingClientRect()
      width = Math.max(220, Math.round(300 * box.width / Math.max(1, box.height))); height = 300
      surface.width = width; surface.height = height
    }
    const observer = new ResizeObserver(resize); observer.observe(surface); resize()
    const onFullscreen = () => { setFullscreen(document.fullscreenElement === host); resize() }
    const onHidden = () => { if (document.hidden) pause() }
    const keyMap: Record<string, keyof Controls> = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'jump', KeyW: 'jump', Space: 'jump', KeyX: 'fire' }
    const keyDown = (event: KeyboardEvent) => {
      if (!host.contains(document.activeElement) || event.ctrlKey || event.metaKey || event.altKey) return
      if (event.code === 'Escape' || event.code === 'KeyP') {
        if (event.repeat) return
        event.preventDefault()
        if (game.current.phase === 'playing') pause()
        else if (game.current.phase === 'paused') { game.current.resume(); sound.unlock(); publish() }
        return
      }
      const action = keyMap[event.code]
      if (action && game.current.phase === 'playing') { event.preventDefault(); controls.current[action] = true }
    }
    const keyUp = (event: KeyboardEvent) => { const action = keyMap[event.code]; if (action) controls.current[action] = false }
    const loop = (now: number) => {
      const delta = previous ? Math.min((now - previous) / 1000, .08) : 0; previous = now
      accumulator += delta
      while (accumulator >= 1 / 60) { game.current.update(1 / 60, controls.current); accumulator -= 1 / 60 }
      const current = game.current
      const terminal = current.phase === 'won' || current.phase === 'lost'
      if (current.phase !== lastPhase) {
        if (terminal) {
          setBest(old => {
            const next = Math.max(old, current.stars)
            try { localStorage.setItem('starmegaman-best', String(next)) } catch { /* Private browsing can disable storage. */ }
            return next
          })
          clearControls()
        }
        lastPhase = current.phase
      }
      // A set prevents a burst of simultaneous pickups from overloading the audio mixer.
      for (const cue of new Set(current.cues)) sound.cue(cue)
      current.cues.length = 0
      if (current.phase === 'playing') sound.music(current.elapsed, current.boss.active)
      art.draw(context, current, width, height, current.phase === 'ready' ? now / 1000 : current.elapsed, reduced.matches)
      if (now - lastPublished > 90) { setView(snapshot(current)); lastPublished = now }
      frame = requestAnimationFrame(loop)
    }
    document.addEventListener('visibilitychange', onHidden); document.addEventListener('fullscreenchange', onFullscreen)
    window.addEventListener('blur', pause); window.addEventListener('keydown', keyDown); window.addEventListener('keyup', keyUp)
    frame = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(frame); observer.disconnect(); sound.dispose(); audio.current = null; controls.current = freshControls()
      document.removeEventListener('visibilitychange', onHidden); document.removeEventListener('fullscreenchange', onFullscreen)
      window.removeEventListener('blur', pause); window.removeEventListener('keydown', keyDown); window.removeEventListener('keyup', keyUp)
    }
  }, [clearControls, pause, publish])

  const press = (action: keyof Controls, down: boolean) => { if (game.current.phase === 'playing') controls.current[action] = down }
  const power = copy.powers[view.power]
  const nextPower = copy.powers[view.power + 1]
  const fill = nextPower ? (view.stars - power.at) / (nextPower.at - power.at) : 1
  const active = view.phase === 'playing'
  return (
    <div ref={root} className="smm-game glow-ring" tabIndex={-1} aria-label="StarMegaMan spelområde" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) pause() }}>
      <div className="smm-toolbar">
        <div className="smm-chapter"><span className="smm-live-dot" /><span>{String(view.chapter + 1).padStart(2, '0')} <span className="smm-chapter-name">/ {copy.chapters[view.chapter].name}</span></span></div>
        <div className="smm-tools">
          <button type="button" className="smm-icon" onClick={toggleSound} aria-label={muted ? 'Slå på ljud' : 'Stäng av ljud'} aria-pressed={!muted}>{muted ? <VolumeX size={17} /> : <Volume2 size={17} />}</button>
          <button type="button" className="smm-icon" onClick={toggleFullscreen} aria-label={fullscreen ? 'Lämna helskärm' : 'Helskärm'}>{fullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}</button>
          <button type="button" className="smm-icon" onClick={view.phase === 'paused' ? resume : pause} disabled={view.phase !== 'playing' && view.phase !== 'paused'} aria-label={view.phase === 'paused' ? 'Fortsätt spela' : 'Pausa'}>{view.phase === 'paused' ? <Play size={17} /> : <Pause size={17} />}</button>
        </div>
      </div>
      <div className="smm-viewport">
        <canvas ref={canvas} className="smm-canvas" aria-label="En liten robot samlar stjärnor i en sovande pixelskog. Styr med knapparna nedanför eller tangentbordet.">Din webbläsare behöver stöd för Canvas för att visa spelet.</canvas>
        {view.phase !== 'ready' && <div className="smm-hud">
          <div className="smm-hearts" aria-label={`${view.health} av 5 hjärtan`}>{Array.from({ length: 5 }, (_, i) => <Heart key={i} size={17} fill={i < view.health ? 'currentColor' : 'transparent'} className={i < view.health ? '' : 'smm-empty-heart'} />)}</div>
          <div className="smm-score"><Sparkles size={16} /> <span>{String(view.stars).padStart(3, '0')}</span></div>
        </div>}
        {active && view.boss && <div className="smm-boss"><div><span>{copy.boss.name}</span><span>{view.shield ? 'Lo skyddar mamma' : 'En öppning. Skjut!'}</span></div><div role="progressbar" aria-label="Mamma Röds kraft" aria-valuemin={0} aria-valuemax={90} aria-valuenow={view.bossHealth}><i style={{ width: `${view.bossHealth / 90 * 100}%` }} /></div></div>}
        {active && view.notice && <div className="smm-notice" role="status">{view.notice}</div>}
        {view.phase === 'ready' && <div className="smm-overlay smm-intro">
          <div className="smm-overline"><span /> PIXELÄVENTYR · 1 SPELARE</div>
          <h2>SKOGEN SOVER.<br /><span>DU HAR NATTSKIFT.</span></h2>
          <p>{copy.intro}</p>
          <button type="button" className="smm-primary" onClick={begin}><Play size={18} fill="currentColor" />{copy.start}<ArrowRight size={18} /></button>
          <span className="smm-start-note">Hörlurar passar bra. Kaffe är valfritt.</span>
        </div>}
        {view.phase === 'paused' && <div className="smm-overlay smm-dialog" role="group" aria-label="Spelet är pausat"><span className="smm-overline">NATTSKIFTET VÄNTAR</span><h2>En liten paus.</h2><p>Skogen springer ingenstans.</p><button type="button" className="smm-primary" onClick={resume}><Play size={18} />Fortsätt spela</button></div>}
        {(view.phase === 'lost' || view.phase === 'won') && <div className="smm-overlay smm-dialog" role="group" aria-label={view.phase === 'won' ? 'Du vann' : 'Spelet är slut'}>
          <span className="smm-overline">{view.phase === 'won' ? 'NATTSKIFTET AVKLARAT' : 'SLUT PÅ STJÄRNLJUS'}</span>
          <h2>{view.phase === 'won' ? copy.won : copy.dead}</h2>
          <p>{view.phase === 'won' ? copy.ending : 'Fem nya hjärtan. Samma envisa lilla robot.'}</p>
          <div className="smm-results"><span><strong>{view.stars}</strong> stjärnor</span><span><strong>{Math.floor(view.elapsed / 60)}:{String(Math.floor(view.elapsed % 60)).padStart(2, '0')}</strong> i skogen</span></div>
          <button type="button" className="smm-primary" onClick={begin}><RotateCcw size={18} />En natt till</button>
        </div>}
      </div>
      <div className="smm-console">
        <div className="smm-power"><div><Zap size={13} /><span style={{ color: power.color }}>{power.name}</span><span>{nextPower ? `${view.stars} / ${nextPower.at}` : 'MAX'}</span></div><div className="smm-meter" role="progressbar" aria-label="Stjärnkraft" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(fill * 100)}><i style={{ width: `${fill * 100}%`, background: power.color }} /></div></div>
        <span className="smm-record">BÄSTA NATT <strong>{Math.max(best, view.stars)}</strong></span>
      </div>
      <div className="smm-controls" aria-label="Spelkontroller">
        <div className="smm-control-group"><Control action="left" label="Gå vänster" hint="A / ←" press={press} disabled={!active}><ArrowLeft /></Control><Control action="right" label="Gå höger" hint="D / →" press={press} disabled={!active}><ArrowRight /></Control></div>
        <span className="smm-control-caption">FÅNGA LJUSET.<br />BEHÅLL LUGNET.</span>
        <div className="smm-control-group"><Control action="jump" label="Hoppa" hint="HOPP" press={press} disabled={!active}><ArrowUp /></Control><Control action="fire" label="Skjut stjärnljus" hint="SKOTT" press={press} disabled={!active}><Zap /></Control></div>
      </div>
      <div className="smm-journey" aria-hidden="true"><i style={{ width: `${view.progress * 100}%` }} /></div>
      <span className="sr-only" role="status">{view.phase === 'lost' ? copy.dead : view.phase === 'won' ? copy.won : `${view.health} hjärtan. ${power.name}. ${copy.chapters[view.chapter].name}.`}</span>
      {fullError && <p className="smm-error" role="status">{fullError}</p>}
    </div>
  )
}

function Control({ action, label, hint, press, disabled, children }: { action: keyof Controls; label: string; hint: string; press: (action: keyof Controls, down: boolean) => void; disabled: boolean; children: ReactNode }) {
  return <button type="button" className={`smm-control smm-control-${action}`} aria-label={label} disabled={disabled}
    onPointerDown={event => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); press(action, true) }}
    onPointerUp={() => press(action, false)} onPointerCancel={() => press(action, false)} onLostPointerCapture={() => press(action, false)}
    onKeyDown={event => { if (event.code === 'Space' || event.code === 'Enter') { event.preventDefault(); event.stopPropagation(); press(action, true) } }}
    onKeyUp={event => { if (event.code === 'Space' || event.code === 'Enter') { event.preventDefault(); event.stopPropagation(); press(action, false) } }}
    onBlur={() => press(action, false)}>{children}<span>{hint}</span></button>
}
