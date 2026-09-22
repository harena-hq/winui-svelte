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

// **There is no boundary any more, and that is the point.** This gate used to read only from
// `b4c2a78`, because of the 360 commits before it 66 conformed: 253 subjects were not
// `<type>(<scope>): <intent>` and 41 more overran the limit. Those 294 subjects were rewritten
// on 2026-09-22 with every tree left byte-identical, so the range is the whole log — the only
// range that cannot quietly grow a hole in it.

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

	const hashes = git('rev-list', '--no-merges', 'HEAD')
		.split('\n')
		.filter((line) => line !== '');

	// An empty set is not a pass — the failure this repository has now paid for three times,
	// once in 111 skipped baselines and once in a suite that reported a narrowed run as a whole
	// one. A checkout with no history reaches this line, and so would a `rev-list` that silently
	// answered nothing.
	if (hashes.length === 0) {
		return fail(
			'no non-merge commit was found, so this gate checked nothing. It reads the whole log,' +
				' and a log with nothing in it is not a log that conforms.'
		);
	}

	const offenders = [];
	for (const hash of hashes) {
		const result = checkStored(git('log', '-1', '--format=%B', hash));
		if (!result.ok) offenders.push(`${hash.slice(0, 7)}  ${result.reason.split('\n')[0]}`);
	}

	if (offenders.length > 0) {
		return fail(
			`${offenders.length} of ${hashes.length} non-merge commit(s) do not parse`,
			offenders
		);
	}

	return pass(
		`every one of ${hashes.length} non-merge commit(s) carries one of ${TYPES.length} types,` +
			` a lower-case scope, at most ${MAX_SUBJECT} characters and a blank second line`
	);
}
