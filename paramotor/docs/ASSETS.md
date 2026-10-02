# Asset provenance

All scene-specific assets were authored as code for this repository. No third-party model, photograph, texture, font, audio sample or manufacturer logo is bundled.

| Asset | Implementation |
| --- | --- |
| Canopy and seams | Parametric 40-cell double-surface geometry in `src/aircraft.js` |
| Suspension lines | Branching line geometry with animated attachment positions |
| Pilot and paramotor | Original assembled geometry, animated joints, cage/net, engine, tank and propeller |
| Terrain | Seeded height functions and a generated mesh; grass/soil noise texture and world-space surface shading |
| Water | Original animated shader with wave normals, Fresnel color and sun highlights |
| Trees, rocks and structures | Instanced original primitive-based meshes |
| Clouds | Locally generated alpha sprites |
| Sky | Three.js `Sky` addon (Three.js MIT license) |
| Branding and favicon | Original AER text treatment and SVG wing mark |
| Audio | Web Audio oscillators, filtered procedural noise and synthesized variometer tones |
| Fonts | System font stack; no downloads |

The scene is a fictional alpine location. The 46° N label is atmospheric context, not georeferenced terrain data. Manufacturer specifications informed scale and behavior only; the generic aircraft carries original AER branding.

Runtime dependency: Three.js, MIT license. Build/test dependencies: Vite, MIT license; Playwright, Apache-2.0 license. Their license files remain in the installed packages; versions and integrity hashes are locked in `package-lock.json`.
