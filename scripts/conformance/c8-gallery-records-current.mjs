import { fail, pass, read } from './lib.mjs';

export const id = 'C8';
export const title = 'the Gallery records match their source and their own counts';

const DESIGN = 'data/winui-gallery-design.json';
const SHELL = 'data/winui-gallery-shell.json';

/**
 * C2's sibling, for the other generated pair. It answers the same question —
 * "is the committed artifact still what its generator produces?" — and has to answer it
 * in two strengths, because the input differs.
 *
 * C2's input is `data/winui-tokens.json`, which is committed, so C2 can always re-run the
 * generator. These two records are derived from `.upstream/WinUI-Gallery`, which is
 * deliberately not committed and is absent from a fresh clone. So the gate always checks
 * what a fresh clone can check — the pin the records name, and each record's census
 * against its own contents — and additionally re-derives both records when the checkout
 * happens to be present at that pin.
 *
 * The weaker half is not a formality. Hand-editing a record is the failure that actually
 * happens, and the census is a second statement of the same data: a count that no longer
 * matches what it counts is an edit that skipped the extractor.
 */

/** Depth-first count of a menu subtree, headers included. */
const menuTotal = (nodes) => nodes.reduce((n, node) => n + 1 + menuTotal(node.children ?? []), 0);

/**
 * What each record's census claims, next to what its own body holds.
 *
 * Written out per key rather than derived, because a generic "recount everything" would
 * have to learn the shape from the record — and would then agree with any shape it was
 * given, which is the one thing a check must not do.
 */
function counted(design, shell) {
	const tiles = design.color.items.filter((item) => item.kind === 'tiles');
	const bySection = {};
	for (const grid of tiles) {
		bySection[grid.section] = (bySection[grid.section] ?? 0) + grid.tiles.length;
	}
	return {
		[DESIGN]: {
			colorSections: design.color.sections.length,
			navItems: design.nav.length,
			colorExamples: design.color.items.filter((item) => item.kind === 'example').length,
			colorGrids: tiles.length,
			colorTiles: tiles.reduce((n, grid) => n + grid.tiles.length, 0),
			tilesBySection: bySection,
			typographyRows: design.typography.rows.length,
			icons: design.icons.length,
			files: design.source.files.length
		},
		[SHELL]: {
			files: shell.source.files.length,
			menuItems: shell.menu.length,
			menuItemsTotal: menuTotal(shell.menu),
			groups: shell.groups.length,
			specialSections: shell.groups.filter((group) => group.isSpecialSection).length,
			groupItems: shell.groups.reduce((n, group) => n + group.items.length, 0)
		}
	};
}

export async function run() {
	const records = {};
	for (const path of [DESIGN, SHELL]) {
		let text;
		try {
			text = await read(path);
		} catch {
			// Not `pending`: both records are committed, and one going missing is the
			// tree losing an artifact rather than a version not having arrived.
			return fail(`${path} is missing; run \`pnpm gallery:extract\``);
		}
		try {
			records[path] = JSON.parse(text);
		} catch (error) {
			return fail(`${path} is not valid JSON: ${error.message}`);
		}
	}

	const sites = [];

	const { UPSTREAM, head } = await import('../gallery/fetch.mjs');
	for (const [path, record] of Object.entries(records)) {
		if (record.source?.commit !== UPSTREAM.commit) {
			sites.push(`${path}: extracted from ${record.source?.commit}, pinned at ${UPSTREAM.commit}`);
		}
		if (record.source?.fileCount !== record.source?.files?.length) {
			sites.push(
				`${path}: source.fileCount is ${record.source?.fileCount}, source.files holds ${record.source?.files?.length}`
			);
		}
	}

	const expected = counted(records[DESIGN], records[SHELL]);
	for (const [path, counts] of Object.entries(expected)) {
		for (const [key, value] of Object.entries(counts)) {
			const claimed = records[path].census?.[key];
			if (JSON.stringify(claimed) !== JSON.stringify(value)) {
				sites.push(
					`${path}: census.${key} claims ${JSON.stringify(claimed)}, the record holds ${JSON.stringify(value)}`
				);
			}
		}
	}

	if (sites.length) {
		return fail('a Gallery record disagrees with its own pin or its own contents', sites);
	}

	// The stronger half, when the checkout is there to compare against.
	const at = await head();
	if (at !== UPSTREAM.commit) {
		return pass(
			`2 record(s) consistent; not re-derived — .upstream/WinUI-Gallery is ${at === null ? 'absent' : `at ${at}`}`
		);
	}

	const { records: derive } = await import('../gallery/extract.mjs');
	const fresh = derive();
	// `extractedAt` is the day the record was written, not part of what it says: a
	// re-run tomorrow would differ in that one field and in nothing else.
	const strip = (record) => {
		const source = { ...record.source };
		delete source.extractedAt;
		return { ...record, source };
	};
	const stale = [];
	for (const [path, record] of [
		[DESIGN, fresh.design],
		[SHELL, fresh.shell]
	]) {
		if (JSON.stringify(strip(records[path])) !== JSON.stringify(strip(record))) stale.push(path);
	}

	return stale.length
		? fail('a committed Gallery record is stale; run `pnpm gallery:extract`', stale)
		: pass('2 record(s) consistent and re-derived from the pinned checkout');
}
