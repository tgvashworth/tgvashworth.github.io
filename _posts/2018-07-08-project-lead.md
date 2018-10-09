---
layout: post
title: "Project Lead"
summary: "I wrote a guide to help my team's Project Leads. It might be useful for you too."
---

I wrote a guide to help my team's Project Leads. It might be useful for you too.

- - -


My team organizes work into projects. A project has no fixed definition, but there are some common characteristics:

*   several human weeks of work
*   more than one person required
*   dependencies on other projects or dependent future projects, or both

We assign a "Lead" to each of these projects, there to be main point of contact for the work. It's like a team or technical lead but with a narrower scope.

In talking with [Mike Cvet][1], I realised that, despite naming individuals as Leads, it has not been clear what the expectations or responsibilities of that person are.

This is clearly, in hindsight, a mistake.

The [most useful things][2] I ever did for myself were *all* about clarity in expectation and responsibility, so why wouldn't that be true for others?

To help me out, and hopefully to help others, I wrote a guide for project leads. Here's the full guide in its current iteration, with a few tweaks to remove the specifics of my team.

A Guide for Project Leads
-------------------------

So you're the Project Lead! Nice. What now?

First, run through this checklist:

*   Your project should have an Epic in our Jira project *(who doesn't love Jira?!)*
*   It should have an item in the Backlog spreadsheet *(this tracks our roadmap at the project level)*
*   Consider creating a new Google doc for the project

The Google doc could be a "homepage" for the project while you are working on it, or be the main Technical Design Document. It's your responsibility to maintain and should be an up-to-date project reference point. Your audiences, in priority order, are the people working on the project, the wider team, the project's stakeholders and finally interested 3rd parties.

Past this point, projects usually follow a lifecycle like this:

*   Planning — how the work will be done and perhaps when it will be completed
*   Execution — the development of the project
*   Launch — enabling the results of the project, either for users or customer teams
*   Post-Launch / Maintenance — changes to the project after the launch

As a Project Lead, you are responsible for these running to completion. No pressure! Of course, your team lead (TL) and manger (EM) are there to help with all of this — just ask.

### Planning

Our work often touches many other systems and it's important that we have a full understanding of those systems, the implications of our changes, plus buy-in from the owning teams. This all happens during planning.

Your responsibilities during planning extend to...

**Lightweight or full technical design document and review**, for each major component and client. There may only need to be one lightweight design document, but don't skimp on this. They serve as a focal point for discussion and documentation after-the-fact. Consider your audience, leading the reader to understand the problem, why it is worth solving, and your suggested solution.

**Task breakdown and estimation** of the time and human requirements. What are the distinct components of the project and can they be worked on independently? Should the work be broken-down into phases? What is required for launch and what is just nice-to-have? Making a time estimate and communicating it to the team and stakeholders, even if it's rough, it's useful so that others can plan around your work. But don't just pluck something out of the air — take the time to think through all the corners of the project and be realistic. And, in general: double your estimates.

**A functional prototype**, if applicable. With complex projects, it can be useful to prototype before you start building. Feedback from prototyping should be incorporated into your plans.

**A design review and sign-off**. This means actively engaging the team, customers and stakeholders for reviews before you start building. It is not enough to just email out asking for review — you must try to get a specific time commitment from named people. Consider also running a Design Review once feedback in the doc has broadly settled. Ask your TL or a Shepherd for help with review and sign-off.

**Experiment brief**, if applicable. We may want to launch using an experiment and it is important to start the experiment review process early.

### Execution

**Communication and synchronization**. This means organizing meetings, when necessary, with the project team. For complex projects, this can be every few days. Weekly or bi-weekly is usually enough though. Your TL or EM will be able to help, and may be able to facilitate these meetings. Good communication keeps the project team focused on the goals and deliverables., avoids misunderstandings, duplication of work, surfaces blockers early, and makes it possible to adjust the plan dynamically. It also allows stakeholders to plan around your work and understand how your work affects them.

**Ongoing sequencing and reprioritization** of workstreams to avoid creating blocking dependencies, where necessary. Things will change over time — it's on you to react to these, reprioritize and work with others to plan how to do the work with as few blockers as possible. Your TL or EM will be able to help with this.

**Code writing and review**. Of course. This includes integration testing: our suite should stay up-to-date and expand to test new functionality.

**Progress updates for stakeholders**. Communication about progress (and blockers) is important for project stakeholders too. It's on you to send out these updates. An email to our team mailing lists, plus specific involved people, is a good way to start.

**Adjustment of technical design as necessary**. The plan with change as you learn. The design might have to change too. That's on you, in collaboration with your team, customers and stakeholders.

### Launch

**Quota or capacity** for our services and dependent systems. It's up to you to plan capacity changes and make those changes where appropriate.

**Team and employee dogfood** release and feedback collection. The best way to learn about a system is to have people use it.

**Experiment or holdback**, where applicable.

**Launch controls** such as deciders or feature switches, where applicable.

**Documentation of changes** written and accessible by the team and interested 3rd-parties.

### Post-launch / Maintenance

**Post-launch change**. What comes next? What didn't you get done in time? When will this happen? Work with the TL and EM to schedule and prioritize this.

**Project retro**. What can we learn from this project and improve for next time, or carry to the next project? This should include the whole team, but could also members of other, involved teams.

[1]: https://twitter.com/mikecvet
[2]: https://tgvashworth.com/2016/07/20/technical-lead.html
