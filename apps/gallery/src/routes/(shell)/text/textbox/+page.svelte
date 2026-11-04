<script lang="ts">
	import { TextBox } from '@harena-hq/winui-svelte/preview';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/text/textbox');
	if (item === null) throw new Error('TextBox page has no Gallery item');
	const simpleSample = sampleOf('TextBox/SimpleTextbox.txt');
	const headerSample = sampleOf('TextBox/TextboxHeaderPlaceholderText.txt');
	const readOnlySample = sampleOf('TextBox/ReadOnlyTextboxVarious.txt');
	const multiLineSample = sampleOf('TextBox/MultiLineTextboxSpell.txt');
</script>

<ItemPage {item}>
	<ControlExample
		headerText={simpleSample.header ?? undefined}
		xaml={simpleSample.xaml ?? undefined}
	>
		<!-- TextBoxPage.xaml:22. -->
		<TextBox aria-label="simple TextBox" />
	</ControlExample>

	<ControlExample
		headerText={headerSample.header ?? undefined}
		xaml={headerSample.xaml ?? undefined}
	>
		<!-- TextBoxPage.xaml:26. -->
		<TextBox header="Enter your name:" placeholder="Name" />
	</ControlExample>

	<ControlExample
		headerText={readOnlySample.header ?? undefined}
		xaml={readOnlySample.xaml ?? undefined}
	>
		<!-- TextBoxPage.xaml:30-38. Foreground is the box's resting foreground. -->
		<TextBox
			aria-label="customized TextBox"
			readonly
			value="I am super excited to be here!"
			class="textbox-page-read-only"
		/>
	</ControlExample>

	<ControlExample
		headerText={multiLineSample.header ?? undefined}
		xaml={multiLineSample.xaml ?? undefined}
	>
		<!-- TextBoxPage.xaml:41-47: AcceptsReturn wraps its text, and IsSpellCheckEnabled is
		     HTML's spellcheck on the control, which its field inherits. On the reference guest
		     the empty box is one line, 32, tall and grows a line at a time as its lines wrap at
		     400; here it is three lines tall from the start, which WD-100 records.
		     SelectionHighlightColor is the box's selection highlight. MinWidth="400"
		     (TextBoxPage.xaml:42) is set inline, where it outranks the control's own minimum
		     width. -->
		<TextBox
			aria-label="multi-line TextBox"
			acceptsReturn
			spellcheck={true}
			class="textbox-page-multi-line"
			style="min-width: 400px"
		/>
	</ControlExample>
</ItemPage>

<style>
	/* FontFamily="Arial" FontSize="24" FontStyle="Italic" Foreground="#5178BE"
	   (TextBoxPage.xaml:33-36) reach the text through the field's inherited font, and the
	   foreground is the box's resting one. */
	:global(.textbox-page-read-only) {
		/* c1-allow: TextBoxPage.xaml:33, FontFamily="Arial", the page's own font. */
		font-family: Arial;
		/* c1-allow: TextBoxPage.xaml:34, FontSize="24". */
		font-size: 24px;
		font-style: italic;
		/* c1-allow: TextBoxPage.xaml:36, Foreground="#5178BE". */
		--winui-TextControlForeground: #5178be;
	}
	/* CharacterSpacing="200" (:32), in thousandths of an em, is not inherited: a text field's
	   letter-spacing is reset by the user agent. */
	:global(.textbox-page-read-only input) {
		/* c1-allow: TextBoxPage.xaml:32, CharacterSpacing="200", thousandths of an em. */
		letter-spacing: 0.2em;
	}
	/* SelectionHighlightColor="Green" (TextBoxPage.xaml:46). */
	:global(.textbox-page-multi-line) {
		/* c1-allow: TextBoxPage.xaml:46, SelectionHighlightColor="Green", the named colour. */
		--winui-TextControlSelectionHighlightColor: green;
	}
</style>
