import { describe, expect, it } from 'vitest';
import { DEFAULTS, loadVerdict, ratchetVerdict, simulate } from './model';
import { loadSentence, ratchetSentence } from './verdicts';

/**
 * These tests deliberately avoid asserting on wording. The copy is editorial and
 * gets rewritten; what must not change is that the sentence shown matches the
 * verdict computed, quotes the figures the panel is showing, and never prints a
 * saving as a negative number.
 */

const HEAVY = { ...DEFAULTS, density: 1.7 };
const LIGHT = { ...DEFAULTS, density: 1 };
const IMPOSSIBLE = { ...DEFAULTS, hours: 9, share: 0.9, speed: 8, review: 0 };

describe('the load sentence', () => {
  it('is a different sentence for each of the three verdicts', () => {
    const sentences = [HEAVY, LIGHT, IMPOSSIBLE].map((i) => loadSentence(simulate(i), i));
    expect(new Set(sentences).size).toBe(3);
    expect([HEAVY, LIGHT, IMPOSSIBLE].map((i) => loadVerdict(simulate(i)))).toEqual([
      'heavier',
      'lighter',
      'unsustainable',
    ]);
  });

  it('quotes the strain figures when it says the day costs more', () => {
    const result = simulate(HEAVY);
    const sentence = loadSentence(result, HEAVY);
    expect(sentence).toContain(result.loadWith.toFixed(1));
    expect(sentence).toContain(result.loadWithout.toFixed(1));
  });

  it('prints a saving as a positive number, never as a minus', () => {
    // The gap is negative here. Printing it raw would read "−1.7 less strain".
    expect(simulate(LIGHT).loadGap).toBeLessThan(0);
    expect(loadSentence(simulate(LIGHT), LIGHT)).not.toContain('−');
  });

  it('quotes the impossible hour count rather than a strain comparison', () => {
    const result = simulate(IMPOSSIBLE);
    expect(result.hoursWithout).toBeGreaterThan(10.5);
    const sentence = loadSentence(result, IMPOSSIBLE);
    expect(sentence).toContain(result.hoursWithout.toFixed(1));
    // Nothing is compared against a day that cannot happen.
    expect(sentence).not.toContain(result.loadWith.toFixed(1));
  });
});

describe('the ratchet sentence', () => {
  it('is a different sentence at each of the three registers', () => {
    const visibles = [0, 0.5, 1];
    const sentences = visibles.map((visible) => {
      const inputs = { ...DEFAULTS, visible };
      return ratchetSentence(simulate(inputs), inputs);
    });
    expect(new Set(sentences).size).toBe(3);
    expect(visibles.map(ratchetVerdict)).toEqual(['withheld', 'partial', 'surrendered']);
  });

  it('quotes the rise the metric card is showing', () => {
    const inputs = { ...DEFAULTS, visible: 0.5 };
    const result = simulate(inputs);
    const rise = Math.round((result.visibleGain - 1) * 100);
    expect(ratchetSentence(result, inputs)).toContain(`${rise}%`);
  });

  it('says nothing about a rise when nothing has been made visible', () => {
    // At zero the baseline does not move, so quoting "+0%" would be noise.
    const inputs = { ...DEFAULTS, visible: 0 };
    expect(ratchetSentence(simulate(inputs), inputs)).not.toContain('%');
  });

  it('produces a sentence at every step of the fader', () => {
    for (let v = 0; v <= 1.0001; v += 0.05) {
      const inputs = { ...DEFAULTS, visible: Math.min(1, v) };
      expect(ratchetSentence(simulate(inputs), inputs).length).toBeGreaterThan(40);
    }
  });
});
