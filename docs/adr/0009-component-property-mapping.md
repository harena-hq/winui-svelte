# 0009 — How a WinUI member becomes a Svelte prop

## Context

The library is the product; the Gallery is the harness that judges it. A consumer installs
`winui-svelte` and writes `<Button …>` — so the prop surface is as public as the token names
ADR 0006 fixed, and just as unchangeable once shipped.

Two components exist, and they were written before any rule. Their surfaces disagree with each
other and with the ecosystem:

| site                     | shape                         | what it disagrees with                     |
| ------------------------ | ----------------------------- | ------------------------------------------ |
| `paneOpen`               | `IsPaneOpen`, prefix dropped  | nothing — this one is right                |
| `paneToggleVisible`      | `IsPaneToggleButtonVisible`   | drops `Button` as well as `Is`             |
| `onselect`               | all-lowercase callback        | the DOM owns lowercase `on*`               |
| `onback`, `onpanetoggle` | all-lowercase callback        | and `BackRequested` is the member's name   |
| `expanded: SvelteSet`    | a mutable object prop         | there is no way to observe it, only mutate |
| everything               | no `class`, no rest, no `ref` | a consumer cannot place or extend it       |

That last row is the one that matters most. Nothing in the library today can be given a class,
an `aria-label`, a `data-*` hook, or an id. A component that cannot be positioned by its
consumer is a demo, not a library.

D9 locks bits-ui as the primitive base, so a consumer will hold both surfaces at once. Its
conventions are therefore not merely one option among several — a disagreement with them is a
cost paid by every consumer, on every component, forever. Read from `bits-ui@2.19.0`: booleans
are bare and DOM-polarised (`disabled`, `readonly`, `required`, `checked`); state callbacks are
`on<Prop>Change` in camelCase; content is the `children` snippet; the root element takes `ref`
and spreads the rest of the attributes.

## Decision

**Property names.** A prop is the WinUI member name, camelCased, with a leading `Is`, `Has` or
`Can` dropped and the polarity kept — `IsPaneOpen` → `paneOpen`, `IsBackButtonVisible` →
`backButtonVisible`, `PaneDisplayMode` → `paneDisplayMode`. Nothing else is dropped:
`IsPaneToggleButtonVisible` → `paneToggleButtonVisible`, not `paneToggleVisible`.

**Where HTML already has the attribute, HTML wins — name and polarity.** `IsEnabled` is exposed
as `disabled`, not as `enabled`, because the rest props reach a real `<button>` and `disabled`
is already live there; two names for one state is a bug waiting for a consumer to set both. The
exception set is closed and is the HTML attribute vocabulary itself: `disabled`, `readonly`,
`required`, `checked`, `open`, `hidden`, `value`, `placeholder`, `name`, `form`.

**Callbacks are camelCase after `on`; lowercase `on*` is the DOM's and is never ours.**
`onclick` reaches the underlying element through the rest props and keeps its DOM meaning. A
change to a bindable prop is `on<Prop>Change` called with the new value — `onPaneOpenChange`.
An event that is not a prop change takes the WinUI event name — `BackRequested` →
`onBackRequested`, `ItemInvoked` → `onItemInvoked`.

**A prop the control mutates itself is `$bindable()`, and always has its `on<Prop>Change`.**
Binding and observing are different needs and a consumer should not have to bind to learn.

**Content is snippets.** The XAML `ContentProperty` is `children`. A named content member is a
snippet prop under the mapped name — `PaneFooter` → `paneFooter`.

**Every component takes the escape hatch, on its root element:** `...rest` spread (so `id`,
`aria-*`, `data-*` and DOM handlers all work). Restyling beyond that is the token cascade — set
`--winui-*` on an ancestor — which is ADR 0002 and needs no per-component surface.

**`ref` points at the interactive element, which is the root only when the root is the
control.** Button's root is its `<button>` and the two coincide; TextBox's root is a wrapper
whose `<input>` is the control, and its `ref` is the input. The rest props stay on the root
either way, because that is where a `data-*` hook, an `id` and a pointer handler have to land
to reach the whole control — a hidden or inner element would receive `onmouseenter` for a
region the consumer cannot see. Written down after the fact: TextBox shipped this way in v3's
third unit without the rule being stated, so the rule follows the code rather than the code
following the rule.

**An HTML attribute from the reserved set that belongs on an inner element is declared as a
prop rather than left to the rest spread.** `name`, `value`, `required` and `form` on a
CheckBox belong on its `<input>`, and the rest props do not go there. This is the second half
of why the exception set is closed: reserving those names keeps them available to be routed,
instead of a consumer's `name` landing silently on a `<label>`.

