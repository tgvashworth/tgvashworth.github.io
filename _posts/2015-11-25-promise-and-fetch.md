---
title: "Promise & fetch cancellation"
date: 2015-11-25
layout: post
---

Working on [fetch-engine][fetch-engine] has had me wondering about how we interact with the network from JavaScript.

I'd like the library to make *network request timeouts* simple. They're a good practice for distributed systems, and we should all be using them without thinking about it.

To build timeout support, there needs to be a way cancel the in-flight request, free up [HTTP resources][max-connections] in the browser, and notify the code performing the request that a timeout has occurred. To see how fetch-engine could do this, I looked into how we could make network requests.

[fetch][fetch-spec] is becoming a standard and making its way into browsers, so my intuition was to base fetch-engine on it, hence the name.

As I was looking at the fetch API in more detail, I discovered that there isn't a way to cancel an in-flight request. This makes timeouts impossible, which is a little unfortunate.

There's a discussion about it at [whatwg/fetch#27][fetch-cancel-discussion] but it's an appalling exposition of the standards process, littered with personal attacks, pointed sarcasm, and useless noise. There was some constructive discussion, but no resolution.

There's also a (thankfully shorter) [es-discuss thread on Promise cancellation][es-cancel-discussion], but again without resolution.

The rest of this post conveys my thoughts on the issue. The world probably doesn't *need* that, but here they are anyway. I'll try to take an evidence based approach, and please call me out if I deviate from that.

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

When designing a new behaviour promise, these desirable properties should be maintained. For cancellation, that means:

- maintaining interface immutability such that cancellation does not allow the *user* of the Promise to interfere with its resolution
- Promise should remain as simple to describe and understand as possible

A few in the [the whatwg discussion][fetch-cancel-discussion] felt the need to design a cancellation API. Pick your way through to find them. Unfortunately, the designs suffer variously from a couple of issues:

- fail to maintain the desirable properties of Promises
- ask for changes to existing, tangentially related specs

None seem to 'fit', like a square peg in a round hole. Something's not right.

### Promise & fetch

Let's look back at the key bits of a Promise. They:

- are a container for values
- exist in one of three states (pending, fulfilled, and rejected)
- transition *only* from pending to fulfilled *or* rejected
- expose a single method, `then`, that returns a new Promise

Now compare that to [the fetch spec][fetch-spec]. A fetch:

- is not just a single value (a fetch response contains streams, for example)
- has more than three states (cancelled, anyone?)
- is already in in three parts: Request, fetch, and Response
- can be retried, paused, or partially complete (and still usable)

A Promise cannot be used as an interface for the intricacies of a fetch. It's far more complicated than that.

So, here's my opinion: *cancellation does not fit within the Promise spec*. It's a simple, useful tool and it should stay that way.

Instead, let's look hard at fetch, find new primitives that have desirable properties and the required features, and build the Fetch API around them.

Of course, Promises may be reused in places. That's fine, *that's what abstractions are for*.

## What's next?

I'm not going to design a solution here. Instead, I would like to see some things happen:

- let's admit that, although Promise is great, it's not right for every problem
- let's look *outside of JavaScript* to find the good ways others have solved this problem
- stop fighting over this. It's just JavaScript; chill out.

&hearts;

[fetch-engine]: https://github.com/phuu/fetch-engine
[fetch-spec]: https://fetch.spec.whatwg.org
[max-connections]: http://stackoverflow.com/a/985704
[fetch-cancel-discussion]: https://github.com/whatwg/fetch/issues/27
[es-cancel-discussion]: https://esdiscuss.org/topic/cancelable-promises
[fetch-api]: https://fetch.spec.whatwg.org/#fetch-api
[promise-spec]: https://promisesaplus.com
[google-search]: https://www.google.com/search?q=(future+OR+task+OR+asynchronous)+cancellation
