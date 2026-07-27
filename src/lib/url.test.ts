import { describe, expect, it } from 'vitest';
import { BOUNDS, DEFAULTS } from './model';
import { decodeState, decodeTab, encodeState, snap } from './url';

describe('encoding', () => {
  it('writes nothing when everything is default', () => {
    expect(encodeState(DEFAULTS)).toBe('');
  });

  it('writes only what moved', () => {
    expect(encodeState({ ...DEFAULTS, share: 0.8 })).toBe('?p=80');
  });

  it('produces the readable shape the project set out to support', () => {
    const query = encodeState({ ...DEFAULTS, share: 0.6, speed: 3, review: 0.25 });
    expect(query).toBe('');
    expect(encodeState({ ...DEFAULTS, share: 0.7, speed: 4, review: 0.3 })).toBe(
      '?p=70&s=4&r=30',
    );
  });

  it('carries the tab only when it is not the one the site opens on', () => {
    expect(encodeState(DEFAULTS, 'walkthrough')).toBe('');
    expect(encodeState(DEFAULTS, 'simulator')).toBe('?tab=simulator');
    expect(encodeState(DEFAULTS, 'foundations')).toBe('?tab=foundations');
  });
});

describe('round trip', () => {
  it('returns every state unchanged', () => {
    const states = [
      DEFAULTS,
      { ...DEFAULTS, hours: 1, share: 0.1, speed: 1.2, review: 0, density: 1, visible: 0 },
      { ...DEFAULTS, hours: 9, share: 0.95, speed: 8, review: 0.6, density: 1.7, visible: 1 },
      { ...DEFAULTS, hours: 6.5, share: 0.45, speed: 5.4, review: 0.35, density: 1.15 },
    ];
    for (const state of states) {
      expect(decodeState(encodeState(state))).toEqual(state);
    }
  });

  it('survives a tab round trip', () => {
    expect(decodeTab(encodeState(DEFAULTS, 'foundations'))).toBe('foundations');
  });
});

describe('decoding untrusted input', () => {
  it('falls back to the defaults on an empty query', () => {
    expect(decodeState('')).toEqual(DEFAULTS);
  });

  it('ignores values that are not numbers', () => {
    expect(decodeState('?p=abc&s=&d=NaN')).toEqual(DEFAULTS);
  });

  it('clamps anything out of range', () => {
    const wild = decodeState('?h=999&p=400&s=-5&r=99&d=9&v=250');
    expect(wild.hours).toBe(BOUNDS.hours.max);
    expect(wild.share).toBe(BOUNDS.share.max);
    expect(wild.speed).toBe(BOUNDS.speed.min);
    expect(wild.review).toBe(BOUNDS.review.max);
    expect(wild.density).toBe(BOUNDS.density.max);
    expect(wild.visible).toBe(BOUNDS.visible.max);
  });

  it('snaps to a value the slider can actually represent', () => {
    // A hand-edited density of 1.37 is not on the 0.05 grid.
    expect(decodeState('?d=1.37').density).toBe(1.35);
    expect(decodeState('?h=4.3').hours).toBe(4.5);
  });

  it('rejects an unknown tab', () => {
    expect(decodeTab('?tab=nonsense')).toBe('walkthrough');
    expect(decodeTab('')).toBe('walkthrough');
  });
});

describe('snap', () => {
  it('lands on exact steps without float dust', () => {
    expect(snap(1.3, BOUNDS.density)).toBe(1.3);
    expect(snap(1.32, BOUNDS.density)).toBe(1.3);
    expect(snap(0.62, BOUNDS.share)).toBe(0.6);
  });

  it('never leaves the bounds', () => {
    expect(snap(-100, BOUNDS.hours)).toBe(BOUNDS.hours.min);
    expect(snap(100, BOUNDS.hours)).toBe(BOUNDS.hours.max);
  });
});
