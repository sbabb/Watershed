# Watershed

A record of what your time was *for*.

Not a timer, not a calendar, not a productivity tracker. Watershed asks two
questions about a block of time — **what was it for**, and **did it enlarge you
or diminish you** — and then shows you what those answers look like across a
year.

The name carries both meanings on purpose: the land that drains to one river,
and the turning point.

## The two questions

**What was it for.** Most trackers record the activity. Watershed records the
purpose. Not "coding" but *earning*; not "reading" but *becoming someone*. The
activity is observable and mostly uninteresting. The purpose is the thing you
lose track of.

**Did it enlarge or diminish you.** This is James Hollis's question, and it
replaces the focus rating that every other tracker uses. A focus score measures
output, invites optimization, and turns an app into a second job. Enlarge or
diminish measures meaning, cannot be gamed — there is no direction to push it —
and Hollis's observation is that you know the answer in your body within a
second, before your intellect arrives with reasons.

An hour can be productive and diminishing. That is the most important fact
about a day, and no focus slider can see it.

The answer is **binary**. There is no neutral option, because a neutral option
is where every ambiguous block goes, and a month later most of your data would
sit in a middle value that says nothing — the focus slider rebuilt with fewer
stops. Hollis's framing has no middle either: the hesitation *is* the answer
being uncomfortable, not absent. The escape hatch costs nothing, because you
only log the blocks that mattered — a block that was genuinely neither doesn't
get logged.

## Lanes

Purposes are **lanes** — persistent, like git branches. They run through your
timeline whether or not you commit to them, so a lane you haven't touched in
six weeks is visibly quiet rather than absent. That silence is the app's most
valuable output, and a tag-based model literally cannot draw it.

Each lane carries a sentence *you* wrote about why it exists, shown whenever you
log to it. When a lane's stated why stops being true, you find out — because
you read it and flinch.

Lanes are yours to create, capped at **five**. The cap is a feature: the fifth
cut is the one that does the work, and six is the number you pick when you don't
want to make it. Five is also what fits as parallel channels on a phone. The cap
must be stated plainly in the UI, never silently enforced, and wanting a sixth
lane is a prompt to re-read your why-sentences rather than to raise the cap.

## What a block is

A block is a commit, not a calendar entry: it has a day and a rough size, but no
start or end time. Precise times would be both slow to enter and fiction, and
they'd drag the app back toward the calendar it exists to avoid.

**One lane per block.** A walk with a friend is relationships *or* health, and
choosing is the reflective act. It's also structural: a commit sits on one
branch, multi-lane blocks turn parallel channels into an unreadable mesh, and
"this lane has been quiet" stops meaning anything if a block can count twice.

**Three size buckets, words in the UI and a number underneath.** *A bit* (~1h) /
*half a day* (~4h) / *most of a day* (~8h). Goals accumulate time, so the buckets
have to carry canonical hours internally — but every derived figure is rendered
hedged ("~40 hours"), which is honest about being a reconstruction and stops the
totals reading like a ledger you could be wrong in.

**The buckets are calibrated to a waking day, not a clock hour.** A job is not
six hours; door to door it's closer to twelve, and if the largest bucket were
smaller than a working day then earning would be systematically undercounted
against a lane where a one-hour walk is captured whole — the year view would
then flatter you, which is the exact opposite of what it's for. So the top
bucket is a working day, the middle one is a morning or an evening, and the
commute disappears into the rounding, which is what the tilde is for. Three
stays three: a fourth bucket buys accuracy nobody needs and costs a moment of
deliberation at the one place the design refuses to tax you.

You log only the blocks that **mattered** — two or three on a normal day. There
is no expectation of covering sixteen hours, because full-day reconstruction is
what kills every retrospective tracker ever built.

One optional free-text line per **day** — never per block, which is how this
would become journalling and die in three weeks. The structure tells you what
the year was; the sentences tell you what it felt like.

## Logging

Pick a lane, then one **3×2 grid**: size across, enlarged/diminished down. Two
taps.

Size and valence share a surface but not a control. A single
magnitude-and-direction slider — distance for size, direction for valence —
would render diminishing as a *negative number*, and this app's whole stance is
that a diminishing block is data, not a deficit. The grid keeps both axes
visible at once, and the two valence rows must be visually symmetrical in weight
and color intensity, or the layout smuggles back in the hierarchy the model
refuses. The lane's why-sentence sits above the grid.

**The day rolls at 4am**, because logging at 1am belongs to the day you've been
living, not the one the clock just started.

**You can log today and yesterday. Nothing further back.** No-backfill is
settled as a prompt policy, but reach-back is a separate decision and an open
date picker quietly undoes it: unlimited backfill turns silence into a queue you
can always catch up on, which is the same debt without the nag. One day covers
the real case — asleep before logging Tuesday, remembering it Wednesday. A
three-day trip is unrecoverable and draws as quiet, which is true.

