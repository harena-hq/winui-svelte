<script lang="ts" module>
	export interface NotApplicablePanelProps {
		/** The element the original draws in this slot. */
		element: string;
		/** One sentence: what is not drawn here, and what withholds it. */
		reason: string;
		/** The divergence row carrying the long form — `'WD-063'`. */
		row: string;
		/** The height of the original's slot, in pixels, so the page keeps the shape the original has. */
		height?: number;
		class?: string;
		style?: string;
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}

	// The panel paints no surface of its own. The original MapControl slot is a white rectangle,
	// and reproducing one would assert that something renders there. Its height keeps the page's
	// shape; its emptiness is the honest part. The row number is text, not a link: the Gallery is
	// a static site and `docs/` is not served from it.
</script>

<script lang="ts">
	import { InfoBar } from '@harena-hq/winui-svelte/preview';

	let {
		element,
		reason,
		row,
		height,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: NotApplicablePanelProps = $props();

	const rootStyle = $derived(
		height === undefined ? style : `${style ? `${style}; ` : ''}height: ${height}px`
	);
</script>

<div bind:this={ref} class={['root', className]} style={rootStyle} {...rest}>
	<InfoBar
		severity="informational"
		closable={false}
		title={element}
		message={`${reason} (${row})`}
	/>
</div>

<style>
	.root {
		/* The slot the declined element would occupy. The notice sits at its top; the rest of the
		   slot is empty, which is the point. */
		display: grid;
		align-content: start;
	}
</style>
