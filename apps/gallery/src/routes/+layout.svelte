<script lang="ts">
	import 'winui-svelte/tokens.css';
	import 'winui-svelte/type-ramp.css';
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
		min-height: 100vh;
		background: var(--winui-SolidBackgroundFillColorBaseBrush);
		color: var(--winui-TextFillColorPrimaryBrush);
		display: flex;
		flex-direction: column;
	}
</style>
