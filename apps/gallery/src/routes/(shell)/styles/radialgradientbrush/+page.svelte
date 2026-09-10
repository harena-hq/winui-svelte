<script lang="ts">
	import { ComboBox, Slider } from 'winui-svelte';
	import type { ComboBoxProps } from 'winui-svelte';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/styles/radialgradientbrush');
	if (item === null) throw new Error('RadialGradientBrush page has no Gallery item');

	// RadialGradientBrushPage.xaml:19 — the page's one SampleDefinition. The lower-case `g` and
	// `b` in `Radialgradientbrush` are the file's real name, not a typo. The file carries no C#
	// section, so the example below passes no `csharp` and its Source code expander offers XAML
	// alone.
	const sample = sampleOf('RadialGradientBrush/RadialgradientbrushSample.txt');

	// RadialGradientBrushPage.xaml:26-27 — the Rectangle is 200 by 200. The same number is the
	// Absolute mapping mode's whole scale: RadialGradientBrushPage.xaml.cs:50 reads the
	// rectangle's own ActualSize and :53-58 derive every Absolute maximum, midpoint and step
	// from it.
	const SAMPLE_SIZE = 200;

	// The markup values are never the rest state, and this is the one trap on the page.
	// RadialGradientBrushPage.xaml:31-35 gives the brush a centre of 0.25,0.25, a gradient
	// origin of 0.5,.25 and radii of .5 — but RadialGradientBrushPage.xaml.cs:17 hooks Loaded,
	// :24 calls InitializeSliders(), and its relative branch (:64-71) sets all six sliders to a
	// value of 0.5. Setting Slider.Value raises ValueChanged, which is OnSliderValueChanged
	// (:75-81), which writes all six straight back onto the brush. So none of the six numbers in
	// the markup survives the page's own load, and the state below is where the original starts.
	let mappingMode = $state('RelativeToBoundingBox');
	let spreadMethod = $state('Pad');
	let centerX = $state(0.5);
	let centerY = $state(0.5);
	let radiusX = $state(0.5);
	let radiusY = $state(0.5);
	let originX = $state(0.5);
	let originY = $state(0.5);

	// RadialGradientBrushPage.xaml:61-62 — the two x:String items, in the file's own order.
	const MAPPING_MODES: ComboBoxProps['items'] = ['RelativeToBoundingBox', 'Absolute'].map(
		(value) => ({ value, label: value })
	);

	// RadialGradientBrushPage.xaml:110-112 — the three x:String items, in the file's own order.
	const SPREAD_METHODS: ComboBoxProps['items'] = ['Pad', 'Reflect', 'Repeat'].map((value) => ({
		value,
		label: value
	}));

	/**
	 * InitializeSliders(), RadialGradientBrushPage.xaml.cs:48-73. Both branches put all six
	 * sliders at the midpoint of their range: 0.5 of the box in the relative branch (:66-67),
	 * and half the rectangle's width in the Absolute one (:55-56). OnMappingModeChanged (:37-46)
	 * calls it again, so changing the mapping mode resets every slider.
	 */
	function initializeSliders(mode: string): void {
		const half = mode === 'Absolute' ? SAMPLE_SIZE / 2 : 0.5;
		centerX = centerY = radiusX = radiusY = originX = originY = half;
	}

	// `!== 'Absolute'` rather than `=== 'RelativeToBoundingBox'` because that is the shape of
	// UpdateCompositionGradientMappingMode, RadialGradientBrush.cpp:150-160: Absolute is the only
	// case, and everything else — the unrecognised value included — falls through to relative.
	const relative = $derived(mappingMode !== 'Absolute');

	// RadialGradientBrushPage.xaml.cs:64-65 and :68 for the relative branch, :53-54 and :57-58
	// for the Absolute one. The Absolute step is the rectangle's width over 50, which is 4.
	const sliderMax = $derived(relative ? 1 : SAMPLE_SIZE);
	const sliderStep = $derived(relative ? 0.02 : SAMPLE_SIZE / 50);

	// Both formatters round, for one reason. A step of 0.02 is not representable in binary, so a
	// slider three steps up from 0.5 arrives as 0.5600000000000001, and neither a percentage in a
	// gradient nor a number in a code sample should carry that. Four decimal places is past the
	// resolution of both steps — 0.02 and 4 — so nothing a slider can produce is rounded away.

	/** One of the brush's six numbers as a CSS length: the mapping mode is its unit. */
	const length = (v: number): string => (relative ? `${+(v * 100).toFixed(4)}%` : `${v}px`);

	/** The same number as the substitution text the Source code expander shows. */
	const show = (v: number): string => String(+v.toFixed(4));

	// Two lengths as the ending shape's size make it an ellipse, which is what a brush with a
	// separate RadiusX and RadiusY is.
	const shape = $derived(
		`${length(radiusX)} ${length(radiusY)} at ${length(centerX)} ${length(centerY)}`
	);

	// The three spread methods are the three ExtendModes UpdateCompositionExtendMode maps them to
	// (RadialGradientBrush.cpp:211-230). Pad is Clamp and is a plain gradient, whose last stop
	// continues outward; Repeat is Wrap and is a repeating gradient whose period is the ellipse;
	// Reflect is Mirror and is a repeating gradient over twice that period, with the stops run
	// back again so each copy is the reverse of the one before. Pad is the fall-through rather
	// than a third branch for the same reason relative is above — it is the `default` case at
	// :223-227.
	const gradient = $derived.by(() => {
		const first = 'var(--sample-stop-0)';
		const last = 'var(--sample-stop-1)';
		if (spreadMethod === 'Repeat')
			return `repeating-radial-gradient(${shape}, ${first} 0%, ${last} 100%)`;
		if (spreadMethod === 'Reflect')
			return `repeating-radial-gradient(${shape}, ${first} 0%, ${last} 100%, ${first} 200%)`;
		return `radial-gradient(${shape}, ${first} 0%, ${last} 100%)`;
	});

	// Not reproduced: x:Name on every element, and the two SmallChange values
	// (RadialGradientBrushPage.xaml:68 and RadialGradientBrushPage.xaml.cs:59-60, :70-71).
	// SmallChange is the arrow-key increment, a keyboard behaviour, and Slider.svelte publishes
	// no prop for it.
