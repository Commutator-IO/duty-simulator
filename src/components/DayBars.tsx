import { useCopy } from '../content';
import * as f from '../lib/format';
import { simulate, type Inputs } from '../lib/model';

/**
 * Amdahl's law, shown rather than plotted.
 *
 * The oscilloscope is accurate and asks a lot: you have to read a curve, spot
 * that it is asymptotic, and infer the ceiling from where it stops rising. This
 * says the same thing in a form nobody has to be taught — three versions of the
 * same working day, drawn to scale, one above the other.
 *
 * The whole lesson is in one visual fact: the block the tool cannot touch is
 * exactly the same width in all three rows. It does not shrink when the
 * assistant gets faster, and it does not vanish when the assistant becomes
 * infinite. That block *is* the ceiling, and you can see it rather than work it
 * out.
 */

type Segment = { key: string; width: number; color: string; label?: string };

function Row({
  title,
  hours,
  segments,
  scale,
  note,
}: {
  title: string;
  hours: string;
  segments: Segment[];
  /** Total width, in the same units as the segments, so rows share a scale. */
  scale: number;
  note?: string;
}) {
  return (
    <div className="mb-5">
      <div className="mb-1.5 flex items-baseline justify-between gap-4">
        <span className="font-sans text-[13.5px] font-semibold">{title}</span>
        <span className="font-mono tabular text-muted text-[13.5px]">{hours}</span>
      </div>

      <div className="flex h-9 w-full">
        {segments.map((s) => (
          <div
            key={s.key}
            className="bar-fill flex items-center justify-center overflow-hidden"
            style={{ width: `${(s.width / scale) * 100}%`, background: s.color }}
            title={s.label}
          >
            {/* The caption only fits once the block is wide enough to hold it;
                below that the legend underneath carries the meaning. */}
            {s.label && s.width / scale > 0.18 && (
              <span className="font-sans truncate px-2 text-[11px] font-semibold text-white/95">
                {s.label}
              </span>
            )}
          </div>
        ))}
        {/* The unused remainder of the scale, so every row is measured against
            the same ruler and the shrinkage is legible. */}
        <div
          className="border-rule border-l"
          style={{ width: `${(1 - segments.reduce((t, s) => t + s.width, 0) / scale) * 100}%` }}
        />
      </div>

      {note && <p className="caption mt-1.5">{note}</p>}
    </div>
  );
}

export function DayBars({ inputs }: { inputs: Inputs }) {
  const copy = useCopy();
  const d = copy.dayBars;
  const r = simulate(inputs);

  // Everything is measured against the day the work would have taken without
  // the tool, because that is the only bar the reader already understands.
  const total = r.hoursWithout;
  const untouched = (1 - inputs.share) * total;
  const accelerated = ((inputs.share / inputs.speed) * total);
  const checking = inputs.hours - untouched - accelerated;

  const BRASS = 'var(--color-brass)';
  const SLATE = 'var(--color-slate)';
  const ALERT = 'var(--color-alert)';

  return (
    <div className="border-rule bg-panel mt-7 border p-5">
      <Row
        title={d.without}
        hours={f.hours(total)}
        scale={total}
        segments={[
          { key: 'a', width: inputs.share * total, color: BRASS, label: d.segments.reachable },
          { key: 'u', width: untouched, color: SLATE, label: d.segments.untouched },
        ]}
      />

      <Row
        title={d.withAi}
        hours={f.hours(inputs.hours)}
        scale={total}
        segments={[
          { key: 'a', width: accelerated, color: BRASS, label: d.segments.accelerated },
          { key: 'u', width: untouched, color: SLATE, label: d.segments.untouched },
          { key: 'c', width: Math.max(0, checking), color: ALERT, label: d.segments.checking },
        ]}
      />

      <Row
        title={d.infinite}
        hours={f.hours(untouched)}
        scale={total}
        segments={[{ key: 'u', width: untouched, color: SLATE, label: d.segments.untouched }]}
        note={d.infiniteNote(f.times(r.ceiling))}
      />

      <div className="border-rule text-muted mt-4 flex flex-wrap gap-x-5 gap-y-1.5 border-t pt-3 text-[12.5px]">
        {[
          { c: BRASS, l: d.segments.reachable },
          { c: SLATE, l: d.segments.untouched },
          { c: ALERT, l: d.segments.checking },
        ].map((i) => (
          <span key={i.l} className="flex items-center gap-2">
            <i className="inline-block h-2.5 w-2.5 shrink-0" style={{ background: i.c }} />
            {i.l}
          </span>
        ))}
      </div>
    </div>
  );
}
