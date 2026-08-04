import { Ask, Live } from '../components/Fields';
import { Display } from '../components/Latex';
import { Source, Tally } from '../components/Prose';
import { makeFormats } from '../lib/format';
import { cardById } from '../lib/foundations';
import { BOUNDS, DEFAULTS, loadVerdict, ratchetVerdict, type Inputs } from '../lib/model';
import type { ChannelKey, Copy, Step, WalkthroughValues } from './types';

const f = makeFormats('en');



const CHANNELS: Record<ChannelKey, { name: string; label: string; hint: string }> = {
  hours: {
    name: 'Focus hrs',
    label: 'Hours you actually concentrate, in a day',
    hint: 'Not how long your day is. The hours you are genuinely heads-down.',
  },
  share: {
    name: 'Reach',
    label: 'How much of that work AI can touch at all',
    hint: 'Everything else — the meeting, the decision, knowing why the system is the way it is — runs at your speed no matter how good the tool gets. This is the fader that decides your limit.',
  },
  speed: {
    name: 'Speed',
    label: 'How much faster it goes, on that part',
    hint: 'Three times faster means an hour of work comes back in twenty minutes.',
  },
  review: {
    name: 'Checking',
    label: 'How much of the saving goes straight back into checking',
    hint: 'Reading the output, correcting it, asking again. A quarter is a modest guess for most people.',
  },
  density: {
    name: 'Drain',
    label: 'How draining an hour with AI is',
    hint: '1.0 is an ordinary working hour. 1.3 is an hour of continuous judgement calls, with none of the pauses that used to break up a day.',
  },
  visible: {
    name: 'Visible',
    label: 'How much of the surplus you let people see',
    hint: 'At 0% you keep your old pace and pocket the difference. At 100% you ship everything the tool makes possible.',
  },
};

/** Builds the channel a step hands over, wired to the live state. */
function channel(key: ChannelKey, v: WalkthroughValues, set: (patch: Partial<Inputs>) => void) {
  const renderers: Record<ChannelKey, (n: number) => string> = {
    hours: f.hours,
    share: f.percent,
    speed: f.timesShort,
    review: f.percent,
    density: f.index,
    visible: f.percent,
  };
  return {
    ...CHANNELS[key],
    value: v.inputs[key],
    ...BOUNDS[key],
    fallback: DEFAULTS[key],
    onChange: (n: number) => set({ [key]: n }),
    render: renderers[key],
  };
}

