# Validation record

Verified locally on Windows on 2 October 2026 with Node.js 24.18.1 and installed Google Chrome.

- `npm test`: 14 of 14 tests passed, covering flight behavior and terrain topology.
- `npm run build`: production build completed without warnings; Three.js is split into its own cached bundle.
- Chrome integration suite passed against both the development server and production preview. The final production run exercised flight entry, engine throttle, individual brake, F weight shift, hands-up override, pause/resume, guide, settings, restart, an 800 × 600 viewport, and ground takeoff.
- Production takeoff progressed from ground state to more than 8 m AGL under keyboard throttle.
- No JavaScript or shader errors were reported in the production browser run.
- Inspected rendered welcome, flying, compact-view, guide and takeoff screenshots in `test-results/`.
- The integration run measured a mean 16.67 ms frame interval (approximately 60 fps) during a short balanced-quality, 1440 × 900 headless Chrome sample. This is a local observation, not a hardware-independent performance guarantee. High-quality initial scene: approximately 1.23 million triangles and 186 render calls from Three.js counters.
- `npm audit --omit=dev`: zero reported runtime dependency vulnerabilities at the time of the check.

These tests establish software behavior, not real-aircraft fidelity. There has been no real-pilot evaluation, measured flight-data comparison, or certification. See `FLIGHT_MODEL.md` for the exact approximations.
