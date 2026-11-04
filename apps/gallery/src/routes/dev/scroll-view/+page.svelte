<script lang="ts">
	import { ScrollView } from '@harena-hq/winui-svelte/preview';
</script>

<svelte:head><title>ScrollView — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">ScrollView</h1>

<div class="rows">
	<section>
		<h2>vertical scrolling</h2>
		<ScrollView class="scroll-example" contentOrientation="vertical"
			><div class="tall">
				<p>Vertical content</p>
				<p>Scroll through this content.</p>
				<p>Its height exceeds the viewport.</p>
				<p>WinUI ScrollView keeps the viewport wide beneath its overlay bar.</p>
				<p>The last paragraph confirms the lower extent.</p>
			</div></ScrollView
		>
	</section>
	<section>
		<h2>nothing to scroll</h2>
		<ScrollView class="scroll-example"><p>Short content fits in the viewport.</p></ScrollView>
	</section>
	<section>
		<h2>forced vertical rail</h2>
		<ScrollView class="scroll-example" verticalScrollBarVisibility="visible"
			><p>Short content fits in the viewport.</p></ScrollView
		>
	</section>
	<section>
		<h2>hidden vertical rail</h2>
		<ScrollView class="scroll-example" verticalScrollBarVisibility="hidden"
			><div class="tall">
				<p>Hidden rail</p>
				<p>The wheel still scrolls this tall content.</p>
				<p>The scrollbar is not drawn.</p>
				<p>This is the lower extent.</p>
			</div></ScrollView
		>
	</section>
	<section>
		<h2>both axes</h2>
		<ScrollView class="scroll-example" contentOrientation="both"
			><div class="wide tall">
				<p>Wide and tall content draws both bars and their corner.</p>
				<p>Scroll in either direction.</p>
				<p>The last paragraph reaches the vertical extent.</p>
			</div></ScrollView
		>
	</section>
	<section>
		<h2>horizontal scrolling</h2>
		<ScrollView class="scroll-example" contentOrientation="horizontal"
			><div class="wide">
				<p>
					Wide content draws one horizontal scrollbar while this paragraph stays on a single line.
				</p>
			</div></ScrollView
		>
	</section>
	<section>
		<h2>no scrolling orientation</h2>
		<ScrollView class="scroll-example" contentOrientation="none"
			><p>Content fits in both constrained dimensions.</p></ScrollView
		>
	</section>
	<section>
		<h2>vertical mode disabled</h2>
		<ScrollView class="scroll-example" verticalScrollMode="disabled"
			><div class="tall">
				<p>Vertical input is disabled.</p>
				<p>The wheel cannot scroll this content.</p>
				<p>No vertical bar is drawn.</p>
				<p>This remains below the viewport.</p>
			</div></ScrollView
		>
	</section>
	<section>
		<h2>disabled</h2>
		<ScrollView class="scroll-example" disabled
			><div class="tall wide">
				<p>Both axes and both bars are disabled.</p>
				<p>This content exceeds the viewport.</p>
				<p>It remains fixed.</p>
			</div></ScrollView
		>
	</section>
	<section>
		<h2>zoomed</h2>
		<ScrollView class="scroll-example" zoomMode="enabled" zoomFactor={2}
			><div class="zoom-block">200 by 100 block</div></ScrollView
		>
	</section>
</div>

<style>
	/* c1-allow: acceptance harness layout; every ScrollView branch uses the specified 300px by 200px measurement box. */
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
	/* c1-allow: acceptance harness layout; the one-pixel currentcolor border makes each specified 300px by 200px box measurable. */
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
	/* c1-allow: acceptance harness keeps the horizontal-content paragraph unwrapped. */
	.wide p {
		white-space: nowrap;
	}
	/* c1-allow: acceptance harness content is the specified 200px by 100px pre-zoom block. */
	.zoom-block {
		width: 200px;
		height: 100px;
		background: var(--winui-AccentFillColorDefaultBrush);
	}
</style>
