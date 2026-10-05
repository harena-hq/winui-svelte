<script lang="ts">
	import { Line, Path, Polyline, Slider, ToggleSwitch } from 'winui-svelte/preview';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/styles/line');
	if (item === null) throw new Error('Line page has no Gallery item');
	const lineSample = sampleOf('Line/Line.txt');
	const polylineSample = sampleOf('Line/Polyline.txt');
	const pathSample = sampleOf('Line/LinePath.txt');
	const groupSample = sampleOf('Line/LineGeometrygroup.txt');

	let lineStartX = $state(0);
	let lineStartY = $state(0);
	let lineEndX = $state(200);
	let lineEndY = $state(0);
	let lineStroke = $state(5);
	let polylineStroke = $state(2);
	let polylineShowPoints = $state(false);
	let pathStroke = $state(2);
	let pathShowPoints = $state(false);
	let groupRadiusX = $state(30);
	let groupRadiusY = $state(30);

	// LinePage.xaml:109-132 — Canvas.Left, Canvas.Top and the label each TextBlock carries.
	const POLYLINE_POINTS = [
		{ text: 'Point #1: (10,100)', left: 0, top: 140 },
		{ text: 'Point #2: (60,40)', left: 50, top: 40 },
		{ text: 'Point #3: (200,40)', left: 200, top: 40 },
		{ text: 'Point #4: (250,100)', left: 240, top: 140 }
	];

	// LinePage.xaml:172-201 — the same, for the Path example's five.
	const PATH_POINTS = [
		{ text: 'Point #1: (10,100)', left: 0, top: 130 },
		{ text: 'Point #2: (100,25)', left: 40, top: 75 },
		{ text: 'Point #3: (300,250)', left: 280, top: 175 },
		{ text: 'Point #4: (400,75)', left: 360, top: 60 },
		{ text: 'Point #5: (200,75)', left: 170, top: 60 }
	];

	// LinePage.xaml:239-246 — the GeometryGroup, composed here as one Path.Data string.
	// D35: a Geometry is a value rather than an element, so the library publishes no builders
	// for one and the page writes the string; commit 8af919c records the decision.
	//
	// FillRule="EvenOdd" is the leading F0 token — readPathData takes it off the front and puts
	// it on the element as fill-rule, which is the only difference between XAML's path
	// mini-language and SVG's d. It is what makes the overlap of the ellipse and the rectangle
	// come out empty rather than filled.
	//
	// LineGeometry StartPoint="10,10" EndPoint="50,30" (:240) is M 10,10 L 50,30: an open
	// subpath, so it strokes and encloses nothing to fill.
	// RectangleGeometry Rect="30,55 100 30" (:245) is x 30, y 55, 100 wide, 30 tall.
	// EllipseGeometry Center="40,70" (:241-244) has no SVG command of its own: an ellipse is
	// two half-arcs, from one end of the horizontal diameter to the other and back. That is the
	// one line here worth the note.
	const geometryGroup = $derived(
		'F0 M 10,10 L 50,30' +
			` M ${40 - groupRadiusX},70 A ${groupRadiusX},${groupRadiusY} 0 1 0 ${40 + groupRadiusX},70` +
			` A ${groupRadiusX},${groupRadiusY} 0 1 0 ${40 - groupRadiusX},70 Z` +
			' M 30,55 H 130 V 85 H 30 Z'
	);

	// LinePage.xaml:40-79, :141-148, :210-217, :254-269 — every Slider on the page carries
	// IsFocusEngagementEnabled="False" and SmallChange="1". Slider.svelte publishes a prop for
	// neither, both being keyboard and gamepad behaviours, and this unit adds none.
</script>

