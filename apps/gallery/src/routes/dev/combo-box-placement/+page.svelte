<script lang="ts">
	import { ComboBox } from 'winui-svelte/preview';

	/*
	 * Where a non-editable ComboBox's list opens, for `GetNonPannablePopupLayout`
	 * (`ComboBox_Partial.cpp:4767-4911`): a list longer than the nine items upstream shows, with
	 * the tenth selected, so that the selection is not the middle item and the fill pass lays the
	 * rest; and a short one in a scroller the test can scroll to put the box against the window's
	 * bottom edge.
	 *
	 * **Nothing photographs this page.** `combo-box-placement.spec.ts` reads the lists' geometry.
	 */
	const long = Array.from({ length: 12 }, (_, index) => ({
		value: `item-${index}`,
		label: `Item ${index}`
	}));
	const colours = [
		{ value: 'blue', label: 'Blue' },
		{ value: 'green', label: 'Green' },
		{ value: 'red', label: 'Red' },
		{ value: 'yellow', label: 'Yellow' }
	];
	let longValue = $state('item-9');
	let colour = $state('');
</script>

<svelte:head><title>ComboBox placement — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">ComboBox — where the list opens</h1>

<div class="clearance"></div>
<div id="long">
	<ComboBox items={long} bind:value={longValue} />
</div>

<div class="clearance"></div>
<div id="short">
	<ComboBox items={colours} bind:value={colour} placeholder="Pick a colour" />
</div>
<div class="clearance"></div>

<style>
	/* Room for the long list's six items above its box, and for the test to scroll the short
	   one anywhere in the window. */
	.clearance {
		height: 240px;
	}
</style>
