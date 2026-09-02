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

## Engineering method

Load the `engineering:principles` skill before planning, reviewing, or sealing
work here. When one agent authors and a different one reviews, load
`engineering:pair-workflow` with it, and invoke them by name. These skills are
not distributed with this repository and are not publicly available. If they
are unavailable, the rules in this brief still stand on their own. This brief
may override either, with the exception and its rationale recorded here.

No override is in force. This project follows `engineering:principles` as written.
