import { declarations, fail, pass, read, styleBlocks, walk } from './lib.mjs';

export const id = 'C14';
export const title = 'no colour property reads a token that resolves to a gradient';

// C9 asks whether a token name resolves to *anything*. This asks whether what it resolves to
// is of the property's type, which is the half that renders.
//
// `ab843dd` is the defect that named this hole. `ComboBox.svelte`'s trigger wrote
// `border-color: var(--winui-ComboBoxBorderBrush)`; that token aliases
// `ControlElevationBorderBrush`, which this layer writes as a `linear-gradient(...)`.
// **`var()` defers the type check to computed-value time**, so the declaration parses, becomes
// invalid at computed-value time, and a non-inherited property then takes its *initial* value —
// for `border-color` that is `currentColor`. The trigger drew its own text colour on all four
// edges, 27 in light and 255 in dark against the 228 and 47 the brush composites to, on seven
// of the route's eight specimens — the eighth reads `ControlStrokeColorDefaultBrush`, which is
// a colour, and was never affected.
//
// **Nothing in this repository could see it.** Not the renderer, which drops the declaration
// without a console message; not prettier, eslint or `svelte-check`, to which the value is a
// well-formed `var()`; not the snapshot suite, which had been photographing the wrong edge
// since the route's first capture and calling it the baseline; and not C1, which fails a
// colour written *without* a token and is happy with a token naming the wrong kind of value.
// Only resolving the token by hand finds it, and a survey keyed on the stroke's value prints
// the gradient without noticing the declaration carrying it is dead.
//
// The class is small and was closed by hand before this gate existed: across the library and
// the Gallery all 54 reads of a gradient-valued token now sit in `background`, by two different
// routes. 45 are the masked `::after` that paints the brush on the ring alone. The other nine —
// `RadioButton`'s `.dot` and `.press-dot`, `ToggleSwitch`'s `.knob-on` — are a real element
// with `border-color: transparent` and two background layers, the fill written as a two-stop
// gradient of one colour clipped to `padding-box` and the brush clipped to `border-box`,
// because a background layer takes an image and not a colour. Both are ways of saying the same
// thing to a property that will accept it. This gate is therefore a guard rather than a cure,
// and it was manufactured to fail before it was believed — see the positive control in
// `tests/visual/gradient-in-colour-property.spec.ts`.

// **Measured, not recalled, and in both directions.** Each name below was probed by setting
// `<prop>: var(--x)` with `--x` a gradient and reading the computed value back: it is here iff
// the gradient landed where writing nothing lands *and* a plain colour did not. That second
// half is what makes the list falsifiable — without it, a property whose initial value happens
// to equal the probe colour reads as rejecting. The eight image-accepting properties are
// probed too, and must NOT reject; `background` is the one this project actually uses, so a
// list that wrongly contained it would fail 54 correct declarations. The table lives in
// `tests/visual/gradient-in-colour-property.spec.ts`, which asserts it covers exactly this
// list, and it runs in both lanes: local Chromium and the reference guest's Edge agreed on all
// 60 properties.
//
// **A gradient written out rather than reached through a token is not this gate's**, and that
// is a division of labour rather than a gap: `border-color: linear-gradient(red, blue)` renders
// exactly as badly, and C1 already fails it — `named colour \`red\` in \`border-color\``, measured
// against a planted specimen. This gate's subject is the token layer's reach, which is the half
// nothing else reads.
//
// None of these has an `<image>` slot anywhere in its grammar, so the rule needs no positional
// parsing: a gradient reaching any of them is wrong wherever in the value it sits. The
// shorthands earn their place separately — `border: 1px solid var(--grad)` is invalid at
// computed-value time as a whole, so every longhand it sets takes its initial value and
// `border-style: none` leaves no border at all, which is the same trap wearing a second face.
export const COLOUR_ONLY = [
	'color',
	'background-color',
	'border-color',
	'border-top-color',
	'border-right-color',
	'border-bottom-color',
	'border-left-color',
	'border-block-color',
	'border-block-start-color',
	'border-block-end-color',
	'border-inline-color',
	'border-inline-start-color',
	'border-inline-end-color',
	'outline-color',
	'text-decoration-color',
	'caret-color',
	'column-rule-color',
	'accent-color',
	'text-emphasis-color',
	'-webkit-text-fill-color',
	'-webkit-text-stroke-color',
	'fill',
	'stroke',
	'stop-color',
	'flood-color',
	'lighting-color',
	// `scrollbar-color` is the one a second gate already knew about: C1's own `COLOUR_PROPS`
	// lists it, so leaving it off here had the repository's two colour-property gates
	// disagreeing about what a colour property is. It is also the one this project is most
	// likely to reach, reproducing WinUI's scrollbars in three components. It takes *two*
	// colours, which is why a single-colour probe reads it as not taking one at all and drops
	// it — the test pairs it with a second colour for that reason.
	'scrollbar-color',
	// `text-emphasis-color` was on the list without its shorthand, the only longhand here that
	// was; `outline`, `column-rule`, `text-decoration` and `-webkit-text-stroke` all ship
	// beside theirs.
	'text-emphasis',
	'-webkit-text-emphasis',
	'-webkit-text-emphasis-color',
	'-webkit-tap-highlight-color',
	// CSS gap decorations, in the Chromium the test pins. `column-rule` and `column-rule-color`
	// were already here; these are the row and both-axis siblings, and they are in by the same
	// measurement rather than by a judgement about how new the feature is. If a later engine
	// answers differently the test says so, which is the whole reason the list is measured.
	'row-rule-color',
	'rule-color',
	'row-rule',
	'rule',
	'border',
	'border-top',
	'border-right',
	'border-bottom',
	'border-left',
	'border-block',
	'border-block-start',
	'border-block-end',
	'border-inline',
	'border-inline-start',
	'border-inline-end',
	'outline',
	'column-rule',
	'text-decoration',
	'-webkit-text-stroke',
	'box-shadow',
	'text-shadow'
];

