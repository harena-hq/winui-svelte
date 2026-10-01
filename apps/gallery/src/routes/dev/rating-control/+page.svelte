<script lang="ts">
	import { RatingControl } from 'winui-svelte/preview';
</script>

<svelte:head><title>RatingControl — harness</title></svelte:head>
<h1 class="winui-TitleTextBlockStyle">RatingControl</h1>
<h2 class="winui-SubtitleTextBlockStyle">unset</h2>
<RatingControl data-testid="unset" />
<h2 class="winui-SubtitleTextBlockStyle">set</h2>
<RatingControl data-testid="set" value={3} />
<h2 class="winui-SubtitleTextBlockStyle">fractional</h2>
<RatingControl data-testid="fractional" value={3.5} />
<h2 class="winui-SubtitleTextBlockStyle">caption</h2>
<RatingControl data-testid="caption" value={4} caption="4 stars" />
<h2 class="winui-SubtitleTextBlockStyle">max ten</h2>
<RatingControl data-testid="max-ten" maxRating={10} value={7} />
<h2 class="winui-SubtitleTextBlockStyle">placeholder</h2>
<RatingControl data-testid="placeholder" placeholderValue={2.5} />
<h2 class="winui-SubtitleTextBlockStyle">read-only</h2>
<RatingControl data-testid="read-only" readonly value={3} />
<h2 class="winui-SubtitleTextBlockStyle">no clear</h2>
<RatingControl data-testid="no-clear" clearEnabled={false} value={1} />
<!-- `readonly` and `disabled` are two different things upstream and land next to each other here
     for that reason: RatingControl.cpp:329-333 reaches the Disabled visual state only from
     `!IsEnabled()`, so the read-only row above must keep its Set colour while this one must not. -->
<h2 class="winui-SubtitleTextBlockStyle">disabled</h2>
<RatingControl data-testid="disabled" disabled value={3} />
