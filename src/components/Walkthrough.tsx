import { DayBars } from './DayBars';
import { Step, Tally } from './Prose';
import { Oscilloscope, ScopeLegend } from './Oscilloscope';
import { useCopy } from '../content';
import { breakEvenDensity, relativeTime, simulate, type Inputs } from '../lib/model';

/**
 * The guided read.
 *
 * The console tab is unusable cold: five unlabelled faders and a scope tell a
 * newcomer nothing. This page is the way in — it explains one idea, hands over
 * the one fader that idea controls, shows what just moved, and only then goes on
 * to the next. By the end the reader has set every value, and every other tab is
 * already configured, because the whole page shares one state.
 *
 * The prose itself lives in `src/content/`, one module per language. This
 * component is only the frame it hangs in.
 */
export function Walkthrough({
  inputs,
  onChange,
  onOpenInstrument,
}: {
  inputs: Inputs;
  onChange: (patch: Partial<Inputs>) => void;
  onOpenInstrument: () => void;
}) {
  const copy = useCopy();
  const w = copy.walkthrough;

  const values = {
    inputs,
    result: simulate(inputs),
    rawGain: 1 / relativeTime(inputs.share, inputs.speed),
    breakEven: breakEvenDensity(inputs.share, inputs.speed, inputs.review),
  };

  return (
    <>
      <article className="mt-11 max-w-[63ch] [&_p]:mb-5">
        <p className="kicker mb-3">{w.kicker}</p>
        <h2 className="text-[34px] leading-[1.12] font-bold tracking-[-0.02em] max-sm:text-[28px]">
          {w.headline}
        </h2>
        <p className="dek mt-4 mb-8">{w.dek}</p>

        {w.intro}

        {w.steps(values, onChange).map((step) => (
          <Step key={step.no} no={step.no} title={step.title}>
            {step.body}
          </Step>
        ))}

        <Step no={copy.dayBars.kicker} title={copy.dayBars.title}>
          {copy.dayBars.lead}
        </Step>
      </article>

      <DayBars inputs={inputs} />
      <p className="caption mt-3 max-w-[66ch]">{copy.dayBars.caption}</p>

      <article className="mt-4 max-w-[63ch] [&_p]:mb-5">
        <Step no={w.curve.kicker} title={w.curve.title}>
          {w.curve.lead}
        </Step>
      </article>

      <Oscilloscope share={inputs.share} speed={inputs.speed} review={inputs.review} />
      <ScopeLegend share={inputs.share} speed={inputs.speed} review={inputs.review} />

      <ol className="mt-6 max-w-[63ch] space-y-4">
        {w.curve.readings(values).map((reading, i) => (
          // Authored copy in a fixed order: nothing is inserted or reordered, so
          // the index is a stable key.
          <li key={i}>{reading}</li>
        ))}
      </ol>

      {w.curve.contrast}

      <Tally>{w.curve.tally(values)}</Tally>

      {w.curve.afterward}

      <p className="mt-6">
        <button
          type="button"
          onClick={onOpenInstrument}
          className="font-sans border-brass bg-brass text-paper cursor-pointer border px-5 py-2.5 text-[12px] font-semibold tracking-[0.08em] uppercase"
        >
          {w.curve.openInstrument}
        </button>
      </p>

      <p className="caption border-rule mt-12 max-w-[68ch] border-t pt-5">{w.curve.caveat}</p>
    </>
  );
}
