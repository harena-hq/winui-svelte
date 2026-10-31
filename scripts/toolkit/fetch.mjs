import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/**
 * The Community Toolkit's SettingsControls is a separate pin for the reason ColorCode is: the
 * Gallery declares the version in `standalone.props`, as `CommunityToolkitWinUIVersion`, and takes
 * it from NuGet, so its pages draw `SettingsCard` and `SettingsExpander` from source it does not
 * carry. Those restyle a `ToggleSwitch` placed in them. This pin follows that declaration and moves
 * when the declaration moves.
 */
export const UPSTREAM = {
	url: 'https://github.com/CommunityToolkit/Windows',
	ref: 'v8.2.251219',
	commit: 'a6b4dc451c0e54dd29f58743894a956100e7f713'
};

export const ROOT = fileURLToPath(new URL('../../', import.meta.url)).replace(/[\\/]$/, '');
export const CHECKOUT = join(ROOT, '.upstream', 'CommunityToolkit-Windows');

const SPARSE = 'components/SettingsControls/src';

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
		console.log(
			`.upstream/CommunityToolkit-Windows is already at ${UPSTREAM.commit}; nothing to do.`
		);
		return;
	}

	if (at === '') {
		throw new Error(
			`${CHECKOUT} exists but is not a git repository. Remove it and re-run this script.`
		);
	}

	if (at === null) {
		console.log(
			`Cloning ${UPSTREAM.url} (${UPSTREAM.ref}) into .upstream/CommunityToolkit-Windows …`
		);
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
		console.log(`.upstream/CommunityToolkit-Windows is at ${at}; fetching ${UPSTREAM.commit} …`);
		git(['-C', CHECKOUT, 'fetch', '--filter=blob:none', 'origin', UPSTREAM.ref]);
		git(['-C', CHECKOUT, 'sparse-checkout', 'set', SPARSE]);
	}

	git(['-C', CHECKOUT, 'checkout', UPSTREAM.commit]);
	console.log(
		`.upstream/CommunityToolkit-Windows is now at ${git(['-C', CHECKOUT, 'rev-parse', 'HEAD']).trim()}.`
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
