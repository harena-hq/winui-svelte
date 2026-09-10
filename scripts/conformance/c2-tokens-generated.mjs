import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import { fail, pass, pending, read, ROOT } from './lib.mjs';

export const id = 'C2';
export const title = 'committed generated sources match their generators';

// The generator's only input. Everything it emits is a function of this file plus
// `scripts/tokens/manifest.mjs`, which is what makes the comparison below meaningful:
// a difference is committed generated source drifting, never the environment. The symbol
// generator similarly reads its committed record rather than the upstream checkout.
const TOKEN_RECORD = 'data/winui-tokens.json';
const SYMBOL_RECORD = 'data/winui-symbol.json';

export async function run() {
	// `pending` is "not due yet", never "could not look" — so only an absent token record
	// is pending, and an unreadable one propagates and fails the gate.
	const extracted = await stat(join(ROOT, TOKEN_RECORD)).then(
		() => true,
		(error) => {
			if (error.code === 'ENOENT') return false;
			throw error;
		}
	);
	if (!extracted) return pending('v1', `${TOKEN_RECORD} has not been extracted yet`);

	// The symbol record is never pending, so its absence is a failure rather than a wait —
	// and it is reported here with the command that fixes it, because letting the generator
	// throw on the missing file would surface as a bare ENOENT from the runner instead.
	const symbolRecord = await stat(join(ROOT, SYMBOL_RECORD)).then(
		() => true,
		(error) => {
			if (error.code === 'ENOENT') return false;
			throw error;
		}
	);
	if (!symbolRecord) return fail(`${SYMBOL_RECORD} is missing; run \`pnpm symbol:extract\``);

	const { generate } = await import('../tokens/generate.mjs');
	const { generate: generateSymbol } = await import('../symbol/generate.mjs');
	const expected = { ...(await generate()), ...(await generateSymbol()) };

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
		? fail(
				'a committed generated file is stale; run `pnpm tokens:build` and `pnpm symbol:build`',
				stale
			)
		: pass(`${Object.keys(expected).length} generated file(s) current`);
}
