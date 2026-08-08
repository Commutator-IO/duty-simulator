# duty-simulator

Static site deployed to `duty.commutator.io`. An interactive that separates three things
everyday talk about AI at work systematically conflates: the time saved, the cognitive
load, and the expectations that visible productivity raises.

Audience: developers, and anyone their manager listens to. The **code, comments and docs**
are written in English. The **interface is bilingual**, English and French.

macOS menu labels — and the names of Focus modes the reader creates — stay in English in
both languages, because the page assumes a Mac configured in English: what you read has to
match what is on screen, word for word. Everything around them is translated. A mechanism
that is a real macOS label (`Focus Filters`, `Always Allowed`, `Downtime`) stays; one that
is only a description (`Signal d'arrêt`, `Règle personnelle`) is translated.

## Register

The page reads as a newspaper interactive, not as documentation and not as a landing page.
Concretely:

- Every idea is explained in ordinary words **before** it is given its name. "A rule about
  speeding things up" comes before "Amdahl's law".
- Numbers are small enough to hold in your head, and the same worked example (60%, 3×, a
  quarter review) runs through the essay, the defaults and the tests.
- Sentences are short. Second person. The figure first, the meaning immediately after.
- Sober throughout: no productivity promise, no self-help. The tool exists to decide what
  to do with the time saved, not to save more of it.

## Stack

Vite + React 19 + TypeScript + Tailwind 4, matching `sasu-simulator` and `fire-simulator`.
Identifiers are in English here, unlike those two.

```sh
npm run dev       # vite
npm run lint      # oxlint --deny-warnings
npm test          # vitest
npm run build     # tsc -b && vite build
npm run formulas  # re-render the LaTeX after editing src/lib/formulas.ts
```

`.github/workflows/deploy.yml` runs lint, tests and build on every push and pull request,
and deploys to GitHub Pages from `main`. `vite.config.ts` uses a relative base, which works
both from the custom domain and from a project site under `/<repo>/`.

## Structure

Five tabs, held in `App.tsx`:

1. **Start here** (`walkthrough`) — the guided read. Explains one idea, hands over the one
   fader it controls, shows what moved, then goes on. Sets every value for the whole page.
2. **The instrument** (`simulator`) — the fader console, readouts, oscilloscope, load meters,
   and the same equations read as a feedback loop.
3. **The reactor** (`reactor`) — the model read as a reaction. Chemical kinetics only; the
   control-engineering reading of it belongs on the instrument.
4. **What to change** (`macos`) — the day as a battery, the week as a ration, Screen Time and
   Focus, plus the regime table.
5. **The research** (`foundations`) — nineteen cards on a timeline, 1865 → 2026. The five the
   page calculates rather than cites carry a badge; the count is derived from `implemented`,
   never written into a sentence.

The walkthrough and the research cards must stay consistent: the walkthrough argues from
those findings and cites them by `id`, so changing a claim in one place means checking the
other.

## Languages

`src/content/` holds every user-facing word. `en.tsx` and `fr.tsx` are both typed as
`Copy` (`types.ts`), so **a key missing from one language is a compile error**, not a
sentence in the wrong language on a live page. There is no runtime fallback and no
`Partial` anywhere in that type — that is the whole safety property.

Long passages are `ReactNode` composed from the shared layout in `components/Prose.tsx`;
where a passage quotes a live figure it is a function of the current numbers. Splitting an
argument into thirty numbered fragments to keep it in a flat dictionary makes it unreadable
in both languages at once.

French uses **vouvoiement**, and translates the instrument's own vocabulary: the console
reads `PORTÉE`, not `REACH`.

The choice lives in the URL as `?lang=fr`, written **only once the visitor picks one**, so a
link shared by someone who never touched the switch opens in the reader's own language.
`navigator.language` decides otherwise. `<html lang>` and `document.title` follow.

### `src/lib` — everything testable, nothing rendered

| module | what it holds |
|---|---|
| `model.ts` | the arithmetic, and only the arithmetic |
| `verdicts.ts` | the sentences under the panels, paired with the verdict they describe |
| `format.ts` | how a figure is written |
| `url.ts` | the setting ⇄ query string, clamped and snapped on the way in |
| `regimes.ts` | the macOS table and its four regimes — thresholds only, wording in `content/` |
| `foundations.ts` | the research entries — years, people, portraits; wording in `content/` |
| `i18n.ts` | the two languages, and what the browser asks for |
| `formulas.ts` | the LaTeX sources |
| `formulas.mathml.ts` | **generated** — do not edit by hand |

## The model

Amdahl's law, with a review term:

```
t     = (1 − p) + p/s          relative duration, output held constant
t_eff = t + r × (1 − t)        review takes back part of the gain
gain  = 1 / t_eff
ceiling = 1 / (1 − p)          as s → ∞
```

- `p` share of the work AI accelerates, `s` speed-up on that share, `r` share of the gain
  taken back by review, `h` dense hours per day with AI, `d` cognitive density of an hour.
