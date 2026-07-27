import * as f from './format';
import { loadVerdict, ratchetVerdict, type Inputs, type Result } from './model';

/**
 * The sentences under the two panels.
 *
 * They live here rather than in the components because they are the part of the
 * interface most likely to drift from the arithmetic: a verdict that says the
 * day is lighter while the numbers say heavier is worse than no verdict at all.
 * Keeping them next to a test makes the pairing checkable.
 *
 * Written as a reporter would write them — second person, short sentences, the
 * figure first and the meaning immediately after — because someone who has just
 * moved a fader wants to know what changed, not to parse a clause.
 */

export function loadSentence(result: Result, inputs: Inputs): string {
  switch (loadVerdict(result)) {
    case 'unsustainable':
      return `At this setting there is nothing to compare. Producing the same output without the tool would take ${f.hours(result.hoursWithout)} of dense concentration every day, and that is not a long day — it is a day nobody has. The comparison breaks down before the arithmetic does.`;
    case 'heavier':
      return `You finish earlier, and you pay for it. ${f.hours(inputs.hours)} instead of ${f.hours(result.hoursWithout)} — but ${f.units(result.loadWith)} units of strain against ${f.units(result.loadWithout)}. The hours you saved are real. They only turn into rest if you decide they do.`;
    case 'lighter':
      return `This one is genuinely in your favour: ${f.hours(result.hoursWithout - inputs.hours)} less at the desk, and ${f.units(-result.loadGap)} less strain to go with it. Nothing here needs fixing.`;
  }
}

export function ratchetSentence(result: Result, inputs: Inputs): string {
  const rise = f.percent(result.visibleGain - 1);

  switch (ratchetVerdict(inputs.visible)) {
    case 'withheld':
      return 'You keep almost all of it, and the bar does not move. Worth knowing what that costs, though: when someone is deciding who did what this year, the aim was never to look slow. It was to look reliably good.';
    case 'surrendered':
      return `You ship all of it. The bar goes up ${rise} and stays there, and on the day you sit down to ask for something you have nothing left to trade. The entire gain has gone to your employer, permanently.`;
    case 'partial':
      return `The bar goes up ${rise}, and it will not come back down. What is left to you is ${f.hours(result.marginKept)} in old-money hours — best spent on something that never appears on a dashboard: reliability, a gap in what you know, or rest.`;
  }
}
