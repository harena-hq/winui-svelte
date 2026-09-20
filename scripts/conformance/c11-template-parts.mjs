import { fail, pass, read } from './lib.mjs';

export const id = 'C11';
export const title =
	'every template part and state is disposed of, and every disposition names one';

const RECORD = 'data/winui-template-parts.json';
const DOC = 'docs/template-parts.md';
const COMPONENTS = 'packages/winui-svelte/src/lib/components';

/** `## \`<template key>\` in \`<component file>\`` — the one heading shape a section may take. */
const SECTION = /^##\s+`([^`]+)`\s+in\s+`([^`]+)`\s*$/;
/** `### Parts` or `### States` — which of a section's two tables the rows below belong to. */
const SUBSECTION = /^###\s+(Parts|States)\s*$/;
/** A row of the pending table: `| \`<template key>\` | ... |`. */
const PENDING_ROW = /^\|\s*`([^`]+)`\s*\|/;
/** A row of the pending-states table: `| \`<template key>\` | \`<component file>\` | ... |`. */
const PENDING_STATES_ROW = /^\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|/;
/** `| \`<Part>\` | <disposition> | <where> |` */
const ROW = /^\|\s*`([^`]+)`\s*\|\s*([a-z]+)\s*\|\s*(.+?)\s*\|\s*$/;
const DISPOSITIONS = {
	parts: new Set(['reproduced', 'declined', 'open']),
	// `inert` is the fourth, and it exists only on this axis. A part the template declares is
	// drawn; a state it declares may be one nothing ever enters, and `TitleBarVisibilityGroup`
	// is two of those. Calling that `declined` would say this library chose not to offer the
	// surface, when there is no surface to offer — and it would stay true if a later pin wired
	// the state up, which is the one moment the row needs to go wrong.
	states: new Set(['reproduced', 'declined', 'open', 'inert'])
};

/**
 * The selectors a `reproduced` row may claim, pulled out of its prose.
 *
 * A `Where` cell is written for a reader, so it is a sentence with the selector inside it rather
 * than a bare selector. What this takes out of it is every backticked token that looks like a
 * class, a custom property, an attribute or an attribute selector — and the check is that the
 * component carries it.
 *
 * That check is the reason the file is worth having. The rest of C11 compares two lists and would
 * pass a table written in one sitting with nothing opened; this is the part that requires the
 * author to have looked. A cell whose prose names no selector at all is allowed, because some
 * parts are genuinely reproduced by a rule rather than by an element — but it has to say so in
 * words a reader can check, and `reproduced` with an empty cell is refused below.
 *
 * The attribute forms are what the state axis needs. A `VisualState` is answered here by a value
 * of an attribute on `.root` rather than by an element, so `[data-collapsed='true']` is the whole
 * of what a state row has to name — and it is a stronger claim than a class, because the check
 * below looks for that exact bracketed text in the stylesheet rather than for a bare word.
 *
 * A span is read whole or not at all, and that is what keeps `NavigationView.xaml` from being
 * read as a claim about a class named `xaml`. It also means a span has to be *only* a selector:
 * a compound one is taken apart into its tokens, and a span with a word in it is prose. Written
 * the other way — scanning any span for anything selector-shaped — a cell could satisfy the
 * check with a file name, and every citation in this file is a file name.
 *
 * Upper-case is not a selector here, by choice rather than by oversight: this library's classes
 * are lower-case, and admitting `.PaneRoot` would mean admitting every capitalised XAML part
 * name a cell mentions. The consequence to know is that a row naming one good selector and one
 * capitalised token passes with the second unexamined — the fallback rule below is satisfied per
 * row, while the check above is per token — so a green gate over `.PaneRoot` says nothing.
 */
const TOKEN =
	/[.][a-z][a-z0-9-]*(?:::[a-z-]+)?|--[a-z][a-zA-Z0-9-]*|\[data-[a-z][a-z0-9-]*(?:=(['"])[a-z][a-z0-9-]*\1)?\]|data-[a-z][a-z0-9-]*/g;
/**
 * What may stand between two tokens of one selector, and nothing else may.
 *
 * The comma is here because a list is as natural a way to answer a state as a descendant chain —
 * one state often sets two elements — and without it a list was discarded whole, taking the real
 * token in it down with the bogus one. That is the same hole a compound used to open, one
 * character narrower.
 */
const CONNECTIVE = /^(?:\s|[>+~,]|:not\(|\))*$/;
/** A citation rather than a claim: a pin or repository line, which proves nothing about our CSS. */
const CITATION = /\.(?:xaml|cpp|idl|h|svelte|mjs|ts|css|json|md)\b|:\d/;

/**
 * The word that turns a claim around, and the only one admitted.
 *
 * A cell reading "no `[data-collapsed='false']`" says the component keys nothing on that value.
 * Every other claim says the opposite, and this gate used to read the token out of such a cell
 * and check the value was *present* — five state rows were written that way and all five passed
 * pointing backwards. It has to be the word immediately before the span, because a cell is prose
 * and says "no" about the pin as often as about us.
 */
const NEGATION = /(?:^|[^\w-])no\s+$/i;
/**
 * What a cell may deny, and it is narrower than what it may claim.
 *
 * An attribute selector carrying a value is absent from a *source*: no rule anywhere is keyed on
 * it. A class is not — an element absent in one state is rendered in another, so its class is in
 * the file either way, and "no `.x`" is a sentence about a state that no search of the text can
 * refute. Those rows say `absence:` instead and are counted rather than checked.
 *
 * The value is what is denied; the attribute around it is claimed, and checked the ordinary way.
 * Without that half the denial is free — every value of an attribute nobody wrote is absent —
 * and a free claim is the escape the positive path exists to close.
 */
const NEGATABLE = /^\[data-[a-z][a-z0-9-]*=/;
/**
 * A cell's own declaration that this state is reproduced by an element that is not rendered, and
 * that nothing in the component's text witnesses it.
 *
 * It is a marker rather than a fifth disposition because the two say different things: the
 * disposition is what this library did, and `reproduced` is accurate — the state holds and the
 * rendering matches. This says what the gate was able to check about it, which is nothing.
 */
const ABSENCE = /^absence:\s/;

/**
 * Every claim a cell makes: the tokens of each backticked span that is a selector entire, each
 * carrying the direction the cell states it in.
 */
function* claims(where) {
	for (const { text, before } of spans(where)) {
		const tokens = text.match(TOKEN);
		if (!tokens) continue;
		// A span is a selector only if taking its tokens out leaves nothing but connectives. That
		// is what `PaneContentGrid.Margin` and `SplitView.svelte` fail, and a compound like
		// `.root:not([data-overlay='true']) .pane` passes — so a compound is checked token by
		// token rather than skipped, which is how it used to dodge the check entirely.
		if (!CONNECTIVE.test(text.replace(TOKEN, ''))) continue;
		const negated = NEGATION.test(before);
		for (const token of tokens) yield { token, negated };
	}
}

/**
 * The backticked spans of a cell, in order, each with the prose that runs from the end of the
 * last one up to it — which is where the negation is read from, so "no `.a` and `.b`" denies the
 * first and claims the second.
 */
function* spans(where) {
	let end = 0;
	for (const match of where.matchAll(/`([^`]+)`/g)) {
		yield { text: match[1], before: where.slice(end, match.index) };
		end = match.index + match[0].length;
	}
}

