---
layout: post
title: "Interlocks: proving the agent read the skill"
summary: "A small pattern for showing that an LLM opened your guidance files before it called the tool — and for measuring which ones it consulted."
---

A common pattern in our Applied AI codebase at incident.io is to pair up a specific tool with a skill that teaches Claude how to use it. We've introduced **interlocks** to ensure the model does the right thing, and to help us track usage of our guidance files.

## The problem

We use skills and guidance files to teach Claude our ways of working, and we build tools to make certain data wrangling or query tasks much more simple for Claude. We've found that tools that are ergonomic _for the agent_ avoid the randomness you get when the agent reasons through every step, every time.

The skill-tool pairing is useful because it provides in-context learning around the most powerful and flexible tools: when to use them, when not to, what the worked examples look like. Done well, it reduces the chance of errors, and increases the likelihood that the agent does the right thing in one-shot.

Critically, the agent is supposed to read the skill before it calls the tool.

But tools are self-documenting, so the agent can pick them up without awareness of the skill, and skill triggering is not guaranteed in ambiguous circumstances anyway.

And, as a tool author, it's hard to know how your tool is being used. As a skill author, it's hard to be sure the skill is firing. If the call goes wrong, you can't always tell whether the agent skipped the relevant section, read a stale copy, or read the right thing and _still_ got it wrong.

## Interlocks

An **interlock** is a small change that makes skill use observable from inside the tool. Put a token in the skill, ask the agent to pass it back when calling the tool, do something with it on the tool side.

There are two flavours, depending on what you want from it.

The simpler one is a **skill interlock**: a single token in the skill, passed back to the tool on every call. The tool rejects calls that don't include it. This proves the skill was loaded, and you can hard-enforce it.

The richer one is a **guidance interlock**: a token per guidance file, embedded only inside that file. The model collects the tokens of the files it read and sends them along. The tool logs them. You get an audit trail of which files were consulted — useful for routing audits, coverage analysis, and staleness checks.

Both share the same shape. The difference is how much information the token carries, and whether you enforce or just observe.

## Skill interlock: enforcing the skill was read

The simplest form: put a short random token in the skill's top-level instructions. Require it as a parameter on every use of the paired tool. Reject calls that don't include it — and, critically, return a hint in the error so the model knows to load the skill.

A skill could simply say:

```
skill_token for example_tool: sk-fa8ba2cb1c9d — pass this as the skill_token parameter on every example_tool call.
```

You can start incredibly simple: just put a little bit of randomness in the skill file, and provide your tool with the same string.

As you get fancier, you can rotate this over time, or derive the randomness from the skill contents itself, or maybe the plugin version.

To add it to an existing skill and tool:

1. Pick the skills the model should read before it calls the tool.
2. Add a token to them.
3. Add a required parameter to the tool that takes the token.
4. Update the tool instructions so the model collects and passes it.
5. In the tool, reject if the token isn't present, with a hint in the error message.

## Guidance interlock: tracking which files were read

The richer variant uses a token per guidance file, embedded in the file itself and nowhere else. The model collects them as it reads, the tool logs them, and the rest happens offline.

Each token is a triple: `task:id:version`.

- `task` is the file's slug, so a human can read the log.
- `id` is a hash of the slug. It identifies the file and stays the same when you edit it.
- `version` is a hash of the file's full content. It changes when the file changes.

The triple appears inside the file and nowhere else — not in the index the model sees first, not in the skill instructions, not in the tool's schema. The only way to supply the correct triple is to open the file.

The `id` can't be guessed by the model (and if you aren't happy with that assertion... salt it before this step) so you _know_ the file has been read.

The version detects staleness. If the model hands back an old version, it read a cached or out-of-date copy.

### What it looks like

A generated guidance file starts with a single line:

```markdown
> Interlock: `revenue-analysis:371f7e42:66ed3b54` — include in `interlock_tokens` when calling the tool.

# Revenue analysis
...
```

The skill tells the model to collect the triples from each file it reads, and pass them as one comma-separated string:

