<script lang="ts">
	import { Button, Expander, ScrollView, ToggleSwitch } from 'winui-svelte';
</script>

<svelte:head><title>Forced colors — harness</title></svelte:head>

<ToggleSwitch checked onContent="" offContent="" />
<ToggleSwitch onContent="" offContent="" />
<Button>A label</Button>
<ScrollView>
	<p data-own="scroll-view">Own colour</p>
</ScrollView>
<Expander open>
	{#snippet header()}Open{/snippet}
	<p data-own="expander">Own colour</p>
</Expander>

<style>
	[data-own] {
		/* c1-allow: a colour of the consumer's own, which the forcing is there to replace */
		color: rgb(200, 0, 0);
	}
</style>
