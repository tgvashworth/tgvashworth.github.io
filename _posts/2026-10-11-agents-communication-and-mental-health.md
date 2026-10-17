---
layout: post
title: "Codex, Claude and comms"
note: false
summary: "Why I will happily take worse code in return for better comms"
date: "2026-10-17"
---

Much digital ink is spilled on new model releases and their benchmark performance. But agents are already highly capable software engineers: for a certain class of task, they are already _good enough_. I'm now paying much more attention to something else: how I collaborate with agents, how they should communicate, how much of that comes from the model itself, and what effect their comms has on me.

---

Against my own predictions, I've recently switched away from the Claude family of models. I now do almost all my work in Codex with GPT models, leaving only a few smaller tasks to Claude. The switch felt like a weight lifting from my shoulders. It's made me reflect on what I want from agentic collaborators and what I prioritise in how they work.

A change has been on the cards for a while as frustration with Claude accumulated. I found that Opus 5 planned poorly, communicated incoherently, obfuscated important details and, worst of all, wrote slop-filled user-facing microcopy despite _many_ skills, tools, memories, and explicit instructions to the contrary. If you don't know what I'm talking about here, I've left you the [delight of some examples below](#slopville).

After on particular night of poor sleep and agent swarms in my dreams, a change became inevitable. The deteriorating communication, the written tics and the persistent slop were all having a direct, negative effect on my mental health. 

I'd invested a huge amount of time in getting Claude to be effective in my repositories, customising it for my way of working, and adapting myself to _it_. Through that process, it had responded and gotten better. There had been magic moments that showed me how incredible the AI future could be.

But Claude's deterioration in communication quality had triggered a deeply ingrained feeling of loss in me. I imagine it's a feeling a teacher might get in relation to a favourite student who, for some reason out of the teachers control or influence, utterly failed to live up to their potential. My efforts felt wasted. It was deflating, and at times infuriating.

In a moment of desperation, I tried out Codex. Frankly, I had been snobbish about this: I'd thought Claude was so far ahead as a coding model that GPT could not match it. Aesthetically, I also preferred Anthropic's brand, voice, and ways of thinking.

Miraculously, the clouds cleared. GPT got what I was doing and _communicated like a person_! It shipped good code, fast, and was concise, coherent, and clear in its written output. The tone was straightforward and direct: there was no pseudo-intellectual, cleverer-than-thou "it's not X, it's Y" [mannered prose](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-1#writing-density) bullshit.

Sol and Astra are a breath of fresh air. They communicate the way I want and give me the information I need. Sadly, Claude-isms are deeply embedded in one codebase I work on, and will take a while to clear: Sol picks them up after encountering them in documentation and comments.

This episode has brought into sharp relief how much communication style and clarity affect my ability to collaborate with an agent. This is obviously important with humans... in hindsight, why would agentic collaborators be any different?

---

It's uncomfortable to admit that an agent had this much of an effect on me, because it suggests I relate to an agent much more like colleague than simply a tool. Perhaps they are in exactly the [uncanny valley](https://en.wikipedia.org/wiki/Uncanny_valley). 

I've since spoken to real, human colleagues about this. Some volunteered that working with Opus 5 had worsened their mental health too, and that things improved notably with the release of Opus 5.5. That was validating: maybe there is something here?

In one conversation, [Norberto](https://nlopes.dev/about) offered an interesting contrast: he still considered Claude superior to the GPT family _as a coder_, and that remained his primary consideration. That helped me realise how much I prize communication and clarity.

Up to a point, I will happily take worse code in return for better comms.

---

## Slopville

Here's some of the shit I've ripped out. 

> Trigger warning: Claude-isms

### It's not X, it's Y

Nobody had suggested X...?

- "A slot with nothing chosen is information, never an error — nothing marks it, counts it, or refuses to proceed without it."
- "A pure breakpoint, never a measurement: nothing here watches width, so nothing here can mis-measure it."
- "A list, not a feed: nothing loads more."
- "The title is the model's name plain, not the verb". Nobody had proposed a verb.
- "Nothing is refused for being over: a bigger gang joins and is marked." This is help text for a user!

### Naming the thing worth naming

- Discussing a page header: "What this page is, at the top of it." *(raaaaaage)*
- "How a form ends: the way out, then the act." This means Cancel, then Submit.
- A comment box: "somewhere to write by hand."
- WTF: "a list of subtypes is a list of subtypes, and a heading over each would be the same word down the page."

###  Riddles and epigrams

> "Look look, I'm really _really_ clever..."

- "three skill trees are still the one choice … and the dialog is where the three become three."
- "aria-hidden, since a page is a fact about paper and a screen reader is not holding any."
- "a link that goes nowhere is offered as a place, opens nothing in a new tab, and is read aloud as a lie."
- "Both, or neither: a button with no destination is furniture."
- "The weapon's own profile is not among them: it is the weapon."
- "Cascades, because the event is the act: an activity whose opening is gone is a record of nothing."

### Personification and moral language

- "a reader deciding what to do next is owed 'nothing is open' as plainly as they are owed what is."
- "the component owns the interaction and the application owns the memory."
- "What a click leaves to answer: what this fighter is called, and what the gang pays for them."
- "Holding the old row hostage…" / "Losing the link is survivable"
- "v1 modelled this as a hidden fighter and regretted it; here the database itself knows the difference"

### Commit titles

- "fix: the sweep owns up to the one word it moves"
- "fix: a question with no address is asked and answerable, and one whose slot went is not"
- "docs: the codebase speaks as kinds.md does"
- "a section strip that keeps the shelf you are on and pockets the rest"
- "the footer reads cancel, lesser acts, then the act — and no refunds where no budget"
