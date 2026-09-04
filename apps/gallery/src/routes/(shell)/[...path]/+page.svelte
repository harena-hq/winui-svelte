<script lang="ts">
	import { page } from '$app/state';
	import { titleOf } from '$lib/shell';

	const path = $derived(page.url.pathname);
	const title = $derived(titleOf(path));
</script>

<h1 class="winui-TitleTextBlockStyle">{title ?? path}</h1>
<p class="winui-BodyTextBlockStyle">
	This page is not built in this version. It arrives with the control tranche that owns it; until
	then it shows what the record says it is.
</p>
