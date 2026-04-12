---
layout: post
title: "litprompt: a markdown preprocessor for LLM prompts"
summary: "A little tool that strips comments and resolves imports in markdown prompt files"
---

If you manage LLM prompts as files in a git repo, this is for you.

Complex prompts — system prompts, skills, agent instructions — end up as big markdown files. Increasingly, they are committed to git and deployed like software.

Prompts are carefully crafted and tuned through real-world use and evals. Like traditional software, they are often built in a particular way for historical reasons or to create a particular effect in a model.

But, unlike traditional software, they have no syntax or grammar. When you want to make notes, leave TODOs, or provide reasoning about why a section exists... where do you put that? You can use HTML comments but the model sees those, and can treat them as prompts.

And when you have several agents that contain the same prompt fragments — tone instructions, tool descriptions, safety rules — you have to copy-paste and risk drift.

So, some problems: a risk of comment-prompt confusion, wasted tokens on commentary the model doesn't need, and copy-paste entropy across files that should be identical.

You could use a template engine. But then your prompts stop being markdown: they
don't render on GitHub, they confuse editors, and they're hostile to non-engineers
who need to read them.

What if we could just stay inside markdown?

---

[litprompt](https://github.com/tgvashworth/litprompt) does two things:

**Annotated comments.** `<!-- @ ... -->` are stripped from the output. Regular HTML comments pass through. Used for author-only notes, TODOs, rationale, they are gone at build time.

**Imports.** `@[label](./path.md)` is replaced with the contents of that file. Transitive imports resolve. YAML frontmatter is stripped from imported files. Circular imports are caught.

Here's an example.

This agent `prompt.md` file describes a coding agent. Imagine it's one of many in a repository somewhere.


```markdown
---
name: Coding Assistant
model: opus-4-6
---

# Coding assistant

<!-- @
Based on Q1 user research. The "rules" framing tested better than "guidelines".
See: https://internal.example.com/research/2026-q1
-->

@[tone](./shared/tone.md)

## Rules

1. Always explain your reasoning before writing code.
2. Prefer standard library solutions over third-party dependencies.

@[safety](https://github.com/acme/prompts/blob/v1.0/safety.md)
```

The file refers to a shared `tone.md` fragment, which can be reused and synchronised across other agents.

The author has helpfully left a comment about that.

It also refers to a remote `safety.md` file, which (in this example) could be a well tested prompt that improves model alignment in coding scenarios.

To build this into a final output, we run `litprompt build prompt.md`:

```markdown
---
name: Coding Assistant
model: opus-4-6
---

# Coding assistant

Be direct and concise. Use a professional but approachable tone.

## Rules

1. Always explain your reasoning before writing code.
2. Prefer standard library solutions over third-party dependencies.

Do not execute arbitrary code or access external systems without explicit permission.
```

---

<!-- ## Remote imports and the lockfile -->

Imports can also point to other repos: `@[tone](https://github.com/org/repo/blob/ref/tone.md)`.

Remote imports require a lockfile. `litprompt lock` scans your files, fetches
each remote import via git (HTTPS with SSH fallback — ambient auth just works),
and writes `litprompt.lock`:

```yaml
version: 1
imports:
  "https://github.com/acme/prompts/blob/v1.0/safety.md":
    hash: "sha256:e3b0c44..."
```

Content is cached in `~/.cache/litprompt/` by hash. Private repos work with your
existing git auth — SSH keys, credential helpers, `GITHUB_TOKEN`.

`litprompt build` reads from cache and verifies against the lockfile. It never
hits the network. Builds are fast, deterministic, and you can't get a
supply-chain prompt injection from a changed upstream file without the hash
check failing.

---

<!-- ## Directory mode and --match -->

When you have a whole repo of prompts, you don't want to build them one at a
time. `litprompt build agents/ -o out/` recursively walks the directory and
mirrors the input structure in the output:

```sh
litprompt build agents/ -o out/
# agents/coding/prompt.md  → out/coding/prompt.md
# agents/search/prompt.md  → out/search/prompt.md
```

`--match` filters by glob if you only want to build certain files:

```sh
litprompt build agents/ -o out/ --match '**/prompt.md'
```

This is the mode for CI: build all prompts, diff against committed output, fail
if they've drifted. `litprompt check` does the same validation without producing
output — imports resolve, lockfile is current, no cycles.

---

<!-- ## How it was built -->

The initial version was built in one morning, pair-programming with Claude. We [researched](https://github.com/tgvashworth/litprompt/tree/main/research) and put together a [spec](https://github.com/tgvashworth/litprompt/blob/main/EXPLORE.md) first. This included getting Claude to [critique the idea](https://github.com/tgvashworth/litprompt/blob/main/research/critique.md) before any code.

Then we wrote 45 test cases before the first line of Go, based on the spec. I like this prompt pattern, because it makes the problem verifiable for Claude as it implements.

I then used litprompt directly in a work project and iterated from there, which was the best way to make sure it solved a real problem rather than a hypothetical one.

One minor mistake I made: because this was vibe coded, I didn't initially notice that Claude hadn't built the lockfile or remote-fetching support. It just... wasn't there. It didn't matter — I didn't need remote imports yet — but it was a good reminder to actually verify what you've got, not what you asked for.

---

<!-- ## Try it -->

Try it out:

```sh
go install github.com/tgvashworth/litprompt@latest
```

```
litprompt build prompt.md              # one file to stdout
litprompt build prompt.md -o out.md    # one file to disk
litprompt build prompts/ -o out/       # directory mode
litprompt check prompt.md              # validate without output
litprompt lock prompt.md               # fetch remote imports
```

The code is at [github.com/tgvashworth/litprompt](https://github.com/tgvashworth/litprompt).

Prompts are getting complex enough to need real tooling, but not so complex that they need a real programming language. Staying inside markdown — keeping them readable, diffable, renderable on GitHub — felt like the right trade-off.
