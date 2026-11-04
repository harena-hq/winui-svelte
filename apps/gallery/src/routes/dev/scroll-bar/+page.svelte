<script lang="ts">
	import ScrollBar from '@harena-hq/winui-svelte/internal/ScrollBar.svelte';

	let vertical = $state(0);
	let verticalEnd = $state(800);
	let minimum = $state(0);
	let horizontal = $state(0);
	let horizontalEnd = $state(800);
</script>

<svelte:head><title>ScrollBar — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">ScrollBar</h1>

<div class="rows">
	<section>
		<h2>vertical, mouse indicator</h2>
		<div class="vertical-box">
			<ScrollBar maximum={800} viewportSize={400} bind:value={vertical} />
		</div>
	</section>
	<section>
		<h2>vertical, at the end</h2>
		<div class="vertical-box">
			<ScrollBar maximum={800} viewportSize={400} bind:value={verticalEnd} />
		</div>
	</section>
	<section>
		<h2>vertical, nothing to scroll</h2>
		<div class="vertical-box">
			<ScrollBar maximum={0} viewportSize={400} bind:value={minimum} />
		</div>
	</section>
	<section>
		<h2>vertical, minimum thumb</h2>
		<div class="vertical-box"><ScrollBar maximum={20000} viewportSize={400} /></div>
	</section>
	<section>
		<h2>vertical, disabled</h2>
		<div class="vertical-box"><ScrollBar maximum={800} viewportSize={400} disabled /></div>
	</section>
	<section>
		<h2>vertical, touch indicator</h2>
		<div class="vertical-box">
			<ScrollBar maximum={800} viewportSize={400} indicatorMode="touch" />
		</div>
	</section>
	<section>
		<h2>vertical, no indicator</h2>
		<div class="vertical-box">
			<ScrollBar maximum={800} viewportSize={400} indicatorMode="none" />
		</div>
	</section>
	<section>
		<h2>horizontal, mouse indicator</h2>
		<div class="horizontal-box">
			<ScrollBar
				orientation="horizontal"
				maximum={800}
				viewportSize={400}
				bind:value={horizontal}
			/>
		</div>
	</section>
	<section>
		<h2>horizontal, at the end</h2>
		<div class="horizontal-box">
			<ScrollBar
				orientation="horizontal"
				maximum={800}
				viewportSize={400}
				bind:value={horizontalEnd}
			/>
		</div>
	</section>
</div>

<style>
	/* c1-allow: harness layout, one row per ScrollBar code branch. */
	.rows {
		display: flex;
		flex-wrap: wrap;
		gap: 16px;
		align-items: flex-start;
	}

	/* c1-allow: harness layout, headings sit above each fixed-size measurement box. */
	section {
		width: 240px;
	}

	/* c1-allow: harness layout, the fixed vertical acceptance box is 12px by 240px. */
	.vertical-box {
		width: 12px;
		height: 240px;
		/* c1-allow: harness baseline border, so each fixed-size box is measurable in its screenshot. */
		border: 1px solid currentcolor;
	}

	/* c1-allow: harness layout, the fixed horizontal acceptance box is 240px by 12px. */
	.horizontal-box {
		width: 240px;
		height: 12px;
		/* c1-allow: harness baseline border, so each fixed-size box is measurable in its screenshot. */
		border: 1px solid currentcolor;
	}
</style>
