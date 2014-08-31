---
layout: post
title: "CSP and transducers"
---

Learning [Clojure][clj] has introduced me to some really fascinating ideas. I really believe in the importance of [trying new things][try-something-new], so I've been playing with two of them — an old idea and a new one: the [Clojure/core.async interpretation][core.async-channels] of C. Hoare's [Communicating Sequential Processes][csp] (CSP), and Rich Hickey's [transducers][transducers], coming soon to a Clojure near you.

Hopefully, this post will serve two purposes: to solidify these ideas in my mind by explaining them, and — by proxy — help someone else to understand. To weed out mistakes and weaknesses in my own thinking I'm pretty explicit each small conceptual step, particularly when it comes to transducers. It's a long one, but hopefully useful!

**tl;dr** — [There's code on GitHub](repo).

First, a quick introduction to the mass of prior work here...

### CSP?

[CSP][csp] is a formalised way to describe communication in concurrent systems. If that's sounds a little dry, it's because it is — but like many a snore-inducing concept, when hurled at problems in the real world things get a whole lot more interesting. A bit like yoghurt.

### core.async?

Just over a year ago an implementation of CSP called [core.async][core.async] was released to the Clojure community, offering "facilities for async programming and communication." It introduced [channels][core.async-channels], a [simple][simple] way to coordinate [entities][actor-model] in a [system][language-of-the-system]. The library is compile-target agnostic so it can also be used from [ClojureScript][cljs].

### Transducers?

The most recent development in this epic saga (spanning almost [40 years][csp-paper] of computing history!) are [transducers][transducers], a "powerful and composable way to build algorithmic transformations". Again dry but very powerful in use — and very hard for me to understand!

[Talks](core.async-nolen-talk) about [how these concepts tie together][core.async-webinar] fascinated me, and I've been [toying with the ideas][om-do] using [ClojureScript][cljs] and [David Nolen][david-nolen]'s excellent [Om][om] framework. In addition, these ideas tie closely with Twitter's [Flight framework][flight] on which I work.

However I've never felt truly comfortable with what's going on under the hood, and since the best way to learn anything is to *do it yourself*, I've been experimenting!

Oh, and just quickly — I'm not going to spend very much time on *why* you might want this stuff. Many of the links above will help.

### What's the problem?

There's a whole stack of ideas that combine to make channels and transducers valuable, but I'll pick just one: *events are a bad primitive for data flow*. They require distribution of mutable state around your code, and it's not idiomatic or pleasant to flow data through events:

```js
pubsub.on('users:response', function (users) {
    users
        .filter(function (user) {
            return !user.muted;
        })
        .forEach(function (user) {
            pubsub.emit('posts:request', {
                user: user.id
            });
        })
    })
});

pubsub.on('posts:response', function (data) {
    ...
});

pubsub.emit('users:request');
```

Events are fine for one-shot notifications, but break down when you want to coordinate data from a number of sources. Event handlers tend to not be very reusable or composable.

core.async's channels offer an alternative that is ideal for flow control, reuse and composability.

> I'll leave it to David Nolen to [show you why][core.async-nolen].

### Channels in JavaScript

The first step was to implement the core.async primitive — channels — and their fundamental operations: `put` and `take`.

Channels are pretty simple: they support producers and consumers that `put` values to, and `take` values from, from the channel. The default behaviour is "one-in, one-out" — a `take` from the channel will give you only the least-recently `put` value, and you have to explicitly `take` again to get the next value. They're like queues.

It's immediately obvious that this decouples the producer and consumer – they each only have to know about the channel to communicate, and it's many-to-many: multiple producers can `put` values for multiple consumers to `take`.

I'm not going to detail [the exact implementation][repo-channel.js] here, but making a new channel is as simple as asking for one: `var c = chan()`.

You can try channels out in this JS Bin:

<a class="jsbin-embed" href="http://jsbin.com/bajenu/3/embed?js,console">JS Bin</a>

> If you get errors, make sure to click 'Run'.

Stuck for ideas? Try:

```js
> c = chan()
...
> chan.put(c, 10)
...
> chan.take(c, console.log.bind(console, 'got: '))
got: 10
...
> chan.take(c, console.log.bind(console, 'got: '))
...
> chan.put(c, 20)
got: 20
...
```

**Nice**. I've [added a few upgrades][repo-channel.js], but fundamentally things stay the same.

> By the way... these ideas are firmly rooted in functional programming, so I'm avoiding methods defined on objects where possible, instead preferring functions that operate on simple data structures.

We have working channels!

### Transducers in JS

Above, transducers were described as a "powerful and composable way to build algorithmic transformations." While enticing, this doesn't really tell us much. Rich Hickey's [blog post][transducers], from which that quote is taken, expands somewhat but I still found them very hard to comprehend.

> In fact, understanding them meant spending hours frustratedly scribbling on a mirror with a whiteboard pen.

To me, transducers are a generic and *composable* way to operate on a collection of values, producing a new value or new collection of new values. The word 'transducer' itself can be split into two parts that reflect this definition: 'transform' — to produce some value from another — and 'reducer' — to combine the values of a data structure to produce a new one.

To understand transducers I built up to them from first principles by taking a concrete example and incrementally making it more generic, and that's what we're going to do now.

We're aiming for a **"composable way to build algorithmic transformations."**

I hope you're excited.

![popcorn][popcorn]

### From the bottom to the top...

First, we have to realise that many array (or other collection) operations like `map`, `filter` and `reverse` can be defined in terms of a `reduce`.

To start with, here's an example that maps over an array to increment all its values:

```js
[1,2,3,4].map(function (input) {
    return input + 1;
}) // => [2,3,4,5]
```

Pretty simple. Note that two things are implicit here:

- The return value is built up from a new, empty array.
- Each value returned is added to the end of the new array as you would do manually using JavaScript's `concat`.

With this in mind, we can convert the example to use `.reduce`:

```js
[1,2,3,4].reduce(function (result, input) {
    return concat(result, input + 1);
}, []) // => [2,3,4,5]
```

---

To get around JavaScript's unfortunate Array `concat` behaviour, I've redefined it to a function called `concat` that adds a single value to an array:

```js
function concat(a, b) {
    return a.concat([b]);
}
```

---

> By the way, we're about to get into higher-order function territory. If that makes you queasy, it might be time to [do some reading][functional-js] and come back later!

Our increment-map-using-reduce example isn't very generic, but we can make it more so by wrapping it up in a function that takes an array to be incremented:

```js
function mapWithIncr(collection) {
    return collection.reduce(function (result, input) {
        return concat(result, input + 1);
    }, []);
}

mapWithIncrement([1,2,3,4]) // => [2,3,4,5]
```

This can be taken a step further by passing the transformation as a function. We'll make one called `inc`:

```js
function inc(x) {
    return x + 1;
}
```

Using this with any collection requires another higher-order function, `map`, that combines the transform and the collection.

This is where things start to get interesting: this function contains the *essence* of what it means to `map` — we *reduce* one collection to another by *transforming* the values and *cons-ing* the results together.

```js
function map(transform, collection) {
    return collection.reduce(function (result, input) {
        return concat(result, transform(input));
    }, []);
}
```

In use, it looks like this:

```js
map(inc, [1,2,3,4]) // => [2,3,4,5]
```

Very nice.

### Algorithmic transformations

So what's the next abstraction in our chain? It's perhaps worth restating the goal: a "composable way to build algorithmic transformations." There's two key phrases there: "algorithmic transformations" and "composable". We'll deal with them in that order.

`map`, defined above, is a kind of algorithmic transformation. Another I mentioned earlier is `filter`, so let's define that in same way we did for `map`.

> Filter better fits the word "reduce" because it can actually produce fewer values than it was given.

We're going to quickly jump from a concrete example, through the `reduce` version, to a generic `filter` function that defines the *essence* of what it means to `filter`.

```js
// Basic filter
[1,2,3,4].filter(function (input) {
    return (input > 2);
}) // => [3,4]

// Filter with reduce
[1,2,3,4].reduce(function (result, input) {
    return (
        input > 2 ?
            concat(result, input) :
            result
    );
}, []) // => [3,4]

// Transform (called the predicate)
function greaterThanTwo(x) {
    return (x > 2);
}

// And finally, filter as function
function filter(predicate, collection) {
    return collection.reduce(function (result, input) {
        return (
            predicate(input) ?
                concat(result, input) :
                result
        );
    }, [])
}
```

In use, it looks like this:

```js
filter(greaterThanTwo, [1,2,3,4]) // => [3,4]
```

### Composable

Now we can construct a couple of different algorithmic transformations, we're missing "composable" bit from that original definition. We should fix that.

How does composability apply to the algorithmic transformations we've already defined — `map` and `filter`? There are two ways to combine these transformations:

- Perform the first transformation on the whole collection before moving on to the second.
- Perform all transformations on the first element of the collection before moving on to the second.

We can already do the former:

```js
filter(greaterThanTwo, map(inc, [1,2,3,4])) // => [2,3]
```

We can even use `compose`:

```js
var incrementAndFilter = compose(
    filter.bind(null, greaterThanTwo),
    map.bind(null, inc)
);

incrementAndFilter([1,2,3,4]) // => [2,3]
```

However, this has a number of issues:

- It cannot be done lazily.
- It cannot be parallelised.
- The operations are tied very closely to input and output data structure.

The converse is true for the latter way of combining the transformations, and so is the much more desirable end result.

> For a discussion of why this is the case, look into the [fork-join model][fork-join].

Frankly, I found this extremely difficult; I just couldn't understand *how* they could be composed generically?

We need to take another step up back. Time to talk about reducing functions.

### Reducing functions

A reducing function is any function that can be passed to `reduce`. They have the form: `(something, input) -> something`. They're the inner-most function in the `map` and `filter` examples.

These are the things we're need to be composing, but right now they are hidden away in `map` and `filter`.

```js
function map(transform, collection) {
    return collection.reduce(
        // Reducing function!
        function (result, input) {
            return concat(result, transform(input));
        },
        []
    );
}

function filter(predicate, collection) {
    return collection.reduce(
        // Reducing function!
        function (result, input) {
            return (
                predicate(input) ?
                    concat(result, input) :
                    result
            );
        },
        []
    )
}
```

To get at the reducing functions, we need to `map` and `filter` more generic by extracting the pieces they have in common:

- Use of collection.reduce
- The 'seed' value is an empty array
- The `concat` operation performed on `result` and the `input` (`transform`-ed or not)

---

First, let's pull out the use of `collection.reduce` and the seed value. Instead we can *produce reducing functions* and pass them to `.reduce`:

```js
function mapper(transform) {
    return function (result, input) {
        return concat(result, transform(input));
    };
}

function filterer(predicate) {
    return function (result, input) {
        return (
            predicate(input) ?
                concat(result, input) :
                result
        );
    };
}

[1,2,3,4].reduce(mapper(inc), []) // => [2,3,4,5]
[1,2,3,4].reduce(filterer(greaterThanTwo), []) // => [3,4]
```

Nice! We're getting closer but we still cannot compose two or more reducing functions. The last piece of shared functionality is the key: the `concat` operation performed on `result` and the `input`.

Remember we said that reducing functions have the form `(something, input) -> something`? Well, concat just one such function:

```js
function concat(a, b) {
    return a.concat([b]);
}
```

That means there's actually two reducing functions:

- One that defines the job (mapping, filtering, reversing...)
- Another that, within the job, combines the existing `result` with the `input`

So far we have only used `concat` for the latter, but who says we have to? Could we use *another, completely different reducing function* – like, say, one produced from `mapper`?

Yes, we could.

---

Next, we'll make a very explicit example by rewriting `filterer` to use `mapper` to combine the `result` with the `input`, and explore how the data flows around.

Before we do that, we need a new function: `identity`. It simply returns whatever it is given:

```js
function identity(x) {
    return x;
}

[1,2,3,4].reduce(mapper(identity), []) // => [1,2,3,4]
```

We can rewrite filter to use `mapper` quite easily:

```js
function lessThanThree(x) {
    return (x < 3);
}

function mapper(transform) {
    return function (result, input) {
        return concat(result, transform(input));
    };
}

function filterer(predicate) {
    return function (result, input) {
        return (
            predicate(input) ?
                mapper(identity)(result, input) :
                result
        );
    };
}

[1,2,3,4].reduce(filterer(lessThanThree), []) // => [1,2]
```

To show how this works, let's step debug in our heads:

1. `filterer(lessThanThree)` produces a reducing function which is passed to `.reduce`.
2. The reducing function is passed `result` — currently `[]` — and the first `input` — `1`.
3. The `predicate` is called and returns `true`, so the first expression in the ternary is evaluated.
4. `mapper(identity)` returns a reducing function, then called with `[]` and `1`.
    1. The reducing function's `transform` function — `identity` — is called, returning the same input it was given.
    2. The input is `concat`-ed onto the `result` and returned.
5. The new result — now `[1]` — is returned, and so the `reduce` cycle continues.

> I'd recommend running this code and looking for yourself!

What has this gained us? Well, now we can see that a reducing function can make use of another reducing function – it doesn't have to be `concat`!

In fact, if we altered `filterer` to use `mapper(inc)`, we'd get:

```
[1,2,3,4].reduce(filterer(lessThanThree), []) // => [2,3]
```

---

This is starting to feel a lot like composable algorithmic transformation, but we don't want to be manually writing composed functions – we want to use `compose`!

To do so, we need the reducing functions to rely on another reducing function to combine `result` and `input`. Since we need functions that take only one argument we can pull out the inner reducing function (the combiner), to make reducing functions that express the essence of their job without being tied to any particular way of combining their arguments.

We'll change the names again to express the nature of what's going on here:

```js
function mapping(transform) {
    return function (reduce) {
        return function (result, input) {
            return reduce(result, transform(input));
        };
    };
}

function filtering(predicate) {
    return function (reduce) {
        return function (result, input) {
            return (
                predicate(input) ?
                    reduce(result, input) :
                    result
            );
        };
    };
}
```

Those new inner functions – the ones that take a `reduce` function — are **transducers**. They encapsulate some reducing behaviour without caring about the nature of the `result` data structure.

In fact, we've offloaded the responsibility of combining the transformed `input` with the `result` to the *user* of the transducer, rather than expressing it within the reducing function. This means we can reduce generically into any data structure!

Let's see this in use by creating that filtering-and-incrementing transducer again:

```js
var filterLessThanThreeAndIncrement = compose(
    filtering(lessThanThree),
    mapping(inc)
);

[1,2,3,4].reduce(filterLessThanThreeAndIncrement(concat), []) // => [2,3]
```

Wow. Notice:

- We only specify the seed data structure once, when we use the transducer.
- We only tell the transducers how to combine their `input` with the `result` once (in this case, with `concat`), by passing it to the `filterLessThanThreeAndIncrement` transducer.

To prove that this works, let's turn it into an object with the resulting values as keys *without altering the reducing functions*.

```js
[1,2,3,4].reduce(filterLessThanThreeAndIncrement(function (result, input) {
    result[input] = true;
    return result;
}), {}) // => { 2: true, 3: true }
```

![Woo!][dance]

---

Let's try it with some more complex data. Say we have some `posts`:

```js
var posts = [
    { author: 'Agatha',  text: 'just setting up my pstr' },
    { author: 'Bert',    text: 'Ed Balls' },
    { author: 'Agatha',  text: '@Bert fancy a thumb war?' },
    { author: 'Charles', text: '#subtweet' },
    { author: 'Bert',    text: 'Ed Balls' },
    { author: 'Agatha',  text: '@Bert m(' }
];
```

Let's pull out who's talked to who and build a graph-like data structure.

```js
function graph(result, input) {
    result[input.from] = result[input.from] || [];
    result[input.from].push(input.to);
    return result;
}

var extractMentions = compose(
    // Find mentions
    filtering(function (post) {
        return post.text.match(/^@/);
    }),
    // Build object with {from, to} keys
    mapping(function (post) {
        return {
            from: post.author,
            to: post.text.split(' ').slice(0,1).join('').replace(/^@/, '')
        };
    })
);

posts.reduce(extractMentions(graph), {}) /* =>
    { Agatha:  ['Bert', 'Charles'],
      Bert:    ['Agatha'],
      Charles: ['Bert'] } */
```

### Applying transducers to channels

Now we have all the parts of a "composable way to build algorithmic transformations" we can start applying them to any data pipeline – so let's try channels. Again, I'm not going to show you the [channel-level implementation][repo-channel.js], just some usage examples.

We're going to listen for DOM events and put them into a channel that filters only those that occur on even x & y positions and maps them into a triple of `[type, x, y]`.

First, two additions to our function library:

```js
// Put DOM events into the supplied a channel
function listen(elem, type, c) {
    elem.addEventListener(type, function (e) {
        chan.put(c, e);
    });
}

function even(x) {
    return (x % 2 === 0);
}
```

Now let's create a channel, and pass it a transducer. The transducer will be used to reduce the data that comes down the channel.

```js
var c = chan(
    1, // Fixed buffer size (only one event allowed)
    compose(
        // Only events with even x & y
        filtering(function (e) {
            return (
                even(e.pageX) &&
                even(e.pageY)
            );
        }),
        // e -> [type, x, y]
        mapping(function (e) {
            return [e.type, e.pageX, e.pageY];
        })
    )
);
```

Next we'll hook-up the events and the channel:

```js
listen(document, 'mousemove', c);
```

And, finally, `take` in a recursive loop:

```js
(function recur() {
    chan.take(c, function (v) {
        console.log('got', v);
        recur()
    });
}());
```

Running this code, you should see lots of events in your console – but only those with even x & y positions:

```
> got ["mousemove", 230, 156]
> got ["mousemove", 232, 158]
> got ["mousemove", 232, 160]
> got ["mousemove", 234, 162]
```

### Stateful transducers

Finally, we'll take a look at a stateful transducers, building a `gateFilter` to detect "dragging" using `mousedown` and `mouseup` event, and a `keyFilter` that matches against a property of the channel data.

```js
function gateFilter(opener, closer) {
    var open = false;
    return function (e) {
        if (e.type === opener) {
            open = true;
        }
        if (e.type === closer) {
            open = false;
        }
        return open;
    };
}

function keyFilter(key, value) {
    return function (e) {
        return (e[key] === value);
    };
}

var c = chan(
    1,
    compose(
        // Only allow through when mouse has been down
        filtering(gateFilter('mousedown', 'mouseup')),
        // Filter by e.type === 'mousemove'
        filtering(keyFilter('type', 'mousemove')),
        // e -> [type, x, y]
        mapping(function (e) {
            return [e.pageX, e.pageY];
        })
    )
);

// Listen for relevant events
listen(document, 'mousemove', c);
listen(document, 'mouseup',   c);
listen(document, 'mousedown', c);

// Take in a loop
(function recur() {
    chan.take(c, function (v) {
        console.log('got', v);
        recur()
    });
}());
```

Whew. Pretty cool, eh?

### And finally...

I think there's a great deal of expressive power here, and I'm intrigued by the possibilities and implications.

My real goal is to explore [the Actor model][actor-model] as it relates to front-end engineering, particularly in preventing an explosion of complexity with increasing scale. It's the model [Flight][flight] uses, but I'm not wholly convinced events — while perfect for one-shot notifications — are the right primitive for coordinating behaviour and flow-control.

The result of this work is [on Github][repo] so please do check that out, and [email][email] or [Tweet][twitter] me with feedback.

Finally finally, a massive thank-you to [Stuart][sil] &amp; [Passy][passy] who gave me top-notch feedback on this article!

<!-- JS Bin -->

<script src="http://static.jsbin.com/js/embed.js"></script>

<!-- Clojure* -->

[clj]: http://clojure.org/ "Clojure"
[cljs]: https://github.com/clojure/clojurescript "ClojureScript"
[david-nolen]: https://github.com/swannodette "David Nolen (swannodette)"
[om]: https://github.com/swannodette/om "swannodette/om"

<!-- Ideas -->

[actor-model]: http://en.wikipedia.org/wiki/Actor_model "The Actor model"
[csp]: http://en.wikipedia.org/wiki/Communicating_sequential_processes "Communicating Sequential Processes"
[csp-paper]: https://assets.cs.ncl.ac.uk/seminars/224.pdf "Communicating Sequential Processes — C. A. R. Hoare"
[transducers]: http://blog.cognitect.com/blog/2014/8/6/transducers-are-coming "TRANSDUCERS ARE COMING"
[partial-application]: http://en.wikipedia.org/wiki/Partial_application "Partial application"
[fork-join]: http://en.wikipedia.org/wiki/Fork%E2%80%93join_model "Fork-join model"

<!-- core.async -->

[core.async]: https://github.com/clojure/core.async "core.async"
[core.async-channels]: http://clojure.com/blog/2013/06/28/clojure-core-async-channels.html "Clojure core.async Channels"

<!-- Talks -->

[simple]: http://www.youtube.com/watch?v=rI8tNMsozo0 "Simplicity Matters — Rich Hickey"
[language-of-the-system]: http://www.youtube.com/watch?v=ROor6_NGIWU "The Language of the System — Rich Hickey"
[core.async-nolen]: http://www.youtube.com/watch?v=AhxcGGeh5ho "core.async — David Nolen"
[core.async-webinar]: http://www.youtube.com/watch?v=AhxcGGeh5ho "core.async — David Nolen"

<!-- JS -->

[flight]: https://flightjs.github.io "Twitter Flight"
[functional-js]: http://shop.oreilly.com/product/0636920028857.do "Functional JavaScript — Michael Fogus"

<!-- Me -->

[repo]: https://github.com/phuu/csp "phuu/csp"
[repo-channel.js]: https://github.com/phuu/csp/blob/master/channel.js "phuu/csp/channel.js"
[om-do]: https://github.com/phuu/om-do "phuu/om-do"
[try-something-new]: /2012/10/01/try-something-new.html "Try Something New"
[email]: mailto:tgvashworth@gmail.com "Email me!"
[twitter]: https://twitter.com/phuunet "@phuunet"

<!-- People -->

[passy]: https://twitter.com/passy "Pascal Hartig"
[sil]: https://twitter.com/sil "Stuart Langridge"

<!-- Images -->

[dance]: http://media2.giphy.com/media/elDpPAkoxtnmE/giphy.gif "Woop!"
[popcorn]: http://media.giphy.com/media/LvaswPm6IHn44/giphy.gif "Popcorn"
