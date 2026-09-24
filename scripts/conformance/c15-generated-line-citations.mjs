import { basename } from 'node:path';
import { fail, pass, read, walk } from './lib.mjs';
import { OUTPUT as TOKENS, RAMP_OUTPUT as RAMP } from '../tokens/generate.mjs';
import { OUTPUT as SYMBOLS } from '../symbol/generate.mjs';

export const id = 'C15';
export const title = 'nothing cites a line in a generated source file';

// A line number is a position, and a position holds only as long as nothing moves it. That is a
// fair bet against a pinned checkout, which is fixed at a sha. It is a bad one against a file a
// generator writes: seeding four keys in `scripts/tokens/manifest.mjs` renumbered 8101 of the
// token layer's 8258 lines in one commit — the first of them lands after line 143 and everything
// below shifted — and the diff that did it is output nobody reads. Every citation into the file
// moved at once, silently, in a commit about a focus highlight.
//
// **Measured on the tree this landed in.** 3342 cited lines, and the three parts sum: 3207 into
// a pinned checkout, 24 into a dependency's file this tree does not carry, and 111 into a file
// this repository *contains* — 13 into something it generates and 98 into an authored file.
// Twelve of the 13 named the token layer, and 5 more were elided to a bare number in the same
// sentence, so seventeen positions in all. **Six of the seventeen named a line nobody meant**, short by between 81 and 652 lines —
// three of them a different declaration, and the other three inside a wrapped `var()`: two on
// its closing paren and one on the name it wraps —
// and all eleven that were right came out of one commit — `daf565d` re-pointed nine of them by
// hand, in the commit whose own seed had just moved them, and wrote the other two fresh.
//
// **All six were right against the tree they were written against**, which is the whole
// argument. Four positions survived their own commit and rotted later — five things are named
// below because the scrollbar spec wrote its pair as a range, and the tail of a range carries no
// colon, so `citationsIn` never counts it: a scrollbar spec's two delays were
// exact on 2026-09-13 and were moved the same day by `0c9e906`, a Hyperlink commit; a route's
// two dark-theme selectors were exact on 2026-09-10 and were moved by `3d15523`; the plan's
// animation duration was exact on 2026-09-11 and was moved by `f013ab9`, a ColorSpectrum commit.
// None of those three touched the citing file, and no reviewer of them had a reason to open it.
// The other two never survived their own: `2744db9` wrote Button's two brush citations against a
// tree where they were exact and added 149 lines to the token layer in the same diff, so they
// were 38 short the moment they were sealed and drifted to 652 over the nineteen days after.
// C12 was green throughout, and correctly — it asks whether a cited line exists, and every one
// of them did.
//
// **So the rule is that the number does not belong there** — but not because the number was
// always redundant. Twelve of the seventeen positions sat in a clause that already named the key
// or the theme block, and there the number carried no meaning, only risk. **Five did not**, at
// three sites: one component wrote "`to bottom` at <number>, `to top` at <number>" and named the
// brush only as "the brush"; a spec wrote "the tokens are written `400ms` and `500ms`" and named
// neither key; a route wrote "the attribute or the system preference" and named neither selector.
// For those the position *was* the address, and the rewrite had to go and find out what it
// pointed at before it could say it in words. That is the cost of the rule, paid once against a
// position that would have rotted again — and it is why a rule of "a position only beside its
// key" would not do: it would have passed all five.
//
// **What this cannot see**, enumerated rather than left to be inferred. The position has to
// follow the name inside one sentence, so a sentence that puts it first passes, so does a bare
// number in the sentence after the one naming the file, so does one separated from it by another
// file name, and `e.g.` ends the sentence as far as the bound is concerned. Nothing checks a key
// named in prose against what the layer emits. The walked roots and the extensions below are
// C12's, copied rather than shared, so a citation in a repository-root document, a package
// README or an `.html` inside the roots would pass — there is none today, grepped — and if C12's
// widen, these will not follow. And a run of continuations written without repeating the colon
// reports one site rather than three: the head still fails the gate, so nothing gets through,
// but the site list under-counts what a reader has to fix.
//
// **And a generated file named by a phrase rather than by its filename is invisible**, which is
// now this repository's dominant idiom because this commit made it so: eight of the ten rewritten
// sentences no longer name the file at all, so a number added back into any of them would pass.
// This comment is the demonstration — "the token layer's 8258 lines", "lands after line 143",
// "cites 173" are all positions in generated output written in prose, and the gate they sit in
// cannot see one of them. They are true of the tree at `daf565d` and are stated as history
// rather than as addresses, which is the only thing keeping them honest.
//
// **And nothing here reads a commit message**, which is where this repository does much of its
// arguing. Five sealed messages on `main` cite the token layer by position and **four of them
// are wrong today**: `bf926fb` (2026-09-10), `a6bb994` (2026-09-11), `ab843dd` and `daf565d`
// (both 2026-09-24); only `688bae1` still resolves. Each was exact against the tree it was
// written against, and `daf565d`'s is the Button shape exactly — it cites 173 for
// `ComboBoxTopHeaderMargin`, which its own seed moved to 177 in the same commit. They are
// sealed, unreachable by any gate that reads source files, and not correctable without
// rewriting history, so the census is recorded here instead of fixed.
//
// **The pin is not as fixed as the paragraph above implies, and it is not one pin.** Four
// checkouts sit under `.upstream/` behind four constants; citations reach three of them, and the
// 3207 split 2211 into microsoft-ui-xaml, 61 into windows-app-sdk and 935 into WinUI-Gallery —
// the last of which is a choice rather than a count, because 15 of those basenames exist in both
// checkouts and C12 cannot tell which copy was meant either. `scripts/tokens/fetch.mjs` has not
// moved since 2026-09-03; a commit that bumps any of the four moves that checkout's share in one
// reviewed diff containing none of them. What makes the exemption safe today is that nothing has
// bumped them, not that nothing can.
//
// **The thirteenth is outside the rule, and the boundary is deliberate.** This watches what the
// two generators emit as *source* — the stylesheets and the symbol map the package ships. The
// nine records under `data/` are generated too, by the extractors C8 answers for, and they
// renumber wholesale on a re-extract in exactly the same way; `docs/plan.md` cites one of them
// by position and that citation has already rotted. Bringing them in needs the extractors to
// declare their outputs the way the two generators now do, and needs that citation's intent
// reconstructed before it can be rewritten, so it is the next unit rather than this one — named
// here so the gap reads as a decision.
//
// **There is no exemption channel**, unlike C1's `c1-allow:` or C5's declared divergences, and
// that is a decision rather than an omission: all three generated files are name-indexed —
// `--winui-<Key>` in the token layer, `.winui-<Style>` in the type ramp, `Symbol.<Name>` in the
// symbol map — so there is always a name to use instead of the position. A generated file
// without stable names inside it would need an exemption, and would not take this rule as
// written.
//
// **The authored side is left out on blast radius, not on readership** — and not on rate either,
// which runs the other way. Of the 98 citations into authored files of this tree, 83 name a
// basename with exactly one copy, and **32 of those 83 point at content that has changed** since
// the citation was written — one component sends a reader to another's line "for the full
// explanation" and lands on a `color` declaration, and three more name blank lines. (Their
// positions are not written out here, for the reason the whole paragraph is about.) A reviewer
// reading the edit is plainly not catching them. What separates
// the generated case is not that there are fewer of them — 32 in 83 is a worse rate than 6 in
// 17 — but that one fourteen-line seed moves 8101 positions at once, in a diff no reviewer opens
// and no reading of the citing file could have caught. The authored 32 accumulated one at a time
// across reviewed edits, each in principle catchable, and they want their own unit rather than
// this rule stretched over them.
//
// `tests/visual/generated-line-citation.spec.ts` is the half a passing run cannot show: every
// form is planted there against `citationsIn`, including the evasions two reviewers reached for
// — a path in front of the name, the number elided into the next clause, the two spellings of a
// position that are not a colon, a longer basename ending in a watched one, and the four shapes
// above that pass and are meant to.

