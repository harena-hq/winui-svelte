<script lang="ts">
	import {
		Ellipse,
		Polygon,
		Rectangle,
		Slider,
		ToggleSwitch
	} from '@harena-hq/winui-svelte/preview';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/styles/shape');
	if (item === null) throw new Error('Shape page has no Gallery item');
	const ellipseSample = sampleOf('Shape/ShapeEllipse.txt');
	const rectangleSample = sampleOf('Shape/ShapeRectangle.txt');
	const polygonSample = sampleOf('Shape/ShapePolygon.txt');

	let ellipseHeight = $state(100);
	let ellipseWidth = $state(100);
	let ellipseStroke = $state(2);
	let rectHeight = $state(100);
	let rectWidth = $state(100);
	let rectStroke = $state(2);
	let rectRadiusY = $state(0);
	let rectRadiusX = $state(0);
	let polyStroke = $state(2);
	let showPoints = $state(false);

	// ShapePage.xaml:148-171 — Canvas.Left, Canvas.Top and the label each TextBlock carries.
	const POINTS = [
		{ text: 'Point #1: (10,100)', left: 0, top: 150 },
		{ text: 'Point #2: (60,40)', left: 50, top: 40 },
		{ text: 'Point #3: (200,40)', left: 200, top: 40 },
		{ text: 'Point #4: (250,100)', left: 240, top: 150 }
	];

	// ShapePage.xaml:35-56, :82-119, :185-190 — every Slider on the page carries
	// IsFocusEngagementEnabled="False" and SmallChange="1". Slider.svelte publishes a prop
	// for neither, both being keyboard and gamepad behaviours, and this unit adds none.
</script>

