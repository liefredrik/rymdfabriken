# AER project context

Original keyboard paramotor simulator requested by the workspace owner. Local browser app, Three.js, Vite, plain ES modules, no backend or runtime network dependencies.

The user prioritizes realistic handling and a third-person rear view. Preserve ArrowLeft/Right brakes, ArrowDown both brakes, ArrowUp release, Space engine, A/F weight steering. Ground starts assume a preinflated wing; airborne starts are the default.

Keep SI units and fixed 120 Hz stepping in the simulation. Rendering does not own physics. Document approximations and distinguish measured source specifications from tuned coefficients in `docs/FLIGHT_MODEL.md`. Do not imply certified training fidelity.

Validation: `npm test`, `npm run build`, then run a local server and `npm run test:browser` using installed Chrome. Review generated screenshots in `test-results/`; shader errors can make an otherwise running scene incomplete. Terrain geometry must be subdivided on both axes.
