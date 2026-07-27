import { describe, expect, it } from 'vitest';
import { COPY } from '../content';
import { LANGUAGES } from './i18n';
import { DEFAULTS, loadVerdict, ratchetVerdict, simulate } from './model';

/**
 * The verdicts, checked in every language.
 *
 * These sentences are the part of the interface most likely to drift from the
 * arithmetic — a verdict that says the day is lighter while the numbers say
 * heavier is worse than no verdict at all. And a translation can flip that
 * meaning as easily as a rewrite can, so the invariants are asserted against
 * each language rather than against one canonical English version.
 *
 * Nothing here asserts on wording. What must hold is that the sentence shown
 * matches the verdict computed, quotes the figures the panel is showing, and
 * never prints a saving as a negative number.
 */

const HEAVY = { ...DEFAULTS, density: 1.7 };
const LIGHT = { ...DEFAULTS, density: 1 };
const IMPOSSIBLE = { ...DEFAULTS, hours: 9, share: 0.9, speed: 8, review: 0 };

describe.each(LANGUAGES)('verdicts in %s', (language) => {
  const { load, ratchet } = COPY[language].verdicts;
  // The expected substrings have to be built with the same language's
  // formatter, or French "6,8" is compared against English "6.8".
  const fmt = COPY[language].format;

  it('is a different sentence for each of the three load verdicts', () => {
    const sentences = [HEAVY, LIGHT, IMPOSSIBLE].map((i) => load(simulate(i), i));
    expect(new Set(sentences).size).toBe(3);
    expect([HEAVY, LIGHT, IMPOSSIBLE].map((i) => loadVerdict(simulate(i)))).toEqual([
      'heavier',
      'lighter',
      'unsustainable',
    ]);
  });

  it('quotes the strain figures when it says the day costs more', () => {
    const result = simulate(HEAVY);
    const sentence = load(result, HEAVY);
    expect(sentence).toContain(fmt.units(result.loadWith));
    expect(sentence).toContain(fmt.units(result.loadWithout));
  });

  it('prints a saving as a positive number, never as a minus', () => {
    // The gap is negative here. Printing it raw would read "−1.7 less strain".
    expect(simulate(LIGHT).loadGap).toBeLessThan(0);
    expect(load(simulate(LIGHT), LIGHT)).not.toContain('−');
  });

  it('quotes the impossible hour count rather than a strain comparison', () => {
    const result = simulate(IMPOSSIBLE);
    expect(result.hoursWithout).toBeGreaterThan(10.5);
    const sentence = load(result, IMPOSSIBLE);
    expect(sentence).toContain(fmt.units(result.hoursWithout));
    expect(sentence).not.toContain(fmt.units(result.loadWith));
  });

  it('is a different ratchet sentence at each of the three registers', () => {
    const visibles = [0, 0.5, 1];
    const sentences = visibles.map((visible) => {
      const inputs = { ...DEFAULTS, visible };
      return ratchet(simulate(inputs), inputs);
    });
    expect(new Set(sentences).size).toBe(3);
    expect(visibles.map(ratchetVerdict)).toEqual(['withheld', 'partial', 'surrendered']);
  });

  it('quotes the rise the metric card is showing', () => {
    const inputs = { ...DEFAULTS, visible: 0.5 };
    const result = simulate(inputs);
    expect(ratchet(result, inputs)).toContain(fmt.percent(result.visibleGain - 1));
  });

  it('says nothing about a rise when nothing has been made visible', () => {
    // At zero the baseline does not move, so quoting "+0%" would be noise.
    const inputs = { ...DEFAULTS, visible: 0 };
    expect(ratchet(simulate(inputs), inputs)).not.toContain('%');
  });

  it('produces a sentence at every step of the fader', () => {
    for (let v = 0; v <= 1.0001; v += 0.05) {
      const inputs = { ...DEFAULTS, visible: Math.min(1, v) };
      expect(ratchet(simulate(inputs), inputs).length).toBeGreaterThan(40);
    }
  });
});

describe('the two languages', () => {
  it('never render the same verdict identically', () => {
    // A key copied across from the other language rather than translated would
    // otherwise pass every test above.
    for (const inputs of [HEAVY, LIGHT, IMPOSSIBLE]) {
      const result = simulate(inputs);
      expect(COPY.en.verdicts.load(result, inputs)).not.toBe(
        COPY.fr.verdicts.load(result, inputs),
      );
    }
    for (const visible of [0, 0.5, 1]) {
      const inputs = { ...DEFAULTS, visible };
      const result = simulate(inputs);
      expect(COPY.en.verdicts.ratchet(result, inputs)).not.toBe(
        COPY.fr.verdicts.ratchet(result, inputs),
      );
    }
  });
});
