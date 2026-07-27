import { useEffect, useRef, useState } from 'react';
import { useCopy } from '../content';
import { BOUNDS, ceiling, gain, relativeTime } from '../lib/model';

const W = 640;
const H = 300;
/** Screen inset, so a trace never runs into the bezel. */
const PAD = 10;

/** Horizontal divisions, one per unit of speed-up: 1×/div, like a real scope. */
const DIV_X = 7;
const DIV_Y = 8;

const SPEED_MAX = BOUNDS.speed.max;

/**
 * Text inside a viewBox scales with the box, so a 10px label becomes 5px on a
 * narrow phone. Font sizes are therefore divided by how much the box has been
 * shrunk, which keeps them at a constant apparent size down to the narrowest
 * layout the page supports. Capped, or the labels would swamp a small screen
 * instead of merely being readable on it.
 */
function useShrink(): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement>(null);
  const [shrink, setShrink] = useState(1);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      if (width > 0) setShrink(Math.min(2.2, Math.max(1, W / width)));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, shrink];
}

/**
 * The gain curve, drawn as a scope trace.
 *
 * Everything lives inside the screen — graticule, axis values, readouts — the
 * way an instrument overlays its own annotations. Nothing sits in a margin, so
 * nothing can be clipped when the screen is narrow.
 *
 * Two traces and a limit line: the theoretical Amdahl curve on channel 2, the
 * same curve with review deducted on channel 1, and the ceiling as a dashed
 * marker. The point the whole page exists to make is visible in the gap between
 * the bright trace and the dashed line, and in the fact that pushing the speed
 * slider moves the trace along a curve that is already flattening.
 */