/**
 * The weaker claim a `reproduced` row may fall back on: a backticked span that is CSS text this
 * component actually contains.
 *
 * Five of the reproduced rows are played by a rule rather than by an element and have no selector
 * to name — a `minmax(0, 1fr)` track, an animated `clip-path` inset, a `flex: 1 1 auto` standing
 * in for a `*` row. Before this they were indistinguishable from a cell that claims nothing at
 * all, which is the one way a row could still be written without opening the component. Requiring
 * the span to occur verbatim keeps all five and refuses the escape.
 *
 * Citations are excluded, and that exclusion is the whole difficulty: `NavigationView.xaml:409`
 * occurs verbatim in `NavigationView.svelte`, because the component cites it too, so without this
 * a row could satisfy the check with the pin line it was transcribed from.
 */
function fallback(where, source) {
	for (const { text } of spans(where)) {
		if (CITATION.test(text)) continue;
		if (source.includes(text)) return text;
	}
	return null;
}

/**
 * Does `source` carry `needle` — a class selector like `.pane`, a custom property, an attribute
 * name, or a whole attribute selector?
 *
 * A rule of its own is the usual answer and the strong one. The other answer is a class that
 * only ever reaches a child component as a prop, which has no rule here because a class crossing
 * a component boundary carries no scope hash and is styled by the callee. `items-container-grid`
 * is exactly that, and searching only for `.items-container-grid` called a part unreproduced that
 * the markup plainly sets. So a bare occurrence counts too — but only on a line that mentions
 * `class`, because this component's comments say "pane" a great many times and a check that a
 * comment satisfies is not a check.
 *
 * An attribute selector is searched for whole and literally, quotes included, and that is the
 * form a state row takes where a rule exists — the attribute name alone would let every state of
 * a group claim the same rule. The bare name is not therefore the weak form of it: a group row
 * names an axis, which *is* the attribute, and an empty state names a value no rule is keyed on,
 * so for both of those there is no bracketed form to demand. What the bare name does have to
 * clear is the same bar as a bare class — it must be written as markup or as a selector, never
 * satisfied by a comment mentioning it, and this component's comments mention every one of them.
 *
 * **The limit of the whole check, stated where it is implemented.** This asks whether the text
 * occurs, never whether the rule it names does what the cell says. A row is therefore passed by a
 * selector that is in the component *for a different part* — `PaneNotOverlaying` claimed the
 * pane's border was painted under `[data-pane-open='true']`, which is in the stylesheet, on
 * `.pane::after`, which is `HCPaneBorder`; the real rule is under `data-overlay`. It was found by
 * a reader opening the component, which is the only thing that finds it. So this gate is what
 * keeps the table from being written without opening anything; it is not what makes the table
 * true.
 *
 * **The state axis has a second shape of the same problem, and it is half closed.** A
 * `VisualStateGroup` is answered here by an absence wherever the state removes a box or sets
 * nothing — no element rendered, or an attribute value no rule is keyed on — and five state rows
 * said that. Three of them named the very class they called absent, and this gate read it out
 * and checked the component *had* it, which is the opposite question; the other two named no
 * selector for the absence at all, so nothing about it was checked in either direction. Both
 * failure modes end in the same place: the row passes and would still pass with the rule it
 * denies added. The second of the two shapes is a fact about this text: a value
 * nothing is keyed on does not occur, so `NEGATION` lets a cell deny it and the check runs in
 * the direction the cell claims. The first is not. An element rendered under one branch of an
 * `{#if}` has its class in the file under the other branch too, so there is no search that
 * distinguishes "not rendered here" from "not written anywhere", and `NEGATABLE` refuses the
 * denial rather than accepting one it cannot perform. Those rows carry `ABSENCE` and are
 * counted on the pass line: a number every run beats a caveat in a comment, which is what this
 * paragraph was for a version.
 */
