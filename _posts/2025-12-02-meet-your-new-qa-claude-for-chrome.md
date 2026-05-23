---
layout: post
title: "Meet your new QA: Claude for Chrome"
summary: "Claude variants become best friends"
---

*Originally published [on Substack](https://tgvashworth.substack.com/p/meet-your-new-qa-claude-for-chrome).*

![](https://substackcdn.com/image/fetch/$s_!BOyG!,w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fdb257d8d-9405-46b2-a38f-6f400e81c506_2752x1536.png)

When Anthropic released [Claude for Chrome](https://www.claude.com/blog/claude-for-chrome) as a beta a few months ago and gave me early access, I struggled to get my head around it: what part of my workflow is this meant to replace? Clearly, in the future, agents will able to interact with the tools you use and work alongside you. But the user experience was so slow and so janky that I couldn’t see it replacing work I actually wanted to do any time soon, and it *entirely* took over from me, so it wasn’t a collaborator like Claude Code is.

But, more recently, I had an idea: I realised that I could use Claude Chrome for some of the manual testing work that I do on [Gyrinx](https://gyrinx.app), the app I build with my brother for the Necromunda community.

*If you haven’t come across Necromunda, it’s a game within the Games Workshop universe. I don’t personally play it but I work on a website that players use to manage their gangs. The manual testing of this app is fairly complex because Necromunda is a complex game and we try to capture everything you can do within Necromunda from a gang and campaign management point of view.  *

The manual testing of some more complex features can be pretty laborious and repetitive. It’s really nice to be able to delegate that to an agent. To that end, I’ve created a Claude command that has brought together Claude Code and Claude for Chrome in a way that really feels good and helps my workflow.

So here’s the basic idea:

1.  I develop a feature on a branch. Maybe that uses Claude, maybe it doesn’t. But either way some functionality gets built.

2.  I run a command within Claude: /manual-test-plan. This has the agent inspect the changes on the branch we’re on and generate a manual testing plan — the kind of thing you might build as a QA.

3.  I trigger a manual testing command in Claude *for Chrome* which visits a specific website and looks for the latest manual testing plan.

4.  Claude for Chrome absorbs this plan, runs it in the browser, and gives me a report on how it’s done.

As I edit this post, it’s chugging away in the background through the test plan you’re about to see…

# The test plan

Here’s a real example I’m looking at *right now*.

I’m working on some internals where we switch a system around fighter “advancements” — available after the fighter has gained XP — over to use a system we call “mods” and away from a more manual and hacky method.

Basically you can think of it as: currently we mutate something that really we treat more immutably, and model as a computation. Right now we edit something that’s user-facing whereas we should instead store a database object that describes the effect of the advancement.

I’ve Clauded up the feature. It’s fairly complex, so this took some iterations. And it’s critical that this doesn’t break existing flows.

Once happy, I ran /manual-test-plan generate a plan.

Here’s how it looks:

    > /manual-test-plan is running…

    ⏺ I’ll analyze the changes and generate a manual test plan. Let me first examine the code changes in detail.

    ...

Once it has run for a little while, it generates a pretty lengthy plan and writes it to a file.

    ⏺ Write(.claude/test-plans/2025-12-02-stat-advancements-mod-system.md)
      ⎿  Wrote 185 lines to .claude/test-plans/2025-12-02-stat-advancements-mod-system.md
         # Test Plan: Stat Advancements Using Mod System
         Generated: 2025-12-02
         ## Overview
         This PR changes how stat advancements are applied to fighters. Instead of mutating the fighter’s override fields directly, stat advancements now use
         the mod system that is computed at display time. This should make the stat improvements visible in the statline while keeping the underlying fighter
         data clean.
    ...

185 lines!

    ⏺ I’ve created a comprehensive manual test plan at .claude/test-plans/2025-12-02-stat-advancements-mod-system.md.

      Summary of the test plan:

      [ ... table ...]

      The test plan covers:
      - Core functionality: New stat advancements using the mod system
      - Stacking: Multiple advancements on the same stat
      - Visual indicators: Modified stat tooltips and highlights
      - Backward compatibility: Legacy advancements continue to work
      - Performance: No N+1 query regression
      - Edge cases: Distance format stats (Movement with inch marks)

      The test plan is accessible at http://localhost:8000/_debug/test-plans/ when the dev server is running.

The command immediately informs me that the plan is hosted at a particular URL, so it’s ready for Claude Chrome to pick up. It’s a simple debug endpoint on the application that’s already running.

# Running the test

Over in Code for Chrome I have a shortcut set up which loads the target page mentioned in the plan:

![](https://substackcdn.com/image/fetch/$s_!Iatv!,w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fc8ca36c1-fe59-4bff-865d-b46d8d32e588_390x239.png)

This shortcut has a “starts-from URL” configured which matches the output from the /manual-test-plan command, and contains some instructions for loading a manual testing plan from the hosted files:

![](https://substackcdn.com/image/fetch/$s_!G5A-!,w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Ff2deaad4-eca8-4ba8-85ad-c02e373b974f_383x578.png)

The page immediately loads and looks like this:

![](https://substackcdn.com/image/fetch/$s_!DgJH!,w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F5a6c5c07-5eff-44d0-acc4-4d41304f16f6_837x216.png)

As you can see, there are a couple of plans here from stuff I’ve tested today. It knows to load the top one, which simply loads displays the markdown file.

I did it this way because I didn’t want to copy and paste plans manually across from Claude Code into Claude for Chrome. Instead I just wanted it to visit a page and start work.

So let’s take a look at some snippets from the test plan, to see what it generated and how this actually works…

    ## Overview

    This PR changes how stat advancements are applied to fighters. Instead of mutating the fighter’s override fields directly, stat advancements now use the mod system that is computed at display time. This should make the stat improvements visible in the statline while keeping the underlying fighter data clean.

    ## Setup

    1. Navigate to http://localhost:8000
    2. Log in to a test account
    3. You need a **campaign list** with at least one fighter that has XP to spend (minimum 10 XP)
       - If you don’t have one, create a new list, attach it to a campaign, and give a fighter some XP

    ## Test 1: Apply a Stat Advancement (New Mod System)

    **Purpose**: Verify that new stat advancements use the mod system and display correctly.

    Steps:
    1. Navigate to http://localhost:8000/lists/
    2. Find a list that is attached to a campaign (look for campaign name badge)
    3. Click on the list to view it
    4. Find a fighter with XP available (look for “XP” badge showing current XP)
    5. Note the fighter’s current stat values in the statline (e.g., WS, BS, M, S, T, etc.)
    6. Click on the fighter card to expand details, or click the fighter’s name to go to the detail page
    7. Find and click the “Advancements” link/button
    8. Click “+ Add Advancement”
    9. Choose to “Spend XP” (not roll dice)
    10. Select “Characteristic” as the advancement type
    11. Choose a stat to advance (e.g., “Weapon Skill” or “Movement”)
    12. Note the XP cost and cost increase shown
    13. Click “Confirm” to apply the advancement

    **Verify**:
    - [ ] The advancement appears in the advancements table with type “Stat”
    - [ ] The XP shown in “Current XP” has been reduced by the XP cost
    - [ ] Navigate back to the list view and check the fighter’s statline
    - [ ] The improved stat should show the new value (e.g., WS “3+” becomes “2+”, or M ‘4”’ becomes ‘5”’)
    - [ ] The improved stat should have a tooltip indicating it’s modified (hover over the stat value)
    - [ ] The stat value should have a yellow/warning background highlight

This is a very detailed set of steps that exactly outlines what we expect to happen when creating an advancement. It’s unbelievably useful for me to see this and I am able to verify that it is in fact testing what I expected to test.

What amazes me most is that Claude for Chrome can actually pick this up and follow the tests all the way through. I’m making sure to use Opus 4.5 which does seem to stay on task better and can think things through pretty well. But I will also test with Sonnet soon.

The manual test plan command is also prompted to ask for human verification or action when required, and that looks like this:

    ## Test 4: Archiving Removes Advancement Effect

    **Purpose**: Verify that archiving a fighter removes the advancement’s effect from display.

    **Note**: This test verifies that archived advancements are excluded from the mod calculation. Currently, archiving advancements directly may not be exposed in the UI.

    🧑‍💻 **Human Action Required**
    To test this, please run the following in the Django shell:
    ```bash
    manage shell
    ```

    Then run:
    ```python
    from gyrinx.core.models import ListFighterAdvancement

    # Find the most recent stat advancement
    adv = ListFighterAdvancement.objects.filter(advancement_type=’stat’, uses_mod_system=True).order_by(’-created’).first()
    print(f”Advancement: {adv}”)
    print(f”Fighter: {adv.fighter}”)
    print(f”Stat: {adv.stat_increased}”)

    # Archive it
    adv.archived = True
    adv.save()
    print(”Advancement archived”)
    ```

    After archiving:
    1. Navigate to the fighter’s list view
    2. Check the statline

    **Verify**:
    - [ ] The stat that was advanced should revert to its previous value (or show one less improvement if multiple advancements exist)
    - [ ] The modification indicator should update accordingly

    🧑‍💻 **Human Action Required**
    To restore the advancement after testing:
    ```python
    adv.archived = False
    adv.save()
    print(”Advancement restored”)
    ```

From my perspective as the developer it’s great that it’s noticed that archiving advancements directly isn’t exposed in the UI and therefore I have to do it.

![](https://substackcdn.com/image/fetch/$s_!RqnT!,w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F38bf5ada-fcad-4db9-a38d-c57c884aa21a_379x437.png)

# The command

So let’s see how this test plan is actually generated by looking at the manual test plan command.

    ---
    description: Generate a manual test plan for code changes, formatted for Claude for Chrome
    argument-hint: [short-name]
    ---

    # Manual Test Plan Generator

    You are helping generate a manual test plan for recent code changes. The test plan will be executed by Claude for Chrome, which can:
    - View and interact with web pages
    - Click buttons, fill forms, check checkboxes
    - Navigate between pages
    - Verify visual content on screen

    Claude for Chrome CANNOT:
    - Run terminal commands or access local files
    - Access the codebase directly
    - Make purchases or access financial sites without confirmation

This prelim gets Claude focused on what instructions to provide, and puts boundaries on what it asks for.

    ## Your Task

    Analyze the recent code changes and generate a manual test plan that can be executed in a browser.

    **First, check what has changed:**

    !`git diff main --name-only | head -20`

    !`git log main..HEAD --oneline | head -10`

    ## Instructions for Generating the Test Plan

    Based on the changes above, create a test plan with these sections:

    ### 1. Prerequisites
    - What pages/URLs need to be visited
    - What test data needs to exist (e.g., “a list with fighters”, “a campaign”)
    - Any setup steps the tester needs to do first

    ### 2. Test Cases
    For each test case, provide:
    - **Name**: Brief description
    - **Steps**: Numbered list of exact UI actions (click, type, select, etc.)
    - **Expected Result**: What should be visible on screen after the action

    ### 3. Format Requirements

    Format the test plan so Claude for Chrome can execute it step-by-step:

    - Use explicit UI element descriptions (e.g., “Click the ‘Delete’ button next to the equipment name”)
    - Include what to look for to verify success (e.g., “The credits value in the header should increase from X to Y”)
    - Note any checkboxes or form fields to interact with
    - Specify page navigation clearly (e.g., “Navigate to the fighter’s detail page by clicking on their name”)

Being really explicit about the format of the output seems to improve the quality and clarify of the plans it outputs. Remember that Claude at this stage has access only to the code, not to the visual output. So it’s translating into words what it expects to be on the page. That obviously could have issues but that has seemed to work so far.

    ### 4. Human Assistance Required

    Some tests may require actions outside the browser that Claude for Chrome cannot perform. For these, include a **”🧑‍💻 Human Action Required”** section that instructs Claude for Chrome clearly to stop and ask the user to help.

    Examples of when to ask for human help:
    - Running CLI commands (e.g., `python manage.py ...`, `git ...`)
    - Checking database state
    - Modifying environment variables or settings
    - Restarting servers
    - Checking log files
    - Any action requiring terminal access

    Format these as:
    ```
    🧑‍💻 **Human Action Required**
    STOP HERE and ask the user to perform the following action.

    Run this command and tell me the result:
    `python manage.py shell -c “print(MyModel.objects.count())”`
    ```

Next we provide some useful context as a reminder to Claude for Chrome about the application and also prompt it on how to output these files to the right location including a use of the argument to the command which is interpolated directly into the command prompt before it’s run. This is a really powerful pattern that if you haven’t adopted so far, I recommend.

    ### 5. Context: This Application

    This is Gyrinx, a list-building application for tabletop gaming. Key concepts:
    - **Lists**: Collections of fighters and equipment
    - **Fighters**: Characters with stats and equipment
    - **Equipment**: Items assigned to fighters (weapons, wargear)
    - **Campaign Mode**: Lists attached to campaigns track credits (currency)
    - **List Building Mode**: Lists not attached to campaigns (no credits)
    - **Rating**: Total cost of all fighters and equipment in a list
    - **Stash**: Equipment held in reserve (separate from rating)
    - **Refunds**: In campaign mode, removing items can optionally refund credits

    ### 6. Output Format and File Saving

    Structure your output as a numbered checklist that Claude for Chrome can follow.

    **IMPORTANT**: After generating the test plan, you MUST save it to a file using the Write tool:
    - Directory: `.claude/test-plans/`
    - Filename format: `YYYY-MM-DD-short-name.md` where short-name comes from:
      - The argument provided to this command: `$ARGUMENTS`
      - If no argument, derive from the current git branch name (sanitized)
    - Create the directory if it doesn’t exist: `!mkdir -p .claude/test-plans`

    Example filename: `2025-11-30-removal-handlers.md`

    The test plan will then be accessible at `http://localhost:8000/_debug/test-plans/` when the Django dev server is running.

Lastly we provide a template and kick off the actual action. Simple.

    ### Test Plan Template

    ```markdown
    # Test Plan: [Feature/Change Name]

    Generated: [Date]
    Branch: [Branch name]

    ## Setup
    1. Navigate to [URL]
    2. Ensure you have [prerequisites]

    ## Test 1: [Test Name]
    **Purpose**: [What this tests]

    Steps:
    1. [Action to take]
    2. [Action to take]
    3. [Action to take]

    **Verify**:
    - [ ] [Expected visual result]
    - [ ] [Expected visual result]

    ## Test 2: [Test Name]
    ...

    ## Test N: [Test requiring CLI/terminal]
    **Purpose**: [What this tests]

    🧑‍💻 **Human Action Required**
    This test requires terminal access. Please:
    1. Run: `[command]`
    2. Tell me the output

    Then I will verify: [what to check]
    ```

    Now analyze the changes shown above, generate the test plan, and save it to a file.

And at the end of it all, it gives lets me know what happened. “All PASS”? Nice.

![](https://substackcdn.com/image/fetch/$s_!ls-f!,w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fb117275b-71b0-4535-b9e5-713fcf0a2db3_376x631.png)

------------------------------------------------------------------------

**Update January 2026**

Claude Code now has direct Claude for Chrome integration. This is awesome because, once connected, you can simply as Claude to run through the test plan it generated.

[Here’s a real, complete example for a PR I was testing](https://gisthost.github.io/?c4bad8c4f380f3038db21362ff624b6a/index.html) using Simon Willison’s [claude-code-transcripts tool](https://github.com/simonw/claude-code-transcripts) and [gisthost](https://simonwillison.net/2026/Jan/1/gisthost/).

------------------------------------------------------------------------

So that’s how I’ve been able to parallelise my testing workflow, finding an unexpected but valuable use-case for Claude for Chrome.

What’s been your experience of Claude for Chrome?

------------------------------------------------------------------------

To the Claude team, if you reading this, here’s some feedback:

- Chrome sometimes pulls focus over during test — for example, when select boxes are opened. Claude for Chrome should probably use DOM manipulation instead, or perhaps that focus-pull can be mitigated.

- The “‘Claude’ started debugging this browser across the Chrome profile is kinda sad. I’ve used Gemini-in-Chrome, and they seem to have avoided this. I’m sure there’s a very good reason for it but… it’s not very nice.

- Errors happening in Cloud for Chrome are a real problem. For example, requiring me to generate a new auth token should not mean I have to close the extension sidebar and lose what I was working on, interrupting a long-running task. For these kinds of agentic flows to work, it *has* to be magical: a big red error box about an auth token is not magical.

- I’d like to be able to *push* tasks from Claude Code into Claude for Chrome, and to have A-to-A communication between them. I’m sure I could build something here, such as allowing Claude for Chrome to report what’s up to into some scratchpad that is synced to a file that Claude can read, but it’s a bit of a faff. For the same reason it’s very frustrating that Claude Code seems to have no awareness of Claude Desktop (how else do I get Claude Code to read my Gmail or run deep research to help with a task?!), it’s annoying these two don’t talk.

- When I use Claude for Chrome, I feel like I’m using a fragile toy. I don’t want to touch it too much and I don’t really know what some of the buttons are going to do midstream because I’m really nervous of interrupting it. Making the whole thing feel more robust to interruptions like Claude Code is would be wonderful.
