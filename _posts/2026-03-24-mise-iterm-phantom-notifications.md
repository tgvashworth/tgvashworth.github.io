---
layout: post
title: "Phantom notifications from mise in iTerm"
---

If you use [mise](https://mise.jdx.dev/) and iTerm2, you might find yourself getting mysterious macOS notifications every time you `cd`. No message, no useful content — just a phantom alert. Here's what's going on and how to fix it.

## The problem

iTerm has a setting called "Send escape sequence-generated alerts" (under Profiles → Terminal). When enabled, it watches for OSC (Operating System Command) escape sequences and turns them into macOS notifications.

If you have mise activated in your shell:

```zsh
eval "$(mise activate zsh)"
```

...then every time you change directory, a notification fires.

## Where it comes from

When you `cd`, mise's shell hook runs `mise hook-env` to update your environment — activating or deactivating tool versions for the current directory. This is the core of how mise works and is working as intended.

The problem is mise's `terminal_progress` setting, which defaults to `true`. This makes mise emit OSC escape sequences to report progress to the terminal during hook-env. You'd never normally see them, but iTerm's alert setting picks them up and surfaces them as notifications.

## The fix

Disable `terminal_progress` in your mise config (`~/.config/mise/config.toml`):

```toml
[settings]
terminal_progress = false
```

Open a new shell and the phantom notifications should stop.
