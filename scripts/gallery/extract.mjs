import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { CHECKOUT, head, ROOT, UPSTREAM } from './fetch.mjs';
import { parse } from '../tokens/xaml.mjs';

const OUTPUT = join(ROOT, 'data', 'winui-gallery-design.json');

// The five Design pages — Color, Typography, Iconography, Geometry, Spacing —
// are written against two upstream shapes that this script treats differently:
// a "table" page where the body is a repeated component with named attributes
// (a colour tile, a type-ramp row, an icon row), and an "ad-hoc" page where the
// body is positional markup with no shared shape (Geometry, Spacing). The first
// is read mechanically and recorded; the second is transcribed with a citation
// by the unit that renders it. ADR 0007 names the cost of the second kind of
// reader, and this list is the line the unit draws.
const COLOR_SECTIONS_DIR = 'WinUIGallery/Controls/DesignGuidance/ColorSections';

// The four non-section sources are named, not indexed out of the list below. Each read
// wants one specific file, and a positional index into a list is only ever the right
// file by an accident of ordering — inserting a section above would silently hand every
// reader the file next door.
const COLOR_PAGE = 'WinUIGallery/Samples/Color/ColorPage.xaml';
const TYPOGRAPHY_PAGE = 'WinUIGallery/Samples/Typography/TypographyPage.xaml';
const ICONS_DATA = 'WinUIGallery/Samples/Iconography/IconsData.json';
const CONTROL_INFO = 'WinUIGallery/SampleSupport/Data/ControlInfoData.json';

// Read order rather than sorted, unlike the token census: that one enumerates a
// directory and sorts so the filesystem does not decide the order, while this list is
// written here and leads with the six sections in the order the Color page's tab bar
// shows them — the same order the census reports tiles in.
const FILES = [
	`${COLOR_SECTIONS_DIR}/TextSection.xaml`,
	`${COLOR_SECTIONS_DIR}/FillSection.xaml`,
	`${COLOR_SECTIONS_DIR}/StrokeSection.xaml`,
	`${COLOR_SECTIONS_DIR}/BackgroundSection.xaml`,
	`${COLOR_SECTIONS_DIR}/SignalSection.xaml`,
	`${COLOR_SECTIONS_DIR}/HighContrastSection.xaml`,
	COLOR_PAGE,
	TYPOGRAPHY_PAGE,
	ICONS_DATA,
	CONTROL_INFO
];

/** Depth-first walk that yields a node, then its children in order. */
function* descendants(node) {
	for (const child of node.children) {
		yield child;
		yield* descendants(child);
	}
}

/** `attr` when set on `node`, otherwise `null`. A census that records `undefined` would be one that the generator has to defend against; `null` is what the shape says, and the shape is the contract. */
const pick = (node, name) => (name in node.attrs ? node.attrs[name] : null);

/** One tile as the gallery draws it. The keys mirror the source's attributes verbatim so a caller can grep one against the other. */
function tile(node) {
	return {
		colorName: pick(node, 'ColorName'),
		colorBrushName: pick(node, 'ColorBrushName'),
		colorExplanation: pick(node, 'ColorExplanation'),
		colorValue: pick(node, 'ColorValue'),
		background: pick(node, 'Background'),
		foreground: pick(node, 'Foreground'),
		showSeparator: pick(node, 'ShowSeparator'),
		backdrop: pick(node, 'Backdrop'),
		column: pick(node, 'Grid.Column'),
		row: pick(node, 'Grid.Row'),
		hasComment: node.children.some((c) => c.tag === 'local:ColorTile.Comment')
	};
}

/** One example card. */
function example(node) {
	return {
		kind: 'example',
		title: pick(node, 'Title'),
		description: pick(node, 'Description'),
		background: pick(node, 'Background'),
		foreground: pick(node, 'Foreground'),
		// The live controls the original draws inside the card, in document order.
		// v1 renders the card and not its illustration, so the list is what the
		// "find it listed rather than absent" rule needs a later tranche to consult.
		illustration: node.children.map((c) => c.tag)
	};
}

/**
 * The `local:ColorPageExample` and `<Grid Style="{StaticResource GalleryTileGridStyle}">`
 * elements inside one section file, in document order.
 *
 * The "a `ColorTile` outside a `GalleryTileGridStyle` grid fails" rule is enforced
 * by the assertion below: `local:ColorPageExample` and `GalleryTileGridStyle` Grids
 * sit as direct or indirect children of the section root, and `ColorTile`s only as
 * children of those Grids. Any tile that escapes that containment trips the check.
 */
