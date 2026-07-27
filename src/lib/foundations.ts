import type { FormulaKey } from './formulas';

/**
 * The research entries — the facts about them, not the words.
 *
 * Year, people, portrait and formula are the same in every language, so they
 * live here. The title, the explanation and the line connecting the finding to
 * this page are copy, and live in `src/content/`, keyed by `id`.
 *
 * The caveats attached to three of these entries are load-bearing: the warning
 * on Yerkes-Dodson, the reservation about the word "law", and the conflict of
 * interest on the Economic Index are what stop the page claiming more than it
 * can support. They live in the copy, and they stay.
 */

/**
 * A portrait hotlinked from Wikimedia Commons.
 *
 * Hotlinked rather than vendored, which is a trade the repository should be
 * honest about: it means the page makes third-party requests, and an image can
 * vanish if the file is renamed upstream. Nothing is downloaded, nothing is
 * re-hosted.
 *
 * Only licences that permit reuse appear here — no "fair use" file is ever
 * acceptable. `by` and `licence` exist because CC BY and CC BY-SA both require
 * credit, which the page prints.
 */
export type Portrait = {
  src: string;
  /** Commons file page, for anyone checking the provenance. */
  page: string;
  by: string;
  licence: string;
  /** `object-position`, when a face sits off-centre in the source frame. */
  focus?: string;
};

export type CardId =
  | 'jevons'
  | 'yerkes'
  | 'roy'
  | 'parkinson'
  | 'little'
  | 'amdahl'
  | 'illich'
  | 'goodhart'
  | 'brooks'
  | 'burnout'
  | 'gustafson'
  | 'leroy'
  | 'acemoglu'
  | 'economicIndex';

export type Card = {
  id: CardId;
  /** Year of publication; the timeline is ordered by it. */
  year: number;
  /** End of the span, when the entry covers more than one publication. */
  until?: number;
  people: readonly string[];
  /** True for the two the instrument actually computes. */
  implemented?: boolean;
  /** Set where the entry is not a person, so the plate does not try initials. */
  institution?: boolean;
  /** Where to go and read it. */
  href?: string;
  portrait?: Portrait;
  tex?: FormulaKey;
};

const commons = 'https://commons.wikimedia.org/wiki/File:';
const thumb = 'https://upload.wikimedia.org/wikipedia/commons/thumb/';

