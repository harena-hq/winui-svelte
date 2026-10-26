<script lang="ts">
	import { ComboBox } from 'winui-svelte/preview';

	/*
	 * A disabled row drawn as the one selected, for `ComboBoxItem::ChangeVisualState`, which
	 * for content that is not a control chooses `Disabled` before it considers selection,
	 * pointer or press (`ComboBoxItem_Partial.cpp:447-453`). An
	 * editable list draws the selected look on the selection when it opens, and a consumer may
	 * select a row it has disabled, so this one opens with its disabled row selected.
	 *
	 * **Nothing photographs this page.** `combo-box-disabled-row.spec.ts` reads the rows' styles.
	 */
	const fonts = [
		{ value: 'sans', label: 'Segoe UI' },
		{ value: 'serif', label: 'Times New Roman' },
		{ value: 'mono', label: 'Cascadia Mono', disabled: true },
		{ value: 'display', label: 'Segoe UI Display' }
	];
	let font = $state('mono');
</script>

<svelte:head><title>ComboBox disabled row — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">ComboBox — a disabled row selected</h1>

<section data-testid="editable">
	<ComboBox editable items={fonts} bind:value={font} style="width: 200px" />
</section>
