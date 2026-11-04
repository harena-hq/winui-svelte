<script lang="ts">
	import { ContentDialog } from '@harena-hq/winui-svelte';
</script>

<svelte:head><title>ContentDialog aria-describedby — harness</title></svelte:head>

<ContentDialog open title="Empty the cart?" aria-describedby="words" closeButtonText="Cancel">
	<p id="words">All items will be removed.</p>
</ContentDialog>
