import { basename } from 'node:path';
import { fail, pass, read, walk } from './lib.mjs';
import { CITING, GENERATED, SOURCES, citationsIn } from './c15-generated-line-citations.mjs';

export const id = 'C16';
export const title = 'nothing cites a line in a file this repository holds';

// C15's rule — a line number is a position, and a position holds only as long as nothing moves
// it — over every file this repository holds rather than the three a generator writes. The
// exemption is still the pin: a checkout fixed at a sha, which is also why a basename that
// exists under `.upstream/` as well as here is left alone, since which copy a citation means is
// not something a name can say. Thirty-four basenames are in both today — most of them Gallery
// images, the rest a licence, a README, a `.gitignore` and untracked tool state — and none of
// them is cited by line.
//
// **Measured on the tree this landed in, `365f9c2`.** 3440 citations of the `<name>:<line>`
// shape, 3313 into a pin, 28 into a dependency's file, and **99 into a file this repository
// holds** — one of them into a `data/` record, 15 into a basename with more than one copy, and
// 83 into an authored file with exactly one. **39 of those 83 named a line whose content had
// changed** since the commit that wrote the citation, against 32 when C15 measured the same
// population a day earlier. That growth was the trigger C15 recorded for taking them, and it
// is the argument: the count rose by seven across sixteen reviewed commits.
//
// **Re-pointing means reading the line at the commit that wrote the citation, not the line at
// that number today.** Two positions in AutoSuggestBox were re-pointed by hand once already, in
// `eecba0b`, by naming the declaration then sitting at each number — a popup's `border-width`
// and a trigger's `outline: none`. Both had rotted before that commit, from ComboBox's `.item`
// and `.item:focus-visible`, so the rewrite turned a wrong address into a wrong name, which no
// gate can see. Every one of the 99 here was resolved against the commit `git log -S` finds
// introducing it.
//
// **The census counted only the colon, and this gate counts all three spellings**, so on its
// first run over the re-pointed tree it found twelve more sites. Six were positions elided into
// a sentence that had already named a held file — `:107`, `:109` after a component name — and
// were real. Six were C15's documented false positive, a number that belongs to something else
// landing after a held name: fixture offsets in a spec that imports C14 by path, and C15's own
// examples quoted in its header. All twelve were re-worded rather than exempted, as C15 says to.
//
// **A position qualified by a sha is re-worded too**, although it cannot rot: the gate cannot
// tell "at `<sha>`" from an address, and two lines can always be described by what they say.
// Where a re-pointed name has since been deleted, the sentence says which sha it describes —
// a name moves with its content only while the content exists.
//
// **What this cannot see** is C15's list, because it is C15's matcher: a position written before
// the name, one in the next sentence, one separated by another file name, and a file named by a
// phrase — "the delete button's comment" carries no basename to watch. That last is now most of
// what the 99 became, deliberately, because a name moves with its content. It follows that a
// position into the citing file itself — "the snippet at" a bare number, naming no file — is
// invisible; two such were found by reading and re-worded. The held set is read off the working
// tree, so an untracked file under the walked roots joins it, which watches more; `.upstream`
// is read the same way and is not tracked, so in a clone without the pins the shared names
// become held and the gate is stricter, while a pin bump that adds a basename this tree also
// has (a `package.json`, an `index.ts`) silently exempts it. The false positive it adds to
// C15's is a dependency's file sharing a held basename, which C12 resolves as the dependency's
// and this reads as ours; none is cited today. And nothing here reads a commit message.
//
// `tests/visual/own-line-citation.spec.ts` plants the cases this adds to C15's: a held name
// watched, a shared one and a generated one not, and the set built from the tree rather than
// listed.

const OWN = ['packages', 'apps', 'tests', 'scripts', 'docs', 'data'];
const PINNED = '.upstream';

export async function held() {
	const own = new Set();
	for (const root of OWN) for (const path of await walk(root, () => true)) own.add(basename(path));
	for (const path of await walk(PINNED, () => true)) own.delete(basename(path));
	for (const name of GENERATED) own.delete(name);
	return own;
}

export async function run() {
	const files = [];
	for (const root of SOURCES)
		for (const path of await walk(root, (name) => CITING.test(name)))
			files.push({ path, text: await read(path) });

	const own = await held();
	const { sites, mentions } = citationsIn(own, files, 'a file this repository holds');

	return sites.length
		? fail('a citation names a position in a file this repository holds', sites)
		: pass(
				`${mentions} mention(s) of ${own.size} held file(s), across ` +
					`${files.length} source file(s), name no position`
			);
}
