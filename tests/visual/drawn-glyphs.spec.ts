/**
 * `C19` over text and over the tree.
 *
 * Every private-use code point a component writes for itself has to be a `DRAWN` row of the
 * fallback face's table, and every `DRAWN` row has to be one a component writes. The cases below
 * are each form a point is read in, the comments that are not read, the tokens that are, and
 * both directions of the rule.
 */

import { expect, test } from './fixtures';

const c19 = () =>
	import('../../scripts/conformance/c19-drawn-glyphs-have-a-fallback.mjs') as Promise<
		typeof import('../../scripts/conformance/c19-drawn-glyphs-have-a-fallback.mjs')
	>;

type Case = {
	name: string;
	sources: { path: string; text: string }[];
	tokens?: string;
	drawn?: string[];
	points: string[];
	sites: string[];
};

const CASES: Case[] = [
	{
		name: 'each written form is read',
		sources: [
			{
				path: 'A.svelte',
				text: [
					"const a = '\\uE711';",
					"const b = '\\u{E712}';",
					'<span>&#xE713;</span>',
					"<style>.x::after { content: '\\e714' / ''; } .y::after { content: '\\00e715' / ''; }</style>",
					'String.fromCodePoint(0xe716);',
					'<Icon glyph="E717" />'
				].join('\n')
			}
		],
		points: ['E711', 'E712', 'E713', 'E714', 'E715', 'E716', 'E717'],
		sites: [
			'U+E711  has no DRAWN row, drawn by A.svelte',
			'U+E712  has no DRAWN row, drawn by A.svelte',
			'U+E713  has no DRAWN row, drawn by A.svelte',
			'U+E714  has no DRAWN row, drawn by A.svelte',
			'U+E715  has no DRAWN row, drawn by A.svelte',
			'U+E716  has no DRAWN row, drawn by A.svelte',
			'U+E717  has no DRAWN row, drawn by A.svelte'
		]
	},
	{
		name: 'a point that is a DRAWN row passes',
		sources: [{ path: 'A.svelte', text: "const a = '\\uE711';" }],
		drawn: ['E711'],
		points: ['E711'],
		sites: []
	},
	{
		name: 'code after a URL on the same line is still read',
		sources: [{ path: 'A.svelte', text: "const u = 'https://a.b'; const g = '\\uE711';" }],
		points: ['E711'],
		sites: ['U+E711  has no DRAWN row, drawn by A.svelte']
	},
	{
		name: 'a /* inside a // comment hides nothing after the line',
		sources: [{ path: 'A.svelte', text: "// a */Right/*Left b\nconst g = '\\uE711';\n/* c */" }],
		points: ['E711'],
		sites: ['U+E711  has no DRAWN row, drawn by A.svelte']
	},
	{
		name: 'a // inside a block comment does not end it early',
		sources: [{ path: 'A.svelte', text: "/* see // here */ const g = '\\uE711';" }],
		points: ['E711'],
		sites: ['U+E711  has no DRAWN row, drawn by A.svelte']
	},
	{
		name: 'a supplementary-plane escape is not read as a BMP point',
		sources: [{ path: 'A.svelte', text: "const a = '\\u{F0000}'; const b = '\\u{00E711}';" }],
		points: ['E711'],
		sites: ['U+E711  has no DRAWN row, drawn by A.svelte']
	},
	{
		name: 'a point a comment names is not read',
		sources: [
			{
				path: 'A.svelte',
				text: [
					"/** A code point as uppercase hex, e.g. `'E790'`. */",
					'<!-- `Glyph="&#xE915;"` on the CheckGlyph -->',
					"// '\\uE711' was the old glyph",
					"/* c1-allow: CollapsedGlyph defaults to \\E76C */ const x = 'https://a.b/c';"
				].join('\n')
			}
		],
		points: [],
		sites: []
	},
	{
		name: 'a point outside the private use area is not read',
		sources: [{ path: 'A.svelte', text: "const a = '\\u00e9'; const b = 0x2014;" }],
		points: [],
		sites: []
	},
	{
		name: 'a lower-case hex string is not a glyph prop',
		sources: [{ path: 'A.svelte', text: "const id = 'e711';" }],
		points: [],
		sites: []
	},
	{
		name: "a token's one-character value is read where a component reads the token",
		sources: [
			{
				path: 'A.svelte',
				text: "<style>.x::after { content: var(--winui-CheckBoxCheckedGlyph) / ''; }</style>"
			}
		],
		tokens: [
			"\t--winui-CheckBoxCheckedGlyph: '\\00e73e';",
			'\t--winui-CheckBoxIndeterminateGlyph: "\\00e9ae";',
			"\t--winui-CheckBoxCheckedGlyphSize: '\\00e9af';",
			"\t--winui-Family: 'Segoe Fluent Icons';",
			'\tunicode-range: U+E700;'
		].join('\n'),
		points: ['E73E'],
		sites: ['U+E73E  has no DRAWN row, drawn by A.svelte']
	},
	{
		name: 'a component reading a longer token name does not read the shorter one',
		sources: [{ path: 'A.svelte', text: 'width: var(--winui-CheckBoxCheckedGlyphSize);' }],
		tokens: "\t--winui-CheckBoxCheckedGlyph: '\\00e73e';",
		points: [],
		sites: []
	},
	{
		name: 'a double-quoted token value is read',
		sources: [{ path: 'A.svelte', text: 'content: var(--winui-X);' }],
		tokens: '\t--winui-X: "\\00e9ae";',
		points: ['E9AE'],
		sites: ['U+E9AE  has no DRAWN row, drawn by A.svelte']
	},
	{
		name: 'a DRAWN row no component draws fails',
		sources: [{ path: 'A.svelte', text: "const a = '\\uE711';" }],
		drawn: ['E711', 'E712'],
		points: ['E711'],
		sites: ['U+E712  is a DRAWN row and no component draws it']
	},
	{
		name: 'the files drawing a point are each named, once',
		sources: [
			{ path: 'B.svelte', text: "const a = '\\uE711'; const b = '\\uE711';" },
			{ path: 'A.svelte', text: '<span>&#xE711;</span>' }
		],
		points: ['E711'],
		sites: ['U+E711  has no DRAWN row, drawn by A.svelte, B.svelte']
	}
];

for (const { name, sources, tokens = '', drawn = [], points, sites } of CASES)
	test(`C19 over text: ${name}`, async () => {
		const found = (await c19()).sitesIn(sources, tokens, new Set(drawn));
		expect([...found.points.keys()].sort()).toEqual(points);
		expect(found.sites).toEqual(sites);
	});

test('C19 over the tree: run() passes', async () => {
	const result = await (await c19()).run();
	expect(result.status).toBe('pass');
});

test('C19 over the tree: the gate list contains C19', async () => {
	const { GATES } = await import('../../scripts/conformance/gates.mjs');
	expect(GATES.map((gate) => gate.id)).toContain('C19');
});
