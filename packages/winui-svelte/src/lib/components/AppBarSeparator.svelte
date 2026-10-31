<script lang="ts" module>
	export interface AppBarSeparatorProps {
		/** IsCompact, from `ICommandBarElement` — the bar's `ClosedDisplayMode` is `Compact`. */
		compact?: boolean;
		/** IsInOverflow, from `ICommandBarElement` — the separator is drawn across the overflow menu. */
		inOverflow?: boolean;
		class?: import('svelte/elements').ClassValue | null;
		style?: string | null;
		ref?: HTMLDivElement | null;
		[key: string]: unknown;
	}
</script>

<script lang="ts">
	import { getCommandBarState } from '../internal/command-bar';

	let {
		compact,
		inOverflow,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: AppBarSeparatorProps = $props();

	const bar = getCommandBarState();
	const isCompact = $derived(compact ?? bar?.().compact ?? false);
	const isInOverflow = $derived(inOverflow ?? bar?.().inOverflow ?? false);
	const viewState = $derived(isInOverflow ? 'overflow' : isCompact ? 'compact' : 'full-size');
</script>

<div
	bind:this={ref}
	role="separator"
	aria-orientation={isInOverflow ? 'horizontal' : 'vertical'}
	class={['root', className]}
	{style}
	data-view-state={viewState}
	{...rest}
>
	<span class="rule"></span>
</div>

<style>
	.root {
		display: flex;
	}

	.rule {
		display: block;
		align-self: stretch;
		width: var(--winui-AppBarSeparatorWidth);
		margin: var(--winui-AppBarSeparatorMargin);
		border-radius: var(--winui-AppBarSeparatorCornerRadius);
		background: var(--winui-AppBarSeparatorForeground);
	}

	.root[data-view-state='compact'] {
		height: var(--winui-AppBarThemeCompactHeight);
		align-self: flex-start;
	}

	.root[data-view-state='overflow'] {
		display: block;
		width: 100%;
	}

	.root[data-view-state='overflow'] .rule {
		width: auto;
		height: var(--winui-AppBarOverflowSeparatorHeight);
		margin: var(--winui-AppBarOverflowSeparatorMargin);
	}
</style>
