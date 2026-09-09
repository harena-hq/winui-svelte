import record from '../../../../data/winui-gallery-shell.json' with { type: 'json' };
import type { NavigationViewEntry } from 'winui-svelte';

/**
 * The Gallery's window — `MainWindow.xaml` and the rows the Gallery's own
 * `MainWindow.xaml.cs` appends at run time. Extracted by the same extractor
 * that produced `data/winui-gallery-design.json`, governed by ADR 0007 and D13,
 * and read here rather than from the XAML — the record is the content.
 *
 * The pane's tree is built in two steps to match what the source does. The XAML
 * carries the first five items, a header, and the `All` row; the code-behind
 * `AddNavigationMenuItems` then adds the rest from `ControlInfoData.json` sorted
 * by title. The three special sections — Fundamentals, Design, Accessibility —
 * are excluded from that loop because they are already in the XAML.
 */

interface RecordMenuItem {
	kind: 'item';
	name: string;
	content: string;
	tag: string | null;
	automationId: string | null;
	icon: { kind: 'font'; glyph: string } | { kind: 'symbol'; value: string } | null;
	children: RecordMenuItem[];
}

interface RecordMenuHeader {
	kind: 'header';
	content: string;
}

type RecordMenuEntry = RecordMenuItem | RecordMenuHeader;

export interface GalleryItem {
	uniqueId: string;
	title: string;
	tags: string[];
	subtitle: string | null;
	description: string | null;
	apiNamespace: string | null;
	baseClasses: string[];
	docs: { title: string; uri: string }[];
	sourcePath: string | null;
	samplePagePath: string | null;
}

interface RecordGroup {
	uniqueId: string;
	title: string;
	iconGlyph: string | null;
	isSpecialSection: boolean;
	items: GalleryItem[];
}

interface RecordShape {
	titleBar: {
		title: string;
		// The box lives under `content` because that is where `TitleBar.Content` puts it,
		// and the record keeps the source's shape. Flattening it here once cost a silently
		// empty placeholder: the cast below asserts this interface over the record, so a
		// field named at the wrong depth reads as `undefined` and nothing complains.
		content: {
			placeholderText: string;
		};
	};
	menu: RecordMenuEntry[];
	groups: RecordGroup[];
}

// `Icon="Home"` is a `Symbol`, an enum of the framework's own icon names rather than
// a code point. The Gallery's icon catalogue — `data/winui-gallery-design.json` — lists
// `Home` as E80F, tagged `symbol-icon`, which is the catalogue's marker for exactly
// this enum.
const SYMBOL_GLYPHS: Record<string, string> = { Home: 'E80F' };

function slug(s: string): string {
	return s.toLowerCase();
}

function iconGlyphForItem(item: RecordMenuItem): string | null {
	const i = item.icon;
	if (i === null) return null;
	if (i.kind === 'font') return i.glyph;
	if (SYMBOL_GLYPHS[i.value] === undefined) {
		throw new Error(`shell: unrecognised Symbol ${JSON.stringify(i.value)}`);
	}
	return SYMBOL_GLYPHS[i.value];
}

function buildXamlItem(
	item: RecordMenuItem,
	parentId: string | null
): Extract<NavigationViewEntry, { id: string }> {
	const ownId =
		item.name === 'Home'
			? '/'
			: parentId === null
				? `/${slug(item.tag ?? item.content)}`
				: `${parentId}/${slug(item.tag ?? item.content)}`;
	const children: Extract<NavigationViewEntry, { id: string }>[] = item.children.map((c) =>
		buildXamlItem(c, ownId)
	);
	return {
		id: ownId,
		content: item.content,
		glyph: iconGlyphForItem(item),
		children: children.length > 0 ? children : undefined
	};
}

function buildXamlMenu(entries: RecordMenuEntry[]): NavigationViewEntry[] {
	const out: NavigationViewEntry[] = [];
	for (const e of entries) {
		if (e.kind === 'header') {
			out.push({ header: e.content });
			continue;
		}
		out.push(buildXamlItem(e, null));
	}
	return out;
}

function buildGroupMenu(groups: RecordGroup[]): NavigationViewEntry[] {
	const collator = new Intl.Collator('en');
	const sortable = groups
		.filter((g) => !g.isSpecialSection)
		.slice()
		.sort((a, b) => collator.compare(a.title, b.title));
	return sortable.map((g) => {
		const groupId = `/${slug(g.uniqueId)}`;
		return {
			id: groupId,
			content: g.title,
			glyph: g.iconGlyph,
			children: g.items.map((it) => ({
				id: `${groupId}/${slug(it.uniqueId)}`,
				content: it.title,
				glyph: null
			}))
		};
	});
}

