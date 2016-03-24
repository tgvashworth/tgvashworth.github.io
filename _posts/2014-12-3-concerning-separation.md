---
layout: post
title: Concerning separation
---
This a quick response to Ben’s tweet from this week:

<blockquote class="twitter-tweet" lang="en"><p>This does not seem ok:&#10;&#10;<a href="http://t.co/DGK6CteRPK">http://t.co/DGK6CteRPK</a>&#10;&#10;Emperor&#39;s New Clothes Effect™ in full force again.</p>&mdash; Ben Howdle (@benhowdle) <a href="https://twitter.com/benhowdle/status/539454010387070977">December 1, 2014</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

His issue is the mix of logic and template. We’ve all heard it: your templates should exist in their own files, referenced by some kind of view. The logic is defined somewhere else.

Separating the two is meant to lead to more simple templates, a single place to find logic, maintainabile code and perhaps even code reuse.

Ben’s view is that embedding the template in the React component loses those desirable properties. I hope I’m not putting word in his mouth.

You've probably guessed that I disagree.

View logic is tied to a component (or application’s) state — good examples are toggling attributes, selectively including parts of the template, and reusing other templates or whole components. When the connection between the presentation and related logic isn’t intuitive or obvious, split-brain maintainability problems occur because the presentation changes incurred by a logical change are not clear. This leads to bugs.

There are always going to be pieces of logic that are dedicated to presentation, which meansthey are inextricably tied to the template itself. In the traditional model they are needlessly kept apart, and separating them actually complicates maintenance.

The traditional pattern also allows reuse of a template without reuse of associated logic, leading to a combinatorial problem where changes made for one use of the template can accidentally (and negatively) affect other uses — again without an explicit connection between the two.

My position is that logic dedicated solely to presentation should be physically, line-of-code close to its use in a template because they are in fact the *same* concern. Changes in logic are immediately linked to changes in presentation due to proximity and so the implications of a change are intuitively clear.

In the literature, this property is called [cohesion](http://en.wikipedia.org/wiki/Cohesion_%28computer_science%29) — the separate-template approach has *low* cohesion; the alternative has *high* cohesion, and is more desirable for it.

React’s way of doing things has high cohesion and a good measure of intuitive maintainability. I like it.
