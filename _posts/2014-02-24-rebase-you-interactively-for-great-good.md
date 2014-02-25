---
layout: post
title: Rebase you interactively for great good
---

I [tweeted today](https://twitter.com/phuunet/status/437997631315656704) about using interactive rebase to clean up a set of commits, so here's a wee bit on how to do it. The repo for this is [on GitHub](https://github.com/phuu/example-interactive-rebase).

Before we get stuck in, remember one thing: if others are working on the code, and you've already pushed, *don't do this*. Your friends will desert you and everyone you ever loved will pour scorn and derision upon you for evermore. Or something.

So what's the situation, batman? Let's say this is our git log:

```
* 054efe0 - (5 seconds ago) Rename c.txt to b.txt. — Tom Ashworth (HEAD, master)
* d6825e6 - (30 seconds ago) Another new file — Tom Ashworth
* fa72063 - (2 minutes ago) Add new fyle. — Tom Ashworth
* 5c37a89 - (5 minutes ago) Update the text a bit. — Tom Ashworth
* 72ea787 - (10 minutes ago) Initial commit. — Tom Ashworth
```

We've been moving pretty fast, creating files and editing as we went. Looking through our commits, we realise we've made changes that really should be consolidated before we push, lest we incur the wrath of our colleagues.

Here's an example where the commit message we added a file, but actually we've updated some text too:

```diff
commit fa72063c0a9d350e62256b1527e2a33b77c54534
Author: Tom Ashworth <tgvashworth@gmail.com>
Date:   Mon Feb 24 22:03:34 2014 +0000

    Add new file.

diff --git a/a.txt b/a.txt
index 7555178..2475e79 100644
--- a/a.txt
+++ b/a.txt
@@ -1,2 +1,2 @@
 Hi!
-Hello, world.
+Hello, world. Sup.
diff --git a/b.txt b/b.txt
new file mode 100644
index 0000000..cc40f85
--- /dev/null
+++ b/b.txt
@@ -0,0 +1 @@
+Some more text here!
```

Not so good. There's also a spelling mistake in one of the commits, and some have punctuation where others don't. Awful. So what's to be done? An *interactive rebase*, of course!

An interactive rebase lets you pick a set of commits, rewind backwards through time and, one-by-one, redo (*reapply*) the commits, making changes when you need to.

So how do you do an interactive rebase?

First, `checkout` the most recent commit you want to change. For us, we're already there, but you might do:

```bash
$ git checkout <commit>
```

Then, pick the commit *before* the first commit you want to change, and use:

```bash
$ git rebase -i <commit-before-first>
```

For us, that's `72ea787`:

```bash
$ git rebase -i 72ea787
```

This will open up a `git-rebase-todo` file in your editor. Ours looks like this:

```
pick 5c37a89 Update the text a bit.
pick fa72063 Add new fyle.
pick d6825e6 Another new file
pick 054efe0 Rename c.txt to b.txt.

# Rebase 72ea787..054efe0 onto 72ea787
#
# Commands:
#  p, pick = use commit
#  r, reword = use commit, but edit the commit message
#  e, edit = use commit, but stop for amending
#  s, squash = use commit, but meld into previous commit
#  f, fixup = like "squash", but discard this commit's log message
#  x, exec = run command (the rest of the line) using shell
#
# These lines can be re-ordered; they are executed from top to bottom.
#
# If you remove a line here THAT COMMIT WILL BE LOST.
#
# However, if you remove everything, the rebase will be aborted.
#
# Note that empty commits are commented out
```

The list at the top is the list of commits that will be undone and reapplied, starting at the top. We can do a number of things to these commits: keep them as is (`pick`); change the commit message (`reword`); modify the code (`edit`); merge two or more commits together (`squash` or `fixup`) or run a command against the commit.

To do any of these things, we change the word at the start of the line. By default, git just reuses (*picks*) the commit and reapplies it.

Git helpfully gives us this list of available commands. We're only going to use `edit` (or `e`), because it lets your make any changes you like.

We're going to step through all of our commits to make sure they're ok, so we change every `pick`  to `edit`:

```
edit 5c37a89 Update the text a bit.
edit fa72063 Add new file.
edit d6825e6 Another new file
edit 054efe0 Rename c.txt to b.txt.
```

Save and close this file. Git will read it and follow the instructions, beginning the rebase by applying the changes made in the first commit, `5c37a89`:

```
Stopped at 5c37a89... Update the text a bit.
You can amend the commit now, with

    git commit --amend

Once you are satisfied with your changes, run

    git rebase --continue
```

So what does this commit contain? `git show` will tell us:

```diff
commit 5c37a89d19dfefa44cb90e7cccc09dc0b1197969
Author: Tom Ashworth <tgvashworth@gmail.com>
Date:   Mon Feb 24 22:02:58 2014 +0000

    Update the text a bit.

diff --git a/a.txt b/a.txt
index 663adb0..7555178 100644
--- a/a.txt
+++ b/a.txt
@@ -1 +1,2 @@
 Hi!
+Hello, world.
```

Looks ok, but on inspecting the next commit (`git show fa72063`) we can see that text in `a.txt` changed. It'd be nice to have that all in one commit, so let's grab `fa72063`'s version of `a.txt`.

```bash
$ git checkout fa72063 a.txt
```

We can then amend the commit to add update the text:

```bash
$ git commit --amend
```

While we're at it, let's remove the punctuation from the commit message. So now the commit looks like:

```diff
commit 132efd0fce75dcf10326772ee9cb9b0e8c8b053b
Author: Tom Ashworth <tgvashworth@gmail.com.com>
Date:   Mon Feb 24 22:02:58 2014 +0000

    Update the text a bit

diff --git a/a.txt b/a.txt
index 663adb0..2475e79 100644
--- a/a.txt
+++ b/a.txt
@@ -1 +1,2 @@
 Hi!
+Hello, world. Sup.
```

That means we're ready to go on to the next commit...

```bash
$ git rebase --continue
```

This moves us on to `fa72063`:

```
Stopped at fa72063... Add new file.
You can amend the commit now, with

    git commit --amend

Once you are satisfied with your changes, run

    git rebase --continue
```

A quick `git show` indicates that this commit is pretty OK. The changes to `a.txt` are gone – they're now in the previous commit.

```diff
commit a9149ec17ba6d26f4191b6a734fbe62a3caf41d5
Author: Tom Ashworth <tgvashworth@gmail.com.com>
Date:   Mon Feb 24 22:03:34 2014 +0000

    Add new file.

diff --git a/b.txt b/b.txt
new file mode 100644
index 0000000..cc40f85
--- /dev/null
+++ b/b.txt
@@ -0,0 +1 @@
+Some more text here!
```

A quick update to the commit message using `git commit --amend` again and we're off to the next commit with another `git rebase --continue`. This commit is fine (`git show`):

```diff
commit 082527d817b6fd327f8109de14b32c06c5d49c4c
Author: Tom Ashworth <tgvashworth@gmail.com.com>
Date:   Mon Feb 24 22:05:46 2014 +0000

    Another new file

diff --git a/c.txt b/c.txt
new file mode 100644
index 0000000..527b900
--- /dev/null
+++ b/c.txt
@@ -0,0 +1 @@
+Even more new text!
```

So let's skip it, with `git rebase --skip`. This just moves us on to the next commit without making changes...

This last commit isn't so great:

```diff
commit 285e372acef67f062de16768866e96d815b13c07
Author: Tom Ashworth <tgvashworth@gmail.com.com>
Date:   Mon Feb 24 22:07:32 2014 +0000

    Rename c.txt to b.txt.

diff --git a/b.txt b/b.txt
index cc40f85..4fd475b 100644
--- a/b.txt
+++ b/b.txt
@@ -1 +1 @@
-Some more text here!
+Some more text here! Yay!
diff --git a/c.txt b/c.txt
deleted file mode 100644
index 527b900..0000000
--- a/c.txt
+++ /dev/null
@@ -1 +0,0 @@
-Even more new text!
diff --git a/d.txt b/d.txt
new file mode 100644
index 0000000..527b900
--- /dev/null
+++ b/d.txt
@@ -0,0 +1 @@
+Even more new text!
```

We've added renamed a file, changed the text in `b.txt` and there's a mistake in the commit message! Oh dear. Let's split it into two commits: one renaming and one modifying `b.txt`.

Let's undo the changes in this commit using `git reset`:

```bash
$ git reset HEAD^
Unstaged changes after reset:
M   b.txt
D   c.txt
```

The changes from this commit are now in our working directory but not staged or committed, and we are free to make as many commits as we like – just like a normal git workflow.

So we'll re-add the changes to `c.txt` and `d.txt`. Git knows `c.txt` has been deleted, so we have to use `--all` to make sure the removal is staged:

```bash
$ git add --all c.txt d.txt
```

Checking the status of our working directory and index (with `git status`) shows what's going on:

```
# rebase in progress; onto 72ea787
# You are currently splitting a commit while rebasing branch 'master' on '72ea787'.
#   (Once your working directory is clean, run "git rebase --continue")
#
# Changes to be committed:
#   (use "git reset HEAD <file>..." to unstage)
#
#   renamed:    c.txt -> d.txt
#
# Changes not staged for commit:
#   (use "git add <file>..." to update what will be committed)
#   (use "git checkout -- <file>..." to discard changes in working directory)
#
#   modified:   b.txt
#
```

Git figures out the files have been renamed, so we can now just commit with a better message:

```bash
$ git commit --message="Rename c.txt to d.txt"
```

We can now add and commit the changes to `b.txt` in another commit:

```bash
$ git add b.txt
$ git commit --message="Update b.txt"
```

A graph `git log` shows us what's going on (`git log --graph --all --oneline --decorate`):

```
* c871cae (HEAD) Update b.txt
* e0dde52 Rename c.txt to d.txt
* 082527d Another new file
* 847e8d2 Add b.txt
* 132efd0 Update the text a bit
| * 054efe0 (master) Rename c.txt to b.txt.
| * d6825e6 Another new file
| * fa72063 Add new file.
| * 5c37a89 Update the text a bit.
|/
* 72ea787 Initial commit.
```

`HEAD` is where we're at – we have the same *base* commit as `master` – `72ea787` – but after that, history has been rewritten.

We finish off the rebase with `--continue` again:

```bash
$ git rebase --continue
Successfully rebased and updated refs/heads/master.
```

Running that `git log` command again shows us that we now have a nice and clean git history, ready for pushing:

```
* c871cae (HEAD, master) Update b.txt
* e0dde52 Rename c.txt to d.txt
* 082527d Another new file
* 847e8d2 Add b.txt
* 132efd0 Update the text a bi
* 72ea787 Initial commit.
```

Woopee!

For more on rebasing – it's really, really useful – checkout the [git-scm docs](http://git-scm.com/docs/git-rebase).

This technique is particularly good when used repeatedly to iterate over a set of commits, improving and cleaning them up further as you go. In addition to editing, with rebase you can reorder and meld commits together to produce a clean, clear and readable git log that *will* help you and your team in the future.