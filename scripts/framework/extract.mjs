import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { DICTIONARY, head, ROOT, UPSTREAM } from './fetch.mjs';
import { definitions, difference, tally } from '../tokens/dictionary.mjs';
import { parse } from '../tokens/xaml.mjs';

const OUTPUT = join(ROOT, 'data', 'winui-framework.json');

function extract() {
	// `'generic.xaml'` rather than the entry's full path inside the package: the path is
	// written once in `source.entry`, and repeating it on 8 890 records would add a third
	// of a megabyte and say nothing the header does not.
	const { records } = definitions('generic.xaml', parse(readFileSync(DICTIONARY, 'utf8')));

	const themeCounts = {};
	const byKind = {};
	const unsupportedTags = {};
	for (const record of records) {
		// `definitions` produces `theme: null` for records outside any theme dictionary.
		// A JSON object key cannot be `null`, and a key spelled `"null"` reads like a
		// bug; the literal string makes the bucket visible in the printed line.
		const label = record.theme ?? '(unthemed)';
		themeCounts[label] = (themeCounts[label] ?? 0) + 1;
		byKind[record.kind] = (byKind[record.kind] ?? 0) + 1;
		if (record.kind === 'unsupported')
			unsupportedTags[record.tag] = (unsupportedTags[record.tag] ?? 0) + 1;
	}

	return {
		source: {
			package: UPSTREAM.package,
			version: UPSTREAM.version,
			url: UPSTREAM.url,
			entry: UPSTREAM.entry,
			sha256: UPSTREAM.sha256,
			entrySha256: UPSTREAM.entrySha256,
			extractedAt: new Date().toISOString().slice(0, 10)
		},
		census: {
			records: records.length,
			distinctKeys: new Set(records.map((record) => record.key)).size,
			themes: tally(themeCounts),
			byKind: tally(byKind),
			unsupportedTags: tally(unsupportedTags)
		},
		resources: records
	};
}

const census = (doc) => {
	const { themes, byKind, unsupportedTags, ...rest } = doc.census;
	const line = (counts) =>
		Object.entries(counts)
			.map(([name, n]) => `${name} ${n}`)
			.join(', ');
	return [
		`source            ${doc.source.package} ${doc.source.version}`,
		`entry             ${doc.source.entry} (${doc.source.entrySha256})`,
		`themes            ${line(themes)}`,
		`records           ${rest.records} across ${rest.distinctKeys} distinct keys`,
		`by kind           ${line(byKind)}`,
		`unsupported tags  ${line(unsupportedTags)}`
	].join('\n');
};

function main(argv) {
	const at = head();
	if (at !== UPSTREAM.entrySha256) {
		const state = at === null ? 'is missing' : `is at ${at}`;
		throw new Error(
			`.upstream/windows-app-sdk/generic.xaml ${state}, not ${UPSTREAM.entrySha256}. Run \`pnpm framework:fetch\`.`
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
