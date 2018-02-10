---
layout: post
title: "Notes on launching GraphQL at Twitter"
---

Just over a year ago we launched the first user-facing GraphQL queries at Twitter. It was the "who am I?" query that, perhaps unsurprisingly, [TweetDeck][] was making as it launched.

12 months later, or thereabouts, we're doing upward of 2 billion queries every day. This fact still shocks me, but gives me some pride too.

I recently wrote an internal annoucement email, telling the company what we'd done. One paragraph said:

> Moving clients away from this endpoint saves our user's data — as much as 25% per request — and is the beginning of a larger architectural change to enable teams to move faster, make changes to the product more easily, and involve fewer teams in the process.

---

Sameer Sundresh, from our excellent Engineering Effectiveness team, responded with some searching questions: how is it going? What have I (or we) learned? Are there lessons for others trying to make such pervasive changes?

From my point of view, it's been a mixed bag — I think with such a large, ambitious change like this we were always going to run into roadblocks and challenges. But our customers seem happy and want to increase adoption & scope.

I don't think I can yet articulate exactly what we've learned — I guess it will take some time to clarify with hindsight. That said, we've already noticed and adjusted our approach to "breaking" changes — initially we were very hesitant and inclined to plan gradual migrations, but we've latterly become more comfortable with a small breakage that is correctable quickly with a bit of human intervention and a helpful error message.

I've also learned quite a bit about managing expectations (upwards/outwards) and doubling my (already doubled) estimates!

There were also problems we had anticipated dealing with but that hit us a bit sooner than we expected, mostly operational. All stuff that sat at the intersection of two services — the kind of thing for which neither team had obvious responsibility.

Next time: call these things out louder and don't shy away from asking the obvious questions.

---

I'm looking forward to reporting what we've learned in another 6 months or a year. As my annoucenment email finished:

> We're just getting started.

[TweetDeck]: https://tweetdeck.twitter.com