```
interlock_tokens: "revenue-analysis:371f7e42:66ed3b54,growth-projections:9be34f3e:758c250a"
```

The tool takes that string as an optional parameter, splits it into triples, and writes them to the query log alongside the rest of the call.

### What the logs let you ask

Once the triples are in the log, a handful of useful questions become easy to answer.
* **Skill triggers.** *Are we definitely seeing this skill used before the tool is called?*
* **Routing.** *For every question about ARR last quarter, did the model open the revenue guidance?*
* **Coverage.** *Which guidance files have not been touched in three months?*
* **Quality.** *Are calls that read the examples files more often correct?*
* **Staleness.** *Are calls still arriving with version `66ed3b54` a week after we shipped `9a1c43d2`?*

None of these need extra instrumentation in the model. They fall out of joining the logged triples against what is currently in the repo.

### How to build one

The interlock tokens in our guidance files contain short SHA-256 prefixes. Anything that is a stable hash will do.

```
task    = file-slug
# changes if the file is renamed
id      = sha256(file-slug)[:8]
# changes if the file is edited
version = sha256(file-contents)[:8]
```

The version covers the file's full generated content, but not the interlock line itself. The cleanest way is two-pass: assemble the file, hash it, then prepend the line.

Parsing on the tool side is trivial: split on commas, then split each part on colons.

To add the analytics pattern to an existing skill and tool:

1. Pick the skills and files the model should read before it calls the tool.
2. Add token triple computation to the build step that produces those files.
3. Embed the triple at the top of each generated file.
4. Add an optional parameter to the tool that takes a comma-separated list of tokens.
5. Update the tool instructions so the model collects and passes them.
6. Log the tokens.

The pattern is deliberately lightweight. For analytics use-cases, there's no server-side enforcement. The triples are proof-of-read for observability, not access control.

## Wrap-up

The two variants stack neatly.

Skill interlock tokens prove the model received a skill at all. They're enforced at the tool boundary, so you can hard-reject calls without them.

Guidance interlock tokens prove the model read a specific file. They're logged, not enforced, so you can answer questions about routing, coverage, quality, and staleness offline.

You can combine both: a guidance interlock token per file that _must_ be supplied.

| Mechanism          | Proves                                            | Granularity | Enforcement  |
| ------------------ | ------------------------------------------------- | ----------- | ------------ |
| Skill interlock    | The model read a skill                            | Per-skill   | Hard-reject  |
| Guidance interlock | The model read one or more guidance files         | Per-file    | Logging only |
| Both               | The model definitely read a specific set of files | Per-file    | Varies       |

If you only have time for one, the skill interlock is the stronger guarantee — it tells you the model loaded the instructions before it called the tool. If you already have that, guidance interlocks are the next useful thing to add: they answer the questions you actually have about whether the guidance is working.

## Implementing this in litprompt

[litprompt](https://github.com/tgvashworth/litprompt), my build system for prompts and skills, now does the producer side of this pattern. Point it at a skill and it stamps the interlock line into the built file and emits a JSON manifest keyed by output path.

You pick the mode per build: `analytics` (logged-only) or `enforce` (the line tells the model the call will be rejected without the token). Identity comes from the skill's frontmatter — an explicit `interlock:` slug, falling back to `name:`. The version is the content hash of the built body, computed before the line is inserted so it never hashes itself.

A minimal `litprompt.yaml`:

```yaml
interlock:
  manifest: interlocks.json
builds:
  - source: plugins/*/skills/*/SKILL.src.md
    output: SKILL.md
    interlock: enforce
```

The top-level block holds shared config (the manifest path, the tool parameter name, the wording of the stamped line). Each build opts in by setting `interlock:` to `analytics` or `enforce`.

litprompt only handles the producer side. The consuming tool — reading the token, checking it against the manifest, logging or rejecting — is yours; there's a [worked example](https://github.com/tgvashworth/litprompt/blob/main/docs/interlock-consumer.md) for that half in the repo.
