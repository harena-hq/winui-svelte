import { readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { ROOT, fail, pass, read, walk } from './lib.mjs';

export const id = 'C12';
export const title = 'every cited line names a file that has one';

// This repository argues from the pin, and a citation is how it does it. Nothing read one.
//
// Seven were wrong when this gate was written, and none of them was wrong in the way a reader
// would guess. Four named `NumberBox_themeresources.xaml` for a style that is in
// `NumberBox.xaml`, at the line it really is on; one named `CalendarDatePicker.cpp`, which no
// pin contains, for lines that are exactly right in `calendardatepicker_partial.cpp`; two were
// elided to the extension alone, dropping a page name the sentence had already used; and one
// pointed into
// this repository's own `Flyout.svelte` at a line its own later edits had moved. **A right line
// in a wrong file reads exactly like a correct citation**, which is why a person re-reading
// them is not the check.
//
// What is checkable is narrow and is the whole rule: a citation that names a line must name a
// file that has one. Nothing here reads *what* is on that line — a citation can be wrong in
// every way this cannot see, and the gate claims only the one it can.
//
// **A citation with no line number is not checked**, and that is what keeps the gate quiet: the
// pattern would otherwise match `hsv.h`, `bounds.h`, `value.h` and every other property access
// that ends in a source extension. Measured at the time: 10481 candidates without the line
// requirement and 4022 of them unresolvable noise, against 2975 with it and six left over —
// every one of those six a dependency's file, named from a path this tree does not carry.
const CITE =
	/([+A-Za-z0-9_-][+A-Za-z0-9_.-]*\.(?:xaml\.cs|cpp|h|xaml|idl|resw|cs|mjs|ts|js|svelte|css|md|json|txt))(?::(\d+))/g;

// An extension that can only mean this tree or one of the pinned checkouts, all indexed whole,
// so an unresolvable one is a wrong filename. `.svelte` belongs here and a first draft left it
// out: the dependencies whose files get cited ship their Svelte sources compiled, so every one
// of them is named `*.js` or `*.svelte.js`, and the only `.svelte` that resolved nowhere was a
// component this repository had renamed. An unresolvable `.js` or `.ts` is the case this
// cannot separate — it may be a dependency's file, which this tree does not carry and this gate
// does not pretend to check.
const MUST_RESOLVE = /\.(?:cpp|h|xaml|idl|resw|cs|svelte)$/;

const SOURCES = ['packages/winui-svelte/src', 'apps/gallery/src', 'tests', 'scripts', 'docs'];
// Wider than `SOURCES`, and on purpose: a citation names a manifest or a config as readily as
// a component, and those sit at a package's root rather than under its `src`. Narrower roots
// made a line cited in the library's `package.json` read as past the end of every
// `package.json`, because the only one indexed was the smoke consumer's. `walk` skips build
// output and non-source files already.
const INDEXED = ['packages', 'apps', 'tests', 'scripts', 'docs', '.upstream', 'data'];
const CITING = /\.(svelte|ts|js|mjs|css|md)$/;

export async function run() {
	const index = new Map();
	let pinned = 0;
	for (const root of INDEXED) {
		for (const file of await walk(root, () => true)) {
			if (root === '.upstream') pinned++;
			const name = basename(file);
			if (!index.has(name)) index.set(name, []);
			index.get(name).push(file);
		}
	}
	// The pins are the bulk of it, and without them every citation into upstream fails at once
	// — thousands of sites reported as wrong filenames. The sources alone always populate the
	// index, so counting it says nothing; counting what the pins contributed is the check that
	// answers. `pnpm conform` already requires the checkouts for C2 and C8, so this reports the
	// same missing thing in the same run rather than adding a premise.
	if (pinned === 0) return fail('no pinned checkout was indexed; is `.upstream` present?');

	const lines = new Map();
	const lengthOf = async (path) => {
		if (!lines.has(path)) {
			lines.set(path, (await readFile(join(ROOT, path), 'utf8')).split('\n').length);
		}
		return lines.get(path);
	};

	const sites = [];
	let checked = 0;
	let skipped = 0;
	for (const root of SOURCES) {
		for (const file of await walk(root, (n) => CITING.test(n))) {
			const text = await read(file);
			for (const m of text.matchAll(CITE)) {
				const [, name, line] = m;
				const at = `${file}:${text.slice(0, m.index).split('\n').length}`;
				const hits = index.get(name);
				if (!hits) {
					if (MUST_RESOLVE.test(name))
						sites.push(`${at}  cites ${name}:${line}, and nothing here has one`);
					else skipped++;
					continue;
				}
				checked++;
				// Any file of that name having the line is enough, and that is the gate's weakest
				// point rather than a detail. A basename occurs more than once — a control's
				// `.xaml` and the `generic.xaml` copy of it, `+page.svelte` 168 times, and
				// `Resources.resw` 23 — and which copy a citation meant is what it leaves to the
				// reader. Measured on the tree this landed in: 50 of the 2975 name a basename
				// with more than one copy, and in 27 of those only some copies reach the cited
				// line — so those 27 are checked against whichever copy is long enough rather
				// than against the one that was meant. Requiring every
				// copy is not the fix: a control's template and its `generic.xaml` twin
				// legitimately differ in length. **The failure runs both ways**, and which way
				// depends on nothing but which copies happen to be indexed: the longest copy
				// hides a line that is past the end of the file actually meant, and the
				// shortest invents one that is not — a line cited in the library's
				// `package.json` read as past the end of every `package.json` while the
				// manifest it names has 65 lines, because the only copy indexed was the smoke
				// consumer's 22-line one. What would fix it is a citation that carries enough
				// path to name one file, and that is a convention rather than a gate.
				const n = Number(line);
				const reach = await Promise.all(hits.map(async (h) => n <= (await lengthOf(h))));
				if (!reach.some(Boolean)) {
					sites.push(`${at}  cites ${name}:${line}, past the end of every ${name}`);
				}
			}
		}
	}

	return sites.length
		? fail('a citation names a line its file does not have', sites)
		: pass(
				`${checked} cited line(s) resolve against ${index.size} indexed name(s); ` +
					`${skipped} skipped as a dependency's`
			);
}
