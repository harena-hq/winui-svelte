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
form that would be fine published. A rationale worth keeping is *promoted* to a
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

The engineering method in this brief governs planning, reviewing and sealing
work here. One goal per version; each unit states its Done-when, passes its
conformance gates and receives an independent review. This brief may record
an exception with its rationale.

No override is in force. This project follows this brief's engineering method.
