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
    loop: {
      title: 'Why there are two ceilings',
      body: (
        <>
          <p>
            Checking measures what came out and sends part of it back to be done again. That is a
            feedback loop, and the model can be written in a loop's own notation without changing a
            symbol: with A the gain before checking,
          </p>
        </>
      ),
      openLoop: 'Before checking',
      closedLoop: 'What you get',
      feedbackCeiling: 'Limit of the loop, 1/r',
      consequence: (
        <>
          <p>
            Which produces the result every control engineer knows: once the forward gain is large,
            the output stops depending on it and is set by the return path alone. Make the assistant
            arbitrarily fast and you converge on 1/r — a ceiling with nothing to do with Amdahl.
          </p>
          <p>
            So there are two limits on the same quantity, from two unrelated causes, and the smaller
            is the one you live under. At a wide reach it is this one.
          </p>
        </>
      ),
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
    title: 'The same day, read as a reaction',
    sub: 'Work that advances, a step you speed up, a correction that undoes part of it, and a person who can only check so much. Chemistry has had the arithmetic for that since before computers existed.',
    lead: (
      <p>
        Some of what follows is a comparison. Two pieces of it are not: the formulas match, and the
        conclusions chemists draw from them apply here unchanged.
      </p>
    ),
    limiting: {
      title: 'The slowest step sets the pace',
      body: (
        <>
          <p>
            Make a reaction in two steps and speed up only the first. Nothing changes, because the
            second one was always the one keeping you waiting. Chemists call it the rate-limiting
            step, and the arithmetic is the one on the walkthrough: time in each step, added
            together.
          </p>
          <p>
            Which is why a better catalyst can be worth nothing at all. If the reagent is not
            arriving at the surface fast enough, making the surface more reactive changes nothing —
            the reaction is waiting on transport, not on chemistry. The meeting is the transport
            step.
          </p>
          <p>
            One number tells you which case you are in: the time in the assisted step divided by the
            time in the step the tool cannot touch.
          </p>
        </>
      ),
    },
    damkohler: {
      kicker: 'Which step is limiting',
      reachLimited: (
        <>
          Under 1, the untouched step takes longer than the assisted one. You are waiting on
          transport. A faster model is a better catalyst on a reaction that is already waiting for
          something else, and <strong className="font-semibold">only reach pays</strong>.
        </>
      ),
      speedLimited: (
        <>
          Over 1, the assisted step still takes longer than everything else combined.{' '}
          <strong className="font-semibold">Speed is genuinely worth buying</strong> — until this
          number falls back under 1, which buying speed will do.
        </>
      ),
    },
    catalyst: {
      title: 'The tool is a catalyst',
      body: (
        <>
          <p>
            A catalyst lowers the barrier for a specific reaction, leaves the others alone, and is
            not consumed. All three hold. What matters is the second: catalysts are picky. There is
            no such thing as one that accelerates everything in the flask, which is the whole of why
            reach is a number below 1.
          </p>
          <p>
            And a fourth property, the one worth carrying away:{' '}
            <strong className="font-semibold">a catalyst does not move the equilibrium.</strong> It
            gets you to the same place sooner. Whether the same place is where you wanted to be is
            not a question chemistry can answer.
          </p>
        </>
      ),
    },
    reversible: {
      title: 'Part of it runs backwards',
      body: (
        <>
          <p>
            Few reactions go only one way. Product turns back into reagent, and the more product
            there is, the faster it does — the reverse rate depends on how much you have made.
          </p>
          <p>
            That is exactly the shape of the checking term. It is not proportional to the work; it
            is proportional to the time you saved, which is why saving more creates more of it. Set
            it to 1 and forward and reverse cancel: the net advance is nil, and nothing is being
            produced however fast the reaction runs. Chemists call that equilibrium. On the
            walkthrough it is the point where the gain disappears.
          </p>
        </>
      ),
    },
    saturation: {
      title: 'The reviewer saturates',
      body: (
        <>
          <p>
            Here is where the model on the other tabs is wrong, and it is worth being precise about
            how.
          </p>
          <p>
            It treats checking as a fixed share: twice the output, twice the checking, forever. That
            holds while you are far from your own limit and stops holding at it. Enzymes do the same
            thing — the reaction rate climbs with substrate right up until every enzyme is busy, and
            then it stops climbing no matter how much you add. The rest queues.
          </p>
          <p>
            <strong className="font-semibold">You are the enzyme.</strong> There is one of you, your
            reading speed is what it is, and an assistant that produces faster does not make you
            read faster. This, rather than anything about coordination, is why three sessions at
            once triple nothing.
          </p>
        </>
      ),
      alt: 'Gain against speed, with checking as a fixed share and with checking saturating.',
      xAxis: 'Speed-up on the assisted share',
      constantLine: 'Checking as a fixed share — what the instrument computes',
      saturatedLine: 'Checking that saturates',
      turnoverMark: 'turnover',
      turnover: (speed) => (
        <>
          <strong className="text-ink font-semibold">At your reach the curve turns over.</strong> It
          peaks near {speed} and falls after it. Past that point a faster assistant makes your day{' '}
          <em>longer</em>: it fills a queue that cannot drain any quicker, and you spend the
          difference reading.
        </>
      ),
      noTurnover: (ceiling) => (
        <>
          <strong className="text-ink font-semibold">At your reach the curve does not turn over.</strong>{' '}
          Output never grows fast enough to swamp you, so saturation only lowers the ceiling — to
          about {ceiling}. Widen reach and a turnover appears.
        </>
      ),
      consequence: (k) => (
        <>
          <p>
            The turnover moves towards you as reach widens. More of your work assisted means more
            output per hour, and the same person reading it.
          </p>
          <p>
            That is awkward, because the walkthrough spends six questions arguing that reach is the
            number worth moving. Both are true. Widening reach raises the ceiling and brings the
            turnover closer, and which of the two you meet first depends on whether you also raised
            what you can absorb.
          </p>
          <p>
            <strong className="text-ink font-semibold">Read the shape, not the number.</strong> The
            saturation constant is set to {k} here and nothing measures it. Where your own turnover
            sits is not something this page knows.
          </p>
        </>
      ),
    },
    order: {
      title: 'The model assumes a constant rate',
      body: (
        <>
          <p>
            Divide the work by the speed and you get the time. That is the arithmetic everywhere on
            this site, and it contains an assumption: that the work goes at the same rate from the
            first hour to the last, however much is left.
          </p>
          <p>
            Reactions rarely behave that way. Most slow down as the reagent runs out — the rate
            depends on what remains, so the last of it takes disproportionately long. Anyone who has
            watched a task sit at ninety per cent complete for two days has met the same curve.
          </p>
          <p>
            So every figure here is the optimistic branch. Not by a factor you can correct for —
            just optimistic, and worth remembering when the numbers feel generous.
          </p>
        </>
      ),
    },
    breaks: {
      title: 'Where the chemistry stops helping',
      body: (
        <>
          <p>
            The ratchet has a cousin: autocatalysis, where the product speeds up its own formation.
            The mechanism is the same — output raises expectations, which demand output — and for a
            while the comparison is exact.
          </p>
          <p>
            Then it fails, for a reason that says something. An autocatalytic reaction stops. It runs
            out of reagent, because matter is conserved and there is only ever so much in the flask.
            Expectations are not made of anything. Nothing is conserved, so nothing runs out, and the
            reaction has no natural end.
          </p>
          <p>
            Le Chatelier is the other place it breaks. Put a system under strain and it shifts to
            relieve it — that is what equilibrium means. Show that you can work faster and the strain
            does not relieve, it increases. No reaction does that, which is why the sources for the
            last question on the walkthrough are a sociologist and an economist, not a chemist.
          </p>
        </>
      ),
    },
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

  quota: {
    title: 'The other way to ration: a week at a time',
    lead: (
      <p className="mb-5 max-w-[62ch]">
        The tool that started all this rations itself, and it does it with two limits rather than
        one. There is a short window — a few hours, sliding forward from your first message — that
        caps how hard you can go at once. And there is a weekly total, reset every seven days, that
        caps how much you can spend altogether. Hitting one does not touch the other.
      </p>
    ),
    kicker: 'Your week, at this pace',
    ration: 'Ration for the week',
    drawn: 'Spent, five days like this',
    rationMark: 'ration',
    burstKicker: 'The longest day the week still affords',
    banked: (hours) => `${hours} more than an ordinary day. That is what the light days bought.`,
    borrowed: (hours) => `${hours} short of an ordinary day. The week is already lending to itself.`,
    noBurst: 'None — four days at this pace spend the week.',
    caption: (days) => (
      <>
        {days} working days, each at the drain set on the instrument. The ticks are the days; the
        brass line is where the week was meant to stop. Nothing here carries over from last week,
        which is the point of the section below.
      </>
    ),
    twoLimits: {
      title: 'Why two limits and not one',
      body: (
        <>
          <p className="mb-4">
            They protect different things. The short window protects capacity at a moment: however
            much there is to go round, only so much of it exists at once. The weekly total protects
            the cost of the whole thing, which is a different quantity and can be blown without ever
            touching the first.
          </p>
          <p className="mb-4">
            You already own this distinction, in the wall behind you. The breaker limits how much
            you may draw at any instant. The bill counts what you drew over a month. You can trip
            the breaker having used almost nothing, and you can run up a large bill without ever
            tripping it. Two quantities, two protections, and neither substitutes for the other.
          </p>
          <p className="mb-4">
            Read the gauge above that way. The daily capacity is the breaker. The weekly ration is
            the bill. A week can sit comfortably inside its ration and still have been got through
            one ruinous day at a time.
          </p>
        </>
      ),
    },
    bucket: {
      title: 'One mechanism gives you both',
      body: (
        <>
          <p className="mb-4">
            Picture a bucket that refills at a steady rate and holds a fixed amount. Every request
            takes some out. Two behaviours fall out of one object: the refill rate is what you can
            sustain indefinitely, and the depth is how much you may spend in one go after a quiet
            stretch. Rate limiting has a name for this and it is, awkwardly enough, the{' '}
            <strong className="font-semibold">token bucket</strong>.
          </p>
          <p className="mb-4">
            The figure above is the crude version of the same thing. The ration is the depth, and a
            day is a withdrawal. What the bucket adds is that a light day genuinely buys you
            something — which is a claim about your own recovery, and one worth being careful with,
            since it is exactly where the battery already admitted it lies.
          </p>
        </>
      ),
    },
    cliff: {
      title: 'What a reset date does to you',
      body: (
        <>
          <p className="mb-4">
            Here is the failure this design has, and you will recognise it. A ration that does not
            carry over invites you to spend it. Two days left and a quarter of the week unused, and
            the arithmetic quietly suggests you may as well. Money does not do this — an unspent
            euro is still a euro next month — so the instinct we borrow from budgeting misleads us
            here.
          </p>
          <p className="mb-4">
            The same shape turns up wherever a period ends and the balance evaporates: benefit
            accounts spent down in December, and the Sunday that has to be got out of the way
            before Monday. It is not weakness. It is the incentive the reset creates, working
            exactly as designed.
          </p>
          <p className="mb-4">
            The bucket has no reset date, which is why it does not produce this. It fills
            continuously, so there is never a moment at which unspent capacity is about to be lost.
            If you build yourself a ration, build the refilling kind.
          </p>
        </>
      ),
    },
    honest: (
      <>
        <strong className="text-ink font-semibold">The transposition, and its limits.</strong> A
        household budget has the same two tiers — what a single payment may be, and what the month
        may total — and envelope budgeting is the token bucket done by hand. Eating has them too:
        appetite caps the rate, the energy balance caps the total. But notice which of those two is
        enforced by something other than your own resolve, and which is the one people fail at. That
        asymmetry is this whole page in one line, and it is the reason the settings below are set on
        the machine rather than promised to yourself.
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
          expected, or a health matter nobody has looked at — the three causes that recur most in
          repeated burnout.
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
      michaelis: {
        title: 'Where speeding up stops working',
        body: 'An enzyme makes a reaction go faster, but only so far. Pile on more and more of the stuff it works on and the rate stops climbing, because every enzyme molecule is already busy. The ceiling is set by how many there are, not by how much work you bring them. Michaelis and Menten wrote the curve down in 1913, and it is still the first thing anyone is taught about reaction rates.',
        so: 'The arithmetic on this page assumes that checking twice as much output costs exactly twice as much. That holds only while you are nowhere near your own limit. Put this curve in its place, as the reactor does, and the gain stops rising with speed — and past a point starts coming back down.',
      },
      black: {
        title: 'Feeding the output back into the input',
        body: 'Black worked out the idea on the ferry to work in 1927. Take part of what an amplifier produces, subtract it from what goes in, and the whole device becomes stable and predictable — at the cost of most of its raw power. The striking part is what it does to the answer: what comes out stops depending much on the amplifier at all, and depends instead on the fraction you fed back.',
        so: 'Review is a feedback path, which is why the ceiling here is not really about the tool. Make it infinitely fast, give it all of the work, and the gain lands at one divided by the share you check. A quarter checked is four times, and nothing beats it.',
      },
      damkohler: {
        title: 'Which step is the slow one',
        body: 'A chemical engineer comparing two durations: how long the reaction itself takes, against how long it takes to get the ingredients to where the reaction happens. Whichever is longer decides what the reactor produces, and the other one is nearly free. Damköhler compressed the comparison into a single dimensionless number in 1936, and what it tells you is which of the two is worth spending money on.',
        so: 'Below 1, the part the tool never touches dominates and a faster tool changes almost nothing — widen its reach instead. Above 1, speed is still worth buying. The reactor prints the number for the settings you have chosen, which makes it the shortest answer on this page to "which fader do I move?"',
      },
      thaler: {
        title: 'Money in envelopes',
        body: 'A euro is a euro, and it makes no difference which pocket it came out of. People do not behave that way. Thaler showed we sort money into separate mental accounts with their own rules — the same ten euros saved is worth a trip across town on a small purchase and not on a large one — and that budgeting in envelopes is that instinct made deliberate.',
        so: 'It explains why a ration behaves nothing like a wage. An unspent euro is still a euro next month, so refusing to waste it is sound. An unspent ration evaporates on the reset date, and the very same instinct now tells you to spend it while it exists.',
      },
      turner: {
        title: 'The bucket that keeps filling',
        body: 'Networks have to hold traffic to an average without punishing the occasional burst. Turner described the mechanism in 1986: a bucket filling at a steady rate, with each packet taking some out. One object, two limits — the fill rate is what you can keep up indefinitely, the depth is what you may spend at once after a quiet stretch. The token bucket is the same thing turned inside out, and admits exactly the same traffic.',
        so: 'A weekly quota is the crude version of this: a fixed total with a date on it. The bucket has no date, which is the whole reason it never tempts you to empty it before one arrives.',
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
    sub: (count, computed, from, to) =>
      `${count} findings, in the order they were published — from a book about British coal in ${from} to a usage study published in ${to}. ${computed} of them are what this page actually computes. The rest are here to explain why the numbers on their own are not enough, and in three cases why they should be treated carefully.`,
    computed: 'Computed here',
    credits: 'Credits:',
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
