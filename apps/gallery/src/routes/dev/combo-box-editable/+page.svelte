<script lang="ts">
	import { ComboBox } from '@harena-hq/winui-svelte/preview';
	import type { ComboBoxTextSubmittedEventArgs } from '@harena-hq/winui-svelte/preview';

	const sizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 36, 48, 72];
	const sizeItems = sizes.map((n) => ({ value: String(n), label: String(n) }));
	const colours = ['Red', 'Green', 'Blue', 'Yellow'].map((label) => ({
		value: label.toLowerCase(),
		label
	}));
	let fontSize = $state('10');
	let fontSizeText = $state('');
	let rejected = $state<string[]>([]);
	let colour = $state('');
	let colourText = $state('');
	let submitted = $state<string[]>([]);
	let handled = $state('green');
	let handledSubmitted = $state<string[]>([]);
	function submitSize(args: ComboBoxTextSubmittedEventArgs) {
		const n = Number(args.text);
		const isDouble = args.text.trim() !== '' && Number.isFinite(n);
		if (isDouble && (sizes.includes(n) || (n < 100 && n > 8))) {
			fontSize = String(n);
		} else {
			fontSizeText = fontSize;
			rejected = [...rejected, args.text];
		}
	}
</script>

<svelte:head><title>ComboBox editable — harness</title></svelte:head>

<div class="harness">
	<h1 class="winui-TitleTextBlockStyle">ComboBox editable</h1>
	<p class="winui-BodyTextBlockStyle">
		Four rows: font size submission, custom colours, handled submission, and disabled.
	</p>
	<section data-testid="font-size">
		<ComboBox
			header="Font Size"
			style="width: 200px"
			editable
			items={sizeItems}
			bind:value={fontSize}
			bind:text={fontSizeText}
			onTextSubmitted={submitSize}
		/>
		<p data-testid="font-size-output" style="font-size: {fontSize}px">
			You can set the font size used for this text.
		</p>
		<ol data-testid="font-size-rejected">
			{#each rejected as entry, index (index)}<li>{entry}</li>{/each}
		</ol>
	</section>
	<section data-testid="colours">
		<ComboBox
			editable
			placeholder="Pick a colour"
			items={colours}
			bind:value={colour}
			bind:text={colourText}
			onTextSubmitted={(args) => (submitted = [...submitted, args.text])}
		/>
		<ol data-testid="colours-submitted">
			{#each submitted as entry, index (index)}<li>{entry}</li>{/each}
		</ol>
		<output data-testid="colours-value">{colour}</output>
		<button type="button" data-testid="colours-set-text" onclick={() => (colourText = 'gr')}>
			Set the text to "gr"
		</button>
	</section>
	<section data-testid="handled">
		<ComboBox
			editable
			items={colours}
			bind:value={handled}
			onTextSubmitted={(args) => {
				args.handled = true;
				handledSubmitted = [...handledSubmitted, args.text];
			}}
		/>
		<ol data-testid="handled-submitted">
			{#each handledSubmitted as entry, index (index)}<li>{entry}</li>{/each}
		</ol>
		<output data-testid="handled-value">{handled}</output>
	</section>
	<!-- A press here takes no focus, as a press on an inert area of the reference does. -->
	<div
		class="pad"
		data-testid="inert-pad"
		role="presentation"
		onmousedown={(event) => event.preventDefault()}
	>
		A press here does not take focus.
	</div>
	<section data-testid="disabled">
		<ComboBox editable disabled items={colours} value="blue" />
	</section>
</div>

<style>
	.harness {
		padding-bottom: 400px;
	}
	section {
		margin-bottom: 12px;
	}
</style>
