import { useCopy } from '../content';
import { WEEK_DAYS, quota, battery, type Inputs } from '../lib/model';

/**
 * The week drawn as a ration, next to the day drawn as a battery.
 *
 * The bar is scaled to whichever is larger, the ration or the draw, so an
 * overrun is visible rather than clamped away — the same choice the battery
 * makes about running past empty. The brass line is where the week was meant to
 * stop; the ticks are the days, so you can see the ration being spent a day at
 * a time rather than as one undifferentiated total.
 */
export function Quota({ inputs }: { inputs: Inputs }) {
  const copy = useCopy();
  const q = copy.quota;
  const f = copy.format;
  const state = quota(inputs);
  const daily = battery(inputs).capacityHours;

  const scale = Math.max(state.weekly, state.drawn) * 1.06;
  const pct = (v: number) => `${Math.max(0, Math.min(100, (v / scale) * 100))}%`;

  const over = state.drawn > state.weekly;
  /** Room to the right of the ration line for its label, in fractions of the bar. */
  const markerLeft = state.weekly / scale < 0.6;
  /** Four days at this pace can spend the week on their own. */
  const spent = state.burst <= 0;
  const banked = state.burst > daily;

  return (
    <div className="border-rule bg-panel mt-6 border p-5">
      <p className="kicker mb-4">{q.kicker}</p>

      <div aria-hidden="true" className="relative h-11 border-2" style={{ borderColor: 'var(--color-muted)' }}>
        {/* The ration, and the part of it spent past the line. */}
        <div
          className="bar-fill absolute inset-y-0 left-0"
          style={{
            width: pct(Math.min(state.drawn, state.weekly)),
            background: 'var(--color-phosphor)',
          }}
        />
        {over && (
          <div
            className="bar-fill absolute inset-y-0"
            style={{
              left: pct(state.weekly),
              width: pct(state.drawn - state.weekly),
              background: 'var(--color-alert)',
            }}
          />
        )}

        {/* Day boundaries, at the pace actually being drawn. */}
        {Array.from({ length: WEEK_DAYS - 1 }, (_, i) => (
          <div
            key={i}
            className="absolute inset-y-0 w-px"
            style={{ left: pct(inputs.hours * (i + 1)), background: 'var(--color-panel)', opacity: 0.7 }}
          />
        ))}

        {/* Where the week was meant to stop. */}
        <div
          className="absolute -inset-y-1 w-[2px]"
          style={{ left: pct(state.weekly), background: 'var(--color-brass)' }}
        />
      </div>

      {/* The label hangs off whichever side of the line has room for it. */}
      <div aria-hidden="true" className="relative mt-1.5 h-4">
        <span
          className="font-mono absolute text-[11px] whitespace-nowrap"
          style={{
            left: pct(state.weekly),
            color: 'var(--color-brass)',
            transform: markerLeft ? undefined : 'translateX(-100%)',
            paddingLeft: markerLeft ? 5 : 0,
            paddingRight: markerLeft ? 0 : 5,
          }}
        >
          {q.rationMark}
        </span>
      </div>

      <dl className="border-rule mt-5 grid gap-x-8 gap-y-2 border-t pt-4 text-[14px] sm:grid-cols-2">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">{q.ration}</dt>
          <dd className="font-mono tabular">{f.hours(state.weekly)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">{q.drawn}</dt>
          <dd className="font-mono tabular" style={{ color: over ? 'var(--color-alert)' : undefined }}>
            {f.hours(state.drawn)}
          </dd>
        </div>
      </dl>

      <div className="border-rule mt-4 border-t pt-4">
        <p className="kicker mb-1.5">{q.burstKicker}</p>
        {spent ? (
          <p className="font-mono text-[19px] leading-tight font-semibold" style={{ color: 'var(--color-alert)' }}>
            {q.noBurst}
          </p>
        ) : (
          <>
            <p
              className="font-mono text-[30px] leading-none font-semibold"
              style={{ color: banked ? 'var(--color-phosphor)' : 'var(--color-trace-c)' }}
            >
              {f.hours(state.burst)}
            </p>
            <p className="caption mt-1.5">
              {banked ? q.banked(f.hours(state.burst - daily)) : q.borrowed(f.hours(daily - state.burst))}
            </p>
          </>
        )}
      </div>

      <p className="caption mt-4">{q.caption(String(WEEK_DAYS))}</p>
    </div>
  );
}
