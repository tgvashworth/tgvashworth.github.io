---
layout: post
title: Dreaming of browser extensions
date: 2012-07-02 10:00:00
---
Browser extensions are a really neat way of integrating straight into web browser UI, a place people are spending an increasing amount of time, while also offering a unique opportunity to embed actions directly into the familiar UI of services like Twitter and Facebook. In fact, half of all updates Buffer sends come from the extensions, with Chrome alone contributing around 40% (more than any other single source).

However, the API for extension development is totally different in each browser, creating a serious headache when maintaining and improving anything approaching complex. Chrome is, perhaps, the easiest to work with, but I don’t want to leave the other browsers behind, so I’m working on a library that will normalise the APIs for a better extension development workflow. The deployment workflow is different again for each browser, but I won’t get into that here.

### What makes an extension?

Browser extensions are, in general, made of two things: background pages and content scripts. There is only one background page per-extension per-browser-instance, but the background page may inject content scripts any number of times into any number of open tabs. The content scripts are sandboxed away from the page into which they are injected, except in that they share access to the same DOM.  There is, of course, more functionality that this, but that’s the general idea.

The content-script aspect of the Buffer extensions is split into two parts: the ‘embed’ and ‘overlay’ code that is shared by all three extensions (a separate repository, using git submodule), and some browser specific code. The browser-specific code puts in place a number of objects that allow the same functions to be called in the shared code, no matter which browser. This (mostly) works, although the differing ways in which the contents scripts are injected (I’ll get to that later) means that sometimes some bodging is necessary to make sure things work. I want the library to abstract away all worrying about how the script is injected so that it ‘just works’.

That said, right now it works quite well. Mostly, I can add a feature to the shared code and have it work out of the box in the other browsers.

Once you move to the background page things change again as we’re back using the browser-specific API and methodologies. This is where the headache starts; shifting from one browser to another to add background page functionality requires a full brain-reset. Forgive me for going into detail; this post is as much for me to sort it out it my head than for anyone else!

### Content-script injection

In Chrome, content-scripts are specified in the manifest.json file found in the root of the extension directory. They follow a schema where you specify a set of URL-match patterns and an array of scripts (and stylesheets) to be injected if the tab URL matches the pattern. It’s up to the programmer to set up communication between the script and the background page (again, more on that later). Reasonably simple, powerful and easy to use. Chrome also provides a programmatic injection.

In Firefox, you use their pageMod API to add scripts to a page using a similar (but very limited) URL match. You can inject Javascript and CSS (a recent addition), and you may also pass a callback which is passed a worker. The worker (not quite the same as a WebWorker) has a port property through which you can communicate with the injected content script (and any others injected into the same page).

In Safari there are, like Chrome, two ways to inject a script. The Extension Builder interface allows you to specify a list of scripts to be injected and a white/black-list of  URLs, but the lists apply to all content scripts and it’s therefore a somewhat ham-fisted way of doing it. The Builder actually modifies an Info.plist located in the root directory of the extension, so in this sense it’s quite similar to Chrome but plist is not nearly as user-friendly as json. Safari also allows programatic injection of Javascript and CSS, but again it’s up to the programmer to set up communication between content script and background page.

It’s clear that the commonality between all three is programmatic injection, so any library would have to normalise this API, allowing a simple method for specifying which scripts should be injected, and where. I prefer the json method, but it seems that it’s not workable. Perhaps there’s a happy middle ground here somewhere, in the form of a [grunt](https://github.com/cowboy/grunt)-style object passed to some kind of registration method.

### Background-page & content-script communication

As mentioned, the next problem is how to communicate betwixt background page and content script. The concepts and APIs are again different, as is the persistence of the connection.

Chrome has two methods of communication between the two aspects of the extension. One is a simple, one-off message passing API with optional response callback. The other is a persistent connection using a Port object with a DOM-like event API (e.g. port.onMessage.addListener), although it is sufficiently different as to be annoying but close enough to be be confusing.

Firefox uses the previously mentioned worker port which has a nodejs-style EventEmitter that exposes on and emit methods. I much prefer this style, for brevity as much as anything else. Replicating this style in the new library seems to make sense as it fits with the other, previously considered, API styles.

Safari uses the concept of a Proxy interface, similar to Chrome’s Port, that allows messages to be sent and listened for using another event listener API, this time much closer to the DOM API, including the option to fire during the capture phase. However, in Safari a Proxy is not an object but a set of methods that a number of objects implement. That is, you can attach handlers to a tab, window or the Safari application itself. The exact object used for dispatching events changes according to which side of the background page/content script divide (although the two objects are annoyingly similarly named). Since it’s possible to detect which side we are on this shouldn’t present to much of an issue.

### Conclusion, of sorts

It’s important also to say that this is, by far, not the full extent of the differences. The limitations of the sandbox model for content scripts differs from browser to browser, as does the way in which you extend the browser’s native UI. Other APIs are missing in some browsers (notably hotkeys in Chrome & Safari – although they are on the way, at least in Chrome), so there would have to be a way of filling these gaps too.

I should mention, I want this library to be run-everywhere. It should work equally well when included in the background page as when injected as a content script. Absolutely ideally I should be able to write and extension once and run it everywhere, but that’s a pipe dream. Some collaboration between the browser vendors on how to implement extension APIs would make this possible, especially as I believe that extensions, and apps for Chrome, are going to become increasingly important. I really don’t want to see a divergence of platform capabilities so that  what an extension can to in Chrome far out-guns what’s possible in Safari. Safari was late to the game in implementing extensions and their API is very, well, Appleish. Firefox’s is, in parts, very Mozillaish (right down to the multiple other ways of making extensions, all not mentioned here). Perhaps it’s another case of Google not having to stick to precedents set by legacy codebases that may well be found in the other browsers (especially Firefox).

**Edit**: the library, currently in the early stages of development, can be found on [github](https://github.com/phuu/extensio).