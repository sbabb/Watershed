# Blockx

A time tracker that only asks you one thing: *was the day you planned the day
you got?*

Not a timer. Not a stopwatch you forget to stop. Not billable hours. Blockx is
a personal attention tool — you block out the day you intend to have, and later
you paint in the day you actually had, on the same timeline. The product is the
space between those two.

## Why not a timer

Timers measure the days you remembered to press the button. That is not a
sample of your life, it's a sample of your discipline, and the two get confused
constantly. A week of timer data flatters you: the tracked hours look focused
because the untracked hours are the ones where you fell apart.

Blockx never runs. At the end of the day you paint the timeline in from memory.
Memory is coarse and slightly wrong, which is fine — you are not billing anyone.
Coarse and complete beats precise and full of holes.

## The part worth reading

The obvious version of this app scores you. Planned six hours of deep work, got
two, here's your 33%. That number is worse than useless for two reasons.

First, it punishes ambition. The way to win is to plan nothing.

Second, and worse, it tells you *that* you failed without telling you *how*.
The two hours did not evaporate. They went somewhere specific.

So Blockx does not report compliance. It reports **substitution** — the named
trade you actually made:

```
Deep work    planned 4h   actual 1h30   -2h30
                                        ↳ 1h45 went to Meetings
                                        ↳   45m went to Email
```

That sentence is the whole product. Not "you were 38% compliant." Rather:
*today, deep work lost two and a half hours to meetings and email.* One is a
grade. The other is a fact you can do something about tomorrow.

## The second idea: plans should learn

If you plan six hours of deep work every day and average two, a tracker that
just keeps recording the gap is a machine for making you feel bad. The gap is
constant. There is no information in it after the third day.

So the plan side pushes back. When you go to block out tomorrow, Blockx knows
what you have actually managed in this category over the last few weeks, and
says so:

> You've planned 6h of deep work daily this week and averaged 2h20.

It does not stop you. It just refuses to let you plan in a vacuum. Over time
your plans converge on your real capacity, and *that* — a plan you can actually
hit — is the outcome, not a higher score.

## What it deliberately isn't

- **No clients, projects, or invoices.** The output is self-knowledge, not a bill.
- **No minute precision.** Blocks snap coarse. Fifteen-minute granularity from
  memory is fiction with a decimal point.
- **No automatic capture.** No app monitoring, no calendar scraping to start
  with. Deciding what the last two hours *were* is the part that does the work.
- **No streaks or badges.** Missing a day is data, not a failure state.

## Status

Early. Concept settled, design in progress. Nothing implemented yet.

## Open questions

Things deliberately not decided yet, because the design work should inform them:

- **Categories.** Fixed small set, or user-defined? A small fixed set makes the
  substitution report legible; user-defined makes it personal. Probably fixed to
  start, with renaming.
- **Granularity.** 30 minutes feels right. 15 is a lie, 60 is too coarse to show
  a substitution.
- **The plan/actual interaction.** Two stacked timelines? One timeline you paint
  over, with the plan showing through underneath? This is the central design
  problem and it gets answered in Figma, not here.
- **Range.** Is there a week view, or is the day the only unit that exists?

## Prior art in this repo's family

[Cadence](https://github.com/sbabb/cadence) — same instinct, applied to money.
One question a day, one honest number back, no feature creep.