// The files a generator writes, asked of the generators rather than listed here. Importing the
// modules runs no generation — only their top level, which is a handful of constants — so this
// costs nothing at gate time. What it cannot see for the same reason is a generator that begins
// emitting a fourth file: these are the paths it declares, not the keys it returns. The spec
// runs the generators and compares, which is the check that would notice.
export const GENERATED = new Set([TOKENS, RAMP, SYMBOLS].map((path) => basename(path)));

// **The extension has to match whole, and two things make it**: the alternation is ordered
// longest-first, and a word boundary closes it. Either alone is enough — measured by mutation,
// reordering `cs` in front of `css` with the boundary kept changes nothing, and so does dropping
// the boundary with the order kept, while removing both makes the token layer's own name match
// as far as `.cs`, which is not a generated file, and every citation into it pass. C12's copy of
// this alternation has the short ordering and no boundary, and is saved by its mandatory line
// group forcing the backtrack; this pattern has no such group, because a mention with no number
// is exactly what it wants to find.
const FILE =
	/[+A-Za-z0-9_-][+A-Za-z0-9_.-]*\.(?:xaml\.cs|svelte|resw|json|xaml|cpp|css|idl|mjs|txt|cs|js|md|ts|h)\b/g;

// The three spellings of a position, and the reason there are three: `<name>:904` is this
// repository's own idiom, `#L904` is the one a link from a code host carries, and `line 904` is
// what a sentence says when it is not writing a citation at all. All three are the thing the
// rule forbids, and reading only the first would have left the plainest English of the three as
// the way around it.
//
// **The colon has to be loose**, which is what the lookbehind is for: every elision in the tree
// is `, :3102` or ` :5057`, with whitespace in front, while a colon *attached* to a word is
// something else entirely — a port, a ratio, a clock. Without the guard, a sentence naming this
// repository's own preview port after the token layer fails the gate reporting `:4173` as a
// position in generated output, and so do `1:1` and `09:30`. The `)` in the class is the same
// guard against a colon attached to a closing paren — `rgb(0, 0, 0):904` — and is prospective:
// no file under the walked roots contains that shape today. The attached form is not lost by any of it: the window begins after the
// file name, so that colon sits at offset zero with nothing behind it to reject. The trailing
// lookahead is the other half: it rejects `line 12px`, `:30em` and anything else whose digits
// run straight into a word. **It has to reject a digit as well as a letter**, which is not
// decoration: `\d+` backtracks, so a lookahead of `(?![A-Za-z])` alone is satisfied one digit
// short — `:904px` matches as `:90` — and the site then reports a position nobody wrote, which
// is the worst thing a gate about wrong positions could print.
//
// **The English spelling is the loosest of the three and it is a known false positive.** `line`
// is an ordinary noun, and a sentence that mentions a generated file and then a drawn line, or
// the line a declaration opens on, is flagged. `gradient-in-colour-property.spec.ts` already
// writes "`border-color` opens on line 3", and escapes only because the name beside it is a
// constant rather than the literal. When one does fire, the answer is to re-word the sentence:
// the alternative is leaving the plainest spelling of a position as the way around the rule.
const POSITION = /(?:(?<![\w)]):|#L|\b[Ll]ines? )(\d+)(?![\dA-Za-z])/g;

