export type Haiku = {
  id: string
  chapter: string
  lines: [string, string, string]
}

export type Chapter = {
  numeral: string
  title: string
  blurb: string
  haiku: Haiku[]
}

const h = (chapter: string, ...rows: string[][]): Haiku[] =>
  rows.map((lines, i) => ({
    id: `${chapter}-${i + 1}`,
    chapter,
    lines: lines as [string, string, string],
  }))

/** Universum: samlingarna I och II. */
export const universum: Chapter[] = [
  {
    numeral: 'I',
    title: 'Årstider på andra världar',
    blurb:
      'Vinter på Titan, vår på Centauri. Tjugotvå dikter om längtan, kryosömn och den krökta stjärndansen.',
    haiku: h(
      'I',
      ['Vintern på Titan', 'kolonisatörsmode', 'isblå karbonjeans'],
      ['Drömmar om våren', 'när jag vaknar från kryo', 'hård keramiksäng'],
      ['Utan galaxen', 'dess dolda materia', 'vintrars energi'],
      ['Alcubjerre twist', 'tusen vintrar att längta', 'hästhuvudstunnel'],
      ['I skötet om hösten', 'lämnade vi våra ok', 'och red med vinden'],
      ['Uppkopplad kropps vår', 'nu lever vi i tanke', 'evigt skådespel'],
      ['Överflödig tid', 'blev menlös utan rum', 'utan effekt'],
      ['Utan fysiken', 'blev tanken fri att resa', 'universums vår'],
      ['Soluppgång i intet', 'rester av en rotation', 'fyller sin funktion'],
      ['Trött höstsjäl ensam', 'i ett ekande rumsskepp', 'framme på Io'],
      ['Lagervarelser', 'i en kaotisk stjärnhamn', 'bråkar om vädret'],
      ['Drake hade missat', 'det finns överallt', 'upp steg livets mening'],
      ['Killens stjärnglans', 'svänger som harmoni', 'vi dansar i vakuum'],
      ['En perfekt blandning', 'gav blues i warp speed', 'oscillationer'],
      ['Rosor planteras', 'våren glöder på Centauri', 'blixtfärger i rött'],
      ['Kokande svavel', 'gör all radio menlös', 'inget dösnack då'],
      ['Om Tellus visste', 'att dom som vågade åka', 'skrattar med gudar'],
      ['Orions bästa', 'legenden om hur dom fann', 'sin kärleksförklaring'],
      ['Dom sista som for', 'genom tidens dimension', 'hann ikapp resten'],
      ['rullande och snabb', 'är den effektivaste', 'krökta stjärndansen'],
      ['Kalla planeter', 'är billigare i drift', 'rea på kärlek'],
      ['Plasma som omger', 'metalliskt skydd mot ljus', 'från alltings början'],
    ),
  },
  {
    numeral: 'II',
    title: 'Dom som lärt sig att se',
    blurb: 'Sex dikter om varför världar letar vackra vyer, och vilka som ska få vårt ljus.',
    haiku: h(
      'II',
      ['Letar vackra vyer', 'gör alla världarna först', 'efter tanken fötts'],
      ['Sen letar dom ånyo', 'men tanken som dom nu har', 'skapar mera bry'],
      ['Stjärnor hinner dö', 'galaxers armar sveper', 'till freden vinner'],
      ['Det finns så många', 'alla skepnader vill gro', 'genom att sluka'],
      ['Det onda är lätt', 'men vi vill bara spara', 'dom som lärt sig att se'],
      ['Att bara dom som', 'kan älska ovillkorligt', 'ska få vårat ljus'],
    ),
  },
]

export const universumEpilog = [
  'Att förgöra en konkurrent',
  'det säkraste billigaste enklaste',
  'och därför onödigaste sättet att uppnå makt',
]

