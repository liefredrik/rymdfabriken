# MegaStar

Ett pixelspel för mobilen från Rymdfabriken, publicerat på [rymdfabriken.se/megastar/](https://rymdfabriken.se/megastar/).

Du är en liten robot i en skog där alla djur har somnat. Stjärnor faller som kometer; fånga dem och du
blir mäktigare, nivå för nivå. Monsterstjärnor jagar dig, något gräver sig upp ur marken och kastar
eld, och längst in i skogen väntar bossen Mamma Rut med sin tvååriga medhjälpare Iris, som stjäl
dina stjärnor och bär dem till mamma.

## Köra lokalt

```bash
cd megastar
npm install
npm run dev       # http://127.0.0.1:5174/megastar/
npm run build     # typkontroll + produktion till ../dist/megastar/
```

Rotens `npm run build` kör det här bygget automatiskt efter webbplatsen och simulatorn.

## Kontroller

| Mobil | Tangentbord | Gör |
| --- | --- | --- |
| ◀ ▶ | Pilar eller A/D | Spring |
| HOPP | Mellanslag, W, Z eller K | Hopp (dubbelhopp från nivå 2, trippel på nivå 8) |
| SKJUT | X, J eller Shift | Stjärnskott (från nivå 3) |
| II | P eller Escape | Paus |
| 🔊 | M | Ljud av/på |

Nedre delen av skärmen fungerar också som osynliga zoner: vänster tredjedel springer åt vänster,
nästa åt höger, höger hörn hoppar.

## Nivåer

| Stjärnor | Nivå | Effekt |
| --- | --- | --- |
| 5 | Snabba fötter | Snabbare, högre hopp |
| 11 | Dubbelhopp | Ett hopp till i luften |
| 18 | Stjärnskott | Skjut-knappen låses upp |
| 26 | Extra hjärta | Fyra hjärtan, skott går igenom fiender |
| 35 | Stjärnmagnet | Stjärnor dras till dig |
| 45 | Trippelskott | Tre skott i solfjäder |
| 56 | Stjärnaura | Monsterstjärnor brinner nära dig, fem hjärtan |
| 70 | MEGASTAR | Trippelhopp, stora skott, gyllene glöd |

Tar hjärtan slut börjar du om från början, med nivå 0.

## Teknik

- Vite + TypeScript utan runtime-beroenden.
- All grafik är handritade pixelsträngar i `src/sprites.ts` som bakas till canvas vid start. Träd,
  mark och himmel genereras procedurellt i `src/world.ts`.
- Egen 5×7-pixelfont med Å, Ä och Ö i `src/font.ts`.
- Allt ljud, inklusive musiken till skogen, bossen och segern, syntetiseras i `src/audio.ts` med
  Web Audio. Ljudet startar vid första tryck.
- Spelet renderas i en låg virtuell upplösning (190 px bred i stående läge, 220 px hög i liggande)
  och skalas upp utan utjämning. I stående läge lyfts marken över tumkontrollerna.
- `window.__MEGASTAR__` exponerar en liten testkrok (`game.debug`) för skriptade genomspelningar.
