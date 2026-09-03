import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, relative, sep } from 'node:path';
import { CHECKOUT, head, ROOT, UPSTREAM } from './fetch.mjs';
import { parse } from './xaml.mjs';

const OUTPUT = join(ROOT, 'data', 'winui-tokens.json');

// The parallel `*_perf2026*` set rewrites visual-state mechanics and changes no token
// value — ADR 0001. Reading both would give every key an identical twin.
const SOURCE = (name) => /_themeresources.*\.xaml$/.test(name) && !name.includes('perf2026');

// Tags whose resource is a single literal for the generator to read later. The value
// stays a string on purpose: `'14'` becomes `14px`, `1.4` or a unitless number
// depending on the property it lands on, and that is not this script's decision.
const SCALARS = new Set([
	'Thickness',
	'CornerRadius',
	'GridLength',
	'x:Double',
	'x:Int32',
	'x:String',
	'x:Boolean',
	'FontWeight',
	'FontFamily',
	'Symbol',
	'Visibility',
	'HorizontalAlignment',
	'VerticalAlignment',
	'TextTrimming',
	'BackgroundSizing',
	'ListViewItemPresenterCheckMode'
]);

/** Every `*_themeresources*.xaml` under `controls/dev/`, checkout-relative and sorted. */
function sources() {
	const out = [];
	const walk = (dir) => {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			const path = join(dir, entry.name);
			if (entry.isDirectory()) walk(path);
			else if (SOURCE(entry.name)) out.push(relative(CHECKOUT, path).split(sep).join(posix.sep));
		}
	};
	walk(join(CHECKOUT, 'controls', 'dev'));
	// POSIX separators before sorting, so the order does not depend on which platform
	// produced the committed file.
	return out.sort();
}

function* descendants(node) {
	for (const child of node.children) {
		yield child;
		yield* descendants(child);
	}
}

const pick = (attrs, names) => {
	const out = {};
	for (const [to, from] of Object.entries(names)) if (from in attrs) out[to] = attrs[from];
	return out;
};

/**
 * The kind-specific half of a record.
 *
 * `unsupported` is a result, not a failure: a later unit that needs `AcrylicBrush`
 * has to find it listed rather than absent, or the record file stops being a census
 * and becomes a filtered opinion about what mattered on the day it was written.
 */
function payload(node) {
	switch (node.tag) {
		case 'Color':
			return { kind: 'color', value: node.text };

		case 'SolidColorBrush':
		case 'media:SolidColorBrush':
			return { kind: 'brush', ...pick(node.attrs, { color: 'Color', opacity: 'Opacity' }) };

		case 'LinearGradientBrush': {
			const record = {
				kind: 'gradient',
				...pick(node.attrs, {
					mappingMode: 'MappingMode',
					startPoint: 'StartPoint',
					endPoint: 'EndPoint'
				}),
				stops: []
			};
			// Read from the subtree rather than from a fixed child path: upstream writes
			// `RelativeTransform` before `GradientStops` in some definitions and after it
			// in others, and both spellings are the same brush.
			for (const child of descendants(node)) {
				if (child.tag === 'GradientStop')
					record.stops.push({ offset: child.attrs.Offset, color: child.attrs.Color });
				else if (child.tag === 'ScaleTransform' && !record.relativeTransform)
					record.relativeTransform = pick(child.attrs, { scaleY: 'ScaleY', centerY: 'CenterY' });
			}
			return record;
		}

		case 'AcrylicBrush':
			return {
				kind: 'acrylic',
				...pick(node.attrs, {
					tintColor: 'TintColor',
					tintOpacity: 'TintOpacity',
					tintLuminosityOpacity: 'TintLuminosityOpacity',
					fallbackColor: 'FallbackColor'
				})
			};

		case 'StaticResource':
			return { kind: 'alias', to: node.attrs.ResourceKey };

		case 'Style': {
			// The record mirrors the source shape rather than flattening it: `basedOn`
			// stays a raw `{StaticResource X}` so the generator can resolve it through
			// its existing REFERENCE regex, and `setters` keeps every <Setter> in
			// document order — including the ones that are not font values, which the
			// type-ramp converter names and ignores rather than dropping.
			const record = {
				kind: 'style',
				targetType: node.attrs.TargetType,
				setters: []
			};
			if (node.attrs.BasedOn !== undefined) record.basedOn = node.attrs.BasedOn;
			for (const child of node.children) {
				if (child.tag !== 'Setter') continue;
				// A <Setter> holds its value one of three ways: a `Value` attribute, a
				// `<Setter.Value>` child carrying a whole object, or neither. The first is
				// what every type-ramp setter uses; the second is mostly a `ControlTemplate`;
				// the third is a malformed source, recorded so the census keeps listing it.
				//
				// Counts belong to the census, not to this comment — read them out of
				// `data/winui-tokens.json`, where they are derived from what was actually
				// read. A number written here is counted once, over whatever scope the
				// person had in their shell, and is wrong from the next re-pin onward.
				const setter = { property: child.attrs.Property };
				if (child.attrs.Value !== undefined) setter.value = child.attrs.Value;
				else {
					const valueChild = child.children.find((c) => c.tag === 'Setter.Value');
					setter.unsupported = valueChild ? (valueChild.children[0]?.tag ?? null) : null;
				}
				record.setters.push(setter);
			}
			return record;
		}

		default:
			if (SCALARS.has(node.tag)) return { kind: 'scalar', type: node.tag, value: node.text };
			return { kind: 'unsupported', tag: node.tag };
	}
}