function carries(source, needle) {
	if (needle.startsWith('[')) {
		// Either quote, because a cell writes the one that reads well and a stylesheet writes the
		// one prettier leaves. Matching bytes alone reads a quote change as a missing rule, which
		// costs a true positive row a false failure — and costs a *denial* far more: it passes,
		// because the form the cell wrote is genuinely absent while the rule it denies is right
		// there under the other quote. `[data-collapsed="true"]` denied that way was accepted by
		// this gate against a component that keys nine rules on it.
		const alternate = needle.includes("'")
			? needle.replaceAll("'", '"')
			: needle.replaceAll('"', "'");
		return source.includes(needle) || source.includes(alternate);
	}
	if (needle.startsWith('--')) return source.includes(needle);
	if (needle.startsWith('data-'))
		return source.includes(`${needle}=`) || source.includes(`[${needle}`);
	if (new RegExp(`\\${needle}(?![\\w-])`).test(source)) return true;
	const bare = new RegExp(`(?<![\\w-])${needle.slice(1)}(?![\\w-])`);
	return source.split('\n').some((line) => line.includes('class') && bare.test(line));
}

/** Section headings, in file order, each with the rows under it. */
function sections(source) {
	const found = [];
	let current = null;
	let table = null;
	let pending = false;
	let pendingStates = false;
	source.split('\n').forEach((line, index) => {
		const heading = line.match(SECTION);
		if (heading) {
			current = {
				template: heading[1],
				component: heading[2],
				parts: [],
				states: [],
				stray: [],
				line: index + 1
			};
			found.push(current);
			table = null;
			pending = false;
			pendingStates = false;
			return;
		}
		if (/^##\s/.test(line)) {
			// Any other second-level heading ends the section it follows. The two `Pending`
			// headings are the ones whose tables are read rather than ignored, because a template
			// listed there is a claim too — that it exists and has not been disposed of — and both
			// halves are checkable.
			current = null;
			table = null;
			pending = /^##\s+Pending\s*$/.test(line);
			pendingStates = /^##\s+Pending\s+states\s*$/.test(line);
			return;
		}
		if (current && /^###\s/.test(line)) {
			// Any third-level heading ends the table it follows, and only these two open one. A
			// `### Notes`, or a `### Parts (55)` with a count appended, would otherwise leave the
			// previous table open and go on filing rows into it.
			const sub = line.match(SUBSECTION);
			table = sub ? sub[1].toLowerCase() : null;
			return;
		}
		if (pending || pendingStates) {
			const row = line.match(pendingStates ? PENDING_STATES_ROW : PENDING_ROW);
			// The header row of a pending table has no backticks, so it does not match.
			if (row) {
				found.push(
					pendingStates
						? { pendingStates: { template: row[1], component: row[2] }, line: index + 1 }
						: { pendingTemplate: row[1], line: index + 1 }
				);
			}
			return;
		}
		if (!current || !line.startsWith('|')) return;
		// `| --- | --- | --- |` and the header row are the two lines a table opens with, and
		// neither carries a backticked part, so neither matches.
		const row = line.match(ROW);
		const rows = table ? current[table] : null;
		if (!rows) {
			// A row outside either subheading would otherwise land in whichever table was read
			// last, which is how a States table gets counted as parts and passes.
			if (/^\|\s*`/.test(line)) current.stray.push(index + 1);
			return;
		}
		if (row) rows.push({ name: row[1], disposition: row[2], where: row[3], line: index + 1 });
		else if (/^\|\s*`/.test(line)) rows.push({ malformed: line.trim(), line: index + 1 });
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
	const pendingStates = parsed.filter((s) => s.pendingStates).map((s) => s.pendingStates);

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

	/**
	 * One axis of one section: the rows against the census's names for that axis.
	 *
	 * Parts and states are checked the same way because the failure they guard against is the
	 * same one — a name in the template that nobody has said anything about. What differs is the
	 * vocabulary of dispositions and, for states, that the table may be absent entirely so long
	 * as the section says so under `## Pending states`.
	 */
	const covered = { parts: new Set(), states: new Set() };
	const axis = (section, kind, names, source) => {
		const declared = new Set();
		for (const row of section[kind]) {
			if (row.malformed) {
				problems.push(
					`${DOC}:${row.line}: a row that is not \`| \`name\` | disposition | where |\``
				);
				continue;
			}
			if (declared.has(row.name)) {
				problems.push(`${DOC}:${row.line}: \`${row.name}\` is disposed of twice in this section`);
			}
			declared.add(row.name);
			// Keyed by template rather than by section, because `SplitView` is disposed of twice
			// by design and its ten parts are ten of the census's eighty however many components
			// reproduce them. Counting rows instead said seventy-five of eighty covered, which
			// overstated the coverage by exactly the second reproduction.
			covered[kind].add(`${section.template}::${row.name}`);
			if (!DISPOSITIONS[kind].has(row.disposition)) {
				problems.push(
					`${DOC}:${row.line}: \`${row.disposition}\` is not one of ${[...DISPOSITIONS[kind]].join(', ')}`
				);
			}
			if (!row.where.trim()) {
				problems.push(`${DOC}:${row.line}: \`${row.name}\` states no reason`);
			}
			if (row.disposition === 'open') open++;
			// The marker is refused everywhere it would not mean anything, because a marker that
			// can be written anywhere is one a cell reaches for to quiet the gate. A part is an
			// element and is either there or not; a `declined` or `inert` row already says why
			// nothing was checked.
			if (ABSENCE.test(row.where)) {
				if (kind === 'states' && row.disposition === 'reproduced') absence++;
				else
					problems.push(
						`${DOC}:${row.line}: \`absence:\` is for a reproduced state, not ${
							kind === 'parts' ? 'a part' : `a \`${row.disposition}\` state`
						}`
					);
			}
			// What a denial may *say* is checked on every row, before the disposition sends most
			// of them home. The rest of this loop runs for `reproduced` rows only, and that is
			// where the check belongs — but the phrasing this refuses is as writable in a
			// `declined` cell as in a reproduced one, and `SplitView`'s deferred rows will bring
			// both. A row that never reaches `claims()` is a row the refusal never covered, which
			// is how "the old phrasing cannot come back" would have been true of half the table.
			const denied = kind === 'states' && row.disposition === 'reproduced';
			for (const { token, negated } of claims(row.where)) {
				if (!negated) continue;
				if (kind !== 'states') {
					// A part is an element, and "we render nothing keyed on this value" is not a
					// disposition of one — it is the empty half of a state group, which parts do
					// not have.
					problems.push(
						`${DOC}:${row.line}: \`${row.name}\` denies ${token}, and a part is disposed of by ` +
							`what plays it rather than by a value nothing is keyed on`
					);
				} else if (!NEGATABLE.test(token)) {
					problems.push(
						`${DOC}:${row.line}: \`${row.name}\` denies ${token}, which is not an attribute ` +
							`selector with a value — only those are absent from a source rather than from a ` +
							`state; ` +
							(row.disposition === 'reproduced'
								? "a reproduced state's own absence is written `absence:`"
								: `a \`${row.disposition}\` state says it in prose, with no selector in backticks`)
					);
				}
			}
			if (row.disposition !== 'reproduced' || source === null) continue;
			let claimed = 0;
			for (const { token, negated } of claims(row.where)) {
				claimed++;
				if (negated) {
					// Both refusals above have already been filed against this token; what is left
					// here is the pair of checks that need the source.
					if (!denied || !NEGATABLE.test(token)) continue;
					// A denial is two claims, and the free one is the half that has to be checked
					// positively. Any value of any attribute this component never heard of is
					// absent from it, so a cell could satisfy the direction below with
					// `[data-banana='true']` and have opened nothing — which is the escape the
					// positive path was built to close. So: the axis is *keyed on* here, and this
					// value of it is not. That pair is what a state reproduced by an absence
					// means, and it is why the axis is looked for as `[data-x` rather than
					// through `carries()`: `carries()` is satisfied by the markup binding alone,
					// and "the attribute exists and nothing anywhere is keyed on it" makes
					// denying one of its values say nothing again.
					const attribute = token.slice(1, token.indexOf('='));
					if (!source.includes(`[${attribute}`)) {
						problems.push(
							`${DOC}:${row.line}: \`${row.name}\` denies a value of \`${attribute}\`, which no rule in ` +
								`${section.component} is keyed on — every value of it is absent, so the denial says nothing`
						);
					} else if (carries(source, token)) {
						problems.push(
							`${DOC}:${row.line}: \`${row.name}\` says nothing in ${section.component} is keyed on ${token}, which it carries`
						);
					}
					continue;
				}
				// A pseudo-element is written on the class it hangs off, so the class is what the
				// source is searched for; `::after` on its own would match any component.
				const needle = token.startsWith('.') ? token.split('::')[0] : token;
				if (!carries(source, needle)) {
					problems.push(
						`${DOC}:${row.line}: \`${row.name}\` claims ${token}, which ${section.component} does not carry`
					);
				}
			}
			// Every `reproduced` row has to put something checkable on the table. A selector is the
			// strong form; failing that, one backticked span of CSS text the component contains.
			// Without this a cell could always be written to claim nothing — which is how a span
			// that tokenizes to nothing, a quoting style this does not parse or a plain sentence,
			// used to pass in silence rather than loudly.
			if (!claimed && !fallback(row.where, source)) {
				problems.push(
					`${DOC}:${row.line}: \`${row.name}\` is reproduced and names neither a selector ` +
						`${section.component} carries nor any CSS text it contains`
				);
			}
		}

		for (const name of names) {
			if (!declared.has(name)) {
				problems.push(
					`${DOC}: \`${section.template}\` in \`${section.component}\` does not dispose of \`${name}\``
				);
			}
		}
		for (const name of declared) {
			if (!names.has(name)) {
				problems.push(
					`${DOC}: \`${name}\` is disposed of under \`${section.template}\`, which has no such ${kind === 'parts' ? 'part' : 'state'}`
				);
			}
		}
		return declared.size;
	};

	let parts = 0;
	let states = 0;
	let open = 0;
	let absence = 0;
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
		for (const line of section.stray) {
			problems.push(`${DOC}:${line}: a row outside a \`### Parts\` or \`### States\` heading`);
		}
		const source = await component(section.component);
		if (source === null) {
			problems.push(`${DOC}:${section.line}: no component at ${COMPONENTS}/${section.component}`);
		}

		parts += axis(section, 'parts', new Set(template.parts.map((p) => p.name)), source);

		// A section's states may be deferred, but only out loud: either there is a `### States`
		// table covering the census's names, or the section is named under `## Pending states`.
		// Neither, and the states are simply absent — which is the shape every one of the six
		// parts arrived in.
		const deferred = pendingStates.some(
			(p) => p.template === section.template && p.component === section.component
		);
		// Two of the census's templates declare no state at all. A section reproducing one has
		// nothing to table and nothing to defer, and demanding it sit under `## Pending states`
		// would put it in a table whose own prose says it holds what is *not* disposed of.
		const stateless = template.states.length === 0;
		if (stateless && (section.states.length || deferred)) {
			problems.push(
				`${DOC}:${section.line}: \`${section.template}\` has no state in the census, so this section owes neither a \`### States\` table nor a \`## Pending states\` row`
			);
		} else if (stateless) {
			// Nothing to count and nothing to say.
		} else if (section.states.length && deferred) {
			problems.push(
				`${DOC}:${section.line}: \`${section.template}\` in \`${section.component}\` both disposes of its states and defers them`
			);
		} else if (section.states.length) {
			states += axis(section, 'states', new Set(template.states.map((s) => s.name)), source);
		} else if (!deferred) {
			problems.push(
				`${DOC}:${section.line}: \`${section.template}\` in \`${section.component}\` disposes of no state and is not under \`## Pending states\``
			);
		}
	}

	for (const entry of pendingStates) {
		const claimed = disposed.some(
			(s) => s.template === entry.template && s.component === entry.component
		);
		if (!claimed) {
			problems.push(
				`${DOC}: \`${entry.template}\` in \`${entry.component}\` is under \`## Pending states\` with no section above disposing of its parts`
			);
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
	return pass(
		`${parts} part and ${states} state disposition(s) over ${disposed.length} reproduction(s), ` +
			`covering ${covered.parts.size} of the census's ${record.census.parts} part(s) and ` +
			`${covered.states.size} of its ${record.census.states} state(s); ` +
			`${pendingKeys.length} template(s) and ${pendingStates.length} reproduction(s)' ` +
			`states pending; ${open} open; ${absence} reproduced by an absence nothing witnesses`
	);
}
