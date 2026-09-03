import { readdir, readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, sep } from 'node:path';

// `new URL(...).pathname` is a URL component, not a filesystem path: it is
// percent-encoded, and on Windows `file:///C:/repo` yields `/C:/repo`, which no
// `readdir` can open. Every gate walks from here, so getting this wrong turns the
// whole suite green on a runner where nothing can be read — and D6 puts a Windows
// runner in the plan.
export const ROOT = fileURLToPath(new URL('../../', import.meta.url)).replace(/[\\/]$/, '');

// Matched against a path prefix relative to the root, never a bare directory name:
// `src/lib/components/build/` is ours and must be scanned.
const SKIP = ['node_modules', '.git', '.svelte-kit', 'dist', 'build', '.private', 'test-results'];

const skipped = (path) => SKIP.some((s) => path === s || path.endsWith(`${sep}${s}`));

/** Every file under `dir` whose basename matches `test`, as paths relative to the root. */
export async function walk(dir, test, seen = new Set()) {
	const out = [];

	// A symlink cycle under the source tree would otherwise recurse until the process
	// dies, which reads as a hung run rather than a failed one.
	const key = await stat(join(ROOT, dir))
		.then((s) => `${s.dev}:${s.ino}`)
		.catch(() => null);
	if (key) {
		if (seen.has(key)) return out;
		seen.add(key);
	}

	let entries;
	try {
		entries = await readdir(join(ROOT, dir), { withFileTypes: true });
	} catch (error) {
		// A missing directory is a legitimate state — a gate asks about a tree that
		// does not exist yet. Anything else (permissions, a file where a directory
		// belongs) is a broken checkout, and swallowing it would report the tree as
		// clean when it was never read.
		if (error.code === 'ENOENT') return out;
		throw error;
	}
	for (const entry of entries) {
		const path = join(dir, entry.name);
		if (skipped(path)) continue;

		// `withFileTypes` does not follow links, so a symlinked source tree reports as
		// neither file nor directory and would vanish from every gate.
		let isDir = entry.isDirectory();
		if (entry.isSymbolicLink()) {
			try {
				isDir = (await stat(join(ROOT, path))).isDirectory();
			} catch {
				continue; // a dangling link is not a source file
			}
		}

		if (isDir) out.push(...(await walk(path, test, seen)));
		else if (test(entry.name)) out.push(path);
	}
	return out;
}

export const read = async (path) => {
	try {
		return await readFile(join(ROOT, path), 'utf8');
	} catch (error) {
		// Named, so a gate reports "divergences.md is missing" rather than a bare ENOENT
		// from somewhere in the runner.
		throw new Error(`cannot read ${path}: ${error.code ?? error.message}`, { cause: error });
	}
};

export const pass = (detail) => ({ status: 'pass', detail });
export const fail = (detail, sites = []) => ({ status: 'fail', detail, sites });

/**
 * The gate is wired but the thing it inspects does not exist yet. It reports every
 * run, naming the version that makes it live, so a gate cannot quietly stay asleep.
 *
 * `pending` is for "not due yet", never for "could not look". A gate that cannot
 * read what it is supposed to check must fail.
 */
export const pending = (activeIn, detail) => ({ status: 'pending', activeIn, detail });

/**
 * CSS declarations inside `source`, as `{ prop, value, line }`.
 *
 * Scanned with a brace walker rather than line regexes, because a line has no idea
 * whether it holds a declaration, a selector, or an at-rule prelude — which is how
 * `@media (min-width: 640px)` ends up reported as a hard-coded length.
 */
export function declarations(source, startLine = 1) {
	const out = [];
	let buffer = '';
	let bufferLine = startLine;
	let line = startLine;
	let depth = 0;

	const flush = () => {
		const text = buffer.trim();
		buffer = '';
		if (!depth || !text.includes(':')) return;
		const at = text.indexOf(':');
		const prop = text.slice(0, at).trim();
		out.push({
			// Property names are case-insensitive in CSS and lower-cased so a gate can match
			// them; custom properties are case-SENSITIVE, so lower-casing one produces a name
			// that is not in the file — which a failure message then tells the reader to go
			// and look for.
			prop: prop.startsWith('--') ? prop : prop.toLowerCase(),
			value: text.slice(at + 1).trim(),
			line: bufferLine
		});
	};

	const clean = source.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));

	for (const char of clean) {
		if (char === '\n') line++;
		if (!buffer.trim()) bufferLine = line;

		if (char === '{') {
			buffer = ''; // a selector or an at-rule prelude, never a declaration
			depth++;
		} else if (char === '}') {
			flush();
			depth--;
		} else if (char === ';') {
			flush();
		} else {
			buffer += char;
		}
	}
	return out;
}

/** `<style>` block bodies in a Svelte component, with the line each one starts on. */
export function styleBlocks(source) {
	// The opening tag is matched allowing quoted attribute values, so a `>` inside
	// `<style data-x="a>b">` does not truncate the block.
	const open = /<style\b(?:"[^"]*"|'[^']*'|[^>])*>/gi;
	const out = [];
	let match;
	while ((match = open.exec(source))) {
		const from = match.index + match[0].length;
		const end = source.indexOf('</style', from);
		if (end === -1) break;
		out.push({ body: source.slice(from, end), line: source.slice(0, from).split('\n').length });
		open.lastIndex = end;
	}
	return out;
}
