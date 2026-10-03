# StarChild

Ett mobilanpassat pixeläventyr för Rymdfabriken, på `/starchild`. En liten rymdpilot
fångar stjärnor i Sömnskogen, Stjärnfallet och Månporten. Skogen har sovande rävar,
kaniner och ugglor, stjärnmonster, varelser som kryper ur marken och en slutstrid
mot rödhåriga Aurora. Hennes tvååriga dotter Lo hjälper henne med en bubbelsköld.

## Spela

- **A/D eller pilar:** gå. **Mellanslag/W/upp:** hopp och dubbelhopp.
- **X/J:** håll för stjärnskott. **Shift/C:** ljusrusning; två sekunders laddning.
- **P/Escape:** paus. Paus sker även när fliken eller spelet förlorar fokus.
- Mobilen har fem knappar som stöder samtidiga tryck, individuella släpp och cancel.
- Stjärnor ger fyra kraftnivåer, starkare skott, magnetradie och ett återställt hjärta.
- Kometer faller, landar och slocknar efter tolv sekunder. De ger tre stjärnor.
- Tre månskärvor finns ovanför grenarna. Varje skärva återställer ett hjärta.
- Rusningen skyddar piloten och skickar tillbaka eldklot. Bossen har skyddade och
  öppna perioder, riktade skott och en markerad markattack. Lo är ingen skadetavla.
- Fem hjärtan. Död innebär en ny omgång från början. Rekord och ljudval sparas lokalt.

## Teknik

| Fil | Ansvar |
| --- | --- |
| `../../data/starchild.ts` | Svensk text, världens områden och kraftnivåer |
| `engine.ts` | DOM-fri, deterministisk simulering med fast 120 Hz-tidssteg |
| `art.ts` | Pixelmatriser, palett och animerad pilot med halsduk |
| `renderer.ts` | Canvas, cachade granar, parallax, vattenfall, ljus och partiklar |
| `audio.ts` | Web Audio-musik och syntetiserade effekter |
| `StarChildGame.tsx` | Inmatning, snabbtrycksbuffer, menyer, HUD, ljud och rekord |
| `starchild.css` | Avgränsad styling för stående/liggande vy och storbild |

Spelet vidareutvecklar sajtens befintliga MegaStar-grund i ett eget paket. Det ändrar
inte de andra spelen. StarChild har sin egen pilot, skogsgrafik, data, kraftrusning,
kometmekanik, månskärvor, bossattacker, lagringsnycklar och teståtkomst. Inga nya
dependencies eller byggskript. Spelkoden laddas först när spelaren öppnar sidan.
Grafiken ritas direkt i canvas utan externa bilder; musiken syntetiseras efter
användarens första tryck. Spelet använder inga nätanrop, konton eller telemetri.

`prefers-reduced-motion` fryser kosmetisk rörelse och stänger av kameraskakning och
mjuk kameraföljning. Spelets nödvändiga förflyttningar fortsätter. Menyer har
tangentbordsfokus, fokusfälla och tydliga knapptillstånd. Canvas kräver visuell
orientering; HUD och menyer har textetiketter men spelet är inte skärmläsarspelbart.

## Verifiera

Kör från repots rot:

```sh
npm run build
node --experimental-strip-types --test tests/starchild-engine.test.ts
npm run dev -- --host 127.0.0.1 --port 5193
node tests/starchild-browser.mjs
node tests/starchild-journey.mjs
```

Webbläsartesterna använder installerad Chrome och Playwright från det befintliga
`paramotor/node_modules`, som installeras av rotens ordinarie bygge. `STARCHILD_URL`
kan ange en annan server. Skärmbilder sparas i ignorerade `test-results/`.

`?qa` exponerar simuleringen endast på Vites utvecklingsserver. Produktionsbygget
innehåller ingen QA-åtkomst. De tolv simuleringstesterna kontrollerar bland annat
skada/död, kraftnivåer, kometernas livscykel, rusning/reflektion, månskärvornas
nåbarhet, bossens två faser och en komplett vunnen omgång utan tillståndsändringar.
Journey-testet spelar dessutom från start till vinst med riktiga tangenttryck i
Chrome; QA används bara för att läsa läget. Browser-testet kontrollerar menyer,
ljudval, omstart, multi-touch, fokus, storbild, temaväxling och mobilorienteringar.

Mobiltesterna emulerar 390 × 844 och 844 × 390 i Chrome. De ersätter inte test på
en fysisk iPhone eller Android-telefon.
