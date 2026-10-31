<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface MenuBarProps {
		/** Items — the `MenuBarItem`s, as the default snippet. */
		children?: Snippet;
		/** No WinUI member: which item's menu is open, by its `value`. `MenuBar` holds exactly one
		 * such flag upstream (`MenuBar.cpp`'s `IsFlyoutOpen`); this is the same flag with the
		 * open item's identity in it. Empty string is "none open". */
		open?: string;
		/** No WinUI member: ADR 0009 pairs every `$bindable` prop with its own change callback. */
		onOpenChange?: (open: string) => void;
		class?: import('svelte/elements').ClassValue | null;
		style?: string | null;
		ref?: HTMLDivElement | null;
		[key: string]: unknown;
	}
</script>

<script lang="ts">
	import { Menubar } from 'bits-ui';

	let {
		children,
		open = $bindable(''),
		onOpenChange,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: MenuBarProps = $props();
</script>

<Menubar.Root
	bind:value={
		() => open,
		(next) => {
			open = next;
			onOpenChange?.(next);
		}
	}
>
	{#snippet child({ props })}
		<div
			{...props}
			bind:this={ref}
			class={['root', 'winui-BodyTextBlockStyle', className]}
			{style}
			{...rest}
		>
			{@render children?.()}
		</div>
	{/snippet}
</Menubar.Root>

<style>
	.root {
		display: flex;
		flex-direction: row;
		/* MenuBar.xaml:13, `ContentRoot` has `HorizontalAlignment="Left"`. */
		justify-content: flex-start;
		/* MenuBar.xaml:13, `ContentRoot` has `VerticalAlignment="Stretch"`. */
		align-items: stretch;
		min-height: var(--winui-MenuBarHeight);
		background: var(--winui-MenuBarBackground);
		color: var(--winui-MenuBarItemForeground);
	}
</style>
