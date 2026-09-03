import { EXCLUDED } from '../tokens/manifest.mjs';
import { fail, pass, read } from './lib.mjs';

export const id = 'C7';
export const title = 'every resource the Design pages display is emitted';

const RECORD = 'data/winui-gallery-design.json';
const TOKENS = 'packages/winui-svelte/src/lib/tokens/tokens.css';
const RAMP = 'packages/winui-svelte/src/lib/tokens/type-ramp.css';

/**
 * D12's second clause, made checkable.
 *
 * The token selection is the four base dictionaries plus every key the acceptance
 * surface names. The first half is structural and the generator enforces it; the
 * second half was, until this gate, a promise kept by hand — a key could be dropped
 * from `ADDITIONAL_KEYS` and the only symptom would be a blank swatch on the one page
 * this version is judged by. Measured at the time of writing: removing a key made
 * nothing fail.
 *
 * The record file is what makes the check possible. It is the Design pages' content as
 * data, so "what the pages display" stopped being a thing only a reader could know.
 */

// `{ThemeResource X}` / `{StaticResource X}`. The record keeps attribute values raw on
// purpose, so this gate resolves them the same way the pages do rather than trusting a
// pre-resolved field to have been resolved correctly.
const REFERENCE = /^\{(?:Theme|Static)Resource\s+([A-Za-z0-9]+)\}$/;

/** Every resource name the Color page shows, each with a site that names it. */
function colorResources(record) {
	const named = new Map();
	const note = (key, where) => {
		if (!key) return;
		if (!named.has(key)) named.set(key, new Set());
		named.get(key).add(where);
	};
	const resolve = (raw, where) => note(REFERENCE.exec(raw ?? '')?.[1], where);

	for (const item of record.color.items) {
		const where = `Color / ${item.section}`;
		if (item.kind === 'example') {
			resolve(item.background, where);
			resolve(item.foreground, where);
			continue;
		}
		for (const tile of item.tiles) {
			resolve(tile.background, where);
			resolve(tile.foreground, where);
			// The brush name is the tile's caption — the text a reader copies into their own
			// app — so a tile naming a brush the layer does not emit is a page telling someone
			// to use something that is not there, even when the swatch beside it renders.
			if (tile.colorBrushName) note(tile.colorBrushName, `${where} (caption)`);
		}
	}
	return named;
}

export async function run() {
	let record;
	try {
		record = JSON.parse(await read(RECORD));
	} catch (error) {
		// Never `pending`: the record is committed, so failing to read it means the gate
		// cannot see its subject rather than that the subject does not exist yet. `read()`
		// already names the file it could not open, so this adds why it wanted it.
		return fail(`${error.message} — the acceptance surface cannot be checked without it`);
	}

	const tokens = await read(TOKENS);
	const emitted = new Set([...tokens.matchAll(/--winui-([A-Za-z0-9]+)\s*:/g)].map((m) => m[1]));

	const ramp = await read(RAMP);
	const classes = new Set([...ramp.matchAll(/\.winui-([A-Za-z0-9]+)\s*\{/g)].map((m) => m[1]));

	const sites = [];
	const named = colorResources(record);

	for (const [key, where] of named) {
		if (emitted.has(key)) continue;
		// Excluded with a reason is the other half of D12: absent on purpose, and the
		// reason is readable next to the decision rather than inferred from the hole.
		if (key in EXCLUDED) continue;
		sites.push(`${key} — displayed by ${[...where].join(', ')} — not in ${TOKENS}`);
	}

	// The Typography page names a composed style per row, and those ship as classes in a
	// different file. Checking them against the token set instead would pass this gate by
	// looking in the one place they were never going to be.
	for (const row of record.typography.rows) {
		if (row.resourceName && !classes.has(row.resourceName)) {
			sites.push(`${row.resourceName} — displayed by Typography — not in ${RAMP}`);
		}
	}

	const total = named.size + record.typography.rows.length;
	return sites.length
		? fail(`${sites.length} resource(s) the Design pages name are not emitted`, sites)
		: pass(`${total} resource(s) named by the Design pages, all emitted`);
}
