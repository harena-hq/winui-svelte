import { expect, test } from '@playwright/test';

/**
 * The text half of `C15`, which is all of it: the gate reads source as text and has no
 * renderer to disagree with. Each case below is a planted violation or the near-miss beside
 * it, handed to the gate's own `citationsIn` rather than written into the tree — a fixture
 * that violated the rule where the gate could see it would fail the run it is meant to
 * describe.
 *
 * **Nothing here writes a file name followed by a position.** `C15` reads that as the defect
 * itself, wherever in the tree it is written, and this file is in the tree. (`C12` would not
 * fire — it asks only whether a cited line exists, and every line these fixtures name does —
 * so `C15` is the whole of the reason.) Every fixture composes the pair from `citation`,
 * `hostLink` or `spelled` below, and this comment is written the same way for the same reason.
 */

const LAYER = 'tokens.css';
const RAMP = 'type-ramp.css';
const SYMBOLS = 'symbol.ts';
const AUTHORED = 'Button.svelte';
const PINNED = 'generic.xaml';
const FIXTURE = 'a.md';

/** The three spellings of a position, composed at run time so this file never carries one. */
const COLON = ':';
const citation = (file: string, line: number) => `${file}${COLON}${line}`;
const hostLink = (file: string, line: number) => `${file}#L${line}`;
const spelled = (file: string, line: number) => `${file}, line ${line}`;

/** The `<path>:<line>` prefix a site opens with, composed for the same reason. */
const where = (line: number) => citation(FIXTURE, line);

const gate = () =>
	import('../../scripts/conformance/c15-generated-line-citations.mjs') as Promise<
		typeof import('../../scripts/conformance/c15-generated-line-citations.mjs')
	>;

/** Only the token layer, so a case can say plainly which name it expects to be watched. */
const ONE = new Set([LAYER]);

