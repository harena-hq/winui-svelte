import { expect, test } from './fixtures';

/**
 * The list `C14` guards, run against the renderer that decides it.
 *
 * `scripts/conformance/c14-gradient-in-colour-property.mjs` fails a `--winui-*` token that
 * resolves to a gradient when a colour property reads it, because `var()` defers the type check
 * to computed-value time, the declaration is invalid there, and the property falls back to its
 * initial value. Which properties those are is the whole of that gate's correctness, and it is
 * a claim about CSS rather than about this repository: a property wrongly on the list fails a
 * declaration that renders, and one wrongly off it is the next silent defect.
 *
 * So the list is measured here instead of recalled, and **in both directions**. A property is
 * proven to reject a gradient only if the gradient lands where writing nothing lands *and* a
 * plain colour does not — without that second half, a property whose initial value happens to
 * equal the probe colour reads as rejecting and the check cannot disagree. The eight
 * image-accepting properties are the control: `background` is where all 54 of this library's
 * reads of an elevation brush actually sit, so a list that wrongly contained it would fail
 * every one of them.
 *
 * This runs in **both** lanes rather than skipping without a CDP endpoint, which is the other
 * half of what it is for. It photographs nothing, so it needs no reference face; and the two
 * renderers agreeing is itself the reading — a gate written against one engine and shipped
 * against another is a gate nobody measured. Local Chromium 151.0.7922.34 and the guest's Edge
 * 151.0.4129.78 agreed on all 60 properties when this was written.
 */

/**
 * `[property, element, longhand to read back, value written before the colour]`.
 *
 * A shorthand cannot be read back as itself — `getComputedStyle(el).border` is empty whenever
 * the four edges disagree — so each one names a longhand it also sets, and the prefix supplies
 * the rest of a declaration that would otherwise be incomplete. `border: red` sets no width or
 * style and is indistinguishable from a rejected one.
 */
const PROBES: [prop: string, tag: string, longhand: string, prefix?: string, suffix?: string][] = [
	['color', 'div', 'color'],
	['background-color', 'div', 'backgroundColor'],
	['border-color', 'div', 'borderTopColor'],
	['border-top-color', 'div', 'borderTopColor'],
	['border-right-color', 'div', 'borderRightColor'],
	['border-bottom-color', 'div', 'borderBottomColor'],
	['border-left-color', 'div', 'borderLeftColor'],
	['border-block-color', 'div', 'borderBlockStartColor'],
	['border-block-start-color', 'div', 'borderBlockStartColor'],
	['border-block-end-color', 'div', 'borderBlockEndColor'],
	['border-inline-color', 'div', 'borderInlineStartColor'],
	['border-inline-start-color', 'div', 'borderInlineStartColor'],
	['border-inline-end-color', 'div', 'borderInlineEndColor'],
	['outline-color', 'div', 'outlineColor'],
	['text-decoration-color', 'div', 'textDecorationColor'],
	['caret-color', 'div', 'caretColor'],
	['column-rule-color', 'div', 'columnRuleColor'],
	['accent-color', 'div', 'accentColor'],
	['text-emphasis-color', 'div', 'textEmphasisColor'],
	['-webkit-text-fill-color', 'div', 'webkitTextFillColor'],
	['-webkit-text-stroke-color', 'div', 'webkitTextStrokeColor'],
	['fill', 'rect', 'fill'],
	['stroke', 'rect', 'stroke'],
	['stop-color', 'stop', 'stopColor'],
	['flood-color', 'feFlood', 'floodColor'],
	['lighting-color', 'feDiffuseLighting', 'lightingColor'],
	// `scrollbar-color` takes a thumb colour *and* a track colour. Probed with one it reads as
	// refusing a colour, which fails the mirror control and would have dropped it from the list
	// — a blind spot in the probe's shape rather than in the property, and the reason the
	// suffix exists at all.
	['scrollbar-color', 'div', 'scrollbarColor', '', 'rgb(4, 5, 6)'],
	['text-emphasis', 'div', 'textEmphasisColor', 'filled dot'],
	['-webkit-text-emphasis', 'div', 'webkitTextEmphasisColor', 'filled dot'],
	['-webkit-text-emphasis-color', 'div', 'webkitTextEmphasisColor'],
	['-webkit-tap-highlight-color', 'div', 'webkitTapHighlightColor'],
	['row-rule-color', 'div', 'rowRuleColor'],
	['rule-color', 'div', 'rowRuleColor'],
	['row-rule', 'div', 'rowRuleStyle', '2px solid'],
	['rule', 'div', 'rowRuleStyle', '2px solid'],
	['border', 'div', 'borderTopStyle', '2px solid'],
	['border-top', 'div', 'borderTopStyle', '2px solid'],
	['border-right', 'div', 'borderRightStyle', '2px solid'],
	['border-bottom', 'div', 'borderBottomStyle', '2px solid'],
	['border-left', 'div', 'borderLeftStyle', '2px solid'],
	['border-block', 'div', 'borderBlockStartStyle', '2px solid'],
	['border-block-start', 'div', 'borderBlockStartStyle', '2px solid'],
	['border-block-end', 'div', 'borderBlockEndStyle', '2px solid'],
	['border-inline', 'div', 'borderInlineStartStyle', '2px solid'],
	['border-inline-start', 'div', 'borderInlineStartStyle', '2px solid'],
	['border-inline-end', 'div', 'borderInlineEndStyle', '2px solid'],
	['outline', 'div', 'outlineStyle', '2px solid'],
	['column-rule', 'div', 'columnRuleStyle', '2px solid'],
	['text-decoration', 'div', 'textDecorationLine', 'underline'],
	['-webkit-text-stroke', 'div', 'webkitTextStrokeWidth', '2px'],
	['box-shadow', 'div', 'boxShadow', '0 0 4px'],
	['text-shadow', 'div', 'textShadow', '0 0 4px'],
	['background', 'div', 'backgroundImage'],
	['background-image', 'div', 'backgroundImage'],
	['mask-image', 'div', 'maskImage'],
	['-webkit-mask-image', 'div', 'webkitMaskImage'],
	['border-image-source', 'div', 'borderImageSource'],
	['border-image', 'div', 'borderImageSource'],
	['list-style-image', 'div', 'listStyleImage'],
	['content', 'div', 'content']
];

