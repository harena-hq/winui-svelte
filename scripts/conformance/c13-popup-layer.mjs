import { fail, pass, read, styleBlocks, walk } from './lib.mjs';

export const id = 'C13';
export const title = 'every portalled surface declares the popup layer, and nothing outranks it';

/**
 * XAML puts a popup in the `PopupRoot`, above the whole visual tree, so no app content is above
 * one by default — `Popup.svelte`'s `.root` rule has what that qualification is for. CSS has no such root: a portalled element lands in `<body>` with
 * `z-index: auto`, which puts it above ordinary content by tree order and **below** any
 * positioned element carrying a positive z-index. This library ships those — `NavigationView`'s
 * pane-toggle holder is 100 and its pane is 1 — so the analogue has to be declared, once per
 * surface and at one value.
 *
 * Measured before this gate existed: **twelve components portal and eleven of them were at
 * `auto`.** The one that had a layer was `Popup.svelte`, whose `.root` rule is where the
 * reasoning lives and where every other declaration points. What made it visible was a rail
 * row's tooltip on `/dev/navigation-view-rail`, painted over by the hamburger — the popup was
 * opaque and the button was simply drawn on top of it. The other eleven were not fine; they
 * only overlapped things that declare no z-index.
 *
 * Two arms, and **eleven manufactured failures**, eight of which exist because a review found
 * the gate accepting something:
 *
 * 1. a portalled surface losing its declaration;
 * 2. a z-index above the layer;
 * 3. a marker naming a file that declares none;
 * 4. a marker naming a file that is not here;
 * 5. the portal pattern matching nothing, which is the positive control at the foot of `run`;
 * 6. a declaration commented out;
 * 7. the layer moved inside a media query;
 * 8. the same move made in the file a marker redirects to — 7 one hop out;
 * 9. a z-index above the layer in a stylesheet rather than a component;
 * 10. a marker naming a file the marking file does not import — a redirection about nothing;
 * 11. a marker the filename pattern declines, which used to be reported as naming no file.
 *
 * And one case manufactured to **pass**: a z-index named inside a comment, which used to fail
 * arm 2. Numbers 1, 2 and 5 are the arms as first written; the rest are the review's. The
 * manufactured *pass* is the one worth copying — it exists because someone asked what the gate
 * wrongly **rejects**, not only what it wrongly admits.
 *
 * 1. A component that portals must put the layer somewhere. Nearly always that is a
 *    `z-index: 1000` in its own `<style>`, on the element the portal's content is. Where the
 *    content is another component — `CommandBar` renders `CommandBarOverflowPresenter` into its
 *    portal — the declaration belongs to that component, and the portalling file carries a
 *    `c13-layer:` comment naming that **file**, which this gate then opens. A redirection it
 *    follows rather than an exemption it accepts, for the reason on `MARKER` below.
 * 2. Nothing anywhere in the library may declare a z-index above the layer. That is the arm
 *    that keeps arm 1 from being a spelling check — a page element at 10000 would leave every
 *    surface correctly declared and still painted over.
 *
 * **The title says "declares" and not "sits in", because declaring is what this reads.** Arm 1
 * accepts the layer anywhere a rule in the file could apply it — on a `:global()` selector, or
 * on an element the portal never renders — and no static read of a Svelte component is going to
 * settle which box `{...props}` lands on. What it does refuse is a declaration that cannot apply
 * at all, which is the nesting test above.
 *
 * What this cannot reach: whether the value arrives where it is needed. Ten of the twelve are
 * floating surfaces, where the primitive reads `getComputedStyle(content).zIndex` one frame
 * after mount and mirrors it onto the wrapper it positions — so a declaration on the wrong
 * element inside a portal would pass here and paint nothing. (The other two, `Popup` and
 * `ContentDialog`, position themselves and use theirs in place; `Popup.svelte`'s `.root` rule
 * has the split.) `navigation-view-rail.spec.ts` is the layer that answers that,
 * by asking which element is on top where the tooltip and the pane toggle overlap.
 */
/**
 * The library, **and the Gallery**, because arm 2's motivating case is a page element and the
 * page is the Gallery. Scanning only the library left that arm unable to see the exact class of
 * thing its own reasoning names; C1 has scanned both trees for the same kind of reason since it
 * was written. Arm 1 keys on a portal and the Gallery renders none, so widening the scan costs
 * it nothing.
 */
const SOURCES = ['packages/winui-svelte/src/lib', 'apps/gallery/src'];
const LAYER = 1000;
/** A bits-ui portal element: `<Tooltip.Portal>`, `<Dialog.Portal>`, `<Popover.Portal>`. */
const PORTAL = /<[A-Z][A-Za-z0-9]*\.Portal[\s>]/;
/** `z-index: <integer>`, with the value, inside a style block. */
const Z_INDEX = /z-index:\s*(-?\d+)/g;
/**
 * `c13-layer: <File.svelte>` — a **redirection the gate follows**, in either comment syntax,
 * because the place a reader needs it is beside the portal in the markup and Svelte's markup
 * comment is not CSS's.
 *
 * It was an exemption first, in the shape `c1-allow:` uses: any marker naming anything
 * satisfied arm 1. A review deleted `CommandBarOverflowPresenter`'s declaration and the suite
 * stayed green — the marker named a site nothing checked, for exactly the component the escape
 * exists for. So the marker now has to name a **file**, and the file it names has to carry the
 * layer; an escape the gate cannot follow is not an escape this gate offers.
 */
