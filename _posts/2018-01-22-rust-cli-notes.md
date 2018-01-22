---
title: "Notes on building CLI applications in Rust"
layout: post
---

My team maintains a number of increasingly complex CLI tools, mostly written in Bash, though some is Scala in order to share code with other applications.

We’re looking at migrating these to a more testable, modern language.

Python is the de-facto language for this at Twitter, but I also wanted to explore how Rust would fit the bill. These are my notes.

## Requirements
What are we already doing with Bash?

* Figure out git root
* Parse args & print help
* _Computed_ default values for arguments
* Shell out to other executables (including jars, `pants` and other CLI tools) and pipe their output to files
* Handle errors in sub-processes
* Log to `stderr`
* Error messages
* `pwd`
* `pushd/popd`
* Manipulate paths
* URL encode
* Read from `stdin`
* Open URLs (shell out to `open`)
* Proxy args onto other tools
* `cp`
* `mkdir -p`
* `command -v`
* `arc`
* GET/POST URLs (compressed)
* `jq` or JSON parse
* `sleep`
* `git` — has to be CLI to use `source_git` (Twitter’s `git`)
* Subcommands

## Crates
These crates might be useful:

* Arg-parser — [clap](https://crates.io/crates/clap)
* Serde — [serde](https://github.com/serde-rs/serde)
* [vitiral/path_abs: Absolute serializable path types and associated methods.](https://github.com/vitiral/path_abs)
* [killercup/assert_cli: Test CLI Applications in Rust.](https://github.com/killercup/assert_cli)
* [vitiral/termstyle: create and test the style and formatting of text in your terminal applications](https://github.com/vitiral/termstyle)
* [colin-kiegel/rust-pretty-assertions: Overwrite `assert_eq!` with a drop-in replacement, adding a colorful diff.](https://github.com/colin-kiegel/rust-pretty-assertions)
* [brson/stdx: The missing batteries of Rust](https://github.com/brson/stdx)
* [vitiral/stdcli: (pre-alpha) rust meta library for cli applications](https://github.com/vitiral/stdcli), which contains the following (and more)…
	* [dtolnay/indoc: Indented document literals for Rust](https://github.com/dtolnay/indoc)
	* [mitsuhiko/console: A rust console and terminal abstraction](https://github.com/mitsuhiko/console)
	* [mitsuhiko/dialoguer: Rust utility library for nice command line prompts and similar things](https://github.com/mitsuhiko/dialoguer)
	* [mitsuhiko/indicatif: A command line progress reporting library for Rust](https://github.com/mitsuhiko/indicatif)
* [Stebalien/tempfile: Temporary file library for rust](https://github.com/Stebalien/tempfile)
* [daboross/fern: Simple, efficient logging for Rust](https://github.com/daboross/fern)

I got lots of this from [@vitiral](https://twitter.com/vitiral)’s great [Rust2018 And The Great Cli Awakening](http://vitiral.github.io/2018/01/17/rust2018-and-the-great-cli-awakening.html) post.
