<script lang="ts" module>
	export interface AppBarSeparatorProps {
		/** IsCompact, from `ICommandBarElement` — the bar's `ClosedDisplayMode` is `Compact`. */
		compact?: boolean;
		/** IsInOverflow, from `ICommandBarElement` — the separator is drawn across the overflow menu. */
		inOverflow?: boolean;
		class?: string;
		style?: string;
		ref?: HTMLDivElement | null;
		[key: string]: unknown;
	}
</script>

<script lang="ts">
	let {
		compact = false,
		inOverflow = false,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: AppBarSeparatorProps = $props();

	let viewState = $derived(inOverflow ? 'overflow' : compact ? 'compact' : 'full-size');
</script>

<div
	bind:this={ref}
	role="separator"
	aria-orientation={inOverflow ? 'horizontal' : 'vertical'}
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
