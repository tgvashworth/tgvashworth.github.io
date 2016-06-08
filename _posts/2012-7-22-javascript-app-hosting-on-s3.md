---
layout: post
title: Javascript App Hosting on S3
date: 2012-7-22 7:00:00
---

I came up with a technique for hosting Javascript apps on Amazon's S3 that can use the request URI (path) as any app with a server side could. This enables a 'fake' directory structure that is actually just one page on S3. I built [schemist](http://schemist.phuu.net) using this technique.

### The basic concept

At it's core, the idea is as simple as using S3's static website hosting tools to force all requests to go to one page. This is as simple as setting up a bucket as a website and pointing the index and 404 pages to the same file (could be index.html or anything else). Because the request URI is kept when the 404 page is served, you can process it using Javascript and serve any content you like, faking a directory structure. This means pretty urls are very easy, and still enables query strings and page identifiers. In combo with the History API, it's pretty damn cool.

### How to do it

Let's say you're wanting to set up a site for your awesome new startup, [Bog Roll Club](http://bogrollclub.com). You're gonna sell Bog Roll as a subscription service to the world. Great idea, but you want to get a page set up real fast that can handle the extreme traffic you'll be getting. No probs.

#### S3

You've bought the domain, bogrollclub.com (no www here). Head to your Amazon S3 control panel, and create a new bucket named the same as that very domain. Like so:

![S3 Bucket](http://i.phuu.net/image/2j3n2Z403R3k/Screen%20Shot%202012-07-22%20at%2009.35.00.png)

Next, open the Properties of the new bucket, and then the Website tab. Tick the `Enabled` checkbox and put `index.html` in both the `Index Document` and `Error Document` fields. Click save. It'll look something like this:

![Website Tab](http://i.phuu.net/image/3J0Q2b161v0p/Screen%20Shot%202012-07-22%20at%2009.38.35.png)

You'll notice you have a URL at the bottom of that window. Copy it, for it will become useful very soon.

#### The app

Now, upload your site/app to S3. You can do exactly how you'd do any other 'static' site, except make sure that all paths (to CSS or JS) are relative to the base URL - ie, they begin with a forward slash.

Oh, and make sure **all files** are set to be readable by 'Everyone' (or 'World').

Here's a teeny little bit of Javascript that will grab the segments of the request URI for you:

{% highlight javascript %}
// Grab the pathname segments
var segments = window.location.pathname.split('/').slice(1);

if( segments[0] === 'somepage' ) {
  . . .
}
{% endhighlight %}

#### Testing

That linked you copied? Try going to it in your browser. You should see your crazy-cool site. If not, read back over the above and mess around. If it still doesn't work, [tweet me](http://twitter.com/tgvashworth).

#### Domain & DNS

Lastly, the cool bit.

You've got the domain name (right?), so head to the Host Records (DNS Configuration) of your domain control panel. For me, on Namecheap, that's under All Host Records of the domain panel.

Find the area where you configure the hostnames. You need to set them up so that the `@` record is a CNAME, and that its URL points to that S3 url, without the `http://` or trailing `/`. You should also have a `www` host that's a URL redirect (301 if you can) that points to the full (www-less) URL of your site. So `http://bogrollclub.com` in this case.

Something like this:

![DNS Config](http://i.phuu.net/image/0J2V0336160k/Screen%20Shot%202012-07-22%20at%2010.20.15.png)

Yeah, you can't see much, but you get the idea, right?

Save those changes, and wait a little while for the DNS to propagate. In my case that was less than a minute.

#### Woot

And that's it! Grab a cool, refreshing glass of lemonade and head to your site ([bogrollclub.com](http://bogrollclub.com/)). Feel happy & profit.