/** The control set: these take an `<image>`, and a list that rejects one of them is wrong. */
export const IMAGE_OK = [
	'background',
	'background-image',
	'mask-image',
	'-webkit-mask-image',
	'border-image-source',
	'border-image',
	'list-style-image',
	'content'
];

// **Both carry `/i` because CSS keywords and function names are case-insensitive and custom
// property *names* are not.** `LINEAR-GRADIENT(red, blue)` is a gradient, `VAR(--x)` is a read,
// and a cold review evaded this gate three ways on that alone — the nastiest being an upper-case
// `VAR(` inside the alias chain, which leaves the reading declaration looking entirely ordinary.
// The captured name keeps its case, so `--winui-Foo` and `--winui-foo` stay distinct, which is
// what CSS does. Property names need no flag: `declarations()` lower-cases them already.
const GRADIENT = /\b(?:repeating-)?(?:linear|radial|conic)-gradient\s*\(/i;
const READS = /var\(\s*(--[A-Za-z0-9_-]+)/gi;

const TOKEN_LAYER = [
	'packages/winui-svelte/src/lib/tokens/tokens.css',
	'packages/winui-svelte/src/lib/tokens/type-ramp.css'
];

// The Gallery is in scope for the reason C1 and C9 give: its Design pages are where the token
// layer is judged, and a dead declaration there is as invisible as one in a control. C1 walks
// `packages/winui-svelte/src` whole where this walks `src/lib`; the only files that separates
// are `app.d.ts` and `app.html`, and no `.css` or `.svelte` is tracked outside these two roots
// at all. The `.svelte`/`.css` filter does mean a `<style>` block in an `app.html` would be
// invisible — neither holds one today.
const SOURCES = ['packages/winui-svelte/src/lib', 'apps/gallery/src'];

/** Every `<style>` body in a component, or the whole file for plain CSS. */
const bodies = (file, text) =>
	file.endsWith('.svelte') ? styleBlocks(text) : [{ body: text, line: 1 }];

/**
 * The rule itself, over text rather than over the file system.
 *
 * `run()` below is the I/O and nothing else. The separation is not tidiness: at `HEAD` this
 * gate passes, so **every mutation to the logic survives a green run** — the same shape as a
 * guard whose condition is already true. Given text, the fixtures in
 * `tests/visual/gradient-in-colour-property.spec.ts` can state a violation this gate must see
 * and a near-miss it must not, and each of the decisions below has one of each.
 *
 * `layer` and `sources` are both `{ path, text }`; the return is `{ sites, guarded, holding }`
 * — the strings a failure reports, in the order they were found; how many declarations were
 * examined to find them; and the set of files that held one of those declarations, which is
 * not the set that was opened.
 *
 * **What this does not reach is markup, and it is worth naming exactly.** Declarations are read
 * out of `<style>` bodies and plain stylesheets, so a colour written in a component's template
 * is invisible here. Counted with `svelte/compiler`'s own parser over 280 components rather
 * than by grep, which misses a form and miscounts the rest:
 *
 * - **342 `style` attributes**: 173 pure literals, 18 quoted values carrying an interpolation,
 *   58 braced expressions and **93 `{style}` shorthands**. Across all 342 — every form — not
 *   one writes a property on the list above, so a rule reading them would fail nothing today.
 *   Four of the 173 name a token, three reading one into `border-radius`, a width and a
 *   `background`, and one setting `--winui-ExpanderContentPadding` to a length.
 * - **145 `style:` directives**, 12 of them on a property this gate guards — eleven
 *   `style:color` and `Border.svelte`'s `style:border-color`. Every one takes an expression.
 *
 * **And a third shape lands inside the CSS this gate does read.** A `style:--name={…}`
 * directive defines a custom property from markup, so a stylesheet can read a name that is
 * defined nowhere this scans; `gradientOf` then walks an empty list and returns null, which is
 * not a failure to look but an answer of "no gradient". Five such names are live over seven
 * declarations, read by `color` and `box-shadow`. **The blindness is to the injected value, not
 * to the declaration**, and one of the five shows the difference: `Hyperlink.svelte` writes
 * `var(--hyperlink-foreground, var(--winui-HyperlinkForeground))`, and that fallback token *is*
 * resolved here, so a gradient reached that way is still caught. The other four —
 * `--code-light` and `--code-dark` in `SampleCodePresenter.svelte`, `--sample-shadow-light` and
 * `--sample-shadow-dark` on the ThemeShadow page — are bare reads with nothing to fall back to.
 * Two more names, `--pane-background` and `--text-block-selection-highlight-color`, are the same
 * mechanism on properties this gate does not guard. **A survey keyed on definitions cannot see
 * any of them**, which is why the 38 counted above is a true number that covers none of this:
 * these names have no definitions to count. Whether an unresolvable read should fail at all is
 * C9's question, not this one's, and C9 is green with all five present.
 *
 * **Two of those forms are open routes rather than counts.** The 93 shorthands sit in 92
 * different components, which is this library's pass-through convention: a caller's `style`
 * string reaches an inline style on almost anything it renders. And `Border.svelte` hands its
 * public `borderBrush` prop straight to `style:border-color`, so
 * `borderBrush="var(--winui-ControlElevationBorderBrush)"` reproduces this exact defect at
 * runtime with nothing to see it. Today both call sites passing anything token-shaped land on a
 * flat colour — `CardStrokeColorDefaultBrush` resolves to `CardStrokeColorDefault`, and the
 * Border page's brush list is hex literals — so the route is open and unused. Neither is this
 * gate's to close: one is a question about a component's API and the other about what a
 * consumer may be handed, and both want a mechanism that reads markup rather than stylesheets.
 */
export function sitesIn(layer, sources) {
	const define = (map, name, value) => {
		if (!map.has(name)) map.set(name, []);
		map.get(name).push(value);
	};

	// A token is defined once per theme block, and **a gradient in any one of them is the
	// defect**: `ControlElevationBorderBrush` is a gradient in three of its four definitions
	// and a flat `var(--winui-SystemColorWindowTextColor)` in the fourth. Those four are spread
	// over three themes — `:root`, then dark written twice, once as `[data-theme='dark']` and
	// once as the `prefers-color-scheme` form of the same theme, then high contrast — so a
	// `border-color` reading it is broken in two themes of the three and correct in the third.
	// A rule requiring every definition to be a gradient would pass exactly the declaration
	// that named this gate.
	const global = new Map();
	for (const { text } of layer)
		for (const d of declarations(text))
			if (d.prop.startsWith('--')) define(global, d.prop, d.value);

	// `--winui-*` is one namespace across the whole repository, so those resolve against every
	// definition anywhere — a component that set one to a gradient would be caught wherever it
	// is read. Any other custom property is the component's own, and two files may spell
	// `--band` differently without either being wrong, so those resolve against the layer plus
	// the file being scanned and nothing else. Measured when this was written: 112
	// component-level `--winui-*` definitions, none resolving to a gradient, and 38 other
	// custom property names, likewise none.
	//
	// **ADR 0006 is the reason the names are one namespace and not the reason the values are.**
	// It fixes each token's name as the WinUI key verbatim; it says nothing about a component
	// scoping a different value onto its own subtree, which ten declarations already do — the
	// four `--winui-ToggleButtonBorderBrush*` twice over in `ColorPicker.svelte` and two
	// `--winui-AppBarToggleButtonBorderBrushChecked*` in `CommandBarFlyout.svelte`, every one
	// of them a layer gradient narrowed to a flat colour. **So the merge cuts both ways.** It
	// cannot miss a gradient, which is what it is for; and it can fail a declaration that
	// renders, if a component ever scopes one of those ten to a colour and then reads it into a
	// colour property. None does today — every read of the six names is a `background` — and
	// when one does, the failure is this policy rather than a defect in the gate, which is
	// worth knowing before reading the site it names.
	const perFile = new Map();
	for (const { path, text } of sources) {
		const own = new Map();
		for (const { body, line } of bodies(path, text))
			for (const d of declarations(body, line))
				if (d.prop.startsWith('--'))
					define(d.prop.startsWith('--winui-') ? global : own, d.prop, d.value);
		perFile.set(path, own);
	}

	/** The first gradient `name` resolves to, following `var()` through any depth, or null. */
	const gradientOf = (name, own, seen = new Set()) => {
		if (seen.has(name)) return null; // a cycle is C9's business, not a gradient
		seen.add(name);
		for (const value of [...(own.get(name) ?? []), ...(global.get(name) ?? [])]) {
			if (GRADIENT.test(value)) return value;
			for (const m of value.matchAll(READS)) {
				const found = gradientOf(m[1], own, seen);
				if (found) return found;
			}
		}
		return null;
	};

	const sites = [];
	let guarded = 0;
	// Which files hold one, not how many were opened. `920 declarations in 281 files` reads as
	// though they were spread over all of them; 281 is what the walk returned and 110 is what
	// carries a colour property at all.
	const holding = new Set();
	for (const { path, text } of sources) {
		const own = perFile.get(path);
		for (const { body, line } of bodies(path, text))
			for (const d of declarations(body, line)) {
				if (!COLOUR_ONLY.includes(d.prop)) continue;
				guarded++;
				holding.add(path);
				for (const m of d.value.matchAll(READS)) {
					const gradient = gradientOf(m[1], own);
					if (!gradient) continue;
					// A fallback does not rescue it, and that is the browser's rule rather than a
					// policy: `var(--x, red)` uses the fallback when `--x` is *undefined*, never
					// when its value is the wrong type, so the declaration dies just the same.
					sites.push(
						`${path}:${d.line}  ${d.prop} reads ${m[1]}, which resolves to ${gradient
							.replace(/\s+/g, ' ')
							.slice(0, 48)}…`
					);
				}
			}
	}
	return { sites, guarded, holding };
}

export async function run() {
	const layer = [];
	for (const path of TOKEN_LAYER) layer.push({ path, text: await read(path) });

	const sources = [];
	for (const root of SOURCES)
		for (const path of await walk(root, (n) => /\.(svelte|css)$/.test(n))) {
			if (TOKEN_LAYER.includes(path)) continue;
			sources.push({ path, text: await read(path) });
		}

	// A gate that cannot read what it is supposed to check must fail rather than pass quietly —
	// an unbuilt token layer defines nothing, and every token then resolves to no gradient.
	if (!layer.some(({ text }) => /--winui-/.test(text)))
		return fail('the token layer defines nothing; has it been generated?');

	const { sites, guarded, holding } = sitesIn(layer, sources);

	return sites.length
		? fail(
				'a gradient reaching a property that has no image slot is invalid at computed-value ' +
					'time, and the property falls back to its initial value',
				sites
			)
		: pass(
				`${guarded} declaration(s) across ${COLOUR_ONLY.length} colour-only propert(ies), in ` +
					`${holding.size} of the ${sources.length} file(s) scanned, read no token ` +
					`resolving to a gradient`
			);
}
