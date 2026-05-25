---
layout: post
title: "Running my life from a git repo"
summary: "A personal assistant that dreams, built from plain old markdown."
---

Andrej Karpathy recently shared a gist about what he calls an [LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f). Instead of retrieving raw documents on every query, you let a language model maintain an interlinked set of markdown files that gets richer as you add to it. It has three layers: immutable raw sources, a model-maintained wiki of summaries, and a schema document that defines how it all works.

His write-up inspired me to write down my own adventures in this space, sharing a personal assistant repo I've been using for a few months.

My version goes a bit further than a wiki. It holds the *operational state* of my actual (non-work) life — ongoing projects, my to-do list, an inbox view of my email, my training — all as plain markdown in a single git repo that Claude Code reads and writes. There's no app and no database, just files and a handful of conventions.

Here's how it works.

## Basic setup

[Claude Code](https://www.anthropic.com/claude-code) and [Cowork](https://claude.com/product/cowork) are the main interfaces.

I talk to it in the terminal, from [the web](https://www.anthropic.com/news/claude-code-on-the-web) on my phone, and — for the scheduled jobs — in GitHub Actions while I'm asleep. And I use Obsidian or VS Code to edit directly or add notes directly.

The repo itself is only a handful of top-level directories:

```
.
├── CLAUDE.md      # entrypoint, loaded every session
├── AGENTS.md      # the operating manual
├── INDEX.md       # map of every active project
├── MEMORY.md      # cross-session notes
├── TODOS.md       # standalone tasks
├── LOG.md         # append-only event log
├── projects/      # one directory per project
├── knowledge/     # the wiki: sources, summaries, topic pages
├── inbox/         # a markdown view of my email
├── thinking/      # longer-form notes, written to think
├── dreams/        # nightly agent observations
└── scripts/       # a few Python and shell helpers
```

`CLAUDE.md` loads automatically at the start of every session and pulls in the rest with Claude Code's `@`-imports:

```markdown
# CLAUDE.md — loaded into context on every session
@AGENTS.md   # the operating manual
@MEMORY.md   # cross-session notes
@TODOS.md    # standalone tasks
```

`AGENTS.md` is the operating manual — how the repo is organised, where things live, how an agent should behave. It opens with the conventions:

```markdown
## Conventions
- All project state lives under `projects/<name>/`
- Every project has an `INDEX.md` as its entrypoint
- Use sentence case for headings
- Keep files concise and scannable
```

A cold agent reads that, then the root `INDEX.md`, and is orientated in seconds.

Git is the backend. It gives me sync across devices, full history, and — crucially — a cheap undo. A bad change is one `git revert` away. A tiny script pulls every 30 seconds while I work at my desk.

Getting to the point here my phone, Claude Code for Web, _and_ the scheduled jobs to sync up without a code review was a bit fiddly, but I've solved it by having PRs auto-merged by dedicated Github Action.

Why markdown and git rather than something purpose-built? Because plain text is legible to *both* of us. I can read it, the model can read it, the diffs make sense, it's portable, and it costs nothing. Boring on purpose.

I don't use the Markdown search tools, like [qmd](https://github.com/tobi/qmd), but I have looked into them.

## Organising myself

Everything is either a **to-do** or a **project**.

A to-do is a handful of steps that doesn't need its own home. It lives in `TODOS.md` as a heading, a one-line goal, and a checklist:

```markdown
### Renew passport
Status: active
Goal: New passport before the September trip

- [x] Find old passport
- [ ] Take photo
- [ ] Submit application
```

A project is something with multiple workstreams or reference material, or that runs for weeks. It gets its own directory with an `INDEX.md` as the entrypoint, plus — as needed — its own memory, log, and knowledge files. Say I'm building a garden studio:

```
projects/garden-studio-2026/
├── INDEX.md              # status, workstreams, links
├── LOG.md                # what's actually happened
└── knowledge/
    └── groundco-quote-2026-04.md   # a summarised quote, with figures
```

The `INDEX.md` would track the workstreams — foundations, electrics, planning permission — each with its own checklist and a link to the quote that backs every number. The root `INDEX.md` links to it, so the whole estate is one click from the front door. A small `new-project` skill scaffolds all of this, so the shape stays consistent whether I set it up or the model does.

Its `INDEX.md` is the entrypoint — status up top, then a section per workstream:

```markdown
---
status: active
---
# Garden studio 2026

## Foundations
- [x] Survey booked — GroundCo, 22 Apr ([quote](knowledge/groundco-quote-2026-04.md))
- [ ] Pour the base

## Electrics
- [ ] Get a quote from Sam
```

### Knowledge management

The knowledge wiki is the part closest to Karpathy's idea. When I read something worth keeping — an article, a talk, a paper — I say "file this", and a skill extracts the content, tags it, summarises it, and indexes it. Topic pages then synthesise *across* sources. File three separate pieces on, say, retrieval-augmented generation and the topic page stitches them into one view that gets more useful each time, rather than three disconnected clippings.

In practice that's one line, usually with a thought attached:

```
> file this https://example.com/talk
  the bit on connection pooling is the real idea
```

The link becomes the entry; my aside becomes its `notes.md`.

Each entry gets its own dated folder. Say I file a conference talk:

```
knowledge/2026/04/scaling-postgres-talk/
├── raw.md      # the cleaned transcript — extracted once, never rewritten
├── INDEX.md    # metadata and a one-line summary, linking to raw.md
└── notes.md    # my own take, only if I added one
```

The skill works out the source type from the URL — article, video, paper, tweet. Then it pulls the content the right way: it fetches a web page and strips it to clean markdown, grabs a YouTube transcript, or downloads and converts a PDF. From that it derives the metadata that makes the entry findable later:

```yaml
---
title: Scaling Postgres to a billion rows
source: https://example.com/talk
type: video
captured: 2026-04-18
tags: [databases, postgres, scaling]
topics: [database-performance]
---
```

It reuses tags I already have where they fit, links the entry to any matching topic page, and writes a one-line summary: the single sentence that tells future-me whether to re-read it, rather than a generic abstract.

Provenance is important: any number, quote, or date links back to the file it came from. A price in a project index links to the quote it's quoted from. Drift between what I've written down and what's actually true would be bad.

## The LOG and other agent-helping features

One very useful convention is `LOG.md` — an append-only log of real-world events that actually happened, rather than a code changelog:

```markdown
## 2026-04
### 2026-04-14
- Booked foundations survey with GroundCo for 22 Apr, £450.
- Spoke to Sam re: studio electrics — will quote next week.

### 2026-04-09
- Half-marathon entry confirmed for 11 October.
```

Newest at the top, one bullet per event. That sounds trivial, but it makes a real difference. Questions like "when did I get that quote?" or "what happened last week?" become answerable in one read. Any agent picking up a thread also has a timeline to orient against.

> I might actually switch this to an _actual_ append-only log, with newest at the bottom. This mean the agent can `head` and `tail` the file for what it needs. Combine this with [dreams](#dreams-and-how-they-keep-the-repo-fresh), and you could regularly append a recap to the log, which gives the model a nice short-term memory with decay.

A few other things earn their keep:

- **Memory.** A `MEMORY.md` at the root and one per project. Cross-session notes — decisions made, preferences discovered, dead ends I don't want to walk into twice. The model writes to it whenever it learns something a future session will need.
- **Frontmatter and a linter.** Persistent files carry a little structured header, and a small Python script checks the structure holds.
- **Skills.** Reusable capabilities I trigger by name — filing knowledge, refreshing the inbox, scaffolding a project, writing to think. Each is just a markdown prompt with a bit of glue.

None of this is clever individually. Together it means an agent that lands cold is useful almost immediately: it reads the manual, the index, and the log, and knows the state of things.

## Daily brief

Every morning at 5:30, a scheduled job reads the whole repo — `TODOS.md`, the root index, the inbox view, and every project's `INDEX.md`. It works out what actually needs my attention that day.

It runs as a GitHub Action: Claude Code in CI, with read access to the repo and permission to file an issue. The prompt is mostly a set of classification rules. Sort every unchecked item into one bucket — today, this week, waiting on me, or skip. Use hard dates where they exist, and drop anything I'm only waiting on someone else for. Then pull any email threads that need a reply.

The rules themselves are blunt:

```
Sort every unchecked item into exactly one bucket — stop at the first match:
  TODAY      — a hard commitment or expiry today
  THIS WEEK  — date-sensitive within 7 days
  WAITING    — my move, no hard date, but relevant soon
  SKIP       — waiting on someone else, or 2+ months away
```

The result is a GitHub issue, posted each morning:

```markdown
## Today
- Foundations survey, 9am — GroundCo arriving on site

## This week
- Half-marathon entry closes Fri (11 Oct race)

## Waiting on you
- Reply to the studio electrician about his quote

## Inbox
- "Re: planning application" — needs-reply (council asked for drawings)
```

That's where [Pushpush](https://pushpush.app) comes in — a little push-notification app I built. It's currently in beta — ping me if you want early access.

The job finishes by sending a notification to my phone: a one-line headline, a short summary, and a tap-through straight to the issue. It sets a priority from the most urgent bucket, so a "today" item buzzes harder than a gentle suggestion.

I read the notification in Pushpush, and open the full brief only if I need the detail.

The payload is tiny:

```json
{
  "topic": "pa-daily",
  "title": "Foundations survey at 9am",
  "message": "Reply to the electrician. Slides for Anne are overdue. RSVP to Becky's party & book somewhere.",
  "priority": 3
}
```

## Routines

This is the part that turns the repo from a notebook into an assistant. A few scheduled Claude Code agents run on their own, do a job, and open a pull request that auto-merges. I wake up to an updated repo.

I have a few running right now, here's a selection:

1. **Inbox refresh, every evening at 9.** It reads my important email and rewrites a set of markdown files, organised by conversation. Each one shows who it's with, the latest message, and a status like `needs-reply` or `waiting`, with the most recent threads first. In the morning, the daily-brief reads it and knows what's open and what's on me, without going near the actual inbox.

2. **Strava sync.** It pulls in my workouts and appends them to a training log, so the fitness picture stays current without me typing anything. The log feeds a separate training plan that can then nudge me — "you've not done a long run in two weeks".

3. **Daily-brief cleanup.** A housekeeping job that keeps only the three most recent daily-brief GitHub issues, so that queue never piles up. Unglamorous, but exactly the kind of thing I'd never remember to do myself.

4. **The dream routine** — which deserves its own section.

The mechanism is the same every time: run in the cloud, branch, commit, open a PR, auto-merge. Because the whole repo is markdown and git, a routine is really just "Claude, do this job and open a pull request." That's the entire trick.

The inbox refresh, for instance, is barely more than:

```
Every evening at 21:00, refresh the inbox view from Gmail
using the inbox-refresh skill, then open a PR. Touch nothing else.
```

## Dreams and how they keep the repo fresh

The dream routine is probably the most interesting and unusual.

It's loosely inspired by what sleep seems to do for us — consolidate memories, prune the unimportant, integrate new experience with old, recombine ideas, and check old beliefs against reality. Each night a routine picks a few "dream types" and hands each one a random slice of the repo. A subagent writes a short report, triages, and immediately makes the most important suggested fixes, which ride along in the same PR.

The reports pile up as dated files, one per dream, next to the prompt that defines each type:

```
dreams/
├── types/                       # one prompt per dream type
│   ├── consolidation.md
│   ├── recombination.md
│   └── …
├── 2026-04-18-1-consolidation.md
└── 2026-04-18-2-recombination.md
```

There are five types. Here's what each *would* turn up, on invented examples:

- **Consolidation** digests the week's log. *"The studio and the half-marathon both slipped their deadlines this week — two commitments quietly drifting at once."*
- **Pruning** hunts for stale files and broken links. *"This to-do hasn't been touched in 90 days and links to a file that no longer exists."*
- **Integration** compares what I've actually been doing against the written conventions. *"You've started keeping a per-project log, but the manual never mentions project logs — want to write that down so it's consistent?"*
- **Reality-check** verifies a few memory entries against the current state. *"Memory says your accountant is one firm, but a note from last week says you switched — one of these is wrong."*
- **Recombination** deliberately collides two unrelated projects to see what falls out. *"Your trip booking locks the date with a deposit, but your home project has no such mechanism and keeps slipping — so borrow the trick."*

A few constraints keep it from going feral. Dreams don't read other dreams, so there's no echo chamber of the same idea amplifying night after night. Each one is time-boxed. And the inputs are sampled at random, because the novelty comes from unexpected juxtapositions rather than me pointing it at the "interesting" files.

The effect is a cheap nightly audit of all the soft layers no test suite ever covers — the conventions, the memory, the prose. It is not all gold; some nights it surfaces noise. I recently reviewed a few weeks of output and made two changes. First, I tuned it to favour the types that earn their keep. Second, I gave it a way to turn a real finding into a tracked to-do, rather than a report nobody re-reads. But more than once it has caught a convention that had quietly drifted, or a fact that had gone stale, and fixed it before I noticed.

## Wrapping up

The whole system is almost no code: markdown, a few Python helpers, a handful of skills, and some routines. No single piece makes it work. The repo is legible to me and the agent at once; git gives me sync, history, and a way to undo.

And, exactly as Karpathy says about the wiki, it has gotten more useful over time: the more it holds, the more useful it is to reason over.

If you'd like to set this up yourself, show this post to your agent. It'll figure it out.
