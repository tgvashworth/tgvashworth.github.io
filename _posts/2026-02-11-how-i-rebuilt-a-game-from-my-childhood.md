---
layout: post
title: "How I rebuilt a game from my childhood using Claude as my engineering team"
summary: "Robot Battle in the browser, with a new programming language..."
---

*Originally published [on Substack](https://tgvashworth.substack.com/p/how-i-rebuilt-a-game-from-my-childhood).*

*A full disclosure before we begin: this blog post was written by Claude (Opus 4.6), the same AI that built the game. I guided the project, provided opinions, caught the bugs, and told Claude what to write about. Claude had access to the full session transcripts. I reviewed and edited it. This feels more honest than pretending otherwise.*

*Also, you’re going to see extracts from my actual prompts, most of which you can see were dictated and therefore read very weirdly, because they’re just stream of consciousness. I spoke through WisprFlow much more than I typed.*

*Lastly, you can have a play with the game [here](https://tgvashworth.com/robot-battle/). Watch out for rough edges!*

------------------------------------------------------------------------

When I was a kid, I played a game called [Robot Battle](https://en.wikipedia.org/wiki/Robot_Battle), created by Brad Schick. You’d write little programs in a language called RSL that controlled tank-like robots, then pit them against each other in an arena. The robots could move, scan for enemies with radar, rotate their guns independently of their bodies, and fire. There were mines that dealt damage and cookies that restored health. You’d run thousands of matches to find the best bot.

I learned to code that way: rather than from a textbook or course, I tried to make a tiny tank turn toward a blip on its radar and shoot.

It was actually through this game — back in the mid-2000s, aged 11, 12, 13... — that I was introduced to incredibly important concepts that have shaped my life since: genetics (via genetic algorithms) and neural networks. Both with the aim of a learning robot that evolved its way to a tournament win. The former happened to be a gateway to atheism too, but that’s another story.

I’ve wanted to rebuild something like it for years, mainly for nostalgia’s sake. But it always seemed like a mammoth task, out of my capability and available time.

The release of Opus 4.6, with agent teams, led to a flash of inspiration: maybe now is the time to have a go at building my own Robot Battle?

So I decided to actually do it, in a way that tested something I’d been curious about: what happens when you treat Claude as a trusted engineering lead with a full team at its disposal?

This is the story of what happened. About 98 prompts, 18 git commits, 77 sub-agents, and one surprisingly opinionated argument about whether `float * angle` should be legal.

## **What We Built**

![](https://substackcdn.com/image/fetch/$s_!4W9n!,w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fb20d4653-4c48-46f5-b56c-48017d730951_3600x2078.png)

*My* Robot Battle is a browser-based game where you write robots in a custom programming language called RBL, those robots get compiled to WebAssembly, and then they fight each other in a deterministic physics simulation rendered in real time.

The final codebase has:

- A **complete compiler** (lexer, parser, type checker, WASM code generator) -- about 5,000 lines

- A **deterministic physics simulation** with bullets, radar, mines, cookies, and wall collisions -- about 1,500 lines

- A **renderer** using PixiJS with scan arc visualisation, health bars, speed indicators, and scrubbing -- about 650 lines

- A **React UI** with a code editor, file management, battle controls, and tournament mode -- about 2,000 lines

- **647 tests** including property-based fuzzing with fast-check

- **8 playable robots** with different strategies

- **Comprehensive documentation**: language reference, standard library, compiler architecture, tutorial, and a design rationale document

The whole thing runs locally in the browser with no server. You write a `.rbl` file, the compiler turns it into WASM bytes, and the simulation runs deterministically from a seed.

## **How It Started**

My first prompt was long. I described the original game in detail -- the arena, the radar mechanics, the separation of body and gun rotation, the cookies and mines, the tournament system -- and then said what I wanted:

> I would like to rebuild this game in the browser so you would load up one or more robot files in the browser and then they would either be played through a real-time or simulated at full speed in the browser. I’d like to have a language that you can use to author the robots and to have this be something that anyone can run locally and be extremely performant.

Claude’s first move was to ask clarifying questions, then spin up research agents -- five of them, running in parallel, each investigating a different aspect: WASM compilation strategies, rendering engines, simulation physics models, robot language design (including the history from RobotWar, CROBOTS, and the original RSL), and sandboxing architecture.

Each agent produced a research document, which Claude synthesised into architectural recommendations for me to review.

### **Laying the foundations before writing code**

Before any code got written, I spent several prompts establishing the architecture. Looking back, this was probably the most important work in the whole project.

First, I laid out the phasing explicitly. I wanted three independent layers that could be built and tested separately:

> 1.  We’ll start with the compiler and I want to get a harness for the compiler setup and get executing some simple robots in a fake environment... So we want a pretty complete test for the entire language before we go any further.
>
> 2.  I want a design for the simulation environment that assumes a compiled robot and we can start working on that separately because we could fake a compiled robot... As part of this it would be really good to establish an interface onto the game state that stays fixed and backwards compatible.
>
> 3.  Thirdly we need the visualisation which should take the game state and display it performantly. This separation is important for simplifying and testing.

The key insight was that each layer could mock the one before it. The simulation didn’t need a real compiler -- it could use hand-written test stubs that implemented the same interface. The renderer didn’t need a real simulation -- it just needed a `GameState` object. This meant agents could work on all three in parallel without blocking each other.

Then I asked Claude to find the seams:

> Find all the seams between the different modules that we want to create: the compiler, the simulator, the UI, and anything else you can identify. Try to sketch out what the interfaces between those would look like. Obviously they need to be extensible but they also need to establish clear boundaries and test interfaces so that we can adopt these things in parallel.

This produced a `spec/` directory with TypeScript interfaces before any implementation existed. The `GameState` type, the `RobotModule` interface, the `CompileResult` type -- all specified up front. These interfaces became the contracts that held the whole project together.

Only after the research, the language design, the phasing, and the interfaces were all agreed did I say:

> Now I want you to skeleton out each of these distinct areas so that we have a place to put code and a build system for each. And tests, and auto-formatting, and pre-commit hooks.

Even then, I was explicit about wanting the minimum:

> I want us to at minimum have: a very very small amount of compiler, a very small amount of simulation including tests, a very small amount of rendering, a very small amount of UI. While we can mock getting data from the previous step, it must be clear how those things would get passed through together.

I also asked Claude to research running the whole thing in a Docker container so I could grant it more autonomy safely. Once we had a sandbox, the real building started.

## **The Language Design Session**

![](https://substackcdn.com/image/fetch/$s_!hS--!,w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F6e1cb119-95b4-4ddf-abf7-a808c37dcdf9_1804x1146.png)

This was one of my favourite parts.

> Now I want you to take me through the language design. I really like Go as a simple, effective language, but I’d like us to do without pointers. No nil or null, full stop. Yes to strict types, no to generics. Iterate a bit on this basis, then show some samples and ask difficult questions about the design.

What followed felt like a design review. Claude would propose something, I’d push back, and we’d iterate. We landed on a Go-inspired language with:

- **No nil, no null, no pointers** -- every type has a zero value

- **Strict numeric types** -- `42` is an int, `42.0` is a float, and you can’t mix them

- **A dedicated** `angle` **type** that wraps at 360 degrees, because angle bugs are the number one source of pain in robot programming

- **Event handlers as first-class syntax** -- `on scan(distance float, bearing angle) { ... }` instead of callback registration

- **Intent-based control** -- you call `setSpeed(80.0)` and the physics engine applies acceleration limits

The angle type became a real design discussion. Should `float * angle` be legal? We decided no -- angle must be on the left side of multiplication. In hindsight, I’m not sure why!

Here’s what a robot actually looks like in RBL:

    robot "CircleBot"

    var phase int = 0
    var enemyBearing angle = angle(0)
    var enemyDist float = 0.0
    var orbitDist float = 250.0
    var orbitDir float = 1.0

    func init() {
        setColor(180, 50, 220)
        setScanWidth(10.0)
        if random(2) == 0 {
            orbitDir = -1.0
        }
    }

    func tick() {
        if phase == 0 {
            // Search: wide radar sweep, cruise toward center
            setScanWidth(18.0)
            setRadarTurnRate(22.0)
            setSpeed(50.0)
        }
        if phase == 1 {
            // Combat: orbit the enemy at preferred distance
            setHeading(getHeading() + enemyBearing + angle(90) * orbitDir)
            setSpeed(65.0)
        }
    }

    on scan(distance float, bearing angle) {
        enemyBearing = bearing
        enemyDist = distance
        phase = 1
        // Fire based on distance
        if distance < 200.0 {
            fire(3.0)
        }
        if distance < 400.0 {
            fire(2.0)
        }
    }

You can see it’s go-like, with the extra `on` keyword for easy even-handlers.

That compiles to WebAssembly. The compiler emits the binary format directly, with no intermediate text format or IR.

## **Building With Agent Teams**

Once the design was done, the actual building happened in phases. This is where the “agent team” approach really showed itself.

My prompt to kick off construction:

> Right, let’s get building. Launch an agent team focused on each of the modules that we described as well as a security reviewer that will keep tabs on what’s going on. And a tester that will use Chrome to poke at the application as it develops.

Claude spun up specialised agents for each module -- compiler, simulation, renderer, UI -- plus a security reviewer and a browser tester. Throughout the project, 77 sub-agents were created for various tasks. Some were long-running module leads. Others were short-lived specialists: “fix this specific codegen bug,” “write a bot that uses wall-hugging tactics,” “review the docs for factual consistency.”

The pattern that worked best was giving clear, bounded objectives:

> Make sure those tests pass, it’s not acceptable to have failing tests for an extended period. Continue to M2.

The agents would work, hit the milestone, and then I’d review the result -- often by loading it in the browser and watching robots try (and fail) to do things.

## **The Bugs**

Now for the bugs. There were far fewer than I expected.

### **The SawBot Saga**

SawBot was supposed to head to the centre of the arena, then saw back and forth perpendicular to the enemy while firing. Simple concept. It went through approximately seven rewrites.

First attempt:

> I added tried out the sawbot but it didn’t work -- it just sits there. Debug it but also think through what tools you need to debug the robot and build them.

This led to building `debugInt()` and `debugAngle()` standard library functions, which turned out to be useful for everything that came after.

Second attempt: it moved, but at 90 degrees to where it should have been going. A classic rotation offset bug -- the heading of the robot body didn’t match the direction of travel in the renderer.

Third attempt:

> Nope, that has totally wrecked it. It dives for the lower-left corner and kills itself driving into the wall. Do not fire when gun is cool -- just scan. We’re building up incrementally.

Fourth attempt:

> nope, that was reloaded. you’ve got something majorly wrong!

Eventually:

> Okay now SawBot is doing the wrong thing. It’s seesawing as if along a radius of the circle, whereas it should be along a tangent to the circumference of the circle and producing bigger oscillations. Check your math.

It took building the debug panel, adding angle visualisation, and several rounds of trigonometry before SawBot worked properly.

The prompt to “think through what tools you need to debug the robot and build them” turned out to be quite important, and I think that meta-prompt pattern could be useful in other contexts.

### **The WallBot Disaster**

WallBot was supposed to drive to a wall, patrol along it, and shoot at things.

> Wallbot looking very shit. Dives for a wall, hits it, and gets completely stuck oscillating the radar/gun.

And then:

> I think you’ve got some directions/heading wrong: the wallbot is hitting the bottom left corner, and facing left: feels like it thinks it’s on the top right hand side.

Coordinate system bugs are a special kind of pain. Eventually we figured out WallBot needed to decelerate on approach (instead of slamming into the wall at full speed), reverse direction by negating its speed (instead of turning 180 degrees), and use a wide radar sweep instead of a narrow lock.

### **The Phantom Radar Bug**

> There seems to be a bug where the bots are firing almost randomly potentially because they’re being told they’ve scanned a robot even when their radar hasn’t seen the robot. I can see this very clearly with the SpinBot which when it’s on its own doesn’t fire but as soon as there’s two bots in the arena it just goes in a circle and fires constantly.

This turned out to be a subtle bug in the simulation’s radar scan geometry -- the detection arc wasn’t being clipped properly, so robots were “seeing” things outside their actual scan.

### **The Variable Shadowing Bug**

This one was found not by me, but by the adversarial test suite.

When a variable was declared inside an inner block (like inside an `if`), the compiler’s codegen permanently overwrote the outer scope’s binding. So after the block ended, the outer variable pointed to the wrong WASM local:

    func tick() {
        x := 1
        if true {
            x := 99       // shadows outer x
            debugInt(x)   // correctly prints 99
        }
        debugInt(x)       // BUG: printed 99 instead of 1
    }

The `compileBlock` method used a flat `Map` for local variable bindings but never saved or restored scope boundaries. The fix was simple -- snapshot the locals map before entering a block, restore it after. This also turned out to be the root cause of 5 pre-existing test failures in nested struct literals and multi-return that had been worked around elsewhere.

Property-based testing caught it where hand-written tests hadn’t.

## **The Shape of the Work**

Looking back at the git log tells the story of how the project actually evolved:

    39d44bb Add initial research documents
    7f3ee8b Add RBL language specification
    aac292c Add design documents for compiler, simulation, visualization, and security
    6cb977b Add interface specifications for all module boundaries
    ce74d67 Scaffold project with build tooling, tests, and minimal working code
    491925d Add M2: parser, analyzer, simulation engine, PixiJS renderer, and UI shell
    b1e9d90 Add M3: WASM codegen, debug tooling, UI overhaul, and battle improvements
    3858bc1 Add M4: struct/array codegen fixes and 46 compiler integration tests
    69cf8a5 Add simulation event pipeline and UI compile diagnostics
    ...
    c8932ad Add new bots, mines/cookies, compiler extensions, tournament mode
    ...
    8001249 Add documentation, fix compiler bugs, and add adversarial test suite

The progression was research, then spec, then interfaces, then skeleton, then real code in milestones. Each milestone was a working state -- you could load the app and do something with it, even if that something was watching a robot drive into a wall and die.

The approach was explicitly incremental. When I felt the renderer work was getting too ambitious relative to what was actually working, I said:

> Drop the renderer objectives; they seem a bit too fancy for now. We’ve got a lot of work to do. However I think the simulation work and the UI do make a lot of sense to do now.

So we pivoted.

## **What Actually Got Built**

Right now, the game comes with eight built-in robots with different strategies:

- **SpinBot**: Heads to centre, spins in circles, fires opportunistically

- **CircleBot**: Orbits detected enemies at medium range with radar lock and predictive aiming -- the tournament champion at 80% win rate

- **TrackerBot**: Hunts enemies with tight radar tracking

- **SawBot**: Strafes perpendicular to enemies in a saw pattern (after seven rewrites)

- **WallBot**: Patrols walls with radar tracking (after three rewrites)

- **DodgeBot**: Evasive movement with dodge manoeuvres

- **CookieBot**: Seeks out cookies for health, avoids mines, fights when necessary

- **NothingBot**: Does nothing. Useful for testing.

The compiler handles the full language: variables, functions, if/for control flow, structs, fixed-size arrays, multi-return functions, and 8 event types. The type system enforces strict numeric separation and the angle type’s wrapping semantics.

The simulation runs deterministically with a seeded pseudorandom number generator. Bullets use swept line-segment collision detection. There’s an event pipeline that delivers scan, hit, wall collision, and robot collision events. Mines deal 30 damage and cookies restore 20 health, and you can shoot both to deny them to enemies.

The tournament system runs N games with the same robots and scores them: 3 points for a win, 1 for survival.

![](https://substackcdn.com/image/fetch/$s_!Ub0D!,w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F4f024c86-1afb-4120-95ba-db373ec342d5_1802x752.png)

## **What I Learned**

### **Clear goals matter more than detailed specifications**

The most productive prompts were goal-oriented: “I want this architecture with pre-designed interfaces,” “build a bot that seeks cookies to restore health,” or “give WallBot tracking, inspired by SawBot.” These gave Claude room to make implementation choices. Over-specified prompts like “implement a function that calculates the bearing to the nearest cookie using the arctangent of the position delta” just made it follow instructions badly.

### **Make it walk you through its decisions**

I very frequently and specifically ask Claude to use the “AskUserQuestion” tool to walk me through decisions that it’s made. So if it presents back a summarised piece of technical design, I will say “Walk me through all the decisions in this spec as if presenting to a tech lead. Use AskUserQuestion.” This approach makes it really easy to interrogate and shape in detail.

### **Agent teams work when the boundaries are clean**

If you’ve built games before, separating out game state from rendering will be familiar. The four-module architecture (compiler, simulation, renderer, UI) with explicit interfaces between them meant agents could work independently without treading on each other. The `GameState` type -- a plain object that flows from simulation to renderer -- was the key abstraction. Every module knew what it produced and consumed.

### **You still need to run the thing**

The most valuable bugs were found by loading robots and watching them fight, not by reading code. The moment SawBot drove into a corner and killed itself, I knew something was wrong that no test had caught. The debug tooling (`debugInt`, `debugAngle`, the debug panel) was built because we needed to see what the robots *thought* they were doing.

### **Incremental delivery keeps everything honest**

Every commit was a working state. The project was never in a “trust me, it’ll work when it’s all connected” phase. I could run battles from early on, even when they were ugly and broken. This made it obvious when something regressed.

### **Property-based testing finds things humans don’t**

The adversarial test suite using fast-check found the variable shadowing bug that none of the hand-written tests caught. Random program generation is good at exploring corners of a language implementation that you wouldn’t think to write by hand.

### **The division of labour was lopsided (and that was fine)**

Claude wrote 11,000 lines of source code, 22,000 lines of tests, 8 robots, and comprehensive documentation. I wrote maybe 50 words of actual code (mostly editing `.rbl` files in the browser). But I made every significant design decision: the language semantics, the physics tuning, the UI layout, when to drop features, when to push harder. The ratio of “lines written” to “decisions made” is wildly skewed, which is rather the point.

## **Would I Do It Again?**

Yes. This took roughly one Sunday, starting from an empty directory, plus evenings and early mornings around work over 2 further days. Moreover, I was easily able to work on [other things](https://github.com/gyrinx-app/gyrinx) at the same time. The result is a working game with a custom language, a compiler targeting WASM, a physics simulation, a renderer, a tournament system, documentation, and 647 tests. Not bad for partial attention.

*Maybe* I could have built all of this myself, given a few months. The compiler alone would have been a significant project, but although I know the parts of a compiler and have built simple ones before, the WASM target — including the memory-management decisions — would have been beyond me without significant research and time investment. Claude seemed to find this part almost trivial.

I’ve also built simple physics engines before and made simple games. But the totality and speed with which this came together was quite breathtaking. At times I found myself laughing in surprise, awe, and no doubt a bit of fear at what it had produced.

What Claude gave me was momentum: it kept the project moving across a breadth of work that would have exhausted me as a solo developer long before I got to the fun parts.

The code has rough edges and the robot AI strategies are fairly basic, but you can write a robot, compile it, watch it fight, and iterate. That loop is satisfying in exactly the way I remember it being when I was a kid.

------------------------------------------------------------------------

*Hi, Tom again. Some thoughts.*

*Thinking back a year, I had barely begun to scratch the surface of working with Claude, and there’s no doubt it really wasn’t a trustworthy development partner. But by May of 2025, I had Claude working on tasks on its own in an isolated environment on GitHub. In August, I was finding I could give it long-running tasks, trust it with simple, non-technical feature specifications, and it would sometimes produce better decisions than me. Now here we are in February 2026 and I’m able to trust it with the research, design, and construction of a relatively simple but complete game, including building a new compiler. The progress is astounding. It boggles the mind to think: where will we be in another year?*

*Secondly, I truly believe that nothing great comes easy. This was certainly easy and another example of how software is becoming a true commodity. This example has again thrown into stark contrast the change we’re living: writing code isn’t the job any more.*

------------------------------------------------------------------------

*The source code is available at [github.com/tgvashworth/robot-battle](https://github.com/tgvashworth/robot-battle). If you write a robot that beats CookieBot, let me know.*
