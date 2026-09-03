import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/**
 * The Gallery reproduction's source of truth.
 *
 * Separate from `scripts/tokens/fetch.mjs` and separately pinned, because the two
 * answer different questions and drift apart: `microsoft-ui-xaml` says what a token
 * is worth, `WinUI-Gallery` says what the app we are reproducing puts on a page. A
 * single pin would tie a token re-pin to a page re-pin, and neither has anything to
 * say about the other. ADR 0007.
 */
export const UPSTREAM = {
	url: 'https://github.com/microsoft/WinUI-Gallery',
	ref: 'main',
	commit: '7a8a6aa6f432bee71b89aeb24c3e69a5b854dc4f'
};

export const ROOT = fileURLToPath(new URL('../../', import.meta.url)).replace(/[\\/]$/, '');
export const CHECKOUT = join(ROOT, '.upstream', 'WinUI-Gallery');

// The app itself and nothing else — the repository also carries build tooling, tests
// and packaging that describe how Microsoft ships it rather than what it looks like.
// Cone mode is enough here, unlike the token checkout, because this is a plain
// directory rather than a suffix pattern spread across a tree.
const SPARSE = 'WinUIGallery';

const git = (args) =>
	execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });

/** The checkout's HEAD, or `null` when there is no checkout to ask. */
export function head() {
	if (!existsSync(CHECKOUT)) return null;
	try {
		return git(['-C', CHECKOUT, 'rev-parse', 'HEAD']).trim();
	} catch {
		// Exists but is not a repository — an interrupted clone. Distinguished from
		// "absent" by the caller, because the two need different remedies.
		return '';
	}
}

function fetchUpstream() {
	const at = head();

	if (at === UPSTREAM.commit) {
		console.log(`.upstream/WinUI-Gallery is already at ${UPSTREAM.commit}; nothing to do.`);
		return;
	}

	if (at === '') {
		throw new Error(
			`${CHECKOUT} exists but is not a git repository. Remove it and re-run this script.`
		);
	}

	if (at === null) {
		console.log(`Cloning ${UPSTREAM.url} (${UPSTREAM.ref}) into .upstream/WinUI-Gallery …`);
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
		console.log(`.upstream/WinUI-Gallery is at ${at}; fetching ${UPSTREAM.commit} …`);
		git(['-C', CHECKOUT, 'fetch', '--filter=blob:none', 'origin', UPSTREAM.ref]);
		git(['-C', CHECKOUT, 'sparse-checkout', 'set', SPARSE]);
	}

	git(['-C', CHECKOUT, 'checkout', UPSTREAM.commit]);
	console.log(
		`.upstream/WinUI-Gallery is now at ${git(['-C', CHECKOUT, 'rev-parse', 'HEAD']).trim()}.`
	);
}

// Importing this module must not reach the network: a reader wants the pin, not the
// side effect.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	try {
		fetchUpstream();
	} catch (error) {
		console.error(error.message);
		process.exit(1);
	}
}
