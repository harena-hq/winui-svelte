# 0020 — A component's own text is a table, keyed by upstream's names

## Context

A component writes some text of its own: the name and tooltip of a close button, the On and Off
beside a switch, a clear button's name. Upstream reads each from a resource table that Windows
localizes, so a WinUI app gets them in the system's language with nothing written. This package
wrote them as English literals, with no way to change most of them.

A consumer's trial of `0.1.0-rc.1`, in a product that ships in more than one language, found the
cost: it left InfoBar unplaced, because a close button named "Close" could not ship there. That is
a departure from the original, not a missing feature, as the original is never English-only.

The pins hold the keys and the English. Each control's `Strings/en-us/Resources.resw` has its own
(`InfoBarCloseButtonName`), and the core names its ids where it asks for them
(`GetLocalizedResourceString(TEXT_TOGGLESWITCH_ON, …)`, ToggleSwitch_Partial.cpp:311). No pin holds
another language, and none holds the value of a core id.

## Decision

**`strings.ts` holds one flat table, `defaultStrings`, keyed by upstream's name.** A reader can look
a key up in upstream, and it needs no vocabulary of its own. Where a `.resw` has the key, the value
is that file's English. Where only a core id exists, the value is the English this package wrote
already, which no pin can check. A part with no upstream name takes a `WinUISvelte` key.

**`provideStrings(table)` sets it for a subtree, as Svelte context.** It takes a partial table or a
function returning one. A function is read each time a component draws the text, so one that reads
`$state` switches a language in place. A key left out falls to an enclosing provider and then to the
default, so a consumer translates what it ships and no more. Context survives a portal, so a popup
hears the provider of the component that opened it. The package ships English alone, as it has no
other language to take from a pin.

**A prop still wins where a control has one.** `onContent`, `placeholderText` and the like are
WinUI's members, and the table is only what stands in when they are unset, as upstream's resource
does.

**`C21` refuses a literal coming back,** in the shapes it can read, which its own comment lists.

Adopting upstream's values changed these names, each toward the original: TabView's close button
is "Close Tab" where it was "Close"; NavigationView's toggle is "Open Navigation" and "Close
Navigation", with a capital where they had a lower-case n; NumberBox's spin buttons are "Increase"
and "Decrease" where Zag, which overrode the literals this package wrote, named them "increment
value" and "decrease value"; BreadcrumbBar's ellipsis is "More" where it read "More breadcrumb items".
`MenuBarItem`'s `title` defaults to nothing, as `Title` does upstream, where it drew "Item".

A format with arguments is upstream's own, `%1!s!`, filled by `formatString`, so a translation can
reorder them. `PersonPicture` asks for its eight plural keys by upstream's rungs, as they are what a
language with more plural forms fills.

## Status

Accepted, 2026-10-31. It covers the release and `preview`. Three things are left out.
`MediaTransportControls` writes its failed-playback messages in script. Zag writes `numberfield` as
the `aria-roledescription` of NumberBox's input, which the table cannot reach. And
`MediaTransportControls`' repeat button names itself "Repeat" in all three of its states, under a
`WinUISvelte` key, where upstream has one id for each and the pins hold no English for them.

## Alternatives rejected

- **A prop per string on each component.** It is what the consumer asked for and it would work, at
  about eighty new props, each of them on every instance, with no way to set a language once.
- **An i18n library as a peer.** It would decide every consumer's i18n for them. A consumer's own
  library fills the function form in one line.
- **`navigator.language` and shipped translations.** No pin holds a translation to ship, and
  writing them here would be a second source that no reference can check.

## Downstream impact

- A consumer who localizes calls `provideStrings` once, in a root layout.
- A new string a component writes is a table row. `C21` fails on the shapes its own comment lists,
  and not on the others it names there.
