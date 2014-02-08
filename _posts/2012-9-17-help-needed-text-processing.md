---
layout: post
title: "Help Needed"
date: 2012-9-17 17:00
---

I'm working on improving [Twapp](http://twapp.phuu.net), my App.net to Twitter cross-posting tool, by attempting to built a comprehensive set of unit tests to ensure that any new functionality I add doesn't break what's there already. But I'm having difficulty actually doing it.

Let me tell you what it does, and hopefully you'll see the problem.

On App.net, you have 256 characters with which to play. On Twitter, in case you've been living under a rock, you have 140. At it's most basic, Twapp does this:

> if the post is longer than 140, truncate it at 139 characters, add ‘&hellip;’ and be done with it.

But it's not that simple.

What if you want to add a link to the post on alpha.app.net if it's too long? That's ok, as long as you work around Twitter wrapping **every single link** in t.co (so all links are 20 characters. [Ish.](https://dev.twitter.com/docs/tco-url-wrapper/best-practices)).

Ok, but what if you want to add a hashtag to the end of every cross-posted tweet? Here's where the problems start.

For example, if the hashtag is ‘#adn’ you have to account for 5 extra characters on the end of the post. Initially you might have enough room (eg, a post of 136 characters), so no link would need to be added, but as soon as the hashtag goes in there it's suddenly 141 and you need the link. And since you're also adding ‘&hellip;’ when the post is cut off, you need to account for this too. So it's 143, and you need to truncate the post text down to 133.

And of course, you don't always want the ‘&hellip;’ becuase a post may not be too long even with the hashtag on the end.

It becomes a problem when you consider that links may also appear anywhere in the post. Since these are always going to be made 20-ish characters long, we have to account for them too (and remember, links can be longer and shorter than 20 characters).

It then becomes extremely difficult to write an algorithm to ensure what comes out it a well formed tweet.

The thing is, I have code for it and it works reasonably well. It's not perfect, but it works. I haven't quite explained everything here (like username conversion), but I hope you get my dript.

But now I want to add features. It seems, though, that I'm at a serious risk of [breaking everything](/2012/09/13/i-messed-up-i-am-sorry.html).

So I need to test the functions that do this transformation, but I have no idea how. There's more than 64 permutations of Twapp's settings, and 110,000^256 different possible App.net posts, otherwise known as infinity.

I know I don't have to worry about 99% of them (although 1% of infinity is still infinity, right?), but I don't know how to identify the ones I **do** need to worry about, and I don't know how to test this functionality with any level of confidence.

If you have any experience of doing, **and testing**, the same thing, or can point me in the direction of someone who does, please [get in touch](mailto:hello+help@phuu.net). I'd really appreciate the help!

Thanks for reading.