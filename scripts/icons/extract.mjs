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
import { FALLBACK_GLYPHS } from './fallback.mjs';
import { FALLBACK_RECORD as RECORD } from './font.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url)).replace(/[\\/]$/, '');
const PACKAGE = '@fluentui/svg-icons';

const require = createRequire(import.meta.url);
const packageDir = dirname(require.resolve(`${PACKAGE}/package.json`));
const { version, license } = JSON.parse(await readFile(join(packageDir, 'package.json'), 'utf8'));

// A Fluent SVG is one `<path d>` in a square `viewBox`; anything else is a shape this record
// has no place for, and failing on it is cheaper than drawing half of an icon.
const SVG = /^<svg [^>]*viewBox="0 0 (\d+) \1"[^>]*><path d="([^"]+)"\/><\/svg>$/;

const icons = {};
for (const name of [...new Set(FALLBACK_GLYPHS.map((glyph) => glyph.fluent))].sort()) {
	const svg = (await readFile(join(packageDir, 'icons', `${name}.svg`), 'utf8')).trim();
	const match = SVG.exec(svg);
	if (!match) throw new Error(`${name}.svg is not one path in a square viewBox`);
	icons[name] = { size: Number(match[1]), d: match[2] };
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
