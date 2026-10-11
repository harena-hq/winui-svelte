<script lang="ts">
	import { ComboBox, Expander } from 'winui-svelte/preview';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/layout/expander');
	if (item === null) throw new Error('Expander page has no Gallery item');
	const textSample = sampleOf('Expander/ExpanderTextHeaderContent.txt');
	const alignmentSample = sampleOf('Expander/ModifyingExpandersContentAlignment.txt');

	const DIRECTIONS = [
		{ value: 'Down', label: 'Down' },
		{ value: 'Up', label: 'Up' }
	];

	let open = $state(false);
	let direction = $state('Down');
	// ExpanderPage.xaml.cs:15-32: Up also aligns the Expander to the bottom, so it expands
	// upwards with its header held in place; anything else is Down, aligned to the top.
	const up = $derived(direction === 'Up');
</script>

<ItemPage {item}>
	<ControlExample
		headerText={textSample.header ?? undefined}
		xaml={textSample.xaml ?? undefined}
		substitutions={{
			IsExpanded: open ? 'True' : 'False',
			ExpandDirection: direction,
			VerticalAlignment: up ? 'Bottom' : 'Top'
		}}
	>
		<!-- ExpanderPage.xaml:24-30. -->
		<Expander
			bind:open
			expandDirection={up ? 'up' : 'down'}
			data-vertical-alignment={up ? 'bottom' : 'top'}
		>
			{#snippet header()}This text is in the header{/snippet}
			This is in the content
		</Expander>
		{#snippet options()}
			<!-- ExpanderPage.xaml:33-42: a StackPanel holding the one ComboBox. -->
			<ComboBox items={DIRECTIONS} bind:value={direction} header="ExpandDirection" />
		{/snippet}
	</ControlExample>

	<ControlExample
		headerText={alignmentSample.header ?? undefined}
		xaml={alignmentSample.xaml ?? undefined}
	>
		<!-- ExpanderPage.xaml:54-64: Width="500", Padding="0" and HorizontalContentAlignment="Left".
		     `Padding` is not a prop: Expander.xaml:114 binds the content border's Padding to the
		     control's, and the token reaches it by inheritance, as on the dev route. The sample
		     text shows a ToggleButton and a Button where the page draws two TextBlocks; the page
		     is what is reproduced, and the source pane shows the sample as the original does. -->
		<div class="no-padding">
			<Expander style="width: 500px" horizontalContentAlignment="left">
				{#snippet header()}
					<!-- HorizontalAlignment="Center" (ExpanderPage.xaml:59). `display: block`
					     because the header presenter stretches its child, so an inline span would
					     centre nothing. -->
					<span class="centered">This text is centered</span>
				{/snippet}
				<!-- Margin="4" (ExpanderPage.xaml:62). -->
				<span class="left-aligned">And this text is left aligned</span>
			</Expander>
		</div>
	</ControlExample>
</ItemPage>

<style>
	.no-padding {
		/* c1-allow: ExpanderPage.xaml:56, Padding="0", through the token ADR 0002 publishes. */
		--winui-ExpanderContentPadding: 0;
	}

	.centered {
		display: block;
		text-align: center;
	}

	.left-aligned {
		/* c1-allow: ExpanderPage.xaml:62, Margin="4". */
		margin: 4px;
	}
</style>
