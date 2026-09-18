// The acceptance gate. D48: "the suite is green" means *this command* exited 0.
//
// It is a command with a fixed argument list rather than a flag anyone can set, and that shape is
// the whole point. Four review passes took apart the previous design, which tried to make the
// environment variable `CI` mean "this run is a gate" and then police every way of weakening one
// from inside `playwright.config.ts`. Each pass found another way past, and the last two found the
// ones that end the argument: `--reporter` replaces the reporter array outright, so a guarantee
// carried by a reporter can be deleted; `--config` elsewhere means this project's config never
// loads; and Playwright's API parses an argument array of its own, which `process.argv` cannot see.
// A gate cannot be a property of arbitrary invocations. It can only be one invocation.
//
// **What this defends against, and what it does not.** It defends against accident and
// convenience: a narrowed run reported as a whole one, a missing reference browser, a forwarded
// flag. It does not defend against anyone who controls the environment it runs in, and it does not
// pretend to — a fifth review pass exited this gate 0 without running anything, twice, once
// through pnpm's own `script-shell` setting and once through a `NODE_OPTIONS` preload that
// replaced `spawnSync`. Neither is fixable from inside a file the environment loads. `pnpm` here
// resolves through `PATH` for the same reason. The premise is a trusted environment, and D48 says
// so rather than leaving it implied.
import { spawnSync } from 'node:child_process';

const extra = process.argv.slice(2);
if (extra.length > 0) {
	console.error(
		`This gate takes no arguments, and it was given ${extra.join(' ')}.\n` +
			'A gate that forwards an argument is a gate that can be narrowed. Run `pnpm test` with\n' +
			'whatever arguments you need instead — that is a developer run and says so.'
	);
	process.exit(1);
}

// Both, and not just the endpoint — and their absences are different failures, so they are
// reported apart. Without the endpoint there is no reference browser at all.
const endpoint = process.env.WINUI_CDP_ENDPOINT;
if (!endpoint) {
	console.error(
		'WINUI_CDP_ENDPOINT is not set, so there is no reference browser to drive. The only\n' +
			'baselines that are tracked come from one, and every spec that photographs anything skips\n' +
			'itself without it — which Playwright counts as not a failure, and which is how five\n' +
			'baselines stayed red for weeks behind runs that read clean.'
	);
	process.exit(1);
}

// `WINUI_BASE_URL` has a default, so its absence is not the case above: nothing skips. The specs
// run, against `http://localhost:4173`, and the reference browser is on a guest where localhost
// is the guest — so every navigation fails and the red run says nothing about the code.
if (!process.env.WINUI_BASE_URL) {
	console.error(
		'WINUI_BASE_URL is not set. It defaults to localhost, which for the reference browser is\n' +
			'the guest itself, so the run would not skip — it would fail every navigation, and none of\n' +
			'those failures would be about the code. Set it to the address the guest reaches this host\n' +
			'by.'
	);
	process.exit(1);
}

// Being set is not the same as being the reference browser, and the difference is a whole run of
// baselines compared against the wrong renderer. The endpoint is asked what it is: `edge-win32` is
// the project name those 328 images are filed under, and a local Chrome answering here would name
// itself something else and be photographed as if it were Windows. This catches the accident, not
// a spoof — see the premise above.
//
// The question is put the way `connectOverCDP` puts it, rather than approximately: it keeps the
// endpoint's own path and appends `json/version/` under it (playwright-core's `urlToWSEndpoint`).
// A leading-slash `new URL('/json/version', endpoint)` discards that path, which would refuse a
// proxied endpoint the harness connects to perfectly well. The one form narrowed on purpose is a
// `ws://` endpoint: Playwright takes that straight to the socket and fetches nothing, so there is
// no document to ask, and the gate says that instead of reporting a socket as silent.
let identityURL;
try {
	identityURL = new URL(endpoint);
} catch {
	console.error(`WINUI_CDP_ENDPOINT is not a URL: ${endpoint}`);
	process.exit(1);
}
if (identityURL.protocol !== 'http:' && identityURL.protocol !== 'https:') {
	console.error(
		`WINUI_CDP_ENDPOINT is ${endpoint}, and this gate needs the HTTP DevTools discovery URL —\n` +
			'the one that answers `json/version` — because asking it is how the reference browser is\n' +
			'told from a local one. Playwright would take a `ws:` endpoint straight to the socket, and\n' +
			'nothing along that path says what the browser is.'
	);
	process.exit(1);
}
if (!identityURL.pathname.endsWith('/')) identityURL.pathname += '/';
identityURL.pathname += 'json/version/';

// One `try` over the whole question, because "nothing answered" is only one of its answers: a 404
// or an HTML error page answers and is still not a version document.
let version;
try {
	const response = await fetch(identityURL, { signal: AbortSignal.timeout(10_000) });
	if (!response.ok) throw new Error(`it answered HTTP ${response.status}`);
	version = await response.json();
} catch (error) {
	console.error(
		`WINUI_CDP_ENDPOINT is ${endpoint}, and ${identityURL} did not return a DevTools version\n` +
			`document: ${error.message}.` +
			(error.name === 'TimeoutError'
				? '\nTen seconds is the whole allowance and nothing retries, so an endpoint that is there\nbut slow to answer refuses the same way an absent one does.'
				: '')
	);
	process.exit(1);
}

const browser = String(version?.Browser ?? '');
const platform = String(version?.['User-Agent'] ?? '');
if (!/^Edg[e]?\//.test(browser) || !/Windows NT/.test(platform)) {
	console.error(
		`WINUI_CDP_ENDPOINT answers as ${browser || 'an unnamed browser'} on\n` +
			`${platform || 'an unnamed platform'}. The tracked baselines are Edge on Windows, and this\n` +
			'lane files whatever it drives under `edge-win32`, so a different browser here is a whole\n' +
			'suite compared against the wrong renderer.'
	);
	process.exit(1);
}

// `CI` is still set, because it is what `playwright.config.ts` reads to choose a reporter that
// prints to stdout and to forbid a stray `test.only`. It is no longer asked to mean "gate".
const result = spawnSync('pnpm', ['exec', 'playwright', 'test'], {
	stdio: 'inherit',
	env: { ...process.env, CI: '1' }
});

// The contract is "0 is a pass and anything else is not", rather than a faithful relay: a child
// killed by a signal reports `status === null`, and a gate that exited 0 for that would be the
// failure this whole file is about. Both non-zero shapes are named rather than folded into a bare
// exit code, because a gate that fails silently is read as a gate that is broken.
if (result.error) console.error(`The suite could not be started: ${result.error.message}`);
if (result.signal) console.error(`The suite was killed by ${result.signal}.`);
process.exit(result.status === 0 ? 0 : 1);
