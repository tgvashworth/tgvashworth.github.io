---
layout: post
title: Concerning separation
---
This a quick response to Ben’s tweet from this week:

<blockquote class="twitter-tweet" lang="en"><p>This does not seem ok:&#10;&#10;<a href="http://t.co/DGK6CteRPK">http://t.co/DGK6CteRPK</a>&#10;&#10;Emperor&#39;s New Clothes Effect™ in full force again.</p>&mdash; Ben Howdle (@benhowdle) <a href="https://twitter.com/benhowdle/status/539454010387070977">December 1, 2014</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

The issue is the apparent mixing of logic and template concerns; after all, “never the twain shall meet” has long been JavaScript framework canon. We’ve all heard it: your templates exist in their own files, referenced by some kind of view, and the logic is encapsulated somewhere else. Separating the two is meant to encourage simple templates and coalesce logic with the noble goal of maintainability and perhaps even reuse.

Ben’s view is that the embedding of the template in the React component encourages mixing the two such that you lose those desirable properties. I hope I’m not putting word in his mouth. I disagree.

Yes, there are pieces of logic that are dedicated to presentation but they are inextricably tied to the template itself and are needlessly kept apart. Separating the two actually complicates their individual maintenance.

Commonly, view logic proceeds necessarily from your component (or application’s) state — toggling attributes, selectively including parts of the template, and reusing other templates (or view whole components) are good examples. When the connection between the presentation and related logic isn’t intuitive or obvious, split-brain maintainability problems occur; the presentation changes incurred by a logical change are not clear and this leads to bugs.

This pattern also uniquely allows reuse of a template without reuse of associated logic, leading to a combinatorial problem where additions made for one use of the template can accidentally (and negatively) affect other uses — again without an explicit connection between the two. 

My position is that logic dedicated solely to presentation should be physically, line-of-code close to its use in a template because they are in fact the *same* concern. Changes in logic are immediately linked to changes in presentation due to proximity and so the implications of a change are intuitively clear. I’d bet on React’s way of doing things.