import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// The single place the pin is written. `extract.mjs` imports this rather than
// repeating the SHA, so a re-pin cannot leave the record file's provenance
// claiming a commit nothing was read from.
export const UPSTREAM = {
	url: 'https://github.com/microsoft/microsoft-ui-xaml',
	ref: 'main',
	commit: '79646b4e5d4d85355f7478e0e0149b31e57d85f0'
};

export const ROOT = fileURLToPath(new URL('../../', import.meta.url)).replace(/[\\/]$/, '');
export const CHECKOUT = join(ROOT, '.upstream', 'microsoft-ui-xaml');

// The upstream repository is large, so the working copy is narrowed to the XAML under
// `controls/dev` — theme dictionaries, which the extractor reads, and control templates,
// which it does not. The templates are here for a reader rather than for a program: a
// control reproduced from scratch is reproduced from its `ControlTemplate`, and guessing
// at a structure the source states is the failure this checkout exists to prevent. The
// per-control test pages are excluded; they are app markup, not the control.
//
// `--no-cone` because cone mode can express neither a `**`-and-suffix pattern nor the
// exclusion.
const SPARSE = ['/controls/dev/**/*.xaml', '!/controls/dev/**/TestUI/**'];

const git = (args) =>
	execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });

/** The checkout's HEAD, or `null` when there is no checkout to ask. */
export function head() {
	if (!existsSync(CHECKOUT)) return null;
	try {
		return git(['-C', CHECKOUT, 'rev-parse', 'HEAD']).trim();
	} catch {
		// A directory that exists but is not a repository — an interrupted clone, most
		// likely. Distinguished from "absent" by the caller, because the two need
		// different remedies.
		return '';
	}
}

function fetchUpstream() {
	const at = head();

	if (at === UPSTREAM.commit) {
		// The commit matching is not the same as the working copy matching. `SPARSE`
		// widening between runs leaves a checkout at the right commit missing files it
		// is now supposed to hold, and an early return here would report that as
		// "nothing to do" — the one message that stops anyone from looking further.
		console.log(
			`.upstream/microsoft-ui-xaml is already at ${UPSTREAM.commit}; re-applying paths …`
		);
		git(['-C', CHECKOUT, 'sparse-checkout', 'set', '--no-cone', ...SPARSE]);
		return;
	}

	if (at === '') {
		throw new Error(
			`${CHECKOUT} exists but is not a git repository. Remove it and re-run this script.`
		);
	}

	if (at === null) {
		console.log(`Cloning ${UPSTREAM.url} (${UPSTREAM.ref}) into .upstream/microsoft-ui-xaml …`);
		git([
			'clone',
			'--filter=blob:none',
			'--no-checkout',
			'--branch',
			UPSTREAM.ref,
			UPSTREAM.url,
			CHECKOUT
		]);
		git(['-C', CHECKOUT, 'sparse-checkout', 'set', '--no-cone', ...SPARSE]);
	} else {
		// Deleting and re-cloning would discard a perfectly good object store to move a
		// few commits; fetching keeps a re-pin cheap on a slow connection.
		console.log(`.upstream/microsoft-ui-xaml is at ${at}; fetching ${UPSTREAM.commit} …`);
		git(['-C', CHECKOUT, 'fetch', '--filter=blob:none', 'origin', UPSTREAM.ref]);
		git(['-C', CHECKOUT, 'sparse-checkout', 'set', '--no-cone', ...SPARSE]);
	}

	git(['-C', CHECKOUT, 'checkout', UPSTREAM.commit]);
	console.log(
		`.upstream/microsoft-ui-xaml is now at ${git(['-C', CHECKOUT, 'rev-parse', 'HEAD']).trim()}.`
	);
}

// Importing this module must not reach the network: `extract.mjs` wants the pin, not
// the side effect.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	try {
		fetchUpstream();
	} catch (error) {
		console.error(error.message);
		process.exit(1);
	}
}
