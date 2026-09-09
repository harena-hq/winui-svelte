import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHECKOUT, head, ROOT, UPSTREAM } from './fetch.mjs';
import { parse } from '../tokens/xaml.mjs';

const OUTPUT = join(ROOT, 'data', 'winui-gallery-design.json');
const OUTPUT_SHELL = join(ROOT, 'data', 'winui-gallery-shell.json');
const OUTPUT_SAMPLES = join(ROOT, 'data', 'winui-gallery-samples.json');
const OUTPUT_LANGUAGES = join(ROOT, 'data', 'winui-gallery-languages.json');

// The five Design pages — Color, Typography, Iconography, Geometry, Spacing —
// are written against two upstream shapes that this script treats differently:
// a "table" page where the body is a repeated component with named attributes
// (a colour tile, a type-ramp row, an icon row), and an "ad-hoc" page where the
// body is positional markup with no shared shape (Geometry, Spacing). The first
// is read mechanically and recorded; the second is transcribed with a citation
// by the unit that renders it. ADR 0007 names the cost of the second kind of
// reader, and this list is the line the unit draws.
const COLOR_SECTIONS_DIR = 'WinUIGallery/Controls/DesignGuidance/ColorSections';

// The non-section sources are named, not indexed out of the list below. Each read
// wants one specific file, and a positional index into a list is only ever the right
// file by an accident of ordering — inserting a section above would silently hand every
// reader the file next door.
const COLOR_PAGE = 'WinUIGallery/Samples/Color/ColorPage.xaml';
const TYPOGRAPHY_PAGE = 'WinUIGallery/Samples/Typography/TypographyPage.xaml';
const ICONS_DATA = 'WinUIGallery/Samples/Iconography/IconsData.json';
const CONTROL_INFO = 'WinUIGallery/SampleSupport/Data/ControlInfoData.json';
const MAIN_WINDOW = 'WinUIGallery/MainWindow.xaml';
const SAMPLES_DIR = 'WinUIGallery/Samples';
const LANGUAGE_LIST = 'WinUIGallery/Helpers/Language/LanguageList.cs';

// This record's body is the files' own contents, so a hash beside each path would be a
// second statement of the same bytes. The other records need hashes because their bodies
// are transformed views of their sources.

/** The `.txt` paths below `WinUIGallery/Samples`, independent of filesystem order. */
function samplePaths() {
	const root = join(CHECKOUT, SAMPLES_DIR);
	const paths = [];
	const visit = (directory) => {
		for (const entry of readdirSync(directory, { withFileTypes: true })) {
			const fullPath = join(directory, entry.name);
			if (entry.isDirectory()) visit(fullPath);
			else if (entry.isFile() && entry.name.endsWith('.txt')) {
				paths.push(relative(root, fullPath).replaceAll('\\', '/'));
			}
		}
	};
	visit(root);
	return paths.sort((a, b) => a.localeCompare(b));
}

/**
 * `ControlExample.ParseSampleCodeSections`, including its deliberate treatment of unknown
 * section names: parse them so boundaries remain correct, then do not retain their content.
 */
function sampleSections(content) {
	let currentSection = null;
	let currentLines = [];
	const sections = { header: null, xaml: null, csharp: null };
	const save = () => {
		if (currentSection === null) return;
		const value = currentLines.join('\n').trim();
		const name = currentSection.toLowerCase();
		if (name === 'header') sections.header = value;
		else if (name === 'xaml') sections.xaml = value;
		else if (name === 'c#') sections.csharp = value;
	};

	for (const rawLine of content.split('\n')) {
		const line = rawLine.replace(/\r$/, '');
		if (line.startsWith('--- ')) {
			save();
			currentSection = line.slice(4).trim();
			currentLines = [];
		} else {
			currentLines.push(line);
		}
	}
	save();
	return sections;
}

