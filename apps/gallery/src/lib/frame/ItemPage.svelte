<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { GalleryItem } from '$lib/shell';

	export interface ItemPageProps {
		/** Item. The record's entry, passed through to the header. */
		item: GalleryItem;
		/** The page's samples. */
		children?: Snippet;
		class?: string;
		style?: string;
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}

	// `WideFrameContent` is not reproduced: it gives contentFrame Width="1028", but its state
	// has no triggers and no Gallery `GoToState` names it, so nothing enters that layout.
</script>

<script lang="ts">
	import PageHeader from './PageHeader.svelte';

	let {
		item,
		children,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: ItemPageProps = $props();
</script>

<!-- `data-item-page` is what the shell's page area looks for: this component carries
     ItemPage's own gutter, so the interim gutter v2 put on `.page` stands down for it. An
     attribute rather than a class, because a scoped class name is not addressable from
     another component's stylesheet. -->
<div bind:this={ref} data-item-page class={['root', className]} {style} {...rest}>
	<div class="header-slot"><PageHeader {item} /></div>
	<div class="content-root">
		{#if item.description}
			<p class="description winui-BodyTextBlockStyle">{item.description}</p>
		{/if}
		{@render children?.()}
	</div>
</div>

<style>
	.root {
		min-width: 0;
	}
	.header-slot {
		margin: 24px 36px 0;
	}
	.content-root {
		padding: 0 36px 36px;
	}
	.description {
		max-width: 1064px;
		margin: 4px 24px 0 0;
	}
	@media (width <= 640px) {
		/* Breakpoint640Plus is 641 in WinUIGallery/App.xaml:57. */
		.header-slot {
			margin: 12px 16px 0;
		}
		.content-root {
			padding: 0 16px 16px;
		}
	}
</style>
