// The commit subject grammar, in one place because it is checked twice: by
// `.githooks/commit-msg` while a commit is being written, and by `C10` over the commits
// already sealed. Two copies of a rule are two rules, and the one nobody runs is the one
// that stays right.
//
// Why this file exists at all. The grammar was documented and never read by anything.
// Of the 360 commits before this one, 66 conform: 253 subjects do not parse at all and 41
// more parse but overrun the limit. The drift is dateable to 2026-09-06, when one subject
// took the shape `ProgressRing: <sentence>`; 82 more followed, 83 in all. That shape is
// the trap — it *looks* like Conventional Commits, so nothing about reading the log
// suggests a rule was dropped, while a parser sees a commit whose type is `ProgressRing`.
// A rule with no reader is a recommendation.
//
// **A `commit-msg` hook reads the file before git cleans it up, and it cannot know what
// git will store.** The cleanup mode comes from `commit.cleanup`, and where that is unset
// git picks `strip` for a message it will edit and `whitespace` for one from `-m` or
// `-F` — a distinction no hook is told. `GIT_EDITOR=:` marks a commit that opens no
// editor, but not the reverse: `GIT_EDITOR=: git commit --edit -F msg` is an edited
// message whose editor happens to be `:`, and git cleans that up with `strip`.
//
// So this does not guess. **Every ambiguity resolves toward accepting**, because the two
// directions are not symmetrical: cleaning up more than git will can only make the hook
// accept a message git stores badly, which is precisely what `C10` reads `%B` to catch,
// while refusing a message git would have kept blocks a legitimate commit and nothing
// catches that. `strip` is therefore the fallback — it removes the most — and the
// normalisation is `git stripspace`, git's own implementation, so an explicitly set
// `core.commentChar` is honoured without this file being told it exists. Measured on git
// 2.43.0: `core.commentString` is ignored by git's own cleanup *and* by `stripspace`, so
// the two agree about it, while `core.commentChar=auto` is honoured by the cleanup and not
// by `stripspace` — under `auto` the hook removes comment lines git would keep, once more
// in the direction that lets something through for `C10`.
//
// Under `commit.cleanup=scissors` the message is checked twice, whole and truncated at
// git's scissors marker, and accepted if either passes. Git truncates there for an *edited*
// message and this hook cannot tell an edited message from a `-m` one, so a second
// candidate is the asymmetry applied rather than one more guess about which. Nothing is
// truncated in any other mode: measured on git 2.43.0, only `scissors` truncates, and only
// on the marker — an edited message under the default cleanup removes that line as a
// comment and keeps the text below it, a `-m` message under it keeps both, and a
// `--verbose` diff disappears by git's own bookkeeping about where it appended one, which
// is invisible here. None of that reaches this rule anyway, because the
// rule reads the subject and the line after it and every file git composes leaves that line
// blank.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// Conventional Commits 1.0.0 mandates `feat` and `fix` and leaves the rest open. Five are
// the closed set; `build` and `test` are adopted because this project has a build and a
// test suite for them to name. `ci` and `perf` are deliberately absent: nothing here
// configures CI, and no commit has yet been about performance, so both would name
// nothing. Adopt one when its referent exists, and not before.
export const TYPES = ['feat', 'fix', 'docs', 'refactor', 'chore', 'build', 'test'];

// 72, which is what leaves room for `git log --oneline`'s hash and a terminal's width.
export const MAX_SUBJECT = 72;

// Scope is required here, though the specification makes it optional: a subject that
// names its area is the difference between a log that can be skimmed by area and one that
// can only be read in full. Lower-case, because a capital is how the drifted shape began.
// The lookahead is load-bearing: `feat(lib):` followed by four spaces parses without it,
// and that is a commit with no intent line at all.
const SUBJECT = new RegExp(`^(${TYPES.join('|')})\\(([a-z][a-z0-9-]*)\\)(!)?: (?=.*\\S).+$`);

