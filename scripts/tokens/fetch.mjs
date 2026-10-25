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

// The upstream repository is large, so the working copy is narrowed to the file types a
// control is reproduced from, in the two trees that hold them.
//
// `controls/dev` is the WinUI 3 controls:
//
//   *.xaml   theme dictionaries, which the extractor reads, and control templates, which
//            it does not — the structure.
//   *.idl    each property's default, as a `MUX_DEFAULT_VALUE` attribute — for example
//            `NavigationView`'s display-mode thresholds, 641 and 1008.
//   *.h      the layout constants a template refers to by name and never spells out —
//            for example `c_itemIndentation`, the 31 pixels a child menu item is inset by.
//   *.cpp    what the template leaves to code: a value the control computes rather than
//            declares, and the condition a visual state is entered under.
//
// All of it is here for a reader rather than for a program: a control reproduced from
// scratch is reproduced from its `ControlTemplate`, its declared defaults, its declared
// constants and the code that decides between them, and guessing at any of them when the
// source states it is the failure this checkout exists to prevent.
//
// `dxaml` is the framework underneath, and it is here because most of the Gallery's
// controls are not in `controls/dev` at all. WinUI 3 restyles a `Windows.UI.Xaml` control
// by shipping a dictionary for it and nothing else, so for Slider, SplitView, Viewbox,
// CalendarView, DatePicker and the rest, `controls/dev` answers "no implementation" and the
// repository holds one two directories over. v11 read five such files by fetching raw URLs
// at the pin's commit; v12 needs a dozen more, and a file fetched by URL is not greppable,
// which is what a sweep of a control actually needs. Four trees, ~4.7k files and ~42 MB
// against `controls/dev`'s 104 MB:
//
//   dxaml/xcp/dxaml/lib          `<Control>_Partial.cpp` — the control's own code-behind.
//   dxaml/xcp/core/core/elements the native element and the chrome it paints, where a
//                                control's template is empty because C++ draws it.
//   dxaml/xcp/core/inc           the constants those two refer to.
//   dxaml/phone/lib              the picker flyouts and `LoopingSelector`.
//
// A fifth tree, `dxaml/xcp/components`, was added in v14 and cost 17 MB. The four above
// hold the elements and the code that drives them; this one holds the graphics layer they
// call into, and one file in it — `graphics/inc/DropShadowRecipe.h` — is the whole of
// WinUI's theme-shadow recipe as a formula in `translationZ` and the theme. This project
// had fitted that recipe by eye across two versions on the belief that no pinned source
// stated it. It was stated, one directory outside the checkout, which is the argument for
// widening rather than for fetching the one file: a path that is not checked out cannot be
// grepped, so nobody finds what nobody knows to look for.
//
// Two text trees were added in v18. The first was already in the working copy and not in
// this list, so the next run would have removed it: `dxaml/xcp/core/text`, the layout and
// selection code behind TextBlock and RichTextBlock. The second,
// `dxaml/xcp/core/native/text`, is where the text *controls* are: `CTextBoxBase`,
// `CTextBoxView` and the RichEdit host, under 1 MB. Without it the pin read as declaring
// `CTextBoxBase` and never defining it, and the code that measures a TextBox,
// `CTextBoxView::MeasureOverride`, could not be read at all. Both were one directory
// outside the checkout. What they hand on to RichEdit, which is not in the pin, is still
// not readable: whether a key is handled, and the width of the text itself.
//
// `dxaml/xcp/core/dll` was added after them, twelve `.cpp` files and under 1 MB. It holds the
// focus manager, `CFocusManager` in `focusmgr.cpp`, which decides what a programmatic focus
// is drawn as (`CoerceFocusState`) and where a focus set on a container lands
// (`SetFocusedElement`). Both functions were first read by URL at the pin, and conformance
// gate C12 refuses a line citation into a file the checkout does not hold.
//
// The per-control test pages are excluded; they are app markup, not the control.
//
// `--no-cone` because cone mode can express neither a `**`-and-suffix pattern nor the
// exclusion.
const SPARSE = [
	'/controls/dev/**/*.xaml',
	'/controls/dev/**/*.idl',
	'/controls/dev/**/*.h',
	'/controls/dev/**/*.cpp',
	'/controls/dev/**/Strings/en-us/Resources.resw',
	'/controls/dev/**/Strings/en-US/Resources.resw',
	'!/controls/dev/**/TestUI/**',
	'/dxaml/xcp/dxaml/lib/**/*.h',
	'/dxaml/xcp/dxaml/lib/**/*.cpp',
	'/dxaml/xcp/core/core/elements/**/*.h',
	'/dxaml/xcp/core/core/elements/**/*.cpp',
	'/dxaml/xcp/core/inc/**/*.h',
	'/dxaml/phone/lib/**/*.h',
	'/dxaml/phone/lib/**/*.cpp',
	'/dxaml/xcp/components/**/*.h',
	'/dxaml/xcp/components/**/*.cpp',
	'/dxaml/xcp/core/text/**/*.h',
	'/dxaml/xcp/core/text/**/*.cpp',
	'/dxaml/xcp/core/native/text/**/*.h',
	'/dxaml/xcp/core/native/text/**/*.cpp',
	'/dxaml/xcp/core/dll/**/*.cpp',
	// The framework dictionary, which `scripts/framework/extract.mjs` reads: the copy here is
	// under this repository's MIT licence, where the one the SDK package ships is not.
	'/dxaml/xcp/dxaml/themes/generic.xaml',
	// Not control source: the design note for the `Symbol` enum, which is the only second
	// witness to the *rendered* code point that `icon.cpp`'s switch returns. The extractor
	// under `scripts/symbol/` refuses to emit a table the note and the switch disagree on,
	// so the file is a check rather than a convenience.
	'/docs/design-notes/symbol-enum-spec.md'
];

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
