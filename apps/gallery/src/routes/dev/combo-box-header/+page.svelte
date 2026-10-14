<script lang="ts">
	import { ComboBox } from 'winui-svelte/preview';

	/*
	 * A ComboBox header with a word wider than the box, for `TextWrapping="Wrap"` on the header
	 * (`ComboBox_themeresources.xaml:569`): the Gallery's TabView page sets the header
	 * "TabViewItem CloseButtonOverlayMode" on a ComboBox `Width="150"` (`TabViewPage.xaml:286-294`).
	 *
	 * **Nothing photographs this page.** `combo-box-header.spec.ts` reads the header's lines.
	 */
	const items = [
		{ value: 'auto', label: 'Auto' },
		{ value: 'always', label: 'Always' },
		{ value: 'onPointerOver', label: 'OnHover' }
	];
	let value = $state('always');
</script>

<svelte:head><title>ComboBox header — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">ComboBox — a header wider than the box</h1>

<div id="narrow">
	<ComboBox {items} bind:value header="TabViewItem CloseButtonOverlayMode" style="width: 150px" />
</div>
