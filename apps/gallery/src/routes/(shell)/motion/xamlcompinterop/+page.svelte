<script lang="ts">
	import { Button, Ellipse, RadioButton, RadioButtons, Rectangle, Slider } from 'winui-svelte';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/motion/xamlcompinterop');
	if (item === null) throw new Error('Animation interop page has no Gallery item');

	const naturalMotionSample = sampleOf(
		'XamlCompInterop/XamlCompInteropNaturalMotionCompositionAnimation.txt'
	);
	const ellipseSample = sampleOf(
		'XamlCompInterop/XamlCompInteropExpressionanimationEllipseElement.txt'
	);
	const stackedSample = sampleOf(
		'XamlCompInterop/XamlCompInteropDrivingSeveralRelatedAnimations.txt'
	);
	const actualSizeSample = sampleOf(
		'XamlCompInterop/XamlCompInteropReferenceActualsizeExpressionanimationsMake.txt'
	);
	const actualOffsetSample = sampleOf(
		'XamlCompInterop/XamlCompInteropReferenceActualoffsetActualsizeExpressionanimations.txt'
	);

	// XamlCompInteropPage.xaml:29-34 — four damping ratios, with 0.6 the checked one.
	let damping = $state('0.6');
	// XamlCompInteropPage.xaml:35-42 — 25 to 200 in steps of 25, starting at 50.
	let period = $state(50);
	// XamlCompInteropPage.xaml:121-126 — 200 to 400. The Slider sets no Value, so it starts at
	// its Minimum, which is also the Grid's declared Width and Height at :130-131.
	let radius = $state(200);
	// XamlCompInteropPage.xaml:140-144 — 12 to 24, starting at its Minimum.
	let fontSize = $state(12);
	// XamlCompInteropPage.xaml:145-149 — 0 to 100, starting at its Minimum. `doubleToThickness-
	// Converter` (App.xaml:75) turns the one number into a uniform Thickness.
	let textMargin = $state(0);

	// A `SpringVector3NaturalMotionAnimation` is a damped harmonic oscillator: `Period` is one
	// undamped oscillation, so the natural frequency is 2*pi/Period, and `DampingRatio` is the
	// zeta of the standard step response. Starting at rest, the normalised progress from the
	// current value to `FinalValue` is
	//
	//     p(t) = 1 - e^(-zeta*wn*t) * (cos(wd*t) + (zeta*wn/wd) * sin(wd*t)),   wd = wn*sqrt(1-zeta^2)
	//
	// which CSS says as a `linear()` easing sampled from it. The page offers only 0.2, 0.4, 0.6
	// and 0.8, all underdamped, so the critically- and over-damped branches are not written.
	//
	// The compositor stops when the motion is no longer visible rather than at a declared time;
	// this stops when the envelope is down to a thousandth of the initial displacement, which is
	// `ln(1000) / (zeta*wn)` and runs from 34ms to 1.1s across the page's own parameter ranges.
	//
	// 160 stops holds the worst case — zeta 0.2, whose five and a half oscillations are the
	// hardest to sample — to 5.5e-3 of the travel. **This curve is a model and not a
	// transcription: see WD-050.**
	const SPRING_STOPS = 160;
	const SPRING_SETTLE = Math.log(1000);

	function springEasing(
		dampingRatio: number,
		periodMs: number
	): { duration: number; easing: string } {
		const wn = (2 * Math.PI) / (periodMs / 1000);
		const wd = wn * Math.sqrt(1 - dampingRatio * dampingRatio);
		const settle = SPRING_SETTLE / (dampingRatio * wn);
		const progress = (t: number) =>
			1 -
			Math.exp(-dampingRatio * wn * t) *
				(Math.cos(wd * t) + ((dampingRatio * wn) / wd) * Math.sin(wd * t));
		const stops: string[] = [];
		for (let index = 0; index <= SPRING_STOPS; index++) {
			const fraction = index / SPRING_STOPS;
			// The last stop is forced to 1: the envelope is small there but not zero, and a
			// `linear()` that does not end at 1 leaves the property short of its declared value.
			stops.push(
				index === SPRING_STOPS
					? '1'
					: `${+progress(fraction * settle).toFixed(4)} ${+(fraction * 100).toFixed(2)}%`
			);
		}
		return { duration: Math.round(settle * 1000), easing: `linear(${stops.join(', ')})` };
	}

	const spring = $derived(springEasing(Number(damping), period));
	const springStyle = $derived(
		`--interop-spring-duration: ${spring.duration}ms; --interop-spring-easing: ${spring.easing}`
	);
