import type { KatexOptions } from 'katex';

/**
 * The formulas of the model, written in LaTeX.
 *
 * They live in one list rather than inside the components for two reasons: a
 * formula is the one piece of the page that is identical wherever it appears,
 * and keeping them together lets a test check that every one of them still
 * compiles.
 *
 * The key is what the components ask for, so a renamed formula fails to compile
 * rather than silently rendering nothing.
 */

/**
 * How the formulas are rendered, shared by the generator and by the test that
 * checks the generated file has not drifted.
 *
 * MathML rather than KaTeX's own HTML: the browser draws it natively, so the
 * page carries neither a stylesheet nor any of the font faces KaTeX ships with
 * its HTML output. `trust` is off and `strict` is fatal — every expression here
 * is a literal in this repository, and none of it should ever become anything
 * else.
 */
export const KATEX_OPTIONS: KatexOptions = {
  output: 'mathml',
  displayMode: false,
  throwOnError: true,
  strict: 'error',
  trust: false,
};

export const FORMULAS = {
  /**
   * Amdahl, with the limit spelled out rather than left as an arrow.
   *
   * `\limits` is explicit because these are rendered out of display mode, where
   * KaTeX would otherwise set the condition to the right of the operator
   * instead of under it.
   */
  amdahl: String.raw`\mathrm{gain} = \dfrac{1}{(1-p) + \dfrac{p}{s}}
    \qquad \lim\limits_{s \to \infty} \mathrm{gain} = \dfrac{1}{1-p}`,

  /** The same law, compressed to fit a reference card. */
  amdahlShort: String.raw`\mathrm{gain} = \dfrac{1}{(1-p) + \dfrac{p}{s}}
    \;\longrightarrow\; \dfrac{1}{1-p}`,

  /** The review term: a tax on the gain, not on the work. */
  review: String.raw`t = (1-p) + \dfrac{p}{s}
    \qquad t_{\mathrm{eff}} = t + r\,(1 - t)`,

  /** Gustafson: the task grows, the duration is held. */
  gustafson: String.raw`\mathrm{gain} = (1-p) + p\,s`,

  /** Little, in its usual letters. */
  little: String.raw`L = \lambda\,W`,

  /** The ratchet: what the surplus becomes once it has been shown. */
  ratchet: String.raw`\mathrm{visible} = 1 + v\,(\mathrm{gain} - 1)`,
} as const satisfies Record<string, string>;

export type FormulaKey = keyof typeof FORMULAS;
