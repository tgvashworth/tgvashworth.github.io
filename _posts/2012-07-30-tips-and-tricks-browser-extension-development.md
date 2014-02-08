---
layout: post
title: Browser Extension Tips
date: 2012-07-30 6:00:00
---

I thought I'd share a few things that might help you out if you're putting together an extension, particularly if it's for more than one browser.

### Split the code

One of the most important aspects of the Buffer extensions is the separation of the browser-specific and browser-agnostic code. The integrations, hotkeys and the page scraper use the same across the three browsers that we officially support: Chrome, Firefox and Safari, alongside some browser specific code that enable the duplication.

The shared code is in a separate repository and is a submodule of each extension's repo. It's very useful becuase it enables me to quickly make an update to fix an integration in one browser and deploy it quickly to all three, and keep track of when each improvement was released out into the wild for each browser.

It's meant a few hacks to allow the shared code to work the same in each browser, but now that's in place I am reasonably sure that any change to a content script will work in all three. And, since we rely heavily on content scripts, that confidence is very important.

### Extension info

Extensions have a configuration file that dictates anything from the name and descripton to which content scripts are injected where and when. So it's pretty useful to be able to grab information about your extension to use in the background page. The APIs for this are not obvious or non-existant, so here's a few snippets to help you get the information.

In Chrome you can get the manifest.json as an object using the chrome.app API, and make it available as `chrome.manifest`.
{% highlight javascript %}
chrome.manifest = chrome.app.getDetails();
{% endhighlight %}

In Safari the info is store as a plist file. Urgh. Use a blocking XMLHttpRequest, and a JS plist parser, and expose it as `safari.info`.
{% highlight javascript %}
var req = new XMLHttpRequest();
req.open(
  'GET',
  safari.extension.baseURI + 'Info.plist',
  false);
req.send();
safari.info =
  PlistParser.parse(req.responseXML);
{% endhighlight %}

Firefox is a trickier beast. You can get some of the data from the global self object...
{% highlight javascript %}
self.version; // "1.7.3"
self.name; // "MyGreatExtension"
{% endhighlight %}

But you can't get at things which can only be specified in the Firefox package.json, like the preference list. I'm working on a way to do this, using some of the lower-level Firefox APIs. I'd love to hear from you if you know a way.

### Work straight after install

With the Buffer Chrome extension we needed the extension work straight away after a user installed it, becuase we found that most users would install the extension and then remove it straight away when it didn't work.

We could have asked them to reload all their tabs, but this seemed very bad for the user experience and I wanted avoid it at all costs.

The way to do it in the end to use programmtic injection to add the most important scripts (the overlay) into all open tabs.

{% highlight javascript %}
// Inject scripts listed in the manifest
var inject = function (id) {
  var scripts =
    chrome.manifest.content_scripts[0].js;
  scripts.forEach(function (script) {
    chrome.tabs.executeScript(id, {
      file: script
    });
  });
};

// Grab all the windows with tab data
chrome.windows.getAll({
  populate: true
}, function (windows) {
  // Iterate through each window
  windows.forEach(
    function (currentWindow) {
      // And each tab...
      currentWindow.tabs.
        forEach(function (currentTab) {
          // Skip chrome:// and https://
          if( ! currentTab.url.
               match(/(chrome|https):\/\//gi)
            ) {
            // Injectify!
            inject(currentTab.id);
          }
      });
  });
});

{% endhighlight %}

And yeah, we can totally use `Array.forEach` cos we're guarenteed to be in Chrome. Woop!

Oh, and sorry for how unreadable that code is. It's a narrow box, and I need to work on biggifying it.

### Surviving an upgrade

Chrome is Buffer's most used extension, and is the biggest source of updates posted, so I want to make the Chrome experience as great as possible. One part of this was having a seamless upgrade experince.

By default, when your extension is upgraded (automatically and without warning) the content scripts that the previous version of the extension injected will no longer be have access to the port-based messaging service the two sides use to communicate. In the case of Buffer, this effectively made the extension useless.

The first version of the extension that fixed this actually contained a memory leak that could crash the browser, but after some rejigging we now have an efficient system for restoring the connectiong. The extension overall has one of the smallest memory footprints of the extensions I have installed.

The following code would go in a file injected into every page where a content script require access to a port to the background page.

{% highlight javascript %}
var port;

// Trigger connect...
var reconnect = function () {
  port = null;
  // ...after 1 second
  setTimeout(connect, 1000 * 1);
};

// Attempt to connect
var connect = function () {

  // Make the connection
  port =
    chrome.extension.connect({name: "port"});

  // We listen for an onDisconnect event, and
  // then wait for a second before trying to
  // connect again.
  // Because chrome.extension.connect fires
  // an onDisconnect event if it does not
  // connect, an unsuccessful connection will
  // trigger another delayed attempt.
  port.onDisconnect.addListener(reconnect);

};

// Connect for the first time
connect();
{% endhighlight %}

That should keep your content scripts connected up and working even if the extension is uninstalled or upgraded.

### Summary

Hopefully some of this might help you out if you're putting together a content script heavy browser extension. I'd love to hear from you if you have any thoughts, ideas or questions – just [email me](mailto:tom@phuu.net)!