const r = record as unknown as RecordShape;

const ITEMS_BY_UNIQUE_ID: ReadonlyMap<string, GalleryItem> = (() => {
	const items = new Map<string, GalleryItem>();
	for (const group of r.groups) {
		for (const item of group.items) {
			const key = slug(item.uniqueId);
			if (items.has(key)) {
				throw new Error(`shell: duplicate GalleryItem uniqueId ${JSON.stringify(item.uniqueId)}`);
			}
			items.set(key, item);
		}
	}
	return items;
})();

const xamlMenu = buildXamlMenu(r.menu);
const groupMenu = buildGroupMenu(r.groups);

export const menu: NavigationViewEntry[] = [...xamlMenu, ...groupMenu];

/** One of the record's groups — a title and the items under it. */
export interface GalleryGroup {
	uniqueId: string;
	title: string;
	items: GalleryItem[];
}

/**
 * The record's groups, in the order it lists them.
 *
 * This is `ControlInfoDataSource.Instance.Groups`, which is what the Gallery's own
 * `SemanticZoomPage` binds its grouped `CollectionViewSource` to — all nineteen, the three
 * special sections included, because `ControlInfoData.json` lists them as groups like any
 * other and nothing in that page filters them.
 *
 * Exported because until now the only readings of the record here were the flat `menu` tree
 * and the per-item `itemOf`, and a page that needs the collection *grouped* would otherwise
 * have to open the JSON a second time — a second reading of the record, in the tree, with no
 * one keeping the two agreed.
 */
export const groups: readonly GalleryGroup[] = r.groups.map((g) => ({
	uniqueId: g.uniqueId,
	title: g.title,
	items: g.items
}));

/**
 * Every menu row that names a record item, keyed by that item's uniqueId.
 *
 * By uniqueId and not by label, because four rows are labelled differently from the item
 * they open: `Styles` opens `Style`, and the three Accessibility rows read `Screen reader
 * support`, `Keyboard support` and `Color contrast` against titles of `Screen Reader`,
 * `Keyboard Navigation` and `Color Contrast`. Keyed by label, those four suggestions open
 * nothing. The row's own id already ends in the uniqueId — `buildXamlItem` slugs the row's
 * `Tag` and `buildGroupMenu` the item's uniqueId — which makes this the inverse of `itemOf`.
 */
function menuItemPaths(entries: NavigationViewEntry[], into: Map<string, string>): void {
	for (const entry of entries) {
		if ('header' in entry) continue;
		const key = entry.id.split('/').filter(Boolean).at(-1) ?? '';
		if (ITEMS_BY_UNIQUE_ID.has(key)) {
			if (into.has(key)) {
				throw new Error(`shell: duplicate GalleryItem menu path ${JSON.stringify(entry.id)}`);
			}
			into.set(key, entry.id);
		}
		if (entry.children) menuItemPaths(entry.children, into);
	}
}

const ITEMS_BY_TITLE: ReadonlyMap<string, GalleryItem> = (() => {
	const items = new Map<string, GalleryItem>();
	for (const group of r.groups) {
		for (const item of group.items) {
			if (items.has(item.title)) {
				throw new Error(`shell: duplicate GalleryItem title ${JSON.stringify(item.title)}`);
			}
			items.set(item.title, item);
		}
	}
	return items;
})();

const MENU_ITEM_PATHS: ReadonlyMap<string, string> = (() => {
	const paths = new Map<string, string>();
	menuItemPaths(menu, paths);
	return paths;
})();

/** The string the Gallery shows when nothing matches — MainWindow.xaml.cs:456. */
export const NO_SEARCH_RESULTS = 'No results found';

/** The titles the Gallery would suggest for a query, in its order. Empty query, empty list. */
export function searchSuggestions(query: string): string[] {
	if (query === '') return [];
	const tokens = query.split(' ');
	const matches = [...ITEMS_BY_TITLE.values()].filter((item) =>
		tokens.every(
			(token) =>
				item.title.toLocaleLowerCase().includes(token.toLocaleLowerCase()) ||
				(item.tags ?? []).some((tag) => tag.toLocaleLowerCase().includes(token.toLocaleLowerCase()))
		)
	);
	// Every record item is IncludedInBuild upstream, so there is no field to reproduce here.
	if (matches.length === 0) return [NO_SEARCH_RESULTS];
	return matches
		.sort((a, b) => {
			const aStarts = a.title.toLocaleLowerCase().startsWith(query.toLocaleLowerCase());
			const bStarts = b.title.toLocaleLowerCase().startsWith(query.toLocaleLowerCase());
			if (aStarts !== bStarts) return aStarts ? -1 : 1;
			return a.title.localeCompare(b.title);
		})
		.map((item) => item.title);
}