</script>

<ItemPage {item}>
	<!-- One `SpringVector3NaturalMotionAnimation` field serves the first three examples —
	     XamlCompInteropPage.xaml.cs:24 declares it once and :40-41 re-reads example 1's
	     damping ratio and period on every pointer enter and exit. So example 1's options
	     drive examples 2 and 3 as well, and the duration and easing are declared here and
	     inherited rather than repeated. `display: contents` keeps the wrapper out of the
	     layout: `ItemPage`'s own root is a flow root and the examples are its block children. -->
	<div class="interop" style={springStyle}>
		<ControlExample
			headerText={naturalMotionSample.header ?? undefined}
			csharp={naturalMotionSample.csharp ?? undefined}
		>
			<!-- XamlCompInteropPage.xaml:14 — VerticalAlignment="Stretch" on the StackPanel, which is
			     why the caption sits at the top of a pane the options column makes tall rather than
			     in the middle of it. Every StackPanel on this page is Stretch — that is XAML's
			     default and :14 only says it out loud — but `ControlExample` maps Stretch with a
			     fixed height onto its own `justify-content: center`, the rule its style block
			     states and measured. So this attribute goes on the three samples that declare no
			     height and is left off the two that do. -->
			<div class="natural" data-vertical-alignment="stretch">
				<p class="winui-BodyTextBlockStyle natural-caption">
					Hover over the button to animate its scale.
				</p>
				<div class="spring-slot natural-item"><Button class="spring-target">Item</Button></div>
			</div>
			{#snippet options()}
				<div class="natural-options">
					<RadioButtons header="Damping Ratio">
						<RadioButton value="0.2" bind:group={damping}>0.2</RadioButton>
						<RadioButton value="0.4" bind:group={damping}>0.4</RadioButton>
						<RadioButton value="0.6" bind:group={damping}>0.6</RadioButton>
						<RadioButton value="0.8" bind:group={damping}>0.8</RadioButton>
					</RadioButtons>
					<Slider
						header="Period (in ms)"
						min={25}
						max={200}
						step={25}
						tickFrequency={25}
						bind:value={period}
					/>
				</div>
			{/snippet}
		</ControlExample>

		<ControlExample
			headerText={ellipseSample.header ?? undefined}
			xaml={ellipseSample.xaml ?? undefined}
			csharp={ellipseSample.csharp ?? undefined}
		>
			<!-- XamlCompInteropPage.xaml:50 — the StackPanel's Height="200"; the grid sits at the top
			     of it and the rest is empty. A declared height, so no `data-vertical-alignment`:
			     see the note on example 1. -->
			<div class="ellipse-sample">
				<p class="winui-BodyTextBlockStyle">
					Hover over the square to animate its scale. Notice that the ellipse also animates.
				</p>
				<p class="ellipse-caption">
					The scale of the circle is inversely related to the scale of the square.
				</p>
				<div class="ellipse-grid">
					<div class="spring-slot shape-slot square-slot">
						<Rectangle fill="var(--winui-SystemAccentColor)" />
					</div>
					<div class="shape-slot ellipse-slot">
						<Ellipse fill="var(--winui-SystemAccentColor)" />
					</div>
				</div>
			</div>
		</ControlExample>

		<ControlExample
			headerText={stackedSample.header ?? undefined}
			csharp={stackedSample.csharp ?? undefined}
		>
			<div class="stacked" data-vertical-alignment="stretch">
				<p class="winui-BodyTextBlockStyle">
					Hover over any button to animate its scale. Notice that the other buttons move out of the
					way.
				</p>
				<p class="stacked-caption">
					Each button animates as a function of the previous button's scale and translation.
				</p>
				<div class="spring-slot stacked-slot slot-1">
					<Button class="spring-target">Item 1</Button>
				</div>
				<div class="spring-slot stacked-slot slot-2">
					<Button class="spring-target">Item 2</Button>
				</div>
				<div class="spring-slot stacked-slot slot-3">
					<Button class="spring-target">Item 3</Button>
				</div>
				<div class="spring-slot stacked-slot slot-4">
					<Button class="spring-target">Item 4</Button>
				</div>
			</div>
		</ControlExample>

		<ControlExample
			headerText={actualSizeSample.header ?? undefined}
			csharp={actualSizeSample.csharp ?? undefined}
		>
			<!-- XamlCompInteropPage.xaml:128-132 — Width="200" Height="200", with
			     XamlCompInteropPage.xaml.cs:162 setting both to the slider's value. The radius is half
			     of it, which is `source.ActualSize.X / 2` at :131. Carried as a bare number, because
			     `.02 * radius` at :132 is a count of radians and multiplying a length by 0.02 would
			     give a length. -->
			<div class="circle-panel" style={`--interop-radius: ${radius / 2}`}>
				{#each [0, 1, 2, 3, 4, 5, 6, 7] as index (index)}
					<!-- XamlCompInteropPage.xaml.cs:142-143 — every button reads "Button" and only its
					     automation name carries the number. The sample definition shown in the Source
					     pane says `Content = "Button" + i`, which the running page does not do. -->
					<div class="circle-slot" style={`--interop-index: ${index + 1}`}>
						<Button aria-label={`Button ${index}`}>Button</Button>
					</div>
				{/each}
			</div>
			{#snippet options()}
				<Slider
					style="min-width: 150px"
					header="Change radius"
					min={200}
					max={400}
					step={1}
					bind:value={radius}
				/>
			{/snippet}
		</ControlExample>

		<ControlExample
			headerText={actualOffsetSample.header ?? undefined}
			xaml={actualOffsetSample.xaml ?? undefined}
			csharp={actualOffsetSample.csharp ?? undefined}
		>
			<div class="popup-sample" data-vertical-alignment="stretch">
				<p class="winui-BodyTextBlockStyle">
					This sample positions a popup relative to a block of text that has variable layout size
					based on font size. Use the sliders to move and resize the text.
				</p>
				<div
					class="popup-grid"
					style={`--interop-text-margin: ${textMargin}px; --interop-text-font-size: ${fontSize}px`}
				>
					<p class="popup-target">
						Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
						incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
						exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure
						dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
						Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
						mollit anim id est laborum.
					</p>
					<!-- XamlCompInteropPage.xaml:166 — upstream's own comment: the popup is a sibling to
					     the target, not an ancestor. An absolutely positioned sibling is that. -->
					<div class="popup">
						<span class="winui-CaptionTextBlockStyle"
							>I am always right aligned center to the target.</span
						>
					</div>
				</div>
			</div>
			{#snippet options()}
				<div class="popup-options">
					<Slider header="Change font size" min={12} max={24} step={1} bind:value={fontSize} />
					<Slider header="Change text margin" min={0} max={100} step={1} bind:value={textMargin} />
				</div>
			{/snippet}
		</ControlExample>
	</div>
</ItemPage>

<style>
	/* A composition `ExpressionAnimation` re-evaluates its expression every frame. A registered
	   custom property is CSS's version of that: an ancestor transitions the number, and every
	   descendant that reads it through `calc()` is re-resolved on each of those frames. The
	   registration is what makes it a number rather than a token stream — an unregistered custom
	   property interpolates discretely — and it is global to the document, which is why every
	   name on this page is prefixed `--interop-`. Measured on the reference guest: with the
	   ancestor's property at 1.27772 mid-transition, the sibling reading `calc(1 / var(...))`
	   computed 0.782644. */
	@property --interop-item-scale {
		syntax: '<number>';
		inherits: true;
		initial-value: 1;
	}
	@property --interop-square-scale {
		syntax: '<number>';
		inherits: true;
		initial-value: 1;
	}
	@property --interop-s1 {
		syntax: '<number>';
		inherits: true;
		initial-value: 1;
	}
	@property --interop-s2 {
		syntax: '<number>';
		inherits: true;
		initial-value: 1;
	}
	@property --interop-s3 {
		syntax: '<number>';
		inherits: true;
		initial-value: 1;
	}
	@property --interop-s4 {
		syntax: '<number>';
		inherits: true;
		initial-value: 1;
	}
	@property --interop-t2 {
		syntax: '<length>';
		inherits: true;
		initial-value: 0px;
	}
	@property --interop-t3 {
		syntax: '<length>';
		inherits: true;
		initial-value: 0px;
	}
	@property --interop-t4 {
		syntax: '<length>';
		inherits: true;
		initial-value: 0px;
	}

	.interop {
		display: contents;
		/* c1-allow: XamlCompInteropPage.xaml.cs:72 — PointerEntered springs Scale to 1.5f, and :84
		   springs it back to 1f. Declared once here and aliased by the six rules that set a scale,
		   so that none of them carries a literal. */
		--interop-hover-scale: 1.5;
	}

	/* `UIElement.CenterPoint` defaults to (0,0,0) and nothing on this page sets it, so every
	   Scale here is about the element's top-left rather than its centre. Measured on the
	   reference guest by hovering example 3's first button: its left and top edges stayed where
	   they were and it grew right and down by half its size again, from 100x50 to 150x75. */
	.spring-slot {
		transform-origin: 0 0;
	}

	/* The three examples the one spring field drives. Longhands rather than the `transition`
	   shorthand: only the property list differs between them, and the duration and easing are
	   inherited from `.interop`. */
	.natural,
	.ellipse-grid,
	.stacked {
		transition-duration: var(--interop-spring-duration);
		transition-timing-function: var(--interop-spring-easing);
	}

	/* The `Button` fills the slot that carries the size, the hover and the scale. Descendant-
	   qualified because the class reaches the component's root without this file's scope hash. */
	.spring-slot :global(.spring-target) {
		width: 100%;
		height: 100%;
	}

	.natural {
		display: flex;
		flex-direction: column;
		transition-property: --interop-item-scale;
	}

	/* XamlCompInteropPage.xaml:16 — Margin="0,0,0,12" on the caption. The TextBlock sets no
	   TextWrapping and a TextBlock's default is NoWrap. */
	.natural-caption {
		margin: 0 0 12px;
		white-space: nowrap;
	}

	/* XamlCompInteropPage.xaml:20-21 — Width="100" Height="50". */
	.natural-item {
		width: 100px;
		height: 50px;
		scale: var(--interop-item-scale);
	}
	.natural:has(.natural-item:hover) {
		--interop-item-scale: var(--interop-hover-scale);
	}
	.natural-options {
		display: flex;
		flex-direction: column;
	}

	/* XamlCompInteropPage.xaml:50 — Height="200" on the StackPanel; the grid sits at the top of
	   it and the rest of the pane is empty. */
	.ellipse-sample {
		display: flex;
		flex-direction: column;
		height: 200px;
	}
	/* Both captions are TextBlocks with no TextWrapping, so both are NoWrap — and their width is
	   what sizes this example. The StackPanel shrink-wraps to its widest child, the two star
	   columns below divide that, and where the circle lands follows from it. Decoded from the
	   reference capture and measured here: 492 against 492.81, with the square at 469 against
	   468.2 and the circle at 715 against 714.61. */
	.ellipse-sample > p {
		margin: 0;
		white-space: nowrap;
	}
	/* XamlCompInteropPage.xaml:52 — Margin="0,0,0,12" on the second caption. Qualified to match
	   the reset above, which is more specific than a bare class and would otherwise win. */
	.ellipse-sample > .ellipse-caption {
		margin-bottom: 12px;
	}
	/* XamlCompInteropPage.xaml:53-57 — a Grid with two `*` columns and VerticalAlignment="Top". */
	.ellipse-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		align-content: start;
		transition-property: --interop-square-scale;
	}
	.ellipse-grid:has(.square-slot:hover) {
		--interop-square-scale: var(--interop-hover-scale);
	}
	/* XamlCompInteropPage.xaml:60-61 and :68-69 — both shapes are 50 by 50. */
	.shape-slot {
		justify-self: center;
		width: 50px;
		height: 50px;
	}
	/* `Rectangle` and `Ellipse` render an `<svg>` root and take their size from the caller; an
	   `<svg>` with no size of its own is 300 by 150. */
	.shape-slot :global(svg) {
		display: block;
		width: 100%;
		height: 100%;
	}
	.square-slot {
		scale: var(--interop-square-scale);
	}
	/* XamlCompInteropPage.xaml:70 — Margin="55,0" on the Ellipse, which is half of where it
	   lands: the track centres its margin box, not its border box. XamlCompInteropPage.xaml.cs:93
	   is `Vector3(1/scaleElement.Scale.X, 1/scaleElement.Scale.Y, 1)`. The reciprocal is the
	   whole example, and `calc()` divides by a registered number directly. */
	.ellipse-slot {
		margin: 0 55px;
		transform-origin: 0 0;
		scale: calc(1 / var(--interop-square-scale));
	}

	/* XamlCompInteropPage.xaml:79 — Margin="0,0,0,50" on the StackPanel. */
	.stacked {
		display: flex;
		flex-direction: column;
		margin-bottom: 50px;
		transition-property: --interop-s1, --interop-s2, --interop-s3, --interop-s4;
	}
	/* Both captions are TextBlocks with no TextWrapping. */
	.stacked > p {
		margin: 0;
		white-space: nowrap;
	}
	/* XamlCompInteropPage.xaml:81 — Margin="0,0,0,12" on the second caption. Qualified for the
	   reason given above example 2's. */
	.stacked > .stacked-caption {
		margin-bottom: 12px;
	}
	/* XamlCompInteropPage.xaml:84-86, and the same three lines on each of the other three
	   buttons — Width="100" Height="50" Margin="5". */
	.stacked-slot {
		width: 100px;
		height: 50px;
		margin: 5px;
	}
	.slot-1 {
		scale: var(--interop-s1);
	}
	.slot-2 {
		scale: var(--interop-s2);
		translate: 0 var(--interop-t2);
	}
	.slot-3 {
		scale: var(--interop-s3);
		translate: 0 var(--interop-t3);
	}
	.slot-4 {
		scale: var(--interop-s4);
		translate: 0 var(--interop-t4);
	}
	.stacked:has(.slot-1:hover) {
		--interop-s1: var(--interop-hover-scale);
	}
	.stacked:has(.slot-2:hover) {
		--interop-s2: var(--interop-hover-scale);
	}
	.stacked:has(.slot-3:hover) {
		--interop-s3: var(--interop-hover-scale);
	}
	.stacked:has(.slot-4:hover) {
		--interop-s4: var(--interop-hover-scale);
	}
	/* XamlCompInteropPage.xaml.cs:104 — `(above.Scale.Y - 1) * 50 + above.Translation.Y % (50 * index)`,
	   started on buttons 2, 3 and 4 with `above` bound to the button before each and `index` 1, 2
	   and 3 (:107-117). One expression applied three times, which is why the first button's term
	   is written out as `rem(0px, 50px)` rather than folded away. `%` in the composition
	   expression language is C#'s remainder, whose sign follows the dividend. That is CSS's
	   `rem()` and not its `mod()`. */
	.stacked {
		/* c1-allow: XamlCompInteropPage.xaml.cs:104 — the `* 50` of the expression. */
		--interop-t2: calc((var(--interop-s1) - 1) * 50px + rem(0px, 50px));
		/* c1-allow: XamlCompInteropPage.xaml.cs:104 and :111-112 — `50 * index` at index 2. */
		--interop-t3: calc((var(--interop-s2) - 1) * 50px + rem(var(--interop-t2), 100px));
		/* c1-allow: XamlCompInteropPage.xaml.cs:104 and :115-116 — `50 * index` at index 3. */
		--interop-t4: calc((var(--interop-s3) - 1) * 50px + rem(var(--interop-t3), 150px));
	}

	/* XamlCompInteropPage.xaml:128-132 — Width="200" Height="200" Margin="12" on the Grid, with
	   XamlCompInteropPage.xaml.cs:162 setting both dimensions to the slider's value. */
	.circle-panel {
		display: grid;
		width: calc(var(--interop-radius) * 2px);
		height: calc(var(--interop-radius) * 2px);
		margin: 12px;
	}
	/* Eight buttons in one cell. `DefaultButtonStyle` sets HorizontalAlignment="Left" and
	   VerticalAlignment="Center" — Button_themeresources.xaml:161-162 — which is what
	   XamlCompInteropPage.xaml.cs:133-134 means by "the buttons naturally layout along the left
	   edge" and "naturally layout vertically centered". XamlCompInteropPage.xaml.cs:131-137
	   transcribes the radius, theta and Vector3 translation. CSS reads a bare number inside
	   `cos()` and `sin()` as radians and knows `pi`, so the expression transcribes directly. */
	.circle-slot {
		grid-area: 1 / 1;
		justify-self: start;
		align-self: center;
		/* c1-allow: XamlCompInteropPage.xaml.cs:132 — the .02 rate of angular change, with the 8
		   of `totalElements` at :139. */
		--interop-theta: calc(0.02 * var(--interop-radius) + (2 * pi / 8) * var(--interop-index));
		translate: calc(
				(var(--interop-radius) * cos(var(--interop-theta)) + var(--interop-radius)) * 1px
			)
			calc(var(--interop-radius) * sin(var(--interop-theta)) * 1px);
	}

	.popup-sample {
		display: flex;
		flex-direction: column;
	}
	/* A `<p>` carries the browser's `margin: 1em 0` and a `TextBlock` carries none, so every
	   caption on this page states its own. Measured before this rule and the two like it: 14px
	   above and below each of the three leading captions, which put examples 2, 3 and 5 each
	   28px lower inside their pane than upstream draws them. */
	.popup-sample > p {
		margin: 0;
	}
	/* XamlCompInteropPage.xaml:157 — Margin="0,12,0,0" HorizontalAlignment="Left" on the Grid.
	   `position: relative` is what makes it the popup's containing block. */
	.popup-grid {
		position: relative;
		align-self: flex-start;
		margin-top: 12px;
	}
	/* XamlCompInteropPage.xaml:160-164 — Width="300", the margin and font size bound to the two
	   sliders, and TextWrapping="WrapWholeWords", which is CSS's default wrapping. */
	.popup-target {
		width: 300px;
		margin: var(--interop-text-margin);
		font-size: var(--interop-text-font-size);
	}
	/* XamlCompInteropPage.xaml.cs:170 — `Vector3(source.ActualOffset.X + source.ActualSize.X,
	   source.ActualOffset.Y + source.ActualSize.Y / 2 - 25, 0)`. Both halves are statements CSS
	   makes without arithmetic. The target's ActualOffset is its own margin, so its right edge is
	   `margin + 300`. Its vertical centre is the Grid's 50%, and `top: 50%` says it without
	   measuring anything. The `- 25` is upstream's half of the popup's own MinHeight, which means
	   a popup taller than 50 is not in fact centred on the target. That is reproduced, not
	   corrected. XamlCompInteropPage.xaml:167 gives the Popup Margin="5"; :169-171 give it
	   MinWidth="50" MaxWidth="200" MinHeight="50". **The two token substitutions below are
	   documented in WD-051.** */
	.popup {
		position: absolute;
		top: 50%;
		left: calc(var(--interop-text-margin) + 300px);
		display: flex;
		align-items: center;
		/* A `Popup` is an overlay: its child measures at its own desired size, unconstrained by
		   the element it is declared beside. An absolutely positioned box with `left` set and no
		   width shrink-wraps to what is left of its containing block instead — which here is the
		   300-wide target minus the 300 the `left` already spent, so the popup came out 62 wide
		   with one word per line. `max-content` is the unconstrained measure, and `max-width`
		   then wraps it. This lands the box at 200 where upstream draws 185: XAML reports the
		   width its wrapped lines actually used and CSS reports the cap it wrapped at, and no
		   CSS length expresses the former. */
		/* XAML's MinWidth, MaxWidth and MinHeight are the element's outer size and CSS's are its
		   content box, so without this the 2px border was added to all three and the box came
		   out 204 by 54 where its constraints say 200 by 50. */
		box-sizing: border-box;
		width: max-content;
		min-width: 50px;
		max-width: 200px;
		min-height: 50px;
		margin: 5px;
		translate: 0 -25px;
		background: var(--winui-FlyoutPresenterBackground);
		border-style: solid;
		border-color: var(--winui-FlyoutBorderThemeBrush);
		/* c1-allow: XamlCompInteropPage.xaml:174, `BorderThickness="2"`. */
		border-width: 2px;
	}
	/* XamlCompInteropPage.xaml:176 — Margin="6" on the TextBlock. */
	.popup > span {
		margin: 6px;
	}

	.popup-options {
		display: flex;
		flex-direction: column;
	}
</style>
