---
layout: post
title: "Components &amp; the Shadow DOM"
date: 2012-11-13 22:00
mood: hsl(185, 40%, 95%)
---

Recently I heard a few people mention the Shadow DOM. It sounded cool, so I decided to explore it: turns out that it's part of a 'component' model for the web that's really rather exciting.

> **Note**: for these examples, you need to be using Chrome Canary (yep, sorry. Only Webkit has this implemented). It's also a good idea to switch on Shadow DOM inspection – click the cog in the bottom right of Carnary's dev tools, and tick the 'Show Shadow DOM' box.

### Initial reading

Although I'd heard about it I knew very little about the Shadow DOM, so, first, I did some research.

I started by reading through the [W3C's spec](http://www.w3.org/TR/2012/WD-shadow-dom-20121016/), which is a little dense but readable. The [Shadow DOM Subtrees](http://www.w3.org/TR/2012/WD-shadow-dom-20121016/#shadow-dom-subtrees) section was interesting and helpful, as was the final [News Widget example](http://www.w3.org/TR/2012/WD-shadow-dom-20121016/#shadow-dom-example). Although the examples are written in a humorous style, I found it could actually obscure what the author means. This [Contacts Widget](https://dvcs.w3.org/hg/webcomponents/raw-file/tip/samples/contacts-widget.html) example was also useful.

Roman Liutikov's [Shadow DOM article](http://blog.romanliutikov.com/coding/discover-the-dark-side-with-shadow-dom/) was helpful in getting a basic understanding past the W3C spec, in part thanks to some tasty diagrams, and I found also found Dimitri Glazkov's [What the heck is Shadow DOM](http://glazkov.com/2011/01/14/what-the-heck-is-shadow-dom/) post useful. He's the editor of the spec, so should know what he's talking about!

I was also pointed towards the [Web Component](http://www.w3.org/TR/components-intro) intro that was very helpful for understanding where this is all going.

### What I learnt from reading...

The Shadow DOM is a secret society of people called Domonic... oh no, sorry, that's... uh...

The Shadow DOM is:

> a method of establishing and maintaining functional boundaries between DOM subtrees and how these subtrees interact with each other within a document tree, thus enabling better functional encapsulation within DOM.

For non-robots like you and I, I'll give you my interpretation...

- The Shadow DOM allows us **wrap DOM structures and behaviour into  components**, so that complex interfaces & implementation can be **abstracted or hidden** to assist the developer.
- The developer should be able to operate on a component (or 'widget') using a DOM API, without worring that doing so will break the component.
- The hidden DOM representation of the component is called the **shadow tree**.

For example, the HTML `video` element. It's just such a component; the controls are just HTML and CSS, but if you inspect the element you'll only see the `video` element itself and associated `sources`. None of the controls.

> If you have Shadow DOM inspection on, you'll see `#shadow-root`. That's the (normally hidden) link into Narnia... er, the Shadow DOM.

You can add and remove `video` components like you would any other page element, like a `div`, inluding firing and listening for events, without needing to care how it works on the inside.

### Why's that cool?

As web authors, there's always been a problem writing widgets and components for other's pages: it's possible for something from the outside page to access the component in such a way that it may (acidentally or deliberately) prevent the component from working.

The Shadow DOM aspect of the component model means you can encapsulate the functionality of a widget so that it is (mostly) inaccessible from outside.

A simple example is that, by default, styles from the surrounding page do not apply the shadow tree, so you can be (reasonably) sure your components will look the same everywhere.

So, with the Shadow DOM, it's possible to create our own components, and hide the interface and behaviour in just the same way as the `video` element, exposing only the methods and events needed to make the component useful.

### Ooh, tell me more...

First, let me back up. What's actually going on inside? How'd you 'do' Shadow DOM?

When you use the Shadow DOM, you attach a **shadow DOM tree** to an **existing DOM tree**. Essentially you're merging existing DOM structure with new, hidden stuff, to provide exciting new functionality. Your new, shadow structure is used displayed instead of the existing tree, but the original DOM is not removed.

This means you can **use existing data in the page** by utilising nifty **'insertion points'** that specify **what** data will be put **where** in your shadow tree. This is done with a new element. Meet `<content>` (well, later).

### So what's it all for?

What I've described above is **imperative** creation of Shadow DOM, attached to regular DOM using Javascript.

But why do we have to use Javascript? This is really HTML (well, DOM) after all: can't we do it there?

Why yes, how perceptive of you. The Shadow DOM forms the basis of several new bit of functionality, and new elements, so we can do most of this stuff declaratively. Meet:

- templates: `<template>`
- decorators: `<decorator>`
- custom elements: `<element>` (an HTMLElementElement!)

Together, they afford us the opportunity to declaratively create things that exist in the Shadow DOM!

### Experimentation

*(or, how did I find this out?)*

> **btw:** Much of this before writing the above – it was just me messing around.

Since my goal was to learn about the Shadow DOM and all the new functionality so that I could start writing my own components, I started fiddling.

The first thing I did was steal and rewrite the [News Widget](http://www.w3.org/TR/shadow-dom/#shadow-dom-example) example. I often find tinkering with working examples is a great way to get an idea of what does what, and it means that if something breaks you can always get back to a working version.

Here's how it looks:

![My first experiment](http://i.phuu.net/KcXQ/Screen%20Shot%202012-11-03%20at%2015.39.35.png)

Check out the [working version](http://jsbin.com/ubamof/2) (remember, Canary plz).

### What's it doing?

On the page we have a unordered list of story 'headlines', each a link to the story with a class of `stories`. The list will become a widget!

First, it finds all `ul` elements with a class of `stories`, iterates through them and runs `shadowify`, passing each list element in turn.

{% highlight javascript %}
document.addEventListener('DOMContentLoaded',
function () {
  var lists = document.querySelectorAll('ul.stories');
  [].forEach.call(lists, shadowify);
});
{% endhighlight %}

### shadowify

{% highlight javascript %}
var shadowify = function (list) {
  var root = new ShadowRoot(list);
  root.applyAuthorStyles = true;
  root.appendChild(
    groupify('breaking', '.breaking')
  );
  root.appendChild(
    groupify('not-so-breaking', '.not-so-breaking')
  );
  root.appendChild(
    groupify('other', '')
  );
};
{% endhighlight %}

`shadowify` does a little bit of magic. It creates a new Shadow DOM element (called the **shadow root**) using the `new ShadowRoot` constructor.

> **Note:** Communication on the W3C public-webapps mailing list suggests that this will change very soon to a different pattern using a `createShadowRoot()`. Such is life, living on the edge.

`root.applyAuthorStyles` allows styles from the current page to be applied to children of the shadow root. By default, they're not applied.

We then append three child nodes to the root, which are returned from the `groupify` function.

### groupify

{% highlight javascript %}
var groupify = function (className, contentSelector) {
  var group = document.createElement('div');
  group.className = className;
  group.innerHTML =
    '<ul>' +
    '  <content select="' + contentSelector + '">' +
    '  </content>' +
    '</ul>';
  return group;
};
{% endhighlight %}

`groupify` does even more magic. It creates a `div`, and adds some innerHTML to it. But you'll notice something odd in the HTML: the `content` element?!

As mentioned before, it's new in the Shadow DOM spec, and is the 'insertion point' I also mentioned earlier. The `content` element and its `select` attribute are a **placeholder and selector for content** to be placed in the Shadow DOM.

In this instance, it's matching list items from the stories list. Pass some selection criteria (a CSS selector) in the `select` attribute and it does the rest for you.

The `group` div then is returned and appended to the Shadow DOM.

### A little filler

By the way, I've used this little snippet that allows me to avoid using WebkitShadowRoot every time. Just stick it on every page where you use the Shadow DOM.

{% highlight javascript %}
window.ShadowRoot = window.ShadowRoot || window.WebKitShadowRoot;
{% endhighlight %}

### Further reading/watching

Remy Sharp pointed me at [X-Tags](http://x-tags.org/), a cross-browser project that allows you to define your own custom elements, and Angelina Fabbro's great [Inspector Web and the Mystery of the Shadow DOM](http://www.youtube.com/watch?v=JNjnv-Gcpnw) talk. For an intro to the Shadow DOM the latter is highly reccommended.

If you're really interested in this stuff you could also subscribe to the [Web Applications Working Group](http://lists.w3.org/Archives/Public/public-webapps/) mailing list.

### Conclusion

The Shadow DOM seems like a really useful addition to the existing DOM specification, and in combination with the other elements mentioned above, it's definitely something I want to spend more time exploring. I've only scratched the surface here.

Let me know if you do any experiments, and what you find.