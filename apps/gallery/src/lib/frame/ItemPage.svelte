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
	import { afterNavigate } from '$app/navigation';
	import { ScrollViewer } from 'winui-svelte/preview';
	import PageHeader from './PageHeader.svelte';
	import { lastInputWasKeyboard } from './last-input';
	import { takeReselect } from './reselect';

	let {
		item,
		children,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: ItemPageProps = $props();

	const TAB_STOP = 'a[href], button, input, select, textarea, [tabindex]';

	// The page focuses itself once loaded, as the original's does
	// (`this.Focus(FocusState.Programmatic)`, ItemPage.xaml.cs:44). A page that is not a tab stop
	// hands that focus to its first descendant that is (`CFocusManager::SetFocusedElement`,
	// dxaml/xcp/core/dll/focusmgr.cpp:122-124), which here is the header's first button. That is
	// taken in document order, where upstream's is tab order; no element in this page carries a
	// positive `tabindex`, so the two agree.
	// Measured on the reference on 2026-10-24: a page chosen with Enter in the rail's flyout left
	// focus on that button with its focus visual, and one chosen with the pointer from the search
	// box's suggestions drew none. The visual is asked for or declined by the last input
	// (`last-input.ts`), because Chromium's own choice for a scripted `focus()` differs from
	// upstream's after that typing and before any input.
	//
	// On the first load as well: upstream's launch into a page, by protocol or a jump-list
	// argument, loads an `ItemPage` too (App.xaml.cs:119-162), and with no input yet the focus is
	// drawn as a pointer's. Each navigation after it runs after SvelteKit's own focus handling,
	// which blurs whatever had focus before the update and then focuses the body unless something
	// else took focus (`reset_focus`); `afterNavigate` callbacks run after both.
	//
	// Not when the selected row is invoked again, which upstream loads no page for; the shell
	// still goes to the page shown, and says so (`reselect.ts`).
	afterNavigate((navigation) => {
		if (takeReselect(navigation.to?.url.pathname) || !ref) return;
		const first = [...ref.querySelectorAll<HTMLElement>(TAB_STOP)].find(
			(element) =>
				element.tabIndex >= 0 &&
				!element.matches(':disabled') &&
				!element.closest('[inert]') &&
				element.checkVisibility({ visibilityProperty: true })
		);
		first?.focus({ preventScroll: true, focusVisible: lastInputWasKeyboard() });
	});
</script>

<!-- `data-item-page` is how the tests find an item page's content. An attribute rather than a
     class, because a scoped class name is not addressable from another component's
     stylesheet. -->
<!-- The header is the page's first row and the content region its second, which is the one
     that scrolls (ItemPage.xaml:32-47): the header stays where it is as the samples scroll,
     and the region's bars start below it. -->
<div bind:this={ref} data-item-page class={['root', className]} {style} {...rest}>
	<div class="header-slot"><PageHeader {item} /></div>
	<!-- `svPanel`, `VerticalScrollBarVisibility="Auto"` (ItemPage.xaml:43-47). -->
	<ScrollViewer class="page-scroller" verticalScrollBarVisibility="auto">
		<div class="content-root">
			{#if item.description}
				<p class="description winui-BodyTextBlockStyle">{item.description}</p>
			{/if}
			{@render children?.()}
		</div>
	</ScrollViewer>
</div>

<style>
	/* `rootPanel`'s two rows, `Auto` and `*` (ItemPage.xaml:32-36), in the height the shell's
	   page area gives as a flex item of it. Not `height: 100%`: a harness that lays several
	   pages out in one scrolling block would give each a viewport's height. There its `flex` has
	   no effect and the region is as tall as what it holds; the header's margin does not
	   collapse with what is above it either way, as XAML margins never do. */
	.root {
		display: flex;
		flex: 1 1 auto;
		flex-direction: column;
		min-width: 0;
		min-height: 0;
	}
	.header-slot {
		flex: none;
		margin: 24px 36px 0;
	}
	.root > :global(.page-scroller) {
		flex: 1 1 auto;
		min-height: 0;
	}
	/* A formatting-context root, so the description's `Margin="0,4,24,0"` adds to the 12 the
	   page header's button row carries below itself (PageHeader.xaml, the row 1 Grid's
	   `Margin="0,12,0,12"`) the way XAML margins add. As plain blocks the two collapsed to 12
	   and the description sat 4px too high — measured on the Border page. */
	.content-root {
		display: flow-root;
		padding: 0 36px 36px;
	}
	/* `pre-wrap`, because the description is a TextBlock's `Text` (ItemPage.xaml:53-61): a line
	   feed in the string is a line break there, and spaces are not collapsed. Three of the
	   record's descriptions carry line feeds — ProgressBar's, ProgressRing's and AppBarButton's —
	   and run together as one paragraph without it. */
	.description {
		max-width: 1064px;
		margin: 4px 24px 0 0;
		white-space: pre-wrap;
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
