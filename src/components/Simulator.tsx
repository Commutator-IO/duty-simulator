import { Oscilloscope, ScopeLegend } from './Oscilloscope';
import { Display } from './Latex';
import { relativeTime } from '../lib/model';
import { Metrics, Note, SectionHead } from './Cards';
import { Console, type Channel } from './Fields';
import { useCopy } from '../content';
import type { Formats } from '../lib/format';
import type { Copy } from '../content/types';
import { BOUNDS, DEFAULTS, SUSTAINABLE_LOAD, simulate, type Inputs } from '../lib/model';

/** The scale both load meters are drawn against, in hours. */
const SCALE = 12;
/** Segments in the bargraph. Divides into 12 h at exactly 30 min a segment. */
const SEGMENTS = 24;

/**
 * The load meter, as an LED bargraph.
 *
 * Segments past the sustainable threshold are wired to the alert rail, so a day
 * that runs long lights up amber on its own without any text having to say so —
 * which is the whole reason the threshold is drawn rather than merely stated.
 */
function Meter({ who, hours, f }: { who: string; hours: number; f: Formats }) {
  const lit = Math.round((Math.min(hours, SCALE) / SCALE) * SEGMENTS);
  const safe = (SUSTAINABLE_LOAD / SCALE) * SEGMENTS;

  return (
    <>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="font-sans text-[14px] font-semibold">{who}</span>
        <span className="font-mono tabular text-muted text-[14px]">{f.hours(hours)}</span>
      </div>
      <div className="crt mb-4 flex gap-px p-1.5">
        {Array.from({ length: SEGMENTS }, (_, i) => {
          const on = i < lit;
          const hot = i >= safe;
          return (
            <span
              key={i}
              className="bar-fill h-4.5 flex-1"
              style={{
                background: on
                  ? hot
                    ? 'var(--color-trace-c)'
                    : 'var(--color-phosphor)'
                  : 'var(--color-graticule)',
                opacity: on ? 1 : 0.35,
                boxShadow: on
                  ? `0 0 6px ${hot ? 'rgb(240 169 60 / 0.55)' : 'rgb(88 224 140 / 0.5)'}`
                  : undefined,
              }}
            />
          );
        })}
      </div>
    </>
  );
}

/** The five settings, as channels on the desk. */
function parameters(
  copy: Copy,
  f: Formats,
  inputs: Inputs,
  onChange: (patch: Partial<Inputs>) => void,
): Channel[] {
  return [
    {
      ...copy.channels.hours,
      value: inputs.hours,
      ...BOUNDS.hours,
      fallback: DEFAULTS.hours,
      onChange: (hours) => onChange({ hours }),
      render: f.hours,
    },
    {
      ...copy.channels.share,
      value: inputs.share,
      ...BOUNDS.share,
      fallback: DEFAULTS.share,
      onChange: (share) => onChange({ share }),
      render: f.percent,
    },
    {
      ...copy.channels.speed,
      value: inputs.speed,
      ...BOUNDS.speed,
      fallback: DEFAULTS.speed,
      onChange: (speed) => onChange({ speed }),
      render: f.timesShort,
    },
    {
      ...copy.channels.review,
      value: inputs.review,
      ...BOUNDS.review,
      fallback: DEFAULTS.review,
      onChange: (review) => onChange({ review }),
      render: f.percent,
    },
    {
      ...copy.channels.density,
      value: inputs.density,
      ...BOUNDS.density,
      fallback: DEFAULTS.density,
      onChange: (density) => onChange({ density }),
      render: f.index,
    },
  ];
}

/** The one fader that decides who ends up with the saving. */
function ratchetChannel(
  copy: Copy,
  f: Formats,
  inputs: Inputs,
  onChange: (patch: Partial<Inputs>) => void,
): Channel[] {
  return [
    {
      ...copy.channels.visible,
      value: inputs.visible,
      ...BOUNDS.visible,
      fallback: DEFAULTS.visible,
      onChange: (visible) => onChange({ visible }),
      render: f.percent,
    },
  ];
}

