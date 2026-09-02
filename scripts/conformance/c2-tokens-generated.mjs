import { pass, fail, pending, read, walk } from './lib.mjs';

export const id = 'C2';
export const title = 'committed token CSS matches the generator';

const SOURCE_DIR = 'packages/winui-svelte/tokens';

export async function run() {
	const sources = await walk(SOURCE_DIR, (n) => n.endsWith('.json'));
	if (sources.length === 0) return pending('v1', 'no token source has been extracted yet');

	const { generate } = await import('../tokens/generate.mjs');
	const expected = await generate();
	const mismatched = [];
	for (const [file, content] of Object.entries(expected)) {
		let actual = null;
		try {
			actual = await read(file);
		} catch {
			/* missing counts as mismatched */
		}
		if (actual !== content) mismatched.push(file);
	}

	return mismatched.length
		? fail('committed token CSS is stale; run `pnpm tokens:build`', mismatched)
		: pass(`${Object.keys(expected).length} generated file(s) current`);
}
