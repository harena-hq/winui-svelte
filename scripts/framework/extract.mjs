import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { CHECKOUT, head, ROOT, UPSTREAM } from '../tokens/fetch.mjs';
import { definitions, difference, tally } from '../tokens/dictionary.mjs';
import { parse } from '../tokens/xaml.mjs';

const OUTPUT = join(ROOT, 'data', 'winui-framework.json');

// The framework dictionary as `microsoft-ui-xaml` carries it, at the same pin the control
// dictionaries are read from, and under the MIT licence that repository states. The
// `Microsoft.WindowsAppSDK.WinUI` package ships a larger build of the same file under
// Microsoft's own software licence terms, which do not permit publishing it; what is
// extracted and tracked here therefore comes from this copy alone (ADR 0010). The package's
// copy is still fetched by `scripts/framework/fetch.mjs`, for reading and for the line
// citations that name it, and nothing read from it is written into the repository.
export const PATH = 'dxaml/xcp/dxaml/themes/generic.xaml';
const DICTIONARY = join(CHECKOUT, PATH);

function extract() {
	// `'generic.xaml'` rather than the file's full path in the checkout: the path is written
	// once in `source.path`, and repeating it on every record would add about 130 kB and
	// say nothing the header does not.
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
			url: UPSTREAM.url,
			commit: UPSTREAM.commit,
			path: PATH,
			sha256: createHash('sha256').update(readFileSync(DICTIONARY)).digest('hex'),
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
		`source            ${doc.source.url} @ ${doc.source.commit}`,
		`path              ${doc.source.path} (${doc.source.sha256})`,
		`themes            ${line(themes)}`,
		`records           ${rest.records} across ${rest.distinctKeys} distinct keys`,
		`by kind           ${line(byKind)}`,
		`unsupported tags  ${line(unsupportedTags)}`
	].join('\n');
};

function main(argv) {
	const at = head();
	if (at !== UPSTREAM.commit) {
		const state = at === null ? 'is missing' : at === '' ? 'is not a repository' : `is at ${at}`;
		throw new Error(
			`.upstream/microsoft-ui-xaml ${state}, not ${UPSTREAM.commit}. Run \`pnpm tokens:fetch\`.`
		);
	}
	if (!existsSync(DICTIONARY)) {
		throw new Error(
			`.upstream/microsoft-ui-xaml has no ${PATH}. Run \`pnpm tokens:fetch\` to re-apply its sparse paths.`
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
