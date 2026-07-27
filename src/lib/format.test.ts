import { describe, expect, it } from 'vitest';
import { makeFormats } from './format';

/**
 * Both languages, because the whole reason these are built per language is that
 * French and English disagree about the decimal separator and about the space
 * before a percent sign — and a page that mixes the two in one sentence reads
 * as a machine translation.
 */
const en = makeFormats('en');
const fr = makeFormats('fr-FR');

describe('English figures', () => {
  it('uses a point and no space before the sign', () => {
    expect(en.hours(4)).toBe('4.0 h');
    expect(en.hours(5.714)).toBe('5.7 h');
    expect(en.times(1.4286)).toBe('1.43×');
    expect(en.timesShort(3)).toBe('3.0×');
    expect(en.percent(0.6)).toBe('60%');
    expect(en.index(1.3)).toBe('1.30');
    expect(en.units(5.2)).toBe('5.2');
  });
});

describe('French figures', () => {
  it('uses a comma for the decimal', () => {
    expect(fr.hours(4)).toBe('4,0 h');
    expect(fr.times(1.4286)).toBe('1,43×');
    expect(fr.index(1.3)).toBe('1,30');
    expect(fr.units(5.2)).toBe('5,2');
  });

  it('puts a space before the percent sign, and English does not', () => {
    // The space French uses here is a narrow no-break one, not a plain space.
    expect(fr.percent(0.6)).toMatch(/^60\s%$/);
    expect(fr.percent(0.6)).not.toBe('60%');
    expect(en.percent(0.6)).toBe('60%');
  });
});

describe('rules that hold in both', () => {
  it.each([
    ['en', en],
    ['fr', fr],
  ])('uses the typographic minus in %s, never the hyphen', (_name, f) => {
    expect(f.signed(-0.514)).toContain('−');
    expect(f.signed(-0.514)).not.toContain('-');
    expect(f.percentSigned(-0.21)).toContain('−');
    expect(f.signed(1.8).startsWith('+')).toBe(true);
    expect(f.percentSigned(0.21).startsWith('+')).toBe(true);
  });

  it.each([
    ['en', en],
    ['fr', fr],
  ])('rounds a tiny negative to a signed zero rather than to "−0" in %s', (_name, f) => {
    // −0.02 must not surface as a bare "0"; the sign carries the meaning.
    expect(f.signed(-0.02)).toBe(`−${f.units(0)}`);
    expect(f.signed(0)).toBe(`+${f.units(0)}`);
  });

  it.each([
    ['en', en],
    ['fr', fr],
  ])('survives a non-finite value in %s rather than printing NaN', (_name, f) => {
    expect(f.hours(Number.NaN)).not.toContain('NaN');
    expect(f.times(Number.POSITIVE_INFINITY)).not.toContain('Infinity');
  });
});

describe('durations', () => {
  it('switches to hours past sixty minutes', () => {
    expect(en.duration(20)).toBe('20 min');
    expect(en.duration(59)).toBe('59 min');
    expect(en.duration(60)).toBe('1 h');
    expect(en.duration(110)).toBe('1 h 50 min');
    expect(en.duration(120)).toBe('2 h');
  });

  it('pads the minutes so a column of thresholds lines up', () => {
    expect(en.duration(65)).toBe('1 h 05 min');
  });

  it('handles zero and nonsense', () => {
    expect(en.duration(0)).toBe('0 min');
    expect(en.duration(-10)).toBe('0 min');
    expect(en.duration(Number.NaN)).toBe('0 min');
  });
});
