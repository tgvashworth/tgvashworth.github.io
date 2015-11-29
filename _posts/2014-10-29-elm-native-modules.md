---
layout: post
title: "Elm: building Native modules"
---

I couldn't find any documentation on how to write modules written in pure JavaScript for [Elm][elm] so I took a stab at it myself, using [elm-d3][elm-d3] and the [Elm compiler][elm-compiler] as a reference. Here's a quick write-up.

It's important to note that doing this is *not encouraged* by Evan (the Elm creator). It's a hack and subject to compiler implementation changes. **Use at your own risk.**

## The problem

Elm is great, but there are functions that aren't implemented as standard and aren't worth the effort to write in Elm itself, and are better built in JavaScript.

While Elm has a JavaScript interoperability pattern called [ports][ports] but they're async and have a couple of other unfortunate constraints, so aren't ideal for some use-cases.

Sometimes you just gotta call a function.

## The solution

A quick bit of background to begin...

Elm imports look like this:

```haskell
import SomeModule
import AnotherModule ( specific, functions )
import AThirdModule ( .. ) -- all the things
import Native.Logger
```

At compile time the compiler goes out to find the modules you import (`SomeModule` maps to a file of the same name with a `.elm` extension) *unless* the module name has the prefix `Native.`.

If the `.elm` files aren't there, it will blow up — this is good. If the name contains `Native.`, the Elm compiler will continue even if the file doesn't exist.

Assuming the files are present it compiles the importing code to something like:

```haskell
var $Some$Module = Elm.SomeModule.make(_elm),
    $Another$Module = Elm.AnotherModule.make(_elm),
    $A$Third$Module = Elm.AThirdModule.make(_elm),
    $Native$Logger = Elm.Native.Logger.make(_elm);
```

You can see that Elm assumes modules are there at runtime, and that it calls a `make` method to initialise the module. To build a native module, we just need to add something to the `Elm.Native` namespace before the main app loads (but after the runtime loads).

So, here's an example native module called `Logger`:

```haskell
Elm.Native.Logger = {};
Elm.Native.Logger.make = function(elm) {
    elm.Native = elm.Native || {};
    elm.Native.Logger = elm.Native.Logger || {};
    if (elm.Native.Logger.values) return elm.Native.Logger.values;
    return elm.Native.Logger.values = {
        log: function (x) {
            console.log(x);
            return x;
        }
    };
};
```

You can include this in the page in any way you like, so long as it comes after the Elm runtime:

```html
<!DOCTYPE HTML>
<meta charset="UTF-8">
<title>Your App</title>

<!-- Runtime -->
<script src="elm-runtime.js"></script>
<!-- Native files -->
<script src="Native/Logger.js"></script>
<!-- Compiled Elm bundle -->
<script src="build/App.js"></script>
<script>
window.onload = function () {
    Elm.fullscreen(Elm.App);
};
</script>
```

As usual, in production, concatenate and minify those files!

To finish up, here's a little snippet for generating these modules:

```js
function ElmNativeModule(name, values) {
    Elm.Native[name] = {};
    Elm.Native[name].make = function(elm) {
        elm.Native = elm.Native || {};
        elm.Native[name] = elm.Native[name] || {};
        if (elm.Native[name].values) return elm.Native[name].values;
        return elm.Native[name].values = values;
    };
}
```

Use it like this:

```js
ElmNativeModule('Logger', {
    log: function (x) {
        console.log(x);
        return x;
    }
});
```

Remember, this is *not recommended*. Try to use ports first, and prepare for this to break when the compiler implementation changes.

[elm]: http://elm-lang.org/ "Elm"
[elm-d3]: https://github.com/seliopou/elm-d3 "seliopou/elm-d3"
[elm-compiler]: https://github.com/elm-lang/Elm "elm-lang/Elm"
[ports]: http://elm-lang.org/learn/Ports.elm "Learn Ports"