function sectionItems(root) {
	const items = [];

	const visit = (node, insideTileGrid) => {
		const isTileGrid =
			node.tag === 'Grid' && node.attrs.Style === '{StaticResource GalleryTileGridStyle}';
		if (!insideTileGrid && node.tag === 'local:ColorTile') {
			throw new Error(
				`<local:ColorTile> at line ${node.line} is not inside a GalleryTileGridStyle Grid`
			);
		}
		if (node.tag === 'local:ColorPageExample') {
			items.push(example(node));
			return;
		}
		if (isTileGrid) {
			const columns = node.children.filter((c) => c.tag === 'Grid.ColumnDefinitions');
			const rows = node.children.filter((c) => c.tag === 'Grid.RowDefinitions');
			if (columns.length !== 1) {
				throw new Error(
					`GalleryTileGridStyle Grid at line ${node.line} has ${columns.length} Grid.ColumnDefinitions children; expected 1`
				);
			}
			if (rows.length > 1) {
				throw new Error(
					`GalleryTileGridStyle Grid at line ${node.line} has ${rows.length} Grid.RowDefinitions children; expected 0 or 1`
				);
			}
			const tiles = [];
			for (const child of node.children) {
				if (child.tag === 'local:ColorTile') tiles.push(tile(child));
				else if (child.tag !== 'Grid.ColumnDefinitions' && child.tag !== 'Grid.RowDefinitions') {
					throw new Error(
						`unexpected <${child.tag}> at line ${child.line} inside GalleryTileGridStyle Grid at line ${node.line}`
					);
				}
			}
			items.push({
				kind: 'tiles',
				columns: columns[0].children.length,
				rows: rows[0] ? rows[0].children.length : 1,
				tiles
			});
			return;
		}
		for (const child of node.children) visit(child, insideTileGrid || isTileGrid);
	};

	visit(root, false);
	return items;
}

/**
 * The six section names in document order, from `ColorPage.xaml`'s `SelectorBar`.
 *
 * Asserted equal to the `expected` array written out in this function: any future drift is upstream
 * adding, renaming or reordering a tab. Returning a hardcoded list instead of reading the bar would
 * silently disagree with upstream.
 */
function sectionOrder(pageRoot) {
	const bar = descendants(pageRoot).find((n) => n.tag === 'SelectorBar');
	if (!bar) throw new Error('no SelectorBar found in ColorPage.xaml');
	const names = bar.children.filter((c) => c.tag === 'SelectorBarItem').map((c) => c.attrs.Text);
	const expected = ['Text', 'Fill', 'Stroke', 'Background', 'Signal', 'High Contrast'];
	if (names.length !== expected.length || names.some((n, i) => n !== expected[i])) {
		throw new Error(
			`SelectorBarItem order in ColorPage.xaml is [${names.join(', ')}]; expected [${expected.join(', ')}]`
		);
	}
	return names;
}

/**
 * The five `DesignItem` entries from `ControlInfoData.json`, in the file's order.
 *
 * That order is the Gallery's own navigation order and is the only place it is
 * written down; failing here is the right thing to do when the shape changes,
 * because the silent alternative is recording a stale list.
 */
function navGroups(json) {
	const group = (json.Groups ?? json).find((g) => g.UniqueId === 'DesignItem');
	if (!group) throw new Error('DesignItem group missing from ControlInfoData.json');
	if (!Array.isArray(group.Items) || group.Items.length !== 5) {
		throw new Error(`DesignItem group holds ${group.Items?.length ?? 0} items; expected 5`);
	}
	return group.Items.map((it) => ({
		uniqueId: it.UniqueId,
		title: it.Title,
		subtitle: it.Subtitle,
		description: it.Description ?? null,
		tags: it.Tags
	}));
}

/** Icons copied unchanged — the file is already JSON upstream, and a rename here would lose information. */
function icons(json) {
	if (!Array.isArray(json)) throw new Error('IconsData.json is not an array');
	for (const entry of json) {
		if (typeof entry.Code !== 'string' || typeof entry.Name !== 'string') {
			throw new Error(`IconsData.json entry ${JSON.stringify(entry)} lacks Code or Name`);
		}
	}
	return json;
}

/** The nine `controls:TypographyControl` rows in document order. */
function typographyRows(root) {
	const rows = [];
	for (const node of descendants(root)) {
		if (node.tag === 'controls:TypographyControl') {
			rows.push({
				example: pick(node, 'Example'),
				variableFont: pick(node, 'VariableFont'),
				sizeLineHeight: pick(node, 'SizeLineHeight'),
				weight: pick(node, 'Weight'),
				resourceName: pick(node, 'ResourceName'),
				exampleStyle: pick(node, 'ExampleStyle')
			});
		}
	}
	if (rows.length !== 9) {
		throw new Error(`TypographyPage.xaml holds ${rows.length} TypographyControl rows; expected 9`);
	}
	return rows;
}