</script>

<ItemPage {item}>
	<ControlExample
		headerText={sample.header ?? undefined}
		xaml={sample.xaml ?? undefined}
		substitutions={{
			MappingMode: mappingMode,
			CenterX: show(centerX),
			CenterY: show(centerY),
			RadiusX: show(radiusX),
			RadiusY: show(radiusY),
			OriginX: show(originX),
			OriginY: show(originY),
			SpreadMethod: spreadMethod
		}}
	>
		<!-- RadialGradientBrushPage.xaml:20-23 — the sample's horizontal StackPanel. It has one
		     child, so its HorizontalAlignment of Center resolves to nothing: the example presenter
		     gives its content the width the content asks for, which is the reading
		     `styles/animatedicon/+page.svelte` and `ControlExample.svelte` already write down. The
		     element stays rather than being dropped, because it is what the original has. Its
		     VerticalAlignment of Center is likewise already the presenter's own doing —
		     `.example` centres its content. -->
		<div class="stack">
			<!-- c1-allow: the gradient's geometry comes from the options pane and its two colours
			     are the tokens `.sample` declares below; C1 reads the script interpolation as a
			     colour it does not know. -->
			<div class="sample" style="background: {gradient}"></div>
		</div>
		{#snippet options()}
			<!-- RadialGradientBrushPage.xaml:44-114 — the options Grid, five rows by two columns.
			     Its children are written here in the source's own order and placed by grid
			     auto-flow, which puts them in exactly the cells the original's Grid.Row and
			     Grid.Column attributes name. -->
			<div class="options">
				<!-- RadialGradientBrushPage.xaml:56-63 — ComboBox Grid.ColumnSpan is 2, header
				     MappingMode, SelectedValue RelativeToBoundingBox.

				     No `bind:value`, because selecting a mode has a second effect:
				     OnMappingModeChanged (RadialGradientBrushPage.xaml.cs:37-46) sets the brush's
				     MappingMode and then calls InitializeSliders() again. -->
				<ComboBox
					class="wide"
					header="MappingMode"
					items={MAPPING_MODES}
					value={mappingMode}
					onValueChange={(value) => {
						mappingMode = value;
						initializeSliders(value);
					}}
				/>
				<!-- RadialGradientBrushPage.xaml:64-69 — Slider Header="Center.X". Minimum is 0
				     because none of the six sliders authors one and RangeBase's own default is 0;
				     the maximum and the step are the mapping mode's, from InitializeSliders(). -->
				<Slider header="Center.X" min={0} max={sliderMax} step={sliderStep} bind:value={centerX} />
				<!-- RadialGradientBrushPage.xaml:70-76 — Slider Header="Center.Y", row 1 column 1. -->
				<Slider header="Center.Y" min={0} max={sliderMax} step={sliderStep} bind:value={centerY} />
				<!-- RadialGradientBrushPage.xaml:77-82 — Slider Header="RadiusX". -->
				<Slider header="RadiusX" min={0} max={sliderMax} step={sliderStep} bind:value={radiusX} />
				<!-- RadialGradientBrushPage.xaml:83-89 — Slider Header="RadiusY", row 2 column 1. -->
				<Slider header="RadiusY" min={0} max={sliderMax} step={sliderStep} bind:value={radiusY} />
				<!-- RadialGradientBrushPage.xaml:90-95 — Slider Header="GradientOrigin.X".
				     WD-038: the slider moves and the substitution follows it, but a CSS
				     radial-gradient has one centre and no focal point, so nothing in the painted
				     rectangle changes; see docs/divergences.md -->
				<Slider
					header="GradientOrigin.X"
					min={0}
					max={sliderMax}
					step={sliderStep}
					bind:value={originX}
				/>
				<!-- RadialGradientBrushPage.xaml:96-102 — Slider Header="GradientOrigin.Y", row 3
				     column 1. WD-038 again, on the other half of the same point; see
				     docs/divergences.md -->
				<Slider
					header="GradientOrigin.Y"
					min={0}
					max={sliderMax}
					step={sliderStep}
					bind:value={originY}
				/>
				<!-- RadialGradientBrushPage.xaml:103-113 — ComboBox Grid.Row 4, Grid.ColumnSpan 2,
				     a top margin of 10, header SpreadMethod, SelectedValue Pad. A plain bind: the
				     spread method has no second effect, OnSpreadMethodChanged
				     (RadialGradientBrushPage.xaml.cs:27-35) writing only the brush's own member. -->
				<ComboBox
					class="wide spread"
					header="SpreadMethod"
					items={SPREAD_METHODS}
					bind:value={spreadMethod}
				/>
			</div>
		{/snippet}
	</ControlExample>
</ItemPage>

<style>
	/* RadialGradientBrushPage.xaml:20-23 — StackPanel, Orientation="Horizontal". */
	.stack {
		display: flex;
	}

	/* RadialGradientBrushPage.xaml:24-41 — the Rectangle, 200 by 200, filled with the brush.
	   A plain box and not this library's `Rectangle` component, and the reason is the paint
	   channel: a CSS gradient is a `background`, while `Rectangle`'s `fill` is an SVG paint
	   attribute, which takes a colour or a paint server and not a CSS gradient. This rectangle
	   carries no stroke and no corner radius, so what `Rectangle` would add — the
	   inside-the-edge stroke geometry that is the whole reason that component exists — is not in
	   play, and the two paint the same 200 by 200 area. docs/plan.md's decision D35 settles the
	   rest: a shape is a component, a brush is a value.

	   The ramp is plain sRGB, which is what CSS interpolates a gradient in by default, so
	   nothing has to be said about it here. */
	.sample {
		/* c1-allow: RadialGradientBrushPage.xaml:37 — the first GradientStop, Yellow at offset 0. */
		--sample-stop-0: #ffff00;
		/* c1-allow: RadialGradientBrushPage.xaml:38 — the last GradientStop, Blue at offset 1. */
		--sample-stop-1: #0000ff;
		width: 200px;
		height: 200px;
	}

	/* RadialGradientBrushPage.xaml:44-55 — a Grid of five rows and two columns, every one of
	   them star and none of them given a size.

	   `1fr 1fr` is the reproduction of the two star columns, and it is right for a reason worth
	   writing down: the options pane measures its content with no width constraint, so each star
	   column takes its widest cell rather than half of anything, and an `fr` track under a
	   max-content constraint does the same — takes its items' max-content, and then equalises the
	   two. Measured on the original that comes to 206 wide, 103 a column, which is the width of
	   the GradientOrigin.X and GradientOrigin.Y headers; the two end up exactly touching, which is
	   why the original reads `GradientOrigin.XGradientOrigin.Y` with no gap between them.

	   There is deliberately no `grid-template-rows`. The five star rows measure as auto here
	   because the options presenter gives the grid its desired height rather than a height to
	   divide, so the rows come out content-height and unequal — 60 for the ComboBox row and 55
	   for each slider row on the original — which is what the implicit auto rows already do. */
	.options {
		display: grid;
		grid-template-columns: 1fr 1fr;
	}

	/* Both ComboBoxes are Grid.ColumnSpan="2" — RadialGradientBrushPage.xaml:58 and :106.

	   `justify-self: start` is not a choice this page makes: WinUI's own default ComboBox style
	   sets HorizontalAlignment to Left (ComboBox_themeresources.xaml:376, inside
	   DefaultComboBoxStyle at :359), so both combos shrink-wrap instead of filling the span —
	   194 wide for MappingMode and 92 for SpreadMethod on the original. The Sliders carry no such
	   setter and do fill their column, which is a grid item's default.

	   `:global` because a class handed across a component boundary lands on that component's root
	   without this file's scope hash; the descendant selector keeps the global rule inside this
	   page's own options grid, since `.wide` is a name two dev pages already use. */
	.options :global(.wide) {
		grid-column: 1 / span 2;
		justify-self: start;
	}

	/* RadialGradientBrushPage.xaml:107 — the SpreadMethod ComboBox is the only child with a
	   margin, and it is a top margin of 10. */
	.options :global(.spread) {
		margin-top: 10px;
	}
</style>