function extractSamples() {
	const files = samplePaths();
	const samples = {};
	let sectioned = 0;
	let withHeader = 0;
	let withXaml = 0;
	let withCSharp = 0;
	for (const path of files) {
		const text = readFileSync(join(CHECKOUT, SAMPLES_DIR, path), 'utf8');
		if (!text.split('\n').some((line) => line.replace(/\r$/, '').startsWith('--- '))) {
			samples[path] = { kind: 'text', text };
			continue;
		}
		const sections = sampleSections(text);
		sectioned++;
		if (sections.header !== null) withHeader++;
		if (sections.xaml !== null) withXaml++;
		if (sections.csharp !== null) withCSharp++;
		samples[path] = { kind: 'sections', ...sections };
	}
	return {
		source: {
			repository: 'microsoft/WinUI-Gallery',
			url: UPSTREAM.url,
			ref: UPSTREAM.ref,
			commit: UPSTREAM.commit,
			extractedAt: new Date().toISOString().slice(0, 10),
			fileCount: files.length,
			files
		},
		census: {
			files: files.length,
			sectioned,
			plain: files.length - sectioned,
			withHeader,
			withXaml,
			withCSharp
		},
		samples
	};
}

// One list per record, holding the files that record is derived from — not one shared
// list both draw on. A provenance block answers "what was read to produce this file",
// and a shared list answers it wrongly for both: it would have the Design record
// vouching for the shell's markup and the shell record vouching for 1533 icons.
//
// Read order rather than sorted, unlike the token census: that one enumerates a
// directory and sorts so the filesystem does not decide the order, while these are
// written here, and the Design list leads with the six sections in the order the Color
// page's tab bar shows them — the same order the census reports tiles in.
//
// `CONTROL_INFO` is in both because both read it, for different things: the Design
// record takes the five `DesignItem` entries, the shell record takes all nineteen groups.
const DESIGN_SOURCES = [
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

const SHELL_SOURCES = [MAIN_WINDOW, CONTROL_INFO];

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
 * Asserted equal to the list the spec writes in §3.3: any future drift is upstream
 * choosing a new tab, and a hardcoded list would silently disagree.
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

// --- shell extraction -----------------------------------------------------

/**
 * A one-character glyph as its uppercase hexadecimal code point.
 *
 * The two sources spell the same value differently — `xaml.mjs` resolves
 * `&#xE790;` to the literal private-use character while `ControlInfoData.json`
 * stores that character directly — and hex is what keeps one value from having
 * two spellings in one record. It is also what the icon catalogue in
 * `winui-gallery-design.json` already uses for its 1533 `Code` fields.
 *
 * Throwing on anything but exactly one code point is the half that makes the
 * conversion safe: a combining sequence would produce the same first
 * `toString(16)` and be silently wrong.
 */
function codePointHex(raw, what) {
	if (typeof raw !== 'string' || [...raw].length !== 1) {
		throw new Error(`${what} is ${JSON.stringify(raw)}; expected exactly one code point`);
	}
	return raw.codePointAt(0).toString(16).toUpperCase();
}

/** The single icon one `<NavigationViewItem>` declares, in two shapes, or `null`. */
function menuIcon(node) {
	const attr = pick(node, 'Icon');
	const propEls = node.children.filter((c) => c.tag === 'NavigationViewItem.Icon');
	if (attr !== null && propEls.length > 0) {
		throw new Error(
			`<${node.tag}> at line ${node.line} has both Icon="${attr}" and a NavigationViewItem.Icon child`
		);
	}
	if (attr !== null) return { kind: 'symbol', value: attr };
	if (propEls.length === 0) return null;
	if (propEls.length !== 1) {
		throw new Error(
			`<${node.tag}> at line ${node.line} has ${propEls.length} NavigationViewItem.Icon children; expected 1`
		);
	}
	const fonts = propEls[0].children.filter((c) => c.tag === 'FontIcon');
	const others = propEls[0].children.filter((c) => c.tag !== 'FontIcon');
	if (others.length > 0) {
		throw new Error(
			`<${node.tag}> at line ${node.line} NavigationViewItem.Icon has non-FontIcon child <${others[0].tag}>`
		);
	}
	if (fonts.length !== 1) {
		throw new Error(
			`<${node.tag}> at line ${node.line} NavigationViewItem.Icon has ${fonts.length} FontIcon children; expected 1`
		);
	}
	return {
		kind: 'font',
		glyph: codePointHex(pick(fonts[0], 'Glyph'), `<FontIcon> at line ${fonts[0].line} Glyph`)
	};
}

/** One entry of the static navigation tree, in document order. */
function menuEntry(node) {
	if (node.tag === 'NavigationViewItemHeader') {
		const kids = node.children.filter((c) => c.tag === 'NavigationViewItem.MenuItems');
		if (kids.length > 0) {
			throw new Error(
				`<NavigationViewItemHeader> at line ${node.line} has NavigationViewItem.MenuItems; headers are flat`
			);
		}
		return { kind: 'header', content: pick(node, 'Content') };
	}
	if (node.tag === 'NavigationViewItem') {
		const sub = node.children.filter((c) => c.tag === 'NavigationViewItem.MenuItems');
		if (sub.length > 1) {
			throw new Error(
				`<NavigationViewItem> at line ${node.line} has ${sub.length} NavigationViewItem.MenuItems; expected 0 or 1`
			);
		}
		const children = sub.length === 1 ? sub[0].children.map(menuEntry) : [];
		return {
			kind: 'item',
			name: pick(node, 'x:Name'),
			content: pick(node, 'Content'),
			tag: pick(node, 'Tag'),
			automationId: pick(node, 'AutomationProperties.AutomationId'),
			icon: menuIcon(node),
			children
		};
	}
	throw new Error(
		`unexpected <${node.tag}> at line ${node.line} under NavigationView.MenuItems; expected NavigationViewItem or NavigationViewItemHeader`
	);
}

/** Walk every entry in the tree, headers included, so the census can count it. */
function* menuEntries(nodes) {
	for (const node of nodes) {
		yield node;
		if (node.kind === 'item') yield* menuEntries(node.children);
	}
}

/**
 * The one element with this tag anywhere under `root`.
 *
 * Zero and two are both errors, and they are the same error: the shell is a single
 * title bar around a single navigation view, and a second of either means the window
 * has been restructured upstream in a way this extractor's assumptions no longer fit.
 */
function only(root, tag) {
	const found = [...descendants(root)].filter((node) => node.tag === tag);
	if (found.length !== 1) {
		throw new Error(`${MAIN_WINDOW} has ${found.length} <${tag}> elements; expected 1`);
	}
	return found[0];
}

/**
 * The shell's `<TitleBar>` configuration.
 *
 * The icon source is the `ImageSource` on the lone `<ImageIconSource>` inside
 * `<TitleBar.IconSource>`. The content is the lone element inside
 * `<TitleBar.Content>`. Both `pick()`-shaped: a missing attribute is `null`.
 */
function titleBar(node) {
	const iconSourceProps = node.children.filter((c) => c.tag === 'TitleBar.IconSource');
	if (iconSourceProps.length !== 1) {
		throw new Error(
			`<TitleBar> at line ${node.line} has ${iconSourceProps.length} TitleBar.IconSource children; expected 1`
		);
	}
	const images = iconSourceProps[0].children.filter((c) => c.tag === 'ImageIconSource');
	if (images.length !== 1) {
		throw new Error(
			`<TitleBar.IconSource> at line ${iconSourceProps[0].line} has ${images.length} ImageIconSource children; expected 1`
		);
	}

	const contentProps = node.children.filter((c) => c.tag === 'TitleBar.Content');
	if (contentProps.length !== 1) {
		throw new Error(
			`<TitleBar> at line ${node.line} has ${contentProps.length} TitleBar.Content children; expected 1`
		);
	}
	const elements = contentProps[0].children;
	if (elements.length !== 1) {
		throw new Error(
			`<TitleBar.Content> at line ${contentProps[0].line} has ${elements.length} element children; expected 1`
		);
	}
	const content = elements[0];

	return {
		title: pick(node, 'Title'),
		isBackButtonVisible: pick(node, 'IsBackButtonVisible'),
		isPaneToggleButtonVisible: pick(node, 'IsPaneToggleButtonVisible'),
		iconSource: pick(images[0], 'ImageSource'),
		content: {
			tag: content.tag,
			maxWidth: pick(content, 'MaxWidth'),
			placeholderText: pick(content, 'PlaceholderText'),
			queryIcon: pick(content, 'QueryIcon')
		}
	};
}

/** The shell's `<NavigationView>` configuration — the three attributes the source pins. */
function navigationView(node) {
	return {
		isBackButtonVisible: pick(node, 'IsBackButtonVisible'),
		isPaneToggleButtonVisible: pick(node, 'IsPaneToggleButtonVisible'),
		isTabStop: pick(node, 'IsTabStop')
	};
}

/**
 * The static menu tree from `<NavigationView.MenuItems>`.
 *
 * The "six top-level nodes in this order — Home, Fundamentals (7 children),
 * Design (5 children), Accessibility (3 children), one header whose content is
 * `Controls`, and All" enumeration is the line that makes this unit exhaustive:
 * a seventh top-level item is a re-pin that must be looked at, not absorbed.
 */
function menu(root) {
	const hosts = only(root, 'NavigationView').children.filter(
		(c) => c.tag === 'NavigationView.MenuItems'
	);
	// Concatenating two would read as one menu and hide that the source now declares the
	// items in two places, which is a precedence question rather than a longer list.
	if (hosts.length !== 1) {
		throw new Error(
			`<NavigationView> has ${hosts.length} NavigationView.MenuItems children; expected 1`
		);
	}
	const items = hosts[0].children.map(menuEntry);
	if (items.length !== 6) {
		throw new Error(`NavigationView.MenuItems holds ${items.length} top-level entries; expected 6`);
	}
	const expectedNames = ['Home', 'FundamentalsItem', 'DesignItem', 'AccessibilityItem'];
	for (let i = 0; i < expectedNames.length; i++) {
		if (items[i].kind !== 'item' || items[i].name !== expectedNames[i]) {
			throw new Error(`menu[${i}] is ${JSON.stringify(items[i])}; expected ${expectedNames[i]}`);
		}
	}
	if (items[4].kind !== 'header' || items[4].content !== 'Controls') {
		throw new Error(
			`menu[4] is ${JSON.stringify(items[4])}; expected a header with Content="Controls"`
		);
	}
	if (items[5].kind !== 'item' || items[5].name !== 'AllControlsItem') {
		throw new Error(`menu[5] is ${JSON.stringify(items[5])}; expected AllControlsItem`);
	}
	const expectedChildren = [null, 7, 5, 3, null, null];
	for (let i = 0; i < expectedChildren.length; i++) {
		const n = expectedChildren[i];
		if (n === null) continue;
		if (items[i].kind !== 'item' || items[i].children.length !== n) {
			throw new Error(`menu[${i}] has ${items[i].children?.length ?? 0} children; expected ${n}`);
		}
	}
	return items;
}

/**
 * The nineteen `Groups` from `ControlInfoData.json`, in the file's order, unsorted.
 *
 * The runtime ordering by title for the non-special groups happens in
 * `MainWindow.xaml.cs:222`, and is the shell unit's concern when it renders.
 * A census that pre-applied it would be recording a decision, and the three
 * special sections — whose items the static menu tree above already spells out —
 * would vanish from the record with no trace that they were ever read.
 */
function groups(json) {
	if (!Array.isArray(json.Groups) || json.Groups.length !== 19) {
		throw new Error(`ControlInfoData.json holds ${json.Groups?.length ?? 0} groups; expected 19`);
	}
	let totalItems = 0;
	let specials = 0;
	const out = [];
	for (const g of json.Groups) {
		const iconGlyph =
			g.IconGlyph === undefined
				? null
				: codePointHex(g.IconGlyph, `group "${g.UniqueId}" IconGlyph`);
		const isSpecialSection = g.IsSpecialSection === true;
		if (isSpecialSection) specials++;
		if (!Array.isArray(g.Items)) {
			throw new Error(`Group "${g.UniqueId}" has no Items array`);
		}
		totalItems += g.Items.length;
		out.push({
			uniqueId: g.UniqueId,
			title: g.Title,
			iconGlyph,
			isSpecialSection,
			items: g.Items.map((it) => {
				const samplePagePath = `${SAMPLES_DIR}/${it.UniqueId}/${it.UniqueId}Page.xaml`;
				return {
					uniqueId: it.UniqueId,
					title: it.Title,
					tags: it.Tags ?? [],
					subtitle: it.Subtitle ?? null,
					description: it.Description ?? null,
					apiNamespace: it.ApiNamespace ?? null,
					baseClasses: it.BaseClasses ?? [],
					docs: (it.Docs ?? []).map((doc) => ({ title: doc.Title, uri: doc.Uri })),
					sourcePath: it.SourcePath ?? null,
					samplePagePath: existsSync(join(CHECKOUT, samplePagePath)) ? samplePagePath : null
				};
			})
		});
	}
	if (totalItems !== 120) {
		throw new Error(`ControlInfoData.json groups hold ${totalItems} items total; expected 120`);
	}
	if (specials !== 3) {
		throw new Error(`ControlInfoData.json has ${specials} IsSpecialSection groups; expected 3`);
	}
	return { groups: out, specials };
}

/** Build the shell record from the parsed source. */
function buildShell(mainWindowRoot, controlInfo) {
	const items = menu(mainWindowRoot);
	const groupData = groups(controlInfo);
	const all = [...menuEntries(items)];
	return {
		titleBar: titleBar(only(mainWindowRoot, 'TitleBar')),
		navigationView: navigationView(only(mainWindowRoot, 'NavigationView')),
		menu: items,
		groups: groupData.groups,
		census: {
			files: SHELL_SOURCES.length,
			menuItems: items.length,
			menuItemsTotal: all.length,
			groups: groupData.groups.length,
			specialSections: groupData.specials,
			groupItems: groupData.groups.reduce((n, g) => n + g.items.length, 0),
			itemsWithTags: groupData.groups.reduce(
				(n, g) => n + g.items.filter((item) => item.tags.length > 0).length,
				0
			),
			itemsWithDocs: groupData.groups.reduce(
				(n, g) => n + g.items.filter((item) => item.docs.length > 0).length,
				0
			),
			itemsWithApi: groupData.groups.reduce(
				(n, g) => n + g.items.filter((item) => item.apiNamespace !== null).length,
				0
			),
			itemsWithSamplePage: groupData.groups.reduce(
				(n, g) => n + g.items.filter((item) => item.samplePagePath !== null).length,
				0
			)
		}
	};
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
		files: DESIGN_SOURCES,
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

function extractDesign() {
	const built = build();

	return {
		source: {
			url: UPSTREAM.url,
			ref: UPSTREAM.ref,
			commit: UPSTREAM.commit,
			extractedAt: new Date().toISOString().slice(0, 10),
			fileCount: DESIGN_SOURCES.length,
			files: DESIGN_SOURCES.map((path) => ({
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

function extractShell() {
	const built = buildShell(
		parse(readFileSync(join(CHECKOUT, MAIN_WINDOW), 'utf8')),
		JSON.parse(readFileSync(join(CHECKOUT, CONTROL_INFO), 'utf8'))
	);

	return {
		source: {
			url: UPSTREAM.url,
			ref: UPSTREAM.ref,
			commit: UPSTREAM.commit,
			extractedAt: new Date().toISOString().slice(0, 10),
			fileCount: SHELL_SOURCES.length,
			files: SHELL_SOURCES.map((path) => ({
				path,
				sha256: createHash('sha256')
					.update(readFileSync(join(CHECKOUT, path)))
					.digest('hex')
			}))
		},
		census: built.census,
		titleBar: built.titleBar,
		navigationView: built.navigationView,
		menu: built.menu,
		groups: built.groups
	};
}

/**
 * The Gallery's `LanguageList` constructor, in the ComboBox's source order.
 *
 * The five trailing spaces in source names are deliberate: the Gallery displays them, so this
 * record preserves them rather than tidying a value that is part of the compared page.
 */
function extractLanguages() {
	const source = readFileSync(join(CHECKOUT, LANGUAGE_LIST), 'utf8');
	const languages = Array.from(
		source.matchAll(/new Language\("([^"]*)", "([^"]*)"\)/g),
		([, name, code]) => ({ name, code })
	);
	if (languages.length !== 86) {
		throw new Error(
			`${LANGUAGE_LIST} holds ${languages.length} new Language(...) calls; expected 86`
		);
	}

	return {
		source: {
			url: UPSTREAM.url,
			ref: UPSTREAM.ref,
			commit: UPSTREAM.commit,
			extractedAt: new Date().toISOString().slice(0, 10),
			fileCount: 1,
			files: [
				{
					path: LANGUAGE_LIST,
					sha256: createHash('sha256').update(source).digest('hex')
				}
			]
		},
		census: { languages: languages.length },
		languages
	};
}

const censusDesign = (doc) => {
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

const censusShell = (doc) => {
	const c = doc.census;
	return [
		`files             ${c.files} read`,
		`menu              ${c.menuItems} top-level, ${c.menuItemsTotal} total`,
		`groups            ${c.groups} (${c.specialSections} special), ${c.groupItems} items`,
		`page details      ${c.itemsWithTags} tags, ${c.itemsWithDocs} docs, ${c.itemsWithApi} API, ${c.itemsWithSamplePage} sample pages`
	].join('\n');
};

const censusSamples = (doc) => {
	const c = doc.census;
	return [
		`files             ${c.files} read`,
		`sections          ${c.sectioned} sectioned, ${c.plain} plain`,
		`definitions       ${c.withHeader} headers, ${c.withXaml} XAML, ${c.withCSharp} C#`
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

function checkOne(path, fresh) {
	if (!existsSync(path)) throw new Error(`${relative(ROOT, path)} does not exist.`);
	const committed = JSON.parse(readFileSync(path, 'utf8'));
	const strip = (record) => {
		const source = { ...record.source };
		delete source.extractedAt;
		return { ...record, source };
	};
	const found = difference(strip(committed), strip(fresh));
	if (found) throw new Error(`${relative(ROOT, path)} differs from the extractor: ${found}`);
}

function main(argv) {
	const at = head();
	if (at !== UPSTREAM.commit) {
		const state = at === null ? 'is missing' : `is at ${at || 'no commit'}`;
		throw new Error(
			`.upstream/WinUI-Gallery ${state}, not ${UPSTREAM.commit}. Run \`pnpm gallery:fetch\`.`
		);
	}

	const design = extractDesign();
	const shell = extractShell();
	const samples = extractSamples();
	const languages = extractLanguages();

	if (argv.includes('--check')) {
		checkOne(OUTPUT, design);
		checkOne(OUTPUT_SHELL, shell);
		checkOne(OUTPUT_SAMPLES, samples);
		checkOne(OUTPUT_LANGUAGES, languages);

		console.log(
			`${relative(ROOT, OUTPUT)} matches the extractor (${design.census.colorTiles} tiles, ${design.census.icons} icons).`
		);
		console.log(
			`${relative(ROOT, OUTPUT_SHELL)} matches the extractor (${shell.census.menuItems} menu entries, ${shell.census.groups} groups).`
		);
		console.log(
			`${relative(ROOT, OUTPUT_SAMPLES)} matches the extractor (${samples.census.files} files, ${samples.census.sectioned} sectioned).`
		);
		console.log(
			`${relative(ROOT, OUTPUT_LANGUAGES)} matches the extractor (${languages.census.languages} languages).`
		);
		return;
	}

	mkdirSync(dirname(OUTPUT), { recursive: true });
	writeFileSync(OUTPUT, `${JSON.stringify(design, null, '\t')}\n`);
	writeFileSync(OUTPUT_SHELL, `${JSON.stringify(shell, null, '\t')}\n`);
	writeFileSync(OUTPUT_SAMPLES, `${JSON.stringify(samples, null, '\t')}\n`);
	writeFileSync(OUTPUT_LANGUAGES, `${JSON.stringify(languages, null, '\t')}\n`);
	console.log(censusDesign(design));
	console.log(`written           ${relative(ROOT, OUTPUT)}`);
	console.log(censusShell(shell));
	console.log(`written           ${relative(ROOT, OUTPUT_SHELL)}`);
	console.log(censusSamples(samples));
	console.log(`written           ${relative(ROOT, OUTPUT_SAMPLES)}`);
	console.log(`languages         ${languages.census.languages}`);
	console.log(`written           ${relative(ROOT, OUTPUT_LANGUAGES)}`);
}

/**
 * Both records, freshly derived, for a caller that wants to compare rather than write.
 *
 * Exported so conformance gate C8 re-derives through this module instead of restating
 * how a record is built. A second implementation of the same derivation would agree with
 * the committed files right up to the day one of them was changed.
 */
export function records() {
	const at = head();
	if (at !== UPSTREAM.commit) {
		const state = at === null ? 'is missing' : `is at ${at || 'no commit'}`;
		throw new Error(
			`.upstream/WinUI-Gallery ${state}, not ${UPSTREAM.commit}. Run \`pnpm gallery:fetch\`.`
		);
	}
	return {
		design: extractDesign(),
		shell: extractShell(),
		samples: extractSamples(),
		languages: extractLanguages()
	};
}

// Importing this module must not write files or exit: C8 wants `records()`, not the side
// effect. `resolve` rather than a string compare — `node scripts/gallery/extract.mjs` and
// an absolute invocation are the same entry point and must both take this branch.
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
	try {
		main(process.argv.slice(2));
	} catch (error) {
		console.error(error.message);
		process.exit(1);
	}
}
