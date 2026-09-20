import { fail, pass, read } from './lib.mjs';

export const id = 'C11';
export const title = 'every template part is disposed of, and every disposition names a part';

const RECORD = 'data/winui-template-parts.json';
const DOC = 'docs/template-parts.md';
const COMPONENTS = 'packages/winui-svelte/src/lib/components';

/** `## \`<template key>\` in \`<component file>\`` — the one heading shape a section may take. */
const SECTION = /^##\s+`([^`]+)`\s+in\s+`([^`]+)`\s*$/;
/** A row of the pending table: `| \`<template key>\` | ... |`. */
const PENDING_ROW = /^\|\s*`([^`]+)`\s*\|/;
/** `| \`<Part>\` | <disposition> | <where> |` */
const ROW = /^\|\s*`([^`]+)`\s*\|\s*([a-z]+)\s*\|\s*(.+?)\s*\|\s*$/;
const DISPOSITIONS = new Set(['reproduced', 'declined', 'open']);

/**
 * The selectors a `reproduced` row may claim, pulled out of its prose.
 *
 * A `Where` cell is written for a reader, so it is a sentence with the selector inside it rather
 * than a bare selector. What this takes out of it is every backticked token that looks like a
 * class, a custom property or a pseudo-element — and the check is that the component carries it.
 *
 * That check is the reason the file is worth having. The rest of C11 compares two lists and would
 * pass a table written in one sitting with nothing opened; this is the part that requires the
 * author to have looked. A cell whose prose names no selector at all is allowed, because some
 * parts are genuinely reproduced by a rule rather than by an element — but it has to say so in
 * words a reader can check, and `reproduced` with an empty cell is refused below.
 */
const SELECTOR = /`([.][a-z][a-z0-9-]*(?:::[a-z-]+)?|--[a-z][a-z0-9-]*)`/g;

/**
 * Does `source` carry `needle` — a class selector like `.pane`, or a custom property?
 *
 * A rule of its own is the usual answer and the strong one. The other answer is a class that
 * only ever reaches a child component as a prop, which has no rule here because a class crossing
 * a component boundary carries no scope hash and is styled by the callee. `items-container-grid`
 * is exactly that, and searching only for `.items-container-grid` called a part unreproduced that
 * the markup plainly sets. So a bare occurrence counts too — but only on a line that mentions
 * `class`, because this component's comments say "pane" a great many times and a check that a
 * comment satisfies is not a check.
 */
function carries(source, needle) {
	if (needle.startsWith('--')) return source.includes(needle);
	if (new RegExp(`\\${needle}(?![\\w-])`).test(source)) return true;
	const bare = new RegExp(`(?<![\\w-])${needle.slice(1)}(?![\\w-])`);
	return source.split('\n').some((line) => line.includes('class') && bare.test(line));
}

/** Section headings, in file order, each with the rows under it. */
function sections(source) {
	const found = [];
	let current = null;
	let pending = false;
	source.split('\n').forEach((line, index) => {
		const heading = line.match(SECTION);
		if (heading) {
			current = { template: heading[1], component: heading[2], rows: [], line: index + 1 };
			found.push(current);
			pending = false;
			return;
		}
		if (/^##\s/.test(line)) {
			// Any other second-level heading ends the section it follows. `## Pending` is the one
			// whose table is read rather than ignored, because a template listed there is a claim
			// too — that it exists and has not been disposed of — and both halves are checkable.
			current = null;
			pending = /^##\s+Pending\s*$/.test(line);
			return;
		}
		if (pending) {
			const row = line.match(PENDING_ROW);
			// The header row of the pending table has no backticks, so it does not match.
			if (row) found.push({ pendingTemplate: row[1], line: index + 1 });
			return;
		}
		if (!current || !line.startsWith('|')) return;
		// `| --- | --- | --- |` and the header row are the two lines a table opens with, and
		// neither carries a backticked part, so neither matches.
		const row = line.match(ROW);
		if (row)
			current.rows.push({ part: row[1], disposition: row[2], where: row[3], line: index + 1 });
		else if (/^\|\s*`/.test(line)) current.rows.push({ malformed: line.trim(), line: index + 1 });
	});
	return found;
}

export async function run() {
	const record = JSON.parse(await read(RECORD));
	const byKey = new Map(record.templates.map((t) => [t.key, t]));
	const doc = await read(DOC);
	const parsed = sections(doc);

	const problems = [];
	const disposed = parsed.filter((s) => s.template);
	const pendingKeys = parsed.filter((s) => s.pendingTemplate).map((s) => s.pendingTemplate);

	for (const key of pendingKeys) {
		if (!byKey.has(key))
			problems.push(`${DOC}: pending names \`${key}\`, which the census has no template for`);
	}

	const sources = new Map();
	const component = async (file) => {
		if (!sources.has(file)) {
			try {
				sources.set(file, await read(`${COMPONENTS}/${file}`));
			} catch {
				sources.set(file, null);
			}
		}
		return sources.get(file);
	};

	let rows = 0;
	for (const section of disposed) {
		const template = byKey.get(section.template);
		if (!template) {
			problems.push(`${DOC}:${section.line}: no template \`${section.template}\` in the census`);
			continue;
		}
		if (pendingKeys.includes(section.template)) {
			problems.push(
				`${DOC}:${section.line}: \`${section.template}\` is both disposed of and pending`
			);
		}
		const source = await component(section.component);
		if (source === null) {
			problems.push(`${DOC}:${section.line}: no component at ${COMPONENTS}/${section.component}`);
		}

		const declared = new Set();
		for (const row of section.rows) {
			if (row.malformed) {
				problems.push(
					`${DOC}:${row.line}: a row that is not \`| \`part\` | disposition | where |\``
				);
				continue;
			}
			rows++;
			if (declared.has(row.part)) {
				problems.push(`${DOC}:${row.line}: \`${row.part}\` is disposed of twice in this section`);
			}
			declared.add(row.part);
			if (!DISPOSITIONS.has(row.disposition)) {
				problems.push(
					`${DOC}:${row.line}: \`${row.disposition}\` is not one of ${[...DISPOSITIONS].join(', ')}`
				);
			}
			if (!row.where) {
				problems.push(`${DOC}:${row.line}: \`${row.part}\` states no reason`);
			}
			if (row.disposition !== 'reproduced' || source === null) continue;
			for (const [, selector] of row.where.matchAll(SELECTOR)) {
				// A pseudo-element is written on the class it hangs off, so the class is what the
				// source is searched for; `::after` on its own would match any component.
				const needle = selector.split('::')[0];
				if (!carries(source, needle)) {
					problems.push(
						`${DOC}:${row.line}: \`${row.part}\` claims ${selector}, which ${section.component} does not carry`
					);
				}
			}
		}

		for (const part of template.parts) {
			if (!declared.has(part.name)) {
				problems.push(
					`${DOC}: \`${section.template}\` in \`${section.component}\` does not dispose of \`${part.name}\` (${template.file}:${part.line})`
				);
			}
		}
		const names = new Set(template.parts.map((p) => p.name));
		for (const part of declared) {
			if (!names.has(part)) {
				problems.push(
					`${DOC}: \`${part}\` is disposed of under \`${section.template}\`, which has no such part`
				);
			}
		}
	}

	// A template that is neither disposed of nor listed as pending is the failure this gate is
	// for: it is the shape every one of the six parts arrived in, which is nobody having said
	// either way.
	for (const template of record.templates) {
		const claimed = disposed.some((s) => s.template === template.key);
		if (!claimed && !pendingKeys.includes(template.key)) {
			problems.push(`${DOC}: \`${template.key}\` is neither disposed of nor listed as pending`);
		}
	}

	if (problems.length) {
		return fail(`${problems.length} problem(s) in the part dispositions`, problems);
	}
	const covered = disposed.reduce((n, s) => n + s.rows.length, 0);
	return pass(
		`${rows} disposition(s) over ${disposed.length} reproduction(s), ` +
			`covering ${covered} of the census's ${record.census.parts} part(s); ` +
			`${pendingKeys.length} template(s) pending`
	);
}
