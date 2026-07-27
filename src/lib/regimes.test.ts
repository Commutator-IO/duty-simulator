import { describe, expect, it } from 'vitest';
import { makeFormats } from './format';
import { REGIMES, ROWS, distractionBudget, regime, threshold, type RowId } from './regimes';

const { duration } = makeFormats('en');
const standard = regime('standard');

describe('the schedule', () => {
  it('leaves work tools unlimited under every regime', () => {
    // The rule the project refuses to break: a counter on a work tool trains
    // you to dismiss alerts. If this test fails, someone added a quota to a row
    // that must not have one.
    const workTools: RowId[] = ['editors', 'browsers', 'music'];
    for (const id of workTools) {
      const row = ROWS.find((r) => r.id === id);
      expect(row, id).toBeDefined();
      for (const r of REGIMES) expect(threshold(row!, r), `${id} / ${r.key}`).toBe(0);
    }
  });

  it('gives the standard regime the baseline thresholds unchanged', () => {
    for (const row of ROWS) expect(threshold(row, standard)).toBe(row.base);
  });

  it('never rounds a real limit away to nothing', () => {
    for (const r of REGIMES) {
      for (const row of ROWS.filter((row) => row.base > 0)) {
        expect(threshold(row, r), `${row.id} / ${r.key}`).toBeGreaterThanOrEqual(5);
      }
    }
  });

  it('rounds to the five minutes Screen Time is set in', () => {
    for (const r of REGIMES) {
      for (const row of ROWS) expect(threshold(row, r) % 5).toBe(0);
    }
  });
});

describe('regimes', () => {
  it('tightens and loosens in the expected directions', () => {
    const relaxed = regime('relaxed');
    const strict = regime('strict');
    const row = ROWS.find((r) => r.id === 'social')!;
    expect(threshold(row, relaxed)).toBeGreaterThan(threshold(row, standard));
    expect(threshold(row, strict)).toBeLessThan(threshold(row, standard));
  });

  it('lets hyperfocus loosen quotas while tightening stops', () => {
    // The whole reason a regime carries two factors rather than one: under
    // hyperfocus the target is the eleven-hour session, not Reddit.
    const hyper = regime('hyperfocus');
    expect(hyper.distraction).toBeGreaterThan(standard.distraction);
    expect(hyper.stop).toBeLessThan(standard.stop);

    const distraction = ROWS.find((r) => r.id === 'social')!;
    const stop = ROWS.find((r) => r.id === 'seated')!;
    expect(threshold(distraction, hyper)).toBeGreaterThan(threshold(distraction, standard));
    expect(threshold(stop, hyper)).toBeLessThan(threshold(stop, standard));
  });

  it('falls back to standard on an unknown key', () => {
    expect(regime('nonsense' as never).key).toBe('standard');
  });
});

describe('the distraction budget', () => {
  it('sums the quotas and ignores the stop signals', () => {
    expect(distractionBudget(standard)).toBe(110);
    expect(duration(distractionBudget(standard))).toBe('1 h 50 min');
  });

  it('would be larger if stop signals were counted, which is the bug to avoid', () => {
    const everything = ROWS.reduce((total, row) => total + threshold(row, standard), 0);
    expect(everything).toBeGreaterThan(distractionBudget(standard));
  });

  it('stays inside the range the page calls usable', () => {
    // Past 1 h 30 the constraint stops biting, below 30 min it gets worked
    // around — the standard regime has to sit somewhere sane.
    expect(distractionBudget(standard)).toBeGreaterThan(30);
    expect(distractionBudget(regime('strict'))).toBeGreaterThan(30);
  });
});
