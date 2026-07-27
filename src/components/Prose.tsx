import type { ReactNode } from 'react';
import type { Card } from '../lib/foundations';

/**
 * Layout for long-form passages, shared by both languages.
 *
 * The language modules compose their own prose out of these, which keeps the
 * argument readable as an argument in each language while the structure — a
 * step, a cited source, a line of live arithmetic — stays defined in one place.
 */

export function Step({ no, title, children }: { no: string; title: string; children: ReactNode }) {
  return (
    <section className="border-rule mt-12 border-t pt-7">
      <p className="kicker mb-2">{no}</p>
      <h2 className="mb-4 text-[27px] leading-[1.2] font-bold tracking-[-0.015em] max-sm:text-[24px]">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** A finding, cited where the argument uses it, with year, people and portrait. */
export function Source({ card, body }: { card: Card; body: string }) {
  return (
    <aside className="border-rule my-6 flex items-start gap-4 border-y py-4">
      <div className="border-rule bg-panel aspect-[4/5] w-[68px] shrink-0 overflow-hidden border">
        {card.portrait ? (
          <img
            src={card.portrait.src}
            alt={`${card.people.join(', ')}`}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
            style={{ objectPosition: card.portrait.focus ?? '50% 30%' }}
          />
        ) : (
          <div
            aria-hidden="true"
            className="text-muted/45 flex h-full w-full items-center justify-center text-[20px] font-bold"
          >
            {card.people.map((p) => p.split(' ').at(-1)?.[0] ?? '').join('')}
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="kicker">
          {card.year}
          {card.until ? `–${card.until}` : ''} · {card.people.join(' · ')}
        </p>
        <p className="caption mt-1.5">{body}</p>
      </div>
    </aside>
  );
}

/** A line of live arithmetic, restating what the reader has just set. */
export function Tally({ children }: { children: ReactNode }) {
  return (
    <p className="border-brass-soft bg-panel my-6 border-l-2 px-4 py-3 text-[17px] leading-relaxed">
      {children}
    </p>
  );
}

export function Pull({ children }: { children: ReactNode }) {
  return (
    <p className="border-brass my-7 border-l-[3px] pl-5 text-[23px] leading-[1.35] font-semibold tracking-[-0.01em] max-sm:text-[20px]">
      {children}
    </p>
  );
}
