import { useId, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useCopy } from '../content';

/** Height of the fader slot, and of the cap that slides in it, in pixels. */
const TRACK = 186;
const CAP = 16;
/** The distance the cap can actually travel. */
const RUN = TRACK - CAP;

export type Channel = {
  /** Short name printed on the console, under the fader. */
  name: string;
  /** The full question the fader answers, for the legend under the console. */
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  step: number;
  /** Where a double-click sends the fader back to. */
  fallback: number;
  onChange: (v: number) => void;
  render: (v: number) => string;
};

/**
 * One channel of the console.
 *
 * The cap tracks the pointer absolutely rather than by accumulated deltas: on a
 * mixing desk the cap is under your finger, and anything else feels like the
 * fader is arguing with you. Grabbing the cap keeps the offset where you took
 * hold of it, so it does not jump; grabbing the slot anywhere else throws the
 * cap to that point, which is what a click on an empty slot should obviously do.
 *
 * It is a `role="slider"`, not a native range input, so the keyboard contract is
 * implemented by hand: arrows step, Page steps by ten, Home and End reach the
 * stops. A fader that cannot be driven from the keyboard is a bug, not a style.
 */
export function Fader({
  channel,
  onActive,
}: {
  channel: Channel;
  /** Reports which channel the reader is touching, so the legend can follow. */
  onActive?: (name: string | null) => void;
}) {
  const { name, label, value, min, max, step, fallback, onChange, render } = channel;
  const labelId = useId();
  const slot = useRef<HTMLDivElement>(null);
  /** Where inside the cap it was grabbed, so it does not snap to the pointer. */
  const grab = useRef(0);
  const [riding, setRiding] = useState(false);

  const span = max - min;
  const ratio = span > 0 ? (value - min) / span : 0;

  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  /** Lands on an exact step, and drops the float dust that division leaves. */
  const quantise = (v: number) => {
    const steps = Math.round((clamp(v) - min) / step);
    return Math.round((min + steps * step) * 1e6) / 1e6;
  };

  const nudge = (steps: number) => onChange(quantise(value + steps * step));

  /** Value under a viewport y coordinate, with the cap's centre as the datum. */
  function valueAt(clientY: number): number {
    const rect = slot.current?.getBoundingClientRect();
    if (!rect) return value;
    const travelled = clientY - rect.top - CAP / 2;
    return quantise(min + (1 - Math.min(1, Math.max(0, travelled / RUN))) * span);
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    // Anything that is not the primary button is left alone, so a right-click
    // opens a menu instead of grabbing the fader and holding it.
    if (e.button !== 0) return;
    const rect = slot.current?.getBoundingClientRect();
    if (rect) {
      const capCentre = rect.top + CAP / 2 + (1 - ratio) * RUN;
      const onCap = Math.abs(e.clientY - capCentre) <= CAP;
      grab.current = onCap ? e.clientY - capCentre : 0;
      if (!onCap) onChange(valueAt(e.clientY));
    }
    setRiding(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.focus();
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!riding) return;
    onChange(valueAt(e.clientY - grab.current));
  }

  function release(e: ReactPointerEvent<HTMLDivElement>) {
    setRiding(false);
    grab.current = 0;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <output className="lcd tabular font-mono w-full px-1 py-1 text-center text-[13px] font-medium">
        {render(value)}
      </output>

      <div
        role="slider"
        tabIndex={0}
        aria-labelledby={labelId}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={render(value)}
        aria-orientation="vertical"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={release}
        onPointerCancel={release}
        onDoubleClick={() => onChange(fallback)}
        onPointerEnter={() => onActive?.(name)}
        onPointerLeave={() => !riding && onActive?.(null)}
        onFocus={() => onActive?.(name)}
        onBlur={() => onActive?.(null)}
        onKeyDown={(e) => {
          const key = e.key;
          if (key === 'ArrowUp' || key === 'ArrowRight') nudge(1);
          else if (key === 'ArrowDown' || key === 'ArrowLeft') nudge(-1);
          else if (key === 'PageUp') nudge(10);
          else if (key === 'PageDown') nudge(-10);
          else if (key === 'Home') onChange(min);
          else if (key === 'End') onChange(max);
          else return;
          e.preventDefault();
        }}
        // Without `touch-none` a drag on a touch screen scrolls the page
        // instead of riding the fader.
        className={`relative touch-none px-3 select-none ${riding ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ height: TRACK }}
      >
        <div ref={slot} className="relative h-full">
          {/* Gain marks, every quarter of the travel. */}
          {[0, 0.25, 0.5, 0.75, 1].map((at) => (
            <span
              key={at}
              aria-hidden="true"
              className="bg-rule absolute left-1/2 h-px w-5 -translate-x-1/2"
              style={{ top: CAP / 2 + (1 - at) * RUN }}
            />
          ))}

          {/* The slot itself: recessed, dark, with the travelled part lit. */}
          <div
            aria-hidden="true"
            className="absolute left-1/2 w-[7px] -translate-x-1/2"
            style={{
              top: CAP / 2,
              height: RUN,
              background: 'var(--color-crt)',
              border: '1px solid var(--color-crt-edge)',
            }}
          >
            <div
              className="bar-fill absolute right-0 bottom-0 left-0"
              style={{
                height: `${ratio * 100}%`,
                background: 'var(--color-brass)',
                boxShadow: riding ? '0 0 8px var(--color-brass)' : undefined,
              }}
            />
          </div>

          {/* The cap. A wide slab with a scribe line across it, as on a desk. */}
          <div
            aria-hidden="true"
            className="absolute left-1/2 flex w-8 -translate-x-1/2 items-center justify-center"
            style={{
              top: (1 - ratio) * RUN,
              height: CAP,
              background: 'var(--color-panel)',
              border: `1px solid ${riding ? 'var(--color-brass)' : 'var(--color-muted)'}`,
              boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.12)',
            }}
          >
            <span className="bg-brass block h-px w-full" />
          </div>
        </div>
      </div>

      <span
        id={labelId}
        className="font-sans text-muted text-center text-[10.5px] leading-tight font-semibold tracking-[0.08em] uppercase"
      >
        {name}
      </span>
      <span className="sr-only">{label}</span>
    </div>
  );
}

/**
 * The console: the channels side by side, then a legend saying what each one
 * actually asks. The short names on the desk keep the strip readable; the
 * legend is where the meaning lives, so nothing is hidden behind a hover.
 */
export function Console({ channels }: { channels: readonly Channel[] }) {
  const copy = useCopy();
  const [active, setActive] = useState<string | null>(null);

  return (
    <>
      {/* Fixed-width strips rather than a five-column grid, so a desk with one
          channel on it looks like a desk with one channel on it, and a narrow
          screen wraps instead of crushing them. */}
      <div className="bg-panel border-rule flex flex-wrap justify-center gap-x-3 gap-y-6 border px-4 py-6">
        {channels.map((c) => (
          <div key={c.name} className="w-[96px] shrink-0 max-sm:w-[86px]">
            <Fader channel={c} onActive={setActive} />
          </div>
        ))}
      </div>

      <p className="caption mt-2.5">{copy.console.howTo}</p>

      {/*
       * The legend, in one column and in desk order, so reading down it walks
       * left to right across the console. A two-column grid broke that
       * correspondence and left ragged gaps between entries of unequal length.
       *
       * The row for the channel under the pointer or the focus ring lights up,
       * which is what actually ties a strip of anonymous hardware to the
       * question it is asking.
       */}
      <dl className="border-rule mt-7 border-t">
        {channels.map((c) => {
          const lit = c.name === active;
          return (
            <div
              key={c.name}
              className={`border-rule grid grid-cols-[104px_1fr] gap-x-5 border-b border-l-[3px] py-3 pr-3 pl-2.5 transition-colors max-sm:grid-cols-1 max-sm:gap-y-1 ${
                lit ? 'border-l-brass bg-panel' : 'border-l-transparent'
              }`}
            >
              <dt
                className={`font-sans pt-0.5 text-[11px] font-semibold tracking-[0.08em] uppercase ${
                  lit ? 'text-brass' : 'text-muted'
                }`}
              >
                {c.name}
              </dt>
              <dd>
                <p className="text-[17px] leading-snug font-semibold">{c.label}</p>
                <p className="caption mt-1">{c.hint}</p>
              </dd>
            </div>
          );
        })}
      </dl>
    </>
  );
}

/**
 * A single question, asked in the flow of the prose.
 *
 * The walkthrough hands the reader one fader at a time, at the moment the text
 * has just explained what it means — which is the whole reason the console is
 * not the first thing anybody sees. Same control, same keyboard contract; only
 * the framing differs.
 */
export function Ask({ channel, children }: { channel: Channel; children?: React.ReactNode }) {
  const copy = useCopy();
  return (
    <div className="bg-panel border-brass my-7 border border-l-[3px] px-5 py-5">
      <p className="kicker mb-3">{copy.console.yourTurn}</p>
      <div className="flex items-start gap-6 max-sm:gap-4">
        <div className="w-[92px] shrink-0">
          <Fader channel={channel} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[19px] leading-snug font-semibold">{channel.label}</p>
          <p className="caption mt-2">{channel.hint}</p>
          {children && <div className="caption mt-3">{children}</div>}
        </div>
      </div>
    </div>
  );
}

/** A live figure quoted inside a sentence, so the prose moves with the faders. */
export function Live({ children }: { children: React.ReactNode }) {
  return (
    <strong className="font-mono tabular text-brass text-[0.95em] font-medium">{children}</strong>
  );
}

type SegmentedProps<T extends string> = {
  ariaLabel: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (v: T) => void;
};

export function Segmented<T extends string>({
  ariaLabel,
  value,
  options,
  onChange,
}: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={[
              'font-sans cursor-pointer border px-3.5 py-1.5 text-[12px] font-semibold tracking-[0.08em] uppercase transition',
              active
                ? 'border-brass bg-brass text-paper'
                : 'border-rule bg-panel text-muted hover:text-ink',
            ].join(' ')}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
