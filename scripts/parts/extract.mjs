/**
 * Extracts the named parts and visual states of the pinned control templates into a committed
 * record, so that comparing a component against its template is a thing a gate can check rather
 * than a thing somebody remembers to do.
 *
 * It exists because the remembering failed. Six parts of `SplitView`'s template were dealt with
 * one at a time over two days — a border, a corner radius, `HCPaneBorder`, `LightDismissLayer`,
 * the clip, and a column whose second state was unaccounted for — each found by a user reporting
 * what it looked like on a phone, or by the next unit tripping over it. Every one of them was
 * sitting in a file this repository already had at a pin it already knew.
 *
 * The record is the census; `docs/template-parts.md` is the disposition. Gate C11 joins them and
 * refuses a part the disposition does not name, a disposition that names no part, and a row that
 * claims a selector our component does not carry. That third direction is the one that keeps the
 * table from being written in one sitting without opening anything.
 *
 * Transitions are deliberately not in here. A `VisualTransition` is identified by the pair of
 * states it runs between rather than by a name, so it is a different census with a different key,
 * and the one thing worse than an absent record is a record whose rows cannot be addressed.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
// The token layer was the first consumer of this checkout, so its fetcher owns the shared pin
// locator rather than creating a second place that could re-pin the same source differently.
import { CHECKOUT, ROOT, UPSTREAM, head } from '../tokens/fetch.mjs';
// And its reader owns the parsing. A regex over XAML has invented a counted fact in this
// repository before — it paired an opening tag with a nested element's closing one — and a
// census is exactly the artifact that mistake survives in.
import { parse } from '../tokens/xaml.mjs';

/** The templates this record covers, in the order the doc presents them. */
const FILES = [
	'controls/dev/NavigationView/NavigationView.xaml',
	'controls/dev/SplitView/SplitView_themeresources.xaml'
];

const OUTPUT = join(ROOT, 'data', 'winui-template-parts.json');

/** A named node that is a state machine rather than a part of the tree. */
const STATE_TAGS = new Set(['VisualState', 'VisualStateGroup', 'Storyboard']);

/**
 * Every `Style` in these files targets a type, and a template's parts belong to the innermost
 * one above them. Two of NavigationView's styles target `FlyoutPresenter` — the top-nav overflow
 * flyout and an item's children flyout — and their parts have the same names, so a key of the
 * target type alone would merge two different templates into one row. The nearest named ancestor
 * separates them, and says which flyout a reader is looking at.
 */
function templateKey(targetType, owner) {
	return owner ? `${targetType} under ${owner}` : targetType;
}

function collect(file) {
	const tree = parse(readFileSync(join(CHECKOUT, file), 'utf8'));
	/** @type {Map<string, { file: string, targetType: string, owner: string | null, parts: object[], states: object[] }>} */
	const templates = new Map();

	// `key` is the template a part belongs to and changes only when a `Style` is entered.
	// `nearest` is the closest named element above the cursor, and exists only to name the owner
	// of a style nested inside another template — it must not group the parts of one template,
	// which is a distinction this walk got wrong the first time and produced 36 templates for 80
	// parts.
	const walk = (node, key, targetType, nearest) => {
		if (node.tag === 'Style' && node.attrs?.TargetType) {
			targetType = node.attrs.TargetType;
			key = templateKey(targetType, key ? nearest : null);
		}
		const name = node.attrs?.['x:Name'];
		if (name && key) {
			if (!templates.has(key)) {
				templates.set(key, { file, key, targetType, parts: [], states: [] });
			}
			const entry = templates.get(key);
			const row = { name, tag: node.tag, line: node.line };
			if (STATE_TAGS.has(node.tag)) entry.states.push(row);
			else entry.parts.push(row);
		}
		const nextNearest = name && !STATE_TAGS.has(node.tag) ? name : nearest;
		for (const child of node.children ?? []) walk(child, key, targetType, nextNearest);
	};

	walk(tree, null, null, null);
	return [...templates.values()];
}

export function record() {
	// `head()` says `null` for an absent checkout and `''` for a directory that is not a
	// repository. Neither can be extracted from, and neither should read as "the pin moved".
	const pinned = head();
	if (pinned === null) throw new Error(`no checkout at ${CHECKOUT}; run \`pnpm tokens:fetch\``);
	if (pinned !== UPSTREAM.commit) {
		throw new Error(`the checkout is at ${pinned || 'no commit'}, not the pin ${UPSTREAM.commit}`);
	}

	const templates = FILES.flatMap(collect);
	// Sorted by where they are read, not by name: a reader holding the template open wants the
	// rows in the order the file states them, and a diff of this record then reads as a change
	// to the template rather than as a reshuffle.
	for (const template of templates) {
		template.parts.sort((a, b) => a.line - b.line);
		template.states.sort((a, b) => a.line - b.line);
	}

	return {
		source: {
			repo: UPSTREAM.url,
			commit: UPSTREAM.commit,
			files: FILES,
			fileCount: FILES.length,
			extractedAt: new Date().toISOString().slice(0, 10)
		},
		census: {
			templates: templates.length,
			parts: templates.reduce((n, t) => n + t.parts.length, 0),
			states: templates.reduce((n, t) => n + t.states.length, 0)
		},
		templates
	};
}

function main() {
	const doc = record();
	mkdirSync(dirname(OUTPUT), { recursive: true });
	writeFileSync(OUTPUT, `${JSON.stringify(doc, null, '\t')}\n`);
	console.log(
		`${relative(ROOT, OUTPUT)}: ${doc.census.templates} template(s), ${doc.census.parts} ` +
			`part(s), ${doc.census.states} state(s) from ${doc.source.fileCount} file(s)`
	);
}

// Imported by C8, which re-derives the record and compares — so the write must not happen on
// import, only when this file is the program.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
	try {
		main();
	} catch (error) {
		console.error(error.message);
		process.exit(1);
	}
}
