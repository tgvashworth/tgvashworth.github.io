---
layout: "post"
title: "Maturity in Frontend Development"
---

I recently gave a talk at [codelicious](TODO) in Birmingham about ways in which the practices of frontend teams must mature as our codebases and teams grow in size and age. This is an article version of that talk.

---

To give you an idea of the kinds of problems I work on day-to-day, here's some facts and figures about TweetDeck:

- A few million users
- Six billion API requests every day
- Maybe eighty thousand lines of JavaScript
- Six years of git log

It's fascinating to page back through the git log to see the traces left by team members I never met and get an insight into their thoughts.

I've been working on the codebase for almost three years, and in that time have seen huge changes in the way we work. We've learned a huge amount about commit size, code review, incident management and continuous delivery, and I'd like to share some of that with you.

This article will be split in the three broad sections: first, architecture, structure, programming styles and refactoring; second is complexity, technical debt, and how to manage it through systematic changes to the way you communicate as a team; and finally the increasing role of operations in frontend developement.

---

If there's one reason that I want to share these ideas, it's this:

> As frontend technology matures, so must our practice.

The projects and teams we work on are getting larger and more ambitious in scope, and we must learn from others who have had delivered quality software, at scale, for years.

Additionally, these skills make it more likely a person will be successful on the TweetDeck team —  and I suspect on other large or old codebases too — so it's in our interest to share this learning.

## Architecture & refactoring

To start with, I want to introduce you to our JavaScript framework [Flight](TODO). It's used by [twitter.com](https://twitter.com) and [TweetDeck](https://tweetdeck.twitter.com), although as a company we're largely moving to React.

The specifics of the framework are not particularly important here, but here's a quick introduction so some examples later on make sense.

This is an example Flight component:

```js
const Example = component(example, withExtras);
function example() {
  this.after("initialize", function () {
    this.on("click", this.onClick);
  });

  this.onClick = function (event) {
    this.trigger("exampleWasClicked", {
      some: "data"
    });
  };
}
```

A core principle of Flight is that you *attach* a component to a DOM node, and use *events* to communicate with other components. Here's how you attach:

```js
Example.attachTo("#example", {
  config: "data"
});
```

Flight additionally has an [aspect-oriented programming](TODO)-inspired feature that allows you hook additional functionality around an existing method:

```js
this.onClick = function () { ... };
this.before("onClick", this.doAThing);
this.after("onClick", this.doSomethingElse);
```

And that's the basics of Flight!

---

Over time, and as we used Flight for more complex interfaces, we found it wasn't scaling with us. The specific problems we had were:

- Nesting was complex and manual
- There was no standard state management
- Events aren't good for data flow

<!--Nesting components is important for complex interfaces because nestabilty is a precursor to the real goal, *reuse*, while standardised state management makes it possible to *predict* how a component will works, which is good for maintainability amongst other things. Events are just the wrong primitive for data flow.-->

To find fixes for these problems, we looked around at other frameworks for inspiration.

We liked the properties of [React](TODO) for it's simple and predicatable state management and automatic re-render flow, while [Elm](TODO) and [Cycle](TODO) make [functional](TODO) and [reactive](TODO) principles first-class.

More imporantly, within those frameworks we looked for *ideas* that we could reapply in our own situation; when you have lots of existing code, rewriting might not be an option.

What we found in these frameworks that we liked seemed quite reusable:

- Component nesting & composition
- Easy, predictable state management
- Normal functions for data manipulation

Making these ideas applicable to Flight took some time, but here's


