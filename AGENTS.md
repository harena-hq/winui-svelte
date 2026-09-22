# winui-svelte

## Language

Artifacts — code, documents, comments, commit messages, file contents — are written in
**English**, whatever language a request arrives in.

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
enforced, 66 conformed: 253 subjects did not parse and 41 more overran 72 characters.
The drift was dateable — on 2026-09-06 one subject took the shape
`ProgressRing: <sentence>` and 82 more followed, which _looks_ like the grammar while a
parser sees a type named `ProgressRing`. **Those 294 subjects were rewritten on
2026-09-22**, every tree left byte-identical, so `C10` now reads the whole log and the
boundary it used to state is gone. The tag `pre-history-rewrite-20260922` holds the
history as it was.

**A subject with two clauses is still one intent.** A commit is one intent, and a subject
that needs "and" usually names two; yet 151 of these 412 subjects carry an `and` or a
semicolon. The rule is about the unit, not the conjunction: "the pane is one tab stop and the
rows are a ring" is one mechanism stated as the two facts that make it checkable, and
splitting it would seal a pane that tabs into nothing. Where the two halves are two units,
they are still split.

## Commit trailers

The block goes **last, with nothing after it**, and a value that wraps indents its
continuation lines by two spaces. Both are `git-interpret-trailers`' requirements rather
than house style: a continuation flush at the left margin makes git read the whole block
as prose and return no trailers at all, which is invisible until someone asks for one.
The symptom is an empty column in `git log --format='%h %(trailers:only=true)'`, and 46
of this repository's commits carried it silently, because a single-line trailer never
wraps and the only trailer most of them had was one line.

**An agent takes `Assisted-by: <agent>:<model>`, one line per agent that contributed,
and never `Co-Authored-By:` or `Signed-off-by:`.** The right-hand side names the model
and nothing else — not the harness that drove it, the service that served it, the effort
level or the context window, because a model served by one host is the same model served
by another. `Assisted-by: Claude:claude-opus-5`, not
`Assisted-by: Claude:claude-opus-5[1m]`.

**A sha in a commit message is a citation, and a rewrite has to re-point it.** 75 of
them across 46 messages, and 44 more in tracked files, were left dangling by the first
attempt at the 2026-09-22 rewrite. `git filter-repo` translates the ones in messages
itself — but before it calls `--commit-callback`, so a callback that replaces the
message undoes the translation it never saw happen.

**A trailer earns its line by recording what the diff cannot show.** The main ones:
`Reviewed:` names the evidence of an independent review, not the fact of one (older commits also
used it for gate results); `Done-when:` what had to hold for the unit to count as done;
`Lesson:` a mistake or gotcha the next change would otherwise repeat; `Directive:` and
`Rejected:` a decision taken and an alternative turned down, with why; `Not-verified:` what was
not checked.

## Engineering method

The engineering method in this brief governs planning, reviewing and sealing
work here. One goal per version; each unit states its Done-when, passes its
conformance gates and receives an independent review. This brief may record
an exception with its rationale.

One exception is in force, and it is the one recorded under **Commit subjects** above:
the rule that a subject needing "and" names two intents governs the unit, not the
conjunction, so a two-clause intent line is allowed where the clauses are two halves
of one mechanism.
