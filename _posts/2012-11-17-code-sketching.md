---
layout: post
title: Code Sketching
date: 2012-11-17 19:00
---

Here's a technique I like to think of as sketching in code, the end goal of which is a well designed, **usable interface** for your code.

For example, an interface for a publisher/subcriber module. I've iterated over a few ways of doing it:

{% highlight javascript %}
pubsub.trigger('some_event', true, 'abc');

pubsub.on('some_event', function (event, thing, name) {
  // ... do stuff
});

// ...

pubsub.emit('some_event', true, 'abc');

pubsub.on('some_event', function (thing, name) {
  // ... do stuff
});

// ...

pubsub.pub('some_event', {
  example: true
});

pubsub.sub('some_event', function (data) {
  // ... do stuff
});
{% endhighlight %}

I'll also sketch out data structures:

{% highlight javascript %}
var client_to_server_payload = {
  data: {
    // ...
  },
  meta: {
    session_token: 'abc123xyz789',
    transaction_token: 'a1b2c3x4y5z6',
    action: 'blow_stuff_up'
  }
};
{% endhighlight %}

Often the first idea I come up with is not the best I could do and I find I can iterate quickly on an idea towards a better solution by sketching. I'm not worried about implementation; if anything, I'm trying to find difficulties and problems that might crop up down the line, and avoid them before I start coding.

### Sketching?

Before spending time on a feature, I find it helpful to think through different ways something could work, and how it could be interacted with.

Like you might with a pen & paper, I open up a new, blank file and write little snippets. Sometimes I save them, often I throw them away. The goal is not working code; it's to get through as many bad ideas as fast as possible until I have a good one.

### Developer UX

For me, the goal of sketching is to figure out the ideal way I'd like to interact with the module or service. ‘API’ is mostly taken to mean a way of interacting with a web service, but it actually applies to any kind of module, library or service, and for me the most important letter is the ‘I’ – interface.

I think that, in much the same way as a designer spends time reasoning and protoyping about how a user would interact with a visual interface, it's important for me to spend time ensuring that the code interface is as intuitive, consistent and clear as possible.

Here's a few things I try to think about:

### Guessability

If I know how the interface works in one place, can I guess how it works elsewhere?

For example, if an object is setup using an `init` method, others in the same system shouldn't use a `setup` method.

### Arguments & consistency

Do I have to remember argument order?

If a function takes many arguments, it's generally a bad idea to require them in a specific order. It's better to take one argument, an object, and pick some sensible defaults. This is so that the user of my code interface only needs to supply the options that make a difference.

If I'm going to take multiple arguments (and in many cases it's neccessary and useful), it's vitally important to be consistent.

> PHP, for example, gets this totally wrong: `array_filter($input, $callback)` and `array_map($callback, $input)`?! `strpos($haystack, $needle)` and `array_search($needle, $haystack)`?!

### Data

How is the data represented by the consumer, and how does that relate to its storage?

I try to mockup ways real data could be stored so that it's logical and also easy to use, but also makes sense from a data storage point of view. Some things to think about:

- How does my data structure map to a database? Does it need transforming?
- Once it's in a database, what will I need to query against?
- What kind of operations will I be performing on the data ?
- Do I need to use a relational database – will a simple key/value store will do?

### Designed code

The overall goal is well designed code. It's very similar to how designers craft interfaces and user experiences; I'm building something for myself and other developers to use, so I enjoy taking the time to craft a great code interface.