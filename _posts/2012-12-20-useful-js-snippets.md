---
layout: post
title: "useful js: snippets"
date: 2012-12-20 17:00
---

Here's some Javascript snippets I find myself using every day. You should be good to drop them into your page, but if you've not familiar with a particular technique then it's always good idea to read up on it before using it. I've provided links where I can.

> **Note:** Some snippets use parts of Javascript ES5. To get this stuff in older browsers (< IE9), use the [ES5 Shim](https://github.com/kriskowal/es5-shim).

### Log arguments

Need to check the all the arguments coming into a function? No probs: use [call and apply](/2012/11/02/javascript-function-call-and-function-apply.html).

{% highlight javascript %}
console.log.apply(console, arguments);
{% endhighlight %}

### Set 'this' in setTimeout

Want to make sure of the value of `this` is the same inside a `setTimeout` callback? Use [bind](/2012/11/16/useful-js-currying-and-bind.html).

{% highlight javascript %}
setTimeout(function () {
  // Do yaw thang...
}.bind(this), 1000);
{% endhighlight %}

### Call a function from setTimeout

Do you do this much?

{% highlight javascript %}
setTimeout(function () {
  do_something_with(x, y);
}, 1000);
{% endhighlight %}

Try this (again with [bind](/2012/11/16/useful-js-currying-and-bind.html)):

{% highlight javascript %}
setTimeout(do_something_with.bind(this, x, y), 1000);
{% endhighlight %}

### Filter items from an array

Need to make sure all items in an array pass certain criteria? Try [filter](//developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/filter). If you return true from the callback the item is kept, otherwise it's scrapped.

{% highlight javascript %}
var evens = [1,2,3,4].filter(function (val) {
  return (val % 2 === 0);
});
{% endhighlight %}

### Operate on an array

Want to carry out an operation on every item in an array? Take a look at [map](//developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/map).

{% highlight javascript %}
var squares = [1,2,3,4].map(function (val) {
  return val * val;
});
{% endhighlight %}

### Easy function defaults

You've got a function that can takes an optional argument, and you want to provide a default.

Use the `or` operator! (Also, [get nerdy](//addyosmani.com/blog/exploring-javascripts-logical-or-operator/))

{% highlight javascript %}
var say = function (word) {
  word = word || "Hello!";
  console.log(word);
};

say(); // logs "Hello!"
say("World!"); // logs "World!"
{% endhighlight %}

### Further reading

The [MDN Docs](//developer.mozilla.org/en-US/docs/JavaScript/Reference) are great, as is [Nicholas Zakas' blog](//www.nczonline.net/) if you want to go into exra detail, and [Paul Irish's](//paulirish.com/) stuff.