<script lang="ts">
	import 'winui-svelte/tokens.css';
	import 'winui-svelte/type-ramp.css';
	import '$lib/gallery-styles.css';
	import { resolve } from '$app/paths';
	import favicon from '$lib/assets/favicon.svg';
	import { nav } from '$lib/design';

	let { children } = $props();

	const themes = [
		{ value: '', label: 'System' },
		{ value: 'light', label: 'Light' },
		{ value: 'dark', label: 'Dark' },
		{ value: 'high-contrast', label: 'High contrast' }
	];

	let theme = $state('');

	// Two effects, not one, because a single effect that both reads and writes `theme`
	// fights itself: every re-run re-reads `localStorage`, which the previous run just
	// wrote with the previous value, and stomps the selection that triggered the re-run
	// back to it. Restore happens once, with no reactive dependency on `theme`, so it
	// runs on mount and never again; apply-and-persist reads `theme` and never reads
	// `localStorage` back, so it has nothing to fight.
	$effect(() => {
		const stored = localStorage.getItem('winui-svelte:theme');
		if (stored !== null) theme = stored;
	});

	$effect(() => {
		if (theme) document.documentElement.dataset.theme = theme;
		else delete document.documentElement.dataset.theme;

		localStorage.setItem('winui-svelte:theme', theme);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="page winui-BodyTextBlockStyle">
	<header>
		<nav>
			{#each nav as item (item.uniqueId)}
				<a
					href={resolve(
						`/design/${item.uniqueId.toLowerCase()}` as
							| '/design/color'
							| '/design/geometry'
							| '/design/iconography'
							| '/design/spacing'
							| '/design/typography'
					)}>{item.title}</a
				>
			{/each}
		</nav>
		<label class="theme">
			<select bind:value={theme}>
				{#each themes as t (t.value)}
					<option value={t.value}>{t.label}</option>
				{/each}
			</select>
		</label>
	</header>

	<main>
		{@render children()}
	</main>
</div>

<style>
	.page {
		background: var(--winui-SolidBackgroundFillColorBaseBrush);
		color: var(--winui-TextFillColorPrimaryBrush);
		min-height: 100vh;
	}

	header {
		display: flex;
		gap: 24px;
		align-items: center;
		padding: 16px 24px;
		/* c1-allow: 1px is the Gallery's own stroke width; WinUI tokenizes no border width here */
		border-bottom: 1px solid var(--winui-CardStrokeColorDefaultBrush);
	}

	nav {
		display: flex;
		gap: 16px;
	}

	nav a {
		color: var(--winui-TextFillColorPrimaryBrush);
		text-decoration: none;
	}

	main {
		padding: 24px;
	}
</style>
