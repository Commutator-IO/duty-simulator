import type { ReactNode } from 'react';
import type { Tab } from '../lib/url';
import type { CardId } from '../lib/foundations';
import type { Mechanism, RegimeKey, RowId } from '../lib/regimes';
import type { Formats } from '../lib/format';
import type { Inputs, Result } from '../lib/model';

/**
 * The shape every language must supply.
 *
 * Two kinds of entry live here, on purpose:
 *
 *  - **Short strings** — labels, captions, headings — as plain values. There are
 *    a lot of them and they are the part a translator wants in one list.
 *  - **Long-form passages** as `ReactNode`, and where they quote a live figure,
 *    as a function of the current numbers. Splitting an argument into thirty
 *    numbered fragments to keep it in a flat dictionary makes it unreadable in
 *    both languages at once; letting each language compose its own prose from
 *    shared layout components keeps it editable as prose.
 *
 * Because both language modules are typed as `Copy`, a missing key is a compile
 * error rather than a blank on the page.
 */

/** Which fader a piece of copy belongs to. */
export type ChannelKey = 'hours' | 'share' | 'speed' | 'review' | 'density' | 'visible';

export type ChannelCopy = {
  /** Short name printed on the console, under the fader. */
  name: string;
  /** The question the fader answers. */
  label: string;
  hint: string;
};

/** Everything a step of the walkthrough needs, minus the layout. */
export type Step = {
  no: string;
  title: string;
  body: ReactNode;
};

export type WalkthroughValues = {
  inputs: Inputs;
  result: Result;
  /** The gain before review is deducted. */
  rawGain: number;
  /** The density at which the shorter day starts costing more. */
  breakEven: number;
};

export type Copy = {
  /** How this language writes a figure. Part of the language, not a detail. */
  format: Formats;

  /** Page furniture. */
  chrome: {
    /** The browser tab, which has to follow the language too. */
    documentTitle: string;
    kicker: string;
    headline: string;
    dek: string;
    standfirst: string;
    tabs: Record<Tab, string>;
    reportError: string;
    sourceCode: string;
    privacy: string;
    languageLabel: string;
  };

  channels: Record<ChannelKey, ChannelCopy>;

  console: {
    howTo: string;
    yourTurn: string;
  };

  walkthrough: {
    kicker: string;
    headline: string;
    dek: string;
    intro: ReactNode;
    steps: (v: WalkthroughValues, set: (patch: Partial<Inputs>) => void) => Step[];
    curve: {
      kicker: string;
      title: string;
      lead: ReactNode;
      readings: (v: WalkthroughValues) => ReactNode[];
      contrast: ReactNode;
      tally: (v: WalkthroughValues) => ReactNode;
      afterward: ReactNode;
      openInstrument: string;
      caveat: ReactNode;
    };
  };

  dayBars: {
    kicker: string;
    title: string;
    lead: ReactNode;
    without: string;
    withAi: string;
    infinite: string;
    infiniteNote: (ceiling: string) => string;
    segments: { reachable: string; untouched: string; accelerated: string; checking: string };
    caption: ReactNode;
  };

  simulator: {
    stepOne: { designator: string; title: string; sub: string };
    stepTwo: { designator: string; title: string; sub: string };
    metrics: {
      gain: [string, string];
      ceiling: [string, string];
      without: [string, string];
      gap: [string, string];
      baseline: [string, string];
      after: [string, string];
      margin: [string, string];
    };
    curveKicker: string;
    curveCaption: ReactNode;
    metersKicker: string;
    meterWith: string;
    meterWithout: string;
    metersCaption: string;
    method: ReactNode;
    share: { idle: string; done: string };
  };

  scope: {
    title: string;
    ch1: string;
    ch2: string;
    /** The limit that binds — the bright trace's asymptote, review included. */
    limit: string;
    /** Same thing, short enough to sit on the screen. */
    limitShort: string;
    /** The Amdahl limit, which belongs to the theoretical trace. */
    limitTheoretical: string;
  };

  verdicts: {
    load: (result: Result, inputs: Inputs) => string;
    ratchet: (result: Result, inputs: Inputs) => string;
  };

  macos: {
    designator: string;
    title: string;
    sub: string;
    lead: ReactNode;
    whereYouAre: {
      kicker: string;
      /** Reads the reader their own drain against the tipping point. */
      sentence: (v: {
        density: string;
        breakEven: string;
        gap: string;
        below: boolean;
        loadWith: string;
        loadWithout: string;
      }) => ReactNode;
    };
    ambition: ReactNode;
    principle: ReactNode;
    measure: { title: string; sub: string; path: string; body: ReactNode };
    schedule: {
      title: string;
      sub: string;
      hideUnlimited: string;
      columns: { app: string; mechanism: string; threshold: string };
      budget: string;
      budgetNote: string;
      safari: ReactNode;
    };
    downtime: { title: string; sub: string; path: string; bullets: ReactNode[] };
    appLimits: { title: string; path: string; body: ReactNode };
    focus: {
      title: string;
      sub: string;
      path: string;
      deepWork: { title: string; bullets: ReactNode[] };
      calls: { title: string; body: ReactNode };
      reading: { title: string; body: ReactNode };
    };
    breaks: { title: string; sub: string; bullets: ReactNode[] };
    teeth: { title: string; path: string; body: ReactNode; warning: ReactNode };
    footnote: string;
    /** The table's own words. */
    rows: Record<RowId, { name: string; why: string }>;
    mechanisms: Record<Mechanism, string>;
    regimes: Record<RegimeKey, { label: string; note: string }>;
  };

  research: {
    /** Title, explanation and the line tying the finding to this page. */
    cards: Record<CardId, { title: string; body: string; so: string }>;
    designator: string;
    title: string;
    sub: (count: number, from: number, to: number) => string;
    inInstrument: string;
    here: string;
    to: string;
    caveat: ReactNode;
    portraits: ReactNode;
  };
};
