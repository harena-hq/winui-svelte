<script lang="ts" module>
	export interface PolygonProps {
		/** Fill. The brush that paints the polygon interior. */
		fill?: string;
		/** Stroke. The brush that paints the polygon outline. */
		stroke?: string;
		/** StrokeThickness. The outline width. */
		strokeThickness?: number;
		/** Points. The XAML point-list string. */
		points?: string;
		/** FillRule. The rule used for overlapping polygon regions. */
		fillRule?: 'evenOdd' | 'nonzero';
		class?: import('svelte/elements').ClassValue | null;
		style?: string | null;
		ref?: SVGSVGElement | null;
		[key: string]: unknown;
	}

	// Polygon defaults Stretch to None (core/inc/shape.h:119). Its desired size is the geometry's
	// right and bottom edges (shape.cpp:597-600), including any offset from the origin. Unlike
	// Fill shapes, it does not inset its coordinates; its size includes the stroke's right/bottom
	// overhang so the painted extent is preserved.
	//
	// **A `Stretch="None"` shape paints outside its own box on the top and the left, and XAML
	// does not clip it.** `ApplyContentStretch` gives the box `geometry.right + thickness/2` by
	// `geometry.bottom + thickness/2` (shape.cpp:1297-1298) while `GenerateGeometryBounds` puts
	// the render bounds' origin at `geometry.left - thickness/2`, `geometry.top - thickness/2`
	// — negative — and its own comment says layout clipping happens only where the geometry
	// passes the layout bounds *in positive space*. An `<svg>` root is `overflow: hidden` by
	// default, so the rule has to be written down here or a mitre over the origin is sliced
	// flat; it was, on this harness's own apex at `points="0,100 50,0 100,100"`.
</script>

<script lang="ts">
	let {
		fill,
		stroke,
		strokeThickness = 1,
		points = '',
		fillRule = 'evenOdd',
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: PolygonProps = $props();

	const thickness = $derived(stroke === undefined ? 0 : Math.abs(strokeThickness));
	const size = $derived.by(() => {
		const values = points
			.split(/[\s,]+/)
			.filter(Boolean)
			.map(Number);
		let maxX = 0;
		let maxY = 0;
		let hasPoint = false;
		for (let index = 0; index + 1 < values.length; index += 2) {
			const x = values[index];
			const y = values[index + 1];
			if (Number.isFinite(x) && Number.isFinite(y)) {
				hasPoint = true;
				maxX = Math.max(maxX, x);
				maxY = Math.max(maxY, y);
			}
		}
		if (!hasPoint) return { width: 0, height: 0 };
		return { width: maxX + thickness / 2, height: maxY + thickness / 2 };
	});
	// Private, and deliberately not `--winui-` prefixed: that prefix means a design token and
	// gate C9 walks every token a source file reads.
	const rootStyle = $derived(
		`--shape-stroke-thickness:${thickness}px;` +
			`width:${size.width}px;height:${size.height}px;${style ?? ''}`
	);
</script>

<svg bind:this={ref} class={className} style={rootStyle} {...rest}>
	<!-- An absent `fill` is `none`: SVG's default is black and XAML's is nothing. And SVG's
	     default fill rule is `nonzero` where Polygon's is EvenOdd (core/inc/polygon.h:12), which
	     shows only where the outline crosses itself. -->
	<polygon
		class="geometry"
		{points}
		fill={fill ?? 'none'}
		{stroke}
		fill-rule={fillRule === 'evenOdd' ? 'evenodd' : 'nonzero'}
	></polygon>
</svg>

<style>
	svg {
		/* The module comment's rule: the box is the geometry's positive extent and the paint is
		   allowed past it. A UA gives an outermost `<svg>` `overflow: hidden`. */
		overflow: visible;
	}

	.geometry {
		stroke-width: var(--shape-stroke-thickness);
		/* `Shape.StrokeMiterLimit` defaults to 10 — `DependencyProperty.cpp:722-725` — where
		   SVG's `stroke-miterlimit` defaults to 4. `StrokeLineJoin` and the two line caps need
		   no such line: XAML's defaults are Miter (`rendertypes.h:44`) and Flat, which are
		   already `miter` and `butt` in SVG. The limit is the one of the four that differs, and
		   it decides whether a join sharper than about 29 degrees comes to a point or is cut
		   square. */
		stroke-miterlimit: 10;
	}
</style>
