<script lang="ts" module>
	import type { Snippet } from 'svelte';

	/*
	 * ItemsRepeater draws no chrome and reads no token: laying out caller-drawn items is the
	 * whole control. `ItemsRepeater.Background` is deliberately absent because `class` and
	 * `style` are D21's escape hatch, and the token cascade already covers the rest; a
	 * `background` prop would be a second way to say one thing. WD-026: virtualisation is
	 * absent; see docs/divergences.md. `HorizontalCacheLength` and `VerticalCacheLength` are
	 * virtualisation buffers; `ElementPrepared`, `ElementClearing`, and `ElementIndexChanged`
	 * are its lifecycle; and `GetElementIndex`, `TryGetElement`, and `GetOrCreateElement` are
	 * imperative access to realized elements, so none are carried. `ItemTransitionProvider` is
	 * animation, which the roadmap's Motion tranche owns.
	 */

	/** StackLayout. */
	export interface StackLayoutOptions {
		/** Not a WinUI member: identifies the upstream `StackLayout` class. */
		kind: 'stack';
		/** StackLayout.Orientation. Defaults to `Vertical`. */
		orientation?: 'vertical' | 'horizontal';
		/** StackLayout.Spacing. Defaults to `0.0`. */
		spacing?: number;
	}

	/** ItemsRepeater.Layout. `UniformGridLayout` joins this union in the next unit. */
	export type ItemsRepeaterLayout = StackLayoutOptions;

	/** ItemsRepeater. */
	export interface ItemsRepeaterProps<T> {
		/** ItemsRepeater.ItemsSource, deliberately named `items` by ADR 0013. */
		items: T[];
		/** ItemsRepeater.ItemTemplate. */
		itemTemplate: Snippet<[T, number]>;
		/** No WinUI member: Svelte identity for DOM reuse. */
		key?: (item: T, index: number) => string | number;
		/** ItemsRepeater.Layout. An omitted layout is the default `StackLayout`. */
		layout?: ItemsRepeaterLayout;
		class?: string;
		style?: string;
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}
</script>

<script lang="ts" generics="T">
	let {
		items,
		itemTemplate,
		key,
		layout,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: ItemsRepeaterProps<T> = $props();

	const orientation = $derived(layout?.orientation ?? 'vertical');
	const spacing = $derived(layout?.spacing ?? 0);
</script>

<div
	bind:this={ref}
	class={['root', className]}
	{style}
	style:gap="{spacing}px"
	data-orientation={orientation}
	{...rest}
>
	{#each items as entry, index (key ? key(entry, index) : index)}
		{@render itemTemplate(entry, index)}
	{/each}
</div>

<style>
	.root {
		display: flex;
	}

	.root[data-orientation='vertical'] {
		flex-direction: column;
	}

	.root[data-orientation='horizontal'] {
		flex-direction: row;
	}
</style>