**`class` and `style` are destructured out of the rest and merged, never spread.** Left in, they
do not merge — they replace, and silently. Measured on Svelte 5.57.0: a component whose root is
`<div class="root" style="color: red" {...rest}>`, given `class="consumer" style="margin: 4px"`,
renders `class="consumer svelte-4q5ttb" style="margin: 4px;"`. Its own `root` class is gone and
every rule keyed on it stops applying, while the scoping hash Svelte injects stays — so the
component still looks styled, and is not. The form that works is
`let { class: className, style, ...rest } = $props()` with `class={['root', className]}`, which
composes to `class="root consumer svelte-4psua6"`; Svelte's array form does the merging and
keeps the scope.

**`ref` is populated on the first effect flush, not when `mount()` returns.** Same as
`bind:this`, which is what it is; a consumer reading it during its own initialisation reads
`null`. Stated because it is invisible until someone measures at the wrong moment.

**A prop's TSDoc names the WinUI member it maps to**, so a reader can diff the surface against
the IDL without a registry to maintain. A prop with no WinUI member says so instead.

## Status

Permanent for the names. The two existing components are migrated as v3's first unit; after
that a rename is a breaking change.

**Amended by ADR 0012.** The exception set above is declared closed and was reopened once, for
`glyph`, a shorthand for an `IconElement` that is a Segoe Fluent Icons code point. Three
components had already shipped it unrecorded when that was noticed. The naming rule is
otherwise unchanged, and the `icon` prop ADR 0012 introduces follows this ADR rather than
excepting itself from it.

**Amended by v17's `TextBlock`, for a collision the rule did not anticipate.**
`FrameworkElement.Style` camelCases to `style`, which is the attribute this ADR already
destructures out of the rest props and merges onto every component's root. The two halves of
the naming rule meet head-on and neither yields: dropping the member loses the type ramp that
D38 exists to expose, and displacing the attribute takes away the escape hatch. So the member
is **renamed**, and the rule for a rename is to prefix it with its control's own noun —
`Style` on `TextBlock` is `textStyle`. That is a rename and not a new reserved name; the
exception set above is untouched, and no existing prop changes.

`TextBlock` is the only control whose `Style` is one of the `*TextBlockStyle` keys, which is a scope
decision rather than a naming one. A `Style` is an entry in a XAML resource dictionary, this library
has no equivalent of one, and those ten keys are the single family it already emits as CSS classes.
A control that later needs that family takes its own noun by the same rule. A style a control
selects among its own looks is its `variant`: `Button`'s and `InfoBadge`'s, and `ToggleSwitch`'s
below.
`styleKey` was the alternative and names the value more exactly — it is a resource key — but it
promises a generality nothing backs: there is no dictionary to key into, and the ten names are
the whole vocabulary.

**The same unit declares `dir`, and that is a second, narrower exception.** The rule above admits
a declared HTML prop only for a name in the closed reserved set that belongs on an **inner**
element; `dir` is in neither category — it is not reserved, and it lands on the root, where the
rest spread already delivers it. It is declared anyway because `TextBlock` has to be able to
override it: XAML's `TextAlignment="DetectFromContent"` resolves the direction from the element's
own content, whose CSS equivalent is `dir="auto"`, so that one alignment value writes the
attribute and every other leaves the consumer's alone. The cost is stated rather than hidden —
under `detectFromContent` a consumer's `dir` is discarded, which is the "two names for one state"
hazard this ADR's own reasoning is about, and the prop's TSDoc says so at the site.

**The rule that follows from both**: a component may declare a non-reserved HTML attribute as a
prop **only when it must conditionally override it**, and the ADR records each such case by name.
The alternative — leaving `dir` to the rest spread and emitting `dir="auto"` after it — discards
the consumer's value in exactly the same case while making the prop invisible, so it hides the
cost instead of removing it.

**The cases, by name:**

- **`TextBlock`**, for `TextAlignment="DetectFromContent"`, as above.
- **`Run`**, for `FlowDirection`. `Run_FlowDirection` (`Indexes.g.h:2082`) is a real XAML member
  with no name of its own in HTML — `dir` is what expresses it — so the component has to write
  `dir` whenever `flowDirection` is set and leave the consumer's alone otherwise. Added by the
  unit that built the `Inlines` model.