/** Stjärnor: samlingarna III till VIII. */
export const stjarnor: Chapter[] = [
  {
    numeral: 'III',
    title: 'Plasmaskir',
    blurb: 'Rymdstrid i technocolor. Pulspaket, bågshock och nebulosor som tänds av kraft från ömse sidor.',
    haiku: h(
      'III',
      ['Elektriskt fras', 'neonblå ljusbågsplasma', 'en himmel brinner'],
      ['Technocolor kaos', 'datorstyrd krigsmanöver', 'pulspaket av kraft'],
      ['Darrande bågshock', 'skeppets yttre plasmaskir', 'avleder energi'],
      ['Reaktiv grön gel', 'smälter fienders försvar', 'förångad frän haze'],
      ['Batterismatter', 'bombmatta rött pulspaket', 'jondrift utslagen'],
      ['Stående vågor', 'av kraft från ömse sidor', 'tänder nebulosor'],
    ),
  },
  {
    numeral: 'IV',
    title: 'Skörd',
    blurb: 'Nebulosor som skördas när årets gravitation varit den rätta.',
    haiku: h(
      'IV',
      ['Skördar nebulosor', 'då årets gravitation', 'varit den rätta'],
      ['Tända stjärnor', 'i vintergatans gryning', 'gav bättre betalt'],
      ['Futtiga småmoln', 'fiskögats rester finns kvar', 'hopplösa framtid'],
      ['Natrium brinner', 'en naken stjärna är född', 'slutet är nära'],
    ),
  },
  {
    numeral: 'V',
    title: 'Större män spelar schack',
    blurb: 'Om kraften som måste tyglas innan världar ser den.',
    haiku: h(
      'V',
      ['Någonstans bakom', 'två världars brinnnande strid', 'spelar större män schack'],
      ['Innan världar ser', 'att största kraften kärlek', 'först måste tyglas'],
      ['Kommer ingen våga', 'varför ge oss tillit', 'att dela kunskap'],
      ['Om vi bara såg', 'den eviga kärleksdans', 'som stjärnor lärt sig'],
    ),
  },
  {
    numeral: 'VI',
    title: 'Vit grotta',
    blurb: 'Läger för natten bland blå lava och amöbors röda åkrar.',
    haiku: h(
      'VI',
      ['I en vit grotta', 'slog vi läger för natten', 'blå lava överallt'],
      ['Slemsky av amöba', 'röda åkrar på ytan', 'hoovrar i stjärndoft'],
      ['Små elaka myller', 'är den vanligaste formen', 'av fän som äter'],
    ),
  },
  {
    numeral: 'VII',
    title: 'Ett tankefel',
    blurb: 'Två dikter om den som bara fick en chans.',
    haiku: h(
      'VII',
      ['Ett tankefel dumt', 'hen hann aldrig tänka till', 'fick bara en chans'],
      ['Planetens enda', 'enorm gyllne slemboll', 'hen befolkar den själv'],
    ),
  },
  {
    numeral: 'VIII',
    title: 'Maskinernas rätt',
    blurb:
      'Sexton dikter om maskiner, bruna dvärgar, svarta hål och den nya eran där rummet oscillerar.',
    haiku: h(
      'VIII',
      ['Som maskinerna', 'hittar en lägre stående', 'att dra dess ok'],
      ['Ska vi då ånyo', 'hitta lagar som snävar', 'maskinernas rätt'],
      ['Eller kan vi nu', 'slappna av och börja leka', 'med vårt sätt att se'],
      ['Gnistregn i lila', 'violetta små blixtar', 'slår emot grön ridå'],
      ['Plasma inferno', 'pelare av blå magma', 'ur vit korona'],
      ['Två bruna dvärgar', 'rotationens kollision', 'skapar ny nova'],
      ['Kakofonier', 'ett spektra av spritt glitter', 'föds ur ett gult kaos'],
      ['Fission av massa', 'slutar skapa nya ting', 'alla färger dör'],
      ['En fadd horisont', 'runt punkt av rummets avgrund', 'randen av svart hål'],
      ['Plasmakeramik', 'teknologi absurdum', 'magnetfält i drift'],
      ['Pulsarens strömmar', 'tyglad fissionsraket', 'energi ur stöt'],
      ['Heta galaxer', 'styrda av mörk energi', 'parallellt fokus'],
      ['Kontroll ur vakuum', 'energi att fånga', 'till en svart punkt'],
      ['Knivskarpa skuggor', 'på rymdskeppets kalla plåt', 'uråldrig relik'],
      ['Den nya eran', 'där tiden är given', 'rum oscillerar'],
      ['Magnetisk plasma', 'fångas kroppen i en stråle', 'fångad projektil'],
    ),
  },
]

export const allHaiku: Haiku[] = [...universum, ...stjarnor].flatMap((c) => c.haiku)
