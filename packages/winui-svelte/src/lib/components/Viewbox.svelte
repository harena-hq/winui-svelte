<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface ViewboxProps {
		/** Stretch. How the child is scaled to the box; Viewbox's default is Uniform. */
		stretch?: 'none' | 'fill' | 'uniform' | 'uniformToFill';
		/** StretchDirection. Whether the scale may exceed 1, fall below it, or both. */
		stretchDirection?: 'upOnly' | 'downOnly' | 'both';
		/** Child — the one element scaled, as the default snippet. */
		children?: Snippet;
		class?: string;
		style?: string;
		ref?: HTMLDivElement | null;
		[key: string]: unknown;
	}

	// Child is not a property: the default snippet is the child. The box's own size comes from
	// the caller through style (XAML's Width/Height). With no size it is the child's natural size
	// at scale 1; with one sized axis, this reproduction uses that axis's scale and leaves the
	// other at the child's own size, while XAML follows that scale on the free axis — WD-030,
	// docs/divergences.md.
</script>

<script lang="ts">
	let {
		stretch = 'uniform',
		stretchDirection = 'both',
		children,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: ViewboxProps = $props();

	let child: HTMLDivElement;
	// Initial scale 1 is the server and first-client paint; it briefly shows the natural child,
	// clipped to a smaller box, as the original does before measurement.
	let box = $state({ width: 0, height: 0 });
	let natural = $state({ width: 0, height: 0 });

	$effect(() => {
		const root = ref;
		if (!root || !child) return;
		const measure = () => {
			box = { width: root.clientWidth, height: root.clientHeight };
			// offsetWidth/offsetHeight report the untransformed layout box; getBoundingClientRect()
			// would include the scale and feed the measurement back into itself.
			natural = { width: child.offsetWidth, height: child.offsetHeight };
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(root);
		observer.observe(child);
		return () => observer.disconnect();
	});

	// CViewbox::ComputeScaleFactor (Viewbox.cpp:86-146) selects MIN for Uniform, MAX for
	// UniformToFill, preserves both axes for Fill, then clamps each axis for StretchDirection.
	// ArrangeOverride (:302-340) arranges the child at (0, 0), so the transformed layout clips
	// at the box instead of centring. Its unconstrained-axis behaviour (:99-108) is intentionally
	// not reproduced; see the interface comment.
	const scale = $derived.by(() => {
		const { width: bw, height: bh } = box;
		const { width: nw, height: nh } = natural;
		if (nw <= 0 || nh <= 0 || bw <= 0 || bh <= 0) return { x: 1, y: 1 };
		const sx = bw / nw;
		const sy = bh / nh;
		let x = 1;
		let y = 1;
		switch (stretch) {
			case 'none':
				break;
			case 'fill':
				x = sx;
				y = sy;
				break;
			case 'uniform':
				x = y = Math.min(sx, sy);
				break;
			case 'uniformToFill':
				x = y = Math.max(sx, sy);
				break;
		}
		if (stretchDirection === 'upOnly') {
			x = Math.max(x, 1);
			y = Math.max(y, 1);
		} else if (stretchDirection === 'downOnly') {
			x = Math.min(x, 1);
			y = Math.min(y, 1);
		}
		return { x, y };
	});
	const scaleX = $derived(scale.x);
	const scaleY = $derived(scale.y);
</script>

<div bind:this={ref} class={['root', className]} {style} {...rest}>
	<div bind:this={child} class="child" style:transform={`scale(${scaleX}, ${scaleY})`}>
		{@render children?.()}
	</div>
</div>

<style>
	/* The box clips — UniformToFill was measured on the original at 200×200 showing the left
	   200 of a 253-wide child — and the child is scaled from its top-left corner, not centred:
	   under Uniform at the same size a 200×158 child sat at the box's top edge. */
	.root {
		display: inline-block;
		overflow: hidden;
		vertical-align: top;
	}

	/* Laid out at its natural size and transformed; `max-content` is what keeps a block child
	   from taking the box's width before it is measured. */
	.child {
		display: block;
		width: max-content;
		transform-origin: 0 0;
	}
</style>
