import { describe, expect, it } from 'vitest';
import {
  BOUNDS,
  WEEK_DAYS,
  battery,
  quota,
  damkohler,
  effectiveCeiling,
  limitingStep,
  DEFAULTS,
  breakEvenDensity,
  ceiling,
  clamp,
  effectiveTime,
  gain,
  loadVerdict,
  ratchetVerdict,
  relativeTime,
  SUSTAINABLE_LOAD,
  saturatedGain,
  turnoverSpeed,
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

describe('the ceiling that actually binds', () => {
  // The bug this guards: the page displayed 1/(1−p) as "where an infinitely
  // fast tool would stop". With review, an infinitely fast tool stops well
  // short of it — by 38% on the defaults, and by 3.6× at p=0.9, r=0.4.
  it('is exactly where the gain lands at unbounded speed', () => {
    for (const [p, r] of [
      [0.6, 0.25],
      [0.8, 0.25],
      [0.9, 0.4],
      [0.1, 0.6],
    ]) {
      expect(gain(p, 1e12, r)).toBeCloseTo(effectiveCeiling(p, r), 6);
    }
  });

  it('sits at or below the Amdahl limit, and equals it only when review is free', () => {
    for (const p of [0.1, 0.5, 0.95]) {
      expect(effectiveCeiling(p, 0)).toBeCloseTo(ceiling(p), 10);
      for (const r of [0.05, 0.25, 0.6]) {
        expect(effectiveCeiling(p, r)).toBeLessThan(ceiling(p));
      }
    }
  });

  it('tends to 1/r as the share approaches everything — the feedback limit', () => {
    // With a large forward gain the closed-loop gain is set by the feedback
    // path alone, which here is the review fraction.
    expect(effectiveCeiling(0.999999, 0.25)).toBeCloseTo(1 / 0.25, 3);
    expect(effectiveCeiling(0.999999, 0.5)).toBeCloseTo(1 / 0.5, 3);
  });

  it('is never beaten by the gain at any reachable speed', () => {
    for (const s of [1, 1.2, 3, 8, 1000]) {
      const r = simulate({ ...DEFAULTS, speed: s });
      expect(r.gain).toBeLessThanOrEqual(r.effectiveCeiling + 1e-12);
    }
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

describe('the battery', () => {
  it('affords fewer hours as the drain rises', () => {
    const easy = battery({ ...DEFAULTS, density: 1 });
    const hard = battery({ ...DEFAULTS, density: 1.7 });
    expect(easy.capacityHours).toBeGreaterThan(hard.capacityHours);
    expect(easy.capacityHours).toBe(SUSTAINABLE_LOAD);
  });

  it('reads empty exactly at the sustainable threshold', () => {
    const at = battery({ ...DEFAULTS, hours: SUSTAINABLE_LOAD, density: 1 });
    expect(at.charge).toBeCloseTo(0, 10);
    expect(at.hoursLeft).toBeCloseTo(0, 10);
  });

  it('goes past empty rather than clamping', () => {
    // Running on reserve is what people do; a gauge that stopped at zero would
    // be the flattering version of the same number.
    const spent = battery(DEFAULTS);
    expect(spent.charge).toBeLessThan(0);
    expect(spent.hoursLeft).toBeLessThan(0);
  });

  it('agrees with the load the instrument shows', () => {
    for (const density of [1, 1.3, 1.7]) {
      const inputs = { ...DEFAULTS, density };
      const b = battery(inputs);
      expect(b.charge).toBeCloseTo(1 - simulate(inputs).loadWith / SUSTAINABLE_LOAD, 10);
    }
  });
});

describe('the weekly ration', () => {
  it('is the daily capacity, five times over', () => {
    const inputs = { ...DEFAULTS, density: 1.3 };
    expect(quota(inputs).weekly).toBeCloseTo(battery(inputs).capacityHours * WEEK_DAYS, 10);
  });

  it('leaves exactly an ordinary day when the pace is exactly sustainable', () => {
    // The point where the two limits agree: nothing banked, nothing borrowed.
    const daily = SUSTAINABLE_LOAD / 1.3;
    const q = quota({ ...DEFAULTS, hours: daily, density: 1.3 });
    expect(q.burst).toBeCloseTo(daily, 10);
    expect(q.drawn).toBeCloseTo(q.weekly, 10);
  });

  it('banks a longer day when the pace is under capacity, and borrows when it is over', () => {
    const under = quota({ ...DEFAULTS, hours: 2, density: 1.3 });
    const over = quota({ ...DEFAULTS, hours: 4, density: 1.3 });
    const daily = SUSTAINABLE_LOAD / 1.3;
    expect(under.burst).toBeGreaterThan(daily);
    expect(over.burst).toBeLessThan(daily);
  });

  it('goes to nothing once four days at this pace spend the week', () => {
    // The gauge prints this rather than a negative hour count.
    expect(quota({ ...DEFAULTS, hours: 9, density: 1.3 }).burst).toBeLessThanOrEqual(0);
  });
});

describe('Damköhler', () => {
  it('compares the two steps, and is below 1 when the untouched one dominates', () => {
    // Defaults: 0.2 of the day accelerated against 0.4 that cannot be.
    expect(damkohler(0.6, 3)).toBeCloseTo(0.5, 6);
    expect(limitingStep(0.6, 3)).toBe('reach');
  });

  it('names speed as limiting only while the tool still costs more than the rest', () => {
    expect(limitingStep(0.85, 3)).toBe('speed');
    expect(damkohler(0.85, 3)).toBeGreaterThan(1);
  });

  it('falls as the tool gets faster, so speed buys its own irrelevance', () => {
    let previous = Infinity;
    for (const s of [1.2, 2, 3, 5, 8]) {
      const now = damkohler(0.6, s);
      expect(now).toBeLessThan(previous);
      previous = now;
    }
  });
});

describe('saturating review', () => {
  it('never flatters the constant-fraction model', () => {
    // The correction can only add review time, so it can only lower the gain.
    for (const p of [0.3, 0.6, 0.9]) {
      for (const s of [1.2, 3, 8, 50]) {
        expect(saturatedGain(p, s, 0.25)).toBeLessThanOrEqual(gain(p, s, 0.25) + 1e-12);
      }
    }
  });

  it('changes nothing when there is no review to saturate', () => {
    for (const s of [1.2, 3, 8]) {
      expect(saturatedGain(0.6, s, 0)).toBeCloseTo(gain(0.6, s, 0), 10);
    }
  });

  it('produces no turnover at a narrow reach, and one at a wide reach', () => {
    // The uncomfortable result: widening reach brings the turnover towards you,
    // which is a caveat on this page's own advice.
    expect(turnoverSpeed(0.6, 0.25)).toBeNull();
    const wide = turnoverSpeed(0.9, 0.25);
    expect(wide).not.toBeNull();
    expect(wide!).toBeGreaterThan(1);
  });

  it('moves the turnover earlier as reach widens', () => {
    const at80 = turnoverSpeed(0.8, 0.25)!;
    const at95 = turnoverSpeed(0.95, 0.25)!;
    expect(at95).toBeLessThan(at80);
  });

  it('can push the gain below 1 — slower than working alone', () => {
    expect(saturatedGain(0.95, 200, 0.25)).toBeLessThan(1);
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