- Load: `h × d` with AI against `h × gain` without. Sustainable threshold set at 4 units.
- Break-even: the day starts costing more the moment `d` reaches `gain`. Exactly.
- Ration: the same budget over five days. `burst = 5 × capacity − 4 × h` is the longest day the
  week still affords, which is the one figure the daily gauge cannot show. It goes negative, and
  the gauge says so rather than printing a negative hour count.
- Ratchet: `visible = 1 + v × (gain − 1)`, hours after the ratchet `h × visible / gain`,
  margin kept `h × gain − h × visible`.

The central teaching point: **`p` commands the ceiling, not `s`.** The trace has to make
that obvious on the first pull of a fader. Do not break that legibility.

## Formulas

LaTeX in `src/lib/formulas.ts` → MathML by KaTeX at authoring time → committed to
`formulas.mathml.ts`. KaTeX stays a dev dependency and is **never shipped to the browser**;
only its output travels, so the page carries no parser, no stylesheet and no maths font.

After editing any formula, run `npm run formulas`. Forgetting is caught by
`formulas.test.ts`, which recompiles and compares.

These are rendered out of display mode, so an operator that needs its condition set
underneath — `\lim` — must say `\limits` explicitly.

## Regime table (What to change)

Each row belongs to group `distraction` (usage quota) or `stop` (stop signal). A regime
carries two factors. **Hyperfocus** loosens the quotas and tightens the stops: the target
there is not distraction but the eleven-hour session without a drink. The displayed total
sums the distraction group only.

## Portraits

Hotlinked from Wikimedia Commons, declared on each entry in `foundations.ts`. Nothing is
downloaded and nothing is re-hosted, which is a trade worth being honest about: the page
makes third-party requests, and an image breaks if the file is renamed upstream.

Two rules, and neither bends:

- **Only licences that permit reuse** — public domain, CC0, CC BY, CC BY-SA. Check the
  licence of the *photograph*, not the fame of the subject. No "fair use" file on any
  Wikipedia is acceptable, however easy it would be to point at.
- **Credit is printed**, because CC BY and CC BY-SA both require it. `by` and `licence` on
  the entry feed the line under the timeline.

Nine people have no freely-licensed picture — Roy, Little, Leroy, Karasek, Siegrist, Dodson,
Black, Damköhler, Turner — and their plate shows initials. Do not invent a likeness to fill the
gap. The credit line names `portrait.of ?? people[0]`, because an entry with several names must
not end up crediting the wrong face; `foundations.test.ts` enforces the licence allowlist.

## Design

Tokens in `@theme`, redefined under `prefers-color-scheme: dark` rather than doubled with
`dark:` variants. Never hard-code a colour in a component — the SVGs read the same tokens,
which is how the scope follows the theme.

Two visual registers, deliberately:

- **The page** is a newspaper. Source Serif 4 for headlines and body, Libre Franklin for
  kickers, captions and labels. Generous leading, `19px` body, one accent (brass).
- **The instrument** is a bench device. A faint copper board behind everything, a phosphor
  CRT that stays dark in both themes, LCD readouts, LED bargraphs, and a mixing-desk fader
  console. JetBrains Mono, because digits must not change width as they count.

Square corners throughout.

The fader caps track the pointer **absolutely**, not by accumulated deltas: on a desk the
cap sits under your finger. Grabbing the cap preserves the offset so it does not jump;
grabbing the empty slot throws the cap to that point. The legend below the console is a
single column in desk order, and the row for the channel under the pointer or the focus
ring lights up — that pairing is what ties an anonymous strip of hardware to the question
it asks.

## Accessibility

- Tabs follow the ARIA pattern, arrow keys included.
- The faders are `role="slider"`, so the keyboard contract is implemented by hand: arrows
  step, Page steps by ten, Home and End reach the stops. **A fader that cannot be driven
  from the keyboard is a bug, not a style.**
- `prefers-reduced-motion` removes the sweep outright rather than slowing it.
- The board, the raster and the scope decorations are hidden from assistive technology.

## What not to do

- **No browser storage**, no analytics, no third-party tracking. The URL is the only
  persistence, and `replaceState` is used so riding a fader does not fill the back button.
- Do not add quotas on work tools in the regime table: the "None" rows are deliberate and
  carry half the message. `regimes.test.ts` enforces this.
- Do not remove the caveats from the research cards — the warning on Yerkes-Dodson, the
  reservation about the word "law". They are the project's intellectual guardrail.
- Do not hard-code a figure in the essay without checking it against `model.test.ts`. Two
  of them were wrong once already.

## Open tasks

1. **Self-host the fonts.** Currently three families from Google Fonts: external requests
   and a questionable GDPR point. Fetch the `woff2` files, serve from `/fonts/`,
   `font-display: swap`, drop the `preconnect` hints. System fallbacks are already in place.
2. Open Graph image (`og:image`), still missing.
3. A print stylesheet — the essay deserves one.
