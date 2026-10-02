# Rymdfabriken

Nytt skal för [rymdfabriken.se](https://rymdfabriken.se): haiku, varelser och radioteater av Fredrik Lie.

Sidan är byggd om från grunden men behåller det som gjorde originalet till sitt:
Frijole som displaytypsnitt, den orangea glöden mot djup rymd och det kosmiska nätet
(`rodblanebulosa.jpg`) som bakgrund. Allt diktinnehåll är hämtat ordagrant från den gamla sidan.

## Stack

- React 19 + TypeScript, byggt med Vite
- Tailwind CSS v4 (tema i `src/index.css`)
- Framer Motion för sidövergångar, scroll- och mikroanimationer
- Lucide React för ikoner
- React Router för sidorna

## Kom igång

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # produktion till dist/
npm run preview  # förhandsgranska dist/
```

## Struktur

```
src/
  data/        haiku.ts, creatures.ts, comics.ts, site.ts – allt innehåll
  components/  Navbar, Footer, Starfield, NebulaBackground, HaikuCollection, …
  pages/       Home, Universum, Stjarnor, Livet, Radioteater, University, NotFound
  hooks/       useTheme, useSpotlight, useLockBody
public/images/ bilder från den gamla sidan, public/images/bengt/ seriestripparna
```

## Sidor

| Route           | Innehåll                                                      |
| --------------- | ------------------------------------------------------------- |
| `/`             | Hero, manifestet från gamla startsidan, bento-grid, slumphaiku |
| `/universum`    | Samling I–II med filter, sök, blanda och läsläge               |
| `/stjarnor`     | Samling III–VIII med samma verktyg                             |
| `/livet`        | Galleri med sex varelser och lightbox                          |
| `/radioteater`  | SoundCloud-spelare, lyssningstips och FAQ                      |
| `/university`   | Fotoserien Bengt & Lane i två avsnitt, med helskärmsläsare     |
| `/paramotor/`   | AER, en fristående Three.js-paramotorsimulator (se `paramotor/README.md`) |

Avdelningarna *springa*, *bokcirkel* och *CA* från den gamla sidan är medvetet utelämnade.

## Paramotorsimulatorn

`paramotor/` är ett eget Vite-projekt med egen `package-lock.json`. Rotens `npm run build` bygger
först webbplatsen och kör sedan `npm ci` och `vite build` i `paramotor/`, som skriver till
`dist/paramotor/` med `base: '/paramotor/'`. Länken i menyn är en vanlig `<a href>` eftersom
simulatorn inte ingår i React-routern. `npm run test:paramotor` kör dess flygmekaniktester.

## Deploy

Sajten ligger på Netlify och byggs automatiskt vid push till `main`. `netlify.toml` sätter
byggkommando, Node-version och cache-headers; `public/_redirects` sköter gamla adresser,
SPA-fallback och håller routern borta från `/paramotor/`.
