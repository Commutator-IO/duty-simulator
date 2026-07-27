# duty-simulator

Interactive deployed to **[duty.commutator.io](https://duty.commutator.io)**.

"AI saves me time" is three different claims wearing one sentence. The time saved has a
hard mathematical ceiling. The strain can go up while the hours go down. And the saving
has an owner, who may not be you.

This page separates them and lets you ride the faders.

- **The instrument** — Amdahl's law with a review term, drawn on an oscilloscope, plus two
  load meters and the ratchet.
- **The story** — the essay: why the three numbers diverge, and what follows.
- **What to change** — Screen Time and Focus, with a per-app schedule and four regimes.
- **The research** — the twelve findings underneath, with their caveats.

No storage, no analytics, no account. Settings live in the URL, which is also how you
share one: `?p=80&s=4&r=30`.

## Development

```sh
npm install
npm run dev
```

| script | what it does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run lint` | oxlint, warnings are errors |
| `npm test` | vitest — the model, the URL, the regimes, the formulas |
| `npm run build` | type-check then build to `dist/` |
| `npm run formulas` | re-render the LaTeX to MathML after editing `src/lib/formulas.ts` |

Formulas are written in LaTeX and rendered to MathML **at authoring time**, so KaTeX never
reaches the browser. Edit `src/lib/formulas.ts`, then run `npm run formulas`; a test fails
if you forget.

## Deployment

`.github/workflows/deploy.yml` lints, tests, builds and publishes to GitHub Pages on every
push to `main`. Pull requests run the checks without deploying.

## Licence

MIT.
