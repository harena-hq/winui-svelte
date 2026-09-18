import fs from 'node:fs';
import path from 'node:path';
import type { FullConfig, Reporter, Suite } from '@playwright/test/reporter';

/**
 * Says what a run answered for.
 *
 * The two lanes report the same word for different things. Every spec that photographs anything
 * opens with `test.skip(!CDP_ENDPOINT, …)`, because those pixels come from the reference guest and
 * a Linux box renders a substitute face; Playwright then prints a summary in which the skips are
 * not failures, and the run reads as a pass. Five baselines were red for weeks behind exactly
 * that: every seal in the period had "the suite is green" behind it and every one of those runs
 * had compared nothing.
 *
 * **This reporter informs and does not enforce, and that division is deliberate.** An earlier
 * revision failed a run from here, and four review passes took it apart: `--reporter` replaces the
 * reporter array outright, `PW_TEST_REPORTER` appends one that can overwrite the status this
 * returns, `--config` elsewhere means this file never loads, and Playwright's API parses its own
 * argument array. Enforcement belongs to `scripts/gate/acceptance.mjs`, which is one invocation
 * with a fixed argument list, and D48 now says that command *is* the gate. What is left here is
 * the job a reporter can actually do: tell whoever reads the run what it covered.
 *
 * What it will not claim. It does not call a skip a baseline or a test a baseline: there are 263
 * logical tests and 328 images, and the mapping is not one to one — `fonts.spec.ts` skips locally
 * and photographs nothing. It counts the images in the reference lane's directory rather than the
 * ones Git tracks, and says so. It reports no *image* coverage for a reference run, because a
 * selection and a whole run differ there in nothing it measures beyond the selection itself.
 */
export default class LaneSummary implements Reporter {
	private suite: Suite | undefined;
	private lanes: string[] = [];
	private images = 0;
	private selection: string | undefined;

	onBegin(config: FullConfig, suite: Suite) {
		this.suite = suite;
		this.lanes = config.projects.map((project) => project.name);
		// Anchored to the same `testDir` that `snapshotPathTemplate` resolves a baseline against,
		// and not to `process.cwd()`: a run started from `tests/visual` with `--config` counted the
		// images as none, and read as if the tree held no baseline at all.
		const testDir = config.projects[0]?.testDir ?? config.rootDir;
		this.images = countMatching(path.join(testDir, '__screenshots__', 'edge-win32'), /\.png$/);
		this.selection = describeSelection(config, suite, testDir);
	}

	async onEnd() {
		const tests = this.suite?.allTests() ?? [];
		// A listing is not a run: `--list` reports every selected test as skipped and nothing as
		// passed, so every sentence below would be false of it. Read off argv, which the API's own
		// argument array does not reach — a listing driven that way is reported as a run, and the
		// cost of that is a misleading paragraph rather than a false gate.
		if (process.argv.includes('--list') || tests.length === 0) return;

		const skipped = tests.filter((test) => test.outcome() === 'skipped').length;
		const lane = this.lanes.join(', ');
		const ran = `${tests.length} test${tests.length === 1 ? '' : 's'}, ${skipped} not run`;

		// Whichever lane the reference project is in owns the message: its baselines are the tracked
		// ones, and the sentence below about none of them being compared is false if it is present.
		if (this.lanes.includes('edge-win32')) {
			console.log(
				`\n  ${lane}: ${ran}` +
					(this.selection ? `, narrowed by ${this.selection}` : '') +
					`.\n  This is the lane whose baselines are tracked; its directory holds ${this.images} images.` +
					(skipped > 0
						? '\n  A test not run here is a comparison nobody made; this run does not cover it.'
						: '') +
					'\n  `pnpm gate` is the run that answers for the whole of it (D48).\n'
			);
			return;
		}

		console.log(
			`\n  ${lane}: ${ran}, and none of the reference lane's ${this.images} baseline images` +
				`\n  compared — every one of them belongs to that lane's own directory. What passed here` +
				`\n  is the part of the suite that photographs nothing, so nothing in this run says` +
				`\n  anything about the pixels. \`pnpm gate\` is the run that does (D48).\n`
		);
	}
}

/**
 * How this run narrowed or weakened the suite, or `undefined` if it did neither.
 *
 * Read off the *resolved* configuration and the collected suite rather than off a command line, so
 * it sees a `grep` set in the config file or on a project as readily as one passed as a flag, and
 * sees a path argument as spec files missing from what was collected without parsing one. It is
 * reporting rather than enforcement, so a shape it misses costs a sentence and not a guarantee.
 */
function describeSelection(config: FullConfig, suite: Suite, testDir: string) {
	const narrowing = (grep: RegExp | RegExp[]) =>
		(Array.isArray(grep) ? grep : [grep]).some((one) => one.source !== '.*');
	if (narrowing(config.grep) || config.projects.some((project) => narrowing(project.grep))) {
		return 'a grep';
	}
	if (config.grepInvert || config.projects.some((project) => project.grepInvert)) {
		return 'an inverted grep';
	}
	if (config.shard) return `shard ${config.shard.current} of ${config.shard.total}`;
	if (config.projects.some((project) => project.ignoreSnapshots)) {
		return 'ignoreSnapshots, which passes an image assertion without comparing one';
	}
	if (config.updateSnapshots === 'all' || config.updateSnapshots === 'changed') {
		return `updateSnapshots '${config.updateSnapshots}', which rewrites a baseline rather than comparing it`;
	}
	const collected = new Set(suite.allTests().map((test) => test.location.file)).size;
	const present = countMatching(testDir, /\.(spec|test)\.[cm]?[jt]sx?$/);
	return collected < present ? `a path argument, ${collected} of ${present} spec files` : undefined;
}

/**
 * Files under `root` whose name matches, recursively.
 *
 * The spec pattern covers the same suffixes Playwright's default `testMatch` accepts; a config that
 * set its own `testMatch` would need this to follow it.
 */
function countMatching(root: string, pattern: RegExp) {
	let n = 0;
	const walk = (dir: string) => {
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			if (entry.isDirectory()) walk(path.join(dir, entry.name));
			else if (pattern.test(entry.name)) n += 1;
		}
	};
	if (fs.existsSync(root)) walk(root);
	return n;
}
