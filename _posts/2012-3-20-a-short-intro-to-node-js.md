---
layout: post
title: A Short Intro to Node.js
---

I gave a short talk at the [Multipack's](http://multipack.co.uk) Show & Tell event in February about a favourite development stack of mine: Node.js and MongoDB, deployed on Heroku. Here I'll present why you might want to give Node a try, and later move on to Mongo.

Node.js is a platform built on Google's V8 Javascript engine. At the lowest level it's a set of event driven, non-blocking network APIs. But what does that actually mean? Let's have a look…

In simple terms Node provides server-side Javascript, allowing you to do everything you could with PHP, Ruby, Python or other server-side language.

If you're a PHPer, you'll have seen this kind of code before:

{% highlight php %}
$data = mysql_query("SELECT * FROM users");
{% endhighlight %}

But do you know what happens when this line is called?

Nothing. Your code, your app and your server do nothing.

That's an over-simplification, but for our purposes it's workable. When PHP requests some data from a mysql database server, the thread in which that code it running 'blocks'. This means that nothing else happens in that thread until the data returns, and then the code continues running. That's bad, partially because it could take a very long time. If you'd like to know more, try [here](http://debuggable.com/posts/understanding-node-js:4bd98440-45e4-4a9a-8ef7-0f7ecbdd56cb).

Node.js is different because it is asynchronous, event-driven & non-blocking. This means that after a request for data is sent, Node carries on processing your code, and then goes into an idle state until the data is received. This makes it highly performant in traffic-heavy situations - which is always good.

If you're familiar with Javascript already then you'll feel right at home with Node, as the browser also runs an event loop. Things like setTimeout(…) work exactly as you'd expect.

I hope this quick summary encourages you to give Node a try, it's a great platform. There's much more documentation and video introductions available on [Node's website](http://nodejs.org). I'll tackle Node with Mongo soon.

Thanks for reading.