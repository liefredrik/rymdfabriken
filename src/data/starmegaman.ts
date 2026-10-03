export const starMegaMan = {
  title: 'StarMegaMan',
  eyebrow: 'Ett litet spel om en väldigt stor natt',
  lead: 'Skogen sover. Stjärnorna faller. Någon måste ta nattskiftet.',
  start: 'Ta nattskiftet',
  intro: 'Fånga stjärnljus. Väx i kraft. Möt glödens väktare.',
  dead: 'Natten vann. Den här gången.',
  won: 'Du gav skogen stjärnorna tillbaka.',
  ending: 'Mamma Röd släcker glöden. Lilla Lo blåser en sista bubbla. Äntligen läggdags.',
  boss: { name: 'Mamma Röd', helper: 'Lo, 2 år · bubbelmästare', line: '”En stjärna till. Sedan sover vi.”' },
  chapters: [
    { at: 0, name: 'Den sovande skogen', caption: 'Väck inte räven.' },
    { at: 1500, name: 'Kometernas glänta', caption: 'Allt som glittrar är inte snällt.' },
    { at: 3000, name: 'Glödens trädgård', caption: 'Det lyser fortfarande hos mamma.' },
  ],
  powers: [
    { at: 0, name: 'Gnista', description: 'Dubbelhopp & stjärnskott', color: '#8cd9ff' },
    { at: 10, name: 'Stjärnbärare', description: 'Starkare skott & stjärnmagnet', color: '#a2edb8' },
    { at: 25, name: 'Kometkraft', description: 'Dubbelskott & större magnet', color: '#c4afff' },
    { at: 45, name: 'Supernova', description: 'Tre skott. Gott om självförtroende.', color: '#ffcf85' },
  ],
  instructions: [
    { title: 'Följ stjärnorna', text: 'Gå åt höger med pilarna eller A / D. På mobilen håller du riktningsknapparna.' },
    { title: 'Hoppa. Hoppa igen.', text: 'Mellanslag, W eller ↑. Du kan hoppa två gånger. Håll kvar för ett högre hopp.' },
    { title: 'Lys upp natten', text: 'Håll X eller skottknappen. Samlade stjärnor ger nya krafter och ett extra hjärta vid varje uppgradering.' },
    { title: 'Kom hem hel', text: 'Fem hjärtan. Undvik eldklot och arga stjärnor. P eller Escape pausar. Förlorar du alla hjärtan börjar natten om.' },
  ],
} as const
