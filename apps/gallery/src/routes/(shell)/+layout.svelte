<script lang="ts">
	import { afterNavigate, goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { NavigationView, TitleBar } from 'winui-svelte';
	import SearchBox from '$lib/SearchBox.svelte';
	import { QUERY_GLYPH, ancestorsOf, isContainer, menu, titleBar } from '$lib/shell';

	let { children } = $props();

	// `selected` is the row the pane highlights; derived from the URL, so the back and
	// forward buttons stay coherent without a binding. `'settings'` is the id
	// NavigationView reserves for the row it renders itself — every other row's id is
	// already a path.
	// A row that opens rather than goes still takes the pane's selection: `SelectsOnInvoked`
	// defaults to true and `OnNavigationViewItemInvoked` updates the selection model —
	// NavigationView.cpp:1044 — so the original leaves the shade on the section you opened
	// while the page stays where it was. The URL cannot express that, so it is held here
	// and cleared by the next navigation.
	let openedContainer = $state<string | null>(null);
	const selected = $derived(
		openedContainer ?? (page.url.pathname === '/settings' ? 'settings' : page.url.pathname)
	);

	// `resolve` rather than a bare string because `svelte/no-navigation-without-resolve`
	// says so, and it is right: the day this app is served under a base path, this is
	// where it learns about it. Its parameter accepts any absolute pathname, which every
	// id but the reserved `'settings'` is — the assertion states that and nothing more.
	function go(id: string) {
		// Only the three special sections open without going. A control group has children
		// and a page of its own, and the original navigates to it.
		if (id !== 'settings' && isContainer(id)) {
			openedContainer = id;
			return;
		}
		openedContainer = null;
		void goto(resolve(id === 'settings' ? '/settings' : (id as `/${string}`)));
	}

	// The pane's open set, kept in place across navigations. Seeding with the ancestors
	// of the current path is what makes a deep link land with the right branch open.
	//
	// Add only, never remove: a user who has collapsed a branch has said something, and
	// an effect that also removed would undo it on the next navigation.
	//
	// The `includes` guard is not optional: assigning unconditionally inside an effect
	// that reads `expandedItems` makes the effect re-run on its own write.
	let expandedItems = $state<string[]>([]);
	$effect(() => {
		const add = ancestorsOf(page.url.pathname).filter((id) => !expandedItems.includes(id));
		if (add.length > 0) expandedItems = [...expandedItems, ...add];
	});

	// `paneOpen` is bound so the control can close it itself on entering a narrower
	// display mode. The title bar's toggle flips it; the layout owns the state.
	let paneOpen = $state(true);

	// The back button asks whether the frame can go back, which on the web is the
	// history stack's depth at this navigation. `delta` exists only on `popstate`
	// (going back / forward in history) and is negative going back, which is why the
	// narrowing is on `type` first.
	let depth = $state(0);
	afterNavigate((navigation) => {
		openedContainer = null;
		if (navigation.type === 'popstate') depth = Math.max(0, depth + navigation.delta);
		else if (navigation.type !== 'enter') depth += 1;
	});
</script>

<div class="frame">
	<!-- WD-007: TitleBar is mounted without `iconGlyph` — the Gallery's icon is a bitmap
	     asset, not a code point. See docs/divergences.md. -->
	<TitleBar
		title={titleBar.title}
		backButtonVisible={depth > 0}
		onBackRequested={() => history.back()}
		paneToggleButtonVisible
		onPaneToggleRequested={() => (paneOpen = !paneOpen)}
	>
		{#snippet content()}
			<SearchBox placeholder={titleBar.placeholderText} glyph={QUERY_GLYPH} />
		{/snippet}
	</TitleBar>

	<NavigationView
		items={menu}
		{selected}
		onItemInvoked={go}
		bind:paneOpen
		paneToggleButtonVisible={false}
		bind:expandedItems
	>
		<div class="page">{@render children()}</div>
	</NavigationView>
</div>

<style>
	.frame {
		flex: 1 1 auto;
		min-height: 0;
		display: flex;
		flex-direction: column;
	}

	/* The page scrolls, not the window. In the original each Gallery page carries its own
	   ScrollViewer, so the scrolling belongs to the page rather than to NavigationView —
	   which is why this is a wrapper here and not a rule in the control. */
	/* The same rail the pane's scroller uses — `ScrollBarSize` 12 with an 8 wide thumb,
	   ScrollBar_themeresources.xaml:180 and :182. Setting `scrollbar-width` as well would
	   be worse than useless: Chromium ignores every `::-webkit-scrollbar` rule on an
	   element that has it, which is how the first attempt at this ended up with the
	   browser's default rail and a comment claiming otherwise. */
	.page::-webkit-scrollbar {
		/* c1-allow: ScrollBar_themeresources.xaml:180, ScrollBarSize 12 */
		width: 12px;
	}

	.page::-webkit-scrollbar-track {
		background: transparent;
	}

	.page::-webkit-scrollbar-thumb {
		background: var(--winui-ControlStrongFillColorDefaultBrush);
		background-clip: padding-box;
		/* The source's `Collapsed` state names 8 — ScrollBar_themeresources.xaml:543 — and
		   what Windows renders at rest is thinner than that. 5 of border in a 12 rail
		   leaves the 2 the original draws. */
		/* c1-allow: measured 2px on a capture of the real Gallery's pane */
		border: 5px solid transparent;
		/* A capsule at both widths. `border-radius` applies to the border box and the
		   visible thumb is the padding box, so the radius it sees is this minus the border:
		   1 against a 2 wide thumb at rest, 3 against a 6 wide one on hover. Half of
		   `ScrollBarSize` is the number that makes both come out round. */
		/* c1-allow: ScrollBar_themeresources.xaml:180, half of ScrollBarSize 12 */
		border-radius: 6px;
	}

	/* `Expanded` — ScrollBar_themeresources.xaml:587, the rail at `ScrollBarSize` with the
	   thumb at `ScrollBarVerticalThumbMinWidth`. WinUI animates between the two; a hover
	   rule is the same two states without the animation. */
	/* Measured on the original with the pointer over it: the track fills with
	   `ScrollBarTrackFillPointerOver` — `AcrylicInAppFillColorDefaultBrush`,
	   ScrollBar_themeresources.xaml:32 — across the full 12, and the thumb inside it is 6,
	   not the 8 the `Expanded` state's own number suggests. The padding either side of the
	   thumb is what makes it read as thinner than a bar drawn edge to edge. */
	.page:hover::-webkit-scrollbar-track {
		background: var(--winui-AcrylicInAppFillColorDefaultBrush);
	}

	.page:hover::-webkit-scrollbar-thumb {
		/* c1-allow: measured 6px of thumb inside the 12 of ScrollBarSize on the original */
		border: 3px solid transparent;
	}

	.page {
		height: 100%;
		overflow-y: auto;
		box-sizing: border-box;
		/* The Gallery's own gutter, not NavigationView's — `NavigationViewContentPresenterMargin`
		   is 0. `ItemPage.xaml:39` gives the page header `Margin="36,24,36,0"` and `:48` gives
		   the content root `Padding="36,0,36,36"`, which together are 36 a side, 24 above and
		   36 below. Its narrow adaptive state drops both to 16 — `:87` and `:88` — which this
		   does not reproduce yet. */
		/* c1-allow: ItemPage.xaml:39 and :48, the Gallery's page gutter */
		padding: 24px 36px 36px;
	}
</style>
