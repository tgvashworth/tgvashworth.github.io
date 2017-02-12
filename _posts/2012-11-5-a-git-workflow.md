---
layout: post
title: A git workflow
date: 2012-11-5 8:00
---

This post is about how I personally work with git. There are many different git workflows to choose from, so I'd recommend playing with a few 'til you find something you (and your team!) like.

My workflow is very based Scott Chacon's [Github Workflow](http://scottchacon.com/2011/08/31/github-flow.html). Obviously it works well with GitHub, but it's also designed for a tight feedback loop using many, cheap, branches and merging often.

### Workflow

Here's the general idea:

- The master branch is always deployable
- Always work on a branch
- Commit often and regularly push your work to the same named branch on the server
- When your work is ready, open a pull request and have someone else review it before merging into master
- Use pull requests for feedback and help, not just for features to be merged into master
- Deploy from master often
- Use a `feature/fix/task/try` naming convention

### Naming

The branch naming convention is helpful for others to understand what you're working on, and helps you keep organised. A branch called `fix/cats-in-profile-pictures` is very different to `feature/cats-in-profile-pictures`. If you know you've got to do something, but it's not new, use `task/`, and if you're just trying something out, use `try/`.

### Other thoughts

Branches are cheap. In SVN, branching and merging is painful and so is avoided, but in git it's trivial. Use them often and throw them away often. A `try/` branch can easily become a `feature/` branch.

Git is as useful for personal projects as it is for collaboration: using git from the start on your own stuff (even if it's never meant for the light of day) makes it easy for others to collaborate down the line.

I hope this helps you figure out the right git workflow for you – let me know if you have any ideas or suggestions.

