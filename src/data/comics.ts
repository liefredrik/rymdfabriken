export type Episode = {
  id: string
  number: number
  title: string
  src: string
  width: number
  height: number
  panels: number
  place: string
  synopsis: string
  quote: string
  speaker: 'Bengt' | 'Lane'
}

/** Bengt & Lane: fotoserien om två killar som ska bli rymdingenjörer. */
export const episodes: Episode[] = [
  {
    id: 'dom-forsta-planerna',
    number: 1,
    title: 'Dom första planerna',
    src: '/images/bengt/strip-01.jpg',
    width: 4819,
    height: 300,
    panels: 10,
    place: 'Komvux, Mjölby',
    synopsis:
      'Lane undrar om man kan söka till ett universitet. Bengt tycker det är hur lätt som helst: man fyller i en lapp och sen får man pengar varje månad för att göra i princip ingenting. Frågan är bara vad man ska läsa för att bli smart. Rymdteknik, förstås. Det tar minst fyrtio år.',
    quote: 'Ja det vore något det. Rymden!',
    speaker: 'Lane',
  },
  {
    id: 'varldens-ande',
    number: 2,
    title: 'Världens ände',
    src: '/images/bengt/strip-02.jpg',
    width: 4819,
    height: 300,
    panels: 10,
    place: 'En stad långt norrut, minus trettio',
    synopsis:
      'Bengt och Lane har kommit fram. Det är kallt, läpparna sväller och ingen minns riktigt varför de sökte hit. De hittar ett hus som säkert står tomt, går in och sätter sig vid köksbordet. För ett par dagar sedan gick de på Komvux i Mjölby. Nu läser de till rymdingenjör.',
    quote: 'Haha, vilket geni du är Bengt. Det här gjorde jag bra!',
    speaker: 'Lane',
  },
]

export const cast = [
  {
    name: 'Bengt',
    hat: 'Blå stickad mössa med räv',
    bio: 'Idéspruta och optimist. Tycker att det mesta är hur lätt som helst och att internet är tidens melodi. Tål inte kyla.',
  },
  {
    name: 'Lane',
    hat: 'Svart balaklava',
    bio: 'Den eftertänksamme. Vill bli smart, helst på riktigt. Ställer frågorna som Bengt svarar på utan att tänka efter.',
  },
]
