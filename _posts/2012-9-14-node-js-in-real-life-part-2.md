---
layout: post
title: "Node.js In Real Life: Part 2"
date: 2012-9-14 17:00
---

Let's take another look at using Node in real-life, on an actual product. In this series of tutorials we'll go through designing, building and deploying a real application built on Node.

This is part 2. [Read part 1](/2012/09/13/node-js-in-real-life-part-1.html).

### Do the Node

Before I get into making Node do stuff, we need to talk about Node itself. What's different about it, and when should you use it?

If you know the difference between blocking and non-blocking, and you know what I mean when I say asynchronous and event-loop, you can skip this bit, down to **In use**.

### Blocking vs Non-blocking

Systems built in PHP, Ruby and Python, in the main, do something called ‘blocking’ whenever they have to carry out a request to another resource, like a database or another API.

If you're using Apache with PHP, for example, Apache will spawn a thread to handle a request from a user, allocating memory that can't be used by anything else until the response back to the user has finished being sent. This is an expensive operation and is a significant reason why Apache servers crash under high load. The server does not have enough memory to handle so many simultaneous users.

This is called the [C10k](http://en.wikipedia.org/wiki/C10k_problem) problem (10 thousand concurrent connections), and it's something [nginx](http://nginx.org/en/), Node and other tools were written to address.

The opposite of a blocking architecture is what's called ‘non-blocking’. Non-blocking systems run in an ‘event-loop’, idling quietly until an event occurs, at which point they identify which code to run and, without spawning a new thread, execute it, before returning to an idle state.

This event-driven, or asynchronous, architecture tends to be better because it uses smaller amounts of memory, and because you can, to some degree, predict the memory usage. Why that's important is way beyond the scope of this already hefty post, so I'll leave you to look it up.

### Right. Back to Node.

You may have heard Node described as, "Javascript on the server", and that's true, but saying so fails to capture an important point. Node didn't **have** to use Javascript, but Javascript suited Node very well, for a few reasons.

As you may have gathered, Node is non-blocking. But there's something else that's non-blocking, and you know all about it: your web browser. It too runs an event-loop (remember those?), responding to events and running associated code. Associating code with an event is often referred to as ‘attaching’, and the code that runs is called an ‘event handler’

For example, you might attach an event handler to a click event on a link. In jQuery, that looks like this:

{% highlight javascript %}
$('a#mylink').click(function (event) {
  . . .
});
{% endhighlight %}

It's like saying ‘listen for a click event on `#mylink`, and when it's clicked, run this function’. The function in this example is known as a callback.

Javascript was designed for this environment and as such has a few very nice language features that make it perfect for code like this. In that example above, we're actually passing the callback function as an argument to the click method of a jQuery object. The fact that you can easily pass functions as arguments, as if they were data, is the important thing.

Node is very similar to the browser. From [nodejs.org](http://nodejs.org/), “Node.js uses an event-driven, non-blocking I/O model”. In Node, you listen for Input/Output events like a user connecting, or a database returning data, or a response from an external API.

Node idles in an event loop until an event occurs. It will then run any code associated with that event, and return to idle. Similarly, when you ask for data (from a database, for example), Node dispatches a request to the database, then returns to idle until the database returns the data. Imagine a conversation between the two. Node begins…

> “Hey Database, I'd like all the users please.”

> ”Hey Node, sure thing. I'll get back to you when I've got that.”

Some time later (perhaps after Node's dealt with 100 people wanting to see your homepage)...

> ”Hey Node, here's your users.”

> ”Thanks Database.”

Then Node goes off and runs the code you specified in the callback.

This is really important important as it allows us to easily create applications that scale to large number of users or to high traffic from a group of users. There are other benefits too, but we'll get to those soon enough.

### In use

So, now we've seens how Node's different, let's keep on going! We'll return to the `eventpack` directory from the last tutorial, and open up `app.js` in a text editor.

This is the main file and control center for your whole app. It begins by using `require` (a global method in Node) to important functionality from the  `express` module, from files within the app and from `http` and `path`, both part of Node's standard library.

![require](http://i.phuu.net/content/JT77/aHR0cDovL2YuY2wubHkvaXRlbXMvMFkzNjNlM2UzdTI0M1UzQTJhMjEvU2NyZWVuJTIwU2hvdCUyMDIwMTItMDktMTQlMjBhdCUyMDE3LjAzLjU4LnBuZw==)

We then see a load of configuration and initialisation.

![init & config](http://i.phuu.net/content/JSip/aHR0cDovL2YuY2wubHkvaXRlbXMvMU4wUTBZMlAxVDNnMTUzMjB2MmovU2NyZWVuJTIwU2hvdCUyMDIwMTItMDktMTQlMjBhdCUyMDE3LjA3LjIyLnBuZw==)

Lastly is the good stuff, the routes. With Express, you use `app.get` to define what happens when a user requests a resource or page within your application. Express matches the requested URI to routes you define and then runs the callback you supply.

`routes.index` is one such route callback, and it's defined in `routes/index.js`. Take a look at that file to see what's going on.

![routes/index.js](http://i.phuu.net/JTCK/Screen%20Shot%202012-09-14%20at%2017.14.34.png)

Here you can see another global Node object, `exports`. By creating properties on this object you enable others to use those properties, be they attributes or methods. `exports` is actually synonymous with `module.exports`, which perhaps explains things better.

When you `require` a module the variable that you assign the return value of `require` to takes on the properties of the exports object of the module.

So hopefully you can see how an application takes shape. We'll set up routes in `app.js` and write the associated callback in a file in `routes/`. That's really all there is to it.

### A bit more setup.

Yeah, there's a bit more to set up still. It's quick though, don't worry.

First, **git**. If you don't [know about git](http://git-scm.com/book/en/Getting-Started), you should.

The first thing we need to do is add a `.gitignore` file in the `eventpack` directory which should contain one line, `node_modules`. This will stop git from staging the contents of that directory. Why do want that? You'll find out when we tackle deployment.

Next, back at the command line, we'll do some commiting.

{% highlight bash %}
# Intialise git
$ git init
# Check what's going to be added
$ git status
# Add the untracked files
$ git add .
# Check what's going to be commited
$ git status
# Perform the commit!
$ git commit -m "Initial commit"
{% endhighlight %}

### Mocha

One last bit. We need to get Mocha set up. Mocha does lots of work for us too. All we need to do is create a `test` directory and add some files to it. I've just made a `test.js` file.

To try it out, just run `mocha`.

![First test output](http://i.phuu.net/JSMl/Screen%20Shot%202012-09-14%20at%2017.55.50.png)

Obviously we have no tests yet, but we will! I've committed this new file too, on a new branch called `part-two`.

### And we're done

So that's Part 2 over. I hope it was fun. I've pushed my code so far to Github, so check out [phuu/node-irl](https://github.com/phuu/node-irl).

Any questions, just hit me up in the comments!

Thanks for reading.