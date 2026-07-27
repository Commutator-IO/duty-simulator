import { describe, expect, it } from 'vitest';
import { duration, hours, index, percent, percentSigned, signed, times, units } from './format';

describe('figures', () => {
  it('writes hours, multipliers and percentages the way the page reads them', () => {
    expect(hours(4)).toBe('4.0 h');
    expect(hours(5.714)).toBe('5.7 h');
    expect(times(1.4286)).toBe('1.43×');
    expect(percent(0.6)).toBe('60%');
    expect(index(1.3)).toBe('1.30');
    expect(units(5.2)).toBe('5.2');
  });

  it('uses the typographic minus, never the hyphen', () => {
    expect(signed(-0.514)).toBe('−0.5');
    expect(signed(1.8)).toBe('+1.8');
    expect(percentSigned(-0.21)).toBe('−21%');
    expect(percentSigned(0.21)).toBe('+21%');
    expect(signed(-1)).not.toContain('-');
  });

  it('does not produce a negative zero', () => {
    expect(signed(-0.02)).toBe('−0.0');
    expect(signed(0)).toBe('+0.0');
  });

  it('survives a non-finite value rather than printing NaN', () => {
    expect(hours(Number.NaN)).toBe('0.0 h');
    expect(times(Number.POSITIVE_INFINITY)).toBe('0.00×');
  });
});

describe('durations', () => {
  it('switches to hours past sixty minutes', () => {
    expect(duration(20)).toBe('20 min');
    expect(duration(59)).toBe('59 min');
    expect(duration(60)).toBe('1 h');
    expect(duration(110)).toBe('1 h 50 min');
    expect(duration(120)).toBe('2 h');
    expect(duration(175)).toBe('2 h 55 min');
  });

  it('pads the minutes so a column of thresholds lines up', () => {
    expect(duration(65)).toBe('1 h 05 min');
  });

  it('handles zero and nonsense', () => {
    expect(duration(0)).toBe('0 min');
    expect(duration(-10)).toBe('0 min');
    expect(duration(Number.NaN)).toBe('0 min');
  });
});
