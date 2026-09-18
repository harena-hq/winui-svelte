# winui-svelte

## Language

Artifacts — code, documents, comments, commit messages, file contents — are written in
**English**. Conversation with the user is in **Korean**. Keep the split regardless of
which language a request arrives in.

## Private context and publishable history

Assume this repository's history will be published. Write tracked content —
code, docs, commit messages — so that opening the repository later requires no
history rewrite. The unit of exposure is the commit, not the working tree:
deleting a file in a later commit publishes it just as surely as leaving it.

Private context lives in `.private/`, untracked. Read it like any other
context, and treat it as **input only** — nothing from `.private/` reaches a
tracked file, commit message, PR, or issue unless it is first restated in a
form that would be fine published. A rationale worth keeping is _promoted_ to a
commit trailer or an ADR in publishable form, never copied across.

`.private/README.md` states what belongs there for this project.

**Run this once per clone**, before the first commit from it:

```sh
git config core.hooksPath .githooks
```

`.gitignore` stops an accidental `git add .`; the tracked `.githooks/pre-commit` is the layer
that survives `git add -f`. That hook only runs if `core.hooksPath` points at it, and git
does not carry local config across a clone — so a fresh clone starts with the guard off,
silently, on a machine where everything else looks configured.

## Commit subjects

```
<type>(<scope>): <intent line — why, not what>
```

[Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) is the
grammar. Two things it leaves open are settled here: the type is one of `feat`, `fix`,
`docs`, `refactor`, `chore`, `build`, `test` — `ci` and `perf` are absent because nothing
here configures CI and no commit has yet been about performance, and one is adopted when
its referent exists — and **scope is required**, lower-case, matching `[a-z][a-z0-9-]*`.
Keep the subject to 72 characters and leave line two blank. Nothing is exempt: a merge is
skipped because it has two parents, not because its subject begins `Merge `, and a
`git revert` lands with the subject git wrote and then owes one of its own.

`scripts/commit/subject.mjs` is the rule. `.githooks/commit-msg` applies it to the
message being written and `C10` applies it to the commits already sealed. **`C10` is the
layer that answers.** The hook is reachable only through `core.hooksPath`, which git
does not carry across a clone, and `--no-verify` passes it where it is configured; and
it reads the file before git's cleanup, so it cannot know what git will store — the mode
depends on `commit.cleanup` and, unset, on whether the message is edited, which no hook
is told. So the hook resolves every ambiguity toward accepting: it cleans the message up
with `git stripspace` in the most aggressive mode it can justify, and under
`commit.cleanup=scissors` it accepts the message either whole or truncated at the
scissors, whichever passes. The reasoning is that cleaning up more than git will can
only let something through for `C10` to catch, while refusing what git would have kept
blocks a legitimate commit and nothing catches that.

Where the two differ, they differ in that one direction. The hook also tolerates work in
flight — a `fixup!`, and the subject `git merge` or `git revert` composed, so neither
aborts mid-operation — and `C10` refuses all of them, because a `fixup!` that reached the
history is a rebase that never happened.

This section exists because the grammar was stated only in a skill this repository does
not carry, and nothing read a subject line. Of the 360 commits before the rule was
enforced, 66 conform: 253 subjects do not parse and 41 more overrun 72 characters. The
drift is dateable — on 2026-09-06 one subject took the shape `ProgressRing: <sentence>`
and 82 more followed, which _looks_ like the grammar while a parser sees a type named
`ProgressRing`. Those commits are rewritten in their own unit; `C10` states the boundary
in one line rather than passing quietly over them.

## Engineering method

Load the `engineering:principles` skill before planning, reviewing, or sealing
work here. When one agent authors and a different one reviews, load
`engineering:pair-workflow` with it, and invoke them by name. These skills are
not distributed with this repository and are not publicly available. If they
are unavailable, the rules in this brief still stand on their own. This brief
may override either, with the exception and its rationale recorded here.

No override is in force. This project follows `engineering:principles` as written.
