<script lang="ts">
	import {
		ComboBox,
		Ellipse,
		Hyperlink,
		Paragraph,
		Rectangle,
		RichTextBlock,
		Slider
	} from 'winui-svelte';
	import type { ComboBoxItemData, ComboBoxProps } from 'winui-svelte';
	import { resolve } from '$app/paths';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/styles/acrylic');
	if (item === null) throw new Error('AcrylicBrush page has no Gallery item');

	// AcrylicPage.xaml:48, :78 and :156 — the three SampleDefinition paths, in page order.
	// None carries a C# section, so each Source code expander below offers XAML alone.
	const defaultSample = sampleOf('Acrylic/DefaultAppAcrylicBrush.txt');
	const customSample = sampleOf('Acrylic/CustomAcrylicAppBrush.txt');
	const luminositySample = sampleOf('Acrylic/LuminosityAppAcrylic.txt');

	// AcrylicPage.xaml:134-136 and :144-145 — the two ComboBoxes contain Black, Red, Blue
	// and Green, Yellow in that order. The original displays each SolidColorBrush through its
	// Color, which WinUI prints as an ARGB string rather than as a colour name.
	const TINT_COLORS: ComboBoxProps['items'] = ['#FF000000', '#FFFF0000', '#FF0000FF'].map(
		(value) => ({ value, label: value })
	);

	const FALLBACK_COLORS: ComboBoxProps['items'] = ['#FF008000', '#FFFFFF00'].map((value) => ({
		value,
		label: value
	}));

	// AcrylicPage.xaml.cs:23-29 — this is the state after AcrylicPage_Loaded, not the values
	// written in the resource declarations. Setting SelectedIndex raises SelectionChanged, so
	// the handlers at :40 and :46 write these two values onto the brush during load. All three
	// sliders start at 0.8.
	let tintOpacityInApp = $state(0.8);
	let tintColor = $state('#FF000000');
	let fallbackColor = $state('#FF008000');
	let tintOpacityLumin = $state(0.8);
	let tintLuminosityOpacity = $state(0.8);

	/** One of the two combos' items as a CSS colour: XAML prints #AARRGGBB, CSS reads
	 * #RRGGBBAA. Both come from the one SolidColorBrush, which is what the DataTemplate's
	 * {x:Bind} and {x:Bind Color} are two views of. */
	const cssColor = (argb: string): string => `#${argb.slice(3)}${argb.slice(1, 3)}`;

	/** A slider value as the substitution text the Source code expander shows. Three decimal
	 * places is the sliders' own StepFrequency of 0.001, so nothing a slider can produce is
	 * rounded away; the rounding is there because 0.001 is not representable in binary. */
	const show = (v: number): string => String(+v.toFixed(3));

	// Deliberately not reproduced: the two narrow adaptive layouts in AcrylicPage.xaml:225-258.
	// The reference window is 1600 pixels wide, so the WiderLayout numbers are the only ones
	// this page writes; every page in this reproduction uses its measured wide state.
	//
	// Deliberately not reproduced: Example2Grid. The visual states set its size at :234-235 and
	// :249-250, but no such element exists between Example1, Example3 and Example4.
	//
	// Deliberately not reproduced: MinWidth 320 on Example1Grid and Example3Grid (:53 and :82),
	// and MinWidth 652 on Example4Grid (:160). At this width each state's explicit Width wins.
	//
	// Deliberately not reproduced: x:Name and AutomationProperties.Name, which have no analogue
	// this page needs; IsFocusEngagementEnabled, which is gamepad behaviour; and SmallChange at
	// AcrylicPage.xaml:125, :203 and :215. Slider.svelte publishes no SmallChange prop, as the
	// RadialGradientBrush page records for the same member.
</script>

