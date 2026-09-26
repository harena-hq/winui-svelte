import { basename, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, fail, pass, read, walk } from './lib.mjs';
import { GATES } from './gates.mjs';

export const id = 'C17';
export const title = 'the gate list is every gate file, in order, and keyboard.md names it';

// Nothing checked the list before this gate. `pnpm conform` runs what `gates.mjs` holds and
// counts what it ran, so a line deleted from the list shortened the suite with every remaining
// gate green and the summary counting the shorter list as whole. The documents drifted the same
// way: `docs/keyboard.md`'s apparatus row read `C1–C11` through the two commits that wired C12
// and C13, and nothing noticed.
//
// So the list is held to what the same slip does not delete: the files. Every `c<N>-*.mjs`
// beside this one is a gate. It has to declare `id` `C<N>`, no two may take one number, the
// list has to hold every one of them and nothing else, and it has to run `C1` to `C<n>` in
// order with no gap. `keyboard.md` then has to carry exactly one row whose first cell is
// `C1–C<n>`.
//
// What it cannot see. The last gate removed together with its file, its entry and a step of the
// row leaves a shorter suite that agrees with itself; any earlier one leaves a gap, which is
// named. Today the last gate is this one, and `tests/visual/gate-list.spec.ts` imports it by
// name, so the battery fails instead — for as long as that spec is kept. A gate removed from the
// list alone is named here unless it is this gate, which `pnpm conform` then never runs; the
// same spec runs it directly for that reason. A file not named `c<N>-*.mjs` is not a gate to it,
// and membership is read by `id`, so an entry imported from another module that declares the
// right `id` passes. Of `keyboard.md` it requires one line that opens a table row with `C1–C<n>`
// and reads that number: the row's descriptions, and `docs/plan.md`'s paragraph naming the gates
// after C10, are kept by hand.

export const GATE_FILE = /^c(\d+)-.+\.mjs$/;

/**
 * `gates` is the list as run (objects with `id` and `run`), `files` is every gate file as
 * `{ name, id }` (`name` a basename matching `GATE_FILE`, `id` whatever that module exports),
 * `table` is the text of `docs/keyboard.md`.
 *
 * @param {{ id?: unknown, run?: unknown }[]} gates
 * @param {{ name: string, id: unknown }[]} files
 * @param {string} table
 * @returns {string[]}
 */
export function problems(gates, files, table) {
	const n = gates.length;
	/** @type {string[]} */
	const found = [];

	for (let i = 0; i < n; i++) {
		if (gates[i].id !== `C${i + 1}`)
			found.push(`position ${i + 1} of the list is ${String(gates[i].id)}, not C${i + 1}`);
	}

	for (const gate of gates) {
		if (typeof gate.run !== 'function') found.push(`${String(gate.id)} has no run()`);
	}

	/** @type {Map<number, string[]>} */
	const byNumber = new Map();
	for (const file of files) {
		const captured = GATE_FILE.exec(file.name);
		const k = captured ? Number(captured[1]) : NaN;
		if (file.id !== `C${k}`) found.push(`${file.name} declares ${String(file.id)}, not C${k}`);
		if (!gates.some((gate) => gate.id === `C${k}`)) found.push(`${file.name} is not in the list`);
		if (captured) {
			const names = byNumber.get(k);
			if (names) names.push(file.name);
			else byNumber.set(k, [file.name]);
		}
	}

	for (const gate of gates) {
		if (!files.some((file) => file.id === gate.id))
			found.push(`${String(gate.id)} is in the list and no c<N>-*.mjs file declares it`);
	}

	for (const k of [...byNumber.keys()].sort((a, b) => a - b)) {
		const names = byNumber.get(k) ?? [];
		if (names.length > 1) found.push(`more than one file takes number ${k}: ${names.join(', ')}`);
	}

	const rows = [...table.matchAll(/^\|\s*C1–C(\d+)\s*\|/gm)];
	const count = rows.length;
	if (count !== 1) {
		found.push(`keyboard.md has ${count} row(s) whose first cell is C1–C<n>, not one`);
	} else {
		const captured = Number(rows[0][1]);
		if (captured !== n)
			found.push(`keyboard.md's row reads C1–C${captured}, and the list ends at C${n}`);
	}

	return found;
}

export async function run() {
	const paths = await walk('scripts/conformance', (name) => GATE_FILE.test(name));
	const files = [];
	for (const path of paths) {
		const module = await import(pathToFileURL(join(ROOT, path)).href);
		files.push({ name: basename(path), id: module.id });
	}
	files.sort((a, b) => {
		const ka = Number(GATE_FILE.exec(a.name)[1]);
		const kb = Number(GATE_FILE.exec(b.name)[1]);
		return ka - kb || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
	});

	const table = await read('docs/keyboard.md');
	const found = problems(GATES, files, table);
	if (found.length) return fail("the gate list, its files and keyboard.md's row disagree", found);
	return pass(
		`${GATES.length} gate(s) listed, ${files.length} gate file(s), and ` +
			`keyboard.md's row reads C1–C${GATES.length}`
	);
}
