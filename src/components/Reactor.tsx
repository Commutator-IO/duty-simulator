import { useCopy } from '../content';
import { SectionHead } from './Cards';
import { Latex } from './Latex';
import {
  SATURATION_K,
  damkohler,
  effectiveCeiling,
  limitingStep,
  relativeTime,
  saturatedGain,
  turnoverSpeed,
  type Inputs,
} from '../lib/model';

/**
 * The model read as a reaction.
 *
 * Kinetics only. The control-theory reading of the same equations lives on the
 * instrument, next to the two ceilings it explains — putting it here made this
 * tab a grab-bag of everything the analysis turned up rather than one argument.
 *
 * The arc is the one a kinetics course takes: the limiting step, the catalyst,
 * the reverse rate, saturation, and the order of the reaction. Each idea is put
 * in ordinary words before it is named, which is the house rule and which the
 * previous version of this tab broke on every heading.
 */

const W = 640;
const H = 280;
const L = 46;
const R = 16;
const T = 18;
const B = 40;

/** Gain against speed, with review constant and with review saturating. */
function SaturationChart({ inputs }: { inputs: Inputs }) {
  const copy = useCopy();
  const c = copy.reactor.saturation;
  const f = copy.format;

  const sMax = 24;
  const constant = (s: number) => 1 / (relativeTime(inputs.share, s) + inputs.review * (1 - relativeTime(inputs.share, s)));
  const yMax = Math.max(effectiveCeiling(inputs.share, inputs.review), 1.2) * 1.12;

  const x = (s: number) => L + ((s - 1) / (sMax - 1)) * (W - L - R);
  const y = (v: number) => H - B - ((v - 1) / (yMax - 1)) * (H - T - B);

  const trace = (fn: (s: number) => number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 200; i++) {
      const s = 1 + (i / 200) * (sMax - 1);
      pts.push(`${i ? 'L' : 'M'}${x(s).toFixed(1)} ${y(Math.max(1, fn(s))).toFixed(1)}`);
    }
    return pts.join(' ');
  };

  const peak = turnoverSpeed(inputs.share, inputs.review);

  return (
    <>
      <div className="border-rule bg-panel mt-6 border p-5">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={c.alt}>
          <line x1={L} y1={T} x2={L} y2={H - B} stroke="var(--color-rule)" />
          <line x1={L} y1={H - B} x2={W - R} y2={H - B} stroke="var(--color-rule)" />

          {/* Gain of 1: below this the tool is costing you time. */}
          <line
            x1={L}
            y1={y(1)}
            x2={W - R}
            y2={y(1)}
            stroke="var(--color-muted)"
            strokeWidth={1}
            strokeDasharray="2 4"
          />

          <path d={trace(constant)} fill="none" stroke="var(--color-slate)" strokeWidth={2.2} />
          <path
            d={trace((s) => saturatedGain(inputs.share, s, inputs.review))}
            fill="none"
            stroke="var(--color-brass)"
            strokeWidth={2.6}
          />

          {peak !== null && (
            <>
              <line
                x1={x(Math.min(peak, sMax))}
                y1={T}
                x2={x(Math.min(peak, sMax))}
                y2={H - B}
                stroke="var(--color-alert)"
                strokeWidth={1.4}
                strokeDasharray="5 4"
              />
              <text
                x={x(Math.min(peak, sMax)) + 6}
                y={T + 12}
                fontFamily="var(--font-sans)"
                fontSize="11"
                fill="var(--color-alert)"
              >
                {c.turnoverMark}
              </text>
            </>
          )}

          <g fontFamily="var(--font-sans)" fontSize="11" fill="var(--color-muted)">
            <text x={L} y={H - B + 16}>1×</text>
            <text x={W - R} y={H - B + 16} textAnchor="end">{sMax}×</text>
            <text x={(L + W - R) / 2} y={H - 8} textAnchor="middle">{c.xAxis}</text>
            <text x={L - 6} y={y(1) + 4} textAnchor="end">1×</text>
          </g>
        </svg>
      </div>

      <ul className="caption mt-3 flex flex-wrap gap-x-6 gap-y-1.5">
        <li className="flex items-center gap-2">
          <i className="bg-slate inline-block h-0.5 w-4 shrink-0" />
          {c.constantLine}
        </li>
        <li className="flex items-center gap-2">
          <i className="bg-brass inline-block h-0.5 w-4 shrink-0" />
          {c.saturatedLine}
        </li>
      </ul>

      <p className="caption mt-3 max-w-[66ch]">
        {peak === null
          ? c.noTurnover(f.times(saturatedGain(inputs.share, 1e6, inputs.review)))
          : c.turnover(f.timesShort(peak))}
      </p>
    </>
  );
}

