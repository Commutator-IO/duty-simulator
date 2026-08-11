/**
 * Links back to the source repository.
 *
 * A report is only actionable if it carries the exact simulation — a verdict
 * that looks wrong almost always depends on the parameters behind it — hence
 * the prefilled body.
 */

export const REPO = 'https://github.com/Commutator-IO/duty-simulator';

/** The site this one hangs off. */
export const HOME = 'https://www.commutator.io';

export const ISSUES = `${REPO}/issues`;

/**
 * URL of a new issue, prefilled with a template. `shareLink` is the shareable
 * link of the simulation being viewed, so the report reproduces without the
 * reporter having to describe their inputs.
 */
export function newIssueLink(shareLink?: string): string {
  const body = [
    '### What I see',
    '',
    '',
    '',
    '### What I expected',
    '',
    '',
    '',
    ...(shareLink ? ['### Simulation concerned', '', shareLink, ''] : []),
    '### Source',
    '',
    'If an assumption or a formula is at fault, please give the reference',
    'you are relying on.',
  ].join('\n');

  const params = new URLSearchParams({ title: '', body });
  return `${REPO}/issues/new?${params.toString()}`;
}
