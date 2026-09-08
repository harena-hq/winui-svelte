<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface FlipViewItemProps {
		/** FlipViewItem.Content, the content property. */
		children?: Snippet;
		class?: string;
		style?: string;
		ref?: HTMLElement | null;
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
	}: FlipViewItemProps = $props();
</script>

<div bind:this={ref} class={['root', className]} {style} {...rest}>
	{@render children?.()}
</div>

<style>
	/* FlipViewItem_themeresources.xaml:15-21 — Background, HorizontalContentAlignment and
	   VerticalContentAlignment are Stretch. */
	.root {
		display: flex;
		flex: 0 0 100%; /* An item fills the viewport because the panel shows one at a time. */
		align-items: stretch;
		justify-content: stretch;
		background: var(--winui-FlipViewItemBackground);
	}
</style>
