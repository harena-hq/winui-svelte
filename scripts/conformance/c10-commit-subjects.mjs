import { execFileSync } from 'node:child_process';

import { checkStored, MAX_SUBJECT, TYPES } from '../commit/subject.mjs';
import { fail, pass } from './lib.mjs';

export const id = 'C10';
export const title = 'every sealed subject parses as a type, a scope and one intent';

// Every one, with no prefix exempted. A real merge is skipped by `--no-merges` — by its
// parent count, which is provenance, where a subject beginning `Merge ` is only a string an
// ordinary commit can also carry. A revert is refused like anything else and owes a subject
// of its own; `.githooks/commit-msg` is the layer that lets `git revert` finish first.
// Stated in `AGENTS.md` too, rather than left for a reader to find in a regex.

/**
 * `.githooks/commit-msg` checks the commit being written; this checks the commits that
 * exist. The two are not redundant, because the hook is reachable only through
 * `core.hooksPath`, which git does not carry across a clone, and `--no-verify` skips it
 * even where it is configured. A rule whose only enforcement is a local setting is a rule
 * a fresh clone silently does not have — the same shape as the `pre-commit` guard, and
 * the reason that one's absence is documented rather than assumed away.
 *
 * Both read `scripts/commit/subject.mjs`, so this gate cannot drift from the hook.
 */

// Where the grammar starts being the rule rather than the intention. Earlier subjects
// predate any reader: of the 360 commits before this one, 66 conform — 253 subjects do not
// parse and 41 more overrun the limit — and rewriting them is its own unit, deliberately
// scheduled after the release work rather than mixed into it. When that unit lands this constant goes away and the range becomes the whole
// history. Until then a boundary stated in one line is honest, where a gate quietly
// passing over two thirds of the log would not be.
const FIRST_CHECKED = 'd7f3cae';

// `stderr` captured rather than inherited: git narrates its own failures, and a gate whose
// output is a fatal from git followed by its own sentence reads as two problems.
const git = (...args) =>
	execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

export async function run() {
	// A gate that cannot run must not read green — the failure mode this repository has
	// already paid for twice, once in 111 skipped baselines and once in a suite that
	// reported a narrowed run as a whole one.
	// Distinguished from the next failure on purpose: "the boundary is gone" and "there is no
	// history here" call for opposite responses, and one message for both would send a reader
	// looking for a rewrite that never happened.
	try {
		git('rev-parse', '--git-dir');
	} catch {
		return fail(
			'this is not a git checkout, so this gate checked nothing. It reads commits rather' +
				' than files, and an exported tree has none to read.'
		);
	}

	let boundary;
	try {
		boundary = git('rev-parse', '--verify', `${FIRST_CHECKED}^{commit}`).trim();
	} catch {
		return fail(
			`the boundary commit ${FIRST_CHECKED} does not resolve in this checkout, so this gate` +
				' checked nothing. If the history was rewritten, the rewrite is what retires the' +
				' boundary: drop it and check the whole log.'
		);
	}

	// Resolving is not the same as being behind us. On a checkout older than the boundary the
	// range `<boundary>~1..HEAD` is empty, and a gate that reported `0 commit(s)` as a pass
	// would be green for having read nothing — the failure this repository has now paid for
	// three times.
	try {
		git('merge-base', '--is-ancestor', boundary, 'HEAD');
	} catch {
		return fail(
			`the boundary commit ${FIRST_CHECKED} is not an ancestor of HEAD, so there is nothing` +
				' here for this gate to check. It checks the commits sealed under the grammar, and' +
				' this checkout predates them.'
		);
	}

	const range = `${boundary}~1..HEAD`;

	const hashes = git('rev-list', '--no-merges', range)
		.split('\n')
		.filter((line) => line !== '');

	const offenders = [];
	for (const hash of hashes) {
		const result = checkStored(git('log', '-1', '--format=%B', hash));
		if (!result.ok) offenders.push(`${hash.slice(0, 7)}  ${result.reason.split('\n')[0]}`);
	}

	// Belt to the ancestry check's braces: whatever made the set empty, an empty set is not
	// a pass.
	if (hashes.length === 0) {
		return fail(
			`no non-merge commit was found in ${range}, so this gate checked nothing. The boundary` +
				` ${FIRST_CHECKED} is meant to be the oldest commit it covers, not the newest.`
		);
	}

	if (offenders.length > 0) {
		return fail(
			`${offenders.length} of ${hashes.length} non-merge commit(s) since ${FIRST_CHECKED} do not parse`,
			offenders
		);
	}

	return pass(
		`${hashes.length} non-merge commit(s) since ${FIRST_CHECKED} carry one of ${TYPES.length} types,` +
			` a lower-case scope, at most ${MAX_SUBJECT} characters and a blank second line`
	);
}
