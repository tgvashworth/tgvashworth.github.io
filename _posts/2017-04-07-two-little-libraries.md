---
layout: post
---

Hey.

I want to tell you about two little JavaScript libraries I built.

`if-expression` and `try-expression` do simiar things, putting a bit of functional beauty around JavaScript's `if` and `try` statements.

Let's take a look.

---

In a minute I'll introduce the libraries separately and in detail, but to start with here's a full before/after example. First, some code you might write without these tools...


```js
function getErrorMessage(error) {
  let errorMessage;
  if (error.code === 0) {
    errorMessage = "The giant spiders escaped.";
  } else if (error.code === 10) {
    errorMessage = "I dunno but I think kittens were involved.";
  } else {
    errorMessage = "Yikes. Run away?"
  }
  return errorMessage;
}

function doMagicalThings({ hocus, pocus } = {}) {
  let spell;
  try {
    spell = invokeTheDarkOnes(hocus);
  } catch (portalToTheUnderworldException) {
    spell = abracadabraAlacazam(pocus);
  }

  try {
    return castToString(spell); // See what I did there?
  } catch (unintendedConsequences) {
    return getErrorMessage(unintendedConsequences);
  } finally {
    cleanupOpenPortals();
  }
}
```

... and the same thing with `if-expression` and `try-expression`:

```js
import iff from "if-expression";
import tryy from "try-expression";

function getErrorMessage(error) {
  return iff(
    error.code === 0,
    () => "The giant spiders escaped.",

    error.code === 10,
    () => "I dunno but I think kittens were involved.",

    () => "Yikes. Run away?"
  );
}

function doMagicalThings({ hocus, pocus } = {}) {
  const spell = tryy(
    () => invokeTheDarkOnes(hocus)
    (portalToTheUnderworldException) =>
      abracadabraAlacazam(pocus)
  );

  return tryy(
    () => castToString(spell),
    (unintendedConsequences) =>
      getErrorMessage(unintendedConsequences),
    () => cleanupOpenPortals()
  )
}
```

Major differences:

* `iff` and `tryy` *always* return values
* the clauses are (arrow) functions
* there's no need to create a mutable binding (`let`, `var`) because you can return a value into a `const`

Read on for an in-depth look.

---

## `if-expression`

```
$ npm install --save if-expression
```

`if-expression` — `iff` for short — is pretty simple to use. You can find the code [on GitHub](https://github.com/tgvashworth/if-expression), and here's a rapid overview.

```js
const largerNum = iff(
  a > b,
  () => a,
  () => b
);
```

The first argument is the *condition*. If it evaluates to [something truthy](https://developer.mozilla.org/en/docs/Glossary/Truthy) then the second argument — the first *clause* — is called. I've used arrow functions above for readability, but you can just pass a function:

```js
return iff(
  featureFlag("fancy_new_thing"),
  useFancyNewThing,
  useUglyOldThing
);
```

If the condition is falsey, the last argument — the *else* clause — is run.

It's variadic, so it supports a variable number of arguments, allowing you to supply multiple *conditions* and *clauses*. The conditions and clauses are paired up like if-else:

```js
return iff(
  x < 0,
  () => "negative",

  x > 0,
  () => "positive",

  () => "zero"
);
```

The last argument is always an else *clause*.

In any of the clause positions you can just supply a value if you want:

```js
return iff(
  x < 0,
  "negative",

  x > 0,
  "positive",

  "zero"
);
```

---

**Thunk it up**: A note about laziness, and functions as conditions...

In regular JavaScript execution, the conditions of if-else branches are *lazily* evaluated, that is, they are only run if they need to checked for truthyness.

However, because `if-expression` is a plain ol' JavaScript function, the conditions are *greedily* evaluated: all conditions will be evaluated *before* `if-expression` has had a chance to decide if the first condition is truthy.

What does this mean in practice?

For most cases, it doesn't matter: you shouldn't be putting side-effecting code in `if` clauses, and the performance implications are negligible.

However, if the laziness matters to you, then pass the condition as a function:

```
return iff(
  () => x < 0,
  () => "negative",
  () => "not negative"
);
```

*However*, that means functions cannot be used as conditions without explicit conversion to a boolean value, which is different from JavaScript's built-in `if`. In the following example, `a.someMethod` *will be called*:

```js
return if(
  a.someMethod,
  doAThing,
  doAnotherThing
);
```

To avoid this, you have two options. Either explicitly cast to a boolean...

```js
Boolean(a.someMethod)
```

... or return the method from a wrapper function:

```js
() => a.someMethod
```

---

## `try-expression`

```
$ npm install --save try-expression
```

`try-expression` — `tryy` for short — is a whole lot like `if-expression`, but makes it easy to create `try-catch-finally` expressions. Again, there's code [on GitHub](https://github.com/tgvashworth/try-expression).

Run some some code and catch any errors, like you would use `try-catch`:

```js
return tryy(
  () => doRiskyThing(),
  error => {
    logError(error);
    return 'Sorry!';
  }
);
```

The first argument is always a function — a `try` clause. If it throws, the second argument — the `catch` clause — is used.

In the example above, if `doRiskyThing` throws, this code will return `'Sorry!'`.

As you can see, the `catch` clause is passed the error that was thrown within the `try` clause.

Like `if-expression`, it's possible to just supply a value if there's an error:

```js
return tryy(
  () => throwSomething(),
  { squibbles: 4 }
);
```

`tryy` also supports a `finally` clause for cleaning up, as in `try-catch-finally`:

```js
const result = tryy(
  ()  => ['Success', readFile()],
  err => ['Failure', err],
  ()  => closeFile()
);
```

Note that, to avoid [confusing JavaScript behaviour](http://eslint.org/docs/rules/no-unsafe-finally), anything you return from the `finally` function is discarded.

---

Here are some nice things you can do with these libraries...

This function is half finished, but the intent is clear:
we're going to choose from the menu. To make that obvious,
I've used *only* an else clause which will *always* run.

```js
function chooseSomeLunch(person, menu) {
  return if(
    () => "not sure yet"
  );
}
```

When we come to extend this code, the change is tiny:

```js
function chooseSomeLunch(person, menu) {
  return if(
    onADiet(person),
    () => menu.salad,

    () => "not sure yet"
  );
}
```

In this next example, the first clause is getting a little lengthy:

```js
function shouldIEatThisCake() {
  return iff(
    nobodyIsWatching,
    () => {
      const isItLunchTime = consultTheAstrolabe();
      const caloriesBurned = activities.map(getCalories).reduce(add);
      // ... and so on and so forth ...
      return theFinalDecision;
    },

    () => false
  );
}
```

It's easily refactored to be shorter and more readable:

```js
function shouldIEatThisCake() {
  return iff(
    nobodyIsWatching,
    () => thinkRealHard(),

    () => false
  );
}
```

Or even:

```js
function shouldIEatThisCake() {
  return iff(
    nobodyIsWatching,
    thinkRealHard,
    false
  );
}
```

Next, we can easily build a "getter" function that tries to reach into objects, but will return a default value if the value doesn't exist:

```js
function getIn(getter, defaultValue, data) {
  return tryy(
    () => getter(data),
    () => defaultValue
  );
}

const data = {
  a: {
    b: {
      c: "c"
    }
  }
};

const c = getIn(data => data.a.b.c, "default c", data);
const r = getIn(data => data.p.q.r, "default r", data);
```
