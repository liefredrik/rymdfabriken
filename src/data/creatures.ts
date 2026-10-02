export type Creature = {
  id: string
  src: string
  title: string
  specimen: string
  habitat: string
  note: string
}

/** Livet: varelserna från den gamla sidans galleri. */
export const creatures: Creature[] = [
  {
    id: 'cyclops-portrait',
    src: '/images/cyclops-portrait.png',
    title: 'Enögd betraktare',
    specimen: 'Exemplar 01',
    habitat: 'Ett rödhårigt barnrum, oklar planet',
    note: 'Ser allt med ett öga och förlåter ingenting. Trivs i motljus och i ögonvrån på den som vänder sig om.',
  },
  {
    id: 'pigman',
    src: '/images/pigman.jpg',
    title: 'Den nöjde',
    specimen: 'Exemplar 02',
    habitat: 'Vänthallen på en kaotisk stjärnhamn',
    note: 'Bråkar aldrig om vädret. Ler mot alla som passerar och minns exakt vem som inte log tillbaka.',
  },
  {
    id: 'hybrid',
    src: '/images/hybridanimalhuman.jpg',
    title: 'Mellanform',
    specimen: 'Exemplar 03',
    habitat: 'Gränslandet mellan art och ansikte',
    note: 'Varken djur eller människa, men båda samtidigt. Blinkar långsamt och undrar vad du egentligen är.',
  },
  {
    id: 'alien-4',
    src: '/images/orange_alien4.jpg',
    title: 'Orange besökare',
    specimen: 'Exemplar 04',
    habitat: 'Uppkopplad kropp, framme på Io',
    note: 'Landade utan att fråga om lov och stannade för att det var billigare i drift här.',
  },
  {
    id: 'cyclops-mouth',
    src: '/images/weird_little_cyclops.jpg',
    title: 'Liten elak myller',
    specimen: 'Exemplar 05',
    habitat: 'Ytan på en enorm gyllne slemboll',
    note: 'Den vanligaste formen av fän som äter. Tänderna är fler än de behöver vara och leendet är inte ett leende.',
  },
  {
    id: 'alien-3',
    src: '/images/orange_alien3.jpg',
    title: 'Vilande kolonisatör',
    specimen: 'Exemplar 06',
    habitat: 'Hård keramiksäng efter kryosömn',
    note: 'Vaknade ur kryo och drömde om våren. Sitter fortfarande och väntar på att någon ska förklara var den är.',
  },
]