<ItemPage {item}>
	<div class="sample-colours">
		<ControlExample
			headerText={ellipseSample.header ?? undefined}
			xaml={ellipseSample.xaml ?? undefined}
			substitutions={{
				Slider1: String(ellipseHeight),
				Slider2: String(ellipseWidth),
				Slider3: String(ellipseStroke)
			}}
		>
			<!-- ShapePage.xaml:24-29 — Ellipse Width, Height, Fill, Stroke and StrokeThickness. -->
			<Ellipse
				fill="var(--sample-fill)"
				stroke="var(--sample-stroke)"
				strokeThickness={ellipseStroke}
				style="width: {ellipseWidth}px; height: {ellipseHeight}px"
			/>
			{#snippet options()}
				<div class="options">
					<!-- ShapePage.xaml:35-40 — Height Minimum="100" Maximum="150" StepFrequency="0.5". -->
					<Slider header="Height" min={100} max={150} step={0.5} bind:value={ellipseHeight} />
					<!-- ShapePage.xaml:43-48 — Width Minimum="100" Maximum="150" StepFrequency="0.5". -->
					<Slider header="Width" min={100} max={150} step={0.5} bind:value={ellipseWidth} />
					<!-- ShapePage.xaml:51-56 — Stroke Thickness Minimum="2" Maximum="10" StepFrequency="0.5". -->
					<Slider
						header="Stroke Thickness"
						min={2}
						max={10}
						step={0.5}
						bind:value={ellipseStroke}
					/>
				</div>
			{/snippet}
		</ControlExample>

		<ControlExample
			headerText={rectangleSample.header ?? undefined}
			xaml={rectangleSample.xaml ?? undefined}
			substitutions={{
				Slider1: String(rectHeight),
				Slider2: String(rectWidth),
				Slider3: String(rectStroke),
				Slider4: String(rectRadiusY),
				Slider5: String(rectRadiusX)
			}}
		>
			<!-- ShapePage.xaml:69-76 — Rectangle Width, Height, Fill, RadiusX, RadiusY, Stroke and StrokeThickness. -->
			<Rectangle
				fill="var(--sample-fill)"
				stroke="var(--sample-stroke)"
				strokeThickness={rectStroke}
				radiusX={rectRadiusX}
				radiusY={rectRadiusY}
				style="width: {rectWidth}px; height: {rectHeight}px"
			/>
			{#snippet options()}
				<div class="options">
					<!-- ShapePage.xaml:82-87 — Height Minimum="100" Maximum="150" StepFrequency="0.5". -->
					<Slider header="Height" min={100} max={150} step={0.5} bind:value={rectHeight} />
					<!-- ShapePage.xaml:90-95 — Width Minimum="100" Maximum="150" StepFrequency="0.5". -->
					<Slider header="Width" min={100} max={150} step={0.5} bind:value={rectWidth} />
					<!-- ShapePage.xaml:98-103 — Stroke Thickness Minimum="2" Maximum="10" StepFrequency="0.5". -->
					<Slider header="Stroke Thickness" min={2} max={10} step={0.5} bind:value={rectStroke} />
					<!-- ShapePage.xaml:106-111 — Radius Y Minimum="0" Maximum="100" StepFrequency="0.5". -->
					<Slider header="Radius Y" min={0} max={100} step={0.5} bind:value={rectRadiusY} />
					<!-- ShapePage.xaml:114-119 — Radius X Minimum="0" Maximum="100" StepFrequency="0.5". -->
					<Slider header="Radius X" min={0} max={100} step={0.5} bind:value={rectRadiusX} />
				</div>
			{/snippet}
		</ControlExample>

		<ControlExample
			headerText={polygonSample.header ?? undefined}
			xaml={polygonSample.xaml ?? undefined}
			substitutions={{ Slider1: String(polyStroke) }}
		>
			<!-- `ShapePage.xaml:137` — a Canvas, drawn here rather than exported. That is D30, not
			     an omission: the rule it sets is that a panel whose whole body would be one CSS
			     declaration per prop stays in the page, because a consumer already has the
			     browser's version of it. `Canvas.Left` is `left`, `Canvas.Top` is `top` and
			     `Canvas.ZIndex` is `z-index`; the Gallery's own Canvas page stays unscheduled. -->
			<div class="canvas">
				<div class="stack">
					<!-- ShapePage.xaml:139-146 — TextBlock Margin="0,0,0,15" and Polygon geometry. -->
					<span class="caption winui-BodyTextBlockStyle">
						A polygon is a connected series of lines that form a closed shape.
					</span>
					<Polygon
						fill="var(--sample-fill)"
						stroke="var(--sample-stroke)"
						strokeThickness={polyStroke}
						points="10,100 60,40 200,40 250,100"
					/>
				</div>
				{#if showPoints}
					{#each POINTS as point (point.text)}
						<span
							class="point winui-BodyTextBlockStyle"
							style="left: {point.left}px; top: {point.top}px">{point.text}</span
						>
					{/each}
				{/if}
			</div>
			{#snippet options()}
				<div class="options">
					<!-- ShapePage.xaml:179-182 — ToggleSwitch Header="Show points" IsOn="False". -->
					<ToggleSwitch header="Show points" bind:checked={showPoints} />
					<!-- ShapePage.xaml:185-190 — Stroke Thickness Minimum="2" Maximum="10" StepFrequency="0.5". -->
					<Slider header="Stroke Thickness" min={2} max={10} step={0.5} bind:value={polyStroke} />
				</div>
			{/snippet}
		</ControlExample>
	</div>
</ItemPage>

<style>
	/* The sample's own colours, not the theme's. A class handed to a component carries no
	   scope hash, so a wrapper this page owns is the channel it has: the two properties are
	   declared here and inherited into each shape, which reads them by name. `contents` keeps
	   the wrapper out of the box tree, so it declares and lays out nothing. */
	.sample-colours {
		display: contents;
		/* c1-allow: ShapePage.xaml:27, :72, :143 — every shape on the page is filled SteelBlue. */
		--sample-fill: #4682b4;
		/* c1-allow: ShapePage.xaml:28, :75, :145 — and stroked Black. */
		--sample-stroke: #000000;
	}

	/* `ShapePage.xaml:137` — Canvas Width="320" Height="200". A Canvas positions its children
	   absolutely and its own box is the size it is given; nothing about it needs a component,
	   which is what D30 says. It sets no Clip, so a child wider than 320 overflows and shows. */
	.canvas {
		position: relative;
		width: 320px;
		height: 200px;
	}

	/* A Canvas child with no Canvas.Left or Canvas.Top sits at the origin. */
	.stack {
		position: absolute;
		top: 0;
		left: 0;
		/* A Canvas measures its children with infinite available width, so the caption is one
		   line and runs past the Canvas's right edge — measured on the reference at about 402px
		   against the Canvas's 320. An absolutely positioned box shrink-wraps to its containing
		   block instead and would wrap the text at 320; `max-content` is the width XAML gives it. */
		width: max-content;
		/* StackPanel, Orientation="Vertical". A flex column also blockifies the Polygon's `<svg>`,
		   which is inline by default and would otherwise sit on a text baseline. */
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}

	/* `ShapePage.xaml:139` — the TextBlock's Margin="0,0,0,15". */
	.caption {
		margin-bottom: 15px;
	}

	/* `ShapePage.xaml:148-171` — each label is a Canvas child with its own Left and Top, and
	   Canvas.ZIndex="1" puts all four above the StackPanel. */
	.point {
		position: absolute;
		z-index: 1;
		/* `max-content` for the same reason `.stack` has it, and the fourth label is where the
		   two rules stop agreeing by accident. An absolutely positioned box shrink-wraps to
		   what is left of its containing block, so `Point #4` at `Canvas.Left="240"` gets 80 of
		   the Canvas's 320 and breaks across two lines — measured here at 80 by 32 against the
		   reference's 108 by 16, where it runs past the Canvas's right edge instead. A Canvas
		   measures every child with infinite available width, not just the first one. */
		width: max-content;
	}

	/* `ShapePage.xaml:32`, `:79`, `:178` — each options StackPanel is Width="220". */
	.options {
		display: flex;
		flex-direction: column;
		width: 220px;
	}
</style>
