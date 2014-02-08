---
layout: post
title: How to write safer Javascript
date: 2012-7-11 11:00:00
---

I just thought I'd share a few quick ways of making your Javascript a little bit safer. I'd recommend reading deeper into a few of these techniques too. The [MDN Javascript](https://developer.mozilla.org/en/JavaScript) articles are great for this, and reading [the source code](https://github.com/jquery/jquery) of major Javascript projects & libaraies is a great way of seeing this stuff in action.

### Global Warming: Prevent Pollution

In Javascript there's a couple of ways of defining variables. One is good (if used properly), one is disastrously bad.

{% highlight javascript %}
evilVariable = 'mwahaha';
var notQuiteSoEvil = 'lol';
{% endhighlight %}

That first one? That is a global variable and is muchos bad. No matter where you write that code, evilVariable variable will be available **everywhere** else.

This is because the variable becomes a property of the global object - in browsers, that's ‘window’. So in this case we'd have window.evilVariable.

By using the var keyword you limit the scope (segment of code in which a particular variable can be used) to the closest function. More on this in the next section...

### Use Protection

If you'd used that previous code example in a script tag on your page, you'd still actually be creating a global variable (so you'd still have window.notQuiteSoEvil), but read on for a way round that!

Since it's never a good idea to pollute the global scope of your page if you can avoid it, one way to ensure you aren't causing global warming is to to wrap all your code in a self-executing anonymous function. Though it sounds scary, it's actually quite simple.

{% highlight javascript %}
// A simple self executing function
(function () {
  // This code will be run automatically and
  // variables declared in here won't pollute
  // the global scope
}());

// This can also be written like this,
// where the execution brackets are outside
// the function wrapping pair.
(function () {
  // . . .
})();
{% endhighlight %}

Looks like a normal function right? But check out the extra parentheses... they run the function straight away. You have to wrap it all in parentheses because that makes sure that function () { ... } an <em>expression</em> not a <em>declaration</em>, but that's outside of the scope (see, there it is again!) of this article. Check out [MDN](https://developer.mozilla.org/en/JavaScript/Reference/Functions_and_function_scope/) for more.

As mentioned above, any variables decalred within the self-executing function will only be visible within that function (and inside any functions declared within the parent function). This is called functional scoping and is one of the differences between Javascript and most other languages. It's also incredibly powerful, enabling a wealth of neat Javascript tricks like closures. Anyway, back on topic!

I tend to make a slight improvement to this but adding a semicolon before the first bracket, a la:

{% highlight javascript %}
// Anuvva semi-colon
;(function () {
  // Self-executing lovelynesses
}());
{% endhighlight %}

This is to protect against something like this happening:

{% highlight javascript %}
// WARNING!! BAD CODE BEGINS HERE ========
(function burp(thing) {
  // This function will self-execute with
  // whatever the function below returns
  // passed as an argument.
  var herp = 'derp'
      derp = 'herp'
})

(function () {
  // Some other (good) stuff in here
}());

// This is becuase you are essentially
// writing this crazyness:
(function () {
  // Codez
})(function () {
  // Some other (good) stuff in here
}());

// PHEW!! BAD CODE ENDS HERE =============
{% endhighlight %}

Yeah, crazy. Don't do it, kids.

The extra semicolon (or !, +, - and a few others) is also useful for flagging to the next poor soul reading your code that something's afoot (ie, the following is a self executing function).

### typeof undefined !== "undefined"

Theoretically, some bastard could write:

{% highlight javascript %}
// WARNING!!
// Do this, and will come to your
// house and personally remove your kneecaps
undefined = true;
typeof undefined === "undefined"; // false
{% endhighlight %}

This is nighmarish because everywhere you write

{% highlight javascript %}
if(myVariable === undefined) {
  // . . .
}
{% endhighlight %}

will be horribly broken. Since undefined is now true, even if myVariable has not been defined the code within the if statement will not run.

This is possible becuase undefined is **not** a Javascript keyword, but a **property** of the global object. Don't ask me why. Javascript has some odd bits.

The way to protect against this is to hack the way Javascript handles arguments. If a function is expecting three arguments, but only two are supplied, the value of the third will be undefined. Similarly, if the function is expecting one argument but recieves none then the argument will be undefined.

So, to ensure that undefined is always (erm) **undefined**, you can do this:

{% highlight javascript %}
;(function (undefined) {
  // Becuase no arguments were passed to
  // this function you have your own,
  // pristine, local copy of undefined
  typeof undefined === "undefined"; // true
}());
{% endhighlight %}

Easy peasy, right?!

### Done and done

I hope these quick tips will help you write safer Javascript, and will help protect you from cowboy web developers who are redefining undefined.
