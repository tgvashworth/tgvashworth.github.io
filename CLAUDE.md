# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Personal blog for tgvashworth.com. Jekyll static site hosted on GitHub Pages. Pushing to `main` deploys automatically.

## Setup

Tooling is managed by [mise](https://mise.jdx.dev/). Ruby and Node versions are pinned in `.mise.toml`.

```
mise install          # install Ruby + Node
bundle install        # install gems (Jekyll via github-pages)
npm install           # install Node devDependencies (write-good, jkl)
```

## Commands

- **Serve locally:** `bundle exec jekyll serve` (available at http://localhost:4000)
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