/**
 * Every resource definition in one parsed file, in document order, and the theme
 * names the file carries.
 *
 * A definition is a keyed element that is not itself a `ResourceDictionary` and does
 * not sit inside another keyed non-`ResourceDictionary` element. That last clause is
 * what keeps `ScrollBar_themeresources.xaml`'s keyed `ControlTemplate`s — which live
 * inside a keyed `Style` — out of the census: they are template internals, not tokens.
 *
 * Nothing is merged. Two definitions of one key in one theme produce two records,
 * because which of them a running app resolves is a precedence question this script
 * has no standing to answer, and answering it by dropping one is how the answer stops
 * being visible at all.
 */
function definitions(file, root) {
	const records = [];
	const themes = new Set();

	const visit = (node, theme) => {
		for (const child of node.children) {
			// Theme is a question about ancestors, answered structurally. A depth counter
			// agrees with this on the uniform files and disagrees on any that nests.
			const themed =
				child.tag === 'ResourceDictionary' && node.tag === 'ResourceDictionary.ThemeDictionaries';
			const inherited = themed ? (child.attrs['x:Key'] ?? null) : theme;
			if (themed) themes.add(inherited);

			const key = child.attrs['x:Key'];
			if (key !== undefined && child.tag !== 'ResourceDictionary') {
				const { kind, ...rest } = payload(child);
				records.push({ key, theme: inherited, kind, file, line: child.line, ...rest });
			} else {
				visit(child, inherited);
			}
		}
	};

	visit(root, null);
	return { records, themes };
}

/** Counts, ordered by frequency so the printed census leads with what dominates it. */
const tally = (counts) =>
	Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)));

function extract() {
	const files = sources();
	const resources = [];
	const themeFiles = {};
	let themed = 0;

	for (const file of files) {
		const { records, themes } = definitions(
			file,
			parse(readFileSync(join(CHECKOUT, file), 'utf8'))
		);
		resources.push(...records);
		if (themes.size) themed++;
		for (const theme of themes) themeFiles[theme] = (themeFiles[theme] ?? 0) + 1;
	}

	const byKind = {};
	const unsupportedTags = {};
	for (const record of resources) {
		byKind[record.kind] = (byKind[record.kind] ?? 0) + 1;
		if (record.kind === 'unsupported')
			unsupportedTags[record.tag] = (unsupportedTags[record.tag] ?? 0) + 1;
	}

	return {
		source: {
			url: UPSTREAM.url,
			ref: UPSTREAM.ref,
			commit: UPSTREAM.commit,
			extractedAt: new Date().toISOString().slice(0, 10),
			fileCount: files.length,
			// Hashed from the raw bytes, not the decoded text: the point is to be able to
			// prove later that the checkout the record was read from is the one the
			// commit above names.
			files: files.map((path) => ({
				path,
				sha256: createHash('sha256')
					.update(readFileSync(join(CHECKOUT, path)))
					.digest('hex')
			}))
		},
		census: {
			files: files.length,
			filesWithThemeDictionaries: themed,
			filesWithout: files.length - themed,
			themes: tally(themeFiles),
			records: resources.length,
			byKind: tally(byKind),
			unsupportedTags: tally(unsupportedTags),
			distinctKeys: new Set(resources.map((record) => record.key)).size
		},
		resources
	};
}

const census = (doc) => {
	const { themes, byKind, unsupportedTags, ...rest } = doc.census;
	const line = (counts) =>
		Object.entries(counts)
			.map(([name, n]) => `${name} ${n}`)
			.join(', ');
	return [
		`source            ${doc.source.url} @ ${doc.source.commit}`,
		`files             ${rest.files} scanned, ${rest.filesWithThemeDictionaries} with theme dictionaries, ${rest.filesWithout} without`,
		`themes            ${line(themes)}`,
		`records           ${rest.records} across ${rest.distinctKeys} distinct keys`,
		`by kind           ${line(byKind)}`,
		`unsupported tags  ${line(unsupportedTags)}`
	].join('\n');
};

/**
 * The first place `a` and `b` disagree, named by path, or `null`.
 *
 * Structural rather than a string comparison of the two serialisations: the point of
 * `--check` is that the committed record still describes the pinned commit, and a
 * diff report that says "line 41207 differs" answers a different question.
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
			`.upstream/microsoft-ui-xaml ${state}, not ${UPSTREAM.commit}. Run \`pnpm tokens:fetch\`.`
		);
	}

	const doc = extract();

	if (argv.includes('--check')) {
		if (!existsSync(OUTPUT)) throw new Error(`${relative(ROOT, OUTPUT)} does not exist.`);
		const committed = JSON.parse(readFileSync(OUTPUT, 'utf8'));

		// A timestamp is not content: re-running the extractor on a different day must
		// not report the committed file as stale.
		const strip = (record) => {
			const source = { ...record.source };
			delete source.extractedAt;
			return { ...record, source };
		};
		const found = difference(strip(committed), strip(doc));
		if (found) throw new Error(`${relative(ROOT, OUTPUT)} differs from the extractor: ${found}`);

		console.log(`${relative(ROOT, OUTPUT)} matches the extractor (${doc.census.records} records).`);
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
