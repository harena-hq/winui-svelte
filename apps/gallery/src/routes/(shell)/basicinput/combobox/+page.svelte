<script lang="ts">
	import { ComboBox, ContentDialog } from 'winui-svelte/preview';
	import type { ComboBoxTextSubmittedEventArgs } from 'winui-svelte/preview';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/basicinput/combobox');
	if (item === null) throw new Error('ComboBox page has no Gallery item');
	const inlineSample = sampleOf('ComboBox/ComboBoxInline.txt');
	const itemsSourceSample = sampleOf('ComboBox/ComboBoxItemsSource.txt');
	const editableSample = sampleOf('ComboBox/ComboBoxEditable.txt');

	// ComboBoxPage.xaml:31-34, and the `Colors` each one fills the rectangle with
	// (ComboBoxPage.xaml.cs:43-60).
	const COLORS = [
		{ value: 'Blue', label: 'Blue', fill: '#0000ff' },
		{ value: 'Green', label: 'Green', fill: '#008000' },
		{ value: 'Red', label: 'Red', fill: '#ff0000' },
		{ value: 'Yellow', label: 'Yellow', fill: '#ffff00' }
	];
	let color = $state('');
	// Unset until the first selection, as the Rectangle's Fill is.
	const fill = $derived(COLORS.find((c) => c.value === color)?.fill);

	// FontHelper.cs:10-17, each item named for the family it sets.
	const FONTS = ['Arial', 'Comic Sans MS', 'Courier New', 'Segoe UI', 'Times New Roman'].map(
		(name) => ({ value: name, label: name })
	);
	// SelectedIndex="2" (ComboBoxPage.xaml:52).
	let font = $state(FONTS[2].value);

	// ComboBoxPage.xaml.cs:16-32.
	const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 36, 48, 72];
	const FONT_SIZE_ITEMS = FONT_SIZES.map((n) => ({ value: String(n), label: String(n) }));
	// `Combo3_Loaded` selects index 2 (ComboBoxPage.xaml.cs:65).
	let fontSize = $state(String(FONT_SIZES[2]));
	let invalidSize = $state(false);

	/**
	 * `double.TryParse` under en-US, for the finite numbers it accepts: white space around,
	 * a sign, thousands separators in the integral part, a decimal point and an exponent.
	 * Its `Infinity` and `NaN` fail the range test below either way, so they are `null`.
	 */
	function parseDouble(text: string): number | null {
		const m = /^[\t-\r ]*([+-]?)(\d[\d,]*)?(?:\.(\d*))?(?:[eE]([+-]?\d+))?[\t-\r ]*$/.exec(text);
		if (m === null || (m[2] === undefined && !m[3])) return null;
		const n = Number(`${m[1]}${(m[2] ?? '0').replace(/,/g, '')}.${m[3] || '0'}e${m[4] ?? '0'}`);
		return Number.isFinite(n) ? n : null;
	}

	// `Combo3_TextSubmitted` (ComboBoxPage.xaml.cs:73-100): a listed size, or one strictly
	// between 8 and 100, becomes the selection; anything else says why. Either way the event is
	// handled, so the text never becomes a value on its own. On rejection the original writes
	// the unchanged selection back into the text (ComboBoxPage.xaml.cs:88); here the ComboBox's
	// commit writes the selection's text after every submit.
	function submitFontSize(args: ComboBoxTextSubmittedEventArgs) {
		const n = parseDouble(args.text);
		if (n !== null && (FONT_SIZES.includes(n) || (n < 100 && n > 8))) {
			fontSize = String(n);
		} else {
			invalidSize = true;
		}
		args.handled = true;
	}
</script>

<ItemPage {item}>
	<ControlExample
		headerText={inlineSample.header ?? undefined}
		xaml={inlineSample.xaml ?? undefined}
	>
		<!-- ComboBoxPage.xaml:24-41: a StackPanel of the ComboBox and the Rectangle it fills. -->
		<div class="stack">
			<ComboBox
				items={COLORS}
				bind:value={color}
				header="Colors"
				placeholder="Pick a color"
				style="width: 200px"
			/>
			<div class="swatch" style:background={fill} data-color-output></div>
		</div>
	</ControlExample>

	<ControlExample
		headerText={itemsSourceSample.header ?? undefined}
		xaml={itemsSourceSample.xaml ?? undefined}
	>
		<!-- ComboBoxPage.xaml:47-65. The item template is a TextBlock of the item's name, which
		     is the label. The sample text shows a tuple source and a fixed width where the page
		     binds FontHelper.Fonts with a MinWidth; the page is what is reproduced, and the
		     source pane shows the sample as the original does. -->
		<div class="stack">
			<ComboBox items={FONTS} bind:value={font} header="Font" style="min-width: 200px" />
			<!-- c1-allow: ComboBoxPage.xaml:62 binds the text's FontFamily to the selected item's,
			     which FontHelper.cs:12-16 names after the family. -->
			<span class="output winui-BodyTextBlockStyle" style:font-family={`'${font}'`} data-font-output
				>You can set the font used for this text.</span
			>
		</div>
	</ControlExample>

	<ControlExample
		headerText={editableSample.header ?? undefined}
		xaml={editableSample.xaml ?? undefined}
	>
		<!-- ComboBoxPage.xaml:71-85. -->
		<div class="stack">
			<ComboBox
				items={FONT_SIZE_ITEMS}
				bind:value={fontSize}
				onTextSubmitted={submitFontSize}
				editable
				header="Font Size"
				style="width: 200px"
			/>
			<span
				class="output winui-BodyTextBlockStyle sized"
				style:font-size={`${fontSize}px`}
				data-font-size-output>You can set the font size used for this text.</span
			>
		</div>
	</ControlExample>
</ItemPage>

<!-- ComboBoxPage.xaml.cs:90-95: no title, the message as content, and Close the default. -->
<ContentDialog bind:open={invalidSize} closeButtonText="Close" defaultButton="close">
	The font size must be a number between 8 and 100.
</ContentDialog>

<style>
	/* A StackPanel stretches its children across its width, which is its widest child's. */
	.stack {
		display: flex;
		flex-direction: column;
	}

	/* The ComboBox style's HorizontalAlignment="Left" (ComboBox_themeresources.xaml:376). */
	.stack > :global(:first-child) {
		align-self: flex-start;
	}

	/* ComboBoxPage.xaml:36-40: Width="100" Height="30" Margin="0,8,0,0". Its alignment is
	   left at Stretch, which centres a fixed width in the panel's. */
	.swatch {
		align-self: center;
		/* c1-allow: ComboBoxPage.xaml:38-40. */
		width: 100px;
		height: 30px;
		margin-top: 8px;
	}

	/* OutputTextBlockStyle (Styles/TextBlock.xaml:3-8): BodyTextBlockStyle with Margin="8,8,0,0". */
	.output {
		/* c1-allow: Styles/TextBlock.xaml:7, Margin="8,8,0,0". */
		margin: 8px 0 0 8px;
	}

	/* The size is the selection's. */
	.sized {
		/* c1-allow: ComboBoxPage.xaml:81, FontFamily="Segoe UI". */
		font-family: 'Segoe UI';
	}
</style>