function steps(v: WalkthroughValues, set: (patch: Partial<Inputs>) => void): Step[] {
  const { inputs, result: r, rawGain, breakEven } = v;

  return [
    {
      no: 'Question one',
      title: 'How much of your day is actually work?',
      body: (
        <>
          <p>
            Start with the only figure you already know. Not the length of your day — the hours in
            it where you are genuinely concentrating. For most people who measure it honestly the
            answer is between three and five, and it is a shock the first time.
          </p>
          <Ask channel={channel('hours', v, set)} />
          <p>
            Everything below is expressed in those hours, because they are the only ones the tool
            can do anything about. The rest of the day was never the constraint.
          </p>
        </>
      ),
    },
    {
      no: 'Question two',
      title: 'What can the tool actually touch?',
      body: (
        <>
          <p>
            In 1967 a computer architect made an observation about speeding things up that turned
            out to apply far beyond processors. It is almost too simple to state: if you make one
            part of a job faster, the rest of the job does not care.
          </p>
          <Source
            card={cardById('amdahl')}
            body="Speed up one part of a job and the rest carries on exactly as before. The gain across the whole job is capped by whatever you did not speed up — and no amount of extra power moves that cap."
          />
          <p>
            So the first thing to establish is not how good the assistant is. It is how much of
            your work it can reach at all, because everything it cannot reach sets your limit.
          </p>
          <Ask channel={channel('share', v, set)}>
            Ambiguous requirements, undocumented systems and decisions that need three people in a
            room are what hold this number down — not the model.
          </Ask>
          <Tally>
            At <Live>{f.percent(inputs.share)}</Live>, Amdahl alone would cap you at{' '}
            <Live>{f.times(r.ceiling)}</Live> — where you land with an <em>infinitely fast</em>{' '}
            assistant, not ten times faster but infinitely. Checking will pull that down again in
            two questions' time. No release ever takes you past it while this number stays put.
          </Tally>
        </>
      ),
    },
    {
      no: 'Question three',
      title: 'And how much faster, on that part?',
      body: (
        <>
          <p>
            Now the number everybody actually argues about. Be generous if you like; the point of
            the next line is that it matters less than you would think.
          </p>
          <Ask channel={channel('speed', v, set)} />
          <Tally>
            <Live>{f.timesShort(inputs.speed)}</Live> on <Live>{f.percent(inputs.share)}</Live> of
            the work makes your whole day <Live>{f.times(rawGain)}</Live> faster — against a
            ceiling of <Live>{f.times(r.ceiling)}</Live>. Everything the industry has left to give
            you, on these numbers, is a factor of <Live>{f.times(r.ceiling / rawGain)}</Live>.
          </Tally>
          <Display name="amdahl" />
          <p>
            Try it the other way round. Push the reach fader up by twenty points and watch the
            ceiling move; push the speed fader instead and watch it not move at all. Benchmarks
            measure speed. Reach is the term with leverage, and unlike speed it is partly a
            property of how your work is organised — which makes it partly yours.
          </p>
        </>
      ),
    },
    {
      no: 'Question four',
      title: 'Who reads what comes out?',
      body: (
        <>
          <p>
            The 1967 rule quietly assumes the fast part comes back finished. Generated work does
            not. It has to be read, and reading is not free.
          </p>
          <p>
            Two things make that bill bigger than people expect. Reading unfamiliar code is slower
            than writing familiar code — an old asymmetry, nothing to do with AI. And a generated
            answer rarely fails by being obviously broken. It fails by being plausible and wrong,
            which is the most expensive kind of mistake there is, because it survives a quick look
            and surfaces much later.
          </p>
          <Ask channel={channel('review', v, set)} />
          <Display name="review" />
          <Tally>
            Checking takes the <Live>{f.times(rawGain)}</Live> down to{' '}
            <Live>{f.times(r.gain)}</Live>. In hours: what now takes you{' '}
            <Live>{f.hours(inputs.hours)}</Live> would have taken{' '}
            <Live>{f.hours(r.hoursWithout)}</Live> without the tool.
          </Tally>
          <p>
            That is claim number one, settled. The day is shorter. Whether it is <em>better</em> is
            a different question, and the answer is not in that number.
          </p>
        </>
      ),
    },
    {
      no: 'Question five',
      title: 'What does an hour of it cost you?',
      body: (
        <>
          <p>
            Work that used to be making things is now checking things, and checking is continuous
            judgement: read, assess, accept, reject, try again. Meanwhile the slack that used to
            punctuate a day — waiting on a build, looking something up, the slow part of thinking —
            is exactly what gets squeezed out. What is left is denser.
          </p>
          <Source
            card={cardById('leroy')}
            body="Switching tasks leaves part of your attention behind on the previous one, especially if you left it unfinished, and performance on the next task suffers measurably."
          />
          <p>
            Supervising an agent is a machine for generating task switches. Run three sessions at
            once and you have three threads to hold in your head — a cost paid by you, not by the
            machine.
          </p>
          <Ask channel={channel('density', v, set)} />
          <Tally>
            {r.loadGap > 0 ? (
              <>
                Your day is shorter and costs more. <Live>{f.units(r.loadWith)}</Live> units of
                strain against <Live>{f.units(r.loadWithout)}</Live> — the hours went down and the
                total went up.
              </>
            ) : (
              <>
                Your day is shorter and cheaper: <Live>{f.units(r.loadWith)}</Live> units of strain
                against <Live>{f.units(r.loadWithout)}</Live>. The tipping point is a drain of{' '}
                <Live>{f.index(breakEven)}</Live> — past that, the shorter day starts costing more
                than the long one did.
              </>
            )}
          </Tally>
          <p>
            That is claim number two, and it is the one nobody puts in a slide deck. A shorter day
            and an easier day are different things. The tool delivers the first on its own; the
            second only happens if you decide it does.
          </p>
        </>
      ),
    },
    {
      no: 'Question six',
      title: 'And who ends up with the time?',
      body: (
        <>
          <p>
            One last question, and it is not a technical one. There is a twin to the 1967 rule that
            gets quoted far less often: in real life nobody keeps a job the same size in order to
            go home early. They keep the hours and make the job bigger.
          </p>
          <Source
            card={cardById('gustafson')}
            body="In practice the job is not held fixed so you can finish earlier — it is enlarged at constant hours. Once that is what happens, the cap stops binding."
          />
          <p>
            Nothing in the mathematics chooses between finishing at three o'clock and shipping half
            as much again by six. That choice is political, and it is usually not made by the
            person at the keyboard.
          </p>
          <Source
            card={cardById('roy')}
            body="Piece-rate workers in a Chicago machine shop capped their own output on purpose, because a spectacular week got the rate revised down and made every following week worse."
          />
          <p>
            Roy's machinists were not lazy. They had identified a ratchet. The same shape appears
            wherever performance is watched: the peak becomes the expectation, and expectations do
            not travel back down.
          </p>
          <Ask channel={channel('visible', v, set)} />
          <Tally>
            The bar moves up <Live>{f.percentSigned(r.visibleGain - 1)}</Live> and stays there. You
            keep <Live>{f.hours(r.marginKept)}</Live> a day, in old-money hours.
          </Tally>
          <p>
            Be honest about what that fader is not. Holding back alone is a weak move — Roy's
            workers held the line collectively, and one person quietly working below capacity loses
            standing without slowing anything down. It shows you what you keep. It is not a
            strategy for winning.
          </p>
        </>
      ),
    },
  ];
}

