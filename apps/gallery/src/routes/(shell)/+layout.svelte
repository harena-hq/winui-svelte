<script lang="ts">
	import { untrack } from 'svelte';
	import { afterNavigate, goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import {
		AutoSuggestBox,
		NavigationView,
		ScrollView,
		TitleBar,
		type NavigationViewDisplayMode
	} from 'winui-svelte/preview';
	import {
		QUERY_GLYPH,
		ancestorsOf,
		isContainer,
		menu,
		pathOfSuggestion,
		searchSuggestions,
		titleBar
	} from '$lib/shell';
	import { noteKeyDown, notePointer } from '$lib/frame/last-input';
	import { clearReselect, markReselect } from '$lib/frame/reselect';

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
		const record = { path: resolve(path as `/${string}`) };
		searched = record;
		void goto(resolve(path as `/${string}`)).finally(() => {
			if (searched === record) searched = null;
		});
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
		const path = (id === 'settings' ? '/settings' : id) as `/${string}`;
		const record = { path: resolve(path) };
		// The selected row invoked again keeps the focus: upstream navigates on a selection
		// change (MainWindow.xaml.cs:304-404), and that invoke changes none, so no page loads to
		// take it. `keepFocus` is passed, since without it SvelteKit blurs the row and focuses
		// the body, and the page is told not to take the focus itself (`reselect.ts`). The row is
		// not the selected one after a container's row was opened, though its page is the one
		// shown. Where the invoke removes the row, as the rail's flyout and a pane outside the
		// expanded mode do when they close, the focus leaves it all the same, and where
		// upstream's goes then was not measured.
		const reselected = openedContainer === null && record.path === page.url.pathname;
		openedContainer = null;
		invoked = record;
		const mark = markReselect(reselected ? record.path : null);
		void goto(resolve(path), { keepFocus: reselected }).finally(() => {
			if (invoked === record) invoked = null;
			clearReselect(mark);
		});
	}

	// The pane's open set, kept in place across navigations. Seeding with the ancestors
	// of the current path is what makes a deep link land with the right branch open.
	//
	// Add only, never remove: a user who has collapsed a branch has said something, and
	// an effect that also removed would undo it on the next navigation.
	//
	// **This effect must depend on the path and on nothing else**, which is what the
	// `untrack` is for. Reading `expandedItems` reactively made it re-run on its own
	// subject: `OnNavigationViewItemInvoked` toggles expansion unconditionally
	// (NavigationView.cpp:1062), so invoking `Design` while a Design page is open
	// collapsed the branch, the write woke this effect, the current path's ancestors
	// still named `Design`, and it was expanded again inside the same tick. The branch
	// could not be collapsed at all from a page inside it, however many times it was
	// clicked. For a section that also has a page of its own the same re-seed made one
	// click do half the work — navigate, stay open — where the original navigates and
	// collapses together.
	//
	// The `includes` guard stays, but it is now only a needless write avoided rather
	// than the thing that stops a loop.
	//
	// A navigation the pane asked for is not seeded either. `go` is reached only from
	// a row's invoke, and the row invoked was on screen, so its ancestors are open
	// already, except in a rail's flyout: there the control collapses the flyout's row
	// after reporting the invoke (`CloseFlyoutIfRequired`,
	// NavigationView.cpp:1065-1068), and seeding once the navigation landed opened the
	// row, and the flyout with it, again. The original seeds too
	// (`EnsureNavigationSelection`, ItemPage.xaml.cs:79), but inside the invoke: the
	// selection change navigates (MainWindow.xaml.cs:400), `Frame.Navigate` calls
	// `OnNavigatedTo` before it returns (Frame_Partial.cpp:660), and the page's `await`
	// finds the data loaded at start (App.xaml.cs:108,
	// ControlInfoDataSource.cs:87-90), so it runs before the collapse.
	//
	// The record names the resolved path, which is what `page.url` holds. It is kept for
	// the page already shown too, because `goto` to it still lands and wakes this effect
	// with a new `URL`. Each invoke has its own record, so an earlier invoke's navigation,
	// superseded or failed, clears only the record it made.
	//
	// In the rail the top-level ancestor is not seeded, except after a search. Measured on the
	// reference guest with the pane shut into its rail: a page opened from a Home card leaves
	// its section's row shut, with no flyout drawn; one click on the row opens the flyout, and
	// opening the pane shows the section collapsed. A page chosen from the search box's
	// suggestions instead opens the section's flyout and leaves it open, its page selected.
	// The Home card's page sets `IsExpanded` on the row and then selects
	// (`EnsureNavigationSelection`, MainWindow.xaml.cs:192). The search runs that too, once its
	// selection has navigated, but first expands the row, lays the pane out and selects on its
	// own (`EnsureItemIsVisibleInNavigation`, MainWindow.xaml.cs:521-525). In a rail an
	// expanded row shows its flyout (`ShowHideChildren`, NavigationViewItem.cpp:805-824) and a
	// closing flyout collapses its row (`OnFlyoutClosing`, NavigationViewItem.cpp:944-947).
	// What closes the Home card's flyout was not found, and no flyout was seen. Searched: the
	// literal `IsExpanded(false)` writes. Those at NavigationView.cpp:385 and :920 and at
	// NavigationViewItem.cpp:855 are not reached on this path; the one at
	// NavigationViewItem.cpp:946 runs when a flyout closes, which is the question. The page
	// focusing itself once loaded (Pages/ItemPage.xaml.cs:44) could dismiss a flyout just
	// opened, and is not examined; the search's page focuses itself too and its flyout stays,
	// which weighs against it.
	//
	// Seeded in the rail, a deep link left the row expanded with no flyout drawn, so the first
	// click shut a flyout nobody saw. Rows below the top level are seeded as before: the
	// original expands them too (MainWindow.xaml.cs:206), and they show when the flyout opens.
	// No row below the top level of this menu has children of its own, so nothing reaches that
	// branch today (data/winui-gallery-shell.json nests one level). A shut minimal pane is not
	// a rail, so its section is seeded and shows when the pane opens. `searched` is kept as
	// `invoked` is: one record per search, cleared by this effect or by its own `goto`.
	//
	// On a deep link this reads the rail only because two things run before it: the size
	// binding reads the control's width synchronously in the mount flush, so its first mode is
	// measured rather than guessed, and the control's effects, which report that mode and shut
	// the pane, run before this one in Svelte's child-first order. Were either otherwise, the
	// control's expansion memory would collapse the seeded row and put it back when the pane
	// opens; the deep-link test opens the pane to catch that. `displayMode` is read only here,
	// under `untrack`, so it is a plain variable.
	let expandedItems = $state<string[]>([]);
	let invoked: { path: string } | null = null;
	let searched: { path: string } | null = null;
	let displayMode: NavigationViewDisplayMode = 'expanded';
	$effect(() => {
		const path = page.url.pathname;
		untrack(() => {
			const asked = invoked;
			const found = searched;
			invoked = null;
			searched = null;
			if (path === asked?.path) return;
			const leaveTopShut = !paneOpen && displayMode !== 'minimal' && path !== found?.path;
			const add = ancestorsOf(path)
				.slice(leaveTopShut ? 1 : 0)
				.filter((id) => !expandedItems.includes(id));
			if (add.length > 0) expandedItems = [...expandedItems, ...add];
		});
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

<svelte:document
	onkeydowncapture={noteKeyDown}
	onpointerdowncapture={notePointer}
	onpointermovecapture={notePointer}
	onwheelcapture={notePointer}
/>

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
			     rule that matches nothing — `pnpm check` says so. The width the box holds
			     is set on the wrapper's child below. -->
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

	<!-- MainWindow.xaml:142-143 — the back button and the toggle are the title bar's, so the
	     NavigationView draws neither. -->
	<NavigationView
		items={menu}
		{selected}
		onItemInvoked={go}
		bind:paneOpen
		onDisplayModeChanged={(mode) => (displayMode = mode)}
		paneToggleButtonVisible={false}
		backButtonVisible="collapsed"
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
	/* `MainWindow.xaml` gives the search box `MaxWidth="580"`, the ceiling written here. The
	   height is the control's own, from `TextControlThemeMinHeight`; the width below is not. */
	.search {
		display: flex;
		flex: 1 1 auto;
		/* c1-allow: MainWindow.xaml, the Gallery's own AutoSuggestBox carries MaxWidth="580" */
		max-width: 580px;
	}

	/* The search box's width is the Gallery's, not the control's. The reference guest runs a
	   release whose `MainWindow.xaml` gives it `Width="320"`: measured 320 at the reference's
	   1600-pixel window with its placeholder showing and with a query typed in, and 318 in
	   earlier captures at a narrower one, clipping on the right rather than shrinking. The pin
	   drops that width for `TitleBarContentHorizontalAlignment` set to `Stretch` under the 580
	   ceiling above (WinUI-Gallery 9a14fa5), which this shell does not reproduce yet. Held as a
	   `width` rather than a floor, because the control now sizes itself to its text: a floor
	   let a long query widen the box, which neither Gallery does. Held at 318, the earlier
	   captures' figure, rather than the 320 that `Width` says, because every shell baseline
	   was taken at 318; the shell unit that reproduces the pin's stretch retakes them. */
	.search > :global(*) {
		width: 318px;
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