const GRADIENT = 'linear-gradient(red, blue)';
const COLOUR = 'rgb(1, 2, 3)';

test('C14 guards every property that refuses a gradient, and no property that takes one', async ({
	page
}) => {
	const gate: { COLOUR_ONLY: string[]; IMAGE_OK: string[] } =
		await import('../../scripts/conformance/c14-gradient-in-colour-property.mjs');

	// The gate's list and this table are the same list or the test is measuring something else.
	// A name added to the gate without a row here would otherwise ship unproven, which is the
	// only way this check can go quiet.
	expect([...gate.COLOUR_ONLY, ...gate.IMAGE_OK].sort()).toEqual(PROBES.map(([p]) => p).sort());

	// A document of this test's own. It carries no client, so there is nothing to wait for —
	// `fixtures.ts` wraps `goto` and `reload` for a page whose own JavaScript has to run first,
	// and this one has none.
	await page.setContent('<!doctype html><meta charset="utf-8"><body>');

	const rows = await page.evaluate(
		({ probes, gradient, colour }) => {
			const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
			document.body.append(svg);

			const readBack = (tag: string, prop: string, longhand: string, value: string | null) => {
				const el =
					tag === 'div'
						? document.createElement('div')
						: document.createElementNS('http://www.w3.org/2000/svg', tag);
				(tag === 'div' ? document.body : svg).append(el);
				if (value !== null) {
					el.style.setProperty('--probe', value);
					el.style.setProperty(prop, 'var(--probe)');
				}
				const got = (getComputedStyle(el) as unknown as Record<string, string>)[longhand];
				el.remove();
				return String(got);
			};

			return probes.map(([prop, tag, longhand, prefix = '', suffix = '']) => {
				const write = (value: string) => `${prefix} ${value} ${suffix}`.trim();
				return {
					prop,
					withGradient: readBack(tag, prop, longhand, write(gradient)),
					withColour: readBack(tag, prop, longhand, write(colour)),
					absent: readBack(tag, prop, longhand, null)
				};
			});
		},
		{ probes: PROBES, gradient: GRADIENT, colour: COLOUR }
	);

	expect(rows).toHaveLength(PROBES.length);

	// Each direction asserts what its list claims *and* the mirror that makes the claim mean
	// something. A guarded property refusing the gradient proves nothing on its own: any
	// property that refuses every value it is given satisfies it, and one that takes neither a
	// colour nor an image would sit on the list unnoticed — so it must also be shown taking a
	// plain colour. An exempt property taking the gradient is likewise only evidence that the
	// longhand being read is the image slot if a bare colour does *not* reach it; without that
	// half, reading `background` back through `background` rather than `backgroundImage` passes.
	// An engine that does not implement a property at all fails these the same way one that
	// changed its grammar does: `setProperty` is a no-op, so every read comes back as the
	// initial value. The messages name that second reading, because the first hypothesis a
	// failure here invites is "the gate is wrong", and for a property this young — the gap
	// decorations especially — "this build does not have it" is at least as likely.
	const orUnimplemented = 'or this engine does not implement it';

	for (const row of rows) {
		if (gate.COLOUR_ONLY.includes(row.prop)) {
			expect(row.withColour, `${row.prop} must take a plain colour, ${orUnimplemented}`).not.toBe(
				row.absent
			);
			expect(
				row.withGradient,
				`${row.prop} is on C14's list, so a gradient must land on its initial value`
			).toBe(row.absent);
		} else {
			expect(
				row.withGradient,
				`${row.prop} is exempt from C14, so it must actually take the gradient, ${orUnimplemented}`
			).toContain('gradient');
			expect(row.withColour, `${row.prop} has no colour slot to take one`).toBe(row.absent);
		}
	}
});

