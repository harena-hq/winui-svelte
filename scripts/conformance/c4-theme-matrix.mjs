import { fail, pass, pending, read, walk } from './lib.mjs';

export const id = 'C4';
export const title = 'every exported component is snapshotted in all three themes';

// `index.ts` is the release and `preview.ts` is every component a consumer places, the release
// included (ADR 0017). The baselines are owed by the second: a component held back from the
// release still renders in the Gallery. The first has to be inside it, or the release would hold
// a component this gate never asked to see.
const INDEX = 'packages/winui-svelte/src/lib/index.ts';
const PREVIEW = 'packages/winui-svelte/src/lib/preview.ts';
const HELPER = 'snapshotAllThemes';

// A component is a value re-exported from a `.svelte` module. Types are not
// components, and `export *` hides its names from any static reading — including
// this one — so both entries state their exports explicitly.
const REEXPORT = /export\s+(type\s+)?\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g;
const STAR = /export\s+\*\s+from/;

/** The components an entry exports, or a failure message. */
async function componentsOf(file) {
	let source;
	try {
		source = await read(file);
	} catch {
		return `${file} is missing`;
	}
	if (STAR.test(source)) return `${file} uses \`export *\`; an entry lists its exports explicitly`;

	const components = [];
	for (const m of source.matchAll(REEXPORT)) {
		const [, typeOnly, names, specifier] = m;
		if (typeOnly || !specifier.endsWith('.svelte')) continue;
		for (const entry of names.split(',')) {
			const name = entry
				.trim()
				.split(/\s+as\s+/)
				.pop()
				?.trim();
			if (name && !name.startsWith('type ')) components.push(name);
		}
	}
	return components;
}

export async function run() {
	const components = await componentsOf(PREVIEW);
	if (typeof components === 'string') return fail(components);
	const released = await componentsOf(INDEX);
	if (typeof released === 'string') return fail(released);

	// Before the empty case, so a `preview.ts` that lost its components cannot read as pending
	// while the index still releases some.
	const outside = released.filter((name) => !components.includes(name));
	if (outside.length) return fail(`exported by ${INDEX} and not by ${PREVIEW}`, outside);

	if (components.length === 0) return pending('v1', 'the library exports no components yet');

	const specs = await walk('tests/visual', (n) => n.endsWith('.spec.ts'));
	const covered = new Set();
	for (const file of specs) {
		const source = await read(file);
		// The component name is read as an exact literal argument. Substring matching is
		// what let `DropDownButton` stand in for `SplitButton`, and `highlight` for
		// `light`.
		for (const m of source.matchAll(
			new RegExp(`\\b${HELPER}\\s*\\(\\s*[^,]+,\\s*['"\`]([^'"\`]+)['"\`]`, 'g')
		)) {
			covered.add(m[1]);
		}
	}

	const missing = components.filter((name) => !covered.has(name));
	return missing.length
		? fail(`not passed to ${HELPER}()`, missing)
		: pass(
				`${components.length} component(s) covered in ${3} themes, ${released.length} of them released`
			);
}
