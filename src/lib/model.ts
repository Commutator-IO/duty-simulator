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

/**
 * The Amdahl limit: what the gain would converge to as speed → ∞ *if review
 * were free*. Set by `share` alone. Real, but not the one that binds.
 */
export function ceiling(share: number): number {
  return 1 / (1 - share);
}

/**
 * The ceiling that actually binds.
 *
 * At infinite speed the accelerated work costs nothing — but the review it
 * generates still does, and review is a fraction of the gain, so it does not
 * vanish with it. The effective duration tends to (1−p) + r·p rather than to
 * (1−p).
 *
 * Read as a control loop this is the familiar result that a large forward gain
 * leaves the closed-loop gain determined by the feedback path: as s → ∞ with
 * p → 1, this tends to 1/r. Two independent limits, and the smaller wins.
 */
export function effectiveCeiling(share: number, review: number): number {
  return 1 / (1 - share + review * share);
}

export type Result = {
  gain: number;
  /** The Amdahl limit, ignoring review. Shown as the second trace's asymptote. */
  ceiling: number;
  /** What an infinitely fast tool actually buys, review included. */
  effectiveCeiling: number;
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
    effectiveCeiling: effectiveCeiling(share, review),
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

/**
 * The day read as a battery.
 *
 * The machine in front of you has a better model of its own energy than you
 * have of yours: it measures, displays continuously, warns at thresholds, and
 * enforces a stop. This is the same four things for the person using it.
 *
 * `capacityHours` is how long the sustainable budget affords at this drain, so
 * raising drain shortens the day the same way a heavy process shortens a laptop
 * afternoon. `charge` goes negative rather than clamping, because running past
 * empty is exactly what people do and hiding it would be the flattering
 * version.
 */
export type Battery = {
  /** Hours of dense work the budget affords at this drain. */
  capacityHours: number;
  /** 1 at full, 0 at the threshold, negative once past it. */
  charge: number;
  /** Hours left before the threshold; negative once over. */
  hoursLeft: number;
};

export function battery(inputs: Inputs): Battery {
  const capacityHours = SUSTAINABLE_LOAD / inputs.density;
  return {
    capacityHours,
    charge: 1 - (inputs.hours * inputs.density) / SUSTAINABLE_LOAD,
    hoursLeft: capacityHours - inputs.hours,
  };
}

/** Working days a ration is spread over. Five, and the weekend is not a credit. */
export const WEEK_DAYS = 5;

/**
 * The same budget, read over a week instead of a day.
 *
 * A daily cap and a weekly ration are not the same instrument, and the
 * difference is the whole point. The daily one limits how hard you may go at
 * any moment; the weekly one limits the total, and lets a light day pay for a
 * heavy one. Neither replaces the other — a week can be well inside its ration
 * and still have been survived one ruinous day at a time.
 *
 * `burst` is the number the daily gauge cannot show: the longest single day the
 * week affords once the other four are held at today's draw. Above the daily
 * capacity you have banked something; below it you are already borrowing. It
 * goes negative when four days at this pace have spent the week on their own,
 * which is worth printing rather than hiding.
 */
export type Quota = {
  /** Dense hours the week affords at this drain. */
  weekly: number;
  /** Dense hours the week spends if every day looks like this one. */
  drawn: number;
  /** The longest day the week still affords, the others held at today's draw. */
  burst: number;
};

export function quota(inputs: Inputs): Quota {
  const weekly = battery(inputs).capacityHours * WEEK_DAYS;
  return {
    weekly,
    drawn: inputs.hours * WEEK_DAYS,
    burst: weekly - inputs.hours * (WEEK_DAYS - 1),
  };
}

/**
 * Which step is limiting, read the way a chemical engineer reads a reactor.
 *
 * Damköhler compares the time spent in the accelerated step against the time
 * spent in the one the tool cannot touch. Below 1 the untouched step dominates
 * and making the tool faster changes almost nothing — you are transport-limited,
 * and the only move is to widen what it reaches. Above 1 the tool is still the
 * bottleneck and speed is worth buying.
 *
 * It is a ratio of two numbers the model already has, and it answers the only
 * question a reader actually leaves with: which fader do I touch?
 */
export function damkohler(share: number, speed: number): number {
  if (share >= 1) return Number.POSITIVE_INFINITY;
  return share / speed / (1 - share);
}

export type Limiting = 'reach' | 'speed';

export function limitingStep(share: number, speed: number): Limiting {
  return damkohler(share, speed) < 1 ? 'reach' : 'speed';
}

/**
 * Review capacity is finite, and the model above pretends it is not.
 *
 * `r` is treated as a constant fraction, which says that checking twice as much
 * output costs exactly twice as much — true only while you are nowhere near
 * your own limit. Enzyme kinetics describes the other case: a fixed quantity of
 * catalyst, throughput that saturates, and a queue that grows once substrate
 * outruns it. Here you are the enzyme.
 *
 * `K` is the raw throughput at which review capacity is half-saturated. It is
 * NOT calibrated — nothing measures it — so everything derived from it is an
 * illustration of a shape, not a prediction. The shape itself is the point.
 */
export const SATURATION_K = 4;

export function saturatedGain(
  share: number,
  speed: number,
  review: number,
  k: number = SATURATION_K,
): number {
  const t = relativeTime(share, speed);
  const raw = 1 / t;
  return 1 / (t + review * (1 - t) * (1 + raw / k));
}

/**
 * The speed past which more speed makes the day longer, if there is one.
 *
 * There is not always: while raw throughput stays small the correction only
 * lowers the ceiling. A turnover appears once reach is wide enough to feed the
 * bottleneck faster than it drains — which is Illich's threshold arriving from
 * kinetics rather than from philosophy, and a real caveat on this page's own
 * advice to widen reach.
 */
export function turnoverSpeed(
  share: number,
  review: number,
  k: number = SATURATION_K,
  max = 200,
): number | null {
  let best = { speed: 1, gain: 0 };
  for (let s = 1; s <= max; s += 0.05) {
    const g = saturatedGain(share, s, review, k);
    if (g > best.gain) best = { speed: s, gain: g };
  }
  // A peak sitting on the far edge of the sweep is an asymptote, not a turnover.
  return best.speed < max - 1 ? best.speed : null;
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
