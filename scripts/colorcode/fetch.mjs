import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/**
 * ColorCode is a separate pin because the Gallery declares the version it builds
 * against in `standalone.props` but does not carry the ColorCode source. This pin
 * follows that declaration and moves when the declaration moves; it is not a
 * directory inside the Gallery pin.
 */
export const UPSTREAM = {
	url: 'https://github.com/CommunityToolkit/ColorCode-Universal',
	ref: 'v2.0.15',
	commit: 'e6c2701c365a7a91d74d7ef38a6b60075008ce94'
};

export const ROOT = fileURLToPath(new URL('../../', import.meta.url)).replace(/[\\/]$/, '');
export const CHECKOUT = join(ROOT, '.upstream', 'ColorCode-Universal');

const SPARSE = 'ColorCode.Core';

const git = (args) =>
	execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });

/** The checkout's HEAD, or `null` when there is no checkout to ask. */
export function head() {
	if (!existsSync(CHECKOUT)) return null;
	try {
		return git(['-C', CHECKOUT, 'rev-parse', 'HEAD']).trim();
	} catch {
		return '';
	}
}

function fetchUpstream() {
	const at = head();

	if (at === UPSTREAM.commit) {
		console.log(`.upstream/ColorCode-Universal is already at ${UPSTREAM.commit}; nothing to do.`);
		return;
	}

	if (at === '') {
		throw new Error(
			`${CHECKOUT} exists but is not a git repository. Remove it and re-run this script.`
		);
	}

	if (at === null) {
		console.log(`Cloning ${UPSTREAM.url} (${UPSTREAM.ref}) into .upstream/ColorCode-Universal …`);
		git([
			'clone',
			'--filter=blob:none',
			'--no-checkout',
			'--branch',
			UPSTREAM.ref,
			UPSTREAM.url,
			CHECKOUT
		]);
		git(['-C', CHECKOUT, 'sparse-checkout', 'set', SPARSE]);
	} else {
		console.log(`.upstream/ColorCode-Universal is at ${at}; fetching ${UPSTREAM.commit} …`);
		git(['-C', CHECKOUT, 'fetch', '--filter=blob:none', 'origin', UPSTREAM.ref]);
		git(['-C', CHECKOUT, 'sparse-checkout', 'set', SPARSE]);
	}

	git(['-C', CHECKOUT, 'checkout', UPSTREAM.commit]);
	console.log(
		`.upstream/ColorCode-Universal is now at ${git(['-C', CHECKOUT, 'rev-parse', 'HEAD']).trim()}.`
	);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	try {
		fetchUpstream();
	} catch (error) {
		console.error(error.message);
		process.exit(1);
	}
}
