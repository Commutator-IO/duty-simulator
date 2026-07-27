/**
 * How a figure is written, which is part of the language and not a detail.
 *
 * French puts a comma where English puts a point, and a narrow no-break space
 * before a percent sign where English puts nothing. Getting this wrong produces
 * sentences that mix both conventions in the same breath — "1.7 h de moins, et
 * 21% de charge" — which reads as a machine translation even when every word
 * around it is right.
 *
 * So the formatters are built per language and handed out with the rest of the
 * copy, rather than imported as globals that quietly assume English.
 *
 * One rule holds in both: every negative number uses the typographic minus (−),
 * never the hyphen-minus, because a hyphen inside a figure reads as a dash.
 */

const MINUS = '−';

export type Formats = {
  /** "4.0 h" / "4,0 h" — always one decimal, so a column of them lines up. */
  hours: (v: number) => string;
  /** "1.43×" / "1,43×" — a multiplier, two decimals. */
  times: (v: number) => string;
  /** "3.0×" / "3,0×" — a multiplier being set rather than read off. */
  timesShort: (v: number) => string;
  /** "60%" / "60 %" — takes a fraction. */
  percent: (v: number) => string;
  /** "+21%" / "+21 %" — a rise, taking a fraction. */
  percentSigned: (v: number) => string;
  /** "1.30" / "1,30" — a bare index with no unit. */
  index: (v: number) => string;
  /** "+1.8" / "−0,5" — a signed difference in load units. */
  signed: (v: number) => string;
  /** "5.2" / "5,2" — load units. */
  units: (v: number) => string;
  /** "20 min", "1 h 50 min", "2 h" — a duration in whole minutes. */
  duration: (minutes: number) => string;
};

const fine = (v: number) => (Number.isFinite(v) ? v : 0);

export function makeFormats(locale: string): Formats {
  const decimals = (n: number) =>
    new Intl.NumberFormat(locale, {
      minimumFractionDigits: n,
      maximumFractionDigits: n,
      useGrouping: false,
    });

  const one = decimals(1);
  const two = decimals(2);

  /**
   * French inserts a narrow no-break space before the sign; English inserts
   * nothing. `Intl` knows this, so it is read off a formatted sample rather than
   * hard-coded against a list of locales.
   */
  const percentGap = (() => {
    const sample = new Intl.NumberFormat(locale, { style: 'percent' }).format(0.5);
    const match = sample.match(/(\s*)%/);
    return match ? match[1] : '';
  })();

  const whole = (v: number) => new Intl.NumberFormat(locale, { useGrouping: false }).format(v);

  return {
    hours: (v) => `${one.format(fine(v))} h`,
    times: (v) => `${two.format(fine(v))}×`,
    timesShort: (v) => `${one.format(fine(v))}×`,
    percent: (v) => `${whole(Math.round(fine(v) * 100))}${percentGap}%`,
    percentSigned: (v) =>
      `${fine(v) < 0 ? MINUS : '+'}${whole(Math.round(Math.abs(fine(v)) * 100))}${percentGap}%`,
    index: (v) => two.format(fine(v)),
    signed: (v) => `${fine(v) < 0 ? MINUS : '+'}${one.format(Math.abs(fine(v)))}`,
    units: (v) => one.format(fine(v)),
    duration: (minutes) => {
      const total = Math.max(0, Math.round(fine(minutes)));
      if (total < 60) return `${whole(total)} min`;
      const h = Math.floor(total / 60);
      const rest = total % 60;
      // The minutes are padded so a column of thresholds stays aligned.
      return rest === 0 ? `${whole(h)} h` : `${whole(h)} h ${String(rest).padStart(2, '0')} min`;
    },
  };
}
