# MegaStar

Ett fristående spelpaket inne i sajtens befintliga Git-repo. Publiceras som React-routen `/megastar` och laddas först när spelaren öppnar sidan. Inget separat bygge, inga externa spelresurser och ingen ny dependency. Paramotorprojektet är orört.

## Innehåll

- Tre sammanhängande områden i en kvällsskog med parallax, sovande djur, lyktor, kometer och eldflugor.
- Originalritade pixelsprites: robot, monster, mamma Mira och hennes tvååriga hjälpreda Juni. Mira har två attackfaser; Junis bubbelsköld växlar mellan skydd och öppning. Barnet är inget skademål.
- Stjärnor och besegrade monster ger kraft. Vid 8, 20 och 38 stjärnor förbättras skotten och magnetradien; en ny nivå återställer ett hjärta.
- Fem hjärtan, tydliga eldklot, tillfällig osårbarhet efter träff, död och en helt ny resa vid omstart. Inga köp, konton eller telemetri.
- Dubbelhopp, hoppbuffert, kort marginal efter en plattformskant och variabel hopphöjd. Tangentbord eller flera samtidiga pekare. Paus vid förlorat fokus.
- Syntetiserad pentatonisk bakgrundsmusik och ljudeffekter med Web Audio. Ljud startas endast efter användarens knapptryck. Ljud av och storbild finns direkt i spelet.
- Lokalt stjärnrekord, stående/liggande mobilvy, tangentbordsfokus och begränsad kosmetisk rörelse vid `prefers-reduced-motion`.

## Filer

| Fil | Ansvar |
| --- | --- |
| `../../data/megastar.ts` | Svensk text, områden och kraftnivåer |
| `engine.ts` | DOM-fri simulering, kollision, fiender, skott, progression och boss |
| `art.ts` | Originalritade pixelsprites och cache |
| `renderer.ts` | Pixelcanvas, skog, parallax, ljus och animation |
| `audio.ts` | Syntes och kort musikschemaläggning |
| `MegaStarGame.tsx` | 120 Hz-spelloop, mobil/tangentbord, HUD och menyer |
| `megastar.css` | Avgränsad spelstyling, båda orienteringarna och storbild |

Koordinater i logiska bildpunkter, tid i sekunder. En fast 120 Hz-simulering är separat från canvasritningen. Robotens `y` avser fötterna. Grenar är plattformar som bara kolliderar på nedväg; marken är sammanhängande. Spelart, musik och karaktärer är original skapade för detta projekt.

## Kontroll

Från repots rot:

```sh
node --experimental-strip-types --test tests/megastar-engine.test.ts
npm run build
npm run dev -- --host 127.0.0.1 --port 5180
node tests/megastar-browser.mjs
```

Webbläsartestet använder installerad Chrome och den Playwright-installation som redan finns i `paramotor/node_modules` efter rotens bygge. `MEGASTAR_URL` väljer en annan server. Skärmbilder hamnar i ignorerade `test-results/`. Dev-läget `?qa` exponerar testfixturer; produktionsbygget innehåller inte den åtkomsten.

Verifierat 3 oktober 2026: sju simuleringstester, inklusive en vunnen hel genomspelning med enbart vanliga styrsignaler; Chrome med mus/tangentbord samt mobil emulering 390 × 844 och 844 × 390, tre samtidiga touchpunkter, släpp/cancel, paus, omstart, storbild och navigering. Pixelbilder granskade för titel, spel, boss, vinst och båda mobilorienteringarna. Mobilkontrollen är webbläsaremulering, inte en fysisk iPhone/Android-enhet.
