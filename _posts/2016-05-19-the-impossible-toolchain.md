---
layout: post
title: "The Impossible Toolchain?"
---

My goal is to write good quality, well tested frontend code that makes building great products easier, faster and more enjoyable.

I want to:

- write code that fits within an existing app and the wider JavaScript ecosystem
- type my code, minimally, with reliable type inference
- allow users of my modules to use my types if they want
- not have to "install" type definitions for my depedencies
- compile to ES3 or ES5 with sourcemaps so that others can debug my code

I think that's a pretty reasonable set of requirements.

Here are some of the available problems right now:

- most available compile-to-JS languages interoperate too badly to be viable
- once you start interoperating with existing code, you either don't get inference or you get what amounts to guesswork (TypeScript, flow...)
- the tooling for type definition "installation" is unstable and complex
- debugging into library code is just no

This shouldn't be so hard. What am I missing?
