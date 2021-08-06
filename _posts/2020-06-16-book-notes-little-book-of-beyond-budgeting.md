---
layout: "post"
title: "Book Notes: The Little Book of Beyond Budgeting"
---

These are my notes on _The Little Book of Beyond Budgeting_ by Dr Steve Morlidge, subtitled “A new operating system for organisations: what it is and why it works”. My specific thoughts are _in italics_.

You should read this book, not just my notes: it’s tiny, dense and just makes sense.

---

Beyond Budgeting (BB) seems to be [agile](agilemanifesto.org) for budgeting. If you’re into agility then this will be a bit of a no-brainer.

The old model — “budgeting” — is annual batch planning process:

- Everyone plans their entire year
- A round of hellish negotiation begins where nobody gets what they want
- The budget is eventually agreed and locked-in for the year, then phased over quarters/months
- This often includes targets or boundaries within which each department must stay, based on assumptions in the model

_Apparently one company was able to spend 13 months putting together their annual budget. Not doubt the execs were still paid millions._

Budget control in this context means monitoring reality vs the plan:

- Variance or deviation from the plan means good/bad performance
- This is often used as a basis to reward (or not) as appropriate
- It is assumed that gaps can be closed by “working harder”

_(This sounds like bonus-linked OKR systems, which suck)_

In this model:

- **Targets** are fixed for the financial period
- **Incentives** are (often) tied to performance relative to this budget
- **Planning** is annual and highly detailed
- **Resources** are fixed once allocated
- **Measurement** is monitored relative to phased plan
- **Co-ordination** is assumed due to assumed/enforced adherence to the plan

_This clearly has all the same issues we know and love from waterfall software development and annual OKRs as mentioned above_

There are lots of problems with this:

- We aren’t as good at predicting the future as we think. Reasons for this include: the economy is very complicated, customers are fickle, stakeholders are capricious, etc. etc.
- Budgets “sub-optimise performance” because you can’t use the same number to measure, set goals and constrain spending:
  - Good targets need some stretch
  - Forecasts need to be realistic
  - Cost budgets need to be tight
- Tying rewards (bonuses) to budgets inevitable leads to gaming, because:
  - People want money
  - Or, at least, people want rewards for themselves and their team because it boosts morale
  - Therefore people will negotiate towards more achievable targets
- This distorts _either_ the stretch, the realism or the restriction, or maybe all three
- It also distorts focus: other goals that are not so linked to incentives will necessarily be neglected

In summary, “budgeting” is bad because it’s bureaucratic, inflexible, sub-optimal and political.

---

