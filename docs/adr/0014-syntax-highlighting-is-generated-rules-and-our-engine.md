# 0014 — syntax highlighting is generated rules, and the engine is ours

## Context

The Gallery's sample-page frame uses ColorCode for syntax highlighting. The Gallery does
not vendor ColorCode: `standalone.props` declares `ColorCodeVersion` as `2.0.15`, and NuGet
supplies the package at build time. The palette and the XML and C# grammars are therefore
source material with an upstream version, not a set of values to copy into the Gallery
reproduction.

ColorCode also cannot be carried across as an engine. Its grammar data is portable; its
regular-expression execution model is not.

## Decision

Pin `CommunityToolkit/ColorCode-Universal` at `v2.0.15`, and generate its palette and
grammars into `data/colorcode.json`. The engine that applies them is written in this
repository in the next unit.

`ColorCode.Core/Compilation/LanguageCompiler.cs` joins every rule into one alternation
under `(?x)`, wrapping each rule as `(?-xis)(?m)(…)(?x)`. Inline option scopes are a .NET
regular-expression feature that JavaScript does not have. The local engine will instead
try rules in the source's order at each position, sticky: that is the leftmost-first-
alternative behaviour of the original alternation.

`ColorCode.Core/Parsing/LanguageParser.cs`, `GetCapturedStyles`, iterates
`regexGroup.Captures`. .NET keeps every iteration of a capture group inside a quantifier;
JavaScript keeps only the last one. The XML tag rule in
`ColorCode.Core/Compilation/Languages/Xml.cs` places twelve captures inside a
`(?:…)*`, so under JavaScript's semantics a tag with four attributes would colour one of
them. The local engine will recover repeated capture groups by rescanning the matched
span.

No rule in either grammar emits `Plain Text`. `RichTextBlockFormatter.StyleRun` styles a
run only when its scope is in the dictionary, so unscoped text takes the control's
foreground, not the palette's `Plain Text` colour. A reproduction that paints unscoped
text `#FF000000` in light is wrong, and no record gate would catch that engine mistake.

ColorCode consults no system colour. It chooses between two dictionaries of literal
`#AARRGGBB` strings on `ActualTheme`, which under a high-contrast Windows theme is still
Light or Dark. The original therefore paints a high-contrast code pane with the same
literals, and so will we. Those colours arrive as data rather than CSS, so C1 does not see
them and ADR 0005's remapping has nothing to remap. This high-contrast conclusion is
derived from the source rather than measured on the reference machine.

## Consequences

- The palette, XML rules and C# rules have a declared upstream pin, hashes and a conformance
  gate. A ColorCode re-pin changes generated data through the extractor.
- Unit 2 owns the engine. It must preserve source rule order at each position and rescan
  matched spans when repeated captures need to be recovered.
- The Gallery's six dark-theme overrides remain data next to the default dark dictionary;
  the malformed upstream values remain visible rather than being silently repaired.

## Status

Accepted. The source-derived behaviour and the generated record must be rechecked when the
ColorCode or Gallery pin moves.

## Alternatives rejected

- **Transcribe the rules by hand.** ADR 0001 and ADR 0007 reject transcription for the same
  reason: copied source stops tracking the upstream, and a grammar error is difficult to
  see in a large literal table.
- **Ship a third-party highlighter.** A different tokenizer produces different colours and
  token boundaries. The bar here is the original Gallery's pixels, not merely highlighted
  text.

## Downstream impact

- Unit 2 implements the JavaScript engine against `data/colorcode.json` and the Gallery's
  formatter behaviour.
- The sample-page frame can consume generated syntax data without adding a runtime
  dependency on ColorCode or on a third-party tokenizer.
