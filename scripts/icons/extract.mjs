// Copies the outlines `fallback.mjs` names out of the installed `@fluentui/svg-icons` into
// data/winui-icon-fallback.json, the record `font.mjs` builds the fallback face from. The record
// is committed so that the token generator reads a file in the tree, as it does for every other
// input, rather than whatever version `node_modules` holds; `pnpm icons:extract` refreshes it.
// The npm package carries no licence file, only `"license": "MIT"`; the notice in NOTICE.md is the
// repository's LICENSE, github.com/microsoft/fluentui-system-icons, as of 2026-10-16.
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import svgpath from 'svgpath';
import { FALLBACK_GLYPHS } from './fallback.mjs';
import { FALLBACK_RECORD as RECORD } from './font.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url)).replace(/[\\/]$/, '');
const PACKAGE = '@fluentui/svg-icons';

const require = createRequire(import.meta.url);
const packageDir = dirname(require.resolve(`${PACKAGE}/package.json`));
const { version, license } = JSON.parse(await readFile(join(packageDir, 'package.json'), 'utf8'));

// A Fluent SVG is one or more bare `<path d>`s in a square `viewBox`, which the record joins
// into one path, a glyph's outline being one list of subpaths; anything else is a shape this
// record has no place for, and failing on it is cheaper than drawing half of an icon.
const SVG = /^<svg [^>]*viewBox="0 0 (\d+) \1"[^>]*>((?:<path d="[^"]+"\/>)+)<\/svg>$/;
const PATH = /<path d="([^"]+)"\/>/g;

const icons = {};
for (const name of [...new Set(FALLBACK_GLYPHS.map((glyph) => glyph.fluent))].sort()) {
	const svg = (await readFile(join(packageDir, 'icons', `${name}.svg`), 'utf8')).trim();
	const match = SVG.exec(svg);
	if (!match) throw new Error(`${name}.svg is not bare paths in a square viewBox`);
	// One path is kept as written. Several are each made absolute before they are joined: a path
	// that opens with a relative `m` starts at the origin on its own, and after another path it
	// would start from wherever that one left off. ADR 0018's amendment says what the join
	// assumes of their winding.
	const paths = [...match[2].matchAll(PATH)].map((path) => path[1]);
	const d =
		paths.length === 1
			? paths[0]
			: paths.map((path) => svgpath(path).abs().round(3).toString()).join(' ');
	icons[name] = { size: Number(match[1]), d };
}

const record = {
	source: {
		package: PACKAGE,
		version,
		license,
		url: 'https://github.com/microsoft/fluentui-system-icons'
	},
	icons
};
await writeFile(join(ROOT, RECORD), `${JSON.stringify(record, null, '\t')}\n`);
console.log(
	`written           ${RECORD} (${Object.keys(icons).length} icons, ${PACKAGE} ${version})`
);
