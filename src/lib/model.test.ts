import { describe, expect, it } from 'vitest';
import {
  BOUNDS,
  DEFAULTS,
  breakEvenDensity,
  ceiling,
  clamp,
  effectiveTime,
  gain,
  loadVerdict,
  ratchetVerdict,
  relativeTime,
  simulate,
} from './model';

describe('Amdahl', () => {
  it('reproduces the worked example the essay quotes', () => {
    // p = 60%, s = 3, no review: the figure the essay opens on.
    expect(gain(0.6, 3, 0)).toBeCloseTo(1.667, 3);
    expect(ceiling(0.6)).toBe(2.5);
  });

  it('puts the ceiling out of reach of any speed', () => {
    for (const speed of [2, 10, 1000, 1e9]) {
      expect(gain(0.6, speed, 0)).toBeLessThan(ceiling(0.6));
    }
    expect(gain(0.6, 1e12, 0)).toBeCloseTo(2.5, 3);
  });

  it('gives the ceiling to share, not to speed', () => {
    // Tripling the speed buys less than widening the share by a fifth: the
    // single claim the whole page is built to make.
    const fromSpeed = gain(0.6, 9, 0) - gain(0.6, 3, 0);
    const fromShare = gain(0.8, 3, 0) - gain(0.6, 3, 0);
    expect(fromShare).toBeGreaterThan(fromSpeed);
  });

  it('never speeds anything up at speed 1', () => {
    for (const share of [0.1, 0.5, 0.95]) {
      expect(gain(share, 1, 0)).toBeCloseTo(1, 10);
      expect(relativeTime(share, 1)).toBeCloseTo(1, 10);
    }
  });

  it('rises with speed and with share', () => {
    expect(gain(0.6, 4, 0)).toBeGreaterThan(gain(0.6, 3, 0));
    expect(gain(0.7, 3, 0)).toBeGreaterThan(gain(0.6, 3, 0));
  });
});

describe('the review term', () => {
  it('wipes out the whole gain at r = 1', () => {
    expect(effectiveTime(0.6, 3, 1)).toBeCloseTo(1, 10);
    expect(gain(0.6, 3, 1)).toBeCloseTo(1, 10);
  });

  it('changes nothing at r = 0', () => {
    expect(effectiveTime(0.6, 3, 0)).toBeCloseTo(relativeTime(0.6, 3), 10);
  });

  it('takes the quoted 1.67 down to 1.43 at a quarter', () => {
    expect(gain(0.6, 3, 0.25)).toBeCloseTo(1.429, 3);
  });

  it('is a tax on the gain, never a penalty on the work', () => {
    // However heavy the review, the day can never end up longer than it was
    // without the tool.
    for (const review of [0, 0.25, 0.6, 1]) {
      expect(gain(0.6, 3, review)).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('simulate', () => {
  const result = simulate(DEFAULTS);

  it('matches the figures printed as static defaults', () => {
    expect(result.gain).toBeCloseTo(1.429, 3);
    expect(result.ceiling).toBe(2.5);
    expect(result.hoursWithout).toBeCloseTo(5.714, 3);
    expect(result.loadWith).toBeCloseTo(5.2, 3);
    expect(result.loadGap).toBeCloseTo(-0.514, 3);
  });

  it('breaks even exactly when density reaches the gain', () => {
    const d = breakEvenDensity(DEFAULTS.share, DEFAULTS.speed, DEFAULTS.review);
    expect(d).toBeCloseTo(result.gain, 10);
    expect(simulate({ ...DEFAULTS, density: d }).loadGap).toBeCloseTo(0, 10);
    expect(simulate({ ...DEFAULTS, density: d + 0.05 }).loadGap).toBeGreaterThan(0);
    expect(simulate({ ...DEFAULTS, density: d - 0.05 }).loadGap).toBeLessThan(0);
  });

  it('keeps the whole surplus when nothing is made visible', () => {
    const hidden = simulate({ ...DEFAULTS, visible: 0 });
    expect(hidden.visibleGain).toBeCloseTo(1, 10);
    expect(hidden.marginKept).toBeCloseTo(DEFAULTS.hours * (hidden.gain - 1), 10);
  });

  it('keeps none of it when everything is shipped', () => {
    const shown = simulate({ ...DEFAULTS, visible: 1 });
    expect(shown.visibleGain).toBeCloseTo(shown.gain, 10);
    expect(shown.marginKept).toBeCloseTo(0, 10);
    expect(shown.hoursAfterRatchet).toBeCloseTo(DEFAULTS.hours, 10);
  });

  it('never shows a baseline the tool cannot support', () => {
    for (const visible of [0, 0.25, 0.5, 0.75, 1]) {
      const r = simulate({ ...DEFAULTS, visible });
      expect(r.visibleGain).toBeLessThanOrEqual(r.gain + 1e-12);
      expect(r.marginKept).toBeGreaterThanOrEqual(-1e-12);
    }
  });
});

describe('verdicts', () => {
  it('calls an impossible no-AI day unsustainable before comparing loads', () => {
    const r = simulate({ ...DEFAULTS, hours: 9, share: 0.9, speed: 8, review: 0 });
    expect(r.hoursWithout).toBeGreaterThan(10.5);
    expect(loadVerdict(r)).toBe('unsustainable');
  });

  it('agrees with the sign of the load gap', () => {
    expect(loadVerdict(simulate({ ...DEFAULTS, density: 1.7 }))).toBe('heavier');
    expect(loadVerdict(simulate({ ...DEFAULTS, density: 1 }))).toBe('lighter');
  });

  it('reads the visibility slider at its three registers', () => {
    expect(ratchetVerdict(0)).toBe('withheld');
    expect(ratchetVerdict(0.5)).toBe('partial');
    expect(ratchetVerdict(1)).toBe('surrendered');
  });
});

describe('bounds', () => {
  it('stops share short of the divergence at 1', () => {
    expect(BOUNDS.share.max).toBeLessThan(1);
    expect(Number.isFinite(ceiling(BOUNDS.share.max))).toBe(true);
  });

  it('holds every default inside its own bounds', () => {
    for (const [key, bound] of Object.entries(BOUNDS)) {
      const value = DEFAULTS[key as keyof typeof DEFAULTS];
      expect(value).toBeGreaterThanOrEqual(bound.min);
      expect(value).toBeLessThanOrEqual(bound.max);
    }
  });

  it('clamps, including the non-finite case', () => {
    expect(clamp(5, 1, 3)).toBe(3);
    expect(clamp(0, 1, 3)).toBe(1);
    expect(clamp(Number.NaN, 1, 3)).toBe(1);
  });
});
