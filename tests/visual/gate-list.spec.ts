import { expect, test } from '@playwright/test';

/**
 * C17 holds the gate list to the `c<N>-*.mjs` files beside it and to the single apparatus row
 * in `docs/keyboard.md` that names the range. Deleting a line from the list used to shorten
 * `pnpm conform` while every gate still on it stayed green.
 *
 * This spec plants those slips against `problems`, and it also runs the gate directly: `pnpm
 * conform` does not run a gate that has been removed from the list, so a removed C17 would
 * otherwise have nothing left to notice.
 */

const c17 = () =>
	import('../../scripts/conformance/c17-gate-list.mjs') as Promise<
		typeof import('../../scripts/conformance/c17-gate-list.mjs')
	>;
const gatesModule = () =>
	import('../../scripts/conformance/gates.mjs') as Promise<
		typeof import('../../scripts/conformance/gates.mjs')
	>;

const gate = (n: number) => ({ id: `C${n}`, run: () => {} });
const file = (n: number, id = `C${n}`, stem = 'x') => ({ name: `c${n}-${stem}.mjs`, id });
const row = (n: number) => `| C1–C${n} | some gates | no |\n`;
const range = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

const CASES: {
	name: string;
	gates: { id?: unknown; run?: unknown }[];
	files: { name: string; id: unknown }[];
	table: string;
	expected: string[];
}[] = [
	{
		name: 'a whole list is quiet',
		gates: range(3).map(gate),
		files: range(3).map((n) => file(n)),
		table: row(3),
		expected: []
	},
	{
		name: 'an entry dropped from the list is named by its file',
		gates: [gate(1), gate(2)],
		files: range(3).map((n) => file(n)),
		table: row(3),
		expected: [
			'c3-x.mjs is not in the list',
			"keyboard.md's row reads C1–C3, and the list ends at C2"
		]
	},
	{
		name: 'a gap in the numbering is a wrong position',
		gates: [gate(1), gate(2), gate(4)],
		files: [file(1), file(2), file(4)],
		table: row(3),
		expected: ['position 3 of the list is C4, not C3']
	},
	{
		name: 'two gates out of order are both named',
		gates: [gate(2), gate(1), gate(3)],
		files: range(3).map((n) => file(n)),
		table: row(3),
		expected: ['position 1 of the list is C2, not C1', 'position 2 of the list is C1, not C2']
	},
	{
		name: 'a file declaring another number is named',
		gates: range(3).map(gate),
		files: [file(1), file(2), file(3, 'C4')],
		table: row(3),
		expected: [
			'c3-x.mjs declares C4, not C3',
			'C3 is in the list and no c<N>-*.mjs file declares it'
		]
	},
	{
		name: 'two files taking one number are named',
		gates: range(3).map(gate),
		files: [file(1), file(2), file(2, 'C2', 'y'), file(3)],
		table: row(3),
		expected: ['more than one file takes number 2: c2-x.mjs, c2-y.mjs']
	},
	{
		name: 'a gate with no run() is named',
		gates: [gate(1), { id: 'C2' }, gate(3)],
		files: range(3).map((n) => file(n)),
		table: row(3),
		expected: ['C2 has no run()']
	},
	{
		name: 'a stale row is named',
		gates: range(3).map(gate),
		files: range(3).map((n) => file(n)),
		table: row(2),
		expected: ["keyboard.md's row reads C1–C2, and the list ends at C3"]
	},
	{
		name: 'a missing row is named',
		gates: range(3).map(gate),
		files: range(3).map((n) => file(n)),
		table: '',
		expected: ['keyboard.md has 0 row(s) whose first cell is C1–C<n>, not one']
	},
	{
		name: 'a hyphen is not the row',
		gates: range(3).map(gate),
		files: range(3).map((n) => file(n)),
		table: '| C1-C3 | some gates | no |\n',
		expected: ['keyboard.md has 0 row(s) whose first cell is C1–C<n>, not one']
	}
];

for (const { name, gates, files, table, expected } of CASES)
	test(`C17 over text: ${name}`, async () => {
		const { problems } = await c17();
		const found = problems(gates, files, table);
		expect(found).toEqual(expected);
	});

test('C17 over the tree: the list, its files and the row agree', async () => {
	const { run } = await c17();
	const result = await run();
	expect(result.status, JSON.stringify(result)).toBe('pass');
	const counted = /^(\d+) gate\(s\) listed, (\d+) gate file\(s\)/.exec(result.detail);
	expect(counted, result.detail).not.toBeNull();
	const listed = Number(counted![1]);
	const present = Number(counted![2]);
	expect(listed).toBe(present);
	expect(listed).toBeGreaterThanOrEqual(17);
});

test('C17 over the tree: this gate is in the list it guards', async () => {
	const { GATES } = await gatesModule();
	expect(GATES.map((g) => g.id)).toContain('C17');
});
