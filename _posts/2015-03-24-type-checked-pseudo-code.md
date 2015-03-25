---
title: "Type-Checked Pseudo-Code"
layout: post
---

![Brain hurt.][brain-hurt]

> This man knows Haskell.

I'm finding Haskell increasingly useful day-to-day as a powerful tool for grappling with tough problems, to flesh out ideas and prototype solutions.

The idea is to try to solve problems in Haskell first, and I've found its properties act as a forcing function to improve things. For example, it necessities *typing* the problem well, giving shape to the data and *thinking* about how it changes over time. This can shake out many of the conceptual bugs before they become embedded code.

Type checking finds holes in thinking because it's just not possible to take shortcuts and often, if the code type-checks, it works. Haskell encourages abstraction and generalisation, which makes me think, simplify and think some more.

Once there's a good solution in Haskell it can be implemented for real. Generally that means writing code that's less abstract, but that's OK; the implementation in Haskell will have influenced things to an extent that it's general-*enough* and abstract-*enough* to be flexible and maintainable in the future. Where the abstractions from Haskell are evident, the solution is often composable and reusable.

Best of all, Haskell doesn't feel like code. It feels like a language for thinking in: it's expressive, terse and simple, especially as type-checked pseudo-code.

[brain-hurt]: http://goingshodan.com/wp-content/uploads/2013/08/my-brain-hurts.jpg
[tweetdeck]: https://tweetdeck.twitter.com
