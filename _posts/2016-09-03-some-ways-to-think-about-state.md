---
layout: post
title: "Some ways to think about state"
---

In this post I'm going to try to join dots between different ways of managing state in code, to show that common patterns can be more functional, more testable and probably more maintainable.

---

Often you'll see code that uses an instance of a class to store state, with data in member variables and methods for logic:

```js
class Player {
  constructor() {
    this.health = 100;
    this.inventory = [];
    this.level = 1;
  }

  levelUp(levels = 1) {
    this.level = this.level + levels;
  }
}
```

In this pattern, you use direct mutation to modify an instance of a player by calling methods on it:

```js
let p = new Player();
p.levelUp(2);
```

Within the methods of the class, the `this` keyword refers to the instance of the class. It's sort-of magically made available to you, and its behaviour is [*very* confusing to beginners][what-is-this].

In Python, the equivalent of JavaScript's `this` keyword for accessing the instance of a class within a method, often referred to as `self`, is instead *passed* to the method:

```python
class Player:
    def __init__(self):
        self.health = 100
        self.inventory = []
        self.level = 1

    def level_up(self, levels = 1):
        self.level = this.level + levels

p = Player()
p.level_up(2)
```

Again some magic happens to inject the reference to the instance, but at least it's explicit and you can call it what you want:

```python
class Monster:
  def __init__(monster):
    monster.health = 200
```

These concepts from JavaScript and Python are analogous in that they are an idiom for storing and updating state by mutation. Although JavaScript uses a keyword (`this`) to reference an instance, it could just as well pass it like Python.

Thinking of it like this, returning to JavaScript, we could define functions that operate on the objects, passed as the first argument:

```js
function levelUp(self, levels) {
  self.level = self.level + levels;
}

let p = new Player();
levelUp(p, 2);
```

The `self` object is a reference to the instance of a player, which is a container for player's state. We can rename the parameter to reflect this idea:

```js
function levelUp(state, levels) {
  state.level = state.level + levels;
}
```

Then we can return the state if we wanted to do further operations on the object:

```js
function leveUp(state, levels) {
  state.level = state.level + levels;
  return state;
}
```

Even better, we could avoid *mutating* the object and instead produce a new object with the changes applied:

```js
function levelUp(state, levels) {
  return {
    ...state,
    level: state.level + levels
  };
}

function Player() {
  return {
    health: 100,
    inventory: [],
    level: 1
  };
}

const p = Player();
const q = levelUp(p);
```

Now, where have we seen functions that look like `levelUp` before? Something that:

* takes two arguments
* the first is the state of some operation
* the second is a new input

Oh! Reducers!

```js
const p = Player();
const levels = [1,2,6,8];
const q = levels.reduce(levelUp, p);
// q.level === 18
```

Or, in a more "reducey" example:

```js
const vs = [1,4,5,2,6,3];
const { sum, max } = vs.reduce(
  (state, v) => ({
    sum: state.sum + v,
    max: Math.max(state.max, v)
  }),
  { sum: 0, max: 0 }
);
```

Reducing functions (the functions that you pass to `reduce`) take two arguments: an accumulator and an input value.

(Ok, really they take more, but these two are the most important.)

They return a new version of the accumulator, having used the new input.

If you've used [redux][redux] before, you'll be familiar with this idea. Their first example contains a `counter` reducer:

```js
function counter(state = 0, action) {
  switch (action.type) {
  case 'INCREMENT':
    return state + 1
  case 'DECREMENT':
    return state - 1
  default:
    return state
  }
}
```

State and a value as inputs; state as output.

That's exactly what we have in our rewritten `levelUp` function:

```js
function levelUp(state, levels) {
  return {
    ...state,
    level: state.level + levels
  };
}
```

It's a pure-function version of the original instance method.

In fact, we can convert almost any method to a reducer by taking the object in question and the input value as arguments, and outputting a new object.

Again, this is a *central* idea of a library like [redux][redux].

---

Why is this interesting?

Reducers are reusable: they work on a single input, or applied to an array as in the `reduce` example above, or even on something like an [Observable stream][obs-scan].

They are easily testable: throw the starting state and some input in, and receive back some data that you can run assertions on.

And, if you believe that pure functions and immutability lead to more maintainable code, they're more maintainable too.

---

My point is that functional ideas you've seen elsewhere — and probably enjoyed using — are more applicable that you might have thought, and that there are many angles from which you can approach at the same problem.

Honestly, I'm biased: using [simple, functional primitives](https://www.youtube.com/watch?v=-6BsiVyC1kM) with an [immutable architecture](https://vimeo.com/166790294) can *click* beautifully together. You just have to reprogram your mind to use them instead of mutable state.

[what-is-this]: http://stackoverflow.com/questions/3127429/how-does-the-this-keyword-work
[redux]: http://redux.js.org
[obs-scan]: http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html#instance-method-scan
