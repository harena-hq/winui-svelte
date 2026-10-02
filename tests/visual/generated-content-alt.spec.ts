/**
 * `C18` over text, over the tree, and on the dev pages.
 *
 * A glyph drawn by CSS generated content is part of the accessible name computed from an
 * element's contents. `content: X / ''` paints the glyph and contributes nothing to that name.
 * The cases below are the rule over text, the gate as wired against this tree, and the names
 * measured on the Gallery's dev routes once the glyph is no longer part of them.
 */

import { expect, test } from './fixtures';

const c18 = () =>
	import('../../scripts/conformance/c18-generated-content-alt.mjs') as Promise<
		typeof import('../../scripts/conformance/c18-generated-content-alt.mjs')
	>;

/** The location a site opens with, kept apart from the message that follows it. */
const where = (site: string) => site.split('  ')[0];

type Source = { path: string; text: string };
type Expected = { path: string; line: number; value: string };
type Case = {
	name: string;
	sources: Source[];
	sites: Expected[];
	drawing?: number;
	holding?: string[];
};

const CASES: Case[] = [
	{
		name: 'a glyph with no alternative text fails',
		sources: [{ path: 'a.css', text: ".a::after { content: '\\e73e'; }" }],
		sites: [{ path: 'a.css', line: 1, value: "'\\e73e'" }]
	},
	{
		name: "the same with / '' passes",
		sources: [{ path: 'a.css', text: ".a::after { content: '\\e73e' / ''; }" }],
		sites: [],
		drawing: 1
	},
	{
		name: 'a var() with alternative text passes',
		sources: [{ path: 'a.css', text: ".a::after { content: var(--winui-X) / ''; }" }],
		sites: []
	},
	{
		name: 'a var() without it fails',
		sources: [{ path: 'a.css', text: '.a::after { content: var(--winui-X); }' }],
		sites: [{ path: 'a.css', line: 1, value: 'var(--winui-X)' }]
	},
	{
		name: 'empty and keyword values draw nothing',
		sources: [
			{
				path: 'a.css',
				text: '.a { content: \'\'; content: ""; content: none; content: NORMAL; }'
			}
		],
		sites: [],
		drawing: 0
	},
	{
		name: 'a slash inside a string is not alternative text',
		sources: [{ path: 'a.css', text: ".a::after { content: '/'; }" }],
		sites: [{ path: 'a.css', line: 1, value: "'/'" }]
	},
	{
		// Unquoted, so only the parentheses keep this slash from reading as alternative text.
		name: 'a slash inside parentheses is not alternative text',
		sources: [{ path: 'a.css', text: '.a::after { content: url(icons/check.svg); }' }],
		sites: [{ path: 'a.css', line: 1, value: 'url(icons/check.svg)' }]
	},
	{
		name: 'an escaped quote does not end the string',
		sources: [{ path: 'a.css', text: ".a::after { content: 'it\\'s / here'; }" }],
		sites: [{ path: 'a.css', line: 1, value: "'it\\'s / here'" }]
	},
	{
		name: '!important is not the value',
		sources: [
			{
				path: 'a.css',
				text: ".a::after { content: '\\e73e' / '' !important; }\n.b::after { content: '\\e73e' !important; }"
			}
		],
		sites: [{ path: 'a.css', line: 2, value: "'\\e73e'" }]
	},
	{
		// Here the stripping decides the outcome: left on, `none !important` reads as drawing.
		name: '!important does not make a value that draws nothing draw',
		sources: [
			{
				path: 'a.css',
				text: ".a { content: none !important; content: '' ! important; content: NORMAL!IMPORTANT; }"
			}
		],
		sites: [],
		drawing: 0
	},
	{
		name: 'a CSS-wide keyword draws nothing',
		sources: [
			{
				path: 'a.css',
				text: '.a { content: initial; content: inherit; content: unset; content: revert; content: Revert-Layer; }'
			}
		],
		sites: [],
		drawing: 0
	},
	{
		name: 'non-empty alternative text passes',
		sources: [{ path: 'a.css', text: ".a::after { content: '\\e73e' / 'Checked'; }" }],
		sites: []
	},
	{
		name: 'a custom property is not content',
		sources: [{ path: 'a.css', text: ".a { --glyph: '\\e73e'; }" }],
		sites: [],
		drawing: 0
	},
	{
		name: "a Svelte file's style block keeps its offset",
		sources: [
			{
				path: 'a.svelte',
				text: "<div></div>\n\n<style>\n\t.x::after {\n\t\tcontent: '\\e73e';\n\t}\n</style>"
			}
		],
		sites: [{ path: 'a.svelte', line: 5, value: "'\\e73e'" }]
	},
	{
		// The declaration sits in the template, inside braces, and outside any style element. A
		// scan of the whole file would report it; a scan of style blocks does not.
		name: 'markup outside a style block is ignored',
		sources: [
			{
				path: 'a.svelte',
				text: "<div>\n\t.a::after { content: '\\e73e'; }\n</div>"
			}
		],
		sites: []
	},
	{
		name: 'holding counts files, not declarations',
		sources: [
			{ path: 'a.css', text: ".a { content: '\\e73e'; content: '\\e70d'; }" },
			{ path: 'b.css', text: '.b { content: var(--winui-X); }' }
		],
		sites: [
			{ path: 'a.css', line: 1, value: "'\\e73e'" },
			{ path: 'a.css', line: 1, value: "'\\e70d'" },
			{ path: 'b.css', line: 1, value: 'var(--winui-X)' }
		],
		drawing: 3,
		holding: ['a.css', 'b.css']
	}
];

