import { describe, expect, it } from 'vitest';
import { CARDS, COMPUTED, CREDITS, SPAN, cardById } from './foundations';

/**
 * The portraits policy is written down in CLAUDE.md as a rule that does not
 * bend. Written-down rules bend anyway, so this is the part that does not: a
 * file added under a licence that does not permit reuse fails the build.
 */
const ALLOWED = [
  'Public domain',
  'CC0',
  /^CC BY(-SA)? [0-9.]+( [A-Z]{2})?$/,
] as const;

describe('the research entries', () => {
  it('runs in publication order', () => {
    const years = CARDS.map((c) => c.year);
    expect([...years].sort((a, b) => a - b)).toEqual(years);
  });

  it('spans from the first entry to the last thing any entry covers', () => {
    expect(SPAN.from).toBe(Math.min(...CARDS.map((c) => c.year)));
    expect(SPAN.to).toBe(Math.max(...CARDS.map((c) => c.until ?? c.year)));
  });

  it('never ends a span before it starts', () => {
    for (const c of CARDS) if (c.until) expect(c.until).toBeGreaterThan(c.year);
  });

  it('has a unique id for every entry, and finds each one', () => {
    expect(new Set(CARDS.map((c) => c.id)).size).toBe(CARDS.length);
    for (const c of CARDS) expect(cardById(c.id)).toBe(c);
  });

  it('counts the computed entries rather than trusting a written-down figure', () => {
    expect(COMPUTED).toBe(CARDS.filter((c) => c.implemented).length);
    expect(COMPUTED).toBeGreaterThan(0);
  });
});

describe('the portraits', () => {
  it('carries only licences that permit reuse', () => {
    for (const { card, portrait } of CREDITS) {
      const ok = ALLOWED.some((a) =>
        typeof a === 'string' ? portrait.licence === a : a.test(portrait.licence),
      );
      expect(ok, `${card.id}: "${portrait.licence}" is not a licence this page may use`).toBe(true);
    }
  });

  it('prints a credit for every one of them, because CC BY requires it', () => {
    for (const { card, portrait } of CREDITS) {
      expect(portrait.by.length, `${card.id} has no credit`).toBeGreaterThan(0);
    }
  });

  it('is hotlinked from Commons and never re-hosted', () => {
    for (const { portrait } of CREDITS) {
      expect(portrait.src).toMatch(/^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\//);
      expect(portrait.page).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    }
  });
});
