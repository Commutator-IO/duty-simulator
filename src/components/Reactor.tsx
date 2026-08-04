import { useCopy } from '../content';
import { SectionHead } from './Cards';
import {
  BOUNDS,
  SUSTAINABLE_LOAD,
  damkohler,
  heatBalance,
  limitingStep,
  simulate,
  type Inputs,
} from '../lib/model';

/**
 * The model read as a reactor.
 *
 * Three mappings do real work rather than decorating:
 *
 *  - Amdahl is the sum of resistances in series. Total time is the time in each
 *    step added together, so accelerating one step leaves the other untouched —
 *    which is why a better catalyst does nothing to a diffusion-limited
 *    reaction, and why a faster model does nothing to the meeting.
 *  - Review is a reverse rate proportional to the product already formed, which
 *    is exactly the shape of `r × (1 − t)`. At r = 1 forward and reverse match
 *    and the net advance is nil.
 *  - Fatigue is a heat balance. Generation rises with drain; removal capacity
 *    does not rise because you are busy. Where the two cross is not a metaphor,
 *    it is the threshold the instrument already computes.
 *
 * The Damköhler number is the one addition: a ratio of two quantities the model
 * already has, which names the limiting step and therefore which fader to move.
 */

const W = 640;
const H = 300;
const L = 52;
const R = 18;
const T = 20;
const B = 42;

/** An Erlenmeyer, filled to the load the day is actually drawing. */
function Flask({ fill, hot }: { fill: number; hot: boolean }) {
  const level = Math.max(0, Math.min(1, fill));
  // The body runs from y=34 (neck) to y=92 (base); liquid rises from the base.
  const top = 92 - level * 58;

  return (
    <svg viewBox="0 0 80 104" className="h-[104px] w-20 shrink-0" aria-hidden="true">
      <defs>
        <clipPath id="flask-body">
          <path d="M32 34 L12 88 Q10 94 18 94 L62 94 Q70 94 68 88 L48 34 Z" />
        </clipPath>
      </defs>
      <rect
        x="10"
        y={top}
        width="60"
        height={94 - top}
        clipPath="url(#flask-body)"
        fill={hot ? 'var(--color-alert)' : 'var(--color-phosphor)'}
        opacity="0.75"
      />
      <path
        d="M32 34 L12 88 Q10 94 18 94 L62 94 Q70 94 68 88 L48 34 Z"
        fill="none"
        stroke="var(--color-muted)"
        strokeWidth="2"
      />
      {/* Neck and ground-glass collar. */}
      <path d="M32 34 V12 M48 34 V12" stroke="var(--color-muted)" strokeWidth="2" fill="none" />
      <rect x="30" y="8" width="20" height="6" fill="var(--color-muted)" opacity="0.5" />
      {/* Graduations. */}
      {[0.25, 0.5, 0.75].map((g) => (
        <line
          key={g}
          x1="20"
          x2="30"
          y1={92 - g * 58}
          y2={92 - g * 58}
          stroke="var(--color-muted)"
          strokeWidth="1"
          opacity="0.55"
        />
      ))}
    </svg>
  );
}