for (const { name, sources, sites, drawing, holding } of CASES)
	test(`C18 over text: ${name}`, async () => {
		const found = (await c18()).sitesIn(sources);
		const expected = sites.map(
			({ path, line, value }) =>
				`${[path, line].join(':')}  content: ${value} states no alternative text`
		);
		expect(found.sites).toEqual(expected);
		for (const [index, site] of found.sites.entries())
			expect(where(site)).toBe([sites[index].path, sites[index].line].join(':'));
		if (drawing !== undefined) expect(found.drawing).toBe(drawing);
		if (holding) expect([...found.holding].sort()).toEqual([...holding].sort());
	});

test('C18 over the tree: run() passes', async () => {
	const result = await (await c18()).run();
	expect(result.status).toBe('pass');
});

test('C18 over the tree: the gate list contains C18', async () => {
	const { GATES } = await import('../../scripts/conformance/gates.mjs');
	expect(GATES.map((gate) => gate.id)).toContain('C18');
});

type Role = 'button' | 'checkbox' | 'option' | 'treeitem';

const ROWS: { route: string; checks: [Role, string, number][] }[] = [
	{ route: '/dev/check-box', checks: [['checkbox', 'Checked', 1]] },
	{ route: '/dev/check-box', checks: [['checkbox', 'Indeterminate', 1]] },
	{ route: '/dev/check-box', checks: [['checkbox', 'Disabled checked', 1]] },
	{ route: '/dev/check-box', checks: [['checkbox', 'Disabled indeterminate', 1]] },
	{ route: '/dev/expander', checks: [['button', 'This text is in the header', 7]] },
	{ route: '/dev/tree-view', checks: [['treeitem', 'Work Documents', 4]] },
	{ route: '/dev/tree-view', checks: [['treeitem', 'Personal Documents', 4]] },
	{ route: '/dev/tree-view', checks: [['treeitem', 'Quarterly Reports', 2]] },
	{ route: '/dev/color-picker', checks: [['button', 'More', 1]] },
	{ route: '/dev/control-example', checks: [['button', 'Source code', 6]] },
	{ route: '/dev/items-view', checks: [['option', '1. One', 6]] },
	{ route: '/dev/items-view', checks: [['option', '4. Four', 6]] },
	{ route: '/dev/items-view', checks: [['option', '5. Five', 6]] }
];

test.describe('a glyph is not part of the name', () => {
	for (const { route, checks } of ROWS)
		test(`${route} ${checks.map(([, name]) => name).join(', ')}`, async ({ page }) => {
			await page.goto(route);
			for (const [role, name, count] of checks)
				await expect(page.getByRole(role, { name, exact: true })).toHaveCount(count);
		});
});

/**
 * The other half of the names above. An engine that does not parse `X / ''` drops the whole
 * declaration, and the glyph is then out of the name because it is not drawn at all — which the
 * names cannot tell from the fix. So each component the names cover must still compute a
 * glyph into the pseudo-element that draws it.
 */
const PAINTS: [route: string, selector: string][] = [
	['/dev/check-box', '.box'],
	['/dev/expander', '.chevron'],
	['/dev/tree-view', '.chevron'],
	['/dev/color-picker', '.more-glyph'],
	['/dev/items-view', '.checkbox']
];

test.describe('the glyph is still drawn', () => {
	for (const [route, selector] of PAINTS)
		test(`${route} ${selector}`, async ({ page }) => {
			await page.goto(route);
			const contents = await page
				.locator(selector)
				.evaluateAll((els) =>
					els.flatMap((el) => [
						getComputedStyle(el, '::before').content,
						getComputedStyle(el, '::after').content
					])
				);
			expect(contents.some((c) => /[\ue000-\uf8ff]/u.test(c))).toBe(true);
		});
});
