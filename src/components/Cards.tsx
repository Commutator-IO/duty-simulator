import type { ReactNode } from 'react';

export type Metric = {
  key: string;
  label: string;
  value: string;
  note: string;
};

/**
 * The readout row.
 *
 * Each figure sits on its own LCD strip, keyed like a part on a board. A 1px
 * gap over the rule colour draws the grid lines, so the cells need no borders
 * of their own and stay flush at any column count.
 */
export function Metrics({ items, prefix = 'M' }: { items: readonly Metric[]; prefix?: string }) {
  return (
    <div className="bg-rule mt-6 grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-px">
      {items.map((m, i) => (
        // Subgrid, so the three rows line up across the whole strip: a key that
        // wraps to two lines must not push its own LCD below its neighbours'.
        <div
          key={m.key}
          className="bg-panel row-span-3 grid grid-rows-subgrid px-4 py-3.5"
        >
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <span className="font-sans text-muted text-[11px] leading-tight font-semibold tracking-[0.1em] uppercase">
              {m.label}
            </span>
            <span className="font-mono text-muted/60 shrink-0 text-[9.5px] tracking-[0.1em]">
              {prefix}
              {i + 1}
            </span>
          </div>
          <div className="lcd tabular font-mono self-start px-2.5 py-2 text-[26px] leading-none font-medium">
            {m.value}
          </div>
          <div className="caption mt-2">{m.note}</div>
        </div>
      ))}
    </div>
  );
}

/** A bordered aside. `alert` switches the rule to red; nothing else changes. */
export function Note({
  children,
  tone = 'normal',
  className = '',
}: {
  children: ReactNode;
  tone?: 'normal' | 'alert';
  className?: string;
}) {
  return (
    <div
      className={[
        'bg-panel border-rule border border-l-[3px] px-5 py-4 text-[17px] leading-relaxed',
        tone === 'alert' ? 'border-l-alert' : 'border-l-brass',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}

/** A macOS menu path. */
export function Path({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-muted bg-panel border-brass-soft my-2 border-l-2 px-2.5 py-1.5 text-xs break-words">
      {children}
    </p>
  );
}

/**
 * A section heading, carrying a reference designator the way a schematic labels
 * its blocks. The designator is decorative; it is hidden from screen readers so
 * the heading still reads as a plain sentence.
 */
export function SectionHead({
  title,
  sub,
  designator,
}: {
  title: string;
  sub?: string;
  designator?: string;
}) {
  return (
    <>
      {designator && <p className="kicker mb-2">{designator}</p>}
      <h2 className="text-[30px] leading-[1.15] font-bold tracking-[-0.015em] max-sm:text-[26px]">
        {title}
      </h2>
      {sub && <p className="text-muted mt-3 mb-6 max-w-[62ch] text-[18px] leading-relaxed">{sub}</p>}
    </>
  );
}

/** A heading one rung below `SectionHead`, for the steps inside a section. */
export function SubHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <>
      <h3 className="mb-1 text-[21px] leading-snug font-bold tracking-[-0.01em]">{title}</h3>
      {sub && <p className="text-muted mb-3 max-w-[62ch] text-[17px] leading-relaxed">{sub}</p>}
    </>
  );
}
