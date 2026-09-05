import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, relative, sep } from 'node:path';
import { CHECKOUT, head, ROOT, UPSTREAM } from './fetch.mjs';
import { parse } from './xaml.mjs';
import { definitions, difference, tally } from './dictionary.mjs';

const OUTPUT = join(ROOT, 'data', 'winui-tokens.json');

// The parallel `*_perf2026*` set rewrites visual-state mechanics and changes no token
// value — ADR 0001. Reading both would give every key an identical twin.
const SOURCE = (name) => /_themeresources.*\.xaml$/.test(name) && !name.includes('perf2026');

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