// Subjects git composes rather than a person. The hook lets them through, because
// refusing one aborts `git merge` or `git revert` in the middle of the operation. `C10`
// does **not**: a prefix is not provenance — an ordinary single-parent commit can be
// called `Merge anything` — and a real merge is already excluded there by its parent
// count, which is provenance you can actually determine. So a revert lands and then owes
// a subject of its own, the same way a `fixup!` owes a rebase.
const GENERATED = /^(Merge |Revert ")/;

// Subjects that exist only until a rebase consumes them. Exempt in the hook, which sees
// work in flight, and refused by `C10`, where surviving means the rebase never happened.
const IN_FLIGHT = /^(fixup!|squash!|amend!)/;

const git = (args, input) =>
	execFileSync('git', args, { encoding: 'utf8', input, stdio: ['pipe', 'pipe', 'pipe'] });

/** The grammar, over one line. */
function checkSubject(subject) {
	if (subject.trim() === '') return { ok: false, reason: 'the message is empty.' };

	if (GENERATED.test(subject)) {
		return {
			ok: false,
			reason:
				`a subject git composed reached the history:\n  ${subject}\n` +
				'`git merge` and `git revert` write these, and this project writes its own. Give the\n' +
				'commit a subject with `git commit --amend`.'
		};
	}

	if (!SUBJECT.test(subject)) {
		return {
			ok: false,
			reason:
				`the subject is not \`<type>(<scope>): <intent>\`:\n  ${subject}\n` +
				`Type is one of ${TYPES.join(', ')};\n` +
				'scope is required, lower-case, matching [a-z][a-z0-9-]*; a breaking change may carry\n' +
				'`!` before the colon. The intent line says why, not what — `git show --stat` already\n' +
				'answers what.'
		};
	}

	if (subject.length > MAX_SUBJECT) {
		return {
			ok: false,
			reason:
				`the subject is ${subject.length} characters and the limit is ${MAX_SUBJECT}:\n  ${subject}\n` +
				'What does not fit belongs in the body, which has no limit.'
		};
	}

	return { ok: true };
}

// `\r?\n`, because a CRLF message stores with the carriage return and `%s` prints the
// subject without it — split on `\n` alone and every such subject fails the grammar on a
// character no reader of the log can see.
const first = (message) => message.replace(/^\s*\n+/, '').split(/\r?\n/);

/**
 * The rule over a message exactly as git stored it — `%B`, cleaned up already. This is the
 * whole rule, and `C10` is its caller.
 */
export function checkStored(message) {
	const lines = first(message);
	const subject = lines[0] ?? '';

	// Before the grammar, because `fixup! <anything>` does not parse either and the reason
	// that matters is the one a reader can act on: squash it, rather than rename it.
	if (IN_FLIGHT.test(subject)) {
		return {
			ok: false,
			reason:
				`a \`fixup!\`, \`squash!\` or \`amend!\` subject reached the history:\n  ${subject}\n` +
				'It was meant to be consumed by a rebase. Squash it into the commit it names.'
		};
	}

	const verdict = checkSubject(subject);
	if (!verdict.ok) return verdict;

	// A body that starts on line 2 is a body git cannot see: `%s` takes everything up to
	// the first blank line, so the whole paragraph becomes part of the subject.
	if (lines.length > 1 && lines[1].trim() !== '') {
		return {
			ok: false,
			reason:
				'the line after the subject is not blank. Without it `%s` swallows the body, and\n' +
				'every log that prints a subject prints the paragraph.'
		};
	}

	return { ok: true };
}

/**
 * Everything from git's scissors line down. The marker is git's own, and git tolerates
 * horizontal whitespace and a carriage return after it and nothing else — measured on
 * 2.43.0: a trailing space, a tab and a CRLF each truncate, a trailing ` xx` does not. The
 * comment character is whichever one is configured, defaulting to `#`; `auto` cannot be
 * resolved from here, so `#` stands in, and getting that wrong means this candidate simply
 * does not help rather than that a message is refused.
 */
function truncateAtScissors(text) {
	const configured = git(['config', '--get', '--default', '', 'core.commentChar']).trim();
	const comment = configured === '' || configured === 'auto' ? '#' : configured;
	const marker = `${comment} ------------------------ >8 ------------------------`;

	const lines = text.split('\n');
	const at = lines.findIndex((line) => line.replace(/[ \t]*\r?$/, '') === marker);
	return at === -1 ? text : lines.slice(0, at).join('\n');
}

/**
 * `commit.cleanup` where it is set to something, and `strip` otherwise — not because git
 * always chooses `strip`, but because it removes the most, which is the direction that
 * errs toward accepting. See the header.
 */
function cleanupMode() {
	const configured = git(['config', '--get', '--default', 'default', 'commit.cleanup']).trim();
	return configured === 'default' ? 'strip' : configured;
}

/**
 * The rule over `.git/COMMIT_EDITMSG` as a `commit-msg` hook receives it: before git's
 * cleanup, so template comments are still in it.
 */
export function checkCommitFile(text) {
	// `scissors` is cleaned up here as `strip` even though git's is `whitespace` plus a
	// truncation: stripping the comments as well removes more, and removing more can only
	// err toward accepting.
	const mode = cleanupMode();
	const clean = (body, comments) =>
		mode === 'verbatim'
			? body
			: git(['stripspace', ...(comments ? ['--strip-comments'] : [])], body);

	// Two candidates under `scissors`, because git truncates at the marker for an *edited*
	// message and this hook cannot tell an edited message from a `-m` one. Accepting if
	// either candidate passes is the asymmetry applied rather than another guess about which
	// git will do: the extra candidate can only let something through, which is `C10`'s to
	// catch. Measured — an edited `scissors` message with the marker on line two and a body
	// below it stores as the subject alone, and without this it was refused.
	const candidates = [clean(text, mode === 'strip' || mode === 'scissors')];
	if (mode === 'scissors') {
		const cut = truncateAtScissors(text);
		if (cut !== text) candidates.push(clean(cut, false));
	}

	let firstReason;
	for (const message of candidates) {
		const subject = first(message)[0] ?? '';
		if (IN_FLIGHT.test(subject) || GENERATED.test(subject)) return { ok: true };
		const verdict = checkStored(message);
		if (verdict.ok) return verdict;
		firstReason ??= verdict;
	}
	return firstReason;
}

// `node scripts/commit/subject.mjs <file>` — the form `.githooks/commit-msg` calls. The
// hook stays a one-line script so that the rule and its wording live here. The test is an
// absolute file URL against this module's own: comparing basenames or a relative path
// silently answers the wrong question, and `C10` imports this file rather than running it.
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
	const file = process.argv[2];
	if (!file) {
		console.error('usage: node scripts/commit/subject.mjs <path to commit message file>');
		process.exit(2);
	}
	const result = checkCommitFile(readFileSync(file, 'utf8'));
	if (!result.ok) {
		console.error(`refusing the commit message: ${result.reason}`);
		process.exit(1);
	}
}
