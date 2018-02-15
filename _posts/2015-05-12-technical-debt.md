---
title: Technical Debt
date: 2015-05-12
layout: post
---

We recently completed and launched a slew of changes to TweetDeck at the end of a technical debt project that lasted more than 6 months. The changes are largely hidden in the JavaScript guts, bringing legacy code up to date and unlocking a range of future features.

Having reached the end and successfully released without a hitch, apart from the usual user consternation, I want to get everything I have learned about paying off technical debt, refactoring and rewriting, out of my brain and onto your screen. This may actually be everything I know about software engineering.

### Identifying debt

Your technical debt is the sum of the trade-offs and compromises still present in your code. It means done but hacky; shipped but imperfect; working but cumbersome. It can appear organically over time or very suddenly. It slows your team down and detracts from the value you can provide.

However, it does *not* mean things you don't like, don't understand or believe to be too complex. They are not necessarily technical debt; you'll need to be a bit more objective!

Paying off technical debt means understanding the trade-offs that shaped how things are. Before taking a different fork in the road, restate the goals and constraints.

You should pay off debt when living with it outweighs the cost of fixing it, or when it may jeopardise the success of future work. While 'cost' is hard to measure, you can try complexity, bug frequency, or the speed at which engineers are able to work.

### How do you decide what to pay off, and what to live with?

While I've been trying to learn the habits of the more senior engineers around me by observing and copying, I think that to make decisions like this you have to try, fail, and try again.

Methodically explore the problem space. State the goals of the work. More importantly, state what *isn't* a goal. What should be taken off the table?

Draw, map and visualise until you thoroughly understand the situation before you touch the keyboard.

If you're technical, the goal is to know landscape of the problem by its landmarks: components, modules, functions, and their interactions. Confidence to make the right choice comes when you have a complete understanding.

Do this first, because writing code is costly in the extreme; thinking, sketching and exploring are cheap.

---

One way we approached this in the recent TweetDeck work, very early on, was to post-it-map the flow of tweets from their arrival from the API through to the 'Column' object that renders them for the user. The sprawling result served as a vital reference early on, and enabled quick identification of the major debt (and areas we needed to avoid). It was quick, cheap and hugely valuable.

During this process we were constantly talking, sharing and spreading knowledge. This is vital; a team member may be able to unlock an area of code in a sentence, saving you hours later on.

### Saying no

If you find an area you don't want to modify, try to reduce its surface area by improving the interface. Build a wall around it to isolate the damage.

Take a Hansel & Gretel approach, leaving breadcrumbs as you go, to find your way back in future.

If you decide to defer improving something, remember that debt spreads when left without containment: doing something "the old way" tends to be the easy option, and is the learned go-to. Quarantine the legacy code and come back in the future. Document that you did so, and discuss it with others.

Consider that doing nothing is an option that's always available, and that it may be your best choice.

Your natural inclination may be to code, so come up with reasons why you shouldn't, and justify every change.

---

During the TweetDeck project, Andy & I diagrammed an area of the code for several hours before deciding it was too complex to comprehend fully, and certainly impossible to refactor competently, so we stopped and made a note to come back later. Months down the line we did, but this time we had sufficient peripheral knowledge to improve the situation.

### Rewrite vs refactor

There's a question I struggle with when paying back technical debt: when should a refactor become a rewrite? The ultimate answer is that I don't know. I don't think anyone knows.

One possibility, in general terms, is that you rewrite when – and only when – the cost of refactoring outweighs the cost of rewriting, but this begs a question: how do you assess the cost of the options?

First, investigate both before you decide anything. Dip your toes in the water. It's vital to keep your goals in mind and to stick to them. A rewrite should never take you beyond what you set out to achieve. Weigh the existing code and complexity against the time you have available and the goals of the project. Double your estimates.

Balance the trade-offs. Ask yourself, where will you make compromises if you rewrite? The answer is *never* "no compromises" – you're just picking different ones. Be explicit, and honest with yourself.

---

We began our project as a refactor, shipping incremental changes directly into production, before deciding that we were making things more difficult for ourselves.

We agreed to allow a period of breakage and approached the problem as a rewrite, working off-master and going back to first principles. The rigour we were then able to apply gave us confidence later in the project.

I'm still undecided on the right approach in terms of time-taken but if the ends justify the means, we made the right call.

### Getting through it

Technical debt can be as much a people-problem as it is an engineering one. You're going to run headlong into the compromises that your colleagues (past and present) made, and you're not always going to understand why, or be able to ask.

That said, rely on your colleagues' knowledge to help you quickly hone in and focus your energy.

You'll encounter difficulties. It's vital to avoid blaming or shaming anyone, though the process of dissecting legacy work can be massively frustrating. The past saw different constraints, priorities and pressures. Remember, your debt could be on the line next — how would you want others to act?

I am absolutely guilty of failing to adhere to this. It's seriously unprofessional, and I'm trying to fight the inclination.

Most importantly, stop and think. Often. Be aware of your own biases (mine are to code and to rewrites), and consciously fight them.

Paying back technical debt is about understanding the trade-offs, constraints and complexity and redressing the balance with a new approach. It's tough and time consuming, but little and often can really help keep a project moving.

Ship it!

> Thanks to [Passy](https://twitter.com/passy) for proof-reading this.
