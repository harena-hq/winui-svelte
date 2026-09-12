<script lang="ts">
	import { Image } from 'winui-svelte';
</script>

<svelte:head><title>Image — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">Image</h1>

<h2 class="winui-SubtitleTextBlockStyle">Default stretch</h2>
<Image source="/treetops.jpg" style="height: 100px" aria-label="Default Uniform stretch" />

<h2 class="winui-SubtitleTextBlockStyle">Stretch None</h2>
<Image
	source="/valley.jpg"
	stretch="none"
	style="width: 100px; height: 100px"
	aria-label="Stretch None"
/>

<h2 class="winui-SubtitleTextBlockStyle">Stretch Fill</h2>
<Image
	source="/valley.jpg"
	stretch="fill"
	style="width: 100px; height: 100px"
	aria-label="Stretch Fill"
/>

<h2 class="winui-SubtitleTextBlockStyle">Stretch Uniform</h2>
<Image
	source="/valley.jpg"
	stretch="uniform"
	style="width: 100px; height: 100px"
	aria-label="Stretch Uniform"
/>

<h2 class="winui-SubtitleTextBlockStyle">Stretch UniformToFill</h2>
<Image
	source="/valley.jpg"
	stretch="uniformToFill"
	style="width: 100px; height: 100px"
	aria-label="Stretch UniformToFill"
/>

<h2 class="winui-SubtitleTextBlockStyle">Normal nine-grid source</h2>
<Image source="/ninegrid.gif" style="height: 82px" aria-label="Normal nine-grid source" />

<h2 class="winui-SubtitleTextBlockStyle">Even nine-grid</h2>
<Image
	source="/ninegrid.gif"
	nineGrid="3,3,3,3"
	style="height: 164px"
	aria-label="Even nine-grid"
/>

<h2 class="winui-SubtitleTextBlockStyle">Inset nine-grid</h2>
<Image
	source="/ninegrid.gif"
	nineGrid="30,20,30,20"
	style="height: 164px"
	aria-label="Inset nine-grid"
/>

<h2 class="winui-SubtitleTextBlockStyle">SVG source</h2>
<Image source="/MirrorPCConsent.svg" style="height: 100px" aria-label="SVG source" />

<!-- An animated GIF row belongs here by the source kind and cannot live here: it never stops, so
     no two screenshots of this page agree and the baseline cannot be taken. Five attempts differed
     by 30, 108, 314, 323 and 207 pixels. That is WD-053 seen from the harness rather than from the
     page — `toHaveScreenshot` ends a CSS animation before it shoots and has nothing to end here.
     The component treats an animated source like any other, so no branch goes unphotographed; the
     Gallery's Image page renders one, and example 6 there is the site WD-053 is cited from. -->
