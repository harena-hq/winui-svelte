import record from '../../../../data/winui-gallery-shell.json';
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

interface RecordGroupItem {
	uniqueId: string;
	title: string;
}

interface RecordGroup {
	uniqueId: string;
	title: string;
	iconGlyph: string | null;
	isSpecialSection: boolean;
	items: RecordGroupItem[];
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

const xamlMenu = buildXamlMenu(r.menu);
const groupMenu = buildGroupMenu(r.groups);

export const menu: NavigationViewEntry[] = [...xamlMenu, ...groupMenu];

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
	'/design/typography'
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

export function titleOf(path: string): string | null {
	const f = findById(menu, path);
	return f === null ? null : f.content;
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
