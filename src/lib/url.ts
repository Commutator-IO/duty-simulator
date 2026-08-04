import { isLanguage, type Language } from './i18n';
import { BOUNDS, DEFAULTS, clamp, type Inputs } from './model';

/**
 * Serialisation of a setting into the URL.
 *
 * The site is fully static and stores nothing in the browser, so the address bar
 * is the only place shareable state can live. Three rules, the same ones the
 * other simulators follow:
 *
 *  - only what differs from the defaults is written, so links stay short and a
 *    later change of default is not frozen into links already shared;
 *  - fractions travel as percentage points (`p=60`), because a shared link is
 *    also read by a human;
 *  - everything read back is clamped and snapped to the slider steps, the URL
 *    being untrusted input — a hand-edited `d=1.37` must not produce a state
 *    the slider cannot represent.
 */

export type Tab = 'walkthrough' | 'simulator' | 'reactor' | 'macos' | 'foundations';

export const TABS: readonly Tab[] = [
  'walkthrough',
  'simulator',
  'reactor',
  'macos',
  'foundations',
];

/**
 * The walkthrough, not the console. Somebody arriving cold cannot read a desk
 * of five unlabelled faders; they can read a page that hands them one at a time.
 */
export const DEFAULT_TAB: Tab = 'walkthrough';

/** Short keys, matching the shape the project set out to support: ?p=60&s=3&r=25 */
const KEYS = {
  hours: 'h',
  share: 'p',
  speed: 's',
  review: 'r',
  density: 'd',
  visible: 'v',
  tab: 'tab',
  language: 'lang',
} as const;

/** Drops the float noise that `0.1 + 0.2` style arithmetic leaves behind. */
const round = (value: number, decimals = 4) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

/** Clamps to the slider bounds, then lands on an exact step. */
export function snap(value: number, bound: { min: number; max: number; step: number }): number {
  const inside = clamp(value, bound.min, bound.max);
  const steps = Math.round((inside - bound.min) / bound.step);
  return round(clamp(bound.min + steps * bound.step, bound.min, bound.max));
}

function readNumber(raw: string | null, fallback: number, bound: { min: number; max: number; step: number }): number {
  if (raw === null || raw.trim() === '') return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) return fallback;
  return snap(value, bound);
}

/** A fraction written as percentage points. */
const points = (v: number) => round(v * 100, 3);

/**
 * Builds the query string for a state, including only what differs from the
 * defaults. Returns an empty string when everything is default and the tab is
 * the one the site opens on.
 */
export function encodeState(
  inputs: Inputs,
  tab: Tab = DEFAULT_TAB,
  /**
   * Written only once the visitor has picked a language themselves, like every
   * other parameter left at its default: a link shared by someone who never
   * touched the switch stays short and opens in the reader's own language.
   */
  language: Language | null = null,
  defaults: Inputs = DEFAULTS,
): string {
  const params = new URLSearchParams();
  const add = (key: string, value: number, fallback: number) => {
    if (value === fallback) return;
    params.set(key, String(value));
  };

  add(KEYS.hours, round(inputs.hours), round(defaults.hours));
  add(KEYS.share, points(inputs.share), points(defaults.share));
  add(KEYS.speed, round(inputs.speed), round(defaults.speed));
  add(KEYS.review, points(inputs.review), points(defaults.review));
  add(KEYS.density, round(inputs.density), round(defaults.density));
  add(KEYS.visible, points(inputs.visible), points(defaults.visible));
  if (tab !== DEFAULT_TAB) params.set(KEYS.tab, tab);
  if (language !== null) params.set(KEYS.language, language);

  const query = params.toString();
  return query === '' ? '' : `?${query}`;
}

/** Reads a state back from a query string, clamping and snapping every value. */
export function decodeState(search: string, defaults: Inputs = DEFAULTS): Inputs {
  const p = new URLSearchParams(search);

  // Fractions are read in points then divided, so the bounds are expressed in
  // the unit the URL actually carries.
  const fraction = (key: string, fallback: number, bound: { min: number; max: number; step: number }) => {
    const scaled = { min: bound.min * 100, max: bound.max * 100, step: bound.step * 100 };
    return round(readNumber(p.get(key), fallback * 100, scaled) / 100);
  };

  return {
    hours: readNumber(p.get(KEYS.hours), defaults.hours, BOUNDS.hours),
    share: fraction(KEYS.share, defaults.share, BOUNDS.share),
    speed: readNumber(p.get(KEYS.speed), defaults.speed, BOUNDS.speed),
    review: fraction(KEYS.review, defaults.review, BOUNDS.review),
    density: readNumber(p.get(KEYS.density), defaults.density, BOUNDS.density),
    visible: fraction(KEYS.visible, defaults.visible, BOUNDS.visible),
  };
}

/** The language the URL asks for, or null when it says nothing. */
export function decodeLanguage(search: string): Language | null {
  const asked = new URLSearchParams(search).get(KEYS.language);
  return isLanguage(asked) ? asked : null;
}

/** The tab the URL asks for; the walkthrough unless it names a known other. */
export function decodeTab(search: string): Tab {
  const asked = new URLSearchParams(search).get(KEYS.tab);
  return TABS.find((t) => t === asked) ?? DEFAULT_TAB;
}

/** Absolute URL to share, keeping the current path. */
export function shareLink(
  inputs: Inputs,
  tab: Tab = DEFAULT_TAB,
  language: Language | null = null,
): string {
  if (typeof window === 'undefined') return '';
  const { origin, pathname } = window.location;
  return `${origin}${pathname}${encodeState(inputs, tab, language)}`;
}
