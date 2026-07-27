/**
 * The per-app schedule of the macOS tab — the numbers, not the words.
 *
 * Two groups. `distraction` rows are usage quotas; `stop` rows are signals that
 * end a session. A regime carries one factor for each, which is why Hyperfocus
 * can loosen the quotas and tighten the stops at the same time — under
 * hyperfocus the risk is not three hours on Reddit, it is the eleven-hour
 * session without a drink.
 *
 * The rows with no limit at all are the point of the table, not an omission:
 * a counter on a work tool only teaches you to dismiss alerts, including the
 * ones that matter. Do not add quotas to them; `regimes.test.ts` enforces it.
 *
 * Names and justifications are copy, and live in `src/content/`, keyed by `id`.
 */

export type Group = 'distraction' | 'stop';

/** The macOS feature a row is implemented with. Names live in the copy. */
export type Mechanism =
  | 'none'
  | 'callsFocus'
  | 'notifications'
  | 'focusFilters'
  | 'alwaysAllowed'
  | 'appLimitsUrl'
  | 'appLimitsDowntime'
  | 'downtime'
  | 'stopSignal'
  | 'scheduledFocus'
  | 'shortcuts'
  | 'personalRule';

export type RowId =
  | 'editors'
  | 'calls'
  | 'chat'
  | 'mail'
  | 'messages'
  | 'browsers'
  | 'music'
  | 'social'
  | 'aggregators'
  | 'video'
  | 'news'
  | 'shortform'
  | 'games'
  | 'seated'
  | 'block'
  | 'hydration'
  | 'warning'
  | 'agents';

export type Row = {
  id: RowId;
  mechanism: Mechanism;
  /** Baseline threshold in minutes under the Standard regime; 0 means no limit. */
  base: number;
  group: Group;
};

export const ROWS: readonly Row[] = [
  { id: 'editors', mechanism: 'none', base: 0, group: 'distraction' },
  { id: 'calls', mechanism: 'callsFocus', base: 0, group: 'distraction' },
  { id: 'chat', mechanism: 'notifications', base: 0, group: 'distraction' },
  { id: 'mail', mechanism: 'focusFilters', base: 0, group: 'distraction' },
  { id: 'messages', mechanism: 'alwaysAllowed', base: 0, group: 'distraction' },
  { id: 'browsers', mechanism: 'none', base: 0, group: 'distraction' },
  { id: 'music', mechanism: 'none', base: 0, group: 'distraction' },
  { id: 'social', mechanism: 'appLimitsUrl', base: 20, group: 'distraction' },
  { id: 'aggregators', mechanism: 'appLimitsUrl', base: 15, group: 'distraction' },
  { id: 'video', mechanism: 'appLimitsUrl', base: 20, group: 'distraction' },
  { id: 'news', mechanism: 'appLimitsUrl', base: 15, group: 'distraction' },
  { id: 'shortform', mechanism: 'appLimitsDowntime', base: 10, group: 'distraction' },
  { id: 'games', mechanism: 'downtime', base: 30, group: 'distraction' },
  { id: 'seated', mechanism: 'stopSignal', base: 75, group: 'stop' },
  { id: 'block', mechanism: 'scheduledFocus', base: 120, group: 'stop' },
  { id: 'hydration', mechanism: 'stopSignal', base: 90, group: 'stop' },
  { id: 'warning', mechanism: 'shortcuts', base: 30, group: 'stop' },
  { id: 'agents', mechanism: 'personalRule', base: 0, group: 'stop' },
];

export type RegimeKey = 'relaxed' | 'standard' | 'strict' | 'hyperfocus';

export type Regime = {
  key: RegimeKey;
  /** Multiplier applied to the distraction quotas. */
  distraction: number;
  /** Multiplier applied to the stop signals. Below 1 means sooner, i.e. stricter. */
  stop: number;
};

export const REGIMES: readonly Regime[] = [
  { key: 'relaxed', distraction: 1.6, stop: 1.4 },
  { key: 'standard', distraction: 1, stop: 1 },
  { key: 'strict', distraction: 0.55, stop: 0.8 },
  { key: 'hyperfocus', distraction: 1.2, stop: 0.55 },
];

export const DEFAULT_REGIME: RegimeKey = 'standard';

export function regime(key: RegimeKey): Regime {
  return REGIMES.find((r) => r.key === key) ?? REGIMES[1];
}

/**
 * The threshold a row gets under a regime, in minutes. Rounded to five minutes
 * because Screen Time is set by hand and nobody types 17; floored at five so a
 * strict regime cannot round a real limit down to nothing.
 */
export function threshold(row: Row, r: Regime): number {
  if (row.base === 0) return 0;
  const factor = row.group === 'stop' ? r.stop : r.distraction;
  return Math.max(5, Math.round((row.base * factor) / 5) * 5);
}

/**
 * The daily distraction budget: the sum of the usage quotas only. Stop signals
 * are durations of a different kind — a reminder every 75 minutes is not 75
 * minutes spent — so adding them in would produce a meaningless number.
 */
export function distractionBudget(r: Regime, rows: readonly Row[] = ROWS): number {
  return rows
    .filter((row) => row.group === 'distraction')
    .reduce((total, row) => total + threshold(row, r), 0);
}
