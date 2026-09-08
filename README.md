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

## Lanes

Purposes are **lanes** — persistent, like git branches. They run through your
timeline whether or not you commit to them, so a lane you haven't touched in
six weeks is visibly quiet rather than absent. That silence is the app's most
valuable output, and a tag-based model literally cannot draw it.

Each lane carries a sentence *you* wrote about why it exists, shown whenever you
log to it. When a lane's stated why stops being true, you find out — because
you read it and flinch.

Lanes are yours to create, capped at five or six. The cap is a feature: if you
can only have five, you have to decide what actually matters. It must be stated
plainly in the UI, never silently enforced — and the number itself is a guess to
test, not a settled fact.

## What a block is

A block is a commit, not a calendar entry: it has a day and a rough size, but no
start or end time. Three size buckets. Precise times would be both slow to enter
and fiction, and they'd drag the app back toward the calendar it exists to avoid.

You log only the blocks that **mattered** — two or three on a normal day. There
is no expectation of covering sixteen hours, because full-day reconstruction is
what kills every retrospective tracker ever built.

One optional free-text line per **day** — never per block, which is how this
would become journalling and die in three weeks. The structure tells you what
the year was; the sentences tell you what it felt like.

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

**Terminal aesthetic**, continuous with [Cadence](https://github.com/sbabb/cadence),
which already has the system to inherit: published IDE palettes (Tokyo Night,
Nord, Catppuccin Latte) rather than hand-mixed ones; sharp corners, no radius,
no shadows or gradients; borders carry state while fills only group; color
always pairs with a number or a word; every color from a token, with contrast
verified by arithmetic rather than by eye.

**Lanes render as a git graph.** Parallel channels running through time, commits
landing on them, dormant branches visibly quiet. It's the right metaphor, it's
natively terminal, and it's built for exactly the problem of making a long
stretch of time legible at a glance.

**Motion is high priority and deliberately placed.** Cadence's `motion.js` is
the model — one readable data table of named moments with durations and bezier
curves, retypeable into Rive. Named moments, not scattered transitions.

## Architecture

- **Local-first, no accounts, no server.** This is also what makes a one-time
  purchase viable: no marginal cost per user means no need for recurring revenue.
- **One web codebase (PWA)** covering desktop and mobile today. Tauri can wrap
  the same codebase into a sellable native desktop binary later.
- **Sync is a stretch goal**, deliberately deferred — and it stays cheap to add
  as long as the data model is a portable file from day one. Cadence's
  export/import is the precedent: that *is* the sync story, with no account and
  no password.

## Open

- The logging interaction. Lane → size → enlarge/diminish is three taps; the
  design question is whether size and valence collapse into one control.
- What the year view actually shows, and at what granularity.
- Where the motion moments land.
- The file format.
- Whether the lane cap is five or six.

## Status

Concept settled through a full grilling pass. Design next. Nothing implemented.