<ItemPage {item}>
	<div class="sample-colours">
		<ControlExample
			headerText={lineSample.header ?? undefined}
			xaml={lineSample.xaml ?? undefined}
			substitutions={{
				Slider1: String(lineStartX),
				Slider2: String(lineStartY),
				Slider3: String(lineEndX),
				Slider4: String(lineEndY),
				Slider5: String(lineStroke)
			}}
		>
			<!-- LinePage.xaml:26-34 — the Canvas holds the Line and nothing else, at
			     Canvas.Top="50" and with no Canvas.Left. That goes through the style prop rather
			     than a class, because a class handed to a component lands on its root without
			     this page's scope hash and would match nothing; Line.svelte appends style after
			     its own declarations, so it wins. Positioning it absolutely also blockifies the
			     SVG, which is why this one shape needs no flex wrapper. -->
			<div class="canvas canvas-line">
				<Line
					stroke="var(--sample-line-stroke)"
					strokeThickness={lineStroke}
					x1={lineStartX}
					y1={lineStartY}
					x2={lineEndX}
					y2={lineEndY}
					style="position: absolute; top: 50px; left: 0"
				/>
			</div>
			{#snippet options()}
				<div class="options">
					<!-- LinePage.xaml:40-47 — Start point X Minimum="0" Maximum="100" StepFrequency="0.5". -->
					<Slider header="Start point X" min={0} max={100} step={0.5} bind:value={lineStartX} />
					<!-- LinePage.xaml:48-55 — Start point Y Minimum="0" Maximum="100" StepFrequency="0.5". -->
					<Slider header="Start point Y" min={0} max={100} step={0.5} bind:value={lineStartY} />
					<!-- LinePage.xaml:56-63 — End point X Minimum="200" Maximum="300" StepFrequency="0.5". -->
					<Slider header="End point X" min={200} max={300} step={0.5} bind:value={lineEndX} />
					<!-- LinePage.xaml:64-71 — End point Y Minimum="0" Maximum="100" StepFrequency="0.5". -->
					<Slider header="End point Y" min={0} max={100} step={0.5} bind:value={lineEndY} />
					<!-- LinePage.xaml:72-79 — Stroke Thickness Minimum="5" Maximum="10" StepFrequency="0.5". -->
					<Slider header="Stroke Thickness" min={5} max={10} step={0.5} bind:value={lineStroke} />
				</div>
			{/snippet}
		</ControlExample>

		<ControlExample
			headerText={polylineSample.header ?? undefined}
			xaml={polylineSample.xaml ?? undefined}
			substitutions={{ Slider1: String(polylineStroke) }}
		>
			<!-- LinePage.xaml:97-132 — the StackPanel sample and its Canvas child labels. -->
			<div class="canvas canvas-polyline">
				<div class="stack">
					<!-- LinePage.xaml:99 — TextBlock Margin="0,0,0,10". -->
					<span class="caption-lines winui-BodyTextBlockStyle">
						Draws a series of connected straight lines.
					</span>
					<!-- LinePage.xaml:102-106 — the Polyline's Points, Stroke and StrokeThickness.
					     Canvas.ZIndex="0" on it is inert in the original too: it is a StackPanel child and
					     not a Canvas child, so no Canvas attached property on it is read by anything. -->
					<Polyline
						stroke="var(--sample-stroke)"
						strokeThickness={polylineStroke}
						points="10,100 60,40 200,40 250,100"
					/>
				</div>
				{#if polylineShowPoints}
					{#each POLYLINE_POINTS as point (point.text)}
						<span
							class="point winui-BodyTextBlockStyle"
							style="left: {point.left}px; top: {point.top}px">{point.text}</span
						>
					{/each}
				{/if}
			</div>
			{#snippet options()}
				<div class="options">
					<!-- LinePage.xaml:137-140 — ToggleSwitch Header="Show points" IsOn="False". -->
					<ToggleSwitch header="Show points" bind:checked={polylineShowPoints} />
					<!-- LinePage.xaml:141-148 — Stroke Thickness Minimum="2" Maximum="10" StepFrequency="0.5". -->
					<Slider
						header="Stroke Thickness"
						min={2}
						max={10}
						step={0.5}
						bind:value={polylineStroke}
					/>
				</div>
			{/snippet}
		</ControlExample>

		<ControlExample
			headerText={pathSample.header ?? undefined}
			xaml={pathSample.xaml ?? undefined}
			substitutions={{ Slider1: String(pathStroke) }}
		>
			<!-- LinePage.xaml:161-201 — the StackPanel sample and its Canvas child labels. -->
			<div class="canvas canvas-path">
				<div class="stack">
					<!-- LinePage.xaml:163 carries no Margin, so this caption deliberately has no margin class. -->
					<span class="winui-BodyTextBlockStyle">Draws a series of connected lines and curves.</span
					>
					<!-- LinePage.xaml:166-169 — the Path's Data, Stroke and StrokeThickness. -->
					<Path
						data="M 10,100 C 100,25 300,250 400,75 H 200"
						stroke="var(--sample-curve-stroke)"
						strokeThickness={pathStroke}
					/>
				</div>
				{#if pathShowPoints}
					{#each PATH_POINTS as point (point.text)}
						<span
							class="point winui-BodyTextBlockStyle"
							style="left: {point.left}px; top: {point.top}px">{point.text}</span
						>
					{/each}
				{/if}
			</div>
			{#snippet options()}
				<div class="options">
					<!-- LinePage.xaml:206-209 — ToggleSwitch Header="Show points" IsOn="False". -->
					<ToggleSwitch header="Show points" bind:checked={pathShowPoints} />
					<!-- LinePage.xaml:210-217 — Stroke Thickness Minimum="2" Maximum="10" StepFrequency="0.5". -->
					<Slider header="Stroke Thickness" min={2} max={10} step={0.5} bind:value={pathStroke} />
				</div>
			{/snippet}
		</ControlExample>

		<ControlExample
			headerText={groupSample.header ?? undefined}
			xaml={groupSample.xaml ?? undefined}
			substitutions={{ Slider1: String(groupRadiusX), Slider2: String(groupRadiusY) }}
		>
			<!-- LinePage.xaml:228-250 — the GeometryGroup StackPanel sample. -->
			<div class="canvas canvas-group">
				<div class="stack">
					<!-- LinePage.xaml:230 — TextBlock Margin="0,0,0,15". -->
					<span class="caption-group winui-BodyTextBlockStyle">
						Composite geometry objects can be created using a GeometryGroup.
					</span>
					<!-- LinePage.xaml:233-236 — the Path's Fill, its Stroke and StrokeThickness="4". The
					     two brushes are named where they are declared in the page's style block and are not
					     written out here: C1's markup pass reads a quoted presentation attribute wherever
					     one appears, and it does not skip comments. -->
					<Path
						data={geometryGroup}
						fill="var(--sample-group-fill)"
						stroke="var(--sample-stroke)"
						strokeThickness={4}
					/>
				</div>
			</div>
			{#snippet options()}
				<div class="options">
					<!-- LinePage.xaml:254-261 — RadiusX Minimum="30" Maximum="40" StepFrequency="0.5". -->
					<Slider header="RadiusX" min={30} max={40} step={0.5} bind:value={groupRadiusX} />
					<!-- LinePage.xaml:262-269 — RadiusY Minimum="30" Maximum="50" StepFrequency="0.5". -->
					<Slider header="RadiusY" min={30} max={50} step={0.5} bind:value={groupRadiusY} />
				</div>
			{/snippet}
		</ControlExample>
	</div>
</ItemPage>

<style>
	/* The sample's own colours, not the theme's. A class handed to a component carries no
	   scope hash, so a wrapper this page owns is the channel it has: the properties are
	   declared here and inherited into each shape, which reads them by name. `contents` keeps
	   the wrapper out of the box tree, so it declares and lays out nothing. */
	.sample-colours {
		display: contents;
		/* c1-allow: LinePage.xaml:29 — the Line example is stroked SteelBlue. */
		--sample-line-stroke: #4682b4;
		/* c1-allow: LinePage.xaml:105, :235 — the Polyline and the GeometryGroup are stroked Black. */
		--sample-stroke: #000000;
		/* c1-allow: LinePage.xaml:168 — the Path example is stroked DarkGoldenRod. */
		--sample-curve-stroke: #b8860b;
		/* c1-allow: LinePage.xaml:234 — and the GeometryGroup is the only shape here with a Fill. */
		--sample-group-fill: #ccccff;
	}

	/* A Canvas positions its children absolutely and its own box is the size it is given. It
	   sets no Clip, so a child wider than the box overflows and shows — which is what three of
	   the four examples do. D30 and the Shape page's comment say why this is CSS and not a
	   component. */
	.canvas {
		position: relative;
	}

	/* LinePage.xaml:26 — Canvas Width="100" Height="200". */
	.canvas-line {
		width: 100px;
		height: 200px;
	}

	/* LinePage.xaml:97 — Canvas Width="320" Height="170". */
	.canvas-polyline {
		width: 320px;
		height: 170px;
	}

	/* LinePage.xaml:161 — Canvas Width="320" Height="200". */
	.canvas-path {
		width: 320px;
		height: 200px;
	}

	/* LinePage.xaml:228 — Canvas Width="100" Height="170". */
	.canvas-group {
		width: 100px;
		height: 170px;
	}

	/* A Canvas child with no Canvas.Left or Canvas.Top sits at the origin. */
	.stack {
		position: absolute;
		top: 0;
		left: 0;
		/* A Canvas measures its children with infinite available width, so a caption is one line
		   and may run past the Canvas's right edge. An absolutely positioned box shrink-wraps to
		   its containing block instead and would wrap the text; `max-content` is the width XAML
		   gives it. */
		width: max-content;
		/* StackPanel, Orientation="Vertical". A flex column also blockifies the shape's SVG,
		   which is inline by default and would otherwise sit on a text baseline. */
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}

	/* LinePage.xaml:99 — TextBlock Margin="0,0,0,10". */
	.caption-lines {
		margin-bottom: 10px;
	}

	/* LinePage.xaml:230 — TextBlock Margin="0,0,0,15". */
	.caption-group {
		margin-bottom: 15px;
	}

	/* LinePage.xaml:109-132, :172-201 — each label is a Canvas child with its own Left and
	   Top, and Canvas.ZIndex="1" puts them above the StackPanel. */
	.point {
		position: absolute;
		z-index: 1;
		/* max-content for the same reason .stack has it, and this page is where the two rules
		   stop agreeing by accident: an absolutely positioned box shrink-wraps to what is left of
		   its containing block, and Point #4: (400,75) at Canvas.Left="360" has nothing left of a
		   320-wide Canvas at all. A Canvas measures every child with infinite available width, not
		   just the first one. */
		width: max-content;
	}

	/* LinePage.xaml:39, :136, :205, :253 — each options StackPanel is Width="220". */
	.options {
		display: flex;
		flex-direction: column;
		width: 220px;
	}
</style>
