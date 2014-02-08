---
layout: post
title: Keeping Open-Source Secrets
date: 2013-04-11 19:00:00
---

Often with an open-source project you need to keep private configuration secret - it can't be shared alongside the code. This can be anything that dictates the running of the app – like client secrets for a 3rd party API – that's important to keep safe from potentially malicious uses.

Ways of keeping this data away from prying eyes may not be immediately obvious, but here's a few options to get you started.

### .gitignore

One way is to use a config file that's never commited into the repository. You might use JSON and tell your open source users that they need to create their own to run the app:

{% highlight json %}
{
    "db": "mongodb://localhost:27017/some-database",
    "twitter": {
        "client_id": "YOUR_CLIENT_ID",
        "client_secret": "YOUR_CLIENT_SECRET"
    }
}
{% endhighlight %}

And then import it into the project (here using Node):

{% highlight javascript %}
// Create your own config file to run this app
var config = require('./config.json');
{% endhighlight %}

To make sure this file is never committed, make sure to ignore the file. In Git, this is done with a `.gitignore` file that goes in the root of your repo:

{% highlight text %}
# ignore config file
config.json
{% endhighlight %}

It's also worth providing a sample configuration file to help others out – you could call it `config.example.json`. Something like the above example is non-specific enough to work nicely.

This method works very well if you have direct access to the filesystem of the server (‘environment’) because you can update the config file manually. It doesn't work so well if your app is automatically deployed, or you use continuous-integration because you may not have that requisite access to the files.

If you use a ‘cloud’ service like Heroku that deploys using a version-control system then this option is out of the question because the config file is not in the repository!

### Private fork

Another way is to maintain a private version – or fork – of you app, storing the key information in the private repository. Again you might use JSON to keep your config, although you could keep it directy in the code:

{% highlight javascript %}
var config = {
    db: "mongodb://localhost:27017/some-database"
};
{% endhighlight %}

This method means fixes and improvements go to the open-source version, and you have to manually merging them into your private version. That's a bit of extra work, and it can create problems if you discover and fix a bug in the private fork because you'll need to carefully branch to allow you to pull-request back into the public fork.

Having a private fork is also limited when it comes to deploying to multiple environments – like staging and production servers because you have to store configuration for both environments in the fork.

I'm using hybrid of the above for a media server called [medyana](https://github.com/phuu/medyana). I have a private fork that hosts my podcast, [Less Than Bang](http://lessthanbang.com/). It contains `files.json` that points to where each episode is hosted.

Unfortunately I'm also demonstrating the above problem well, because the private repo has had a number of fixes that the public code has missed out on (so far)!

It's worth saying that this method works if your deployments are cloud-based, too.

### Environment-agnostic

A good alternative is to build your app to be environment-agnostic. That means storing all configuration data in the environment – on the server – you are depoying to.

Setting environment variables is pretty simple:

{% highlight text %}
export DB_URI=mongodb://localhost:27017/some-database
{% endhighlight %}

You app will be able to access the environment data to configure itself:

{% highlight javascript %}
var config = {
    db: process.env.DB_URI
};
{% endhighlight %}

This method is fragile however, because variables set in the above way don't persist across system restarts or even new processes.

To have them persist, set them in the `.bashrc` (or other shell configuration file) of the user who will be running the app (not root!):

{% highlight text %}
DB_URI=mongodb://localhost:27017/some-database
TWITTER_CLIENT_ID=YOUR_CLIENT_ID
TWITTER_CLIENT_SECRET=YOUR_CLIENT_SECRET
{% endhighlight %}

This works for OSX and Linux, but of course, it's different if you're using a Windows server.

### In the cloud

If you're deploying to a cloud service like Heroku or Nodejitsu then you'll need to use a slightly tweaked version of the environment variable method: you don't have access to the files, you have no control over the machine your app will be run from, and deployment is done via Git!

I only have experience doing this with Heroku, so I'll keep it specific to that service, but setting persistent environment variables on all these services is simple.

Environent management on Heroku is done with their fantastic [command-line toolbelt](https://toolbelt.heroku.com/). Amongst other things, it lets you set up environment varibales for your app:

{% highlight text %}
heroku config:set TWITTER_CLIENT_ID=YOUR_CLIENT_ID TWITTER_CLIENT_SECRET=YOUR_CLIENT_SECRET
{% endhighlight %}

Heroku sets up some variables by default; you can view these using `heroku config` on its own.

Again it's a case of bringing the variables into your app:

{% highlight javascript %}
var config = {
    twitter: {
        id: process.env.YOUR_CLIENT_ID,
        secret: process.env.YOUR_CLIENT_SECRET
    }
};
{% endhighlight %}

You'll also need to use this method if you're using any of Heroku's plugins, as they store their configuration data in the environment too – for example, the database providers add a database URI variable to the environment for you to use. With MongoHQ, it might look like:

{% highlight javascript %}
config.db = process.env.MONGOHQ_URI;
{% endhighlight %}

I use this method with my [App.net Friend Finder](https://github.com/phuu/adn-friends) and a couple of other projects.

### Hybrid approach: best of both

Since I deploy most of my projects using Heroku the last method is really my only option, but it's possibly the worst for users and contributors to open-source projects. So the best thing to is to support multiple ways of configuring your app!

Setting up a chain set of fallback configuration options is reasonably simple, and if you're using [Express](http://expressjs.com/) you might have seen code like this before.

The priority chain goes like this: arguments to the process; then environment variables; then config files and finally in-app configuration.

Here's an example:

{% highlight javascript %}
// Grab the config file if it's there
var configFile;
try {
    configFile = require('./config.json');
} catch (e) {
    configFile = {};
}

// Then configure!
var config = {
    port: parseInt(process.argv[2], 10) || parseInt(process.env.PORT, 10) || configFile.port || 8000,
    db: process.env.DB_URI || configFile.db || 'mongodb://localhost:27017/some-database',
    twitter: {
        id: process.env.TWITTER_CLIENT_ID || configFile.twitter.id || '',
        secret: process.env.TWITTER_CLIENT_SECRET || configFile.twitter.secret || ''
    }
};
{% endhighlight %}

This allows you and your contributors to easily configure the app, and modify it on the fly.

> By the way, for more advanced argument handling, take a look at [optimist](https://npmjs.org/package/optimist) or [commander](https://npmjs.org/package/commander).

### Summing up

Keeping things a secret while giving out all your code is no mean feat. I hope this helps you out.

I'll be trying to use the last snippet in all future projects of mine; it makes the project easy to configure and flexible to deploy. Actually, deploying projects is something I'd like to address in a future post...