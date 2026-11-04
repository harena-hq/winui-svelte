<script lang="ts">
	import LoopingSelector from '@harena-hq/winui-svelte/internal/LoopingSelector.svelte';

	const months = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];
	const years = Array.from({ length: 11 }, (_, index) => String(2020 + index));
	let looping = $state(8);
	let nonLooping = $state(5);
	let first = $state(0);
	let period = $state(0);
	let compact = $state(8);
</script>

<svelte:head><title>LoopingSelector — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">LoopingSelector</h1>

<div class="columns">
	<section>
		<h2>looping</h2>
		<LoopingSelector items={months} shouldLoop bind:selectedIndex={looping} label="Month" />
	</section>
	<section>
		<h2>not looping</h2>
		<LoopingSelector items={years} bind:selectedIndex={nonLooping} label="Year" />
	</section>
	<section>
		<h2>not looping, at the first item</h2>
		<LoopingSelector items={years} bind:selectedIndex={first} label="First year" />
	</section>
	<section>
		<h2>not looping, two items</h2>
		<LoopingSelector items={['AM', 'PM']} bind:selectedIndex={period} label="Period" />
	</section>
	<section>
		<h2>a shorter item</h2>
		<LoopingSelector
			items={months}
			itemHeight={32}
			bind:selectedIndex={compact}
			label="Compact month"
		/>
	</section>
</div>

<style>
	/* c1-allow: harness layout, not a WinUI value */
	.columns {
		display: flex;
		gap: 16px;
		align-items: flex-start;
	}
	/* c1-allow: harness layout, not a WinUI value */
	section {
		width: 160px;
	}
	/* c1-allow: harness layout, not a WinUI value */
	h2 {
		min-height: 48px;
	}
	/* c1-allow: the DatePicker flyout's presenter list area is 357px; this harness gives every branch that height. */
	:global([data-looping-selector]) {
		height: 357px;
		/* c1-allow: harness baseline border, so each column's box is measurable in its screenshot. */
		border: 1px solid currentcolor;
	}
</style>