// How far after a generated file's name a position still belongs to it. The idiom this has to
// catch is `…the layer at :904, :3102 and :5057…`, where only the first number carries the file,
// and the idiom it must not catch is a later sentence citing something else by a number the
// reader resolves from a different name. Three bounds, whichever comes first: the next file
// name, the end of the sentence, and a hard cap. Measured on the tree this landed in, the three
// sites carrying elisions were all bounded by the sentence, at windows of 87, 137 and 172
// characters, and there were no false positives — the cap bounded nothing and is here to keep a
// comment block with no full stop in it from reaching the end of the file.
//
// **The false positive it accepts** is the mirror of the idiom it catches: a number elided from
// an *earlier*-named file, landing after a generated mention in the same sentence, is read as
// the generated file's. This repository writes that shape — `ComboBox.svelte` has "…for the
// reason the trigger's own fill carries it at :273" — and nothing hits it today only because no
// such sentence also names a generated file. When one does it will be a false failure, and the
// answer then is to re-word the sentence rather than to widen the window.
const CAP = 240;
const SENTENCE = /\.(\s|$)/;

/**
 * Every position cited into a generated file in `files`, as `{ sites, mentions }`. `generated`
 * is a set of basenames; `files` is `{ path, text }` records. Pure, so the spec can hand it text
 * that would be a violation if it were written in the tree.
 */
export function citationsIn(generated, files) {
	const sites = [];
	let mentions = 0;

	for (const { path, text } of files) {
		const named = [...text.matchAll(FILE)];
		for (let i = 0; i < named.length; i++) {
			const match = named[i];
			if (!generated.has(match[0])) continue;
			mentions++;

			const start = match.index + match[0].length;
			const at = `${path}:${text.slice(0, match.index).split('\n').length}`;

			const next = named[i + 1] ? named[i + 1].index : text.length;
			const stop = SENTENCE.exec(text.slice(start, Math.min(start + CAP, next)));
			const window = text.slice(start, start + (stop ? stop.index : Math.min(CAP, next - start)));

			// A position attached to the name and one two clauses later are the same claim, so
			// they are found by one pass and differ only in how the site reads.
			for (const found of window.matchAll(POSITION))
				sites.push(
					found.index === 0
						? `${at}  cites ${match[0]}${found[0]}, a position in generated output`
						: `${at}  cites ${match[0]} and then ${found[0].trim()}, a position in generated output`
				);
		}
	}

	return { sites, mentions };
}

const CITING = /\.(svelte|ts|js|mjs|css|md)$/;
const SOURCES = ['packages/winui-svelte/src', 'apps/gallery/src', 'tests', 'scripts', 'docs'];

export async function run() {
	const files = [];
	for (const root of SOURCES)
		for (const path of await walk(root, (name) => CITING.test(name)))
			files.push({ path, text: await read(path) });

	const { sites, mentions } = citationsIn(GENERATED, files);

	return sites.length
		? fail('a citation names a position in a file a generator writes', sites)
		: pass(
				`${mentions} mention(s) of ${GENERATED.size} generated file(s), across ` +
					`${files.length} source file(s), name no position`
			);
}
