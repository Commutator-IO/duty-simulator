import { useEffect, useRef, useState } from 'react';
import { SectionHead } from './Cards';
import { Latex } from './Latex';
import { CARDS, CREDITS, SPAN, type Card } from '../lib/foundations';
import { useCopy } from '../content';

/**
 * The portrait plate.
 *
 * Pictures are hotlinked from Wikimedia Commons and only ever from files whose
 * licence permits reuse — no "fair use" file is acceptable, however easy it
 * would be to point at. Six of these people have no freely-licensed photograph
 * on Wikipedia at all, and rather than leave a hole or invent a likeness the
 * plate falls back to their initials.
 */
function Plate({ card }: { card: Card }) {
  const initials = card.people
    .map((p) => p.split(' ').at(-1)?.[0] ?? '')
    .join('')
    .slice(0, 3);

  return (
    <div className="border-rule bg-panel relative aspect-[4/5] w-full border">
      {card.portrait ? (
        <img
          src={card.portrait.src}
          alt={`Portrait of ${card.people.join(', ')}`}
          loading="lazy"
          referrerPolicy="no-referrer"
          // The source frames are all different — head-and-shoulders, a lectern
          // shot, a scanned engraving — so they are cropped to one shape here
          // rather than being re-cut and re-hosted.
          className="h-full w-full object-cover"
          style={{ objectPosition: card.portrait.focus ?? '50% 30%' }}
        />
      ) : (
        <div
          aria-hidden="true"
          className="text-muted/45 flex h-full w-full items-center justify-center text-[28px] font-bold tracking-tight"
        >
          {initials}
        </div>
      )}
    </div>
  );
}

/**
 * The ruler.
 *
 * Sticks under the tab bar and shows the whole span at once, with a tick per
 * entry. The tick for the entry you are reading is lit, so scrolling the column
 * moves a marker across a century and a half — which is the point being made:
 * none of this started with AI.
 */
function Ruler({ active }: { active: number }) {
  const decades: number[] = [];
  for (let y = Math.floor(SPAN.from / 25) * 25; y <= SPAN.to + 25; y += 25) decades.push(y);
  const first = decades[0];
  const last = decades.at(-1) ?? SPAN.to;
  const at = (year: number) => ((year - first) / (last - first)) * 100;

  return (
    <div className="bg-paper border-rule sticky top-[46px] z-10 border-b py-3">
      <div className="relative h-11">
        <div className="bg-rule absolute top-5 right-0 left-0 h-px" />

        {decades.map((y) => (
          <span
            key={y}
            className="font-sans text-muted/70 absolute top-7 -translate-x-1/2 text-[10px] tracking-[0.06em]"
            style={{ left: `${at(y)}%` }}
          >
            {y}
          </span>
        ))}

        {CARDS.map((c) => {
          const lit = c.year === active;
          return (
            <span
              key={c.id}
              className="absolute -translate-x-1/2 transition-all"
              style={{
                left: `${at(c.year)}%`,
                top: lit ? 12 : 16,
                width: lit ? 9 : 5,
                height: lit ? 9 : 5,
                background: lit ? 'var(--color-brass)' : 'var(--color-rule)',
              }}
            />
          );
        })}

        <span
          aria-hidden="true"
          className="font-sans text-brass absolute top-0 -translate-x-1/2 text-[11px] font-semibold transition-all"
          style={{ left: `${at(active)}%` }}
        >
          {active}
        </span>
      </div>
    </div>
  );
}

export function Foundations() {
  const copy = useCopy();
  const r = copy.research;
  const [active, setActive] = useState(CARDS[0].year);
  const items = useRef<(HTMLElement | null)[]>([]);

  /**
   * The entry nearest the top third of the viewport is the one being read.
   * `rootMargin` shrinks the observation band to that stripe, so the ruler
   * changes when a new card actually arrives rather than when its last line
   * leaves.
   */
  useEffect(() => {
    const nodes = items.current.filter((n): n is HTMLElement => n !== null);
    if (nodes.length === 0 || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const seen = entries.filter((e) => e.isIntersecting);
        if (seen.length === 0) return;
        const year = seen[0].target.getAttribute('data-year');
        if (year) setActive(Number(year));
      },
      { rootMargin: '-25% 0px -60% 0px', threshold: 0 },
    );

    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <section className="mt-11">
        <SectionHead designator={r.designator} title={r.title} sub={r.sub(CARDS.length, SPAN.from, SPAN.to)} />
      </section>

      <Ruler active={active} />

      <div className="mt-2">
        {CARDS.map((card, i) => (
          <article
            key={card.id}
            data-year={card.year}
            ref={(el) => {
              items.current[i] = el;
            }}
            className="border-rule grid grid-cols-[112px_1fr] gap-x-7 border-t py-8 max-sm:grid-cols-1 max-sm:gap-y-4"
          >
            <div className="max-sm:flex max-sm:items-start max-sm:gap-4">
              <div className="max-sm:w-[92px] max-sm:shrink-0">
                <Plate card={card} />
              </div>
              <div className="mt-2">
                <p className="text-[26px] leading-none font-bold tracking-tight">{card.year}</p>
                {card.until && <p className="caption">{r.to} {card.until}</p>}
                <p className="caption mt-1.5">{card.people.join(' · ')}</p>
                {card.implemented && (
                  <p className="font-sans text-brass mt-2 text-[10px] font-semibold tracking-[0.1em] uppercase">
                    {r.inInstrument}
                  </p>
                )}
              </div>
            </div>

            <div className="max-w-[62ch]">
              <h3 className="mb-3 text-[23px] leading-snug font-bold tracking-[-0.01em]">
                {r.cards[card.id].title}
              </h3>
              {card.tex && (
                <p className="bg-panel border-brass-soft mb-4 overflow-x-auto border-l-2 px-3.5 py-3">
                  <Latex name={card.tex} />
                </p>
              )}
              <p className="mb-4">{r.cards[card.id].body}</p>
              <p className="text-muted border-brass-soft border-l-2 pl-4 text-[16px] leading-relaxed">
                <span className="kicker mr-2 align-[0.1em]">{r.here}</span>
                {r.cards[card.id].so}
              </p>
            </div>
          </article>
        ))}
      </div>

      <p className="caption border-rule mt-14 max-w-[68ch] border-t pt-5">{r.caveat}</p>

      <p className="caption mt-4 max-w-[68ch]">
        {r.portraits} Credits:{' '}
        {CREDITS.map(({ card, portrait }, i) => (
          <span key={card.id}>
            {i > 0 && '; '}
            <a
              href={portrait.page}
              target="_blank"
              rel="noreferrer"
              className="hover:text-ink underline underline-offset-2"
            >
              {card.people[card.people.length - 1]}
            </a>{' '}
            © {portrait.by}, {portrait.licence}
          </span>
        ))}
        .
      </p>
    </>
  );
}