- **`Hyperlink`**, for `tabindex`. `IsTabStop` and `TabIndex` are two XAML members that HTML
  spells with one attribute, so `tabStop === false` has to write `-1` over whatever `tabindex`
  the consumer passed, and `tabStop === true` has to hand that value back untouched. Added by the
  unit that built `Hyperlink`, after the independent review found the first draft erasing a
  consumer's `tabindex` on every link that was a tab stop — which is the same defect the rule
  below describes, reached by a different member.

**And the reason this rule is about declaring rather than re-reading.** An attribute written
after a spread overrides that spread's value **even when what it writes is `undefined`**, so
`dir={flowDirection === undefined ? undefined : …}` after `{...rest}` erases a consumer's `dir` on
every element that sets no `flowDirection`. Reading the value back out of the rest props and
re-emitting it fixes the erasure and costs a runtime narrowing of an `unknown`, a `$derived`, and
a prop that does not appear in the component's own type — which is the invisibility this rule
exists to prevent. Destructuring is the same fix written where a reader finds it.

**Amended 2026-10-07: the naming attributes go to the control.** The rule above put every
`aria-*` on the root, and for a component whose root is a wrapper that put a consumer's
`aria-label` where it names nothing — a `<div>` with no role. Building the release's Gallery
pages found it, on a switch upstream names through `AutomationProperties.Name`. So
`aria-label`, `aria-labelledby` and `aria-describedby` are declared on such a component and
routed to the element `ref` points at — the same element this ADR already calls the control.
That is a third kind of declared attribute, beside the reserved set's and `dir`: these three are
not in the closed set and are not declared to be overridden, but to be **moved**, because the
root is the wrong element for them. Every other `aria-*` stays on the root with the rest props,
`aria-description` included, by choice: it describes nothing on a wrapper either, and nothing in
the release has needed it.

The name is resolved in upstream's order, which is not ARIA's: `AutomationProperties.Name`, then
`LabeledBy`, then the control's own — its header, and for a `TextBox` with none its placeholder
(`FrameworkElementAutomationPeer::GetNameCore`; `TextBox::GetPlainText`). An empty source is no
source, as upstream checks each for zero length before falling through. ARIA lets
`aria-labelledby` win over `aria-label`, so a consumer's `aria-label` clears the component's own
`aria-labelledby` rather than sitting beside it. `internal/accessible-name.ts` holds the one
resolution all of them use.

A non-editable `ComboBox` is the exception to "the name is the name". Its trigger is a
`<button>`, which reports nothing beside its name, where upstream's peer reports the selection
apart from it. So whatever names the trigger is followed by the selection's text — "Header Red",
and "Header" alone with nothing selected — and a consumer's `aria-label` is restated in a hidden
element so it can be referenced with it.

It is done for the three of the release whose root is a wrapper — `TextBox`, `ComboBox` in both
modes, `ToggleSwitch`. `preview`'s wrapper-rooted controls follow when a unit next touches them;
ADR 0017 promises nothing for them in the meantime. Besides a consumer's `aria-label` now
reaching the control, two names change with no attribute given, both toward upstream's header:
a `TextBox` with a header was named by its placeholder or by nothing and is now named by its
header, and a non-editable `ComboBox` with a header was named by its selection or its placeholder
and is now named by the header, followed by the selection when there is one.

**Amended 2026-10-31: the rule is now a gate, and the release is brought onto it.** Two external
reviews of the names, before 0.1.0, found the package breaking this ADR where nothing read it.
`C20` now reads each exported component's `$props()` and refuses a leading `is`, `has` or `can`, a
`Disabled` other than `disabled`, a `$bindable` without its `on<Prop>Change`, and a component
without `class`, `style`, `ref` and rest props. What it found was renamed in one unit, before a
final release made each a breaking change: `isIndeterminate`, `isActive` and the rest of the
prefixes, on every component that kept one; `primaryButtonDisabled` and `secondaryButtonDisabled`,
which no element takes, are `primaryButtonEnabled` and `secondaryButtonEnabled`, as the polarity
rule says and as `TitleBar`'s `backButtonEnabled` already was; and `onSelectionChanged` on a
`selected`, `selectedIndex`, `selectedIndexes` or `selectedKey` prop is that prop's
`on<Prop>Change`, as `TreeView`'s `onExpandedChange` on `expandedKeys` is `onExpandedKeysChange`.
`ColorSpectrum`'s `hsvColor` and `RefreshContainer`'s `refreshing` had no callback and gained one.
`TeachingTip`'s `lightDismiss` had dropped a word and is `lightDismissEnabled`,
which the gate cannot see. `NavigationViewItem` takes the escape hatch, on its `<li>`, and its `ref`
and the three naming attributes are the row's `treeitem`, so it is a fourth wrapper-rooted control
of the release under the 2026-10-07 amendment above. A rename is not the touch that amendment means
when it says `preview`'s wrapper-rooted controls follow: none of them gained the routing here.

