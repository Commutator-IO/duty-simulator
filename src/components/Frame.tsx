import { useRef } from 'react';
import { useCopy } from '../content';
import { LABELS as LANGUAGE_LABELS, LANGUAGES, type Language } from '../lib/i18n';
import { HOME, REPO, newIssueLink } from '../lib/repo';
import { TABS, type Tab } from '../lib/url';

/**
 * The language switch.
 *
 * Two buttons rather than a dropdown: with two languages a select is a click
 * more for no gain, and the inactive one doubles as a signal that the other
 * exists at all.
 */
export function LanguageSwitch({
  language,
  onChange,
}: {
  language: Language;
  onChange: (l: Language) => void;
}) {
  const copy = useCopy();
  return (
    <div className="flex items-center gap-1" role="group" aria-label={copy.chrome.languageLabel}>
      {LANGUAGES.map((l) => {
        const active = l === language;
        return (
          <button
            key={l}
            type="button"
            lang={l}
            aria-current={active ? 'true' : undefined}
            onClick={() => onChange(l)}
            className={[
              'font-sans cursor-pointer border px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] uppercase transition',
              active
                ? 'border-brass text-brass'
                : 'border-rule text-muted hover:text-ink hover:border-muted',
            ].join(' ')}
          >
            {l}
            <span className="sr-only"> — {LANGUAGE_LABELS[l]}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * The top of the page, set as a newspaper sets one: a kicker naming the kind of
 * piece, a headline, a standfirst, then a rule. The green lamp is the only
 * thing that gives away that there is a machine underneath.
 */
export function Masthead({
  language,
  onLanguage,
}: {
  language: Language;
  onLanguage: (l: Language) => void;
}) {
  const copy = useCopy();
  return (
    <header>
      <div className="mb-3 flex items-start justify-between gap-4">
      <p className="kicker flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="inline-block h-2 w-2 shrink-0"
          style={{
            background: 'var(--color-phosphor)',
            boxShadow: '0 0 7px rgb(88 224 140 / 0.85)',
          }}
        />
        {copy.chrome.kicker}
      </p>
        <LanguageSwitch language={language} onChange={onLanguage} />
      </div>

      <h1 className="text-[clamp(34px,6vw,54px)] leading-[1.05] font-bold tracking-[-0.022em]">
        {copy.chrome.headline}
      </h1>

      <p className="dek mt-4 max-w-[54ch]">{copy.chrome.dek}</p>

      <p className="caption border-rule mt-5 border-t pt-3">{copy.chrome.standfirst}</p>
    </header>
  );
}

/**
 * The tab bar.
 *
 * Arrow keys move between tabs, as the ARIA pattern requires. Switching while
 * scrolled down would otherwise drop the reader into the middle of the next
 * section with an empty stretch above it, so the bar is pulled back to the top
 * of the viewport whenever it has scrolled past.
 */
export function Tabs({ current, onChange }: { current: Tab; onChange: (t: Tab) => void }) {
  const copy = useCopy();
  const bar = useRef<HTMLDivElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  function reveal() {
    const node = bar.current;
    if (!node) return;
    const top = node.getBoundingClientRect().top + window.scrollY;
    if (window.scrollY > top) window.scrollTo(0, top);
  }

  function select(tab: Tab) {
    onChange(tab);
    reveal();
  }

  return (
    <div
      ref={bar}
      role="tablist"
      aria-label="Sections"
      className="border-rule bg-paper sticky top-0 z-20 mt-8 flex flex-wrap border-y"
    >
      {TABS.map((tab, i) => {
        const active = tab === current;
        return (
          <button
            key={tab}
            ref={(el) => {
              buttons.current[i] = el;
            }}
            role="tab"
            id={`tab-${tab}`}
            aria-controls={`panel-${tab}`}
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => select(tab)}
            onKeyDown={(e) => {
              const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
              if (step === 0) return;
              e.preventDefault();
              const next = (i + step + TABS.length) % TABS.length;
              select(TABS[next]);
              buttons.current[next]?.focus();
            }}
            className={[
              'font-sans flex cursor-pointer items-center gap-2 border-b-2 px-4 py-3 text-[12px] font-semibold tracking-[0.1em] uppercase transition max-sm:px-3',
              active ? 'border-brass text-ink' : 'text-muted hover:text-ink border-transparent',
            ].join(' ')}
          >
            {/* Selector lamp: lit on the section you are in. */}
            <span
              aria-hidden="true"
              className="inline-block h-1.5 w-1.5 shrink-0"
              style={
                active
                  ? {
                      background: 'var(--color-phosphor)',
                      boxShadow: '0 0 6px rgb(88 224 140 / 0.8)',
                    }
                  : { background: 'currentColor', opacity: 0.3 }
              }
            />
            {copy.chrome.tabs[tab]}
          </button>
        );
      })}
    </div>
  );
}

export function Panel({
  tab,
  current,
  children,
}: {
  tab: Tab;
  current: Tab;
  children: React.ReactNode;
}) {
  if (tab !== current) return null;
  return (
    <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} tabIndex={0}>
      {children}
    </div>
  );
}

export function Footer({ shareLink }: { shareLink: string }) {
  const copy = useCopy();
  return (
    <footer className="border-rule text-muted mt-16 border-t pt-6">
      <p className="caption flex flex-wrap gap-x-5 gap-y-1">
        {/* The way back out. Same tab, because leaving is what it is for. */}
        <a href={HOME} className="hover:text-ink underline underline-offset-2 transition">
          {copy.chrome.home}
        </a>
        <a
          href={newIssueLink(shareLink)}
          target="_blank"
          rel="noreferrer"
          className="hover:text-ink underline underline-offset-2 transition"
        >
          {copy.chrome.reportError}
        </a>
        <a
          href={REPO}
          target="_blank"
          rel="noreferrer"
          className="hover:text-ink underline underline-offset-2 transition"
        >
          {copy.chrome.sourceCode}
        </a>
      </p>
      <p className="caption mt-3 max-w-[70ch]">{copy.chrome.privacy}</p>
    </footer>
  );
}
