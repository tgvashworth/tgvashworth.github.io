# tgvashworth.github.io

My personal website, built with Jekyll and hosted on GitHub Pages.

## Description

This repository contains the source code for my personal website at [tgvashworth.com](https://tgvashworth.com). The site is built using Jekyll, a static site generator, and is hosted on GitHub Pages.

## Setup Instructions

To run this site locally, follow these instructions:

### Prerequisites

You'll need to have the following installed:

- [Ruby](https://www.ruby-lang.org/en/downloads/) (version 2.5.0 or higher)
- [RubyGems](https://rubygems.org/pages/download)
- [Git](https://git-scm.com/downloads)

### Clone the Repository

```bash
git clone https://github.com/tgvashworth/tgvashworth.github.io.git
cd tgvashworth.github.io
```

### Install Dependencies

Once you've cloned the repository, install the required dependencies:

```bash
gem install bundler
bundle install
```

If you run into any Ruby errors during installation, you might need to use a package manager like RVM or Homebrew to manage your Ruby installation.

### Run Locally

To run the site locally:

```bash
bundle exec jekyll serve
```

This will make the site available at http://localhost:4000. The site will automatically update when you make changes to the source files (except for changes to `_config.yml`, which require restarting the server).

If you encounter a LoadError related to webrick (common in Ruby 3.0+), run:

```bash
bundle add webrick
bundle exec jekyll serve
```

### Deploying Changes

To deploy changes to the live site, just push to the repo. GitHub Pages will automatically build and deploy your site

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