{#snippet shapes()}
	<!-- AcrylicPage.xaml:54-73, :88-107 and :166-185 — the original repeats this shape block
	     three times; one snippet rendered three times is the same tree. Rectangle and Ellipse
	     are this library's shape components under D35, and no stroke is present in any copy. -->
	<div class="shapes">
		<!-- AcrylicPage.xaml:55-60 — Rectangle, 100 by 200, Left and Top, Aqua. -->
		<Rectangle class="aqua" fill="var(--sample-aqua)" />
		<!-- AcrylicPage.xaml:61-66 — Ellipse, 152 by 152, Center and Center, Magenta. -->
		<Ellipse class="magenta" fill="var(--sample-magenta)" />
		<!-- AcrylicPage.xaml:67-72 — Rectangle, 80 by 100, Right and Bottom, Yellow. -->
		<Rectangle class="yellow" fill="var(--sample-yellow)" />
	</div>
{/snippet}

{#snippet colorItem(item: ComboBoxItemData)}
	<!-- AcrylicPage.xaml:27-35 — ColorTemplate is a horizontal row containing the 20 by 20
	     brush swatch and the brush's printed Color value. -->
	<span class="color-item">
		<!-- c1-allow: AcrylicPage.xaml:29-32 — the swatch is the item's own Color, which is the
		     one thing this template exists to show; the value comes from the item, not this file. -->
		<span class="swatch" style="background: {cssColor(item.value)}"></span>
		{item.label}
	</span>
{/snippet}

<!-- AcrylicPage.xaml:38-258 — the page's root StackPanel is supplied by ItemPage's content
     frame, while this component supplies the page content and the Gallery item header. -->
<ItemPage {item}>
	<!-- AcrylicPage.xaml:39-47 — the page's RichTextBlock and Paragraph.

	     No Style is named, and the class is still what carries the ramp: XAML's inherited text
	     formatting record has a default of its own — TextFormatting::CreateDefault
	     (TextFormatting.cpp:110) sets FontSize 14 (:124, applied at :142), FontWeight Normal (:146)
	     and the ultimate font (:144), which FontAndScriptServices.h:30 declares as the literal
	     string XamlAutoFontFamily — and this document's root supplies no font at all.

	     The paragraph ends in text rather than a LineBreak, so Paragraph's own ::after rule adds no
	     empty final line. -->
	<RichTextBlock class="winui-BodyTextBlockStyle">
		<Paragraph>
			Acrylic Brush might fall back to SolidColorbrush in certain scenarios. If you can't see the
			Acrylic effect, please refer to
			<!-- AcrylicPage.xaml:43 — the external NavigateUri is kept verbatim. -->
			<Hyperlink
				navigateUri="https://learn.microsoft.com/windows/apps/design/style/acrylic#usability-and-adaptability"
				>Acrylic brush adaptability documentation</Hyperlink
			>. Acrylic Brush uses in-app acrylic. See
			<!-- AcrylicPage.xaml:45 and AcrylicPage.xaml.cs:58-61 — a Click handler rather than a
			     NavigateUri, and what it navigates to is the SystemBackdrops item. The cast is the
			     one the shell's own layout makes in `chooseSuggestion`: an item id is a path
			     the record produces, not a route literal the compiler knows, and today this one is
			     still served by the [...path] placeholder route. -->
			<Hyperlink navigateUri={resolve('/styles/systembackdrops' as `/${string}`)}
				>SystemBackdrops (Mica/Acrylic)</Hyperlink
			> for background acrylic.
		</Paragraph>
	</RichTextBlock>

	<!-- AcrylicPage.xaml:48-77 — Example1 uses the default in-app brush and has no options pane
	     or substitutions. -->
	<!-- AcrylicPage.xaml:50-75 and :247-248 — Example1Grid is the 400 by 252 narrow frame. -->
	<ControlExample
		headerText={defaultSample.header ?? undefined}
		xaml={defaultSample.xaml ?? undefined}
	>
		<div class="frame frame-narrow">
			{@render shapes()}
			<!-- AcrylicPage.xaml:74 — Rectangle, Margin 12, filled with the framework's own
			     AcrylicInAppFillColorDefaultBrush. The Light, Dark and HighContrast brush
			     definitions are at AcrylicBrush_themeresources.xaml:96, :44 and :148; the
			     token layer emits the Light fallback #f9f9f9 exactly.
			     WD-039: the default acrylic material is inert here; see docs/divergences.md -->
			<Rectangle class="panel" fill="var(--winui-AcrylicInAppFillColorDefaultBrush)" />
		</div>
	</ControlExample>

	<!-- AcrylicPage.xaml:78-154 — Example3 uses the page-declared custom in-app brush, its
	     options pane, and the three live Source substitutions. -->
	<!-- AcrylicPage.xaml:150-152 — ControlExampleSubstitution.ValueAsString()
	     (.upstream/WinUI-Gallery/WinUIGallery/Controls/ControlExample.xaml.cs:50-66,
	     especially :59-63) turns a SolidColorBrush value into its Color, so the two color
	     substitutions below remain ARGB strings rather than type names. -->
	<ControlExample
		headerText={customSample.header ?? undefined}
		xaml={customSample.xaml ?? undefined}
		substitutions={{
			OpacitySlider: show(tintOpacityInApp),
			TintColor: tintColor,
			FallbackColor: fallbackColor
		}}
	>
		<!-- AcrylicPage.xaml:80-112 and :251-252 — Example3Grid is the 652 by 252 wide frame. -->
		<div class="frame frame-wide">
			{@render shapes()}
			<!-- AcrylicPage.xaml:108-111 — Rectangle, Margin 12, filled with the page-declared
			     CustomAcrylicInAppBrush.
			     WD-039: Tint controls are inert in the painted rectangle; see docs/divergences.md -->
			<Rectangle class="panel" fill={cssColor(fallbackColor)} />
		</div>
		{#snippet options()}
			<!-- AcrylicPage.xaml:115-147 — the options StackPanel. The labels stay separate from
			     the ComboBoxes because neither upstream ComboBox carries a Header. -->
			<div class="options">
				<!-- AcrylicPage.xaml:116 — TextBlock, Tint Opacity, with a 12-pixel bottom margin. -->
				<p class="option-label label-below">Tint Opacity :</p>
				<!-- AcrylicPage.xaml:117-127 — Slider, 200 wide, 0 through 1, step 0.001.
				     WD-039: changing Tint Opacity changes only the sample code; see docs/divergences.md -->
				<Slider class="option-slider" min={0} max={1} step={0.001} bind:value={tintOpacityInApp} />
				<!-- AcrylicPage.xaml:128 — TextBlock, Tint Color, with 12-pixel margins above and
				     below. -->
				<p class="option-label label-around">Tint Color :</p>
				<!-- AcrylicPage.xaml:129-137 — ComboBox, ColorTemplate, Black/Red/Blue items.
				     WD-039: changing Tint Color changes only the sample code; see docs/divergences.md -->
				<ComboBox items={TINT_COLORS} itemTemplate={colorItem} bind:value={tintColor} />
				<!-- AcrylicPage.xaml:138 — TextBlock, Fallback Color, with 12-pixel margins above
				     and below. -->
				<p class="option-label label-around">Fallback Color :</p>
				<!-- AcrylicPage.xaml:139-146 — ComboBox, ColorTemplate, Green/Yellow items. -->
				<ComboBox items={FALLBACK_COLORS} itemTemplate={colorItem} bind:value={fallbackColor} />
			</div>
		{/snippet}
	</ControlExample>

	<!-- AcrylicPage.xaml:156-224 — Example4 uses the page-declared luminosity brush, its
	     options pane, and the two live Source substitutions. -->
	<ControlExample
		headerText={luminositySample.header ?? undefined}
		xaml={luminositySample.xaml ?? undefined}
		substitutions={{
			OpacitySlider: show(tintOpacityLumin),
			TintLuminositySlider: show(tintLuminosityOpacity)
		}}
	>
		<!-- AcrylicPage.xaml:158-190 and :253-254 — Example4Grid is the 652 by 252 wide frame. -->
		<div class="frame frame-wide frame-lumin">
			{@render shapes()}
			<!-- AcrylicPage.xaml:186-189 — Rectangle, Margin 12, filled with the page-declared
			     CustomAcrylicInAppLuminosity brush. -->
			<Rectangle class="panel" fill="var(--sample-skyblue)" />
		</div>
		{#snippet options()}
			<!-- AcrylicPage.xaml:193-217 — the options StackPanel, in source order. -->
			<div class="options">
				<!-- AcrylicPage.xaml:194 — TextBlock, Tint Opacity, with a 12-pixel bottom margin. -->
				<p class="option-label label-below">Tint Opacity :</p>
				<!-- AcrylicPage.xaml:195-205 — Slider, 200 wide, 0 through 1, step 0.001.
				     WD-039: changing Tint Opacity changes only the sample code; see docs/divergences.md -->
				<Slider class="option-slider" min={0} max={1} step={0.001} bind:value={tintOpacityLumin} />
				<!-- AcrylicPage.xaml:206 — TextBlock, Tint Luminosity Opacity, with a 12-pixel
				     bottom margin. -->
				<p class="option-label label-below">Tint Luminosity Opacity :</p>
				<!-- AcrylicPage.xaml:207-217 — Slider, 200 wide, 0 through 1, step 0.001.
				     WD-039: changing Tint Luminosity Opacity changes only the sample code; see
				     docs/divergences.md -->
				<Slider
					class="option-slider"
					min={0}
					max={1}
					step={0.001}
					bind:value={tintLuminosityOpacity}
				/>
			</div>
		{/snippet}
	</ControlExample>
</ItemPage>

<style>
	/* AcrylicPage.xaml:50-53 and :247-248 — Example1Grid, given Width 400 and Height 252 by
	   the WiderLayout state. Its children are a Grid and a Rectangle with no Grid.Row or
	   Grid.Column between them, so both occupy the one cell — which is what a XAML Grid does
	   with an unplaced child, and what grid-area: 1 / 1 does here. */
	.frame {
		display: grid;
	}

	/* AcrylicPage.xaml:50-53, :84-87 and :158-165 — each frame's overlapping children occupy
	   the first grid cell. The class on a page-owned div keeps the page scope; the classes
	   handed to Rectangle and Ellipse roots cross the component boundary and need :global below. */
	.frame > :global(*) {
		grid-area: 1 / 1;
	}

	/* AcrylicPage.xaml:247-248 — Example1Grid's WiderLayout size. */
	.frame-narrow {
		width: 400px;
		height: 252px;
	}

	/* AcrylicPage.xaml:84-87 and :158-165 — Example3Grid and Example4Grid have star and 252
	   columns, and WiderLayout gives them Width 652 and MinHeight 252 (:251-254). Neither
	   child names a Grid.Column, so both sit in column 0 and the 252 column is empty: the
	   panel is 400 - 24 = 376 wide, which is what the original measures. It is not a
	   transcription mistake to correct. */
	.frame-wide {
		grid-template-columns: 1fr 252px;
		width: 652px;
		min-height: 252px;
	}

	/* AcrylicPage.xaml:21-22 — CustomAcrylicInAppLuminosity's SkyBlue fallback, which is also
	   its TintColor. This custom property belongs to the page-owned frame and is inherited by
	   the Rectangle component through its fill value. */
	.frame-lumin {
		/* c1-allow: AcrylicPage.xaml:21-22 — CustomAcrylicInAppLuminosity's FallbackColor,
		   SkyBlue, which is also its TintColor. */
		--sample-skyblue: #87ceeb;
	}

	/* AcrylicPage.xaml:54-73, :88-107 and :166-185 — each inner Grid holds the three shapes
	   in one cell. */
	.shapes {
		display: grid;
		/* c1-allow: AcrylicPage.xaml:60 — the first Rectangle's Fill, Aqua. */
		--sample-aqua: #00ffff;
		/* c1-allow: AcrylicPage.xaml:66 — the Ellipse's Fill, Magenta. */
		--sample-magenta: #ff00ff;
		/* c1-allow: AcrylicPage.xaml:72 — the second Rectangle's Fill, Yellow. */
		--sample-yellow: #ffff00;
	}

	/* A class handed to a shape component lands on its SVG root without this file's scope hash.
	   These descendant selectors keep the global component classes inside this page's shape grid. */
	.shapes > :global(*) {
		grid-area: 1 / 1;
	}

	/* AcrylicPage.xaml:55-60 — the first Rectangle's size and alignments. */
	.shapes > :global(.aqua) {
		width: 100px;
		height: 200px;
		justify-self: start;
		align-self: start;
	}

	/* AcrylicPage.xaml:61-66 — the Ellipse's size and centered alignments. */
	.shapes > :global(.magenta) {
		width: 152px;
		height: 152px;
		justify-self: center;
		align-self: center;
	}

	/* AcrylicPage.xaml:67-72 — the second Rectangle's size and end alignments. */
	.shapes > :global(.yellow) {
		width: 80px;
		height: 100px;
		justify-self: end;
		align-self: end;
	}

	/* AcrylicPage.xaml:74, :108-111 and :186-189 — the Rectangle carrying the brush, at a
	   margin of 12 and stretched to what is left. SVG is a replaced grid item, so its default
	   normal alignment keeps its intrinsic 300 by 150 box; these explicit stretch values are
	   the web expression of XAML Rectangle's default Stretch alignment. */
	.frame > :global(.panel) {
		margin: 12px;
		justify-self: stretch;
		align-self: stretch;
	}

	/* AcrylicPage.xaml:115 and :193 — a StackPanel. A flex column and not a block, because
	   XAML's margins add where CSS's collapse, and every label below carries one. The
	   align-items value also keeps the ComboBoxes at their own width: DefaultComboBoxStyle
	   sets their HorizontalAlignment to Left at ComboBox_themeresources.xaml:376. */
	.options {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}

	/* AcrylicPage.xaml:116, :128, :138, :194 and :206 — reset the browser paragraph margin so
	   the source TextBlock margins below are the only spacing. */
	.option-label {
		margin: 0;
	}

	/* AcrylicPage.xaml:116, :194 and :206 — the labels whose source margin ends at the slider
	   below. */
	.label-below {
		margin-bottom: 12px;
	}

	/* AcrylicPage.xaml:128 and :138 — the labels whose source margin surrounds the control. */
	.label-around {
		margin: 12px 0;
	}

	/* AcrylicPage.xaml:119-120, :197-198 and :209-210 — all sliders are 200 wide and
	   explicitly left-aligned. A class handed to Slider crosses the component boundary, so
	   the descendant-scoped :global form reaches its root. */
	.options :global(.option-slider) {
		width: 200px;
	}

	/* AcrylicPage.xaml:27-35, especially :33 — ColorTemplate's horizontal StackPanel and its 4-pixel leading
	   margin on the printed Color value, expressed as a flex gap. */
	.color-item {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	/* AcrylicPage.xaml:29-32 — ColorTemplate's swatch is 20 by 20 and does not flex. */
	.swatch {
		width: 20px;
		height: 20px;
		flex: none;
	}

	/* The page-owned frame and option wrapper, plus the shape and Slider roots, carry no
	   padding or border of their own. The component-owned options pane is the one exception;
	   its border-box correction is recorded above. */
</style>
