---
title: "Promise & fetch cancellation"
date: 2015-11-25
layout: post
---

Working on [fetch-engine][fetch-engine] has given me reason to think a bit more deeply how we interact with the network from JavaScript.

One thing I'd like the library to make simple is *network request timeouts*. They're a good practice for distributed systems, and we should all be able to add them to requests without thinking about it.

To build timeout support, there needs to be a way cancel the in-flight request, free up [HTTP resources][max-connections] in the browser, and notify the code performing the request than a timeout has occurred. To see how fetch-engine could do this, I looked into how we could make network requests.

Since [fetch][fetch-spec] is becoming a standard and making its way into browsers, fetch-engine will be built on it.

As I was looking at fetch in more detail, I discovered that there isn't a way to cancel an in-flight request with the fetch API. This makes timeouts impossible, which is a little unfortunate.

I found the discussion about it at [whatwg/fetch#27][fetch-cancel-discussion] but, sadly, it's an appalling display of the standards process gone wrong, littered with personal attacks, pointed sarcasm, and useless noise. There was some constructive discussion, but no resolution.

You might also like to read the (thankfully shorter) [es-discuss thread on Promise cancellation][es-cancel-discussion].

The rest of this post conveys my thoughts on the issue. The world probably doesn't *need* my thoughts, but here they are. I'll try to take an evidence based approach, and please call me out if I deviate from that.

## Promises

First, what is a Promise? You should read [the spec][promise-spec], but fundamentally they:

- are a container for values
- exist in one of three states (pending, fulfilled, and rejected)
- transition *only* from pending to fulfilled *or* rejected
- expose a single method, `then`, that returns a new Promise

Promises have interface immutability, meaning their resolution cannot be interfered with, nor can the contained value be changed.

Promises are also simple, in that the full behaviour is described and understood easily.

These two properties have latent positive effects on large codebases, and are a good abstraction for a common set of tasks. That is why people like them, and why I think they're great. Not perfect, but good-enough and useful.

### Promise cancellation

When designing a new behaviour, the same principles should apply. For cancellation, that means:

- maintaining interface immutability means any cancellation design should not allow the *user* of the Promise to interfere with its resolution
- simplicity means that Promise should remain as simple to describe and understand as possible

A few in the [the whatwg discussion][fetch-cancel-discussion] felt the need to completey design cancellation. Pick your way through to find them. Unfortunately, the designs suffer variously from a couple of issues:

- fail to apply or adhere to the principles
- ask for changes to specs that are already implemented

None seem to 'fit', like a square peg in a round hole. Something's not right.

### Promise & fetch

Let's look back at the key bits of a Promise:

> - are a container for values
> - exist in one of three states (pending, fulfilled, and rejected)
> - transition *only* from pending to fulfilled *or* rejected
> - expose a single method, `then`, that returns a new Promise

Now compare that to [the fetch spec][fetch-spec]. It's far, far too big for me to even address.

To my eyes, a Promise cannot convey a fetch; the latter is far more complicated than a single value in one of three states.

With that in mind, here's my opinion: we should *not try to address cancellation* within the Promise spec. It's a small, useful interface and it should stay that way. Instead, let's find new primitives that have desirable properties that we can apply to fetch.

Of course, we might want to reuse Promise in places: that's fine, *that's what abstractions are for*.

## What's next?

I'm not going to design a solution here: this post is long enough. Instead, I would like to see some things happen:

- let's admit that, although Promise is great, it's not right for every problem
- let's look *outside of JavaScript* to find the good ways others have solved this problem
- stop [fighting][fetch-spec] over this. It's just JavaScript; chill out.

&hearts;

[fetch-engine]: https://github.com/phuu/fetch-engine
[fetch-spec]: https://fetch.spec.whatwg.org
[max-connections]: http://stackoverflow.com/a/985704
[fetch-cancel-discussion]: https://github.com/whatwg/fetch/issues/27
[es-cancel-discussion]: https://esdiscuss.org/topic/cancelable-promises
[fetch-api]: https://fetch.spec.whatwg.org/#fetch-api
[promise-spec]: https://promisesaplus.com
[google-search]: https://www.google.com/search?q=(future+OR+task+OR+asynchronous)+cancellation
