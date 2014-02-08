---
layout: post
title: I messed up. I'm sorry.
date: 2012-9-13 10:00
---

On 13th September, at 9:38am, I pushed a feature to Twapp to allow users to stop a post from going through if it was too long for Twitter.

Due to a stupid mistake, I left some in code that created a fake post, to test the feature. This resulted in an identical tweet being sent to the Twitter accounts of all Twapp's users.

I am very sorry. I totally messed up and I'll do my absolute best to make sure it won't happen again.

I'm putting a check in place to make sure that username stored in the post is the same as the username of the user for whom Twapp is currently posting, which should stop this ever happening again, and I'll take a good look at other checks like this, some that are already in place, across the app.