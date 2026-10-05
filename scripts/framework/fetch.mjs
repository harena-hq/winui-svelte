import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { inflateRawSync } from 'node:zlib';

// The SDK package's build of the framework dictionary, fetched for reading only. Its
// licence is Microsoft's own software licence terms, which permit using it to develop and
// test and do not permit publishing it, so nothing read from it is tracked: the records in
// `data/winui-framework.json` come from `microsoft-ui-xaml`'s MIT copy of the same
// dictionary (`scripts/framework/extract.mjs`, ADR 0010). What this copy is still for is
// the line citations that name it, `windows-app-sdk/generic.xaml:N`, which C15 checks
// against it — a citation states where a fact is and copies nothing.
//
// The single place the pin is written. The version is not chosen freely: the pinned
// Gallery's `standalone.props` declares `Microsoft.WindowsAppSDK` 2.4.0, and that
// metapackage's dependency on this one is 2.3.6 — so this is the framework dictionary
// the pinned Gallery would build against.
//
// It is not tied to the `microsoft-ui-xaml` pin, and since 2026-10-05 nothing generated
// reads it: it anchors the citations alone. Two hashes are checked rather than one, the
// package's and the entry's, so a silently re-published package fails loudly rather than
// substituting quietly.
export const UPSTREAM = {
	package: 'Microsoft.WindowsAppSDK.WinUI',
	version: '2.3.6',
	url: 'https://api.nuget.org/v3-flatcontainer/microsoft.windowsappsdk.winui/2.3.6/microsoft.windowsappsdk.winui.2.3.6.nupkg',
	sha256: '3404f14b5aad656024cf23efab49373e14be4129b1e7d8cdd18dd26712d3c8e2',
	entry: 'lib/native/Microsoft.UI/Themes/generic.xaml',
	entrySha256: '697c9eb1426a33613982a5bbcc2d383a563206239c3efdd2aae8234377e29c30'
};

export const ROOT = fileURLToPath(new URL('../../', import.meta.url)).replace(/[\\/]$/, '');
export const DICTIONARY = join(ROOT, '.upstream', 'windows-app-sdk', 'generic.xaml');

/** The dictionary's sha256, or `null` when no dictionary has been fetched yet. */
export function head() {
	if (!existsSync(DICTIONARY)) return null;
	return createHash('sha256').update(readFileSync(DICTIONARY)).digest('hex');
}

// Minimal read of one entry from a zip: locate the end-of-central-directory record, walk
// the central directory to the wanted name, then inflate that entry's data. A dependency
// would buy nothing here — one entry, one known name, and the hash below is what actually
// establishes that the right bytes came out.
function readZipEntry(buf, wanted) {
	const EOCD = 0x06054b50;
	let eocd = -1;
	for (let i = buf.length - 22; i >= 0 && i >= buf.length - 22 - 0xffff; i--) {
		if (buf.readUInt32LE(i) === EOCD) {
			eocd = i;
			break;
		}
	}
	if (eocd < 0) throw new Error('no end-of-central-directory record');
	const count = buf.readUInt16LE(eocd + 10);
	let p = buf.readUInt32LE(eocd + 16);
	for (let n = 0; n < count; n++) {
		if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('bad central directory header');
		const method = buf.readUInt16LE(p + 10);
		const compressed = buf.readUInt32LE(p + 20);
		const nameLen = buf.readUInt16LE(p + 28);
		const extraLen = buf.readUInt16LE(p + 30);
		const commentLen = buf.readUInt16LE(p + 32);
		const offset = buf.readUInt32LE(p + 42);
		const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
		if (name === wanted) {
			if (buf.readUInt32LE(offset) !== 0x04034b50) throw new Error('bad local file header');
			const lnameLen = buf.readUInt16LE(offset + 26);
			const lextraLen = buf.readUInt16LE(offset + 28);
			const start = offset + 30 + lnameLen + lextraLen;
			const data = buf.subarray(start, start + compressed);
			return method === 0 ? Buffer.from(data) : inflateRawSync(data);
		}
		p += 46 + nameLen + extraLen + commentLen;
	}
	throw new Error(`entry not found: ${wanted}`);
}

async function fetchUpstream() {
	const at = head();

	if (at === UPSTREAM.entrySha256) {
		// The dictionary's own hash, not the package's: it is the state every consumer
		// depends on, and matching it means a re-download could change nothing. Making
		// no request at all is the point of checking here rather than after the fetch.
		console.log(
			`.upstream/windows-app-sdk/generic.xaml is already at ${UPSTREAM.package} ${UPSTREAM.version}.`
		);
		return;
	}

	console.log(`Fetching ${UPSTREAM.package} ${UPSTREAM.version} …`);
	const response = await fetch(UPSTREAM.url);
	if (!response.ok) throw new Error(`fetch failed: ${response.status} ${UPSTREAM.url}`);

	const buf = Buffer.from(await response.arrayBuffer());
	const packageHash = createHash('sha256').update(buf).digest('hex');
	if (packageHash !== UPSTREAM.sha256) {
		throw new Error(
			`package hash mismatch: expected ${UPSTREAM.sha256}, got ${packageHash}. ` +
				`The package at ${UPSTREAM.url} is not the one this pin was written against.`
		);
	}

	const bytes = readZipEntry(buf, UPSTREAM.entry);
	const entryHash = createHash('sha256').update(bytes).digest('hex');
	if (entryHash !== UPSTREAM.entrySha256) {
		throw new Error(
			`entry hash mismatch: expected ${UPSTREAM.entrySha256}, got ${entryHash}. ` +
				`The package at ${UPSTREAM.url} is not the one this pin was written against.`
		);
	}

	mkdirSync(dirname(DICTIONARY), { recursive: true });
	writeFileSync(DICTIONARY, bytes);
	console.log(
		`.upstream/windows-app-sdk/generic.xaml is now at ${UPSTREAM.package} ${UPSTREAM.version} (${bytes.length} bytes).`
	);
}

// Importing this module must not reach the network: a consumer wants the pin, not the
// side effect.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	try {
		await fetchUpstream();
	} catch (error) {
		console.error(error.message);
		process.exit(1);
	}
}
