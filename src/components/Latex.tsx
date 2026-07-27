import { FORMULAS, type FormulaKey } from '../lib/formulas';
import { MATHML } from '../lib/formulas.mathml';

/**
 * A formula, written in LaTeX in `formulas.ts` and rendered ahead of time.
 *
 * Nothing parses LaTeX here: the MathML was produced once by `npm run formulas`
 * and committed, so the page carries neither a parser nor a stylesheet nor a
 * font. The markup is injected because that is what a pre-rendered element is,
 * and it is safe for a reason worth stating: every expression comes from a
 * literal in this repository, never from anything a visitor typed, and it was
 * generated with KaTeX's `trust` option off.
 *
 * KaTeX emits MathML that assistive technology reads out loud on its own, so
 * there is no `aria-label` to add — one would have it announced twice.
 */
export function Latex({ name }: { name: FormulaKey }) {
  const rendered = MATHML[name];

  // A formula missing from the generated file means someone edited the LaTeX
  // without re-running the generator. `formulas.test.ts` says so plainly; here
  // we fall back to the source rather than showing a hole.
  if (rendered === undefined) return <span className="font-mono">{FORMULAS[name]}</span>;

  return <span dangerouslySetInnerHTML={{ __html: rendered }} />;
}

/** A formula set apart from the prose, on the panel colour. */
export function Display({ name }: { name: FormulaKey }) {
  return (
    <p className="bg-panel border-brass-soft my-4 overflow-x-auto border-l-2 px-3.5 py-3">
      <Latex name={name} />
    </p>
  );
}
