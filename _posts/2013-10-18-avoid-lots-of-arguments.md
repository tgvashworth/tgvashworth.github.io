---
published: true
layout: post
title: Avoid lots of arguments
---

If you're writing a function that takes lots of arguments, it might be a sign that you need to refactor. One way is to use an arguments object.

Why are lots of arguments bad?

- Order matters, and order is hard to remember. It's easy to get them out of sync.
- Reading the code that calls this function will not make any sense unless you know how the function uses (or what the function calls) the arguments.

It's just a heuristic, but I'd say any more than three is too many.

```
var doAThing = function (id, someUrl, isAboutSharks, mightInvolvePonies, callback) {
  // ...
};
```

That's not great, becuase the call might look like this:

```
doAThing(shark.id, "/shark/:id/sightings-with-ponies.json", true, shark.getPonyInvolvement(), function (err, result) { ... });
```

Remove the middle `true` and all hell breaks loose.

Switching to an arguments object is easy:

```
var doAThing = function (id, args, callback) {
  // Provide some defaults for things not passed
  if (typeof args.isAboutSharks === "undefined") {
    args.isAboutSharks = true;
  }
  // (or use an library's defaults method)
  var options = _.defaults(args, {
    url: '/sharks.json',
    isAboutSharks: true,
    mightInvolvePonies: false
  };
  // use args.isAboutSharks or args.mightInvolvePonies
};
```

Now the call could look like:

```
doAThing(shark.id, {
  mightInvolvePonies: shark.getPonyInvolvement()
}, function (err, result) { ... });
```

Clean, clear and easy to read. Yum.