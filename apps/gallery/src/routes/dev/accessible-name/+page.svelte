<script lang="ts">
	import { ComboBox, TextBox, ToggleSwitch } from '@harena-hq/winui-svelte/preview';

	/*
	 * The harness for the naming attributes, not part of the Gallery reproduction. Each control
	 * whose root is a wrapper is shown named by its header alone, by an `aria-label` over its
	 * header, by an `aria-labelledby` over its header, described by an `aria-describedby`, and
	 * with an empty `aria-label`, which names nothing and so falls through to the header. The
	 * non-editable ComboBoxes have a selection, which their trigger's name ends with. The spec
	 * reads the accessible name off the control itself.
	 */

	const items = [
		{ value: 'red', label: 'Red' },
		{ value: 'green', label: 'Green' }
	];
</script>

<svelte:head><title>Accessible names — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">Accessible names</h1>
<p id="outside-label" class="winui-BodyTextBlockStyle">Named from outside</p>
<p id="outside-description" class="winui-BodyTextBlockStyle">Described from outside</p>

<h2 class="winui-SubtitleTextBlockStyle">TextBox</h2>
<div class="row" data-testid="text-box">
	<TextBox header="Header" data-case="header" />
	<TextBox header="Header" aria-label="Label" data-case="label" />
	<TextBox header="Header" aria-labelledby="outside-label" data-case="labelledby" />
	<TextBox header="Header" aria-describedby="outside-description" data-case="describedby" />
	<TextBox header="Header" aria-label="" data-case="empty" />
	<TextBox placeholder="Placeholder" data-case="placeholder" />
	<TextBox header="Header" acceptsReturn aria-label="Label" data-case="textarea" />
</div>

<h2 class="winui-SubtitleTextBlockStyle">ComboBox</h2>
<div class="row" data-testid="combo-box">
	<ComboBox {items} value="red" header="Header" data-case="header" />
	<ComboBox {items} value="red" header="Header" aria-label="Label" data-case="label" />
	<ComboBox
		{items}
		value="red"
		header="Header"
		aria-labelledby="outside-label"
		data-case="labelledby"
	/>
	<ComboBox
		{items}
		value="red"
		header="Header"
		aria-describedby="outside-description"
		data-case="describedby"
	/>
	<ComboBox {items} value="red" header="Header" aria-label="" data-case="empty" />
	<ComboBox {items} value="red" data-case="unnamed" />
	<ComboBox {items} header="Header" placeholder="Pick one" data-case="nothing" />
</div>

<h2 class="winui-SubtitleTextBlockStyle">ComboBox, editable</h2>
<div class="row" data-testid="combo-box-editable">
	<ComboBox editable {items} header="Header" data-case="header" />
	<ComboBox editable {items} header="Header" aria-label="Label" data-case="label" />
	<ComboBox
		editable
		{items}
		header="Header"
		aria-labelledby="outside-label"
		data-case="labelledby"
	/>
	<ComboBox
		editable
		{items}
		header="Header"
		aria-describedby="outside-description"
		data-case="describedby"
	/>
	<ComboBox editable {items} header="Header" aria-label="" data-case="empty" />
</div>

<h2 class="winui-SubtitleTextBlockStyle">ToggleSwitch</h2>
<div class="row" data-testid="toggle-switch">
	<ToggleSwitch header="Header" data-case="header" />
	<ToggleSwitch header="Header" aria-label="Label" data-case="label" />
	<ToggleSwitch header="Header" aria-labelledby="outside-label" data-case="labelledby" />
	<ToggleSwitch header="Header" aria-describedby="outside-description" data-case="describedby" />
	<ToggleSwitch header="Header" aria-label="" data-case="empty" />
</div>

<style>
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 24px;
		align-items: flex-start;
	}
</style>
