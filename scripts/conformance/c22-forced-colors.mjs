import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fail, pass, ROOT } from './lib.mjs';

export const id = 'C22';
export const title = "a component that draws turns the browser's colour forcing off";

// In a Windows contrast theme the browser drops `box-shadow` and gradients on an element it forces,
// so every focus visual here would go, and the theme matrix, which sets `data-theme` in a browser
// that is not forcing, would stay green. ADR 0005 puts every component's elements under
// `forced-color-adjust: none`, reading the high-contrast tokens, and this refuses a component
// without the rule.
//
// What it cannot see. It reads for the rule's text, so it does not know the rule reaches every
// element: a primitive's element a `child` snippet does not hand over takes the property by
// inheritance, and from the page if it is portalled. `WRAPPERS` is a list by hand, so a new slot
// is not on it. A selector keyed on `data-theme`, which a contrast theme does not set, is not read:
// ColorPicker and Hyperlink carry theirs twice. `tests/visual/forced-colors.spec.ts` drives a few
// of these, and compares thirteen pages, at rest and in one palette.

const DIRS = ['packages/winui-svelte/src/lib/components', 'packages/winui-svelte/src/lib/internal'];

// What draws what the consumer asked for, or nothing the forcing loses, so the browser's forcing
// is right.
const EXEMPT = new Map(
	Object.entries({
		AnimatedVisualPlayer: "the consumer's animation",
		Bold: 'inline text',
		Border: "the consumer's layout and brushes",
		FlipViewItem: "the consumer's layout",
		Ellipse: "the consumer's brushes",
		Image: "the consumer's image",
		InlineUIContainer: 'inline text',
		Italic: 'inline text',
		ItemsRepeater: "the consumer's layout",
		Line: "the consumer's brushes",
		LineBreak: 'inline text',
		Paragraph: 'inline text',
		ParallaxView: "the consumer's layout",
		Path: "the consumer's brushes",
		Polygon: "the consumer's brushes",
		Polyline: "the consumer's brushes",
		Popup: "the consumer's layout",
		Rectangle: "the consumer's brushes",
		RichTextBlock: 'inline text',
		Run: 'inline text',
		ScrollViewer: 'ScrollView draws it',
		Span: 'inline text',
		SystemBackdropElement: 'a backdrop the contrast theme has none of',
		TextBlock: 'inline text',
		ToggleSplitButton: 'SplitButton draws it',
		Underline: 'inline text',
		Viewbox: "the consumer's layout",
		WebView2: "the consumer's document"
	})
);
const RULE = /@media \(forced-colors: active\) \{\s*\* \{\s*forced-color-adjust: none;/;

// The wrappers that hold the consumer's layout, each of which sets `auto` again: ADR 0005.
const WRAPPERS = {
	CommandBar: ['.content'],
	ContentDialog: ['.content'],
	Expander: ['.content'],
	FlipViewItem: ['.root'],
	Flyout: ['.presenter'],
	GridView: ['.header', '.footer'],
	InfoBar: ['.content-area'],
	ListView: ['.header', '.footer'],
	NavigationView: [
		'.content-presenter',
		'.footer-content-border',
		'.top-footer',
		'.header-content'
	],
	Pivot: ['.panel', '.title'],
	RefreshContainer: ['.content'],
	ScrollView: ['.content'],
	SemanticZoom: ['.presenter'],
	SplitView: ['.pane', '.content'],
	TabView: ['.panel', '.strip-header', '.strip-footer'],
	TeachingTip: ['.main', '.hero'],
	TitleBar: ['.content-presenter', '.right-header']
};

export async function run() {
	const sites = [];
	const seen = new Set();
	let files = 0;
	for (const dir of DIRS) {
		for (const file of await readdir(join(ROOT, dir))) {
			if (!file.endsWith('.svelte')) continue;
			files++;
			const name = file.slice(0, -'.svelte'.length);
			seen.add(name);
			const source = await readFile(join(ROOT, dir, file), 'utf8');
			if (EXEMPT.has(name)) {
				if (RULE.test(source)) sites.push(`${dir}/${file}  exempt, and carries the rule`);
			} else if (!RULE.test(source)) sites.push(`${dir}/${file}  has no forced-colors rule`);
			const markup = source.slice(0, source.indexOf('<style'));
			for (const wrapper of WRAPPERS[name] ?? []) {
				const rule = new RegExp(
					`^\\t\\t\\${wrapper} \\{\\n\\t\\t\\tforced-color-adjust: auto;`,
					'm'
				);
				const drawn = new RegExp(`class=(?:"|\\{\\[[^\\]]*')[^"']*\\b${wrapper.slice(1)}\\b`);
				if (!rule.test(source)) sites.push(`${dir}/${file}  ${wrapper} does not set auto`);
				if (!drawn.test(markup)) sites.push(`${dir}/${file}  ${wrapper} is in no template`);
			}
		}
	}
	for (const name of EXEMPT.keys()) {
		if (!seen.has(name)) sites.push(`${name}  exempt, and no such component`);
	}
	for (const name of Object.keys(WRAPPERS)) {
		if (!seen.has(name)) sites.push(`${name}  has wrappers, and no such component`);
	}
	if (files === 0) return fail('read no component');
	return sites.length
		? fail(`${sites.length} component(s)`, sites)
		: pass(`${files} component file(s), ${EXEMPT.size} exempt`);
}
