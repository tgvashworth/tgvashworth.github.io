---
layout: post
title: "useful js: curry and bind"
date: 2012-11-16 22:00
comments: false
---

You might have heard of currying: it's a strange name for a really, really useful technique (it comes from [this dude](http://en.wikipedia.org/wiki/Haskell_Curry)). Here I'm going to cover what it is, why you need it, and then take a look at a useful function for currying built right into Javascript (ES5+): `bind`.

### Currying

I like curry. But I think I like currying even more. So what is it?

Currying, also known as 'partial function application', is complicated to explain in just words, but I'll give it a go:

> Partial function application is fixing a set of arguments to a function, producing another function to be used later.

The new function that's produced is like a cloned version of your first function, except that some arguments are set and can't be changed. You set the arguments when you 'curry' the function.

Here's an example in psuedo-javascript:

{% highlight javascript %}
var add = function (a, b) {
  return a + b;
}

var add_ten = curry(add, 10)

var fifteen = add_ten(5)
{% endhighlight %}

Here we're currying the `add` function to produce a new function, `add_ten`, that is actually our `add` function but with the first argument fixed at 10. When you call `add_ten` you supply the second argument to `add`.

Neat, huh?

### Yup, but how does it work?

Well, let's create an implementation of `curry` from scratch.

> If you haven't already, it's worth reading my [call & apply](/2012/11/02/javascript-function-call-and-function-apply.html) post becuase this example will make heavy use of them both.

What we're going to do it make a really dumb version, then tweak and optimise as we go. We'll start simply by making the example above work.

Here it is in proper-javascript, with added (bad) curry sauce:

{% highlight javascript %}
var bad_curry = function (fn, first_argument) {
  return function (second_argument) {
    return fn(first_argument, second_argument);
  };
};

var add = function (a, b) {
  return a + b;
};

var add_ten = bad_curry(add, 10);

var fifteen = add_ten(5);
{% endhighlight %}

`fifteen` is 15. Nice. But that `bad_curry` function is pretty useless for anything other than a 2 argument function. Let's see what we can do.

### Infinite arguments

So here's a new curry function that supports any number of arguments.

{% highlight javascript %}
var meh_curry = function () {
  var fixed_args = [].slice.call(arguments);
  var fn = fixed_args.shift();
  return function () {
    var new_args = [].slice.call(arguments);
    var all_args = fixed_args.concat(new_args);
    return fn.apply(null, all_args);
  };
};

var add_four_things = function (a, b, c, d) {
  return a + b + c + d;
};

var add_5_and_6 = meh_curry(add_four_things, 5, 6);

var fourteen = add_5_and_6(2, 1);
{% endhighlight %}

Chyeah. Here's the explanation:

In case you didn't know, `[].slice.call(arguments)` turns `arguments` into an array (cos it's not one).

`meh_curry` uses that a couple of times: first, it stores the fixed arguments, and extracts the function we are currying from the front of the array (by `shift`'n it).

It then returns a new function that concatenates the fixed arguments to any arguments it recieves, and then runs the initial function using `apply`, passing an array of all the arguments `concat`'d together. Nice!

But, I think we can do a little bit better.

### Ninjafy

I've cut the above `meh_curry` into a flavoursome alternative, `curry`:

{% highlight javascript %}
var curry = function (fn) {
  var slice = [].slice,
      args = slice.call(arguments, 1);
  return function () {
    return fn.apply(this, args.concat(slice.call(arguments)));
  };
};
{% endhighlight %}

I'll leave it to you to see what I've done – if you have any questions then just ask in the comments.

By the way: ‘currying’ and partial function application are _technically_ not the same thing, but the difference is relatively insignificant.

### Bind

`bind` is really cool, let's check it out...

Javascript's real name is ECMAScript, but since that's almost a skin condition, we mostly stick with Javascript. Most of the JS you write conforms to the ECMAScript3 specification (ES3). However, ES5, the new specification (available in most browsers these days and polyfillable where not found), adds some rather useful things to the language. One of these is `bind`.

`bind` is your friendly neighbourhood currier. You can call `bind` on any function (where ES5 is available) to specify what the value of `this` should be when the function is called. It doesn't actually call the function (unlike `call` and `apply`): it returns a new function where `this` is bound to whatever you pass into `bind`.

Why might you want to do that? Well, consider this:

{% highlight javascript %}
var person = {
  name: 'Example Person',
  greeter: function () {
    return this.name + ' says: Hello!';
  }
};

var tom = {
  name: 'Tom'
};
{% endhighlight %}

In that (contrived) example, `person` has a `greet` method that references `this.name`. If we just called `person.greeter` we'd get "Example Person says: Hello!" back. That's ok, but we can use `bind` to have `Tom` do the greeting:

{% highlight javascript %}
var tom_greeter = person.greeter.bind(tom);
console.log(tom_greeter()); // Tom says: Hello!
{% endhighlight %}

### Binding & currying

Bind does more than that too. It can actually be used for the same kind of function currying that we were doing above, because it will also pass any further arguments you give it (after the value of `this`) to the function you are currying. Like this:

{% highlight javascript %}
var person = {
  name: 'Example Person',
  greet: function (salutation, thing) {
    return this.name + ' says: ' + salutation + ', ' + thing + '!';
  }
};

var tom = {
  name: 'Tom'
};

var tom_says_hi = person.greet.bind(tom, 'Hi');

console.log(tom_says_hi('Jim')); // Tom says: Hello, Jim!
{% endhighlight %}

### DIY curry binder!

So bind's cool. But the best way to learn how something works is to build it, so let's make our own version of `bind` based on `curry` from earlier.

We'll take the function to be curried as our first argument, the value of `this` as our second, and then fix all the rest of the arguments.

{% highlight javascript %}
var curry_bind = function (fn, that) {
  var slice = [].slice,
      args = slice.call(arguments, 2);
  return function () {
    return fn.apply(that, args.concat(slice.call(arguments)));
  };
};
{% endhighlight %}

Woopee! We can use it like this:

{% highlight javascript %}
var person = {
  name: 'Example Person',
  greet: function (salutation, thing) {
    return this.name + ' says: ' + salutation + ', ' + thing + '!';
  }
};

var tom = {
  name: 'Tom'
};

var tom_says_sup = curry_bind(person.greet, tom, 'Sup');

console.log(tom_says_sup('dawg?'));
{% endhighlight %}

### Real examples

So where would you use these in real life?

### setTimeout

This pattern is pretty common:

{% highlight javascript %}
your_thing.wait_a_bit = function () {
  var that = this;
  setTimeout(function () {
    that.do_something();
  }, 1000)
};
{% endhighlight %}

But dayum, it's ugly. How about this?

{% highlight javascript %}
your_thing.wait_a_bit = function () {
  setTimeout(this.do_something.bind(this), 1000);
};
{% endhighlight %}

Ah, much nicer.

### pubsub

If you're using a pubsub system, you may want your event-handling callbacks to be to bound to the correct `this`. Some pubsub systems support doing so, but here's how make sure of it, using bind.

{% highlight javascript %}
your_thing.listen = function (pubsub) {
  this.do_something();
  pubsub.subscribe('some:event', function (data) {
    this.do_something_after_event(data);
  }.bind(this));
};
{% endhighlight %}

### And we're done

Currying is really useful tool to have in your arsenal, allowing you to write much cleaner, more expressive code. And since bind can be found in all modern browsers (and can be added to older browsers), so why not try it out?

Once again, thanks for reading, and don't forget to share this article if you found it useful!

