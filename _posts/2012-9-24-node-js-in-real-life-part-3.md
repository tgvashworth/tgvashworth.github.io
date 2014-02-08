---
layout: post
title: "Node.js in Real Life: Part 3"
date: 2012-9-24 10:00
---

Let's take another look at using Node in real-life, on an actual product. In this series of tutorials we'll go through designing, building and deploying a real application built on Node.

This is part 3. [Read part 1](/2012/09/13/node-js-in-real-life-part-1.html) or [part 2](/2012/09/14/node-js-in-real-life-part-2.html).

### The app

We'll begin by taking a closer look at the structure of the app to get a better idea of what exactly we'll be building. This is, roughly, how I think when working on something new. It may not be the same for you, and I'd be interested to hear your viewpoint if you do things differently.

Here's the description from part 1 to get us started:

> We're going to make an application for conference goers, or visitors to any event, that will help them see where others at the event are. We'll allow users to **create an event** by associating a **location** with a **hashtag**, and then allow others to use that hashtag to **see themselves**, and **others** using the same hashtag, on a **map**.

I've highlighted some important parts that are worth taking note of. They're all nouns or verbs, so lets do a simple breakdown of obvious entities and processes within the app. The nouns are bold, the verbs are italicised.

- A **user** can <em>create</em> a **hashtag** by associating it with a **location**. The hashtag acts like an id for an event.
- This combination we will call an **event**.
- A user can <em>view</em> an event using the hashtag.
- This places them on a **map** for others to see.

Immediately we can see what the important parts of, and concepts within, the app. We can expect that the <em>create</em> hashtag process and the <em>view</em> screen will the most used, probably the latter more than the former.

Within our app we will have the concept of a **user**, a **hashtag**, an **event**. The **map** will be important to the front end, not the server, becuase the server doesn't care about the view implementation.

Great, I think we can start writing code. Or, more specifically, tests...

### The board is set, the pieces are moving

The first entity we'll work on is the **event**, the fundamental unit within our app. We can almost think of the event as a model in an MVC-style framework – when using events, we shouldn't have to care about the implementation, they should look after themselves.

I find it useful to design something by first creating the ideal interface through which we'd use it. Then, as I build, I'll keep coming back to this ‘sketched’ interface to refine it according to what I've learnt by building it.

This can be code or a UI – in the case of code, I like opening a blank text file and just writing out how I'd like to use something. Like this...

{% highlight javascript %}
// get an event by hashtag
events.get('leampack');

// an event
{
  hashtag: 'leampack'
, location: {
    lat: -52
  , lng: 1
  }
, created_at: 'some date'
  // perhaps...
, ends_at: 'other date'
, author: {
    // user data
  }
}

// new event
events.add({
  // event data as above
});
{% endhighlight %}

This kind of code sketch really helps me think through what I'm doing, and clears out some initial cruft. I guess you'd called this API-driven design. I've probably nicked it from somewhere, let me know if I have!

Now we can write some tests to begin work on this part of the app.

### Tests

I've created a new file, `test/events-test.js`. It's best to keep tests for different functionality in separate files so that they can easily be tested in isolation. It's also much easier to manage.

I like a BDD (Behaviour Driven Development) flavour of testing. It may not be your cup of tea, but indulge me for the time being, eh? BDD-style tests don't come built into Mocha, you have to install another module called [should.js](https://github.com/visionmedia/should.js).

`npm install should`

We can then require this module for some very readable tests!

{% highlight javascript %}
// test/events-test.js

var should = require('should');

describe('events', function () {

  it('should exist', function () {
    should.exist(events);
  });

});
{% endhighlight %}

Since Mocha runs all files in the `test/` directory, looking for tests, running `mocha` from our eventpack directory should show you that this test is failing. That's good, let's make it pass.

{% highlight javascript %}
var should = require('should')
  , events = {};
{% endhighlight %}

Try running `mocha` again. Yay! It passes.

### Reporters

Mocha has a few different ways of displaying tests, called [**reporters**](http://visionmedia.github.com/mocha/#reporters). The default, `dot`, is pretty boring. I prefer the `spec` reporter. To make Mocha use this reporter, run it like this:

`mocha -R spec`

![mocha with the spec runner output](http://i.phuu.net/Jev2/Screen%20Shot%202012-09-23%20at%2023.35.57.png)

Great!

### Further functionality

Obviously, our events object is not doing anything. According to the sketch we did earlier, the first bit of functionality is that `events.get('leampack')` will return an event object, so that's the next thing we'll work

This is where the code samples become a little more involved. I'd recommend following along inside the file. I'll provide some important bits of code, but really you can only see the full thing in the actual file.

{% highlight javascript %}
. . .

// events.get('leampack')
it('should return leampack', function () {

  var event = events.get('leampack');

  // Does it actually return data?
  events.should.be.a('object');

  // Is it equivalent to our code sketch?
  event.should
    .have.property('hashtag');
  event.should
    .have.property('location');
  event.should
    .have.property('created_at');

  // Check the data
  event.hashtag.should
    .equal('leampack');
  event.location.should
    .have.property('lat');
  event.location.lat.should
    .equal(-52);
  event.location.should
    .have.property('lng');
  event.location.lng.should
    .equal(1);
  event.created_at
    .should.equal('some date');

});

. . .
{% endhighlight %}

Of course, Mocha will tell you this is failing. We'll work through the errors one at a time.

`TypeError: Object #<Object> has no method 'get'`

Right now `events` is just an empty object, devoid of properties and methods, soul and swing. And remember, it don't mean thing if it ain't got that swing.

The first thing to do is to move `events` into another file. I'm going to put all our entity files in a folder called `entity`, so we can `require` them from other files. The first is `entity/events.js`.

Initially this file will look like this:

{% highlight javascript %}
/**
 * Events
 */

/**
 * get returns an event associated with
 * a particular hashtag.
 *
 * The hashtag argument is a string.
 *
 * Returns an event object.
 */
exports.get = function () {
  return {};
};
{% endhighlight %}

We should update our test file to require events from this location. Note that it's relative to the current file, unlike when we're requiring Node modules.

{% highlight javascript %}
var should = require('should')
  , events = require('../entity/events');
{% endhighlight %}

Running Mocha again, you should notice that the error is now different. Excellent, we've passed part of the test. The next bits are easy to remedy.

{% highlight javascript %}
exports.get = function () {
  return {
    hashtag: 'leampack'
  , location: {
      lat: -52
    , lng: 1
    }
  , created_at: 'some date'
  };
};
{% endhighlight %}

We've just made `events.get` return the exact data from our code sketch.

### About (T|B)DD

If you're not used this way of doing test-driven development, you might think this is cheating. After all, we can't write an app that returns hard coded data!

You're right, we can't, but this is all part of the plan. Write a test, write just enough code to pass it, then write a new test.

Right now we have enough code to pass our tests and no more. Aside from the code that `express` auto-generated, we've got more test code than app code. That's a nice way for things to be.

This style of testing is called **unit testing**, so called becuase you are testing one small piece of functionality or ‘unit’. In a unit test, the test is designed to ensure that a specific unit works the way you expect, in **isolation**.

### Over and out

So that's enough for this part. We've covered our app in detail, unit modularity in Node, unit testing, Mocha reporters and got 2 passing tests! Nice work.

As ever, if you have any problems or questions just let me know in the comments, and if you want to tweet about this series, please consider using the hashtag **#nodeirl**!

Thanks for reading.
