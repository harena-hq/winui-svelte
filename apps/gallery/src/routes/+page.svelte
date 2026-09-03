<script lang="ts">
	import { resolve } from '$app/paths';
	import { VERSION } from 'winui-svelte';
	import { nav } from '$lib/design';
</script>

<h1 class="winui-TitleTextBlockStyle">winui-svelte {VERSION}</h1>
<p class="winui-BodyTextBlockStyle">
	The Gallery shell arrives in v2. The five Design pages below render from the token layer in all
	three themes.
</p>

<ul>
	{#each nav as item (item.uniqueId)}
		<li>
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
			<span class="winui-CaptionTextBlockStyle subtitle">{item.subtitle}</span>
		</li>
	{/each}
</ul>

<style>
	ul {
		list-style: none;
		padding: 0;
		display: grid;
		gap: 12px;
	}

	li {
		display: grid;
		grid-template-columns: 200px 1fr;
		gap: 16px;
		align-items: baseline;
	}

	a {
		color: var(--winui-TextFillColorPrimaryBrush);
		text-decoration: none;
	}

	.subtitle {
		opacity: 0.8;
	}
</style>
