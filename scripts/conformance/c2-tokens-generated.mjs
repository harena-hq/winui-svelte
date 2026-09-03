import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import { fail, pass, pending, read, ROOT } from './lib.mjs';

export const id = 'C2';
export const title = 'committed token CSS matches the generator';

// The generator's only input. Everything it emits is a function of this file plus
// `scripts/tokens/manifest.mjs`, which is what makes the comparison below meaningful:
// a difference is the committed CSS drifting, never the environment.
const RECORD = 'data/winui-tokens.json';

export async function run() {
	// `pending` is "not due yet", never "could not look" — so only an absent record
	// file is pending, and an unreadable one propagates and fails the gate.
	const extracted = await stat(join(ROOT, RECORD)).then(
		() => true,
		(error) => {
			if (error.code === 'ENOENT') return false;
			throw error;
		}
	);
	if (!extracted) return pending('v1', `${RECORD} has not been extracted yet`);

	const { generate } = await import('../tokens/generate.mjs');
	const expected = await generate();

	const stale = [];
	for (const [file, content] of Object.entries(expected)) {
		let actual = null;
		try {
			actual = await read(file);
		} catch {
			// Missing is stale: the point of the gate is that the committed tree carries
			// the generator's output, and no file at all fails that as surely as a wrong one.
		}
		if (actual !== content) stale.push(file);
	}

	return stale.length
		? fail('committed token CSS is stale; run `pnpm tokens:build`', stale)
		: pass(`${Object.keys(expected).length} generated file(s) current`);
}
