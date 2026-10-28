<script lang="ts">
	import { page } from '$app/state';
	import InterimPage from '$lib/frame/InterimPage.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { itemOf, titleOf } from '$lib/shell';

	const path = $derived(page.url.pathname);
	const title = $derived(titleOf(path));
	const item = $derived(itemOf(path));
</script>

<!-- Keyed, so each placeholder brings a new scroller that starts at the top, as a new upstream
     page does: one component instance serves every path this route matches. -->
{#key path}
	{#if item}
		<ItemPage {item}>
			<p class="winui-BodyTextBlockStyle">
				This page is not built in this version. It arrives with the control tranche that owns it;
				until then it shows what the record says it is.
			</p>
		</ItemPage>
	{:else}
		<InterimPage>
			<h1 class="winui-TitleTextBlockStyle">{title ?? path}</h1>
			<p class="winui-BodyTextBlockStyle">
				This page is not built in this version. It arrives with the control tranche that owns it;
				until then it shows what the record says it is.
			</p>
		</InterimPage>
	{/if}
{/key}
