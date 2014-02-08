---
layout: post
title: "useful js: call &amp; apply"
date: 2012-11-2 8:00
---

Javascript's **call** and **apply** are two mysterious functions that can be difficult to understand, but it's worth taking the time to learn about them becuase they're ver useful. They're also very similar, but with one subtle but important difference.

### call

`call`, or more properly, `Function.call`, is a property of all Javascript functions.

It allows you to run a function and define what the value of `this` will be inside the function, and also supply arguments to the function you are running. For example:

{% highlight javascript %}
var log_this = function () {
  console.log(this);
};

// This will log the default 'this' object.
// In a browser, that's the 'window'.
log_this();


// Now we create an object that we will use as 'this'
var thing = {
  name: 'Big Hairy Thing'
};

// This will log the 'thing' created above, because
// using 'call' ensures that 'this' within log_this
// is the 'thing', not the default 'this' (window).
log_this.call(thing);
{% endhighlight %}

Any other arguments you pass to `call` are passed to the function you are calling as its arguments. Like so:

{% highlight javascript %}
var log_this_and_message = function (message) {
  console.log(this, message);
};

var thing = {
  name: 'Big Hairy Thing'
};

log_this_and_message.call(thing, 'Hello!');
{% endhighlight %}

Neato, eh?

### apply

`apply` is very similar, and can be run on any functions. It runs your function, and the first argument you pass is the same as in `call`: it will become the value of `this`.

The difference is that you don't pass the other arguments individually, you **pass them as an array**.

Here's the example above using `apply`:

{% highlight javascript %}
var log_this_and_message = function (message) {
  console.log(this, message);
};

// Now we create an object that we will use as 'this'
var thing = {
  name: 'Big Hairy Thing'
};

log_this_and_message.apply(thing, ['Hello!']);
{% endhighlight %}

See the difference? It's subtle, but important.

### In use

Here's some great uses for `call` and `apply`&hellip;

#### arguments

Did you know that the `arguments` variable inside all functions is not actually an array? That means you can't use all the nice array methods like `pop`, `push` and `slice` on it! If you want to turn `arguments` into an array, use `call`:

{% highlight javascript %}
var args = [].slice.call(arguments, 0);
{% endhighlight %}

Here we're using the `slice` method of an empty array.

`slice` copies elements out of one array and returns them as a new array. It starts at the index you supply in the first argument and finishes one before the index you supply in the second argument, or it goes all the way to the end if you don't supply a second argument.

`slice` copies elements out of whatever object `this` refers to. Usually, inside `slice`, the value of `this` is the array we are calling slice on. In the above example, that would be the empty array. However, becase we are using `call`, `this` is in fact the array-like object `arguments`. `slice` copies each element out of `arguments` into a real array and returns it.

Nice.

#### Log it all

Let's say you're passing a callback to someone else's library and you're expecting data back, but you don't know how many arguments you're going to get. There's a simple trick to allow you to `console.log` everything that's passed to your callback.

{% highlight javascript %}
var args = [].slice.call(arguments, 0);
console.log.apply(console, args);
{% endhighlight %}

Becuase `apply` takes an array of arguments to be passed to the function, you can sling it the array of arguments you recieved and have them logged out, all nicely formatted.

> Note: you could actually just pass `arguments` as the second argument to apply, becuase it's 'array-like' enough, but for now we'll play it safe.

### pub/sub

Here's a bigger example.

I've put together a publisher/subscriber object called `pubsub`. It uses `call` and `apply` to implement some neat features. Take some time to run it, look through it and have a play.

Enjoy!

{% highlight javascript %}
/**
 * the pubsub is a publisher/subscriber system to demonstrate
 * use of Function.call and Function.apply.
 * http://en.wikipedia.org/wiki/Publish%E2%80%93subscribe_pattern
 */

var pubsub = {};

/**
 * pubsub.subscribers is an object where each key is an event
 * and each value is an array of callback functions associated
 * with a particular event.
 */
pubsub.subscribers = {
  'some_event': [
    function () { console.log("some_event occured!"); }
  ]
};

/**
 * pubsub.publish calls all the callbacks associated with a
 * particular event (the first argument), passing each callback
 * any further arguments supplied to publish.
 */

pubsub.publish = function () {
  // arguments is not an array.
  // use `[].slice.call` to turn it into a proper one.
  // See: http://s.phuu.net/SiRS7W
  var args = [].slice.call(arguments, 0);

  // pull the event off the front of the array of arguments.
  var event = args.shift();

  // If we have no subscribers to this event, initialise it.
  // Note, we could just return here.
  if( !pubsub.subscribers[event] ) pubsub.subscribers[event] = [];

  // Run through all the subscriber callbacks to the event and
  // fire them using `apply`. This runs the cb with a set of
  // arguments from the args array.
  // See: http://s.phuu.net/SiSkTC
  pubsub.subscribers[event].forEach(function (cb) {
    cb.apply(this, args);
  });
};

/**
 * pubsub.subscribe adds a callback an event's list
 */

pubsub.subscribe = function (event, cb) {
  // first, if this is a new event, set up a new list in the
  // subscribers object.
  if( !pubsub.subscribers[event] ) {
    pubsub.subscribers[event] = [];
  }
  // next, push the supplied callback into the list to be
  // called when the object is published
  pubsub.subscribers[event].push(cb);
};

// Example use:

pubsub.publish('some_event');

pubsub.subscribe('say_hello', function (name) {
  console.log('Hello, ' + name);
});

pubsub.subscribe('say_goodbye', function (name) {
  console.log('Goodbye, ' + name);
});

pubsub.subscribe('poke', function (name) {
  console.log(name + " was poked.");
});

pubsub.publish('say_hello', 'Tom');
pubsub.publish('poke', 'Paul');
pubsub.publish('say_goodbye', 'Mr Fish');
{% endhighlight %}

Once again, thanks for reading.