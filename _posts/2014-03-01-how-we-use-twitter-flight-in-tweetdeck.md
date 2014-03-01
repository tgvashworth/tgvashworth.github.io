---
layout: post
title: How we use Twitter Flight in TweetDeck
---

This post is *not* an introduction [Flight](http://flightjs.github.io/) – it's about patterns I've spotted in our Flight usage on TweetDeck. Some of it probably spills over into opinion about best practice, but I tried to keep that out as much as possible. We have just under 200 Flight components – around 14k lines of code – so we've tried lots of different things. This is a snapshot of my/our thinking right now.

This was originally posted to the [Twitter Flight mailing list](https://groups.google.com/d/msg/twitter-flight/QEGqbUAhARw/8Q9sbOh0QcMJ).

## Components

- <p>There are three discernable types: UI, UI Controller and data components.
- <p>All three use mixins, although the sets of mixins they use do not tend to overlap.
- <p>UI components are initialised around a specific area of DOM, adding or creating functionality as necessary.
- <p>We extensively use mixins with UI components to add functionality as diverse as templating, lifecycle management or opening dropdowns and modals.
- <p>UI controllers and data components sit usually at the document level, but sometimes elsewhere.
- <p>Data components rarely use mixins.
- <p>UI Controllers either tie together the functionality of a number of UI components or manage global state that a single component could not; the latter are often paired with a mixin.</p>
<p>
For example, we have a (very lightweight) `DragDropController`, and mixin called `withDragDrop`. These combine to allow any component to react to drag/drop behaviour – the controller just manages the start and end events that the individual components could not. Another example is the FocusController and withFocus.</p>
- <p>We nest components using a mixin called `withTeardown`, which we really should open source or get into Flight core. It's very useful, allowing a component to attach a 'child' component and couple their lifecyles. Parent tears down; child tears down (but not the other way). 'Child' components can nest their own children, and so teardown can form a kind of cascade. This is really important for TweetDeck as it's a single page app – we can't (ever) `teardownAll`! Almost every new component we create uses it, and it (IMO) makes for some very nice code.

## Events

- <p>Events are namespaced by the type of component they come from (ui or data)
- <p>These will (mostly) then be namespaced again according to what bit or functionality they are associated with: `uiDragStart`, `uiKeyEnter`, `dataAuthComplete`.
- <p>We sometimes use xNeedsY for request/response-type event pairings: `uiNeedsTypeaheadSuggestions` and `dataTypeaheadSuggestions`. There is also `uiRequestX`, but I haven't seen any new examples recently.
- <p>We try to trigger on the document as infrequently as possible, preferring rather to trigger on the component's node and allow the event to bubble. This way you can reuse components in multiple contexts, with parent components managing the events however they see fit. It really works too – we reuse our login forms in this way.

Of course, we're always evolving our practices so this stuff is likely to to change. I can also see us making a public git repository with some patterns and example code in the near future.