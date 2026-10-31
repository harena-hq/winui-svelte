<script lang="ts" module>
	import type { Snippet } from 'svelte';
	export interface InlineUIContainerProps {
		/** Child is one UIElement; it carries its own formatting through the DOM cascade. */
		children?: Snippet;
		class?: import('svelte/elements').ClassValue | null;
		style?: string | null;
		ref?: HTMLSpanElement | null;
		[key: string]: unknown;
	}
</script>

<script lang="ts">
	let {
		children,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: InlineUIContainerProps = $props();
</script>

<span bind:this={ref} class={['root', className]} {style} {...rest}>{@render children?.()}</span>

<style>
	/* GetElementBaseline's else branch uses the child's own height, placing its bottom on the text
	   baseline. CSS uses that fallback for an inline-block whose computed overflow is not visible. */
	.root {
		display: inline-block;
		overflow: clip;
	}
</style>