/** The route a suggested title opens, or `null` for the no-results string. */
export function pathOfSuggestion(title: string): string | null {
	const item = ITEMS_BY_TITLE.get(title);
	return item === undefined ? null : (MENU_ITEM_PATHS.get(slug(item.uniqueId)) ?? null);
}

export const titleBar = {
	title: r.titleBar.title,
	placeholderText: r.titleBar.content.placeholderText
};

// `QueryIcon="Find"` is a `Symbol` again, and the Gallery's catalogue has no `Find`:
// the magnifier is listed as `Search`, E721, also tagged `symbol-icon`. `Find` is
// the older framework name for the same enum value. The record keeps the name the
// XAML wrote; the mapping is here, where it can be seen.
export const QUERY_GLYPH = 'E721';

export const BUILT_PAGES = [
	'/',
	'/settings',
	'/design/color',
	'/design/geometry',
	'/design/iconography',
	'/design/spacing',
	'/design/typography',
	'/layout/border',
	'/layout/grid',
	'/layout/splitview',
	'/layout/stackpanel',
	'/layout/viewbox',
	'/dateandtime/calendarview',
	'/dateandtime/calendardatepicker',
	'/dateandtime/datepicker',
	'/dateandtime/timepicker'
] as const;

function collectPlaceholder(entries: NavigationViewEntry[], into: string[]): void {
	for (const e of entries) {
		if ('header' in e) continue;
		if (!(BUILT_PAGES as readonly string[]).includes(e.id)) {
			into.push(e.id);
		}
		if (e.children) collectPlaceholder(e.children, into);
	}
}

const _placeholder: string[] = [];
collectPlaceholder(menu, _placeholder);
export const PLACEHOLDER_PATHS: string[] = _placeholder;

function findById(
	entries: NavigationViewEntry[],
	path: string
): Extract<NavigationViewEntry, { id: string }> | null {
	for (const e of entries) {
		if ('header' in e) continue;
		if (e.id === path) return e;
		if (e.children) {
			const f = findById(e.children, path);
			if (f !== null) return f;
		}
	}
	return null;
}

/**
 * The rows that open rather than go. Having children is not the test — `Basic input` has
 * children *and* a page of its own. `MainWindow.xaml.cs`'s `OnNavigationViewSelectionChanged`
 * enumerates every XAML row it navigates for and the three special sections are not among
 * them, while everything the code-behind added falls through to the `ControlInfoDataGroup`
 * and `ControlInfoDataItem` branches and does navigate.
 *
 * So the set is exactly the XAML menu's rows that have children, which is what the record
 * marks `isSpecialSection`.
 */
const CONTAINERS: ReadonlySet<string> = new Set(
	xamlMenu
		.filter((e): e is Extract<NavigationViewEntry, { id: string }> => !('header' in e))
		.filter((e) => (e.children?.length ?? 0) > 0)
		.map((e) => e.id)
);

export function isContainer(path: string): boolean {
	return CONTAINERS.has(path);
}

export function titleOf(path: string): string | null {
	const f = findById(menu, path);
	return f === null ? null : f.content;
}

/** The record's entry for a page path, or `null` where its final segment names no item. */
export function itemOf(path: string): GalleryItem | null {
	const segments = path.split('/').filter(Boolean);
	if (segments.length < 2) return null;
	return ITEMS_BY_UNIQUE_ID.get(slug(segments.at(-1)!)) ?? null;
}

function ancestorsFor(
	entries: NavigationViewEntry[],
	path: string,
	stack: string[]
): string[] | null {
	for (const e of entries) {
		if ('header' in e) continue;
		if (e.id === path) return stack;
		if (e.children) {
			const sub = ancestorsFor(e.children, path, [...stack, e.id]);
			if (sub !== null) return sub;
		}
	}
	return null;
}

export function ancestorsOf(path: string): string[] {
	return ancestorsFor(menu, path, []) ?? [];
}
