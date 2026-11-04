<script lang="ts">
	import '@harena-hq/winui-svelte/tokens.css';
	import '@harena-hq/winui-svelte/type-ramp.css';
	import '$lib/gallery-styles.css';
	import favicon from '$lib/assets/favicon.svg';
	import { theme } from '$lib/theme.svelte';

	let { children } = $props();

	// Two effects, not one, because a single effect that both reads and writes `theme`
	// fights itself: every re-run re-reads `localStorage`, which the previous run just
	// wrote with the previous value, and stomps the selection that triggered the re-run
	// back to it. Restore happens once, with no reactive dependency on `theme`, so it
	// runs on mount and never again; apply-and-persist reads `theme` and never reads
	// `localStorage` back, so it has nothing to fight.
	$effect(() => {
		const stored = localStorage.getItem('winui-svelte:theme');
		if (stored !== null) theme.value = stored as '' | 'light' | 'dark' | 'high-contrast';
	});

	$effect(() => {
		if (theme.value) document.documentElement.dataset.theme = theme.value;
		else delete document.documentElement.dataset.theme;

		localStorage.setItem('winui-svelte:theme', theme.value);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<!--
	The window background is D16: Mica's input is the desktop behind the window, which
	a web page has no access to. The Gallery's own Color page gives `Mica Background /
	Base` and `Solid Background / Base` the same caption — "used for the bottom most
	layer of an experience" — so the solid pair is the value Microsoft itself names
	for that role. WD-003.
-->
<div class="window winui-BodyTextBlockStyle">
	{@render children()}
</div>

<style>
	.window {
		/* Exactly the viewport, not at least it. The original is a window: its pane and its
		   content each scroll inside a frame that does not move, and a page that grows past
		   the viewport gives the whole thing one outer scrollbar instead.

		   `dvh` rather than `vh` because a browser whose toolbars collapse sizes `vh` to the
		   viewport with them collapsed: on an iPad, while a toolbar was showing, the window ran
		   on past the bottom of what was visible, and the pane's last rows, Settings among them,
		   could not be scrolled to. Where nothing collapses the two are the same length, and the
		   `vh` line is for a browser that has no `dvh`, which would otherwise drop the height. */
		height: 100vh;
		height: 100dvh;
		overflow: hidden;
		background: var(--winui-SolidBackgroundFillColorBaseBrush);
		color: var(--winui-TextFillColorPrimaryBrush);
		display: flex;
		flex-direction: column;
	}
</style>
