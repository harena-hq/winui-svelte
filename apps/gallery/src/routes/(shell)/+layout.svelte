<script lang="ts">
	import { afterNavigate, goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { SvelteSet } from 'svelte/reactivity';
	import { NavigationView, TitleBar } from 'winui-svelte';
	import SearchBox from '$lib/SearchBox.svelte';
	import { QUERY_GLYPH, ancestorsOf, menu, titleBar } from '$lib/shell';

	let { children } = $props();

	// `selected` is the row the pane highlights; derived from the URL, so the back and
	// forward buttons stay coherent without a binding. `'settings'` is the id
	// NavigationView reserves for the row it renders itself — every other row's id is
	// already a path.
	const selected = $derived(page.url.pathname === '/settings' ? 'settings' : page.url.pathname);

	// `resolve` rather than a bare string because `svelte/no-navigation-without-resolve`
	// says so, and it is right: the day this app is served under a base path, this is
	// where it learns about it. Its parameter accepts any absolute pathname, which every
	// id but the reserved `'settings'` is — the assertion states that and nothing more.
	function go(id: string) {
		void goto(resolve(id === 'settings' ? '/settings' : (id as `/${string}`)));
	}

	// The pane's open set, kept in place across navigations. Seeding with the ancestors
	// of the current path is what makes a deep link land with the right branch open.
	//
	// Add only, never remove: a user who has collapsed a branch has said something, and
	// an effect that also removed would undo it on the next navigation.
	const expanded = new SvelteSet<string>();
	$effect(() => {
		for (const id of ancestorsOf(page.url.pathname)) expanded.add(id);
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
		onback={() => history.back()}
		paneToggleVisible
		onpanetoggle={() => (paneOpen = !paneOpen)}
	>
		{#snippet content()}
			<SearchBox placeholder={titleBar.placeholderText} glyph={QUERY_GLYPH} />
		{/snippet}
	</TitleBar>

	<NavigationView
		items={menu}
		{selected}
		onselect={go}
		bind:paneOpen
		paneToggleVisible={false}
		{expanded}
	>
		{@render children()}
	</NavigationView>
</div>

<style>
	.frame {
		flex: 1 1 auto;
		min-height: 0;
		display: flex;
		flex-direction: column;
	}
</style>
