import { fail, pass, read } from './lib.mjs';

export const id = 'C8';
export const title = 'the generated records match their source and their own counts';

const DESIGN = 'data/winui-gallery-design.json';
const SHELL = 'data/winui-gallery-shell.json';
const COLORCODE = 'data/colorcode.json';

/**
 * C2's sibling, for the other generated records. It answers the same question —
 * "is the committed artifact still what its generator produces?" — and has to answer it
 * in two strengths, because the input differs.
 *
 * C2's input is `data/winui-tokens.json`, which is committed, so C2 can always re-run the
 * generator. The Gallery records are derived from `.upstream/WinUI-Gallery`, and the
 * ColorCode record is derived from both `.upstream/ColorCode-Universal` and
 * `.upstream/WinUI-Gallery`, which are deliberately not committed and are absent from a
 * fresh clone. So the gate always checks
 * what a fresh clone can check — the pin the records name, and each record's census
 * against its own contents — and additionally re-derives all three records when both
 * checkouts happen to be present at their pins.
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
/** The one language of `colorcode` whose `aliases` carry `alias`. */
function byAlias(colorcode, alias) {
	const found = colorcode.languages.filter((language) => language.aliases.includes(alias));
	if (found.length !== 1) throw new Error(`${found.length} languages carry the alias ${alias}`);
	return found[0];
}

function counted(design, shell, colorcode) {
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
		},
		[COLORCODE]: {
			scopeNames: Object.keys(colorcode.scopeNames).length,
			colorConstants: Object.keys(colorcode.colorConstants).length,
			lightStyles: colorcode.palette.light.length,
			darkStyles: colorcode.palette.dark.length,
			overridesRemoved: colorcode.palette.galleryDark.removed.length,
			overridesAdded: colorcode.palette.galleryDark.added.length,
			languages: colorcode.languages.length,
			// By alias, as the engine will resolve them: ColorCode's own ids are `xml` and `c#`,
			// and `csharp` is one of the second language's aliases rather than its id.
			rules: {
				xml: byAlias(colorcode, 'xaml').rules.length,
				csharp: byAlias(colorcode, 'csharp').rules.length
			},
			reachableScopes: new Set([
				'Plain Text',
				...colorcode.languages.flatMap((language) =>
					language.rules.flatMap((rule) => Object.values(rule.captures))
				)
			]).size
		}
	};
}

export async function run() {
	const records = {};
	for (const path of [DESIGN, SHELL, COLORCODE]) {
		let text;
		try {
			text = await read(path);
		} catch {
			// Not `pending`: all records are committed, and one going missing is the
			// tree losing an artifact rather than a version not having arrived.
			return fail(
				`${path} is missing; run \`${path === COLORCODE ? 'pnpm colorcode:extract' : 'pnpm gallery:extract'}\``
			);
		}
		try {
			records[path] = JSON.parse(text);
		} catch (error) {
			return fail(`${path} is not valid JSON: ${error.message}`);
		}
	}

	const sites = [];

	const { UPSTREAM: GALLERY_UPSTREAM, head: galleryHead } = await import('../gallery/fetch.mjs');
	const { UPSTREAM: COLORCODE_UPSTREAM, head: colorcodeHead } =
		await import('../colorcode/fetch.mjs');
	for (const [path, record] of Object.entries(records)) {
		const pinned = path === COLORCODE ? COLORCODE_UPSTREAM.commit : GALLERY_UPSTREAM.commit;
		if (record.source?.commit !== pinned) {
			sites.push(`${path}: extracted from ${record.source?.commit}, pinned at ${pinned}`);
		}
		if (record.source?.fileCount !== record.source?.files?.length) {
			sites.push(
				`${path}: source.fileCount is ${record.source?.fileCount}, source.files holds ${record.source?.files?.length}`
			);
		}
	}
	if (records[COLORCODE].gallery?.commit !== GALLERY_UPSTREAM.commit) {
		sites.push(
			`${COLORCODE}: gallery.commit is ${records[COLORCODE].gallery?.commit}, pinned at ${GALLERY_UPSTREAM.commit}`
		);
	}
	if (records[COLORCODE].gallery?.fileCount !== records[COLORCODE].gallery?.files?.length) {
		sites.push(
			`${COLORCODE}: gallery.fileCount is ${records[COLORCODE].gallery?.fileCount}, gallery.files holds ${records[COLORCODE].gallery?.files?.length}`
		);
	}

	const expected = counted(records[DESIGN], records[SHELL], records[COLORCODE]);
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
		return fail('a generated record disagrees with its own pin or its own contents', sites);
	}

	// The stronger half, when both checkouts are there to compare against.
	const galleryAt = await galleryHead();
	const colorcodeAt = await colorcodeHead();
	if (galleryAt !== GALLERY_UPSTREAM.commit || colorcodeAt !== COLORCODE_UPSTREAM.commit) {
		const missing = [];
		if (galleryAt !== GALLERY_UPSTREAM.commit) {
			missing.push(
				`.upstream/WinUI-Gallery is ${galleryAt === null ? 'absent' : `at ${galleryAt}`}`
			);
		}
		if (colorcodeAt !== COLORCODE_UPSTREAM.commit) {
			missing.push(
				`.upstream/ColorCode-Universal is ${colorcodeAt === null ? 'absent' : `at ${colorcodeAt}`}`
			);
		}
		return pass(`3 record(s) consistent; not re-derived — ${missing.join('; ')}`);
	}

	const { records: derive } = await import('../gallery/extract.mjs');
	const { record: deriveColorCode } = await import('../colorcode/extract.mjs');
	const fresh = { ...derive(), colorcode: deriveColorCode() };
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
		[SHELL, fresh.shell],
		[COLORCODE, fresh.colorcode]
	]) {
		if (JSON.stringify(strip(records[path])) !== JSON.stringify(strip(record))) stale.push(path);
	}

	return stale.length
		? fail('a committed generated record is stale; rerun its extractor', stale)
		: pass('3 record(s) consistent and re-derived from the pinned checkouts');
}
