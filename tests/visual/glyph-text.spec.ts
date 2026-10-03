/**
 * A glyph written as text is not read.
 *
 * A Segoe Fluent Icons code point (U+E000–U+F8FF) written as a DOM text node joins the
 * accessible name computed from an element's contents, and outside a control it is page text.
 * Measured before this change, navigation rows, selector items and calendar buttons were named
 * by that glyph, and a badge, a title-bar icon and a refresh glyph were stray text. Over every
 * dev route, no node in Chromium's tree may now carry one in its name, and Playwright's aria
 * snapshot may carry one in no name and in no text read as text; and the rows and buttons
 * upstream names must carry those names.
 *
 * A glyph inside a control whose children are presentational — a button, an image, a slider —
 * is not read as text; it is checked only where it is the control's name, which the name check
 * catches. RatingControl's
 * stars and PersonPicture's symbol are two such, and are left as they are.
 *
 * The sweep reads each route as it first renders. A flyout, a dialog or a view reached by
 * interaction is not mounted then, and is not read.
 */

import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test } from './fixtures';

/** Dev-route directories, which is what `/dev/<name>` serves. */
// Resolved from this file rather than the working directory, which a run started elsewhere moves.
const ROUTES = readdirSync(
	fileURLToPath(new URL('../../apps/gallery/src/routes/dev', import.meta.url)),
	{
		withFileTypes: true
	}
)
	.filter((entry) => entry.isDirectory())
	.map((entry) => entry.name)
	.sort();

const GLYPH = /[\uE000-\uF8FF]/;

/** A private-use character, written `U+E72C`. The range is four hex digits. */
function cite(text: string): string {
	return text.replace(/[\uE000-\uF8FF]/g, (ch) => {
		const point = ch.codePointAt(0) ?? 0;
		return `U+${point.toString(16).toUpperCase().padStart(4, '0')}`;
	});
}

/** Roles whose children are presentational in WAI-ARIA: what they hold is not read as text. */
const PRESENTATIONAL = new Set([
	'button',
	'checkbox',
	'img',
	'menuitemcheckbox',
	'menuitemradio',
	'meter',
	'option',
	'progressbar',
	'radio',
	'scrollbar',
	'separator',
	'slider',
	'switch',
	'tab'
]);

// `- role "name" [attrs]: inline` — the name quoted, and anything after the colon the node's
// text when it is a single string, which Playwright writes on the role's own line. Playwright
// single-quotes the whole key when it holds a colon and a space, among other characters YAML
// would misread, so a key is read in either form before its role and name are.
const LINE = /^(\s*)- (?:'((?:[^']|'')*)'|([a-z]+(?: "(?:[^"\\]|\\.)*")?[^:]*))(?::\s*(.*))?$/;
const KEY = /^([a-z]+)(?: "((?:[^"\\]|\\.)*)")?/;

/**
 * The lines of an aria snapshot that read a glyph aloud: any name that carries one, and any
 * text — a `- text:` line or a node's inline string — that carries one outside a role whose
 * children are presentational, itself or above it.
 */
export function leaks(snapshot: string): string[] {
	const found: string[] = [];
	const stack: { indent: number; role: string }[] = [];
	for (const line of snapshot.split('\n')) {
		const match = line.match(LINE);
		if (!match) continue;
		const [, indent, quoted, plain, inline] = match;
		const key = (quoted?.replace(/''/g, "'") ?? plain).match(KEY);
		if (!key) continue;
		const [, role, name] = key;
		while (stack.length && stack[stack.length - 1].indent >= indent.length) stack.pop();
		const quiet = [...stack.map((entry) => entry.role), role].some((r) => PRESENTATIONAL.has(r));
		stack.push({ indent: indent.length, role });
		if (name !== undefined && GLYPH.test(name)) found.push(cite(line.trim()));
		else if (!quiet && inline !== undefined && GLYPH.test(inline)) found.push(cite(line.trim()));
	}
	return found;
}

