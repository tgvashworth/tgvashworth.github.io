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
