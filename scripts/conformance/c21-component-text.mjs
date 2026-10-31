import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fail, pass, ROOT } from './lib.mjs';

export const id = 'C21';
export const title = "a component's own text comes from the strings table";

// A consumer in another language cannot change text a component writes as a literal: an InfoBar's
// close button stayed English in a localized product, and that was what kept a consumer's trial
// from placing one. ADR 0020 puts that text in `strings.ts`, and this refuses a capitalised literal
// coming back: as an attribute that carries a name or a tooltip, plain, in an expression over any
// number of lines or in a template literal; as a `??` default; as an object's `label`; and as a
// text node, plain or in an expression.
//
// What it cannot see. A literal held in a script variable or built at run time is not read, so the
// messages `MediaTransportControls` writes for a failed playback pass here, as a ternary in a
// `$derived` would, and a field name written straight as text. A prop's default value is not read,
// and neither is an object's key other than `label`. An expression is read only up to its first
// inner `}`, and only in single quotes, or backticks in an attribute, so `{f({ a }, 'Close')}`
// passes, and so does `{o ? "Can't" : ''}`. A text-node expression is read only directly before a
// tag or a `{`. A literal starting with anything but A to Z passes, as a `data-*` value or a
// `class` must, and so does a text node with punctuation in it. An attribute outside `NAMING` is
// not read. `.ts` files are not read. The Gallery is not read: its text is the original Gallery's,
// as the reference shows. A third party's own attributes, spread through its props, are not read:
// bits-ui's and Zag's labels were found by reading them. A text-node expression after text passes,
// and so does a ternary in an object's `label`.

const DIRS = ['packages/winui-svelte/src/lib/components', 'packages/winui-svelte/src/lib/internal'];

const NAMING =
	'(?:aria-label|aria-description|aria-roledescription|aria-valuetext|alt|title|content|tooltip|label|placeholder|placeholderText|header|text)';
const LITERALS = [
	new RegExp(`\\b${NAMING}=["'][A-Z][^"']*["']`, 'g'),
	new RegExp(`\\b${NAMING}=\\{[^}]*'[A-Z][^']*'[^}]*\\}`, 'g'),
	new RegExp(`\\b${NAMING}=\\{[^}]*\`[A-Z][^\`]*\``, 'g'),
	/\?\?\s*'[A-Z]/g,
	/\blabel:\s*'[A-Z][^']*'/g,
	/(?:(?<!=)>|\})\s*[A-Z][A-Za-z0-9]*(?:\s+[A-Za-z0-9]+)*\s*(?=<|\{)/g,
	/(?:(?<!=)>|\})\s*\{[^}]*'[A-Z][^']*'[^}]*\}\s*(?=<|\{)/g
];

const uncommented = (source) =>
	source
		.replace(/<style[\s\S]*?<\/style>/g, '')
		.replace(/<!--[\s\S]*?-->/g, (comment) => comment.replace(/[^\n]/g, ' '))
		.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, ' '))
		.replace(/(^|\s)\/\/.*$/gm, '')
		.replace(/\bstr\([^)]*\)/g, (read) => read.replace(/[^\n]/g, ' '));

export async function run() {
	const sites = [];
	let files = 0;
	for (const dir of DIRS) {
		for (const file of await readdir(join(ROOT, dir))) {
			if (!file.endsWith('.svelte')) continue;
			files++;
			const source = uncommented(await readFile(join(ROOT, dir, file), 'utf8'));
			for (const pattern of LITERALS) {
				for (const match of source.matchAll(pattern)) {
					const line = source.slice(0, match.index).split('\n').length;
					sites.push(`${dir}/${file}:${line}  ${match[0].trim()}`);
				}
			}
		}
	}
	if (files === 0) return fail('read no component');
	return sites.length
		? fail(`${sites.length} literal(s) a consumer cannot translate`, sites)
		: pass(`${files} component file(s)`);
}
