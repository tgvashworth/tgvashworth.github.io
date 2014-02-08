---
layout: post
title: CSS Triangles + Animations = Pie Chart Spinner
---
**tl;dr** With CSS Masks, Animations, Triangles and some sweat, you can make [this](/demos/spinner/final.html). Needs Webkit (sorry).

Here's the story:

Stuart Langridge ([@sil](//twitter.com/sil)) threw down a challenge (possibly by accident) on Twitter:

> anybody think of a good way to do a circular countdown timer via css animations? An animated gif is doing my head in.

> it feels like I ought to be able to do this with radial gradients, if I were clever enough :)

Changle accepted, Mr Langridge. A circular countdown timer? Consider it... on the way.

My initial thoughts were:

- animate a rectangle's height and width to trace the outline of a circle... but that was stupid.
- have a number of triangles that appear in sequence (much like Stuart's own method), but I couldn't see how to animate it.

Since filling in the circle was essentially drawing an increasingly wide segment, and as there's no way to do this in CSS, I wondered if I could use the CSS triangle technique and a mask to achieve the effect.

For those unfamiliar with it, the CSS triangle technique is styling an element such that is has 0 height and width, but thick borders, and so by making all but one border transparent, you make a triangle. Like so:

{% highlight css %}
.triangle { /* You'll want this to be a block level element */
  width: 0px; height: 0px;
  border-width: 20px;
  border-style: solid;
  border-color: transparent;
  border-top-color: black;
}
{% endhighlight %}

Each border segment is a quarter of the overall area of the shape, and I reckoned that I could sequentially fill in each segment as needed with CSS animations. Hopefully the sketch below will illustrate.

![Segment filling &amp; animation](http://i.phuu.net/1g1g153Z2Y471K341o1c/IMAG0329.jpg)

The problem with this is that all of the filled segment is visible, so I needed to mask the area where there shouldn't be any 'fill' with the background colour of the loader. I'd need three elements - a container, an 'inner' (which would be the filled segment) and a mask. The next diagram should show this better.

![Mask number 1](http://i.phuu.net/3j2s2G3V0u3m0Q291h1I/IMAG0330.jpg)

But there's a problem... how do you make the whole thing a circle? Border radius? I tried some combinations of radii, overflow hidden and background clip, but none of those combinations seemed to work. In the end I settled for a CSS mask using a radial gradient. That was a mission in and of itself, but that's another story...

With some CSS animation magic I had the basic mask &amp; segment animation working. You can see a demo [here](/demos/spinner/one.html).

![In action](http://i.phuu.net/281e410y1g2W3a0I3m06/Screen%20Shot%202012-05-01%20at%2020.56.52.png)

The animation CSS for the inner looks something like this:

{% highlight css %}
@-webkit-keyframes inner {
  0% {
    -webkit-transform: rotate(-45deg);
  }
  25% {border-left-color:transparent;}
  26% {
    border-left-color:  rgba(200,200,200,1);
  }
  50% {border-bottom-color:transparent;}
  51% {
    border-bottom-color:  rgba(200,200,200,1);
  }
  75% {border-right-color:transparent;}
  76% {
    border-right-color:  rgba(200,200,200,1);
  }
  100% {
    -webkit-transform: rotate(315deg);
    border-left-color:  rgba(200,200,200,1);
    border-bottom-color:  rgba(200,200,200,1);
    border-right-color:  rgba(200,200,200,1);
  }
}
{% endhighlight %}

The mask, like this:

{% highlight css %}
@-webkit-keyframes mask {
  0% {
    -webkit-transform: rotate(-45deg);
  }
  75% {
    -webkit-transform: rotate(-45deg);
  }
  100% {
    -webkit-transform: rotate(45deg);
  }
}
{% endhighlight %}

Next, I had to figure out how to move the mask so that the fill could continue it's journey round the circle. I tried to animate the mask to be a narrower and narrower segment, but I found I couldn't do it (maths not being my strong point), so I brute forced it... with a second mask.

This mask would sit in the top-right segment of the circle, and would only appear when the fill had gone past 25%. Since it would be on top of the first mask, and the same colour as the fill, it could hide the mask moving round the circle, and create the illusion of a decreasing segment.

A mask–mask.

The animation CSS for this mask looks like:

{% highlight css %}
@-webkit-keyframes mask-two {
  0% {
    opacity: 0;
  }
  25% {
    opacity: 0;
  }
  26% {
    opacity: 1;
  }
  100% {
    opacity: 1;
  }
}
{% endhighlight %}

You can see the first working version of that in [Demo Two](/demos/spinner/two.html).

After that it was improvements and tweaking. There are too many little things that would take way to long, but the end product I'm pretty happy with. I'm sure there's parts that could be much better!

Check it out [here](/demos/spinner/final.html) on a recent Webkit browser.

Thanks for reading, that was a long one – I'll write a more concise tutorial format version soon, perhaps.

PS. I then went a wee bit crazy with Webkit filters and animation, and created [this](/demos/spinner/crazy.html) monstrosity. That baby needs something that's Chrome Canary-ish or more recent. Woo.

