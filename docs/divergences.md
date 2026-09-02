# Accepted divergences from WinUI behaviour

Visual fidelity is this project's bar. Behavioural fidelity is not — where reproducing a
WinUI interaction would mean fighting a primitive's own model, the divergence is accepted.

**Accepted, not silent.** Every entry here has an id, and every site that departs cites that
id in a code comment:

```svelte
<!-- WD-001: arrow keys skip the close button; see docs/divergences.md -->
```

Conformance gate C5 fails if a cited id has no entry, or if an entry is cited nowhere. The
second direction matters as much as the first: an entry nothing cites is a divergence that was
fixed, or one that was never real, and either way the registry is lying.

An entry records what WinUI does, what we do, why the gap was accepted, and what would make it
worth closing. "Would be hard" is not a reason — the reason is always a specific mechanism.

## Format

### WD-NNN — <short title>

- **Control**:
- **WinUI does**:
- **We do**:
- **Why accepted**:
- **Would reconsider if**:

---

_No entries yet. The first is expected to be TabView's arrow-key traversal. Every surveyed
primitive library — bits-ui, Zag and therefore Ark, and Melt — builds its roving-focus
candidate set by querying for a role or data attribute, which cannot match a close button
nested inside a tab trigger. So the button is reachable by Tab and not by arrow keys, and that
is a property of the standard roving-tabindex pattern rather than of any one library.
Recorded here once the control is built and the behaviour is observed rather than predicted._
