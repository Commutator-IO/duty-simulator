import katex from 'katex';
import { describe, expect, it } from 'vitest';
import { FORMULAS, KATEX_OPTIONS } from './formulas';
import { MATHML } from './formulas.mathml';

describe('the LaTeX sources', () => {
  it('all compile under the strict options the generator uses', () => {
    for (const [key, tex] of Object.entries(FORMULAS)) {
      expect(() => katex.renderToString(tex, KATEX_OPTIONS), key).not.toThrow();
    }
  });

  it('produce MathML and not KaTeX HTML', () => {
    // If this fails the page has silently started needing a stylesheet and a
    // font it does not ship.
    for (const key of Object.keys(FORMULAS)) {
      expect(MATHML[key], key).toContain('<math');
      expect(MATHML[key], key).not.toContain('katex-html');
    }
  });
});

describe('the generated file', () => {
  it('covers every formula, and nothing else', () => {
    expect(Object.keys(MATHML).sort()).toEqual(Object.keys(FORMULAS).sort());
  });

  it('has not drifted from the sources', () => {
    // The one failure this whole arrangement exists to catch: editing a formula
    // and forgetting `npm run formulas`.
    for (const [key, tex] of Object.entries(FORMULAS)) {
      expect(MATHML[key], `${key} is stale — run \`npm run formulas\``).toBe(
        katex.renderToString(tex, KATEX_OPTIONS),
      );
    }
  });
});