const LEAKS: { name: string; snapshot: string; expected: number }[] = [
	{
		name: 'a glyph in a name',
		snapshot: '- treeitem "\uE80F Home" [level=1]',
		expected: 1
	},
	{
		name: "a glyph in a labelled row's inline text",
		snapshot: '- treeitem "Home" [level=1]: "\uE80F Home"',
		expected: 1
	},
	{ name: 'a glyph as page text', snapshot: '- text: \uE72C', expected: 1 },
	{
		name: 'a glyph as text inside a list item',
		snapshot: '- listitem:\n  - text: \uE72C',
		expected: 1
	},
	{ name: "a glyph in a button's inline text", snapshot: '- button "Close": \uE711', expected: 0 },
	{
		name: 'a glyph as text nested in a button',
		snapshot: '- button "Copy link":\n  - text: \uE8C8\n  - text: \uE73E',
		expected: 0
	},
	{ name: "a glyph in an image's text", snapshot: '- img "Person": \uE77B', expected: 0 },
	{ name: "a glyph in a slider's text", snapshot: '- slider: \uE734 \uE734', expected: 0 },
	{
		name: 'a sibling after a button is read again',
		snapshot: '- group:\n  - button "Close": \uE711\n  - text: \uE72C',
		expected: 1
	},
	{
		name: 'a single-quoted key is read',
		snapshot: '- \'treeitem "Inbox: 3" [level=1]\': "\uE715 Inbox: 3"',
		expected: 1
	},
	{
		name: "a single-quoted button's nested text is not",
		snapshot: '- \'button "Save: draft"\':\n  - text: \uE74E',
		expected: 0
	},
	{
		name: 'a colon inside a plain name does not end it',
		// Cut at the colon, the glyph would land in a button's text, where it is not read.
		snapshot: '- button "12:30 \uE823"',
		expected: 1
	},
	{ name: 'a property line is not text', snapshot: '- link "Docs":\n  - /url: /x', expected: 0 }
];

for (const { name, snapshot, expected } of LEAKS)
	test(`the sweep's rule: ${name}`, () => {
		expect(leaks(snapshot)).toHaveLength(expected);
	});

test.describe('no glyph is read as text', () => {
	for (const route of ROUTES)
		test(route, async ({ page }) => {
			await page.goto(`/dev/${route}`);

			const session = await page.context().newCDPSession(page);
			try {
				const { nodes } = await session.send('Accessibility.getFullAXTree');
				const named = nodes.flatMap((node) => {
					if (node.ignored) return [];
					const role = node.role?.value;
					if (role === 'StaticText' || role === 'InlineTextBox') return [];
					const name = node.name?.value;
					if (typeof name !== 'string' || !GLYPH.test(name)) return [];
					return [`${role} "${cite(name)}"`];
				});
				expect(named).toEqual([]);
			} finally {
				await session.detach();
			}

			expect(leaks(await page.locator('body').ariaSnapshot())).toEqual([]);
		});

	test('the sweep reaches the dev routes', () => {
		expect(ROUTES.length).toBeGreaterThan(100);
		expect(ROUTES).toContain('calendar-view');
		expect(ROUTES).toContain('navigation-view');
		expect(ROUTES).toContain('selector-bar');
	});
});

type Role = 'button' | 'treeitem' | 'option';

// Counts are of rows in the accessibility tree: a closed minimal pane's rows are not, so a
// count of the DOM's rows overstates them. Both are measured after this change.
const NAMED: { route: string; checks: [Role, string, number][] }[] = [
	{
		route: '/dev/calendar-view',
		checks: [
			['button', 'Previous', 16],
			['button', 'Next', 16]
		]
	},
	{
		route: '/dev/navigation-view-rail',
		checks: [
			['treeitem', 'Home', 2],
			['treeitem', 'Design', 2],
			['treeitem', 'All', 2],
			['treeitem', 'Settings', 2]
		]
	},
	{
		route: '/dev/navigation-view',
		checks: [
			['treeitem', 'Home', 8],
			['treeitem', 'Design', 8]
		]
	},
	{
		route: '/dev/navigation-view-back',
		checks: [
			['treeitem', 'Home', 5],
			['treeitem', 'Settings', 5]
		]
	},
	{
		route: '/dev/selector-bar',
		checks: [
			['option', 'Recent', 1],
			['option', 'Shared', 1],
			['option', 'Favorites', 1]
		]
	}
];

test.describe('the names upstream gives', () => {
	for (const { route, checks } of NAMED)
		test(route, async ({ page }) => {
			await page.goto(route);
			for (const [role, name, count] of checks)
				await expect(page.getByRole(role, { name, exact: true })).toHaveCount(count);
		});
});
