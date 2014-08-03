---
published: true
layout: post
title: Avoid lots of arguments
---

If you're writing a function that takes lots of arguments, it might be a sign that you need to refactor. One way is to use an options object.

Why are lots of arguments bad?

- Order matters, and order is hard to remember. It's easy to get them out of sync.
- Reading the code that calls this function will not make any sense unless you know how the function uses (or what the function calls) the arguments.

It's just a heuristic, but I'd say any more than three is too many.

```
function doAThing(id, someUrl, isAboutSharks, mightInvolvePonies, callback) {
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
function doAThing(id, opts, callback) {
  // Provide some defaults for things not passed
  if (typeof opts.isAboutSharks === "undefined") {
    opts.isAboutSharks = true;
  }
  // (or use a library's defaults method)
  var opts = _.defaults(opts, {
    url: '/sharks.json',
    isAboutSharks: true,
    mightInvolvePonies: false
  };
  // use opts.isAboutSharks or opts.mightInvolvePonies
});
```

Now the call could look like:

```
doAThing(shark.id, {
  mightInvolvePonies: shark.getPonyInvolvement()
}, function (err, result) { ... });
```

Clean, clear and easy to read. Yum.

This API would be even better with Promises, as it would avoid the last argument:

```
doAThing(shark.id, {
  mightInvolvePonies: shark.getPonyInvolvement()
}).then(function () { ... });
```

Very nice.