const CASES: { name: string; text: string; sites: number; generated?: Set<string> }[] = [
	{
		name: 'the number attached to the name is the citation',
		text: `The brush is a gradient in the layer (${citation(LAYER, 904)}).`,
		sites: 1
	},
	{
		name: 'the continuations elided to a bare number are the same citation',
		text: `a gradient at ${citation(LAYER, 904)}, ${citation('', 3102)} and ${citation('', 5057)} and flat at ${citation('', 6969)}.`,
		sites: 4
	},
	{
		// The bound that keeps the window from swallowing a number the reader resolves from a
		// different name three clauses later. Every elision measured in the tree was inside the
		// citing sentence; none needed more.
		name: 'a number in the next sentence is not this citation',
		text: `the layer emits it (${citation(LAYER, 904)}). The template writes it at ${citation('', 12)}.`,
		sites: 1
	},
	{
		name: 'a number after another file name belongs to that file',
		text: `${LAYER} mirrors what ${citation(AUTHORED, 71)} describes`,
		sites: 0
	},
	{
		// The evasion a reviewer reaches for first: the citation stops being a bare basename.
		// The pattern anchors on the last path segment, so it is the same citation.
		name: 'a path in front of the name does not hide it',
		text: `see packages/winui-svelte/src/lib/tokens/${citation(LAYER, 904)} for the value`,
		sites: 1
	},
	{
		// The trap C12 is exposed to and this gate has two guards against: an alternation ordered
		// `cs` before `css`, with nothing closing the extension, matches the layer's own name as
		// far as `.cs` — not a generated file, so every citation into it passes. Here the
		// alternation is longest-first *and* a word boundary closes it, and the mutation round
		// says what that costs: removing either one alone leaves this case passing, and only
		// removing both fails it.
		name: 'the short extension does not win the match',
		text: `the ramp is generated too (${citation(RAMP, 40)})`,
		sites: 1,
		generated: new Set([RAMP])
	},
	{
		name: 'a generated TypeScript file is watched as readily as a stylesheet',
		text: `the glyph for Accept is at ${citation(SYMBOLS, 31)}`,
		sites: 1,
		generated: new Set([SYMBOLS])
	},
	{
		// One case, not two, and the name says why: the gate has no notion of *authored* against
		// *pinned*. Membership of the watched set is the whole of the test it applies, so a case
		// per reason would be one mechanism asserted twice under two names.
		name: 'a name outside the watched set is not this rule, whatever the reason',
		text: `the technique is at ${citation(AUTHORED, 117)} and the setter at ${citation(PINNED, 1527)}`,
		sites: 0
	},
	{
		// The idiom a link from a code host carries. Reading only the colon form would have left
		// this as the way around the rule, which is why the pattern reads three spellings.
		name: 'a code host link is the same position',
		text: `the brush is at ${hostLink(LAYER, 904)}`,
		sites: 1
	},
	{
		name: 'ordinary English spells the position out and is still one',
		text: `see ${spelled(LAYER, 904)} for the value`,
		sites: 1
	},
	{
		// The plural, as a range reads. The head carries the prefix and the tail does not, so one
		// site is what a reader gets — the same accounting as the colon range below.
		name: 'a plural range is caught by its head',
		text: `the two delays are at ${LAYER}, lines ${1333} and ${1334}`,
		sites: 1
	},
	{
		// **Three limits, planted so they are recorded rather than assumed.** Each is a shape the
		// gate lets through by design, and each is named in the gate's own header; a case here is
		// what stops one of them being closed by accident and the header going quietly stale.
		name: 'a position written before the name is not reached',
		text: `the gradient is at line ${904} of ${LAYER}`,
		sites: 0
	},
	{
		name: 'another file name between the two resets the window',
		text: `${LAYER} — see ${AUTHORED} — at ${citation('', 904)}`,
		sites: 0
	},
	{
		name: 'an abbreviation ends the sentence as far as the bound is concerned',
		text: `${LAYER} emits it, e.g. ${citation('', 904)} is the gradient`,
		sites: 0
	},
	{
		// The near-miss for every case above: a longer basename that *ends* in a watched one is
		// a different file. The leading character class swallows the prefix, so the match is the
		// whole name and it is not in the set — but nothing pinned that until this case.
		name: 'a longer basename ending in a watched one is a different file',
		text: `the record is at ${citation('winui-tokens.css', 904)}`,
		sites: 0
	},
	{
		// **A colon attached to a word is not a position**, and the three shapes below are the
		// ones that would otherwise be reported as one. 4173 is this repository's own preview
		// port, so the first is not hypothetical.
		name: 'a port, a ratio and a clock are not positions',
		text: `${LAYER} is served on localhost${COLON}4173, maps 1${COLON}1 onto its record, and was regenerated at 09${COLON}30`,
		sites: 0
	},
	{
		// The positive control for the row above: the same colon with whitespace in front of it
		// is the elision the rule is for, so the guard cannot be a blanket one.
		name: 'a colon with whitespace in front of it is still the elision',
		text: `a gradient at ${citation(LAYER, 904)}, ${citation('', 3102)} and ${citation('', 5057)}.`,
		sites: 3
	},
	{
		// **The other half of the number guard, and it has to be multi-digit to test anything.**
		// `\d+` backtracks, so a lookahead that rejects only a letter is satisfied one digit
		// short: with `(?![A-Za-z])` this reads `line 12px` as the position `line 1`, and `:904px`
		// as `:90` — a number nobody wrote. A single-digit length passes either way and would have
		// pinned the example instead of the rule.
		name: 'digits running into a word are a length, not a position',
		text: `${LAYER} draws a line ${12}px wide and has a stop at ${COLON}${30}em`,
		sites: 0
	},
	{
		// The positive control for the row above: four digits followed by punctuation are the
		// position the guard must not swallow.
		name: 'digits followed by punctuation are still a position',
		text: `${LAYER} writes it at ${citation('', 904)}, and again later.`,
		sites: 1
	},
	{
		// **A limit the header states and nothing else pinned.** Continuations written without
		// repeating the colon are read as one citation, not three. The head still fails the gate,
		// so nothing gets through — but the site list under-counts what a reader has to fix, and
		// a future widening that fixed it should have to change this number deliberately.
		name: 'continuations without their own colon are counted once',
		text: `a gradient at ${citation(LAYER, 904)}, ${3102} and ${5057}.`,
		sites: 1
	},
	{
		// **A known false positive, pinned rather than hidden.** `line` is an ordinary noun, so a
		// sentence that names a generated file and then a line of source is flagged. The gate's
		// header says so; this case is what stops the header going quietly stale if the spelling
		// is ever narrowed, and what a reader hits first when one fires.
		name: 'an ordinary sentence about a line of source is flagged',
		text: `${LAYER} writes the ramp; the gradient opens on line ${3} and the stop is later.`,
		sites: 1
	},
	{
		name: 'naming the file without a number is what the rule asks for',
		text: `${LAYER} emits ControlElevationBorderBrush as a gradient in both dark blocks.`,
		sites: 0
	},
	{
		// The form `scrollbar-timing.spec.ts` carried: two consecutive lines written as a range.
		// The head is a citation and catching it is enough — nothing can cite the tail alone.
		name: 'a range is caught by its head',
		text: `the two durations (${citation(LAYER, 1249)}-1250) are written in milliseconds`,
		sites: 1
	},
	{
		// The third bound, and the only one no site in the tree exercised. A comment block with
		// no full stop in it would otherwise reach the end of the file looking for one.
		name: 'a sentence that never ends is bounded by the cap',
		text: `${LAYER} ${'and so on '.repeat(30)} at ${citation('', 904)}`,
		sites: 0
	},
	{
		name: 'the same text inside the cap is the citation it looks like',
		text: `${LAYER} ${'and so on '.repeat(5)} at ${citation('', 904)}`,
		sites: 1
	}
];

