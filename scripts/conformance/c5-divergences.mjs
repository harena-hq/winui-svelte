import { fail, pass, read, walk } from './lib.mjs';

export const id = 'C5';
export const title = 'divergences are declared, and declarations are cited';

const REGISTRY = 'docs/divergences.md';
const ID = /\bWD-(\d{3,})\b/g;
const ENTRY = /^###\s+WD-(\d{3,})\b/gm;

// Citations are code, but code here includes the test suite and the gates themselves —
// a divergence is as likely to be recorded next to the test that pins it as next to
// the component. Narrowing this to `packages`/`apps` makes the reverse check fail on
// entries that are, in fact, cited.
const SCANNED = ['packages', 'apps', 'tests', 'scripts'];
const CODE = /\.(svelte|ts|js|mjs|css|html)$/;

export async function run() {
	const registry = await read(REGISTRY);
	const declared = new Set([...registry.matchAll(ENTRY)].map((m) => m[1]));

	const files = (await Promise.all(SCANNED.map((dir) => walk(dir, (n) => CODE.test(n))))).flat();

	const cited = new Map();
	for (const file of files) {
		const source = await read(file);
		source.split('\n').forEach((line, i) => {
			for (const m of line.matchAll(ID)) {
				if (!cited.has(m[1])) cited.set(m[1], []);
				cited.get(m[1]).push(`${file}:${i + 1}`);
			}
		});
	}

	const problems = [];
	for (const [id, sites] of cited) {
		if (!declared.has(id)) {
			problems.push(`WD-${id} cited but not declared in ${REGISTRY} — ${sites.join(', ')}`);
		}
	}
	// The other direction matters as much: an entry nothing cites is a divergence that
	// was fixed, or one that was never real. Either way the registry has started lying.
	//
	// It follows that an entry and its first citation land in the same commit. That is
	// the intended discipline, not an accident of the check.
	for (const id of declared) {
		if (!cited.has(id)) problems.push(`WD-${id} declared in ${REGISTRY} but cited nowhere`);
	}

	// A mistyped id satisfies nothing and breaks nothing unless it is called out.
	for (const m of registry.matchAll(/\bWD-(\d{1,2})\b(?!\d)/g)) {
		problems.push(`WD-${m[1]} in ${REGISTRY} is malformed; ids are three digits or more`);
	}

	return problems.length
		? fail('the divergence registry and the code disagree', problems)
		: pass(`${declared.size} declared, ${cited.size} cited`);
}