export function Oscilloscope({
  share,
  speed,
  review,
}: {
  share: number;
  speed: number;
  review: number;
}) {
  const copy = useCopy();
  const f = copy.format;
  const [ref, shrink] = useShrink();

  const cap = ceiling(share);
  // Headroom above the ceiling, so the limit line and its label are never
  // pressed against the top of the screen.
  const yMax = Math.min(9, Math.max(2, cap * 1.2));

  const x = (v: number) => PAD + ((v - 1) / (SPEED_MAX - 1)) * (W - 2 * PAD);
  const y = (v: number) => H - PAD - ((Math.min(v, yMax) - 1) / (yMax - 1)) * (H - 2 * PAD);

  const curve = (withReview: boolean) => {
    const points: string[] = [];
    for (let i = 0; i <= 160; i++) {
      const at = 1 + (i / 160) * (SPEED_MAX - 1);
      const value = withReview ? gain(share, at, review) : 1 / relativeTime(share, at);
      points.push(`${i ? 'L' : 'M'}${x(at).toFixed(1)} ${y(value).toFixed(1)}`);
    }
    return points.join(' ');
  };

  const label = 10 * shrink;
  const readout = 11 * shrink;

  const perDivY = (yMax - 1) / DIV_Y;
  const beamAt = Math.min(speed, SPEED_MAX);
  const beamValue = gain(share, beamAt, review);

  return (
    <div ref={ref} className="crt mt-7">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-labelledby="scope-title"
        className="relative block h-auto w-full"
      >
        <title id="scope-title">{copy.scope.title}</title>

        <defs>
          <filter id="bloom" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="bloom-soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Graticule: dotted division lines, solid centre axes with fine ticks. */}
        <g stroke="var(--color-graticule)" fill="none">
          {Array.from({ length: DIV_X + 1 }, (_, i) => PAD + (i / DIV_X) * (W - 2 * PAD)).map(
            (px, i) => (
              <line
                key={`v${i}`}
                x1={px}
                y1={PAD}
                x2={px}
                y2={H - PAD}
                strokeDasharray="1 5"
                strokeOpacity={0.85}
              />
            ),
          )}
          {Array.from({ length: DIV_Y + 1 }, (_, i) => PAD + (i / DIV_Y) * (H - 2 * PAD)).map(
            (py, i) => (
              <line
                key={`h${i}`}
                x1={PAD}
                y1={py}
                x2={W - PAD}
                y2={py}
                strokeDasharray="1 5"
                strokeOpacity={0.85}
              />
            ),
          )}

          <rect x={PAD} y={PAD} width={W - 2 * PAD} height={H - 2 * PAD} strokeOpacity={0.9} />

          {/* Centre cross, with the fine graduations a graticule carries. */}
          <line x1={W / 2} y1={PAD} x2={W / 2} y2={H - PAD} strokeOpacity={0.65} />
          <line x1={PAD} y1={H / 2} x2={W - PAD} y2={H / 2} strokeOpacity={0.65} />
          {Array.from({ length: DIV_X * 5 + 1 }, (_, i) => PAD + (i / (DIV_X * 5)) * (W - 2 * PAD)).map(
            (px, i) => (
              <line key={`tx${i}`} x1={px} y1={H / 2 - 3} x2={px} y2={H / 2 + 3} strokeOpacity={0.55} />
            ),
          )}
          {Array.from({ length: DIV_Y * 5 + 1 }, (_, i) => PAD + (i / (DIV_Y * 5)) * (H - 2 * PAD)).map(
            (py, i) => (
              <line key={`ty${i}`} x1={W / 2 - 3} y1={py} x2={W / 2 + 3} y2={py} strokeOpacity={0.55} />
            ),
          )}
        </g>

        {/* Axis values, overlaid inside the screen. */}
        <g fontFamily="var(--font-mono)" fill="var(--color-phosphor)" fillOpacity={0.5}>
          {Array.from({ length: DIV_Y + 1 }, (_, i) => ({ v: 1 + i * perDivY, i }))
            // The bottom two divisions and the top one are skipped: a label
            // there lands on the speed axis, or runs into the bezel.
            .filter(({ i }) => i >= 2 && i < DIV_Y && i % 2 === 0)
            .map(({ v }) => (
              <text key={`yl${v}`} x={PAD + 5} y={y(v) - 4} fontSize={label}>
                {v.toFixed(1)}×
              </text>
            ))}
          {Array.from({ length: SPEED_MAX }, (_, i) => i + 1).map((v) => (
            <text
              key={`xl${v}`}
              x={x(v)}
              y={H - PAD - 5}
              fontSize={label}
              textAnchor={v === 1 ? 'start' : v === SPEED_MAX ? 'end' : 'middle'}
            >
              {v}×
            </text>
          ))}
        </g>

        {/* Ceiling: the limit the bright trace cannot cross. */}
        <line
          x1={PAD}
          y1={y(cap)}
          x2={W - PAD}
          y2={y(cap)}
          stroke="var(--color-trace-c)"
          strokeWidth={2.2}
          strokeDasharray="8 5"
          filter="url(#bloom)"
        />
        {/* Normally above its line. When the ceiling sits high enough that the
            label would be cut off by the bezel, it drops below it instead. */}
        <text
          x={W - PAD - 6}
          y={y(cap) - 7 < PAD + readout ? y(cap) + readout + 5 : y(cap) - 7}
          textAnchor="end"
          fontFamily="var(--font-mono)"
          fontSize={readout}
          fill="var(--color-trace-c)"
        >
          CEILING {f.times(cap)}
        </text>

        {/* CH2: Amdahl with no review. CH1: what you actually get. */}
        <path
          d={curve(false)}
          fill="none"
          stroke="var(--color-trace-b)"
          strokeWidth={1.8}
          strokeOpacity={0.85}
          filter="url(#bloom-soft)"
        />
        <path
          d={curve(true)}
          fill="none"
          stroke="var(--color-phosphor)"
          strokeWidth={2.4}
          filter="url(#bloom)"
        />

        {/* The beam, parked where the speed slider is set. */}
        <g filter="url(#bloom)">
          <circle cx={x(beamAt)} cy={y(beamValue)} r={4.5} fill="var(--color-beam)" />
          <line
            x1={x(beamAt)}
            y1={y(beamValue)}
            x2={x(beamAt)}
            y2={H - PAD}
            stroke="var(--color-beam)"
            strokeWidth={1}
            strokeOpacity={0.35}
            strokeDasharray="2 4"
          />
        </g>

        {/* Corner readouts, in the order a scope prints them. */}
        <g fontFamily="var(--font-mono)" fontSize={readout}>
          <text x={PAD + 6} y={PAD + readout + 2} fill="var(--color-phosphor)">
            CH1 {f.times(beamValue)}
          </text>
          <text x={W - PAD - 6} y={PAD + readout + 2} textAnchor="end" fill="var(--color-trace-b)">
            CH2 {f.times(1 / relativeTime(share, beamAt))}
          </text>
          {/* The trace climbs from bottom-left to top-right, so the two empty
              corners are top-left and bottom-right. The scale readouts go
              there rather than under the curve. */}
          <text
            x={PAD + 6}
            y={PAD + readout * 2 + 8}
            fill="var(--color-phosphor)"
            fillOpacity={0.55}
          >
            V {perDivY.toFixed(2)}×/DIV
          </text>
          <text
            x={W - PAD - 6}
            y={H - PAD - readout - 8}
            textAnchor="end"
            fill="var(--color-phosphor)"
            fillOpacity={0.55}
          >
            H 1.0×/DIV
          </text>
        </g>
      </svg>

      {/* The refresh sweep. Decorative, and removed outright under reduced
          motion rather than merely slowed. */}
      <div
        aria-hidden="true"
        className="sweep pointer-events-none absolute inset-y-0 left-0 w-[14%]"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgb(88 224 140 / 0.045) 60%, rgb(155 240 184 / 0.09))',
        }}
      />
    </div>
  );
}

/** Channel key, matching the traces above. */
export function ScopeLegend({ share, speed, review }: { share: number; speed: number; review: number }) {
  const copy = useCopy();
  const f = copy.format;
  const items = [
    { key: 'CH1', color: 'var(--color-phosphor)', label: copy.scope.ch1, value: f.times(gain(share, speed, review)) },
    { key: 'CH2', color: 'var(--color-trace-b)', label: copy.scope.ch2, value: f.times(1 / relativeTime(share, speed)) },
    { key: 'LIM', color: 'var(--color-trace-c)', label: copy.scope.limit, value: f.times(ceiling(share)) },
  ];

  return (
    <div className="border-rule text-muted grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-x-5 gap-y-1.5 border-x border-b px-3 py-2.5 text-[12.5px]">
      {items.map((i) => (
        <span key={i.key} className="flex items-center gap-2">
          <i className="inline-block h-0.5 w-4 shrink-0" style={{ background: i.color }} />
          <span className="font-mono shrink-0 text-[10.5px] tracking-[0.1em]">{i.key}</span>
          <span>{i.label}</span>
          <span className="font-mono tabular text-ink ml-auto shrink-0">{i.value}</span>
        </span>
      ))}
    </div>
  );
}
