import { expect, test } from '@playwright/test';

/**
 * The text half of `C16`. Its matcher is C15's `citationsIn`, which
 * `generated-line-citation.spec.ts` already plants every spelling and evasion against, so what
 * is here is only what C16 adds: which names it watches, and that the set comes from the tree.
 *
 * **Nothing here writes a file name followed by a position**, for the reason that spec gives:
 * this file is in the tree, and C16 watches its own name as well. Every pair is composed from
 * `citation` below.
 */

const COLON = ':';
const citation = (file: string, line: number) => `${file}${COLON}${line}`;
const FIXTURE = 'a.md';

/** One name per kind of file the set has to decide about, and one per walked root. */
const AUTHORED = 'Button.svelte';
const RECORD = 'winui-gallery-shell.json';
const SPEC = 'fonts.spec.ts';
const FRAME = 'CopyButton.svelte';
const SCRIPT = 'manifest.mjs';
const DOCUMENT = 'plan.md';
const GENERATED = 'tokens.css';
const PINNED = 'generic.xaml';
const SHARED = 'README.md';
const SHARED_TOO = 'LICENSE';

const gate = () =>
	import('../../scripts/conformance/c16-own-line-citations.mjs') as Promise<
		typeof import('../../scripts/conformance/c16-own-line-citations.mjs')
	>;
const matcher = () =>
	import('../../scripts/conformance/c15-generated-line-citations.mjs') as Promise<
		typeof import('../../scripts/conformance/c15-generated-line-citations.mjs')
	>;

test('C16 over the tree: the set it watches is what the repository holds, less the pin', async () => {
	const { held } = await gate();
	const own = await held();
	// One file from each of the six walked roots — the library, a record under `data/` (the
	// backlog C15 named), a spec, the Gallery's frame, a script and a document — so a root
	// dropped from the walk loses a name here rather than only thinning the counts below.
	for (const name of [AUTHORED, RECORD, SPEC, FRAME, SCRIPT, DOCUMENT])
		expect(own.has(name), name).toBe(true);
	// C15 answers for the generated three, and a name both the tree and the pin carry cannot say
	// which copy it means. The two shared names are what hold the pin subtraction: a name only
	// the pin carries is absent whether or not `held()` subtracts, because `.upstream` is not a
	// walked root, so `PINNED` says that and nothing more.
	for (const name of [GENERATED, SHARED, SHARED_TOO, PINNED])
		expect(own.has(name), name).toBe(false);
});

const CASES: { name: string; text: string; sites: number }[] = [
	{
		name: 'a position in an authored file is a citation',
		text: `see ${citation(AUTHORED, 117)}.`,
		sites: 1
	},
	{
		name: 'a position in a data record is a citation',
		text: `the group (${citation(RECORD, 645)}).`,
		sites: 1
	},
	{
		name: 'a position elided after a held name is the same citation',
		text: `${AUTHORED}'s border and radius (${citation('', 107)}, ${citation('', 109)}) are the defaults.`,
		sites: 2
	},
	{
		name: 'a position in a pin-only name is not, since the pin is never walked',
		text: `set at ${citation(PINNED, 1527)}.`,
		sites: 0
	},
	{
		name: 'a position in a name the pin shares is not',
		text: `step ${citation(SHARED, 3)}.`,
		sites: 0
	},
	{
		name: 'a position in generated output is left to C15',
		text: `at ${citation(GENERATED, 904)}.`,
		sites: 0
	},
	{
		name: 'a held name with no position is a mention, not a site',
		text: `see ${AUTHORED}'s \`.root\`.`,
		sites: 0
	}
];

for (const { name, text, sites } of CASES)
	test(`C16 over text: ${name}`, async () => {
		const [{ held }, { citationsIn }] = await Promise.all([gate(), matcher()]);
		const found = citationsIn(
			await held(),
			[{ path: FIXTURE, text }],
			'a file this repository holds'
		);
		expect(found.sites, JSON.stringify(found.sites)).toHaveLength(sites);
	});

test('C16 over the tree: the gate is still looking at it', async () => {
	const { run } = await gate();
	const result = await run();
	// The liveness half, as in C15's spec: a gate that had stopped reading would pass too.
	expect(result.status).toBe('pass');
	const counted = /^(\d+) mention\(s\) of (\d+) held file\(s\), across (\d+) source file\(s\)/.exec(
		result.detail
	);
	expect(counted, `unreadable detail: ${result.detail}`).not.toBeNull();
	expect(Number(counted![1])).toBeGreaterThan(1000);
	expect(Number(counted![2])).toBeGreaterThan(600);
	expect(Number(counted![3])).toBeGreaterThan(400);
});
