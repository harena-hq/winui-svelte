<script lang="ts">
	import { AnnotatedScrollBar } from 'winui-svelte/preview';

	// One region for every row: 3600 units of extent seen through a 500-unit viewport, which is the
	// shape the Gallery's own example has. The offsets are two close pairs and a far one, so that
	// the collision pass has something to do at 140 and nothing to do at 500: a 300-unit gap is
	// 33px of rail at the taller height and 7px at the shorter, against a measured label height of
	// 9. The first pair also reaches the pass's exception for index 0 — the label collapsed there
	// is the one it collides with, not the first one itself.
	const LABELS = [
		{ content: 'Azure', scrollOffset: 0 },
		{ content: 'Crimson', scrollOffset: 300 },
		{ content: 'Cyan', scrollOffset: 1400 },
		{ content: 'Fuchsia', scrollOffset: 1700 },
		{ content: 'Gold', scrollOffset: 3400 }
	];
	const MAXIMUM = 3600;
	const VIEWPORT = 500;
</script>

<svelte:head><title>AnnotatedScrollBar — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">AnnotatedScrollBar</h1>
<p class="winui-BodyTextBlockStyle">
	A chevron at each end, a column of labels at the offsets they name, and an accent thumb where the
	scrolled region is. There is no drawn rail.
</p>

<div class="rows">
	<section>
		<h2 class="winui-SubtitleTextBlockStyle">five labels over a range that fits them all</h2>
		<div class="box">
			<AnnotatedScrollBar
				class="bar"
				labels={LABELS}
				maximum={MAXIMUM}
				viewportSize={VIEWPORT}
				value={0}
				detailLabelRequested={(offset) => `offset ${Math.round(offset)}`}
			/>
		</div>
	</section>

	<section>
		<h2 class="winui-SubtitleTextBlockStyle">
			the same five labels at a height of 140, where the collision pass drops some
		</h2>
		<div class="box">
			<AnnotatedScrollBar
				class="bar short"
				labels={LABELS}
				maximum={MAXIMUM}
				viewportSize={VIEWPORT}
				value={0}
				detailLabelRequested={(offset) => `offset ${Math.round(offset)}`}
			/>
		</div>
	</section>

	<section>
		<h2 class="winui-SubtitleTextBlockStyle">no labels — the two chevrons and the thumb</h2>
		<div class="box">
			<AnnotatedScrollBar
				class="bar"
				maximum={MAXIMUM}
				viewportSize={VIEWPORT}
				value={0}
				detailLabelRequested={(offset) => `offset ${Math.round(offset)}`}
			/>
		</div>
	</section>

	<section>
		<h2 class="winui-SubtitleTextBlockStyle">a thumb near the end of the range</h2>
		<div class="box">
			<AnnotatedScrollBar
				class="bar"
				labels={LABELS}
				maximum={MAXIMUM}
				viewportSize={VIEWPORT}
				value={3400}
				detailLabelRequested={(offset) => `offset ${Math.round(offset)}`}
			/>
		</div>
	</section>

	<section>
		<h2 class="winui-SubtitleTextBlockStyle">
			no detailLabelRequested — hovering the rail raises no tooltip
		</h2>
		<div class="box">
			<AnnotatedScrollBar
				class="bar"
				labels={LABELS}
				maximum={MAXIMUM}
				viewportSize={VIEWPORT}
				value={0}
			/>
		</div>
	</section>
</div>

<style>
	.rows {
		display: flex;
		flex-wrap: wrap;
		gap: 16px;
		align-items: flex-start;
	}
	/* c1-allow: acceptance harness layout, headings sit above fixed-size measurement boxes. */
	section {
		width: 260px;
	}
	/* c1-allow: acceptance harness layout; the one-pixel currentcolor border makes each specified
	   500px-tall box measurable. */
	.box {
		display: flex;
		justify-content: flex-end;
		height: 500px;
		border: 1px solid currentcolor; /* c1-allow: acceptance harness baseline border makes each box measurable. */
	}
	/* The control takes its height from its container, the same way the `*` row of its own template
	   does; the harness box is what gives it one. */
	:global(.bar) {
		align-self: stretch;
	}
	/* The row the collision pass is judged on: 140 tall rather than the box's 500. */
	:global(.bar.short) {
		align-self: flex-start;
		height: 140px;
	}
</style>