**A code point has one name, ADR 0012's `glyph`.** `InfoBar`'s and `InfoBadge`'s `iconSource` and
`TitleBar`'s `iconGlyph` were the same thing under two more.

**One departure is admitted: what a control reports of itself needs no callback.** The sentence
above says a prop the control mutates "always has its `on<Prop>Change`", and that is right for a
change a consumer can ask for. `ScrollView`'s offsets and sizes, `ScrollViewer`'s offsets, what
`MediaTransportControls` reports of its media and `MediaPlayerElement`'s handle on its element are
outputs. They stay bindable without one of their own, and `C20` lists them by name, so that another
joins only by editing the list. The two offsets are observed together, through `onOffsetChange`;
for the rest a consumer has `$effect` on the binding. The gate's
other list is not a departure: `ToggleSplitButton` hands `class`, `style` and `open` to the
`SplitButton` it renders, which declares them with `onOpenChange`.

**The closed set is what this ADR's own reasons say and no more.** `Expander`'s `IsExpanded` is
`open` because bits-ui and `<details>` both say so, not because its root takes the attribute, and
that is the sense in which `open` is on the list. `title` is not on it: an HTML `title` draws a
tooltip of its own, and `InfoBar`'s and `ContentDialog`'s `title` are WinUI's `Title`, where a
consumer who wants the attribute cannot reach it.

**`ToggleSwitch` takes a `variant`, `rightAlignedCompact`.** That is the Community Toolkit's
`RightAlignedCompactToggleSwitchStyle`, and the shape is the one `Button` and `InfoBadge` already
have for a style a consumer cannot set here. The style replaces the control's template, placing the
text before the track, the header over them and the knob 3 from the track's ends, for the row with a
label at the left that the original's own Settings page draws. WinUI reaches it through `Template`,
and the `asChild` and `::part` alternatives below reject the two ways of offering one here. So a
layout a consumer cannot build from outside is a value of the prop, under that key's name so that it
can be looked up.

**An HTML attribute's prop takes `null` as HTML's does.** `svelte/elements` types these as
`T | null | undefined`, so a wrapper that spread those attributes onto a component failed
`svelte-check`, which a consumer's trial found. `null` means what it means on an element, that the
attribute is absent. It holds for `disabled`, `readonly`, `required`, `checked`,
`placeholder`, `name`, `form`, `class`, `style` and the three naming attributes, and `C20` holds a
component's own props to the first nine. `value`, and `min`, `max` and `step`, are typed per control
and stay out, as does `title`, which is WinUI's `Title` where a control has one. `open` on a
`<details>` is not what a component's `open` is. A control's state written back as `null` reads as
false, so `checked={null}` is unchecked with its `aria-pressed` false, and not a button that is no
toggle. A record in a collection, a `ComboBoxItemData`, is not an element's attributes and is not
held.

## Alternatives rejected

- **Keep the WinUI name verbatim, as ADR 0006 does for tokens.** The symmetry is false. A token
  name is looked up mechanically against Microsoft's documentation, which is exactly ADR 0006's
  argument; a prop is typed by hand next to `disabled` and `onclick`. `IsPaneOpen` as a prop
  reads as a foreign object in Svelte source, and the ecosystem's own vocabulary is right there.
- **All-lowercase callbacks (`onselect`), as the two existing components have.** It collides
  head-on with the DOM handlers the rest props carry, and the collision is silent: whichever is
  destructured last wins.
- **bits-ui's `child` snippet (`asChild`).** It hands the consumer the root element to replace.
  Our root element _is_ the WinUI template's outer border — its classes, its corner radius, its
  visual states. Letting it be swapped forfeits the only thing this library sells.
- **Exposing template parts as CSS selectors (`::part`).** Freezes the internal structure into
  the public surface, and the structure is dictated by WinUI's templates, which change between
  WinUI releases. The token cascade reaches the same values without pinning the tree.

## Downstream impact

The five controls of v3 are the first written under this rule, and the two from v2 are brought
onto it before them — cheapest now, at two components, and the cost is linear in the count from
here on. It is also the first version whose output is worth installing: a consumer can place,
label and extend what the package exports.