export function Simulator({
  inputs,
  onChange,
}: {
  inputs: Inputs;
  onChange: (patch: Partial<Inputs>) => void;
}) {
  const copy = useCopy();
  const c = copy.simulator;
  const f = copy.format;
  const result = simulate(inputs);

  return (
    <>
      <section className="mt-11">
        <SectionHead {...c.stepOne} />

        <Console channels={parameters(copy, f, inputs, onChange)} />

        <Metrics
          items={[
            {
              key: 'gain',
              label: c.metrics.gain[0],
              value: f.times(result.gain),
              note: c.metrics.gain[1],
            },
            {
              key: 'ceiling',
              label: c.metrics.ceiling[0],
              value: f.times(result.effectiveCeiling),
              note: c.metrics.ceiling[1],
            },
            {
              key: 'without',
              label: c.metrics.without[0],
              value: f.hours(result.hoursWithout),
              note: c.metrics.without[1],
            },
            {
              key: 'gap',
              label: c.metrics.gap[0],
              value: f.signed(result.loadGap),
              note: c.metrics.gap[1],
            },
          ]}
        />

        {/* Two ceilings appear in the readouts above; this is why. */}
        <section className="mt-12 max-w-[63ch]">
          <h3 className="mb-3 text-[21px] font-bold tracking-[-0.01em]">{c.loop.title}</h3>
          <div className="[&_p]:mb-5">{c.loop.body}</div>

          <Display name="closedLoop" />

          <dl className="border-rule mt-6 grid gap-x-8 gap-y-3 border-t pt-4 text-[15px] sm:grid-cols-3">
            {[
              { t: c.loop.openLoop, v: f.times(1 / relativeTime(inputs.share, inputs.speed)) },
              { t: c.loop.closedLoop, v: f.times(result.gain) },
              { t: c.loop.feedbackCeiling, v: f.times(1 / inputs.review) },
            ].map((i) => (
              <div key={i.t}>
                <dt className="caption">{i.t}</dt>
                <dd className="font-mono tabular mt-0.5 text-[19px] font-semibold">{i.v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 [&_p]:mb-5">{c.loop.consequence}</div>
        </section>

        <h3 className="kicker mt-11 mb-2">{c.curveKicker}</h3>
        <Oscilloscope share={inputs.share} speed={inputs.speed} review={inputs.review} />
        <ScopeLegend share={inputs.share} speed={inputs.speed} review={inputs.review} />
        <p className="caption mt-2.5 max-w-[62ch]">{c.curveCaption}</p>

        <h3 className="kicker mt-11 mb-2">{c.metersKicker}</h3>
        <div>
          <Meter who={c.meterWith} hours={inputs.hours} f={f} />
          <Meter who={c.meterWithout} hours={result.hoursWithout} f={f} />
          <div className="font-mono text-muted flex justify-between text-[11px]">
            <span>0</span>
            <span>6 h</span>
            <span>{SCALE} h</span>
          </div>
          <p className="caption mt-2.5 max-w-[62ch]">{c.metersCaption}</p>
        </div>

        <Note className="mt-7">{copy.verdicts.load(result, inputs)}</Note>
      </section>

      <section className="mt-14">
        <SectionHead {...c.stepTwo} />

        <Console channels={ratchetChannel(copy, f, inputs, onChange)} />

        <Display name="ratchet" />

        <Metrics
          prefix="R"
          items={[
            {
              key: 'baseline',
              label: c.metrics.baseline[0],
              value: f.percentSigned(result.visibleGain - 1),
              note: c.metrics.baseline[1],
            },
            {
              key: 'after',
              label: c.metrics.after[0],
              value: f.hours(result.hoursAfterRatchet),
              note: c.metrics.after[1],
            },
            {
              key: 'margin',
              label: c.metrics.margin[0],
              value: f.hours(result.marginKept),
              note: c.metrics.margin[1],
            },
          ]}
        />

        <Note tone="alert" className="mt-7">
          {copy.verdicts.ratchet(result, inputs)}
        </Note>
      </section>

      <p className="caption border-rule mt-14 max-w-[68ch] border-t pt-5">{c.method}</p>
    </>
  );
}
