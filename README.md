# tgvashworth.github.io

My personal website, built with Jekyll and hosted on GitHub Pages.

## Description

This repository contains the source code for my personal website at [tgvashworth.com](https://tgvashworth.com). The site is built using Jekyll, a static site generator, and is hosted on GitHub Pages.

## Setup

[mise](https://mise.jdx.dev/) manages Ruby and Node versions. Install it first, then:

```bash
git clone https://github.com/tgvashworth/tgvashworth.github.io.git
cd tgvashworth.github.io
mise install
bundle install
npm install
```

## Run Locally

```bash
bundle exec jekyll serve
```

The site will be available at http://localhost:4000. Changes hot-reload, except for `_config.yml` which requires restarting the server.

## Write in the browser

```bash
npm run editor
```

Open http://127.0.0.1:4001/editor. This local server includes the site preview, so
you do not need a separate `jekyll serve` process. Leave it running while you
write. To choose another port, run `EDITOR_PORT=4011 npm run editor`.

- Browse and search posts, or start a new draft.
- Write Markdown beside a live preview using the site's Jekyll renderer and layouts.
- The Markdown pane uses CodeMirror, with syntax highlighting, undo/redo, search,
  indentation, and automatic continuation of bullet, numbered and task lists.
  Enter on an empty list item ends the list. Cmd/Ctrl B, I and K insert bold,
  italic and link markup.
- Choose Focus to write, Split to see Markdown and the site together, or Preview
  to see just the rendered site. Press Cmd/Ctrl S to save.
- Browser spell check is enabled on the writing fields. Enable spell check in
  your browser if you do not see spelling suggestions. Check writing adds
  `write-good` suggestions for repeated words, wordy phrases and other prose
  slips. These are suggestions, not a grammar guarantee.
- Save file creates `_drafts/slug.md` for new posts and updates the original file for
  existing posts. Title and summary are regular fields; other YAML metadata is
  available under File & front matter and is preserved unless you edit it.
- Select Small note to show the full post on the homepage, with the date above
  a compact linked title. Notes keep their own post page and appear in RSS.
- Every edit is saved automatically in this browser's local storage. Refreshing
  restores the current draft, including its title and metadata. Multiple browser
  drafts stay in the post list, labelled Browser draft. This works before a file
  exists. Saving to a file removes its browser draft copy.
- Edits to existing files also have browser recovery copies. Matching file
  revisions restore automatically; if the file changed elsewhere, you can choose
  to restore the browser copy. Revision checks prevent it from overwriting newer
  file contents. Browser copies belong to this browser and local server address;
  clearing browser storage removes them. If storage is unavailable, the status
  reports it and leaving the page prompts you to save to a file.
- The local site's pages have Write a post or Edit this post links. These links
  are added by the local server and never appear in the deployed site.

Ship opens a review dialog, builds with Jekyll, commits only the selected post,
and pushes to `origin/main`. It requires a checkout on `main`, an empty staging
area, and a HEAD matching the remote main branch. It does not merge, force push,
or include other unpushed commits. Unrelated unstaged file changes stay local.
Drafts move to a dated `_posts` filename when shipped. If a push fails after the
commit, reopen the new post and retry Ship without changing it; the server can
retry that commit's push. No GitHub token is needed: Git uses your existing
authentication.

The editor is a local development tool bound to `127.0.0.1`. It is kept in
`_editor/`, which Jekyll excludes from the public build. Its generated preview
and publish-retry state live in ignored `.jekyll-editor/`. Preview HTML is
sandboxed; scripts in a post do not run in the editing pane. Local site pages
block third-party scripts, including analytics. AI feedback, image uploading,
and installation as a login service are not included in this first version.

Verify the editor with `npm run test:editor`. Tests use disposable sites and
local bare Git repositories, including successful publishing, build/commit/push
failures, conflict detection and path restrictions. Browser tests also check
draft persistence and CodeMirror's Markdown list commands.

## Small notes

Posts marked `note: true` appear in full among the other homepage entries, in
date order. Use the editor's Small note checkbox, or add the field directly:

```yaml
---
layout: post
title: "A small observation"
note: true
---
```

Write the note's Markdown body below the front matter. A title is still required;
it appears smaller on both the homepage and the note's own page. Other posts
keep their title and optional summary on the homepage.

## Deploying

Push to `main`. GitHub Pages builds and deploys automatically.

## Project Structure

- `_posts/`: Contains blog posts in Markdown format
- `_layouts/`: HTML templates for different page types
- `_includes/`: Reusable HTML components
- `_sass/`: SCSS stylesheets
- `assets/`: Static files like images, CSS, and JavaScript
- `_config.yml`: Configuration file for Jekyll
- `index.html`: Homepage content

## Additional Resources

- [Jekyll Documentation](https://jekyllrb.com/docs/)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)

## License

Code in this project is licensed under the MIT License.

Content is copyright Tom Ashworth.
