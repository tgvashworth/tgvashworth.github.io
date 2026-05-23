---
layout: post
title: "Notes on my AI tools + workflow"
summary: "Vanilla Claude and custom plugins..."
---

*Originally published [on Substack](https://tgvashworth.substack.com/p/notes-on-my-ai-tools-workflow).*

The pace of change in AI continues, unrelenting. This post is an update on how I’m working with AI — mostly Claude — day-to-day.

![](https://substackcdn.com/image/fetch/$s_!J0g_!,w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fd7011814-7e04-4d74-b31d-b7637ddaf668_2752x1536.png)

Just [since the summer](https://substack.com/home/post/p-168630350) the suite of tools available to software engineers has expanded and improved drastically. I still believe strongly in stay grounded through [good fundamentals](https://karpathy.ai/zero-to-hero.html), but it’s getting harder to cut through cacophony of noise excitement and trepidation, FOMO and bluster. Despite all that, there do seem to be genuine step changes in the capabilities of these models arriving almost monthly.

Simon Willion’s recent [Year in LLMs](https://simonwillison.net/2025/Dec/31/the-year-in-llms/) post is much more comprehensive and well-worth a read. Just since August, *just* in Anthropic land, we’ve seen the launch of:

- Claude Opus 4.1 (5 August) — <https://www.anthropic.com/news/claude-opus-4-1>

- Claude for Chrome research preview (26 August) — <https://www.anthropic.com/news/claude-for-chrome>

- Claude Code Plugins (9 October) — <https://www.anthropic.com/news/claude-code-plugins>

- Claude Haiku 4.5 (15 October) — <https://support.claude.com/en/articles/12138966-release-notes>

- Agent Skills (16 October) — <https://www.anthropic.com/news/skills>

- Claude Code on the Web (20 October) — <https://www.anthropic.com/news/claude-code-on-the-web>

- Claude Sonnet 4.5 (29 September) — <https://www.anthropic.com/news/claude-sonnet-4-5>

- Claude Opus 4.5 (24 November) — <https://www.anthropic.com/news/claude-opus-4-5>

- Claude for Chrome expanded to all paid users (December) — <https://support.claude.com/en/articles/12306336-claude-in-chrome-release-notes>

- Skills open standard and partner directory (18 December) — <https://www.anthropic.com/news/skills>

Commensurately, my workflow with Claude has moved on a bit. Quite by accident, it looks quite a bit like Boris Cherny’s approach:

> I'm Boris and I created Claude Code. Lots of people have asked how I use Claude Code, so I wanted to show off my setup a bit.
>
> My setup might be surprisingly vanilla! Claude Code works great out of the box, so I personally don't customize it much. There is no one correct way to…
>
> — Boris Cherny (@bcherny), [2 January 2026](https://x.com/i/status/2007179832300581177)

Beyond being a vanilla VS Code + Claude in the terminal, with multiple checkouts and/or worktress, I too have been building myself some [plugins](https://code.claude.com/docs/en/plugins) for wrapping-up useful functionality, and have integrated voice+images much more into the day-to-day workflow.

Here’s a quick tour…

# Fundamentals

The way I work, per project:

- Multiple checkouts or worktrees

- VS Code as a normal IDE, with AI-driven autocomplete turned on (off for Markdown) using whatever model Copilot decides. I find this useful about 50% of the time. The rest of the time, it’s super annoying.

- One or more Claude Code(s) open in a single worktree or checkout, usually one dedicated to research and the other to writing code, in iTerm2

- Claude Code working away in GitHub actions (see [Hiring Claude](https://substack.com/home/post/p-168630350) for more)

- Claude Code for Web building stuff that is *really* trivial, doing research, or breaking down larger tasks

Claude Code in the terminal works great for me. Maybe one day I’ll move on to Cursor.

# Quick context loading

I’ve found that I quite often want Claude to get familiar with a piece of functionality, and issue, or recent commits made in a certain area of the codebase.

To help, I wrote a quick command that takes basically any input as an argument and loads up context from recent commits, anything I’ve linked to, and really any other guidance I give it. The goal is to build a picture of what we’re going to be working on.

This serves a dual purpose in that it:

- Loads into Claude’s context key information that will be useful for whatever you want to work on next, acting as a perfect setup for the `feature-dev` plugin which I have been using quite a bit

- Helps me context-switch

Here’s an toy example where I want to work on a particular GitHub issue:

    > /u:context https://github.com/org/repo/issues/1234

    ⏺ Bash(git branch --show-current)
      ⎿  main

    ⏺ Bash(git status)
      ⎿  On branch main
         Your branch is up to date with 'origin/main'.
         … +14 lines (ctrl+o to expand)

    ⏺ Bash(git diff --cached --stat)
      ⎿  (No content)

    ⏺ Bash(git diff --stat)
      ⎿  (No content)

    ⏺ Bash(git log --oneline -15)
      ⎿  db40902 feat: some feature
         8fe1e23 fix: some bug fix
         d2472bf feat: another feature
         … +12 lines (ctrl+o to expand)

    ⏺ Bash(git log --oneline main..HEAD 2>/dev/null || echo "On main branch")
      ⎿  (No content)

    ⏺ Bash(gh issue view 1246)
      ⎿  title:	Thing we need to do
         state:	OPEN
         author:	tgvashworth
         … +33 lines (ctrl+o to expand)

    ⏺ Current Context

      Branch: main
      Status: Up to date with origin/main, no staged/unstaged changes (only untracked working files)

      What's Being Worked On

      ...

      Next Steps

      1. Create feature branch: git checkout -b issue-1234-blah-blah
      2. Explore existing models and views to understand the structure
      3. Implement X, Y, Z
      4. Build main functionality and views
      5. Add UI entry points

      Would you like me to proceed with exploring the codebase and starting implementation?

This can immediately be followed by the [feature-dev claude-code repo plugin](https://github.com/anthropics/claude-code/tree/main/plugins/feature-dev) which I love and use all the time:

    /feature-dev:feature-dev

It picks up the information from context and just gets started.

This context command is namespaced “u” because I have a bunch of useful and regularly used commands in there that I’m testing and playing around with. They’re currently in a private GitHub repository but if you like the sound of it, I could start to make these into an open source Claude plugin repo. Let me know if you’d like that.

# Gist as external memory

Another workflow I found pretty common with Claude is collaborating on the design of a feature — particularly in early research to understand the existing codepaths and architecture — to build a plan for a whole project before we break it down into individual steps.

For this I find it really useful to put Claude into the “no changes” mode and simply ask it questions, asking me to parrot it back to me the overall its overall understanding of what we have researched.

Then when I’ve got a sufficient plan or an understanding of what I want to do, I run a little command I’ve added called `/gissue` which writes the substantive content of the researched version to a private Gist and then files a GitHub issue with a compressed version and a link to the Gist.

This is neat because the Gist can be continually updated without the issue needing to be updated or if there are wholesale changes required we can go back and update the issue as well but the issue itself can act more like a log of what changed in the Gist.

I have another plugin called `/proj` which is similar, but biased towards the Notion/Linear workflow we use at work. I will put some effort into unifying `gissue` and my `u` plugin soon, because they do closely related things.

You can see all the code for this command [in the Gyrinx repo](https://github.com/gyrinx-app/gyrinx/blob/main/.claude/commands/gissue.md).

Here’s some from the prompts that might be useful to you…

### Arguments with a fallback

A nice way to make commands somewhat magical is to have them accept an argument but also know what to do by default:

    The analysis file path is: $1

    If no path is provided, look for the most recently modified .md file in .claude/notes/:

    !ls -t .claude/notes/*.md 2>/dev/null | head -1

    Read the analysis file to understand its contents.

### Asking questions

I find it really useful to get Claude to fire questions at me, and a good way to prompt this is to insist on `AskUserQuestion`:

    IMPORTANT: Before creating the issue, you MUST use the AskUserQuestion tool to get feedback.

    Ask the user which recommendations they want to prioritize in the issue. Present the top recommendations as options and let them select which ones to highlight.

### Error handling

Just a simple list of error cases goes a long way:

    ### Error Handling
    - If gh is not authenticated, instruct the user to run gh auth login
    - If the analysis file doesn't exist, ask the user for the correct path
    - If gist creation fails, report the error and don't proceed to issue creation

# Other plugins

Just a quick roll-call:

- I replaced the Claude Code-repo-provided commit commands with my own because I didn’t like what theirs did and because the Claude team hasn’t yet merged the pull request I have open on that repo

- I’ve built a `/task` command which gets Claude to go really deep, spin up agents, and generally act like a more useful guy with a goal in mind. Claude’s ability to delegate effectively to sub-agents and synthsise outputs has really improved recently

- I am trying out a “sound like me” plugin which was built by getting Claude to read my blog and extract what it thinks I’m like. However, It’s not quite there yet: in the style guide, under “Wry Humour”, it has "who doesn't love Jira?!" — noting that I’m “casual”, “sardonic”, and “quirky”. Hm.

To make this all more concrete, here’s an example of context + do-task where I wanted to implement the changes proposed in an audit done by another person on the project, which I’d downloaded to a CSV:

    > /u:context https://github.com/gyrinx-app/gyrinx/issues/677 and "/Users/tom/Downloads/Gyrinx UI audit - Log.csv"

    ⏺ Bash(git branch --show-current)
      ⎿  ta/la-audit-tweaks

    ⏺ Bash(git status)
      ⎿  On branch ta/la-audit-tweaks
         Untracked files:
           (use "git add <file>..." to include in what will be committed)
         … +5 lines (ctrl+o to expand)

    ⏺ Bash(git diff --cached --stat)
      ⎿  (No content)

    ⏺ Bash(git diff --stat)
      ⎿  (No content)

    ⏺ Bash(git log --oneline -15)
      ⎿  d760191 docs: comprehensive cost management system documentation (#1228)
         bec58d9 feat: add trace performance analysis playbook (#1227)
         91ba2d9 perf: fix N+1 queries in forms and weapon edit views (#1226)
         … +12 lines (ctrl+o to expand)

    ⏺ Bash(git log --oneline main..HEAD)
      ⎿  (No content)

    ⏺ Bash(gh issue view 677 --json title,body,state,labels,comments)
      ⎿ {
          "body": "We've developed a bit of a mess around going back and cancelling out of specific forms and need to have a reusable and easy to use framewor
        k for returning to where the user was as they go through a flow. Ideally we'd propagate this through the URL throughout the whole flow and have a easy
        … +6 lines (ctrl+o to expand)

    ⏺ Read(~/Downloads/Gyrinx UI audit - Log.csv)
      ⎿  Read 197 lines

    ⏺ Current Context

      Branch: ta/la-audit-tweaks
      Status: Even with main, no staged/unstaged changes, 3 untracked files (unrelated)

      What's Being Worked On

      This branch relates to GitHub Issue #677: "Rethink/rationalise breadcrumb and return URLs through the app". The issue describes a need for consistent navigation patterns, specifically propagating return URLs through flows so users return to where they came from.

      Related References

      - GitHub Issue #677: https://github.com/gyrinx-app/gyrinx/issues/677 - OPEN
      - UI Audit CSV: Detailed audit of 106 navigation/UX issues across the app

      UI Audit Summary

      The CSV contains a comprehensive audit of UI navigation issues. Key patterns identified:

      Categories of Issues:

      1. Back button inconsistencies (rows 4, 5, 47-57, 62-63, etc.)
        - Back buttons often go to fixed destinations rather than previous page
        - Example: "< Back to campaign" always goes to campaign page even when accessed from list view
      2. Missing back/cancel options (rows 67, 74-75, 90, 92-95)
        - Several edit pages lack back or cancel buttons
        - Edit rules, Edit skills, Edit weapons/gear pages missing navigation
      3. Missing header content (rows 27, 78-81, 99-101, 105)
        - Multiple pages missing header content: sell equipment, edit cost, reassign stash, edit damage, edit injuries, list about page
      4. Inconsistent button text (rows 64, 71-72, 81-82, 93, 96)
        - Mix of "Add/Edit" vs just "Edit" for similar actions
        - Info/Lore tabs have inconsistent empty state text
      5. Missing links/navigation (rows 60-61, 63, 104)
        - Some string links that should be clickable are not
        - Gang name strings missing in some views
      6. Vehicle issues (row 98)
        - Clone/archive/delete options don't work
        - "Captured" option shouldn't appear for vehicles
      7. Restore action needs confirmation (row 6)
        - Restore button works instantly without confirmation dialog

      Current State

      - Branch created but no commits made yet
      - This is a fresh start to work on the audit items
      - The audit covers ~106 specific issues to address

      Questions/Clarifications

      The audit is extensive. How would you like to proceed?
      1. Prioritize by category - Focus on one type of issue (e.g., all missing back buttons first)?
      2. Prioritize by page - Fix all issues on one page at a time?
      3. Start with quick wins - Fix simple text/label inconsistencies first?
      4. Focus on back button framework - Tackle the core issue #677 first (return URL propagation)?

    /task Categorise the entries in the audit into quick wins and then any other appropriate larger groupings. Investigate what it would take to fix those issues for each of the categories. And then file separate issues for each category linked to this parent 677-task. In particular the plan for the back button framework should be added directly to the 677 issue. What I'm hoping for here is we end up with a great set of issues that cover the implementation of the audit.

    ⏺ Let me categorise the audit entries and investigate the implementation complexity for each category.

      ...

It then went off and working for perhaps 15-20 minutes, and gave me some great results.

# Playbook

I’ve also been experimenting with a “playbook” plug-in which is for creating structured, multi-stage analysis playbooks that guides Claude-based agents through complex analytical workflows. It’s an “executable specification encoded as markdown documents”. I’ll do a more dedicated complete post to this pattern when it’s more mature — with a hat-tip to Lawrence Jones whose work inspired this.

# Multi-sensory Claude

It’s possible I was very slow on the uptake with using things other than the keyboard to get Claude to do stuff. I’m pleased to say that’s now changed.

### Voice

Voice is now a huge part of my workflow. I started using VoiceType, but have now fully committed to Wispr Flow as the UX (particularly on mobile) is *so good.*

More often than not you find me rambling into Claude Code prompt window, or into Claude Code for Web from my phone. Doing this via the [5G on the Elizabeth Line](https://tfl.gov.uk/info-for/media/press-releases/2024/july/first-tunnelled-section-of-elizabeth-line-gets-high-speed-mobile-coverage) feels basically like magic.

### Show-don’t-tell

I was initially very sceptical about Claude’s ability to interpret and understand complex information from screenshots, but I’m very pleased to say I got this wrong.

I’ve been amazed in a [work context](https://incident.io/ai-sre) with how good Claude is at interpreting graphs. Equally I’m finding, in the open source context, that it excels at taking screenshots of things I don’t like, with a loose description of the problem, and solving it for me.

This has been a huge change: I now regularly just drag screenshots into Claude and say “make it look like this.”

------------------------------------------------------------------------

So that’s the quick update. What have you found useful or integrated into your workflow recently? Should I switch to Cursor?