export function Reactor({ inputs }: { inputs: Inputs }) {
  const copy = useCopy();
  const c = copy.reactor;
  const f = copy.format;

  const r = simulate(inputs);
  const balance = heatBalance(inputs);
  const Da = damkohler(inputs.share, inputs.speed);
  const limiting = limitingStep(inputs.share, inputs.speed);

  const dMin = BOUNDS.density.min;
  const dMax = BOUNDS.density.max;
  const yMax = Math.max(SUSTAINABLE_LOAD, inputs.hours * dMax, r.loadWithout) * 1.12;

  const x = (d: number) => L + ((d - dMin) / (dMax - dMin)) * (W - L - R);
  const y = (v: number) => H - B - (v / yMax) * (H - T - B);

  const generation = `M${x(dMin)} ${y(inputs.hours * dMin)} L${x(dMax)} ${y(inputs.hours * dMax)}`;
  const over = inputs.hours * inputs.density > SUSTAINABLE_LOAD;

  return (
    <>
      <section className="mt-11">
        <SectionHead designator={c.designator} title={c.title} sub={c.sub} />
        {c.lead}
      </section>

      {/* Which step limits — the readout that says what to do. */}
      <div className="border-brass bg-panel mt-8 border border-l-[3px] px-5 py-4">
        <p className="kicker mb-2">{c.damkohler.kicker}</p>
        <p className="font-mono text-[30px] leading-none font-semibold">
          Da = {f.index(Math.min(Da, 99))}
        </p>
        <p className="mt-3 text-[17px] leading-relaxed">
          {limiting === 'reach' ? c.damkohler.reachLimited : c.damkohler.speedLimited}
        </p>
      </div>

      <h3 className="kicker mt-11 mb-2">{c.balance.kicker}</h3>

      <div className="border-rule bg-panel flex items-center gap-5 border p-5">
        <Flask fill={(inputs.hours * inputs.density) / SUSTAINABLE_LOAD} hot={over} />

        <svg viewBox={`0 0 ${W} ${H}`} className="min-w-0 flex-1" role="img" aria-label={c.balance.alt}>
          {/* Region past the removal capacity. */}
          <rect
            x={L}
            y={y(yMax)}
            width={W - L - R}
            height={y(SUSTAINABLE_LOAD) - y(yMax)}
            fill="var(--color-alert)"
            opacity="0.07"
          />

          {/* Axes. */}
          <line x1={L} y1={T} x2={L} y2={H - B} stroke="var(--color-rule)" />
          <line x1={L} y1={H - B} x2={W - R} y2={H - B} stroke="var(--color-rule)" />

          {/* Removal capacity — flat, because the budget does not grow. */}
          <line
            x1={L}
            y1={y(SUSTAINABLE_LOAD)}
            x2={W - R}
            y2={y(SUSTAINABLE_LOAD)}
            stroke="var(--color-alert)"
            strokeWidth={2}
            strokeDasharray="7 5"
          />
          {/* The no-AI day, for comparison. */}
          <line
            x1={L}
            y1={y(r.loadWithout)}
            x2={W - R}
            y2={y(r.loadWithout)}
            stroke="var(--color-slate)"
            strokeWidth={1.6}
            strokeDasharray="3 5"
          />
          {/* Generation — rises with drain. */}
          <path d={generation} fill="none" stroke="var(--color-brass)" strokeWidth={2.6} />

          {/* Where you are. */}
          <circle
            cx={x(inputs.density)}
            cy={y(inputs.hours * inputs.density)}
            r={5.5}
            fill={over ? 'var(--color-alert)' : 'var(--color-phosphor)'}
            stroke="var(--color-paper)"
            strokeWidth={1.5}
          />

          <g fontFamily="var(--font-sans)" fontSize="11" fill="var(--color-muted)">
            <text x={L} y={H - B + 16}>
              {f.index(dMin)}
            </text>
            <text x={W - R} y={H - B + 16} textAnchor="end">
              {f.index(dMax)}
            </text>
            <text x={(L + W - R) / 2} y={H - 10} textAnchor="middle">
              {c.balance.xAxis}
            </text>
            <text x={L - 6} y={y(SUSTAINABLE_LOAD) + 4} textAnchor="end" fill="var(--color-alert)">
              {SUSTAINABLE_LOAD}
            </text>
            <text x={L - 6} y={y(r.loadWithout) + 4} textAnchor="end" fill="var(--color-slate)">
              {f.units(r.loadWithout)}
            </text>
          </g>
        </svg>
      </div>

      <ul className="caption mt-3 flex flex-wrap gap-x-6 gap-y-1.5">
        {[
          { c: 'var(--color-brass)', l: c.balance.generation },
          { c: 'var(--color-alert)', l: c.balance.removal },
          { c: 'var(--color-slate)', l: c.balance.withoutAi },
        ].map((i) => (
          <li key={i.l} className="flex items-center gap-2">
            <i className="inline-block h-0.5 w-4 shrink-0" style={{ background: i.c }} />
            {i.l}
          </li>
        ))}
      </ul>

      <p className="caption mt-3 max-w-[66ch]">
        {c.balance.reading(f.index(balance.runaway), f.index(balance.breakEven))}
      </p>

      <div className="mt-12 max-w-[63ch] [&_p]:mb-5">{c.mappings}</div>

      <p className="caption border-rule mt-14 max-w-[68ch] border-t pt-5">{c.caveat}</p>
    </>
  );
}