for (const { name, text, sites, generated } of CASES)
	test(`C15 over text: ${name}`, async () => {
		const { citationsIn } = await gate();
		const found = citationsIn(generated ?? ONE, [{ path: FIXTURE, text }]);
		expect(
			found.sites,
			`expected ${sites} site(s), got ${JSON.stringify(found.sites)}`
		).toHaveLength(sites);
	});

test('C15 over the tree: the set it watches is what the generators emit', async () => {
	const { GENERATED } = await gate();
	const { generate } = await import('../../scripts/tokens/generate.mjs');
	const { generate: generateSymbol } = await import('../../scripts/symbol/generate.mjs');
	// **Against the output, not against the same constants the gate reads.** Comparing
	// `GENERATED` with `OUTPUT`/`RAMP_OUTPUT` would restate one side of the gate with the other:
	// rename either binding and both move together. Running the generators and taking the keys
	// they emit is the independent side, and it catches the two failures that matter — the
	// derived set replaced by a hand-written list that loses an entry, and a generator that
	// begins emitting a fourth file nothing has been told to watch. C2 pays for the same call on
	// every `pnpm conform`; the gate itself must not, which is why it reads the paths instead.
	const emitted = [...Object.keys(await generate()), ...Object.keys(await generateSymbol())];
	expect([...GENERATED].sort()).toEqual(emitted.map((path) => path.split('/').pop()).sort());
});

test('C15 over text: a site names the line the citation is written on', async () => {
	const { citationsIn } = await gate();
	const { sites } = citationsIn(ONE, [
		{ path: FIXTURE, text: `one\ntwo\nthree ${citation(LAYER, 904)}\nfour` }
	]);
	expect(sites).toHaveLength(1);
	expect(sites[0].split('  ')[0]).toBe(where(3));
	expect(sites[0]).toContain('a position in generated output');
});

test('C15 over the tree: the gate is still looking at it', async () => {
	const { run } = await gate();
	const result = await run();
	// The liveness half, and the whole of what a test can say about which files the gate
	// opens. A pure-text suite cannot see `SOURCES` narrow or `CITING` stop matching — the
	// cases above would pass over a gate that scanned nothing — so this runs it over the
	// repository and asserts it came back having read something. **What it does not reach is
	// one root going missing:** drop `docs` and the gate still reads 477 of the 497 files and
	// finds 21 of the 25 mentions, so only a citation landing in the dropped root would say
	// otherwise. That mutation is live and recorded rather than covered.
	expect(result.status).toBe('pass');
	const counted =
		/^(\d+) mention\(s\) of \d+ generated file\(s\), across (\d+) source file\(s\)/.exec(
			result.detail
		);
	expect(counted, `unreadable detail: ${result.detail}`).not.toBeNull();
	expect(Number(counted![1])).toBeGreaterThan(0);
	expect(Number(counted![2])).toBeGreaterThan(400);
});

test('C15 over text: the count a passing run reports is what it examined', async () => {
	const { citationsIn } = await gate();
	// `mentions` is the whole of what a green run prints, so a gate that had stopped looking
	// would report zero mentions and still pass. Three names here, two of them the layer.
	const { sites, mentions } = citationsIn(ONE, [
		{ path: FIXTURE, text: `${LAYER} emits it. ${AUTHORED} reads it. ${LAYER} again.` }
	]);
	expect(sites).toHaveLength(0);
	expect(mentions).toBe(2);
});
