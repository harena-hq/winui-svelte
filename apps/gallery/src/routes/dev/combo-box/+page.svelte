<script lang="ts">
	import { ComboBox } from 'winui-svelte';
	import type { ComboBoxProps } from 'winui-svelte';

	/*
	 * The component's own harness, not part of the Gallery reproduction: `/dev/` is where
	 * each control gets a page to be photographed on, and nothing links to it. The nine
	 * rows below exercise the surface the unit names: nothing selected, a selection,
	 * a header and a description, a disabled item, disabled, and an open popup so the
	 * list reaches the snapshot, an item template, an item template, open, and, below the
	 * last spacer, disabled with nothing selected, the one row that draws the disabled
	 * placeholder.
	 */

	const colours: ComboBoxProps['items'] = [
		{ value: 'red', label: 'Red' },
		{ value: 'green', label: 'Green' },
		{ value: 'blue', label: 'Blue' },
		{ value: 'yellow', label: 'Yellow' }
	];

	const withDisabled: ComboBoxProps['items'] = [
		{ value: 'sans', label: 'Segoe UI' },
		{ value: 'serif', label: 'Times New Roman' },
		{ value: 'mono', label: 'Cascadia Mono', disabled: true },
		{ value: 'display', label: 'Segoe UI Display' }
	];

	/*
	 * The templated rows' data. `label` is what a template-less ComboBox would show and what
	 * the primitive matches typeahead against; the swatch beside it is drawn from the same
	 * string, which is the shape the Gallery's own colour combos have.
	 */
	const swatches: ComboBoxProps['items'] = [
		{ value: 'aqua', label: 'Aqua' },
		{ value: 'magenta', label: 'Magenta' },
		{ value: 'yellow', label: 'Yellow' }
	];

	let placeholder: ComboBoxProps['value'] = $state('');
	let selected: ComboBoxProps['value'] = $state('green');
	let headerDescription: ComboBoxProps['value'] = $state('');
	let withDisabledItem: ComboBoxProps['value'] = $state('');
	let disabledControl: ComboBoxProps['value'] = $state('blue');
	let openSelection: ComboBoxProps['value'] = $state('');
	let open = $state(true);
	let templated: ComboBoxProps['value'] = $state('magenta');
	let templatedOpen: ComboBoxProps['value'] = $state('');
	let openTemplated = $state(true);
</script>

<svelte:head><title>ComboBox — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">ComboBox</h1>
<p class="winui-BodyTextBlockStyle">
	Nine rows: placeholder, a selection, a header and a description, an item that is itself disabled,
	the control as a whole disabled, the popup open so the list reaches the snapshot, an item
	template, an item template, open, and the control disabled with nothing selected, the only row
	that shows the disabled placeholder.
</p>

<h2 class="winui-SubtitleTextBlockStyle">placeholder</h2>
<div class="row">
	<ComboBox items={colours} placeholder="Pick a colour" bind:value={placeholder} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">selected</h2>
<div class="row">
	<ComboBox items={colours} bind:value={selected} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">a header and a description</h2>
<div class="row">
	<ComboBox
		placeholder="Pick a colour"
		items={colours}
		header="Colours"
		description="The accent colour for the brand surface."
		bind:value={headerDescription}
	/>
</div>

<h2 class="winui-SubtitleTextBlockStyle">a disabled item</h2>
<div class="row">
	<ComboBox items={withDisabled} placeholder="Pick a colour" bind:value={withDisabledItem} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">disabled</h2>
<div class="row">
	<ComboBox items={colours} bind:value={disabledControl} disabled />
</div>

<h2 class="winui-SubtitleTextBlockStyle">open</h2>
<div class="row">
	<ComboBox items={colours} placeholder="Pick a colour" bind:value={openSelection} bind:open />
</div>

<div class="tail"></div>

<h2 class="winui-SubtitleTextBlockStyle">an item template</h2>
<div class="row">
	<ComboBox items={swatches} bind:value={templated} {itemTemplate} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">an item template, open</h2>
<div class="row">
	<ComboBox
		items={swatches}
		placeholder="Pick a colour"
		bind:value={templatedOpen}
		bind:open={openTemplated}
		{itemTemplate}
	/>
</div>

{#snippet itemTemplate(item: NonNullable<ComboBoxProps['items']>[number])}
	<span class="swatch-item">
		<span class="swatch" data-colour={item.value}></span>
		{item.label}
	</span>
{/snippet}

<div class="tail"></div>

<h2 class="winui-SubtitleTextBlockStyle">disabled, showing its placeholder</h2>
<div class="row">
	<ComboBox items={colours} placeholder="Pick a colour" disabled />
</div>

<style>
	/* Two rows hold an open popup in the snapshot, and each needs 220 of clearance under it for a
	   different reason. Under the templated one, without room below it Floating UI flips the popup
	   upward over the row above and hides that row from the baseline; the same spacer keeps that
	   popup off the disabled row placed after it. Under the `open` row, the popup does not flip —
	   it opens downward across the two rows that follow, and measured before this spacer it covered
	   the `an item template` heading and the whole of its trigger, which is the one row that shows
	   a template reaching the trigger. */
	.tail {
		height: 220px;
	}

	.row {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-bottom: 24px;
		max-width: 320px;
	}

	/* The harness's own template: a square of colour beside the label. The three colours are
	   the harness's subject rather than a theme value, and a data attribute is what keeps them
	   in the stylesheet instead of in an inline style. */
	.swatch-item {
		display: flex;
		align-items: center;
		gap: 8px;
		min-width: 0;
	}

	.swatch {
		width: 16px;
		height: 16px;
		flex: none;
	}

	.swatch[data-colour='aqua'] {
		/* c1-allow: the harness's three sample colours, which are what these rows exist to show. */
		background: #00ffff;
	}
	.swatch[data-colour='magenta'] {
		/* c1-allow: the harness's three sample colours, which are what these rows exist to show. */
		background: #ff00ff;
	}
	.swatch[data-colour='yellow'] {
		/* c1-allow: the harness's three sample colours, which are what these rows exist to show. */
		background: #ffff00;
	}
</style>