/**
 * The rule itself, over text this file writes.
 *
 * At `HEAD` the gate passes — the class it guards was closed by hand in `ab843dd` — so every
 * mutation to its logic survives `pnpm conform` unchanged. That is a guard whose condition is
 * already true, and the only way to disagree with it is to hand it a violation. `sitesIn` takes
 * `{ path, text }` for exactly that reason, and each row below pairs a case the gate must see
 * with the near-miss it must not, so neither assertion can be satisfied by a gate that answers
 * the same way to everything.
 */
const LAYER = [
	{
		path: 'tokens.css',
		text: `
			:root {
				--winui-Flat: rgb(9, 9, 9);
				--winui-Grad: linear-gradient(to top, red 0.99px, blue 0.99px);
				--winui-Alias1: var(--winui-Alias2);
				--winui-Alias2: var(--winui-Alias3);
				--winui-Alias3: var(--winui-Grad);
				--winui-Themed: rgb(1, 1, 1);
				--winui-Upper: LINEAR-GRADIENT(red, blue);
				--winui-AliasUpper: VAR(--winui-Grad);
				--winui-CycleA: var(--winui-CycleB);
				--winui-CycleB: var(--winui-CycleA);
			}
			@media (forced-colors: active) {
				:root {
					--winui-Themed: linear-gradient(red, blue);
				}
			}
		`
	}
];

