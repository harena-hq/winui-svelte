<script lang="ts">
	import { Pivot } from 'winui-svelte/preview';
</script>

{#snippet all()}<p class="winui-BodyTextBlockStyle">all emails go here.</p>{/snippet}
{#snippet unread()}<p class="winui-BodyTextBlockStyle">unread emails go here.</p>{/snippet}
{#snippet flagged()}<p class="winui-BodyTextBlockStyle">flagged emails go here.</p>{/snippet}
{#snippet urgent()}<p class="winui-BodyTextBlockStyle">urgent emails go here.</p>{/snippet}

<svelte:head><title>Pivot — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">Pivot</h1>
<p class="winui-BodyTextBlockStyle">A horizontal set of headers with one visible item panel.</p>

<h2 class="winui-SubtitleTextBlockStyle">the Gallery's own</h2>
<div class="row">
	<Pivot
		title="EMAIL"
		style="min-height: 400px"
		items={[
			{ id: 'All', header: 'All', content: all },
			{ id: 'Unread', header: 'Unread', content: unread },
			{ id: 'Flagged', header: 'Flagged', content: flagged },
			{ id: 'Urgent', header: 'Urgent', content: urgent }
		]}
	/>
</div>

<h2 class="winui-SubtitleTextBlockStyle">a later selection</h2>
<div class="row">
	<Pivot
		selected="Flagged"
		items={[
			{ id: 'All', header: 'All', content: all },
			{ id: 'Unread', header: 'Unread', content: unread },
			{ id: 'Flagged', header: 'Flagged', content: flagged },
			{ id: 'Urgent', header: 'Urgent', content: urgent }
		]}
	/>
</div>

<h2 class="winui-SubtitleTextBlockStyle">no title</h2>
<div class="row">
	<Pivot
		items={[
			{ id: 'All', header: 'All', content: all },
			{ id: 'Unread', header: 'Unread', content: unread },
			{ id: 'Flagged', header: 'Flagged', content: flagged },
			{ id: 'Urgent', header: 'Urgent', content: urgent }
		]}
	/>
</div>

<h2 class="winui-SubtitleTextBlockStyle">a disabled item</h2>
<div class="row">
	<Pivot
		selected="All"
		items={[
			{ id: 'All', header: 'All', content: all },
			{ id: 'Unread', header: 'Unread', content: unread, disabled: true },
			{ id: 'Flagged', header: 'Flagged', content: flagged },
			{ id: 'Urgent', header: 'Urgent', content: urgent }
		]}
	/>
</div>

<h2 class="winui-SubtitleTextBlockStyle">the whole control disabled</h2>
<div class="row">
	<Pivot
		selected="All"
		disabled
		items={[
			{ id: 'All', header: 'All', content: all },
			{ id: 'Unread', header: 'Unread', content: unread },
			{ id: 'Flagged', header: 'Flagged', content: flagged },
			{ id: 'Urgent', header: 'Urgent', content: urgent }
		]}
	/>
</div>

<style>
	/* A block rather than the flex row the other harness pages use. A Pivot stretches — its
	   header clipper sits in the template's `*` column (`Pivot_themeresources.xaml:408`) and the
	   original's focus ring spans the whole example card — and a flex item would shrink-wrap it
	   to the width of its four headers. */
	.row {
		background: var(--winui-ApplicationPageBackgroundThemeBrush);
	}
</style>
