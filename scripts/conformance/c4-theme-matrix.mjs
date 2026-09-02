import { fail, pass, pending, read, walk } from './lib.mjs';

export const id = 'C4';
export const title = 'every exported component is snapshotted in all three themes';

const INDEX = 'packages/winui-svelte/src/lib/index.ts';
const HELPER = 'snapshotAllThemes';

// A component is a value re-exported from a `.svelte` module. Types are not
// components, and `export *` hides its names from any static reading — including
// this one — so the library index states its exports explicitly.
const REEXPORT = /export\s+(type\s+)?\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g;
const STAR = /export\s+\*\s+from/;

export async function run() {
	let index;
	try {
		index = await read(INDEX);
	} catch {
		return fail(`${INDEX} is missing`);
	}

	if (STAR.test(index)) {
		return fail(`${INDEX} uses \`export *\`; the library index lists its exports explicitly`);
	}

	const components = [];
	for (const m of index.matchAll(REEXPORT)) {
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
		: pass(`${components.length} component(s) covered in ${3} themes`);
}
