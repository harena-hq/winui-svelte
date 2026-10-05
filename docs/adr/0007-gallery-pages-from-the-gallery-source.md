# ADR 0007 — the Gallery reproduction is read from the Gallery's own source, pinned

Status: accepted
Date: 2026-09-03

## Context

The project's bar is that a side-by-side against the WinUI 3 Gallery on Windows 11 reads as
the same application. That makes "what does the original put on this page" a question every
version from v1 onwards has to answer, repeatedly, for 19 groups and something over a hundred
pages.

There are three places the answer can come from.

**From the running app.** Screenshots of the Gallery on the reference guest. This is the only
source that shows what the thing actually looks like, and it stays the arbiter — D5 already
says visual truth is a human comparison. But a screenshot does not tell you that a page has
132 tiles rather than 128, or which brush the fourth one names, and reading those off pixels
is transcription with no way to check itself.

**From memory or the docs site.** Both drift, neither is versioned against the app being
compared, and a wrong detail here is invisible: the page renders, it just is not the page.

**From `microsoft/WinUI-Gallery`.** The app's own source, MIT, and the exact artifact
installed on the reference guest.

Measuring the five Design pages against that source is what caught, before any of them was
written, that four of the five sit inside a control from a later version, and that ten of the
107 brushes their tables name were absent from the token layer. Neither would have been found
by looking at the pages.

## Decision

**The Gallery reproduction's page structure and page data are read from
`microsoft/WinUI-Gallery`, pinned to a commit, checked out under `.upstream/WinUI-Gallery`,
and never guessed.**

- The pin is `scripts/gallery/fetch.mjs`, in the same shape as the token pin: the SHA is
  written once, every consumer imports it, and importing the module reaches no network.
- The checkout is sparse to `WinUIGallery/` — the app, not the repository's build tooling.
- Where a page's content is a table, it is **extracted** into a tracked record file and
  rendered from it, rather than transcribed into markup. The reason is the same one that put
  the token values behind an extractor: 132 tiles times six attributes is roughly eight
  hundred values, and a transcription error in any of them produces a page that looks right.
- The pin is separate from the token pin. The two repositories answer different questions and
  move independently; one pin would make a token re-pin also a page re-pin, and each would be
  approved on evidence about the other.

**What is not taken from the source:** its assets. The Gallery ships annotated PNGs on the
Geometry, Typography and Spacing pages. Reproducing those is drawing, not extraction, and
copying them is a redistribution decision this project has otherwise avoided — ADR 0003 keeps
the fonts out for the same kind of reason, and the licences differ but the habit is worth
keeping. Where a page's illustration is an image, v1 renders the page without it and the plan
says so.

**Amended 2026-10-05: the sample media are taken, and say so.** Later versions did copy
assets: the photographs, videos and small images from the Gallery's `Assets/SampleMedia` that
the reproduced pages show as sample content are in `apps/gallery/static/` — byte for byte, or
re-encoded from WMV to H.264 for the two videos (D44). They come from the Gallery's
repository, which is MIT licensed, and `NOTICE.md` lists them. The line this paragraph drew
was a habit rather than a licence condition, and it held for the annotated design images
only. One sample image is withheld for its licence rather than for being unused: the
Gallery's map screenshot carries third-party map data under its own attribution, which the
Gallery's licence does not extend to.

**The line between extraction and transcription is the component shape.** A page's content
is extracted where the source declares a repeated component with named attributes — `ColorTile`
on the Color page, `TypographyControl` on the Typography page, the icon rows already
serialised as JSON on the Iconography page. A reader for those is mechanical, and the values
it recovers can be checked against the source one-for-one. The Geometry (3 rows) and Spacing
(7 rows) pages are ad-hoc `Grid`s with positional children and no shared component: a reader
for them would be a parser for one page's layout, which is the coupling the Consequences
below names as the cost. Measured against the colour page's 130 tiles and 9 type-ramp rows,
those 10 rows do not justify the brittleness, and the unit that renders them transcribes
them with a citation instead. This applies per-page: a future page that picks up a repeated
component earns extraction; one that stays positional stays transcribed.

## Consequences

- A fidelity claim about a page is checkable: the record file names the commit it was read
  from, and re-running the extractor either reproduces it or does not.
- Upstream changing a page is a visible diff in a tracked file rather than a slow divergence
  nobody notices.
- Two upstream checkouts to keep, roughly 36 MB for this one, both ignored by git.
- The extractor is coupled to the source's XAML shape. That is a real cost: a page rewritten
  upstream can break extraction. It fails loudly — the reader in `scripts/tokens/xaml.mjs`
  throws with a line number rather than returning a partial tree — which is the property that
  makes the coupling affordable.

## Rejected

**Transcribing the page tables into Svelte by hand.** It is what a port normally does, and for
a page with six rows it would be right. At 132 tiles it is eight hundred values with no
mechanism that can tell a typo from a decision, on the one page this version is judged by.

**One upstream pin covering both repositories.** Cheaper to write and wrong at the first
re-pin: the two move for unrelated reasons and each re-pin would carry the other's diff.