const MARKER = /(?:\/\*|<!--)\s*c13-layer:\s*([A-Za-z][A-Za-z0-9]*\.svelte)\b/;
/**
 * The marker without its filename, so a marker the pattern above declines is reported as the
 * malformed thing it is rather than as an absent one. A review found the fall-through saying
 * "names no file" about a file that had been named — in a hyphenated spelling this tree does
 * not use today, which is the only reason it was a message and not a defect.
 */
const MARKER_LOOSE = /(?:\/\*|<!--)\s*c13-layer:/;

export async function run() {
	const files = [];
	for (const dir of SOURCES) {
		// Stylesheets too, and arm 2 is why: the Gallery's own `gallery-styles.css` is the most
		// natural home for a page element's z-index, and reading only components would have left
		// the arm blind to the very file its reasoning describes. None of the three declares one
		// today, which is the answer to "so it changes nothing" rather than a reason to skip it.
		files.push(...(await walk(dir, (name) => name.endsWith('.svelte') || name.endsWith('.css'))));
	}
	files.sort();

	const missing = [];
	const outranking = [];
	const redirected = [];
	const atLayerByName = new Map();
	const portals = [];
	let declared = 0;

	for (const file of files) {
		const source = await read(file);
		const values = [];
		// A stylesheet is one block; a component's blocks are its `<style>` elements.
		const blocks = file.endsWith('.css') ? [{ body: source }] : styleBlocks(source);
		for (const { body } of blocks) {
			// Comments blanked first, the way `declarations()` does it, and both directions were
			// manufactured before this line existed: a commented-out `/* z-index: 1000 */`
			// satisfied arm 1 for a surface that had none, and the words "never use z-index:
			// 2147483647 here" in a comment failed arm 2 for a file declaring nothing.
			const css = body.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, ' '));
			for (const match of css.matchAll(Z_INDEX)) {
				// Depth 1 is a declaration in an ordinary rule; anything deeper is inside an
				// at-rule or a nested one. A review satisfied arm 1 with
				// `@media (min-width: 99999px) { .nothing { z-index: 1000 } }` in a file whose
				// surface had none, so the layer has to be declared where it can apply. The same
				// read still counts a nested one for arm 2, because a z-index above the layer
				// paints over a popup from inside a media query exactly as well as outside one.
				const before = css.slice(0, match.index);
				const depth = before.split('{').length - before.split('}').length;
				values.push({ value: Number(match[1]), depth });
			}
		}
		for (const { value } of values) {
			if (value > LAYER) outranking.push(`${file}: z-index ${value}`);
		}
		const atLayer = values.filter((each) => each.value === LAYER && each.depth === 1).length;
		declared += atLayer;
		// Keyed by basename, because that is what a marker beside a portal can name and what a
		// reader writes. A duplicate basename in this tree would make the lookup ambiguous, so
		// the guard below refuses one rather than picking.
		const name = file.slice(file.lastIndexOf('/') + 1);
		if (atLayerByName.has(name)) atLayerByName.set(name, -1);
		else atLayerByName.set(name, atLayer);
		if (PORTAL.test(source)) portals.push({ file, source, atLayer });
	}

	for (const { file, source, atLayer } of portals) {
		if (atLayer > 0) continue;
		const marker = MARKER.exec(source);
		if (!marker) {
			if (MARKER_LOOSE.test(source)) {
				redirected.push(`${file}: c13-layer names nothing this gate can read as a component file`);
			} else {
				missing.push(file);
			}
			continue;
		}
		// **And the marking file has to still render what it names.** The gate checks that the
		// named file declares the layer; without this it does not check that the redirection is
		// still about anything. A component that changed what it portals would keep a marker
		// pointing at a file that still declares 1000 — green, and about the wrong component.
		// An import is what a Svelte file uses to render another, and the marking file already
		// has one, so this costs the convention nothing.
		if (!source.includes(`./${marker[1]}`)) {
			redirected.push(`${file}: c13-layer names ${marker[1]}, which this file does not import`);
			continue;
		}
		const named = atLayerByName.get(marker[1]);
		if (named === undefined) {
			redirected.push(`${file}: c13-layer names ${marker[1]}, which is not a component here`);
		} else if (named === -1) {
			redirected.push(
				`${file}: c13-layer names ${marker[1]}, and more than one file has that name`
			);
		} else if (named === 0) {
			redirected.push(`${file}: c13-layer names ${marker[1]}, which declares no layer`);
		}
	}
	const portalled = portals.length;

	// A positive control: if nothing in the tree portals, arm 1 has nothing to check and the
	// pass line would be a green report about an empty set.
	if (portalled === 0) {
		return fail(
			`no portalled surface found under ${SOURCES.join(', ')} — the pattern ${PORTAL} matched nothing, so arm 1 checked nothing`
		);
	}
	if (missing.length > 0) {
		return fail(
			`${missing.length} portalled surface(s) declare no popup layer and name no file for it`,
			missing
		);
	}
	if (redirected.length > 0) {
		return fail(
			`${redirected.length} c13-layer marker(s) redirect somewhere the layer is not`,
			redirected
		);
	}
	if (outranking.length > 0) {
		return fail(
			`${outranking.length} declaration(s) sit above the popup layer of ${LAYER}, which paints over every surface that declares it`,
			outranking
		);
	}
	return pass(
		`${portalled} portalled surface(s), ${declared} declaration(s) of the ${LAYER} layer across ${files.length} component(s) and stylesheet(s), and nothing above it`
	);
}
