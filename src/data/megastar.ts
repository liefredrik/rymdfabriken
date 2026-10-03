export const megaStar = {
  title: 'MegaStar',
  subtitle: 'När skogen sover faller stjärnorna.',
  intro: 'En liten robot. En mycket stor natt. Samla skogens stjärnljus innan någon annan gör det.',
  start: 'Ut i natten',
  hint: 'Gå åt höger. Samla ljus. Lita inte på allt som glittrar.',
  defeat: 'Lite för mycket natt.',
  defeatLead: 'Skogen behåller sina hemligheter. Du får ett nytt försök.',
  victory: 'En stjärna till morgonen.',
  victoryLead: 'Glöden är tillbaka. Mira och lilla Juni släpper förbi dig. Skogen kan sova vidare.',
  boss: { name: 'Mira, glödens väktare', helper: 'Juni · 2 år · bubbelansvarig', intro: '”Det är faktiskt läggdags.”', shield: 'Junis bubbla skyddar Mira. Undvik glöden och vänta på en öppning.' },
  zones: [
    { name: 'Den sovande skogen', short: 'Skogen', start: 0, caption: 'Räven sover. Stjärnorna gör det inte.', color: '#87e8bc' },
    { name: 'Kometgläntan', short: 'Gläntan', start: 1450, caption: 'En del önskningar har tänder.', color: '#bac0ff' },
    { name: 'Glödens trädgård', short: 'Trädgården', start: 2950, caption: 'Någon har lämnat ljuset tänt.', color: '#ffbb89' },
  ],
  powers: [
    { stars: 0, name: 'Gnista', detail: 'Stjärnskott & dubbelhopp', color: '#98dff6' },
    { stars: 8, name: 'Stjärnbärare', detail: 'Starkare skott & stjärnmagnet', color: '#9fe6bf' },
    { stars: 20, name: 'Komet', detail: 'Dubbelskott & längre räckvidd', color: '#dac1ff' },
    { stars: 38, name: 'Supernova', detail: 'Tre skott. Betydligt mer glöd.', color: '#ffc97c' },
  ],
  controls: [
    { title: 'Rör dig', text: 'Pilarna eller A / D. På mobilen: håll riktningsknapparna.' },
    { title: 'Dubbelhoppa', text: 'Mellanslag, W eller ↑. Hoppa igen i luften för att nå grenarna.' },
    { title: 'Skicka stjärnljus', text: 'Håll X eller skottknappen. Stjärnor gör dig starkare och fyller på ett hjärta vid varje ny kraftnivå.' },
    { title: 'Överlev natten', text: 'Fem hjärtan. Eldklot och monster gör ont. Slut på hjärtan betyder en ny resa från början. P pausar.' },
  ],
} as const