export const EN: Copy = {
  format: f,
  chrome: {
    documentTitle: 'DUTY simulator — what AI actually buys you',
    kicker: 'DUTY simulator · an interactive',
    headline: 'What AI actually buys you',
    dek: 'Everyone agrees the tools save time. Almost nobody agrees on what that sentence means — because it hides three different claims, and they do not move together.',
    standfirst: 'Ride the faders. The numbers, the curve and the verdicts all move with them.',
    tabs: {
      walkthrough: 'Start here',
      simulator: 'The instrument',
      reactor: 'The reactor',
      macos: 'What to change',
      foundations: 'The research',
    },
    reportError: 'Report an error',
    sourceCode: 'Source code',
    privacy:
      'This page stores nothing: no cookie, no analytics, no account. The settings live in the address bar, which is also how you share one.',
    languageLabel: 'Language',
  },

  channels: CHANNELS,

  console: {
    yourTurn: 'Your turn',
    howTo:
      'Ride a fader with the mouse, or focus one and use the arrow keys. Double-click puts it back where it started.',
  },

  walkthrough: {
    kicker: 'Start here · about ten minutes',
    headline: 'Three claims are hiding in one sentence',
    dek: '“It saves me time” is the most common thing anyone says about working with AI, and the least useful. Answer six questions as you read and this page will work out what it is actually buying you.',
    intro: (
      <>
        <p>
          Press a developer on what has changed since they started working with an assistant and
          the sentence comes apart into three:
        </p>
        <ul className="mb-5 list-disc space-y-2 pl-6">
          <li>The same work now takes fewer hours.</li>
          <li>Those hours feel different — lighter, or heavier.</li>
          <li>More gets expected of you per day than before.</li>
        </ul>
        <p>
          They arrive together, so they sound like one claim. They are not. The first has a hard
          mathematical limit that no future model will lift. The second can move in the opposite
          direction to the first. The third is not really yours to decide.
        </p>
        <p>
          None of what follows is new, and none of it is about AI. The oldest piece of it is a book
          about coal from 1865. What is new is only that all three now land on the same person at
          the same time.
        </p>
      </>
    ),
    steps,
    curve: {
      kicker: 'The answer',
      title: 'Reading the curve you just generated',
      lead: (
        <p>
          Everything you have set is in the trace below. It is drawn like an oscilloscope because
          that is what it is: one quantity plotted against another, live.
        </p>
      ),
      readings: ({ inputs, result: r }) => [
        <>
          <strong className="font-semibold">The axes.</strong> Left to right is how fast the
          assistant is, from no help at all to eight times. Bottom to top is what your whole day is
          worth as a result.
        </>,
        <>
          <strong className="font-semibold">The blue trace</strong> is the 1967 rule on its own —
          the day you would get if nothing ever needed checking.
        </>,
        <>
          <strong className="font-semibold">The green trace</strong> is yours, with your{' '}
          <Live>{f.percent(inputs.review)}</Live> of checking deducted. The gap between the two is
          the bill from question four.
        </>,
        <>
          <strong className="font-semibold">The bright dot</strong> is where you are sitting:{' '}
          <Live>{f.timesShort(inputs.speed)}</Live> along the bottom, <Live>{f.times(r.gain)}</Live>{' '}
          up the side.
        </>,
        <>
          <strong className="font-semibold">The dashed amber line</strong> is the ceiling,{' '}
          <Live>{f.times(r.ceiling)}</Live>. Notice that the green trace approaches it and never
          arrives, however far right you look.
        </>,
      ],
      contrast: (
        <p className="mt-6 max-w-[63ch]">
          Now do one thing. Ride the speed fader to the far end and watch the dot climb, then
          flatten, then effectively stop — the whole right-hand half of that chart is worth almost
          nothing to you. Then ride the reach fader instead, and watch the ceiling itself pick up
          and move. That contrast is the entire argument on this page.
        </p>
      ),
      tally: ({ inputs, result: r }) => (
        <>
          Where you have landed: <Live>{f.times(r.gain)}</Live> on a ceiling of{' '}
          <Live>{f.times(r.ceiling)}</Live>, a day of <Live>{f.hours(inputs.hours)}</Live> against{' '}
          <Live>{f.hours(r.hoursWithout)}</Live>, {r.loadGap > 0 ? 'costing ' : 'saving '}
          <Live>{f.units(Math.abs(r.loadGap))}</Live> units of strain, with a bar that has moved{' '}
          <Live>{f.percentSigned(r.visibleGain - 1)}</Live>.
        </>
      ),
      afterward: (
        <p className="max-w-[63ch]">
          Those six numbers are now set for the whole page, and they travel in the address bar, so
          the link in your browser is the version of this you just built. The instrument tab is the
          same model with every control in one place, for when you want to argue with it rather
          than be walked through it.
        </p>
      ),
      openInstrument: 'Open the instrument →',
      caveat: (
        <>
          <strong className="text-ink font-semibold">One caveat, stated once.</strong> None of this
          touches the workload handed to you from above, expectations left deliberately vague, or a
          condition nobody has treated — the three things that turn up most reliably in repeated
          burnout. Every figure here is worth exactly what your own estimates are worth. It is an
          instrument for thinking, and it is not evidence.
        </>
      ),
    },
  },

  dayBars: {
    kicker: 'The same day, three ways',
    title: 'Why there is a ceiling at all',
    lead: (
      <p>
        Here is the whole argument without a single curve. Three versions of the same day's work,
        drawn to the same scale.
      </p>
    ),
    without: 'Without the tool',
    withAi: 'With the tool, as you have set it',
    infinite: 'With an infinitely fast tool',
    infiniteNote: (ceiling) =>
      `That is the ceiling — ${ceiling} — and it is nothing but the block the tool never touched.`,
    segments: {
      reachable: 'What the tool can reach',
      untouched: 'What it cannot',
      accelerated: 'Accelerated',
      checking: 'Checking',
    },
    caption: (
      <>
        <strong className="text-ink font-semibold">The point.</strong> The block marked{' '}
        <em>what it cannot</em> is exactly the same width in all three rows. Making the assistant
        faster shortens the accelerated block and does nothing else. Make it infinitely fast and
        that block disappears altogether — and you are still left with the one beside it. That
        leftover is the ceiling, and the only fader that narrows it is reach.
      </>
    ),
  },

  simulator: {
    stepOne: {
      designator: 'Step one',
      title: 'Put in your own numbers',
      sub: 'Five settings. None of them needs to be exact — the point is not the third decimal, it is which way the answer moves when you change your mind about one of them.',
    },
    stepTwo: {
      designator: 'Step two',
      title: 'Who ends up with the time',
      sub: 'Say the tool really does buy you an hour. The last question is whose hour it is — and that one is not settled by arithmetic. A good week becomes the week people expect next time, and expectations do not travel back down.',
    },
    metrics: {
      gain: ['What you actually gain', 'After the checking is paid for'],
      ceiling: ['The hard ceiling', 'Where an infinitely fast tool stops, checking included'],
      without: ['The same day, without AI', 'To produce what you produce now'],
      gap: ['Extra strain', 'Positive means the shorter day costs more'],
      baseline: ['The new normal', 'What is expected of you from now on'],
      after: ['What holding it costs', 'Hours a day, once the bar has moved'],
      margin: ['What you keep', 'In old-money hours'],
    },
    curveKicker: 'The curve that flattens',
    curveCaption: (
      <>
        <strong className="text-ink font-semibold">How to read this.</strong> Left to right: how
        fast the tool is. Bottom to top: what you get out of your whole day. Ride the speed fader
        and the green line climbs, then stops climbing — that is the whole story. The dashed amber
        line is the limit it can never cross, and the only way to move that line is the second
        fader.
      </>
    ),
    metersKicker: 'A shorter day is not a lighter one',
    meterWith: 'With AI, you work',
    meterWithout: 'Without it, you would have worked',
    metersCaption:
      'Segments turn amber past the point where a day of this intensity stops being repeatable. The second bar is longer — but the first one can still cost you more, once you count how much heavier each of its hours is.',
    method: (
      <>
        <strong className="text-ink font-semibold">Method.</strong> The model is Amdahl's law,
        corrected for the share of the saving that goes back into review. Strain is hours
        multiplied by how draining each hour is; the 4-unit line is the accepted order of magnitude
        for intense mental work that can be repeated day after day, not a measurement of you. Every
        number here is worth exactly what your own estimates are worth. It is an instrument for
        thinking, and it is not evidence.
      </>
    ),
    share: { idle: 'Copy link to this setting', done: 'Link copied' },
  },

  scope: {
    title:
      'Overall gain against tool speed-up, at a constant accelerated share. The trace flattens as speed rises and never reaches the ceiling set by the share.',
    ch1: 'Review deducted',
    ch2: 'Theoretical Amdahl',
    limit: 'Your ceiling, infinite speed',
    limitShort: 'CEILING',
    limitTheoretical: 'Amdahl limit, if review were free',
  },

  verdicts: {
    load: (result, inputs) => {
      switch (loadVerdict(result)) {
        case 'unsustainable':
          return `At this setting there is nothing to compare. Producing the same output without the tool would take ${f.hours(result.hoursWithout)} of dense concentration every day, and that is not a long day — it is a day nobody has. The comparison breaks down before the arithmetic does.`;
        case 'heavier':
          return `You finish earlier, and you pay for it. ${f.hours(inputs.hours)} instead of ${f.hours(result.hoursWithout)} — but ${f.units(result.loadWith)} units of strain against ${f.units(result.loadWithout)}. The hours you saved are real. They only turn into rest if you decide they do.`;
        case 'lighter':
          return `This one is genuinely in your favour: ${f.hours(result.hoursWithout - inputs.hours)} less at the desk, and ${f.units(-result.loadGap)} less strain to go with it. Nothing here needs fixing.`;
      }
    },
    ratchet: (result, inputs) => {
      const rise = f.percent(result.visibleGain - 1);
      switch (ratchetVerdict(inputs.visible)) {
        case 'withheld':
          return 'You keep almost all of it, and the bar does not move. Worth knowing what that costs, though: when someone is deciding who did what this year, the aim was never to look slow. It was to look reliably good.';
        case 'surrendered':
          return `You ship all of it. The bar goes up ${rise} and stays there, and on the day you sit down to ask for something you have nothing left to trade. The entire gain has gone to your employer, permanently.`;
        case 'partial':
          return `The bar goes up ${rise}, and it will not come back down. What is left to you is ${f.hours(result.marginKept)} in old-money hours — best spent on something that never appears on a dashboard: reliability, a gap in what you know, or rest.`;
      }
    },
  },

  reactor: {
    designator: 'The reactor',
    title: 'The same model, read as a reaction',
    sub: 'Chemical kinetics and control theory have been describing this shape for a century, under other names. Four of their results are not decoration here: two are the same algebra written differently, one names which fader to move, and one says the model is optimistic in a way that can be pointed at.',
    lead: (
      <p>
        Nothing here changes the arithmetic on the other tabs. What it changes is what you can see
        in it — including one result that argues against this page's own advice.
      </p>
    ),
    series: {
      title: 'Resistances in series',
      body: (
        <>
          <p>
            Amdahl's formula is a sum of residence times: amount over rate, per step, added
            together. That is the algebra of resistances in series, and it yields the conclusion
            chemical engineers reach about diffusion and reaction — if transport is limiting, a
            better catalyst buys nothing at all.
          </p>
          <p>
            The tool behaves like a catalyst in the strict sense: it lowers the barrier on the steps
            it touches, leaves the others alone, and does not move the equilibrium. It only gets you
            there sooner.
          </p>
        </>
      ),
    },
    damkohler: {
      kicker: 'Which step is limiting',
      reachLimited: (
        <>
          Below 1: <strong className="font-semibold">the step the tool cannot touch dominates.</strong>{' '}
          You are transport-limited, and a faster model is a better catalyst on a reaction already
          waiting for something else. Widening reach is the only move that pays.
        </>
      ),
      speedLimited: (
        <>
          Above 1: <strong className="font-semibold">the tool is still the bottleneck.</strong> The
          accelerated step takes longer than everything else combined, so speed is genuinely worth
          buying — until this number crosses back under 1, which it will.
        </>
      ),
    },
    loop: {
      title: 'A feedback loop, and where the second ceiling comes from',
      body: (
        <>
          <p>
            Review measures the output and feeds part of it back as work to redo. That is a negative
            feedback loop, and writing the model in the loop's own notation is not an analogy — the
            two expressions are identical.
          </p>
        </>
      ),
      openLoop: 'Open loop, before review',
      closedLoop: 'Closed loop, what you get',
      feedbackCeiling: 'Feedback limit, 1/r',
      consequence: (
        <>
          <p>
            Which produces the central result of feedback control: once the forward gain is large,
            the closed-loop gain stops depending on it and is set by the feedback path alone. Push
            the assistant arbitrarily hard and you converge on 1/r — a ceiling with nothing to do
            with Amdahl, and the reason the instrument now shows two limits rather than one.
          </p>
          <p>
            Two independent bounds on the same quantity, and the smaller is the one you live under.
            At a wide reach it is this one.
          </p>
        </>
      ),
    },
    saturation: {
      title: 'Your review capacity is finite, and the model pretends otherwise',
      body: (
        <>
          <p>
            Treating <em>r</em> as a constant fraction says that checking twice as much output costs
            exactly twice as much. That holds only while you are nowhere near your own limit.
          </p>
          <p>
            Enzyme kinetics describes the other case: a fixed quantity of catalyst, throughput that
            saturates, a queue that grows once substrate outruns it. Here <strong>you are the
            enzyme</strong>, and this — rather than Brooks on coordination — is why three agent
            sessions do not triple anything.
          </p>
        </>
      ),
      alt: 'Gain against speed, with review constant and with review saturating.',
      xAxis: 'Speed-up on the assisted share',
      constantLine: 'Review as a constant fraction — what the instrument computes',
      saturatedLine: 'Review saturating',
      turnoverMark: 'turnover',
      turnover: (speed) => (
        <>
          <strong className="text-ink font-semibold">At your reach there is a turnover.</strong> The
          corrected curve peaks around {speed} and falls after it: past that point a faster
          assistant makes your day <em>longer</em>, because it feeds a bottleneck that cannot drain
          any quicker. That is Illich's counterproductivity threshold, arriving from kinetics rather
          than from philosophy.
        </>
      ),
      noTurnover: (ceiling) => (
        <>
          <strong className="text-ink font-semibold">At your reach there is no turnover</strong> —
          raw throughput never gets large enough to swamp the bottleneck. Saturation only lowers the
          ceiling, to about {ceiling}. Widen reach and a turnover appears.
        </>
      ),
      consequence: (k) => (
        <>
          <p>
            <strong className="text-ink font-semibold">Read this as a shape, not a measurement.</strong>{' '}
            K — the throughput at which review capacity is half-saturated — is set to {k} here and
            nothing calibrates it. Nobody has measured yours.
          </p>
          <p>
            The shape is the point, and it is uncomfortable: the wider the reach, the sooner extra
            speed starts hurting. This page spends a whole walkthrough arguing that reach is the
            term with leverage. Saturation is the caveat — widening what the tool touches without
            also raising what you can absorb moves the turnover towards you.
          </p>
        </>
      ),
    },
    residence: {
      title: 'Residence time, and the case for uninterrupted blocks',
      body: (
        <>
          <p>
            Two reactors of equal volume do not give equal conversion. A plug-flow reactor — where
            everything enters and leaves in order — beats a perfectly mixed one, in which some
            material short-circuits and some lingers.
          </p>
          <p>
            A protected block of concentration is plug flow. An open-plan afternoon with Slack open
            is the mixed vessel: same hours in, worse conversion out, and it is the back-mixing that
            costs you rather than the interruptions themselves.
          </p>
          <p>
            This is the quantitative argument for the settings tab, and it is stronger than saying
            context switching is bad.
          </p>
        </>
      ),
    },
    breaks: {
      title: 'Where the analogy stops',
      body: (
        <>
          <p>
            The ratchet has a chemical cousin — autocatalysis, in which the product catalyses its
            own formation. The mechanism matches; the behaviour does not. An autocatalytic reaction
            stops, because it exhausts its substrate, and conservation of mass bounds it.
            Expectations are made of nothing and have no such bound.
          </p>
          <p>
            Control theory names it better: expectations behave like an integrator with no leak. A
            pole at the origin, everything accumulating, nothing decaying. And Le Chatelier is the
            sharp contrast — a system at equilibrium responds to a constraint by opposing it, while
            the ratchet responds by reinforcing it.
          </p>
          <p>
            One more borrowing worth the name: Goodhart is the standard failure of controlling the
            sensor rather than the variable. The display reads perfect while the thing it stood for
            drifts.
          </p>
        </>
      ),
    },
    caveat: (
      <>
        One assumption stated plainly: the model is zero-order — time is amount over rate, and the
        rate does not depend on how much is left. Real intellectual work is closer to first-order,
        which is the familiar business of the last tenth taking most of the time. Amdahl is
        optimistic about finishing, and everything built on it here inherits that.
      </>
    ),
  },

  battery: {
    kicker: 'Your battery, today',
    reserve: 'RESERVE',
    leftToday: (hours) => `${hours} of dense work left before the threshold.`,
    overBy: (hours) => `You are ${hours} past it. Everything after this is on reserve.`,
    capacity: 'Capacity at this drain',
    drawnToday: 'Drawn today',
    caption: (threshold) => (
      <>
        Capacity is the {threshold}-unit sustainable budget divided by how draining an hour is.
        Raise the drain and the day gets shorter, the same way a heavy process shortens a laptop
        afternoon — the battery has not changed, the load has.
      </>
    ),
    lead: (
      <p className="mb-5 max-w-[62ch]">
        Your laptop has a better model of its own energy than you have of yours. It measures
        continuously, displays without being asked, warns at thresholds, and finally enforces a
        stop. You do none of those four things for yourself, and the machine does all of them for a
        resource that matters less.
      </p>
    ),
    health: {
      title: 'Charge is not the same as health',
      body: (
        <>
          <p className="mb-4">
            A battery has two numbers, and only one of them is on the menu bar. Charge comes back
            overnight. <strong className="font-semibold">Health</strong> does not: deep-cycle a cell
            often enough and its maximum capacity falls, permanently, and no amount of charging
            brings it back.
          </p>
          <p className="mb-4">
            That is the distinction the exhaustion research is making. A tired week is charge. What
            Maslach measures is health — the capacity itself coming down. Which is the reason not to
            run to zero even on the days you can: the cost is not tonight, it is the ceiling next
            year.
          </p>
        </>
      ),
    },
    build: {
      title: 'Building one on a Mac',
      body: (
        <p className="mb-3">
          There is no gauge for this, so it has to be assembled out of parts that already exist. The
          honest version costs about twenty minutes to set up and needs no application.
        </p>
      ),
      bullets: [
        <>
          A <em>Shortcuts</em> automation at your start time sets a countdown for the capacity above
          — not for the length of your day, for the length your drain affords.
        </>,
        <>
          A menu-bar timer showing it, because a figure you have to open something to see is a
          figure you will not see. This is the display the laptop gives you for free and you do not
          have.
        </>,
        <>
          At zero, a scheduled <em>Focus</em> ends the work block and Downtime starts. Not a
          notification — the thing the machine does at 0%, which is stop.
        </>,
        <>
          The charger is time away, and it has to cost time. If topping up is a button, you have
          rebuilt <strong>Ignore Limit</strong>, and the page has already explained what that
          teaches you.
        </>,
      ],
    },
    honest: (
      <>
        <strong className="text-ink font-semibold">Where the metaphor lies.</strong> A battery
        discharges roughly linearly and recharges quickly. Fatigue does neither: the eleventh hour
        costs more than the first, and recovery is slower than expenditure and never quite complete.
        A faithful gauge would drain faster as it emptied and refill more slowly than it drained. Do
        not read the symmetry as a promise.
      </>
    ),
  },

  macos: {
    designator: 'What to change',
    title: 'The one number you can actually move',
    sub: "Of the five settings on this page, four are somebody else's. How much of your work the tool can reach depends on how the work is organised. How fast it goes is the vendor's roadmap. How much you have to check is the model's reliability. Only one is set by how you arrange your own day.",
    lead: (
      <p className="mb-5 max-w-[62ch]">
        That one is <strong className="font-semibold">drain</strong> — what an hour of this work
        costs you. And it is not a mood. It is made of specific, boring things: how often you are
        interrupted, how long a session runs before you stand up, how many agent threads you are
        holding at once, and whether you slept. Every one of those is configurable on the machine
        in front of you.
      </p>
    ),
    whereYouAre: {
      kicker: 'Where you are',
      sentence: ({ density, breakEven, gap, below, loadWith, loadWithout }) => (
        <>
          You have drain at <Live>{density}</Live>. On your other settings the tipping point sits at{' '}
          <Live>{breakEven}</Live> — the drain at which a shorter day starts costing more than the
          long one did.{' '}
          {below ? (
            <>
              You are under it by <Live>{gap}</Live>. What follows is about keeping it that way when
              the week gets busy.
            </>
          ) : (
            <>
              You are over it by <Live>{gap}</Live>, which is why the instrument says your day is
              shorter and heavier: {loadWith} units of strain against {loadWithout}. Nothing below
              changes what the tool does. It changes what the hours cost.
            </>
          )}
        </>
      ),
    },
    ambition: (
      <p className="mb-5 max-w-[62ch]">
        Which is the honest claim for everything that follows: none of it makes you faster, and none
        of it is a productivity system. It defends the conditions that decide whether the density is
        survivable — a real stop signal, a block nobody interrupts, and sleep. That is the whole of
        the ambition, and it is worth being clear that it is a small one.
      </p>
    ),
    principle: (
      <>
        Guiding principle: no time limit on work tools. VS Code, terminal, Claude Code, video calls.
        A counter on those teaches you to click <strong>Ignore Limit</strong> several times a day —
        and therefore to dismiss the alerts that do matter. Only limit what you are happy to see
        stop.
      </>
    ),
    measure: {
      title: 'Start by measuring, not blocking',
      sub: 'Give it a week before you restrict anything. The report will name the two or three sites that actually deserve a limit, and it is rarely the ones you would have guessed.',
      path: 'System Settings › Screen Time › App & Website Activity',
      body: <p className="mb-3">The rest of the options only appear once this switch is on.</p>,
    },
    schedule: {
      title: 'Per-app schedule',
      sub: 'Four regimes. The right setting is the one you are not working around a week later.',
      hideUnlimited: 'Hide everything that is not limited',
      columns: { app: 'App, site or signal', mechanism: 'Mechanism', threshold: 'Threshold' },
      budget: 'Daily distraction budget',
      budgetNote:
        'Sum of the usage limits, stop signals excluded. Past 1 h 30 min the constraint stops biting; below 30 min it gets worked around.',
      safari: (
        <>
          Screen Time only tracks and blocks websites in Safari. Under Chrome, Arc or Firefox,
          per-URL limits do not hold: you need a blocking extension on the browser side, or move
          leisure browsing to Safari — which has the side benefit of physically separating industry
          reading from drift.
        </>
      ),
    },
    downtime: {
      title: 'Downtime',
      sub: 'The highest-yield setting of the lot: it protects sleep, therefore recovery, therefore everything else.',
      path: 'Screen Time › Downtime · then › Always Allowed',
      bullets: [
        <>
          Start 1 h to 1 h 30 min before bed. Schedule: <em>Every Day</em>, or <em>Custom</em> for a
          day-by-day time.
        </>,
        <>
          A warning 30 min ahead, via <em>Shortcuts</em>: an unannounced cut-off is resented, and
          gets bypassed.
        </>,
        <>
          Under <em>Always Allowed</em>, keep only Messages and Phone. No browser, no terminal.
        </>,
        <>Weekends: a different schedule rather than switching it off.</>,
      ],
    },
    appLimits: {
      title: 'App Limits',
      path: 'Screen Time › App Limits › Add Limit · Every Day / Custom options · Edit Apps',
      body: (
        <p className="mb-3">
          A limit can target an app, a whole category (<em>Social</em>, <em>Entertainment</em>…), or
          a site entered by URL under <em>Websites</em>, at the bottom of the list. For sites, prefer
          the URL to the category: it is more precise and avoids false positives on your own tools.
        </p>
      ),
    },
    focus: {
      title: 'Focus',
      sub: 'The real lever against fragmentation, independent of Screen Time.',
      path: 'System Settings › Focus › (+) · then Focus Filters',
      deepWork: {
        title: 'Deep work',
        bullets: [
          <>
            Two scheduled blocks, say 9–11 and 14–16. Scheduled, never triggered by hand: anything
            that requires initiative at the critical moment fails.
          </>,
          <>
            No notifications except calls from a designated contact (<em>Allow Notifications From</em>
            ).
          </>,
          <>
            <em>Focus Filters</em>: non-essential Slack channels hidden, secondary mailboxes hidden,
            a dedicated browser profile.
          </>,
          <>
            Badges off: <em>System Settings › Notifications › [app] › Badge app icon</em>.
          </>,
          <>The end of the block matters more than its start: schedule the automatic cut-off.</>,
        ],
      },
      calls: { title: 'Calls', body: <p className="mb-3">Notifications off, a clean screen share.</p> },
      reading: {
        title: 'Reading',
        body: (
          <p className="mb-3">
            The inverse: browser allowed, IDE and agents off. Without it, a reading session drifts
            into code within ten minutes.
          </p>
        ),
      },
    },
    breaks: {
      title: 'Breaks and stop signals',
      sub: 'macOS has no built-in timer. This is the most important item on the page if hyperfocus is your natural slope.',
      bullets: [
        <>
          A <em>Shortcuts</em> automation at a fixed time: an alert, or a screen lock.
        </>,
        <>
          Or Stretchly (open source) / Time Out: a micro-break every 20 min, a long break every hour.
        </>,
        <>
          An ambient time cue — a menu-bar countdown, or a physical disc timer. A clock you have to
          remember to check is useless.
        </>,
        <>
          Repeating bodily reminders to drink and eat. Hunger is the first signal concentration
          overrides.
        </>,
        <>One agent session at a time. Three in parallel multiply the load, not the output.</>,
      ],
    },
    teeth: {
      title: 'Giving it teeth',
      path: 'Screen Time › Lock Screen Time Settings',
      body: (
        <p className="mb-3">
          A passcode is then required to reach the settings and to grant extra time when a limit
          expires. Generate it at random and file it in your password manager: the delay in getting
          to it breaks the impulse without locking you out.
        </p>
      ),
      warning: (
        <>
          None of these settings touch the workload assigned to you, the vagueness of what is
          expected, or unsupported ADHD — the three causes that recur most in repeated burnout.
          Tooling cushions; it does not treat. Occupational health services are free, available at
          your own initiative, and covered by medical confidentiality.
        </>
      ),
    },
    footnote:
      "Menu labels taken from macOS Tahoe 26 in English. They move between versions; when in doubt, Apple's own documentation wins.",
    rows: {
      editors: { name: 'VS Code, terminal, iTerm2', why: 'A work tool. A counter here trains you to ignore every alert.' },
      calls: { name: 'Zoom, Meet, Teams (calls)', why: 'Endured, not chosen. Handled by the calendar.' },
      chat: { name: 'Slack, Teams (chat)', why: 'Deliver Quietly, badges off. Never a counter.' },
      mail: { name: 'Mail, Outlook', why: 'Secondary mailboxes hidden. Batched two or three times a day.' },
      messages: { name: 'Messages, Phone', why: 'Stay reachable during Downtime.' },
      browsers: { name: 'Safari, Chrome, Arc', why: 'The browser is a work tool. Limit the sites, not the app.' },
      music: { name: 'Spotify, Music', why: 'Background audio, no attentional cost.' },
      social: { name: 'X, Reddit, LinkedIn', why: 'Social category or URL. The single highest-yield cut.' },
      aggregators: { name: 'Hacker News, aggregators', why: 'Industry reading passes for work. It is not.' },
      video: { name: 'YouTube, Twitch', why: 'Tutorials included: the video format dilates time.' },
      news: { name: 'News sites', why: 'By URL rather than by category, more reliable.' },
      shortform: { name: 'Instagram, TikTok', why: 'The only ones where a low limit genuinely holds.' },
      games: { name: 'Steam, games', why: 'A schedule rather than a quota: the problem is the hour, not the duration.' },
      seated: { name: 'Session without standing up', why: 'A repeating audible alert, not a silent notification.' },
      block: { name: 'Block of dense work', why: 'Automatic start AND end. The cut-off is the setting that matters.' },
      hydration: { name: 'Drink and eat reminder', why: 'Hunger is the first signal hyperfocus overrides.' },
      warning: { name: 'Warning before Downtime', why: 'An announced transition is respected; an abrupt cut-off is bypassed.' },
      agents: { name: 'Simultaneous agent sessions', why: 'One only. Three parallel threads multiply the load, not the output.' },
    },
    mechanisms: {
      none: 'None',
      callsFocus: 'Calls Focus',
      notifications: 'Notifications',
      focusFilters: 'Focus Filters',
      alwaysAllowed: 'Always Allowed',
      appLimitsUrl: 'App Limits (URL)',
      appLimitsDowntime: 'App Limits + Downtime',
      downtime: 'Downtime',
      stopSignal: 'Stop signal',
      scheduledFocus: 'Scheduled Focus',
      shortcuts: 'Shortcuts',
      personalRule: 'Personal rule',
    },
    regimes: {
      relaxed: { label: 'Relaxed', note: 'For a quiet stretch, or to start without putting your back up. The constraint is mostly a marker.' },
      standard: { label: 'Standard', note: 'A reasonable starting point for an ordinary working week.' },
      strict: { label: 'Strict', note: 'A recovery phase, or the return after an episode of exhaustion. Sustainable for a few weeks, not indefinitely.' },
      hyperfocus: { label: 'Hyperfocus', note: 'Distraction quotas loosen, stop signals tighten. The risk is not losing three hours on Reddit, it is the eleven-hour session without a drink.' },
    },
  },

  research: {
    cards: {
      jevons: {
        title: 'The Jevons paradox',
        body: 'Make something cheaper to use and total consumption of it goes up, not down. Jevons noticed it about coal: more efficient steam engines led Britain to burn far more coal, not less. The pattern has held up since for energy and for transport.',
        so: 'Applied to attention: making code cheaper to produce leads to more code being produced. It does not lead to shorter days.',
      },
      yerkes: {
        title: 'The inverted-U curve',
        body: 'The familiar claim that performance rises with pressure up to a point and falls off after it. Handle with care. The original experiment was on mice, on very simple tasks, and a century of popular retelling has stretched it far past anything the evidence supports.',
        so: 'Useful as a picture, not as a measurement. Nobody can tell you where your own optimum sits, and it is not the same from one day to the next.',
      },
      roy: {
        title: 'Output restriction, and the ratchet',
        body: 'A sociologist took a job in a Chicago machine shop and recorded what he saw. Workers paid by the piece capped their own output collectively, because an exceptional week caused the rate to be revised down — making every week after it worse. Peak performance became the new expectation; the expectation never came back down.',
        so: 'Holding back only works if everyone does it. On your own, you lose standing relative to your colleagues without slowing the ratchet by any measurable amount.',
      },
      parkinson: {
        title: "Parkinson's law",
        body: 'Work expands to fill the time available for it. Written as satire about the British civil service, and repeatedly recognisable since. One useful corollary: a short deadline damages quality less than people fear, because most of what it removes is hesitation.',
        so: 'The argument against measuring a day by how long you were present. Filling the hours does not produce more work — it produces the same work, more thinly spread.',
      },
      little: {
        title: "Little's law",
        body: 'A queueing result: the number of things in progress equals how fast they arrive multiplied by how long each one takes to get through. Turn it around and it says that if you are getting through work at a given rate, cutting the number of things you have open shortens how long each one takes, proportionally.',
        so: 'The only argument for "one thing at a time" that is quantitative rather than motivational. It rests on no assumption about psychology whatsoever.',
      },
      amdahl: {
        title: "Amdahl's law",
        body: 'Speed up one part of a job and the rest of the job carries on exactly as before. So the gain across the whole job is capped by whatever you did not speed up — and no amount of extra power moves that cap. Amdahl was arguing about processors; the reasoning holds for any task made of parts.',
        so: 'If six hours in ten are assistable, you will never do better than 2.5 times, even with a tool of unlimited speed. Widening what the tool can reach is worth more than making it faster.',
      },
      illich: {
        title: 'Counterproductivity',
        body: 'Illich argued that tools have a threshold past which they start producing the opposite of what they were built for. His example: count the hours you work to pay for a car, add them to the hours you spend driving it, and the car turns out to move you more slowly than a bicycle.',
        so: 'The question worth asking about a productivity tool is therefore not whether it saves time. It is where its turning point sits, and whether you are on the near side of it.',
      },
      goodhart: {
        title: "Goodhart's law",
        body: 'Once a measurement becomes a target, it stops being a good measurement — because everybody starts optimising for the number rather than the thing the number was standing in for. Goodhart was writing about monetary policy; the anthropologist Marilyn Strathern gave it the phrasing everyone now quotes.',
        so: 'Any productivity signal you make visible will eventually be optimised, by you or against you. Which is a strong argument for converting a saving into things nobody counts.',
      },
      brooks: {
        title: "Brooks's law",
        body: 'Adding people to a late software project makes it later. The reason is that the cost of keeping everyone in sync grows faster than the capacity each new person brings.',
        so: 'The same applies to running several agent sessions at once. Three parallel threads are three things to hold in your head, and that coordination cost is paid by you, not by the machine.',
      },
      burnout: {
        title: 'What actually causes burnout',
        body: 'Three research programmes that arrive at compatible answers. Strain comes from heavy demands combined with little control over how you meet them (Karasek); from a long-running mismatch between what you put in and what you get back, including recognition and job security (Siegrist). Burnout itself shows up along three axes: exhaustion, cynicism, and a sense of being ineffective (Maslach).',
        so: 'Not one of those variables is a number of hours. A heavy workload that you chose, that is recognised, and that has clear edges is far less damaging than a middling one under expectations nobody will state.',
      },
      gustafson: {
        title: "Gustafson's law",
        body: 'The rebuttal, twenty years later. In practice nobody holds a job the same size in order to finish early — they take on a bigger job in the same time. Once that is what happens, the cap stops being the thing that limits you.',
        so: 'This is the ratchet, written as arithmetic. Choosing between the two laws is not a technical question: it is whether the saving buys you an earlier finish or a larger workload.',
      },
      leroy: {
        title: 'Attention residue',
        body: 'When you switch tasks, part of your attention stays behind on the previous one — especially if you left it unfinished. Leroy showed the effect is measurable: performance on the new task is worse, and stays worse for a while.',
        so: 'The cost of an interruption is not the length of the interruption. It is the stretch of degraded work afterwards. Compare the Zeigarnik effect from 1927: unfinished things keep coming back to mind.',
      },
      acemoglu: {
        title: 'Power and Progress',
        body: 'A thousand years of technological change, and the finding that runs through all of it: new technology does not automatically make everybody better off. Whether the gains are shared or captured depends on who holds the bargaining power when the technology arrives — the medieval windmill enriched the abbots, and the first century of industrial machinery lowered living standards before it raised them.',
        so: 'The book-length version of the last question on this page. Which way your own saving goes is not settled by how good the tool is. It is settled by the arrangement you are working under, and arrangements are made by people.',
      },
      economicIndex: {
        title: 'Measuring the reach, at last',
        body: 'The only public attempt to put a number on the parameter this page turns on. Anthropic samples its own Claude.ai conversations and API traffic, maps them onto occupational tasks, and splits them into augmentation — where the person keeps the decisions — and automation, where the work is handed over whole. The January 2026 report put that split at 52% against 45%.',
        so: 'Read it as the best available estimate of reach and nothing more. It is a vendor measuring its own product, it sees only Claude, and it observes conversations rather than what happened to anybody\'s job afterwards — limitations its authors state plainly.',
      },
    },
    designator: 'The research',
    title: 'Where all of this comes from',
    sub: (count, from, to) =>
      `${count} findings, in the order they were published — from a book about British coal in ${from} to a psychology paper in ${to}. Two of them are what the instrument actually computes. The rest are here to explain why the numbers on their own are not enough, and in two cases why they should be treated carefully.`,
    inInstrument: 'In the instrument',
    here: 'Here',
    to: 'to',
    caveat: (
      <>
        These references are given so you can go and read the originals, not as proof. Several are
        models or single field studies rather than laws in the physical sense, and two of them —
        the inverted-U curve especially — have been generalised far beyond what their evidence
        supports.
      </>
    ),
    portraits: (
      <>
        <strong className="text-ink font-semibold">Portraits.</strong> Served by Wikimedia Commons,
        not by this site, and used under the licence each file carries. Where Wikipedia has no
        freely-licensed picture the plate shows initials instead.
      </>
    ),
  },
};
