# Blockx

A mobile app that turns each day into purpose-defined blocks of time.

Most trackers ask *what did you do?* — and give you back a pie chart of
activities. Blockx asks *what was it for?*, and keeps that answer attached to
the block for as long as the block exists.

## The reframe

The category isn't the activity. It's the purpose:

```
WORK        earning money
LEARNING    self-improvement          ← design practice lives here
SOCIAL      relationships
```

Not "coding" but *earning*. Not "reading" but *self-improvement*. Not "dinner
with friends" but *relationships*. Same hours, different question, and the
second question is the one that actually tells you whether the year is going
the way you wanted.

This is the whole product. Everything else is in service of keeping the *why*
visible instead of letting it decay into a list of tasks.

## The second axis: quality

An hour is not an hour. Three hours of work at half-attention is not three
hours, and every tracker that reports it as three hours is lying to you in a
way that feels like progress.

So a block carries a focus rating alongside its duration. Two axes, kept
separate — **how long** and **how well**. They are never multiplied into a
single "effective hours" score, because that invents a precision neither number
has. You see the hours, and you see the quality distribution underneath them.

## Scale

Blocks roll up: day, week, month, year. The day is where you log; the longer
ranges are where the point lands. A week of blocks is a status report. A year
of blocks is an answer to a question you can't ask any other way.

Goal spend reads off the same data — time toward a goal, accumulated across
whatever range you're looking at.

## Design direction

**Terminal aesthetic**, continuous with [Cadence](https://github.com/sbabb/cadence),
which already has the system worth inheriting:

- Published IDE palettes people recognize by sight — Tokyo Night, Nord,
  Catppuccin Latte — plus a neutral. Never hand-mixed.
- Sharp corners. No radius, no shadows, no gradients, no blur. Flat, always.
- Borders carry state; background fills are for grouping, never status.
- Color always pairs with a number or a word. It never carries meaning alone.
- Every color comes from a token. A literal hex downstream is a color that will
  be wrong in four themes out of five — and `verify-themes.mjs` checks contrast
  by arithmetic rather than by eye.

**Motion is high priority, and deliberately placed.** Cadence's `motion.js`
is the model: a single data table of named moments with durations and bezier
curves, readable in one screen, retypeable into Rive. Motion earns specific
moments rather than being sprayed across every transition.

## What it deliberately isn't

Blockx intentionally does less than other tracking apps, because the ones that
do more are the ones people abandon in week two.

- **No live timer.** No stopwatch to forget to stop.
- **No minute precision.** Coarse blocks. Granularity from memory is fiction
  with a decimal point.
- **No clients, projects, or invoices.** The output is self-knowledge, not a bill.
- **No automatic capture.** No app monitoring, no calendar scraping. Deciding
  what the last two hours were *for* is the part that does the work.
- **No streaks or badges.** A missed day is data, not a failure state.

## Proposals — mine, not yet decided

Flagged separately so they don't get mistaken for settled concept:

- **Quality as texture, not multiplier.** On a goal-progress bar, show hours as
  length and focus as fill treatment. Keeps "color pairs with a number" intact
  and avoids a fake composite score.
- **The scale transition is the motion moment.** Day → week → month → year
  zoom-out is the emotional payoff and the one animation worth building
  properly in Rive. Logging a block is the second.
- **Substitution reporting.** Salvaged from an earlier draft: when a purpose
  comes up short over a range, name where the time went instead ("learning lost
  6h to work this week") rather than reporting a percentage.

## Open questions

- **Does planning survive at all?** An earlier draft was built on plan-vs-actual.
  The concept as stated is purely retrospective, and "do less" argues against
  adding a planning layer. Undecided.
- **Platform.** Native (React Native / Expo) or PWA? Cadence is a Vite PWA with
  keyboard-inset and tap-press handling, so it already behaves on mobile.
- **Are purposes fixed or user-defined?** A small fixed set keeps rollups
  legible across years; user-defined makes it personal. Renaming may be the
  middle.
- **Focus rating scale.** 3 points or 5? Fewer is faster to log, which matters
  more here than resolution.
- **What logging actually looks like.** The central design problem. Painting a
  timeline is a desktop gesture; mobile likely wants something else.

## Status

Concept settled. Design in progress. Nothing implemented.
