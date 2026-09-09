<script lang="ts">
	import { afterNavigate, goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { AutoSuggestBox, NavigationView, ScrollView, TitleBar } from 'winui-svelte';
	import {
		QUERY_GLYPH,
		ancestorsOf,
		isContainer,
		menu,
		pathOfSuggestion,
		searchSuggestions,
		titleBar
	} from '$lib/shell';

	let { children } = $props();
	let searchValue = $state('');
	const searchSuggestionsForValue = $derived(searchSuggestions(searchValue));

	// The one row a chosen suggestion can be without a page behind it is `No results found`,
	// which upstream puts in the list rather than in an empty state.
	//
	// The query stays in the box afterwards, which is what the original does — measured on
	// the reference guest, where the box still reads `Typography` on the page it opened.
	function chooseSuggestion(suggestion: string) {
		const path = pathOfSuggestion(suggestion);
		if (path === null) return;
		void goto(resolve(path as `/${string}`));
	}

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
			<!-- The ceiling goes on a wrapper this file owns rather than on the control's
			     `class` prop: Svelte does not put this component's scope hash on a class
			     string handed to another component, so `.search` on the control would be a
			     rule that matches nothing — `pnpm check` says so, and the box would have
			     looked right anyway, because its own `TextControlThemeMinWidth` is the width
			     the original renders. -->
			<!-- No `onQuerySubmitted`: upstream opens a `SearchResultsPage` for text submitted
			     without choosing a suggestion, and that page is a page of the Gallery this
			     version does not build. It is recorded as owed in docs/plan.md. -->
			<div class="search">
				<AutoSuggestBox
					bind:value={searchValue}
					suggestions={searchSuggestionsForValue}
					onSuggestionChosen={chooseSuggestion}
					placeholder={titleBar.placeholderText}
					queryIcon={QUERY_GLYPH}
				/>
			</div>
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
		<!-- The page scrolls, not the window. In the original each Gallery page carries its own
		     ScrollViewer, so this region is now a ScrollView rather than a NavigationView rule.
		     The gutter is on the content inside it rather than on the scroller, which is where
		     upstream puts it and what lets the rule below take it away from a framed page. -->
		<ScrollView class="page" style="height: 100%">
			<div class="page-gutter">{@render children()}</div>
		</ScrollView>
	</NavigationView>
</div>

<style>
	/* `MainWindow.xaml` gives the search box `MaxWidth="580"` and stretches it across the
	   title bar's `*` column. The minimum and the height are the control's own, from
	   `TextControlThemeMinWidth` and `TextControlThemeMinHeight`; only the ceiling is the
	   window's, so only the ceiling is written here. */
	.search {
		display: flex;
		flex: 1 1 auto;
		/* c1-allow: MainWindow.xaml, the Gallery's own AutoSuggestBox carries MaxWidth="580" */
		max-width: 580px;
	}

	.frame {
		flex: 1 1 auto;
		min-height: 0;
		display: flex;
		flex-direction: column;
	}

	.page-gutter {
		/* The Gallery's own gutter, not NavigationView's — `NavigationViewContentPresenterMargin`
		   is 0. `ItemPage.xaml:39` gives the page header `Margin="36,24,36,0"` and `:48` gives
		   the content root `Padding="36,0,36,36"`, which together are 36 a side, 24 above and
		   36 below. Its narrow adaptive state drops both to 16 — `:87` and `:88` — which this
		   does not reproduce yet. */
		/* c1-allow: ItemPage.xaml:39 and :48, the Gallery's page gutter */
		padding: 24px 36px 36px;
	}

	/* Except where the page is an `ItemPage`, which carries those same margins itself — the
	   gutter above is v2's interim stand-in for a frame that now exists, and two of them
	   would be 72 a side. The pages still without a frame keep it until their own unit. */
	.page-gutter:has(> :global([data-item-page])) {
		padding: 0;
	}
</style>
