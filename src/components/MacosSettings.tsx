import { useState } from 'react';
import { Note, Path, SectionHead, SubHead } from './Cards';
import { Battery } from './Battery';
import { Segmented } from './Fields';
import { useCopy } from '../content';
import { breakEvenDensity, simulate, type Inputs } from '../lib/model';
import {
  DEFAULT_REGIME,
  REGIMES,
  ROWS,
  distractionBudget,
  regime,
  threshold,
  type RegimeKey,
} from '../lib/regimes';

/**
 * The practical tab.
 *
 * Its argument, and the reason it opens on the reader's own drain: of the five
 * settings the instrument takes, four belong to somebody else. Only drain is
 * moved by how you arrange your own day, which is what everything below is for.
 *
 * All wording comes from `src/content/`, including the table — the rows carry
 * only their thresholds and mechanism here.
 */
export function MacosSettings({ inputs }: { inputs: Inputs }) {
  const copy = useCopy();
  const m = copy.macos;
  const f = copy.format;
  const [key, setKey] = useState<RegimeKey>(DEFAULT_REGIME);
  const [onlyLimited, setOnlyLimited] = useState(false);

  const current = regime(key);
  const r = simulate(inputs);
  const breakEven = breakEvenDensity(inputs.share, inputs.speed, inputs.review);
  const below = inputs.density < breakEven;
  const rows = ROWS.map((row) => ({ row, limit: threshold(row, current) })).filter(
    ({ limit }) => !onlyLimited || limit > 0,
  );

  const options = REGIMES.map((g) => ({ value: g.key, label: m.regimes[g.key].label }));

  return (
    <>
      <section className="mt-11">
        <SectionHead designator={m.designator} title={m.title} sub={m.sub} />

        {m.lead}

        <div className="border-brass bg-panel mb-8 border border-l-[3px] px-5 py-4">
          <p className="kicker mb-2">{m.whereYouAre.kicker}</p>
          <p className="text-[17px] leading-relaxed">
            {m.whereYouAre.sentence({
              density: f.index(inputs.density),
              breakEven: f.index(breakEven),
              gap: f.index(Math.abs(breakEven - inputs.density)),
              below,
              loadWith: f.units(r.loadWith),
              loadWithout: f.units(r.loadWithout),
            })}
          </p>
        </div>

        {m.ambition}

        <Note>{m.principle}</Note>

        <div className="mt-12">
          {copy.battery.lead}
          <Battery inputs={inputs} />

          <div className="mt-8">
            <SubHead title={copy.battery.health.title} />
            {copy.battery.health.body}
          </div>

          <div className="mt-8">
            <SubHead title={copy.battery.build.title} />
            {copy.battery.build.body}
            <ul className="mb-3.5 list-disc pl-5 [&>li]:mb-1.5">
              {copy.battery.build.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>

          <p className="caption mt-4 max-w-[66ch]">{copy.battery.honest}</p>
        </div>

        <div className="mt-10">
          <SubHead title={m.measure.title} sub={m.measure.sub} />
          <Path>{m.measure.path}</Path>
          {m.measure.body}
        </div>

        <div className="mt-10">
          <SubHead title={m.schedule.title} sub={m.schedule.sub} />

          <Segmented ariaLabel={m.schedule.title} value={key} options={options} onChange={setKey} />
          <p className="text-muted mt-2.5 max-w-[60ch] text-sm">{m.regimes[key].note}</p>

          <label className="text-muted mt-3 flex items-center gap-2 text-[13.5px]">
            <input
              type="checkbox"
              className="accent-brass h-4 w-4"
              checked={onlyLimited}
              onChange={(e) => setOnlyLimited(e.target.checked)}
            />
            {m.schedule.hideUnlimited}
          </label>

          <table className="mt-4 w-full table-fixed border-collapse text-sm">
            <thead>
              <tr>
                <th className="font-sans text-muted border-rule w-[47%] border-b pr-2 pb-2 text-left text-[11px] font-semibold tracking-[0.1em] uppercase">
                  {m.schedule.columns.app}
                </th>
                <th className="font-sans text-muted border-rule w-[28%] border-b pr-2 pb-2 text-left text-[11px] font-semibold tracking-[0.1em] uppercase max-sm:hidden">
                  {m.schedule.columns.mechanism}
                </th>
                <th className="font-sans text-muted border-rule w-[25%] border-b pb-2 text-right text-[11px] font-semibold tracking-[0.1em] uppercase">
                  {m.schedule.columns.threshold}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ row, limit }) => (
                <tr key={row.id} className={limit === 0 ? 'text-muted' : undefined}>
                  <td className="border-rule border-b py-2.5 pr-2 align-top">
                    <span
                      className={`font-medium ${
                        limit > 0 && row.group === 'stop' ? 'text-alert' : ''
                      }`}
                    >
                      {m.rows[row.id].name}
                    </span>
                    <span className="caption mt-0.5 block">{m.rows[row.id].why}</span>
                  </td>
                  <td className="border-rule border-b py-2.5 pr-2 align-top max-sm:hidden">
                    <span
                      className={[
                        'font-mono inline-block border px-1.5 py-0.5 text-[10.5px] tracking-[0.06em] whitespace-nowrap',
                        limit === 0
                          ? 'border-rule text-muted'
                          : row.group === 'stop'
                            ? 'border-alert text-alert'
                            : 'border-brass text-brass',
                      ].join(' ')}
                    >
                      {m.mechanisms[row.mechanism]}
                    </span>
                  </td>
                  <td className="font-mono border-rule border-b py-2.5 text-right align-top text-sm whitespace-nowrap">
                    {limit > 0 ? f.duration(limit) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-3.5 flex items-baseline justify-between text-sm">
            <span>{m.schedule.budget}</span>
            <span className="font-mono tabular text-2xl font-semibold">
              {f.duration(distractionBudget(current))}
            </span>
          </div>
          <p className="text-muted mt-1.5 max-w-[60ch] text-sm">{m.schedule.budgetNote}</p>

          <Note tone="alert" className="mt-6">
            {m.schedule.safari}
          </Note>
        </div>

        <div className="mt-10">
          <SubHead title={m.downtime.title} sub={m.downtime.sub} />
          <Path>{m.downtime.path}</Path>
          <ul className="mb-3.5 list-disc pl-5 [&>li]:mb-1.5">
            {m.downtime.bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>

        <div className="mt-10">
          <SubHead title={m.appLimits.title} />
          <Path>{m.appLimits.path}</Path>
          {m.appLimits.body}
        </div>

        <div className="mt-10">
          <SubHead title={m.focus.title} sub={m.focus.sub} />
          <Path>{m.focus.path}</Path>

          <h3 className="mt-6 mb-0.5 text-[18px] font-bold">{m.focus.deepWork.title}</h3>
          <ul className="mb-3.5 list-disc pl-5 [&>li]:mb-1.5">
            {m.focus.deepWork.bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>

          <h3 className="mt-6 mb-0.5 text-[18px] font-bold">{m.focus.calls.title}</h3>
          {m.focus.calls.body}

          <h3 className="mt-6 mb-0.5 text-[18px] font-bold">{m.focus.reading.title}</h3>
          {m.focus.reading.body}
        </div>

        <div className="mt-10">
          <SubHead title={m.breaks.title} sub={m.breaks.sub} />
          <ul className="mb-3.5 list-disc pl-5 [&>li]:mb-1.5">
            {m.breaks.bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>

        <div className="mt-10">
          <SubHead title={m.teeth.title} />
          <Path>{m.teeth.path}</Path>
          {m.teeth.body}
          <Note tone="alert" className="mt-6">
            {m.teeth.warning}
          </Note>
        </div>
      </section>

      <p className="caption border-rule mt-14 max-w-[68ch] border-t pt-5">{m.footnote}</p>
    </>
  );
}