## Goals

A goal is **a lane plus a name plus a date range** — "Ship Watershed, by March"
on the Earning lane. It accumulates that lane's time inside its window
automatically, so logging a block never costs an extra tap and there is no such
thing as an untagged block silently under-reporting a total. A goal is a lens on
data you already have, which means creating or deleting one is non-destructive
and retroactive.

## What it refuses to do

Every item here exists because the alternative is how tracking apps burn people
out:

- **No streaks, scores, or percentages.** Nothing to optimize, so nothing to
  resent.
- **No backfill prompts. Ever.** "You missed 3 days" is a debt with a friendly
  face. A silent day draws as quiet and the app never mentions it.
- **No progress bars on goals.** Goals carry a date for orientation and show
  time *accumulated*, never time remaining or percent complete — a completion
  figure would require knowing a total nobody knows, and a fabricated "23%" on a
  hard day does real harm.
- **No live timer, no auto-capture, no app monitoring.** Deciding what the last
  two hours were *for* is the part that does the work.
- **A diminishing block is data, never a failure state.** No red, no warning, no
  suggestion to improve. Hollis's swamplands: the hard passages aren't
  malfunctions, they're territory with something to say.

## Why not just use a calendar

A calendar records **appointments** — time other people can see and claim. Its
atom is the commitment.

The blocks that mattered most in your life were never on a calendar. The walk.
The bad Tuesday afternoon. The conversation that changed something. A calendar
structurally cannot hold those, has no field for *why* or for *enlarged or
diminished*, and offers no view that makes a year feel like anything. It shows
the future as obligation and the past as residue.

## Design direction

**Mobile-first, year view included.** Logging happens at the end of a day, on a
phone. If the payoff view only worked on a laptop it would be severed from the
act that earns it. Forcing the year view through 390px also keeps its
granularity honest instead of letting an over-dense design hide behind a big
screen. Desktop is the same layout with more air, not a second design.

**Terminal aesthetic**, continuous with [Cadence](https://github.com/sbabb/cadence),
which already has the system to inherit: published IDE palettes (Tokyo Night,
Nord, Slate, Catppuccin Latte) rather than hand-mixed ones; sharp corners, no
radius, no shadows or gradients; borders carry state while fills only group;
color always pairs with a number or a word; every color from a token, with
contrast verified by arithmetic rather than by eye.

**Lanes render as a git graph.** Parallel channels running through time, commits
landing on them, dormant branches visibly quiet. It's the right metaphor, it's
natively terminal, and it's built for exactly the problem of making a long
stretch of time legible at a glance.

**One encoding at both resolutions: fill means enlarged, fade means
diminished.** Size is the mark's footprint, valence is its opacity — never a
second hue, never solid-versus-hollow, which reads as present-versus-absent and
puts a thumb on the scale. Small marks need more alpha than large ones to
survive the dark ground (0.45 at day resolution, 0.32 at week), which is a
rendering detail, not a second rule.

**Two resolutions.** The home screen is the day-resolution graph over recent
weeks, because that's where logging happens. The year view's cell is a **week** —
52 columns at ~7px fits 390px, the same arithmetic as a contribution graph,
where 365 would be eight screen-widths of horizontal scroll. A graph you scroll
can never show "quiet for six weeks" as a single perceived shape, and that
gestalt is the entire output of the year view.

**Motion is high priority and deliberately placed.** Cadence's `motion.js` is
the model — one readable data table of named moments with durations and bezier
curves, retypeable into Rive, with two curve families (expo-out for anything
settling, back-out for anything that should read as impact) and a
`prefers-reduced-motion` guard. Named moments, not scattered transitions.

## Architecture

- **Local-first, no accounts, no server.** This is also what makes a one-time
  purchase viable: no marginal cost per user means no need for recurring revenue.
- **One web codebase (PWA)** covering mobile first and desktop with the same
  layout. Tauri can wrap the same codebase into a sellable native desktop binary
  later.
- **Sync is a stretch goal**, deliberately deferred — and it stays cheap to add
  as long as the data model is a portable file from day one. Cadence's
  export/import is the precedent: a versioned envelope (`app`, `formatVersion`,
  `exportedAt`, `data`) around the payload, with a deliberately strict parser
  that refuses a malformed file at the door and says why. That *is* the sync
  story, with no account and no password.

## Open

Everything left is a visual question that mockups have to answer, not prose:

- Whether the streams run horizontally (time rightward, lanes as rows) or
  vertically (time downward, lanes as rails). Both are drawn.
- Whether the five lanes ship as a prescribed set or as a pick-and-rename menu.
- How the lane + goal screen earns its first read without a progress bar.
- Where the motion moments land, and what they're called.
- The file format's payload shape (the envelope is settled; the body follows the
  model above).

## Status

Concept settled through two grilling passes. Seven artboards drawn; encoding
and bucket calibration settled against them. Nothing implemented.
