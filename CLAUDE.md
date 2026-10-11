# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Personal blog for tgvashworth.com. Jekyll static site hosted on GitHub Pages. Pushing to `main` deploys automatically.

## Setup

Tooling is managed by [mise](https://mise.jdx.dev/). Ruby and Node versions and tasks are defined in `mise.toml`.

```
mise install          # install Ruby + Node
mise run setup        # install gems and Node dependencies
```

## Commands

- **List tasks:** `mise tasks`
- **Build:** `mise run build`
- **Serve locally:** `mise run serve` (available at http://localhost:4000)
- **Serve drafts:** `mise run serve:drafts`
- **Writing editor:** `mise run editor` (http://127.0.0.1:4001/editor; set `EDITOR_PORT` to change the port)
- **Tests:** `mise run test` (or `test:editor:browser` / `test:editor:ruby` separately)
- **Build and test:** `mise run check`
- **Clean generated site:** `mise run clean`
- Tasks install missing dependencies; existing npm scripts delegate to mise.
- **Note:** Changes to `_config.yml` require restarting the server. All other changes hot-reload.

## Blog post format

Posts go in `_posts/` with filename format `YYYY-MM-DD-slug.md`. Frontmatter:

```yaml
---
layout: post
title: "Post Title"
summary: Optional one-line summary shown on homepage and in Twitter card meta.
---
```

The `summary` field is optional but used for the homepage listing and Twitter/social meta tags.

## Architecture

- Two layouts: `default.html` (base, includes header/footer/analytics) and `post.html` (extends default, adds title and date)
- Styling: Bootstrap 4 via CDN + custom CSS in `css/main.css` and `css/syntax.css` (for code highlighting)
- RSS feed: `atom.xml`
- Custom domain configured via `CNAME` (tgvashworth.com)
- `github-pages` gem handles all Jekyll plugin dependencies
