---
layout: post
title: "Quacks, psychics and LLMs"
summary: "I finished work at Natcap on 3rd July — more on that here. With a summer of free time ahead of me, it’s time to make some trouble…"
---

*Originally published [on Substack](https://tgvashworth.substack.com/p/quacks-psychics-and-llms).*

I finished work at Natcap on 3rd July — [more on that here](https://www.linkedin.com/posts/tgvashworth_after-nearly-three-years-todays-my-last-activity-7346543152519913473-gG5V?utm_source=share&utm_medium=member_desktop&rcm=ACoAACbCGroByXoHzYzZ_nG_AQHFOIU7-sYv_rw). With a summer of free time ahead of me, it’s time to make some trouble…

## DuckDB and DuckLake

I recently came across [DuckDB](https://duckdb.org/) and [DuckLake](https://ducklake.select/), and have gone deep on a bunch of videos from the team who work them.

By way of a quick intro, DuckDB is SQLite for analytics: column-oriented, available as a single executable with loads of client APIs. They call it an “in-process database system”.

My mental model is that DuckDB is the tool you’d reach for when you want to run analytics on broad set of file types (CSV, JSON, Parquet etc), hosted anywhere, from a reasonably powerful machine. It can even talk to other databases directly. However, because it can be embedded with your application, or brought along with your batch job, it could be used *within* a framework like Metaflow to power blob-store-backed analysis. Of particular interest to former colleagues is the [Spatial Extension](https://duckdb.org/docs/stable/core_extensions/spatial/overview.html) to DuckDB.

The limitation of DuckDB is that it’s “single-player” — meaning, you can’t give multiple clients access to a single DuckDB instance.

Another thing that came to mind for me was: [Datasette](https://datasette.io/) is a brilliant exploratory data analysis tool with [a load of use-cases](https://datasette.io/for), built around SQLite. Swap out SQLite for DuckDB underneath Datasette and you could point it at anything, and get the same features. One for .

> Update: [this might already be a thing, sort of](https://github.com/cldellow/datasette-parquet). 2 years; no updates.

### DuckLake

Not content with chucking out the old model for distributed compute and storage for analytics, the team who made DuckDB have more recently come out with [DuckLake](https://ducklake.select/), which flips the concept of the data lake on its head, doing away with the serious bloat of data catalog services and layers of metadata to simply use a metadata database over the top of Parquet in the blob store. I think this is an awesomely simple idea.

The idea seems to be response to the ecosystem of tools for analytics (Hadoop, Spark, Iceberg etc), on the basis that they have simply built on the wrong abstractions for metadata.

The basic concepts in DuckLake are:

- You continue to access data through DuckDB, optionally through your client

- You point DuckDB at an OLTP catalog (or “metadata”) database (e.g. Postgres)

- You point DuckDB at a storage location (e.g. S3)

- As you add and modify files and schema, the catalog mediates what you do (and can run transactions over the metadata)

- Ultimately, this allowing multiplayer access to storage files

- There’s a bunch of other good stuff too, like a [change feed](https://ducklake.select/docs/stable/duckdb/advanced_features/data_change_feed), [time travel](https://ducklake.select/docs/stable/duckdb/usage/time_travel) and [encryption](https://ducklake.select/docs/stable/duckdb/advanced_features/encryption) (open access data bucket anyone?)

### DuckLake as simplifier

At Natcap we evaluated a bunch of data catalog options but ultimately built something stupidly simple: a dataset → versions → folder pointer service (“metadata”) so that we could version and track our data dependencies and outputs.

The big constraint for us was to track *many* geospatial files (mostly raster, sometimes vector) alongside a fair bit of non-spatial data as inputs and outputs to the core data platform.

While I haven’t tested it, conceptually we *might* have been able to use DuckDB/DuckLake:

- Use Parquet for our platform datasets, inputs and outputs (rather than JSON/CSV/other)

- Convert geospatial vector data into the DuckDB Spatial types

- Where we need raster data, use pointers (S3 URLs)

- Use RDS Postgres for tracking metadata

- Query from the product ([browser?](https://duckdb.org/docs/stable/clients/wasm/overview)) directly into the platform with DuckDB embedded in a Python service (with some simple caching)

## DuckDB Watching List

Here’s the stuff I’ve watched on DuckDB and DuckLake…

<div class="video-embed"><iframe src="https://www.youtube-nocookie.com/embed/o53onmgnQDU" title="YouTube video" frameborder="0" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>

<div class="video-embed"><iframe src="https://www.youtube-nocookie.com/embed/zeonmOO9jm4" title="YouTube video" frameborder="0" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>

<div class="video-embed"><iframe src="https://www.youtube-nocookie.com/embed/hoyQnP8CiXE" title="YouTube video" frameborder="0" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>

# Launching Gyrinx

The other significant update this week was the launch of [Gyrinx](https://gyrinx.app), a new set of tools for the Necromunda community that my brother Louis, [Simon](https://www.secondbestguides.com/), I have been building for the past six months. We've now entered an open beta and have had a great response from the community so far.

(In case you’re interested, [a Gyrinx is a psychic cat](https://warhammer40k.fandom.com/wiki/Gyrinx)).

The application is fun for me to hack on for many reasons, but in particular because I've been able to setup an end-to-end development workflow with the [Claude Code from Anthropic](https://www.anthropic.com/claude-code). This has been a revelation, allowing me to ship features at incredible speeds without compromising too much on quality and has been an amazing learning experience.

### My buddy Claude

To learn about this brave new world of AI coding agents, I’ve gone full intravenous Claude over the last few weeks as we raced to get Gyrinx to Beta.

The DX with Claude is:

1.  Make an issue

2.  @-mention Claude in a comment, with additional instructions

3.  Wait 10-15 minutes for a notification

4.  Create a PR

5.  Get a review from Copilot — although, sadly, these generally suck

6.  Review the code — maybe goto 2

7.  Merge

If necessary, I can checkout the branch and make changes locally (again in collaboration with Claude Code) and push back.

The critical pieces of tech to make this work are:

- A Claude Max subscription

- A [tweaked Claude Code Github Action](https://github.com/grll/claude-code-action) that supports OAuth tokens

- A [Claude GitHub workflow](https://github.com/gyrinx-app/gyrinx/blob/main/.github/workflows/claude.yml) with some safety checks to ensure it’s only me who can trigger the flow

- A [secrets updater Django management command](https://github.com/gyrinx-app/gyrinx/blob/main/gyrinx/core/management/commands/update_claude_secrets.py) that keeps the GitHub action working, which I run from my laptop

- A [comprehensive CLAUDE.md file](https://github.com/gyrinx-app/gyrinx/blob/main/CLAUDE.md) and [good documentation](https://github.com/gyrinx-app/gyrinx/tree/main/docs)

On the more sociotechnical side:

- Detailed prompting, as if working with a more junior engineer

- Lots of tests and reasonably modular, simple code

- Use of boring technology: Django, Postgres, GitHub etc

The latter few are correlated with good software engineering anyway, so if you want to heavily embrace AI, you do need to make sure you invest in those areas. Documentation in the repo is particularly useful.

The coolest thing about this workflow is that it has allowed my non-technical collaborators on this project to write GitHub issues and have the feature built in double-quick time. I think for them this feels very empowering as there is such a direct link between their inputs and the speed at which the feature gets shipped.

I think what follows from this is that we're going to see a changed relationship between product managers, designers, and engineers. As for many of the more simple features and changes, the non-coding team members can simply write an issue describing what they want, waiting only for a engineer to add a sprinkling of implementation notes in the prompt.

Thinking further out: it then becomes a responsibility of the engineering team to set the codebases up in a way that *enables* features to be built by models. It's made me think a lot about new architectures for building software, for example could prompts go to an “architect” model that figures out how to get the feature built across *multiple* codebases or services. Do we need new abstractions to make this possible? That’s beyond the scope of what I've tested so far.
