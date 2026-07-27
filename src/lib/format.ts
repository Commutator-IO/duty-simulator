/**
 * Number formatting for the interface.
 *
 * The site is English-only, so there is no locale to thread through: a fixed
 * `en` formatter is enough, and the point of centralising this is consistency
 * rather than translation. One rule worth stating — every negative number on
 * the page uses the typographic minus (−), never the hyphen-minus, because a
 * hyphen inside a figure reads as a dash.
 */

const MINUS = '−';

const fine = (v: number) => (Number.isFinite(v) ? v : 0);

/** "4.0 h" — hours, always one decimal, so a column of them lines up. */
export const hours = (v: number) => `${fine(v).toFixed(1)} h`;

/** "1.43×" — a multiplier, two decimals. */
export const times = (v: number) => `${fine(v).toFixed(2)}×`;

/** "3.0×" — a multiplier the user is setting rather than reading off. */
export const timesShort = (v: number) => `${fine(v).toFixed(1)}×`;

/** "60%" — takes a fraction. No space before the sign, this is English. */
export const percent = (v: number) => `${Math.round(fine(v) * 100)}%`;

/** "+21%" — a rise, taking a fraction. */
export const percentSigned = (v: number) =>
  `${fine(v) < 0 ? MINUS : '+'}${Math.round(Math.abs(fine(v)) * 100)}%`;

/** "1.30" — a bare index with no unit. */
export const index = (v: number) => fine(v).toFixed(2);

/** "+1.8" / "−0.5" — a signed difference in load units. */
export const signed = (v: number) =>
  `${fine(v) < 0 ? MINUS : '+'}${Math.abs(fine(v)).toFixed(1)}`;

/** "5.2" — load units. */
export const units = (v: number) => fine(v).toFixed(1);

/**
 * "20 min", "1 h 50 min", "2 h" — a duration given in whole minutes.
 * The minutes are padded so the column of thresholds stays aligned.
 */
export function duration(minutes: number): string {
  const total = Math.max(0, Math.round(fine(minutes)));
  if (total < 60) return `${total} min`;
  const h = Math.floor(total / 60);
  const rest = total % 60;
  return rest === 0 ? `${h} h` : `${h} h ${String(rest).padStart(2, '0')} min`;
}