const CASES: { name: string; files: { path: string; text: string }[]; sites: number }[] = [
	{
		name: 'a token that is a gradient in one theme block of two is still the defect',
		files: [{ path: 'a.css', text: '.x { border-color: var(--winui-Themed); }' }],
		sites: 1
	},
	{
		name: 'a token that is flat in every block is not',
		files: [{ path: 'a.css', text: '.x { border-color: var(--winui-Flat); }' }],
		sites: 0
	},
	{
		name: 'an alias chain is followed to its end',
		files: [{ path: 'a.css', text: '.x { border-color: var(--winui-Alias1); }' }],
		sites: 1
	},
	{
		name: 'a fallback does not rescue an invalid value',
		files: [{ path: 'a.css', text: '.x { border-color: var(--winui-Grad, red); }' }],
		sites: 1
	},
	{
		name: 'a shorthand carrying the gradient in its colour slot is the defect too',
		files: [{ path: 'a.css', text: '.x { border: 1px solid var(--winui-Grad); }' }],
		sites: 1
	},
	{
		name: 'a value the formatter wrapped across lines is still read',
		files: [
			{
				path: 'a.css',
				text: '.x {\n\tborder-color:\n\t\tvar(\n\t\t\t--winui-Grad\n\t\t);\n}'
			}
		],
		sites: 1
	},
	{
		name: 'a property with an image slot takes it, and is not a site',
		files: [
			{
				path: 'a.css',
				text: '.x { background: var(--winui-Grad); mask-image: var(--winui-Grad); }'
			}
		],
		sites: 0
	},
	{
		name: "a component's own custom property carries the gradient to a colour property",
		files: [
			{ path: 'a.css', text: '.x { --band: var(--winui-Grad); border-color: var(--band); }' }
		],
		sites: 1
	},
	{
		name: 'the same name in another file does not, because it is another property',
		files: [
			{ path: 'a.css', text: '.x { --band: var(--winui-Grad); }' },
			{ path: 'b.css', text: '.y { border-color: var(--band); }' }
		],
		sites: 0
	},
	{
		// CSS keywords and function names are case-insensitive; the three below all render as a
		// gradient in a colour property and all three passed this gate before a cold review
		// wrote them. The third is the one worth keeping: the upper case is in the *layer*, so
		// the reading declaration is ordinary and nothing about the site looks wrong.
		name: 'an upper-case gradient function is still a gradient',
		files: [{ path: 'a.css', text: '.x { border-color: var(--winui-Upper); }' }],
		sites: 1
	},
	{
		name: 'an upper-case var() at the read site is still a read',
		files: [{ path: 'a.css', text: '.x { border-color: VAR(--winui-Grad); }' }],
		sites: 1
	},
	{
		name: 'an upper-case var() inside the alias chain is still a link',
		files: [{ path: 'a.css', text: '.x { border-color: var(--winui-AliasUpper); }' }],
		sites: 1
	},
	{
		// A custom property name *is* case-sensitive, unlike everything around it, so the two
		// flags above must not be read as "case does not matter here".
		name: 'a token name differing only in case is a different token',
		files: [{ path: 'a.css', text: '.x { border-color: var(--winui-GRAD); }' }],
		sites: 0
	},
	{
		// `--winui-*` is one namespace across the repository, so a component that defines one
		// is answerable wherever it is read. Every other custom property is the file's own,
		// which the row after "the same name in another file" covers — this is that rule's
		// positive, and without it the gate could drop the distinction and stay green.
		name: 'a --winui- token defined by one component is seen from another file',
		files: [
			{ path: 'a.css', text: '.x { --winui-Local: linear-gradient(red, blue); }' },
			{ path: 'b.css', text: '.y { border-color: var(--winui-Local); }' }
		],
		sites: 1
	},
	{
		// Every `var()` in a value is examined, not just the first. The fallback row above puts
		// the gradient in the first read, so a gate looking only there passes it — and the shape
		// this misses, `var(--supplied, var(--winui-Token))`, is how three components in this
		// library write a caller-overridable brush.
		name: 'a gradient reached through the second read of a value is found',
		files: [
			{ path: 'a.css', text: '.x { border-color: var(--winui-Absent, var(--winui-Grad)); }' }
		],
		sites: 1
	},
	{
		// Terminates, rather than recursing until the stack goes. The assertion is that this
		// returns at all; deleting the `seen` guard turns it into a RangeError.
		name: 'a cycle in the alias chain is not a gradient and does not hang',
		files: [{ path: 'a.css', text: '.x { border-color: var(--winui-CycleA); }' }],
		sites: 0
	},
	{
		name: 'a commented-out declaration is not a declaration',
		files: [{ path: 'a.css', text: '.x { /* border-color: var(--winui-Grad); */ color: red; }' }],
		sites: 0
	},
	{
		name: "a Svelte component's style block is where its CSS is",
		files: [
			{
				path: 'a.svelte',
				text: '<div style="border-color: var(--winui-Grad)"></div>\n<style>\n\t.x {\n\t\tfill: var(--winui-Grad);\n\t}\n</style>'
			}
		],
		sites: 1
	},
	{
		// The near-miss for the row above, and the one that separates reading `<style>` bodies
		// from reading the file. Neither implementation sees the `style` attribute there — the
		// brace walker is back at depth zero by the time it reaches one — so that row alone
		// passes either way. CSS written outside a `<style>` block is what tells them apart,
		// and it is also the scope this gate states: a component that builds a rule in a string
		// is markup to it, not a stylesheet.
		name: 'CSS-looking text outside a style block is not a stylesheet',
		files: [
			{
				path: 'a.svelte',
				text: '<script>\n\tconst css = `\n\t\t.x {\n\t\t\tborder-color: var(--winui-Grad);\n\t\t}\n\t`;\n</script>\n\n<div></div>'
			}
		],
		sites: 0
	}
];

