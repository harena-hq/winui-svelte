<script lang="ts">
	import { ScrollViewer } from 'winui-svelte/preview';
</script>

<svelte:head><title>ScrollViewer — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">ScrollViewer</h1>

<div class="rows">
	<section>
		<h2>defaults</h2>
		<ScrollViewer class="scroll-example"><div class="tall">Tall content</div></ScrollViewer>
	</section>
	<section>
		<h2>horizontal auto</h2>
		<ScrollViewer class="scroll-example" horizontalScrollBarVisibility="auto"
			><div class="wide tall">Wide and tall content</div></ScrollViewer
		>
	</section>
	<section>
		<h2>vertical hidden</h2>
		<ScrollViewer class="scroll-example" verticalScrollBarVisibility="hidden"
			><div class="tall">Hidden rail, still scrollable</div></ScrollViewer
		>
	</section>
	<section>
		<h2>vertical disabled</h2>
		<ScrollViewer class="scroll-example" verticalScrollBarVisibility="disabled"
			><div class="tall">Disabled axis cannot scroll</div></ScrollViewer
		>
	</section>
	<section>
		<h2>zoomed</h2>
		<ScrollViewer
			class="scroll-example"
			horizontalScrollBarVisibility="auto"
			zoomMode="enabled"
			zoomFactor={2}><div class="zoom-block">200 by 100 block</div></ScrollViewer
		>
	</section>
	<section>
		<h2>disabled</h2>
		<ScrollViewer class="scroll-example" disabled
			><div class="tall">Disabled content</div></ScrollViewer
		>
	</section>
</div>

<style>
	/* c1-allow: acceptance harness layout; every ScrollViewer branch uses the specified 300px by 200px measurement box. */
	.rows {
		display: flex;
		flex-wrap: wrap;
		gap: 16px;
		align-items: flex-start;
	}
	/* c1-allow: acceptance harness layout, headings sit above fixed-size measurement boxes. */
	section {
		width: 320px;
	}
	/* c1-allow: acceptance harness baseline border makes each specified box measurable. */
	:global(.scroll-example) {
		width: 300px;
		height: 200px;
		border: 1px solid currentcolor; /* c1-allow: acceptance harness baseline border makes each box measurable. */
	}
	/* c1-allow: acceptance harness content deliberately exceeds the 200px viewport. */
	.tall {
		min-height: 500px;
	}
	/* c1-allow: acceptance harness content deliberately exceeds the 300px viewport. */
	.wide {
		width: 600px;
	}
	/* c1-allow: acceptance harness content is the specified 200px by 100px pre-zoom block. */
	.zoom-block {
		width: 200px;
		height: 100px;
		background: var(--winui-AccentFillColorDefaultBrush);
	}
</style>