export function Reactor({ inputs }: { inputs: Inputs }) {
  const copy = useCopy();
  const c = copy.reactor;
  const f = copy.format;

  const Da = damkohler(inputs.share, inputs.speed);
  const limiting = limitingStep(inputs.share, inputs.speed);

  return (
    <>
      <section className="mt-11">
        <SectionHead designator={c.designator} title={c.title} sub={c.sub} />
        <div className="max-w-[63ch] [&_p]:mb-5">{c.lead}</div>
      </section>

      {/* The limiting step, and the number that names it. */}
      <section className="mt-12">
        <h3 className="mb-3 text-[23px] font-bold tracking-[-0.01em]">{c.limiting.title}</h3>
        <div className="max-w-[63ch] [&_p]:mb-5">{c.limiting.body}</div>

        <div className="border-brass bg-panel mt-6 border border-l-[3px] px-5 py-4">
          <p className="kicker mb-2">{c.damkohler.kicker}</p>
          <p className="font-mono text-[30px] leading-none font-semibold">
            Da = {f.index(Math.min(Da, 99))}
          </p>
          <p className="mt-3 text-[17px] leading-relaxed">
            {limiting === 'reach' ? c.damkohler.reachLimited : c.damkohler.speedLimited}
          </p>
        </div>
      </section>

      <section className="mt-14">
        <h3 className="mb-3 text-[23px] font-bold tracking-[-0.01em]">{c.catalyst.title}</h3>
        <div className="max-w-[63ch] [&_p]:mb-5">{c.catalyst.body}</div>
      </section>

      <section className="mt-14">
        <h3 className="mb-3 text-[23px] font-bold tracking-[-0.01em]">{c.reversible.title}</h3>
        <div className="max-w-[63ch] [&_p]:mb-5">{c.reversible.body}</div>
        <div className="max-w-[63ch]">
          <p className="bg-panel border-brass-soft my-5 overflow-x-auto border-l-2 px-3.5 py-3">
            <Latex name="review" />
          </p>
        </div>
      </section>

      {/* Saturation: where the model is optimistic, precisely. */}
      <section className="mt-14">
        <h3 className="mb-3 text-[23px] font-bold tracking-[-0.01em]">{c.saturation.title}</h3>
        <div className="max-w-[63ch] [&_p]:mb-5">{c.saturation.body}</div>

        <p className="bg-panel border-brass-soft my-5 overflow-x-auto border-l-2 px-3.5 py-3">
          <Latex name="michaelis" />
        </p>

        <SaturationChart inputs={inputs} />

        <div className="mt-6 max-w-[63ch] [&_p]:mb-5">
          {c.saturation.consequence(String(SATURATION_K))}
        </div>
      </section>

      <section className="mt-14">
        <h3 className="mb-3 text-[23px] font-bold tracking-[-0.01em]">{c.order.title}</h3>
        <div className="max-w-[63ch] [&_p]:mb-5">{c.order.body}</div>
      </section>

      {/* Where it stops being useful. */}
      <section className="mt-14">
        <h3 className="mb-3 text-[23px] font-bold tracking-[-0.01em]">{c.breaks.title}</h3>
        <div className="max-w-[63ch] [&_p]:mb-5">{c.breaks.body}</div>
      </section>

    </>
  );
}