for (const { name, files, sites } of CASES)
	test(`C14 over text: ${name}`, async () => {
		const {
			sitesIn
		}: {
			sitesIn: typeof import('../../scripts/conformance/c14-gradient-in-colour-property.mjs').sitesIn;
		} = await import('../../scripts/conformance/c14-gradient-in-colour-property.mjs');
		const found = sitesIn(LAYER, files);
		expect(
			found.sites,
			`expected ${sites} site(s), got ${JSON.stringify(found.sites)}`
		).toHaveLength(sites);
	});

// The two tests below compose a fixture's expected prefix from its path and its line rather
// than writing the pair as one literal, and that is C12's doing rather than style. C12 reads a
// file name followed by a colon and a number as a citation into this tree and fails when
// nothing is called that — which is exactly what it is for, and it has no exemption, so the
// alternative to composing the string is a gate that cannot tell a citation from an expected
// value. A name with no line after it is not read, so the two constants below pass it while
// still saying plainly what they are. (This comment is written the same way for the same
// reason: spelling the example out would trip the gate it describes.)
const CSS_FIXTURE = 'a.css';
const SVELTE_FIXTURE = 'a.svelte';

/** The `<path>:<line>` a site opens with, which is what these two tests are about. */
const where = (site: string) => site.split('  ')[0];

test('C14 over text: a site names the declaration, not the line its value wrapped onto', async () => {
	const { sitesIn } = await import('../../scripts/conformance/c14-gradient-in-colour-property.mjs');
	// `border-color` opens on the third line; `--winui-Grad` is not written until the fifth. The
	// offset a site reports is the declaration's, which is the line a reader wants to open.
	const [site] = sitesIn(LAYER, [
		{
			path: CSS_FIXTURE,
			text: '/* one */\n.x {\n\tborder-color:\n\t\tvar(\n\t\t\t--winui-Grad\n\t\t);\n}'
		}
	]).sites;
	expect(where(site)).toBe(`${CSS_FIXTURE}:3`);
	expect(site).toContain('border-color reads --winui-Grad');
	expect(site).toContain('linear-gradient');
});

test('C14 over text: the counts a passing run reports are the ones it examined', async () => {
	const { sitesIn } = await import('../../scripts/conformance/c14-gradient-in-colour-property.mjs');
	// `guarded` and `holding` are what a green run prints — "920 declarations … in 110 of the
	// 281 files scanned" — and nothing else asserts them, so a gate that never counted would
	// report zero and still pass. `holding` is the files carrying one, which is not the files
	// opened: `b.css` here has a colour property and `c.css` has none.
	const { sites, guarded, holding } = sitesIn(LAYER, [
		{ path: 'a.css', text: '.x { border-color: var(--winui-Flat); color: var(--winui-Flat); }' },
		{ path: 'b.css', text: '.y { fill: var(--winui-Flat); }' },
		{ path: 'c.css', text: '.z { margin: 0; }' }
	]);
	expect(sites).toHaveLength(0);
	expect(guarded).toBe(3);
	expect([...holding].sort()).toEqual(['a.css', 'b.css']);
});

test('C14 over text: the Svelte style block keeps its offset in the file', async () => {
	const { sitesIn } = await import('../../scripts/conformance/c14-gradient-in-colour-property.mjs');
	const [site] = sitesIn(LAYER, [
		{
			path: SVELTE_FIXTURE,
			text: '<div></div>\n\n<style>\n\t.x {\n\t\tcolor: var(--winui-Grad);\n\t}\n</style>'
		}
	]).sites;
	// Joined rather than templated: C16 reads a colon-number after the held file this test
	// imports as a position cited into it, and the template sat inside that window.
	expect(where(site)).toBe([SVELTE_FIXTURE, 5].join(':'));
});
