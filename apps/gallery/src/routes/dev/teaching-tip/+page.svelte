<script lang="ts">
	/* This page is the TeachingTip component's harness, not part of the Gallery reproduction.
	   TeachingTips are portalled and out of flow, so each open sample reserves room for its own
	   surface; upward tips get space above their row and downward tips get space below it. */
	import { Button, TeachingTip } from 'winui-svelte/preview';
</script>

<svelte:head><title>TeachingTip — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">TeachingTip</h1>
<p class="description winui-BodyTextBlockStyle">
	The Gallery example, text-only tips, side placements, and a tip without its tail.
</p>

<h2 class="winui-SubtitleTextBlockStyle">the Gallery example</h2>
<div class="row open-above indent">
	<TeachingTip open glyph="E72C" title="This is the title" subtitle="And this is the subtitle">
		{#snippet children(props)}
			<Button {...props}>Show TeachingTip</Button>
		{/snippet}
	</TeachingTip>
</div>

<h2 class="winui-SubtitleTextBlockStyle">without an icon</h2>
<div class="row open-above indent">
	<TeachingTip open title="This is the title" subtitle="And this is the subtitle">
		{#snippet children(props)}
			<Button {...props}>Show TeachingTip</Button>
		{/snippet}
	</TeachingTip>
</div>

<h2 class="winui-SubtitleTextBlockStyle">title only and subtitle only</h2>
<div class="row open-above indent separated">
	<TeachingTip open title="This is the title">
		{#snippet children(props)}
			<Button {...props}>Title only</Button>
		{/snippet}
	</TeachingTip>
	<TeachingTip open subtitle="And this is the subtitle">
		{#snippet children(props)}
			<Button {...props}>Subtitle only</Button>
		{/snippet}
	</TeachingTip>
</div>

<h2 class="winui-SubtitleTextBlockStyle">the four sides</h2>
<div class="row sides-row">
	<TeachingTip open preferredPlacement="top" title="Above" subtitle="Top placement">
		{#snippet children(props)}
			<Button {...props}>top</Button>
		{/snippet}
	</TeachingTip>
	<TeachingTip open preferredPlacement="bottom" title="Below" subtitle="Bottom placement">
		{#snippet children(props)}
			<Button {...props}>bottom</Button>
		{/snippet}
	</TeachingTip>
	<TeachingTip open preferredPlacement="left" title="Left" subtitle="Left placement">
		{#snippet children(props)}
			<Button {...props}>left</Button>
		{/snippet}
	</TeachingTip>
	<TeachingTip open preferredPlacement="right" title="Right" subtitle="Right placement">
		{#snippet children(props)}
			<Button {...props}>right</Button>
		{/snippet}
	</TeachingTip>
</div>

<h2 class="winui-SubtitleTextBlockStyle">the Gallery's second example</h2>
<p class="untargeted-description winui-BodyTextBlockStyle">
	This tip is anchored to the viewport rather than a page element, so it renders fixed at the
	window's bottom edge.
</p>
<TeachingTip
	open
	title="This is the title"
	subtitle="And this is the subtitle"
	actionButtonContent="Action button"
	closeButtonContent="Close button"
	lightDismiss
	placementMargin={20}
/>

<h2 class="winui-SubtitleTextBlockStyle">one button at a time</h2>
<div class="row open-above indent separated">
	<TeachingTip
		open
		title="Action button"
		subtitle="One action command"
		actionButtonContent="Action button"
	>
		{#snippet children(props)}
			<Button {...props}>Action target</Button>
		{/snippet}
	</TeachingTip>
	<TeachingTip
		open
		title="Close button"
		subtitle="One close command"
		closeButtonContent="Close button"
	>
		{#snippet children(props)}
			<Button {...props}>Close target</Button>
		{/snippet}
	</TeachingTip>
</div>

<h2 class="winui-SubtitleTextBlockStyle">hero content</h2>
<div class="row open-above hero-row indent">
	<TeachingTip open title="This is the title" subtitle="And this is the subtitle">
		{#snippet heroContent()}
			<img class="hero-image" src="/sunset.jpg" alt="Sunset" style="display: block; width: 100%" />
		{/snippet}
		{#snippet content()}
			<p class="description-line">Description can go here</p>
		{/snippet}
		{#snippet children(props)}
			<Button {...props}>Show TeachingTip</Button>
		{/snippet}
	</TeachingTip>
</div>

<h2 class="winui-SubtitleTextBlockStyle">no tail</h2>
<div class="row open-above indent">
	<TeachingTip
		open
		tailVisibility="collapsed"
		title="This is the title"
		subtitle="And this is the subtitle"
	>
		{#snippet children(props)}
			<Button {...props}>Show TeachingTip</Button>
		{/snippet}
	</TeachingTip>
</div>

<style>
	/* The tips below are the Gallery's examples, at the 48px `TeachingTipMinWidth` the Gallery
	   sets for the whole app (App.xaml:62), which gallery-styles.css sets on the body. The
	   control's own floor is asserted in teaching-tip.spec.ts with that taken back off. */
	/* Rows are ordinary Gallery harness layout; their backgrounds follow the application page token. */
	.row {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		gap: 24px;
		background: var(--winui-ApplicationPageBackgroundThemeBrush);
	}

	/* 160px reserves at least 120px above every upward-opening portalled tip. */
	.open-above {
		margin-top: 160px;
	}

	/* A card is up to 224px wide and centred on its trigger, so a trigger nearer the viewport's
	   left edge than half of that is moved by collision avoidance and its tail no longer sits
	   under the card's centre. 100px puts every trigger centre past the halfway mark. */
	.indent {
		padding-left: 100px;
	}

	/* The vertical padding is the room the upward and downward tips need — a card is at most
	   64px tall plus its 8px offset — and the horizontal padding is the room the left and right
	   ones need. Between them they keep all four surfaces inside the viewport, so collision
	   avoidance never moves one off its preferred side. The padding does the work a margin
	   would, so this row needs none. */
	.sides-row {
		align-items: center;
		justify-content: space-between;
		padding: 140px 200px;
	}

	/* The two content-sized tips need independent horizontal room so their portalled cards do not
	   touch. */
	.separated {
		gap: 240px;
	}

	/* Keep the page description's spacing local to this harness; no bare element selector is used. */
	.description {
		margin: 0;
	}

	/* A hero card is 310px tall where an ordinary one is 64, so its row needs its own clearance
	   or the card lands on the row above it. */
	.hero-row {
		margin-top: 420px;
	}

	/* This is the Gallery TextBlock's own Margin="0,16,0,0", not TeachingTip's content gap. */
	.description-line {
		margin: 16px 0 0;
	}
</style>
