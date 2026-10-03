# StarMegaMan

An original, Swedish, mobile browser platform game at `/starmegaman`. This folder belongs to the main Rymdfabriken repository; it requires no separate build or server.

- `model.ts`: deterministic 60 Hz simulation, double jump with coyote time and input buffering, one-way platforms, star magnet and four power levels, three enemy variants, invulnerability, boss shield cycle, win/loss states.
- `art.ts`: original pixel sprites, layered forest, sleeping wildlife, comets, particles and guardian family, painted at a low native canvas resolution.
- `audio.ts`: synthesized effects and an adaptive musical arpeggio. No downloaded assets or audio requests.
- `StarMegaManGame.tsx`: React lifecycle, fixed timestep, scoped keyboard input, multitouch buttons, automatic pause, fullscreen, best score and accessible controls.
- `../../data/starmegaman.ts`: Swedish copy and progression thresholds.

Use arrows or A/D to move, Space/W/Up to double jump, hold X to shoot, and P/Escape to pause. Touch buttons support simultaneous pointers. A new power level restores one heart; losing five hearts resets the run. Mamma Röd is vulnerable between Lo's protective bubbles. The child is not a damage target.

`node --test tests/starmegaman.test.mjs` runs simulation tests with Node 24's TypeScript support. `npm run build` type-checks and builds the entire website, including the existing paramotor sub-project. Browser verification should cover 390 px portrait, multitouch, desktop keyboard, pause/resume, restart, sound toggle, navigation and theme changes.

Best score is stored only in local storage; unavailable storage or audio does not block gameplay. Reduced-motion preference disables camera shake, comet flight and floating pickups. Essential gameplay animation remains enabled.
