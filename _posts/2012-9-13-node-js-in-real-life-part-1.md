---
layout: post
title: "Node.js In Real Life: Part 1"
date: 2012-9-13 15:00
---

Let's take a look at using Node in real-life, on an actual product. There's tonnes of "Hello world" examples, but what about practical application for real work?

In a series of tutorials we'll go through designing, building and deploying a real application built on Node. This is an actual app that I'm intending to release, and you'll get to see every stage as we go through, warts & all.

### The app

So what will we be building?

We're going to make an application for conference goers, or visitors to any event, that will help them see where others at the event are. We'll allow users to create an event by associating a location with a hashtag, and then allow others to use that hashtag to see themselves, and others using the same hashtag, on a map.

I'm calling it **Eventpack**, and I've bought the domain `eventpack.me`. You'll find out why in a later tutorial ;)

On the server we'll obviously be using Node, on top of which we'll utilise ExpressJS. It's the best web application framework for Node, and will do a shedload of work for us. For Rubyists, it's like [Sinatra](http://www.sinatrarb.com/); Pythonistas: [Pyramid](http://www.pylonsproject.org/); PHPsters: it's [CodeIgniter](http://codeigniter.com/)-ish.

We'll also be using [Mocha](http://visionmedia.github.com/mocha/) for test-driven development. I have to admit that I'm no TDD master but hopefully I can give you a few tips on testing Node.

As it's a web app, on the client side we'll use [OpenStreetMap](http://www.openstreetmap.org/), [Leaflet](http://leaflet.cloudmade.com/) and the [Geolocation API](http://diveintohtml5.info/geolocation.html), plus HTML(5), [LESS](http://lesscss.org/) and Javascript. jQuery may also make an extrance.

It'll all be on Github, and I'll make branches for each post so that it's easy to follow, and mess around with, each stage. And I'm also totally open to feedback – if you think a design decision is insane then tell me!

### Assumptions

I'm assuming that you are proficient in HTML, CSS and know Javascript well enough to understand callbacks & functional scoping. If you don't (and that's totally cool), there are [some](http://jsforcats.com/) [great](http://net.tutsplus.com/tutorials/javascript-ajax/24-javascript-best-practices-for-beginners/) [tutorials](http://james.padolsey.com/javascript/closures-in-javascript/).

I'm going to assume you have Node installed, becuase of the wealth of tutorials about out there, but I won't assume you know anything about Node itself.

If you don't have it installed, it's pretty easy on any platform (yep, Windows included). [Head to their site](//nodejs.org). The latest versions will come with `npm`, the Node Package Manager, so I'll assume you have that too, but don't worry, I'll show you how to use it.

I'm also going assume that you have MongoDB installed & running. They have a great set of [Installation Guides](//www.mongodb.org/display/DOCS/Quickstart), so check them out.

For reference, I'm working on OSX **10.8.1**, using Node **0.8.9** with npm **1.1.61**. That means, if you're on Windows, most of the command line stuff will be different. I'm sorry to be unable to support you specifically, but this tutorial is going to be long enough as it is! Also, some of this stuff may be different in the future, but I trust you, dear reader, to figure it out :)

### We begin at the beginning

I guess that the most obvious thing to start with would be to get ourselves set up with Node by installing Express and Mocha with `npm`. This is pretty simple to do, so let's get started.

`npm` is the Node Package Manager, and is a great tool for finding, installing and managing packages, or modules, to use in your Node projects. You'll find it on your command line just by typing `npm`. As I said, I'm going to assume that it's working.

There are two ways packages can be installed. The first, and most common, is to install them into the currect directory; this places them in a `node_modules` directory. Node will look for this directory when you `require` a module (more on that soon), and each `node_modules` directory is specific to the current project.

The second way installs the module globally; this is only suitable for some modules, and most will tell you which way to install them. Installing globally allows a module to add other useful functionality, like command line tools, to your computer.

Express and Mocha are modules that are best installed globally. We'll begin with Express.

### Installing Express

Run this in any directory:

`sudo npm install -g express`

Hopefully, you'll get a load of install output, finishing with something like this...

![express@3.0.0rc4 /usr/local/lib/node_modules/express](http://i.phuu.net/JSsq/Screen%20Shot%202012-09-14%20at%2009.26.38.png)

As you can see, I've got Express **3.0.0rc4**. Your results may differ, but if you have anything less than 3.0.0 then try:

`sudo npm install -g express@3.0.0rc4`

What the output in the image is telling you is that Express, and a load of modules upon which it relies, were installed. In my case, they all went into `/usr/local/lib/node_modules/express` – again, your results may vary.

All Express documentation is available on [expressjs.com](http://expressjs.com/).

### Installing Mocha

Now we'll do the same with [Mocha](http://visionmedia.github.com/mocha/).

`sudo npm install -g mocha`

I get `mocha@1.4.2`. Anything greater than 1.3 should do.

We can actually leave Mocha alone for a little while now, as we're going to start a new project.

### Starting a new project

The reason for installing Express globally was to install the useful `express` command line tool that, amongst other things, can create a template application so we can get to work quickly. It has [pretty good documentation](http://expressjs.com/guide.html#executable).

We going to be using `express` to do alot of work for us straight away.

`express --sessions --css less --ejs eventpack`

![output of express --sessions --css less eventpack](http://i.phuu.net/JSkw/Screen%20Shot%202012-09-14%20at%2009.51.54.png)

This will create a template structure, as you can see above. It's also given us some instructions, which you should follow. Once you've run `node app`, head to [http://localhost:3000/](//localhost:3000/) to see Express in action...

![Express in action](http://i.phuu.net/JS28/Screen%20Shot%202012-09-14%20at%2009.56.25.png)

You can quit the app using `Ctrl+C`.

Running `cd eventpack && npm install` gave us similar output to when we installed Express and Mocha, but with a slight difference.

![npm install output](http://i.phuu.net/JSzI/Screen%20Shot%202012-09-14%20at%2009.59.09.png)

Let's walk through it.

You can see it installed three things. `jade`, `less-middleware` and `express`. But this time, they are installed in `node_modules/` – if you run `ls` in the current directory you'll see `node_modules` there.

![ls output](http://i.phuu.net/JTgO/Screen%20Shot%202012-09-14%20at%2010.01.17.png)

This directory is where the local modules go. When we get `git` set up, in the next tutorial, we'll put `npm_modules` in the `.gitignore` file—perhaps that hints at the power of NPM—but for now you can forget about it.

We used three flags with the `express` tool. This adds some automatic functionality: session support and LESS compliation (and compression, if we want it). Both will be useful once we start work properly.

### Enough for now

So there you have the basic structure of a Node app. Take a look around that template, there's not much to it yet. Next time we'll have it doing stuff.

I think this tutorial is now quite long enough. I hope you've enjoyed it so far and are in for the rest of the series! I'm open to all feedback so please let me know what you think and what I can improve.

Thanks for reading.