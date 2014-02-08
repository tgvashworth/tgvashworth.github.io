---
layout: post
title: A Quick Intro to TypeScript
date: 2012-10-2 1:00
mood: hsl(190, 60%, 50%)
---

I followed [my own advice](/2012/10/01/try-something-new.html) and tried [TypeScript](http://www.typescriptlang.org/).

First, a disclaimer. Though I have not been playing with it for long, I found the documentation pretty dense so I thought I'd write up what I've found so far in the hope that it saves you some time. **Use at your own risk.**

### WTF is TypeScript?

In Microsoft's own words...

> TypeScript is a language for application-scale JavaScript development. TypeScript is a typed superset of JavaScript that compiles to plain JavaScript. Any browser. Any host. Any OS. Open Source.

A bit dramatic and emo, but that's OK. Microsoft's a pretty young, small company and they'll learn.

Basically, it's a superset of the Javscript you know and love. Technically, it's a superset of ECMAScript 5 (ES5) syntax (and no, that's not a skin disease).

TypeScript adds optional [static typing](http://en.wikipedia.org/wiki/Type_system#Static_typing), and includes some of the proposed specification for ECMAScript 6 (ES6) that's being worked on in a [dungeon somewhere](http://www.ecmascript.org/). Basically, that means classes and modules.

That means that every Javascript program is also a TypeScript program, but not the other way, which is good becuase a TypeScript program will generally compile to **less** Javascript. [Cough.](http://lostechies.com/jimmybogard/2011/10/12/the-dart-hello-world/)

Some [others](http://www.zdnet.com/microsoft-typescript-can-the-father-of-c-save-us-from-the-tyranny-of-javascript-7000005054/) have [opinions](http://blog.izs.me/post/32697104162/thoughts-on-typescript). To see this stuff for yourself, have a gander at Microsoft's [Specification PDF](http://www.typescriptlang.org/Content/TypeScript%20Language%20Specification.pdf).

Anyway, let's dive in.

### Installing

Bish, bash, bosh:

`npm install -g typescript`

This adds `tsc` to your shell, and you'll use it to compile `.ts` files.

I've been doing it like this, to make Node run the compiled output:

`tsc index.ts && node index`

Now let's write some code...

### Object types

In Javascript we often chuck around objects containing strings, numbers and functions, but the situation often arises when a property is missing from an object. Wouldn't it be nice to have an automatic sanity check that an object had the right properties?

TypeScript adds functionality to do this.

The first part, called an **object type**, allows us to specify the structure of an object before we create it. A named object type is called an interface.

{% highlight javascript %}
interface Person {
  name: string;
  age?: number; // optional
  greeting: () => string;
}
{% endhighlight %}

Now TypeScript knows how a Person object should look. Then, when we define such an object, we can make sure that we are conforming.

{% highlight javascript %}
var tom: Person = {
  name: "Tom",
  age: 19,
  greeting: function () {
    return 'Hello!';
  }
};
{% endhighlight %}

`var tom: Person` indicates that `tom` must conform to our specification above. But, if we don't conform...

{% highlight javascript %}
var tom: Person = {
  name: "Tom",
  says: function () {
    return 'Uh oh!';
  }
};
{% endhighlight %}

TypeScript throws us a handy error...

> Cannot convert '{ name: string; says: () => string; }' to 'Person': Type '{ name: string; says: () => string; }' is missing property 'greeting' from type 'Person'


### Function Types

The second part of ensuring an object, passed as an argument, will has the correct properties is a really neat feature of TypeScript called a **function type**.

Kinda like object types, function types are for specifying the **signature** of a function, similar(-ish) to functional languages like Haskell.

For example, if we wanted to create a function to that simulated prodding an aformentioned 'Person' then we could specify the function type to make sure that it was always passed a `Person` to prod.

{% highlight javascript %}
var prod: (person: Person) => string;
{% endhighlight %}

The above ensures that the argument passed to `prod` is a `Person`, and that the return type from `prod` is a string. When we actually create the `prod` function, we can be a bit more confident of the outcome.

{% highlight javascript %}
prod = function(person) {
  return person.name + " said " +
         person.greeting();
}
{% endhighlight %}

It's worth noting that this can all be done in one go too:

{% highlight javascript %}
var prod:
  (person: Person) => string =
  function(person) {
    return person.name + " said " +
           person.greeting();
  }
{% endhighlight %}

### Much more to learn

There's a whole lot more the TypeScript that I have yet to explore, but I just thought I'd put together a quick intro for anyone wondering.

Of course, the object and function types above don't replace regular runtime checks, but they definitely could be a great way of catching errors before they get run.