const ENTRIES: readonly Card[] = [
  {
    id: 'amdahl',
    year: 1967,
    people: ['Gene Amdahl'],
    implemented: true,
    tex: 'amdahlShort',
    portrait: {
      src: `${thumb}7/79/Amdahl_march_13_2008.jpg/500px-Amdahl_march_13_2008.jpg`,
      page: `${commons}Amdahl_march_13_2008.jpg`,
      by: 'Perry Kivolowitz',
      licence: 'CC BY 3.0',
    },
  },
  {
    id: 'gustafson',
    year: 1988,
    people: ['John Gustafson'],
    implemented: true,
    tex: 'gustafson',
    portrait: {
      src: `${thumb}6/6c/John_L_Gustafson_CEO.jpg/500px-John_L_Gustafson_CEO.jpg`,
      page: `${commons}John_L_Gustafson_CEO.jpg`,
      by: 'Davisourus',
      licence: 'CC BY-SA 3.0',
    },
  },
  {
    id: 'parkinson',
    year: 1955,
    people: ['Cyril N. Parkinson'],
    portrait: {
      src: `${thumb}d/dd/Cyril_Northcote_Parkinson_1961.jpg/500px-Cyril_Northcote_Parkinson_1961.jpg`,
      page: `${commons}Cyril_Northcote_Parkinson_1961.jpg`,
      by: 'Wim van Rossem for Anefo',
      licence: 'CC BY-SA 3.0 NL',
    },
  },
  {
    id: 'jevons',
    year: 1865,
    people: ['William Stanley Jevons'],
    portrait: {
      src: `${thumb}7/78/William_Stanley_Jevons_portrait_extract.jpg/500px-William_Stanley_Jevons_portrait_extract.jpg`,
      page: `${commons}William_Stanley_Jevons_portrait_extract.jpg`,
      by: 'University of Manchester Libraries',
      licence: 'CC BY-SA 4.0',
    },
  },
  { id: 'roy', year: 1952, people: ['Donald Roy'] },
  {
    id: 'goodhart',
    year: 1975,
    people: ['Charles Goodhart'],
    portrait: {
      src: `${thumb}9/94/Charles_Goodhart_delives_the_2012_Long_Finance_conference_keynote_speech.JPG/500px-Charles_Goodhart_delives_the_2012_Long_Finance_conference_keynote_speech.JPG`,
      page: `${commons}Charles_Goodhart_delives_the_2012_Long_Finance_conference_keynote_speech.JPG`,
      by: 'Jamesfranklingresham',
      licence: 'CC BY-SA 3.0',
    },
  },
  {
    id: 'brooks',
    year: 1975,
    people: ['Fred Brooks'],
    portrait: {
      src: `${thumb}b/b9/Fred_Brooks_%28cropped_square%29.jpg/500px-Fred_Brooks_%28cropped_square%29.jpg`,
      page: `${commons}Fred_Brooks_(cropped_square).jpg`,
      by: 'SD&M',
      licence: 'CC BY-SA 3.0',
    },
  },
  { id: 'little', year: 1961, people: ['John Little'], tex: 'little' },
  { id: 'leroy', year: 2009, people: ['Sophie Leroy'] },
  {
    id: 'burnout',
    year: 1979,
    until: 1996,
    people: ['Robert Karasek', 'Johannes Siegrist', 'Christina Maslach'],
    portrait: {
      src: `${thumb}9/95/Christina_Maslach_portrait2.jpg/500px-Christina_Maslach_portrait2.jpg`,
      page: `${commons}Christina_Maslach_portrait2.jpg`,
      by: 'Philip Zimbardo',
      licence: 'CC BY-SA 4.0',
    },
  },
  {
    id: 'illich',
    year: 1973,
    people: ['Ivan Illich'],
    portrait: {
      src: `${thumb}4/43/1969_press_photo_of_Ivan_Illich.jpg/500px-1969_press_photo_of_Ivan_Illich.jpg`,
      page: `${commons}1969_press_photo_of_Ivan_Illich.jpg`,
      by: 'Associated Press',
      licence: 'Public domain',
    },
  },
  {
    id: 'yerkes',
    year: 1908,
    people: ['Robert Yerkes', 'John Dodson'],
    portrait: {
      src: `${thumb}2/28/%D0%99%D0%B5%D1%80%D0%BA%D1%81.png/500px-%D0%99%D0%B5%D1%80%D0%BA%D1%81.png`,
      page: `${commons}%D0%99%D0%B5%D1%80%D0%BA%D1%81.png`,
      by: 'via psychegames.com',
      licence: 'CC BY-SA 4.0',
    },
  },
  /**
   * The contemporary academic anchor for the last question on the walkthrough:
   * who ends up with the gain. Two economists, one of them a Nobel laureate,
   * arguing at book length that the answer is decided politically rather than
   * technically — which is the claim this page makes in one paragraph.
   */
  {
    id: 'acemoglu',
    year: 2023,
    people: ['Daron Acemoglu', 'Simon Johnson'],
    href: 'https://www.hachettebookgroup.com/titles/daron-acemoglu/power-and-progress/9781541702530/',
    portrait: {
      src: 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Acemoglu_2016_%283x4_cropped%29.png',
      page: 'https://commons.wikimedia.org/wiki/File:Acemoglu_2016_(3x4_cropped).png',
      by: 'MeJudice',
      licence: 'CC BY 3.0',
    },
  },
  /**
   * The one contemporary entry, and the only one that measures rather than
   * reasons. It is here because it is the sole public attempt to put a number on
   * the parameter this whole page turns on — how much of the work the tool
   * actually reaches. Its conflict of interest is stated on the card.
   */
  {
    id: 'economicIndex',
    year: 2025,
    until: 2026,
    people: ['Anthropic'],
    institution: true,
    href: 'https://www.anthropic.com/research/economic-index-primitives',
  },
];

/**
 * Chronological, because the timeline is. It runs from a book about British coal
 * in 1865 to a usage study published last year, which is an argument in itself:
 * none of this started with AI.
 */
export const CARDS: readonly Card[] = [...ENTRIES].sort((a, b) => a.year - b.year);

export function cardById(id: CardId): Card {
  const found = ENTRIES.find((c) => c.id === id);
  if (found === undefined) throw new Error(`No research entry with id "${id}"`);
  return found;
}

/** The span the timeline ruler covers. */
export const SPAN = {
  from: Math.min(...ENTRIES.map((c) => c.year)),
  to: Math.max(...ENTRIES.map((c) => c.until ?? c.year)),
};

/** Every distinct portrait on the page, for the credit line under the timeline. */
export const CREDITS = CARDS.flatMap((c) => (c.portrait ? [{ card: c, portrait: c.portrait }] : []));
