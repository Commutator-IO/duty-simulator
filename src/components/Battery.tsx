import { useCopy } from '../content';
import { SUSTAINABLE_LOAD, battery, type Inputs } from '../lib/model';

/**
 * The day, drawn as the gauge everybody already reads.
 *
 * Nobody needs to be taught what 12% means. That is the whole reason this is a
 * battery and not another bar chart: the reader arrives already fluent, and the
 * four things a laptop does about its own energy — measure, display
 * continuously, warn at thresholds, force a stop — are exactly the four nobody
 * does about their own.
 *
 * It goes past empty rather than clamping. Running on reserve is what people
 * actually do, and a gauge that stopped at zero would be the flattering
 * version of the same number.
 */
export function Battery({ inputs }: { inputs: Inputs }) {
  const copy = useCopy();
  const b = copy.battery;
  const f = copy.format;
  const state = battery(inputs);

  const filled = Math.max(0, Math.min(1, state.charge));
  const flat = state.charge <= 0;
  const low = state.charge < 0.2;

  const colour = flat
    ? 'var(--color-alert)'
    : low
      ? 'var(--color-trace-c)'
      : 'var(--color-phosphor)';

  return (
    <div className="border-rule bg-panel mt-6 border p-5">
      <p className="kicker mb-4">{b.kicker}</p>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        {/* The menu-bar shape, at a size you would actually glance at. */}
        <div aria-hidden="true" className="flex shrink-0 items-center">
          <div
            className="relative border-2 p-[3px]"
            style={{ borderColor: 'var(--color-muted)', width: 96, height: 44 }}
          >
            <div
              className="bar-fill h-full"
              style={{ width: `${filled * 100}%`, background: colour }}
            />
            {flat && (
              <span
                className="font-mono absolute inset-0 flex items-center justify-center text-[13px] font-semibold"
                style={{ color: 'var(--color-alert)' }}
              >
                {b.reserve}
              </span>
            )}
          </div>
          <div
            className="ml-[2px]"
            style={{ width: 5, height: 16, background: 'var(--color-muted)' }}
          />
        </div>

        <div className="min-w-0">
          <p className="font-mono text-[30px] leading-none font-semibold" style={{ color: colour }}>
            {f.percent(Math.max(0, state.charge))}
          </p>
          <p className="caption mt-1.5">
            {flat
              ? b.overBy(f.hours(Math.abs(state.hoursLeft)))
              : b.leftToday(f.hours(state.hoursLeft))}
          </p>
        </div>
      </div>

      <dl className="border-rule mt-5 grid gap-x-8 gap-y-2 border-t pt-4 text-[14px] sm:grid-cols-2">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">{b.capacity}</dt>
          <dd className="font-mono tabular">{f.hours(state.capacityHours)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">{b.drawnToday}</dt>
          <dd className="font-mono tabular">{f.hours(inputs.hours)}</dd>
        </div>
      </dl>

      <p className="caption mt-4">{b.caption(String(SUSTAINABLE_LOAD))}</p>
    </div>
  );
}