function build() {
	const sections = sectionOrder(parse(readFileSync(join(CHECKOUT, COLOR_PAGE), 'utf8')));

	const colorItems = [];
	const tilesBySection = Object.fromEntries(sections.map((name) => [name, 0]));
	let examples = 0;
	let grids = 0;
	let tiles = 0;

	for (const section of sections) {
		const file = `${COLOR_SECTIONS_DIR}/${section.replace(/\s+/g, '')}Section.xaml`;
		const items = sectionItems(parse(readFileSync(join(CHECKOUT, file), 'utf8')));
		for (const item of items) {
			const stamped = { ...item, section };
			colorItems.push(stamped);
			if (stamped.kind === 'example') examples++;
			else {
				grids++;
				tilesBySection[section] += stamped.tiles.length;
				tiles += stamped.tiles.length;
			}
		}
	}

	const nav = navGroups(JSON.parse(readFileSync(join(CHECKOUT, CONTROL_INFO), 'utf8')));
	const typography = typographyRows(parse(readFileSync(join(CHECKOUT, TYPOGRAPHY_PAGE), 'utf8')));
	const iconsData = icons(JSON.parse(readFileSync(join(CHECKOUT, ICONS_DATA), 'utf8')));

	return {
		files: FILES,
		colorSections: sections,
		navItems: nav.length,
		colorExamples: examples,
		colorGrids: grids,
		colorTiles: tiles,
		tilesBySection,
		typographyRows: typography.length,
		icons: iconsData.length,
		records: { nav, colorItems, typography, iconsData }
	};
}

function extract() {
	const built = build();

	return {
		source: {
			url: UPSTREAM.url,
			ref: UPSTREAM.ref,
			commit: UPSTREAM.commit,
			extractedAt: new Date().toISOString().slice(0, 10),
			fileCount: FILES.length,
			files: FILES.map((path) => ({
				path,
				sha256: createHash('sha256')
					.update(readFileSync(join(CHECKOUT, path)))
					.digest('hex')
			}))
		},
		census: {
			files: built.files.length,
			navItems: built.navItems,
			colorSections: built.colorSections.length,
			colorExamples: built.colorExamples,
			colorGrids: built.colorGrids,
			colorTiles: built.colorTiles,
			tilesBySection: built.tilesBySection,
			typographyRows: built.typographyRows,
			icons: built.icons
		},
		nav: built.records.nav,
		color: { sections: built.colorSections, items: built.records.colorItems },
		typography: { rows: built.records.typography },
		icons: built.records.iconsData
	};
}

const census = (doc) => {
	const c = doc.census;
	const tileLine = (obj) =>
		Object.entries(obj)
			.map(([name, n]) => `${name} ${n}`)
			.join(', ');
	return [
		`files             ${c.files} read`,
		`nav               ${c.navItems} items`,
		`color             ${c.colorSections} sections, ${c.colorExamples} examples, ${c.colorGrids} grids, ${c.colorTiles} tiles`,
		`tiles by section  ${tileLine(c.tilesBySection)}`,
		`typography        ${c.typographyRows} rows`,
		`icons             ${c.icons}`
	].join('\n');
};

/**
 * The first place `a` and `b` disagree, named by path, or `null`.
 *
 * A copy of `scripts/tokens/extract.mjs`'s `difference` — same shape, same
 * structural walk. The two would be identical, and refactoring a file this
 * unit is not meant to touch to share them would couple this script to a
 * module that has its own change pressure.
 */
function difference(a, b, path = '') {
	const at = path || '(root)';
	if (a === b) return null;
	if (
		Array.isArray(a) !== Array.isArray(b) ||
		typeof a !== typeof b ||
		(a === null) !== (b === null)
	)
		return `${at}: ${JSON.stringify(a)} vs ${JSON.stringify(b)}`;

	if (Array.isArray(a)) {
		for (let i = 0; i < Math.max(a.length, b.length); i++) {
			const found = difference(a[i], b[i], `${path}[${i}]`);
			if (found) return found;
		}
		return null;
	}
	if (a !== null && typeof a === 'object') {
		for (const key of [...new Set([...Object.keys(a), ...Object.keys(b)])]) {
			const found = difference(a[key], b[key], path ? `${path}.${key}` : key);
			if (found) return found;
		}
		return null;
	}
	return `${at}: ${JSON.stringify(a)} vs ${JSON.stringify(b)}`;
}

function main(argv) {
	const at = head();
	if (at !== UPSTREAM.commit) {
		const state = at === null ? 'is missing' : `is at ${at || 'no commit'}`;
		throw new Error(
			`.upstream/WinUI-Gallery ${state}, not ${UPSTREAM.commit}. Run \`pnpm gallery:fetch\`.`
		);
	}

	const doc = extract();

	if (argv.includes('--check')) {
		if (!existsSync(OUTPUT)) throw new Error(`${relative(ROOT, OUTPUT)} does not exist.`);
		const committed = JSON.parse(readFileSync(OUTPUT, 'utf8'));

		const strip = (record) => {
			const source = { ...record.source };
			delete source.extractedAt;
			return { ...record, source };
		};
		const found = difference(strip(committed), strip(doc));
		if (found) throw new Error(`${relative(ROOT, OUTPUT)} differs from the extractor: ${found}`);

		console.log(
			`${relative(ROOT, OUTPUT)} matches the extractor (${doc.census.colorTiles} tiles, ${doc.census.icons} icons).`
		);
		return;
	}

	mkdirSync(dirname(OUTPUT), { recursive: true });
	writeFileSync(OUTPUT, `${JSON.stringify(doc, null, '\t')}\n`);
	console.log(census(doc));
	console.log(`written           ${relative(ROOT, OUTPUT)}`);
}

try {
	main(process.argv.slice(2));
} catch (error) {
	console.error(error.message);
	process.exit(1);
}
