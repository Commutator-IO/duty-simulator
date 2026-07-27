/**
 * The model, and nothing else.
 *
 * Amdahl's law with a review term. Everything the interface displays is derived
 * here, so the arithmetic can be tested without rendering anything.
 *
 * The teaching point the whole page exists for: `share` commands the ceiling,
 * `speed` does not. Any change here that blurs that has broken the tool.
 */

export type Inputs = {
  /** Dense hours per day, with AI. */
  hours: number;
  /** p — the fraction of the work AI accelerates. */
  share: number;
  /** s — the speed-up on that fraction. */
  speed: number;
  /** r — the fraction of the gain taken back by review. */
  review: number;
  /** d — the cognitive density of an hour with AI, against 1 without. */
  density: number;
  /** v — the fraction of the surplus made visible to the employer. */
  visible: number;
};

export const DEFAULTS: Inputs = {
  hours: 4,
  share: 0.6,
  speed: 3,
  review: 0.25,
  density: 1.3,
  visible: 0.5,
};

/**
 * Slider bounds. `share` stops short of 1 because the ceiling 1/(1−p) diverges
 * there — a hundred per cent assistable work is not a case the model describes,
 * it is the case where the model stops meaning anything.
 */
export const BOUNDS = {
  hours: { min: 1, max: 9, step: 0.5 },
  share: { min: 0.1, max: 0.95, step: 0.05 },
  speed: { min: 1.2, max: 8, step: 0.2 },
  review: { min: 0, max: 0.6, step: 0.05 },
  density: { min: 1, max: 1.7, step: 0.05 },
  visible: { min: 0, max: 1, step: 0.05 },
} as const satisfies Record<keyof Inputs, { min: number; max: number; step: number }>;

/**
 * Load, in arbitrary units, above which a day of intense cognitive work stops
 * being repeatable day after day. An order of magnitude taken from the deep-work
 * literature, not a measurement — which is why the interface draws it as a mark
 * on a bar and never as a verdict on its own.
 */
export const SUSTAINABLE_LOAD = 4;

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/** Relative duration of the same output, before review. 1 means no gain. */
export function relativeTime(share: number, speed: number): number {
  return 1 - share + share / speed;
}

/**
 * Review is a tax on the gain, not on the work: it takes back a fraction of
 * what was saved, so it can never make the day longer than it was without the
 * tool. At review = 1 the effective time returns to exactly 1.
 */
export function effectiveTime(share: number, speed: number, review: number): number {
  const t = relativeTime(share, speed);
  return t + review * (1 - t);
}

export function gain(share: number, speed: number, review: number): number {
  return 1 / effectiveTime(share, speed, review);
}

/** What the gain converges to as speed → ∞. Set by `share` alone. */
export function ceiling(share: number): number {
  return 1 / (1 - share);
}

export type Result = {
  gain: number;
  ceiling: number;
  /** Hours the same output would have taken without the tool. */
  hoursWithout: number;
  /** hours × density. */
  loadWith: number;
  /** The no-AI day, whose density is 1 by definition. */
  loadWithout: number;
  /** Positive when the AI day costs more. */
  loadGap: number;
  /** The multiplier the employer gets to see. */
  visibleGain: number;
  /** Hours needed to hold the new baseline, once it has ratcheted up. */
  hoursAfterRatchet: number;
  /** Hours-equivalent of gain kept back, in no-AI terms. */
  marginKept: number;
};

export function simulate(inputs: Inputs): Result {
  const { hours, share, speed, review, density, visible } = inputs;

  const g = gain(share, speed, review);
  const hoursWithout = hours * g;
  const loadWith = hours * density;

  // Only the fraction of the gain you actually show becomes the new normal;
  // the rest never existed as far as anyone else is concerned.
  const visibleGain = 1 + visible * (g - 1);

  return {
    gain: g,
    ceiling: ceiling(share),
    hoursWithout,
    loadWith,
    loadWithout: hoursWithout,
    loadGap: loadWith - hoursWithout,
    visibleGain,
    hoursAfterRatchet: (hours * visibleGain) / g,
    marginKept: hours * g - hours * visibleGain,
  };
}

/**
 * The density at which the shorter day starts costing more than the long one.
 * It is exactly the gain: below it the tool buys rest, above it the tool buys
 * output and charges you for it.
 */
export function breakEvenDensity(share: number, speed: number, review: number): number {
  return gain(share, speed, review);
}

export type LoadVerdict = 'unsustainable' | 'heavier' | 'lighter';

/**
 * `unsustainable` wins over the load comparison: past roughly ten dense hours
 * the no-AI day is not a longer day, it is a day that does not exist, and
 * comparing loads against a fiction would be dishonest.
 */
export function loadVerdict(result: Result): LoadVerdict {
  if (result.hoursWithout > 10.5) return 'unsustainable';
  return result.loadGap > 0 ? 'heavier' : 'lighter';
}

export type RatchetVerdict = 'withheld' | 'partial' | 'surrendered';

export function ratchetVerdict(visible: number): RatchetVerdict {
  if (visible <= 0.15) return 'withheld';
  if (visible >= 0.85) return 'surrendered';
  return 'partial';
}
