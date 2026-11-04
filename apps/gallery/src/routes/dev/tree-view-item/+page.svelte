<script lang="ts">
	import { TreeViewItem } from '@harena-hq/winui-svelte/preview';
</script>

<svelte:head><title>TreeViewItem — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">TreeViewItem</h1>
<p class="winui-BodyTextBlockStyle">A tree row's chrome, indentation, and selection indicator.</p>

<h2 class="winui-SubtitleTextBlockStyle">at rest</h2>
<div class="row">
	<TreeViewItem><span class="winui-BodyTextBlockStyle">A leaf</span></TreeViewItem>
	<TreeViewItem expandable
		><span class="winui-BodyTextBlockStyle">An expandable node</span></TreeViewItem
	>
</div>

<h2 class="winui-SubtitleTextBlockStyle">selected</h2>
<div class="row">
	<TreeViewItem selected expandable expanded
		><span class="winui-BodyTextBlockStyle">Selected node</span></TreeViewItem
	>
</div>

<h2 class="winui-SubtitleTextBlockStyle">disabled</h2>
<div class="row">
	<TreeViewItem disabled><span class="winui-BodyTextBlockStyle">Disabled leaf</span></TreeViewItem>
	<TreeViewItem disabled selected expandable
		><span class="winui-BodyTextBlockStyle">Disabled selection</span></TreeViewItem
	>
</div>

<h2 class="winui-SubtitleTextBlockStyle">three depths</h2>
<div class="row">
	<TreeViewItem depth={0} expandable
		><span class="winui-BodyTextBlockStyle">Depth zero</span></TreeViewItem
	>
	<TreeViewItem depth={1} expandable expanded
		><span class="winui-BodyTextBlockStyle">Depth one</span></TreeViewItem
	>
	<TreeViewItem depth={2}><span class="winui-BodyTextBlockStyle">Depth two</span></TreeViewItem>
</div>

<style>
	.row {
		display: block;
		width: 360px;
		background: var(--winui-ApplicationPageBackgroundThemeBrush);
	}
</style>
