<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface RadioButtonsProps {
		/** Header. Rendered above the items, as a snippet or a string. */
		header?: Snippet | string;
		/** MaxColumns. How many columns the items fill, column-major; defaults to 1 (RadioButtons.idl:24). */
		maxColumns?: number;
		/** IsEnabled, inverted to the HTML attribute — ADR 0009. Dims the header; the children carry their own. */
		disabled?: boolean;
		/** Items — the `RadioButton`s the caller writes, as the default snippet. Give them one `name`. */
		children?: Snippet;
		class?: string;
		style?: string;
		ref?: HTMLDivElement | null;
		[key: string]: unknown;
	}

	// This container does not take ItemsSource, object Items, ItemTemplate, SelectedIndex,
	// SelectedItem, SelectionChanged, or ContainerFromIndex: v3 chose RadioButton's native
	// `name`/`group` selection instead. HeaderTemplate is unnecessary because a snippet is the
	// template. WinUI propagates IsEnabled through its framework; a Svelte parent cannot do that
	// to snippet components, so disabled here only dims the template header and callers disable
	// each child themselves.
</script>

<script lang="ts">
	let {
		header,
		maxColumns = 1,
		disabled = false,
		children,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: RadioButtonsProps = $props();

	let items: HTMLDivElement;
	let count = $state(0);

	const validatedMaxColumns = $derived.by(() => {
		if (maxColumns < 1) throw new Error('maxColumns must be greater than zero');
		return maxColumns;
	});
	const columns = $derived(Math.max(1, Math.min(validatedMaxColumns, Math.max(count, 1))));
	const rows = $derived(Math.max(1, Math.ceil(Math.max(count, 1) / columns)));

	$effect(() => {
		count = items.children.length;
		const observer = new MutationObserver(() => {
			count = items.children.length;
		});
		observer.observe(items, { childList: true });

		return () => observer.disconnect();
	});
</script>

<div
	bind:this={ref}
	class={['root', className]}
	{style}
	data-disabled={disabled || undefined}
	{...rest}
>
	{#if header !== undefined}
		<span class="header winui-BodyTextBlockStyle">
			{#if typeof header === 'string'}{header}{:else}{@render header()}{/if}
		</span>
	{/if}
	<div
		bind:this={items}
		class="items"
		style:--columns={columns}
		style:--rows={rows}
		data-counted={count > 0 || undefined}
	>
		{@render children?.()}
	</div>
</div>

<style>
	.root {
		display: flex;
		flex-direction: column;
	}

	.header {
		margin: var(--winui-RadioButtonsTopHeaderMargin);
		color: var(--winui-RadioButtonsHeaderForeground);
		white-space: normal;
	}

	.root[data-disabled] .header {
		color: var(--winui-RadioButtonsHeaderForegroundDisabled);
	}

	/* `ColumnMajorUniformToLargestGridLayout` arranges every item in a cell the size of the
	   largest one (ColumnMajorUniformToLargestGridLayout.cpp:16-42, :48-95), and `1fr` tracks
	   on a shrink-wrapped grid resolve to exactly that. Shrink-wrapped is the condition: as a
	   flex item the grid would stretch to the root's width and the tracks would split that
	   instead, so it opts out of the column's stretch. */
	.items {
		display: inline-grid;
		align-self: flex-start;
		grid-auto-flow: column;
		grid-template-columns: repeat(var(--columns), 1fr);
		grid-template-rows: repeat(var(--rows), 1fr);
		column-gap: var(--winui-RadioButtonsColumnSpacing);
		row-gap: var(--winui-RadioButtonsRowSpacing);
	}

	/* Before the DOM count arrives, column flow would make one implicit column per child.
	   The default one-column layout is safe because uniform implicit rows match it exactly. */
	.items:not([data-counted]) {
		grid-auto-flow: row;
		grid-template-columns: 1fr;
		grid-auto-rows: 1fr;
	}
</style>
