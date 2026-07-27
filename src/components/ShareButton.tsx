import { useEffect, useState } from 'react';
import { useCopy } from '../content';

/**
 * Copies the current setting as a link.
 *
 * There is no storage anywhere in this project, so the URL is the only way a
 * setting survives being closed — which makes this button the save button, not
 * a social affordance.
 */
export function ShareButton({ link }: { link: string }) {
  const copy = useCopy();
  const [copied, setCopied] = useState(false);

  // The confirmation has to clear itself, and must not fire after the button
  // has gone.
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2200);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard
          ?.writeText(link)
          .then(() => setCopied(true))
          // A denied clipboard is not worth an alert; the address bar already
          // carries the same state.
          .catch(() => setCopied(false));
      }}
      className="font-mono border-rule bg-panel text-muted hover:text-ink cursor-pointer border px-3.5 py-1.5 text-[11.5px] tracking-[0.08em] uppercase transition"
    >
      {copied ? copy.simulator.share.done : copy.simulator.share.idle}
    </button>
  );
}
