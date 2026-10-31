<script lang="ts" module>
	export interface PathProps {
		/** Data. The XAML geometry mini-language string. */
		data?: string;
		/** Fill. The brush that paints the interior. */
		fill?: string;
		/** Stroke. The brush that paints the outline. */
		stroke?: string;
		/** StrokeThickness. The outline width. */
		strokeThickness?: number;
		class?: import('svelte/elements').ClassValue | null;
		style?: string | null;
		ref?: SVGSVGElement | null;
		[key: string]: unknown;
	}

	// Path defaults Stretch to None (core/inc/shape.h:119), so its box is the geometry's right and
	// bottom edges plus half the stroke — `ApplyContentStretch`, shape.cpp:1297-1298 — and the
	// paint is allowed outside that box, which XAML does not clip. `Polygon.svelte` gives the
	// argument in full. Where the other shapes get those edges from arithmetic over their points,
	// a path's are the tight bounds of its curves, which is why this one measures.
	//
	// FillRule belongs to the geometry in XAML — PathGeometry.FillRule, GeometryGroup.FillRule,
	// or the `F0`/`F1` token — so it arrives inside Data. A prop beside it would be a second
	// place to say the same thing.
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { readPathData } from '../internal/geometry';

	let {
		data = '',
		fill,
		stroke,
		strokeThickness = 1,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: PathProps = $props();

	const thickness = $derived(stroke === undefined ? 0 : Math.abs(strokeThickness));
	const pathData = $derived(readPathData(data));
	let geometry = $state<SVGPathElement | null>(null);
	let bounds = $state({ right: 0, bottom: 0 });
	const size = $derived({
		width: Math.max(0, bounds.right + thickness / 2),
		height: Math.max(0, bounds.bottom + thickness / 2)
	});
	// Private, and deliberately not `--winui-` prefixed: that prefix means a design token and
	// gate C9 walks every token a source file reads.
	const rootStyle = $derived(
		`--shape-stroke-thickness:${thickness}px;` +
			`width:${size.width}px;height:${size.height}px;${style ?? ''}`
	);

	// `getBBox()` returns the geometry's own bounds without the stroke, which is what
	// `ApplyContentStretch` reads, and it accounts for where a curve actually goes rather than
	// where its control points are. For the Gallery's own `M 10,100 C 100,25 300,250 400,75 H 200`
	// the cubic's y extremum is at t = 0.705213 and the bottom is 143.4074; `getBBox()` here
	// returns 143.406, and the hull of the control points would have said 250. So the browser is
	// within a hundredth of a pixel of the analytic answer and nowhere near the naive one.
	// Deriving it in script would be a second implementation of a computation the platform
	// already performs, and the two would disagree somewhere without saying so.
	//
	// Before the measurement lands — during server rendering, and for the first frame — the box is
	// wrong and the paint is right: `overflow: visible` means the geometry draws correctly either
	// way, and only what follows the Path in the layout moves when the number arrives.
	//
	// `untrack` around the compare-and-write, because the effect must depend on the geometry and
	// the two values that change it and on nothing else. Reading `bounds` here to decide whether
	// to write `bounds` makes the effect its own dependency; the guard would stop it looping, and
	// it would still run twice for every change. Two effects in this repository have been fixed
	// for reading their own writes — `tests/visual/theme-switch.spec.ts` and
	// `tests/visual/pane-expansion.spec.ts` each guard one — and this is the same shape.
	$effect(() => {
		void pathData.d;
		void thickness;
		if (geometry === null) return;
		const box = geometry.getBBox();
		const right = box.x + box.width;
		const bottom = box.y + box.height;
		untrack(() => {
			if (bounds.right !== right || bounds.bottom !== bottom) bounds = { right, bottom };
		});
	});
</script>

<svg bind:this={ref} class={className} style={rootStyle} {...rest}>
	<!-- An absent `fill` is `none`: SVG's default is black and XAML's is nothing. -->
	<path
		bind:this={geometry}
		class="geometry"
		d={pathData.d}
		fill={fill ?? 'none'}
		{stroke}
		fill-rule={pathData.fillRule === 'evenOdd' ? 'evenodd' : 'nonzero'}
	></path>
</svg>

<style>
	svg {
		/* The box is the geometry's positive extent and the paint is allowed past it. A UA gives an
		   outermost `<svg>` `overflow: hidden`. */
		overflow: visible;
	}

	.geometry {
		stroke-width: var(--shape-stroke-thickness);
		/* `Shape.StrokeMiterLimit` defaults to 10 (`DependencyProperty.cpp:722-725`) where SVG's
		   `stroke-miterlimit` defaults to 4; `Polygon.svelte` says what that decides. */
		stroke-miterlimit: 10;
	}
</style>
