import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fail, pass, ROOT } from './lib.mjs';

export const id = 'C20';
export const title =
	'every exported component keeps ADR 0009: its names, callbacks and escape hatch';

// ADR 0009's rule was enforced by nothing, and the package drifted from it in the release itself:
// `isIndeterminate` kept its prefix on two components, `primaryButtonDisabled` turned a polarity
// round beside `backButtonEnabled`, and `NavigationViewItem` took no `class` at all. Two external
// reviews found those by reading. This reads each component `index.ts` and `preview.ts` export,
// so an internal part like `NavigationViewTopItem` is not held to a consumer's surface.
//
// What it cannot see. It reads the `$props()` destructure as text, so a prop in the interface and
// not destructured is not read, and neither is a quoted key like `'aria-label'`. A bare `<` or `>`
// in a default value, an unbalanced bracket in a string, or a `//` in a string default runs entries
// together, and a comma in a string default splits one. It does not know the WinUI member, so a
// name that drops a word, as `lightDismiss` did, passes, and only `iconSource` and `iconGlyph` are
// refused of the spellings a code point has had: a new one passes. It reads that a callback or an
// escape hatch is declared and not that it is used, and it does not test the middle of a name, so
// `onIsFooChange` on a prop that is not bindable passes.

const LIB = 'packages/winui-svelte/src/lib';

// ADR 0009's 2026-10-31 amendment: what the control reports of itself, a measurement or a handle,
// and not a change a consumer asks for. A harness may seed one, as a specimen of the state.
const MEASURED = {
	ScrollView: [
		'horizontalOffset',
		'verticalOffset',
		'extentWidth',
		'extentHeight',
		'viewportWidth',
		'viewportHeight',
		'scrollableWidth',
		'scrollableHeight'
	],
	ScrollViewer: ['horizontalOffset', 'verticalOffset'],
	MediaPlayerElement: ['mediaPlayer'],
	MediaTransportControls: ['duration', 'sourceLoaded', 'mediaState', 'errorText']
};

// What a component's rest props hand on to the component it is, which declares them:
// `SplitButton` takes `class`, `style` and `onOpenChange`.
const DELEGATED = { ToggleSplitButton: ['class', 'style', 'open'] };

const CODE_POINT_NAMES = new Set(['iconSource', 'iconGlyph']);

/** A destructure's entries, split at its own commas and not at a default value's. */
function topLevel(body) {
	const entries = [];
	let depth = 0;
	let entry = '';
	for (const character of body.replaceAll('=>', '')) {
		if ('([{<'.includes(character)) depth++;
		if (')]}>'.includes(character)) depth--;
		if (character === ',' && depth === 0) {
			entries.push(entry.trim());
			entry = '';
		} else entry += character;
	}
	entries.push(entry.trim());
	return entries.filter(Boolean);
}

export async function run() {
	const sites = [];
	let components = 0;
	let props = 0;
	const index = await Promise.all(
		['index.ts', 'preview.ts'].map((file) => readFile(join(ROOT, LIB, file), 'utf8'))
	);
	const names = new Set(
		index.flatMap((source) =>
			[...source.matchAll(/default as ([A-Za-z0-9]+) \} from '\.\/components\//g)].map(
				(match) => match[1]
			)
		)
	);
	// Any default export this did not read as a component, so that a `default as` written another
	// way fails here. A component exported with no `default as` at all is not seen.
	const exported = new Set(
		index.flatMap((source) => [...source.matchAll(/\bdefault as ([A-Za-z0-9]+)/g)].map((m) => m[1]))
	);
	if (names.size === 0 || exported.size !== names.size) {
		return fail(`read ${names.size} components of ${exported.size} default exports`);
	}
	for (const name of [...names].sort()) {
		const path = `${LIB}/components/${name}.svelte`;
		const source = await readFile(join(ROOT, path), 'utf8');
		const destructure = source.match(/let\s*\{([\s\S]*?)\}\s*(?::[^=]*)?=\s*\$props\(\)/);
		if (!destructure) {
			sites.push(`${path}: no \`$props()\` destructure to read`);
			continue;
		}
		components++;
		const body = destructure[1];
		const entries = topLevel(body.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, ''));
		const declared = entries
			.map((entry) => entry.match(/^([a-zA-Z][a-zA-Z0-9]*)/)?.[1])
			.filter(Boolean);
		props += declared.length;
		for (const prop of declared) {
			if (/^(is|has|can)[A-Z]/.test(prop)) sites.push(`${path}: \`${prop}\` keeps its prefix`);
			if (/.Disabled$/.test(prop)) sites.push(`${path}: \`${prop}\` inverts a WinUI polarity`);
			if (CODE_POINT_NAMES.has(prop)) sites.push(`${path}: \`${prop}\`: a code point is \`glyph\``);
		}
		const delegated = DELEGATED[name] ?? [];
		const bindable = entries
			.filter((entry) => /=\s*\$bindable/.test(entry))
			.map((entry) => entry.match(/^([a-zA-Z][a-zA-Z0-9]*)/)?.[1])
			.filter(Boolean);
		for (const prop of bindable) {
			if (prop === 'ref' || MEASURED[name]?.includes(prop) || delegated.includes(prop)) continue;
			const callback = `on${prop[0].toUpperCase()}${prop.slice(1)}Change`;
			if (!declared.includes(callback)) sites.push(`${path}: \`${prop}\` has no \`${callback}\``);
		}
		if (!declared.includes('class') && !delegated.includes('class'))
			sites.push(`${path}: takes no \`class\``);
		if (!declared.includes('style') && !delegated.includes('style'))
			sites.push(`${path}: takes no \`style\``);
		if (!declared.includes('ref')) sites.push(`${path}: takes no \`ref\``);
		if (!entries.some((entry) => entry.startsWith('...')))
			sites.push(`${path}: declares no rest props`);
	}
	return sites.length
		? fail(`${sites.length} departures from ADR 0009`, sites)
		: pass(`${components} components, ${props} props`);
}
