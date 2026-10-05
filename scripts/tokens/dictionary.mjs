/**
 * The shared grammar of a resource definition, used by both pinned-dictionary
 * extractors.
 *
 * Two dictionaries are read by two scripts in this project. One
 * (`scripts/tokens/extract.mjs`) reads every `*_themeresources*.xaml` from the
 * sparse `microsoft-ui-xaml` clone and writes `data/winui-tokens.json`. The
 * other (`scripts/framework/extract.mjs`) reads the framework's
 * `generic.xaml` from the same clone, `dxaml/xcp/dxaml/themes/`, and writes
 * `data/winui-framework.json`. They produce the same shape of record file —
 * the file the generator's CSS custom-property layer is built from — and the
 * only reason that comparability survives is that the rule for "this is a
 * resource definition" is one rule, written once, here.
 *
 * A definition is a keyed element that is not itself a `ResourceDictionary`
 * and does not sit inside another keyed non-`ResourceDictionary` element. The
 * second clause is what keeps template internals — a keyed `ControlTemplate`
 * inside a keyed `Style`, say — out of the census.
 */

// Tags whose resource is a single literal for the generator to read later. The value
// stays a string on purpose: `'14'` becomes `14px`, `1.4` or a unitless number
// depending on the property it lands on, and that is not this script's decision.
export const SCALARS = new Set([
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
export function payload(node) {
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
				// `data/winui-tokens.json` or `data/winui-framework.json`, where they are
				// derived from what was actually read. A number written here is counted
				// once, over whatever scope the person had in their shell, and is wrong
				// from the next re-pin onward.
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
export function definitions(file, root) {
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
export const tally = (counts) =>
	Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)));

/**
 * The first place `a` and `b` disagree, named by path, or `null`.
 *
 * Structural rather than a string comparison of the two serialisations: the point of
 * `--check` is that the committed record still describes the pinned upstream — one
 * extractor pins a commit, the other pins a package version, and a diff report that
 * says "line 41207 differs" answers a different question.
 */
export function difference(a, b, path = '') {
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