Enter [Ashby’s Law of Requisite Variety](<https://en.m.wikipedia.org/wiki/Variety_(cybernetics)>), to give us a _(dubious)_ scientific basis for not doing it this way.

Here’s the law, paraphrased:

> The variety of the regulator must be equal to or greater than the variety of the environment divided by the variety of the goal.

As an equation: variety<sub>regulator</sub> ≥ variety<sub>environment</sub> ÷ variety<sub>goal</sub>

For example, imagine a home heating system for (simplified) weather, where it’s either warm enough that you don’t need the heating on, or it’s freezing and you do:

- Our goal is to be comfortable: the goal variety is 1.
- The environment can either be hot or cold, so the variety of the environment is 2.
- 2 over 1 is 2.
- Therefore, the heating system needs _at least_ 2 states. _On_ and _Off_ will do, but you could get fancier. Any less and you won’t be able to achieve the goal.

Stretched to vast organisations and their financial planning, the author says the equation tells us that, if the commercial environment is highly dynamic, the organisation also needs to be highly dynamic.

_If you’re reading this, you probably don’t need convincing that that’s true, so I won’t try to convince you._

In the book, this equation is flipped so that it is: variety<sub>goal</sub> x variety<sub>regulator</sub> ≥ variety<sub>environment</sub>

That allows the author to say: if the regulator (i.e. the budget system) is inflexible, but the environment is highly variable, then the goal variety must increase, or the environmental variety must decrease.

He uses this to explain why people miss their goals in such a situation: the goal variety _was_ low — meet business targets and stick to the budget — but must necessarily increase to meet the environmental variety. So, people miss their targets, cancel projects, overspend, reallocate people, or stretch the rules or their ethics.

_Although I agree, I find this to be an over-reach: applying a three variable equation to groups of humans and their behaviour is questionable at best. But it’s a nice metaphor._

The final point here is that:

> …it is only possible to meet all budget goals if the environment is highly predictable — if it [also] has a very low variety. If the environment is not predictable, the variety equation does not balance and something has to give way to restore equilibrium.

Budgeting can therefore be viewed as deficient through this lens because:

- It ignores that the environment is complex — the annual cycle is too infrequent
- It has low regulatory variant: it’s hard to change the budget in-cycle, so it’s hard to respond to threats and opportunities
- It has low goal variety: the targets are fixed and specific

---

So! What should be done about all this? Dr Morlidge says:

> … an organisation’s operating model should be designed around the nature of the market and the way it chooses to compete within them.

Makes sense.

Step 1 is to measure your organisation in a meaningful way.

The section on this is very good, and you should read it, but I'll summarise:

- Plans are guesses
- Facts tell you the truth
- Start by identifying the most critical financial and non-financial variables, and measuring them appropriately
- Draw these from the environment, and focus on outcomes (e.g. market performance relative to competitors)
- Use these measures extensively
- Restrict the number of goals and don't fix them in time

Step 2 is to forecast, but only if you need to.

You should forecast to a horizon that is appropriate for the business. If you're making planes, that might be a while. Otherwise you can get away with much shorter forecasts.

Forecasting happens, "at the rate of change in the environment". Forecasts in this context are "expectations" to identify a gap to a target, and to ensure plans change if they need to.

Step 3 is to plan and reallocate resource continuously.

- Attach resources to plans based on forecasts
- In times of high uncertainty, hold some in reserve
- Reallocate when plans change
- Commit resources only when the plans proceed into action
- Again, match this cadence to the rate of change in the environment

Step 4 is to reward shared success.

In a single sentence: reward your people based on a fair share of the wealth created by the business. Not though OKR-linked bonus plans; not through complex "reward matrices" or opaque scoring systems.

And that's kinda it.

There's a great table in the book that summarises the approaches. The BB approach is captured like this:

- **Targets** should be continuous and relative
- **Rewards** should be a share in collective success
- **Plans** should be about continuous anticipation
- **Resources** should be allocated on demand based on context
- **Performance** should be measured using trends and alarms
- **Coordination** should be dynamically synchronised

"Alarms" and "dynamically synchronised coordination" are not hitherto defined in the book; perhaps we'll get to them.

---

Ashby's Law is then repurposed to point out an apparent paradox: you can't increase the flexibility of the organisation to meet the variety in the environment to such an extent that the organisation falls apart.

How then should the requisite variety (flexibility) of the internal environment be balanced with organisational cohesion and alignment?

Dr Morlidge says you can't just change the budgeting technique: lots more has to change.

To demonstrate this, the author summarises a normal "command and control" organisation. I won't bring that over — the symptoms are well known:

- The plan comes from the top, and everyone executes their small piece
- Leadership are assumed to be the most capable and best informed
- Systems are designed to provided management with evidence of adherence to the plan

There are times and places where this might work (e.g. everything and everyone is on fire) but that's a corner case.

The point is: in complex and dynamic environments, this doesn't work. Push too far and you'll see people bending and breaking the rules, including crossing ethical boundaries.

In these kind of environments, management will respond by restating the rules: "We don't do this! It's not our culture! These are the rules!"

Instead, the approach is to decentralise decision-making and build flexible governance systems to cope with the high variety in the internal environment.

What are the characteristics of a "devolved" BB organisation?

- Use multi-skilled (cross-functional) teams, organised around value-delivering work
- Trust these teams with direction and decision-making capabilities, but allow them to call on centralised support
- Set a clear and compelling mission and associated strategy to orientate and align people (obviating "rules, regulations and central direction")
- Define and delegate decision-making authority
- Hold teams accountable for meeting their goals
- Make as much information available to as many people as possible
- Allow teams to pull resources from the organisation — they are most connected to the customer or value-generating activity, and know what they need best

This is a world where management create a framework of principles, values, guidelines, goals and information that guide good decision-making.
