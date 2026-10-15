<script lang="ts">
	import { Button, CheckBox, Image } from 'winui-svelte/preview';
	import { fitLines } from '$lib/fit-lines';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/basicinput/button');
	if (item === null) throw new Error('Button page has no Gallery item');
	const simpleSample = sampleOf('Button/ButtonSimple.txt');
	const imageSample = sampleOf('Button/ButtonWithImage.txt');
	const stylesSample = sampleOf('Button/ButtonBuiltInStyles.txt');
	const wrappingSample = sampleOf('Button/ButtonWrapping.txt');

	let disabled = $state(false);
	// ButtonPage.xaml.cs:16-33: each button's Click writes its own name into its own output.
	let output1 = $state('');
	let output2 = $state('');
</script>

<ItemPage {item}>
	<ControlExample
		headerText={simpleSample.header ?? undefined}
		xaml={simpleSample.xaml ?? undefined}
		csharp={simpleSample.csharp ?? undefined}
		substitutions={{
			// ButtonPage.xaml:39-42: written while the box is checked, and a disabled
			// substitution writes nothing.
			IsEnabled: disabled ? 'IsEnabled="False" ' : ''
		}}
	>
		<!-- ButtonPage.xaml:23-28. -->
		<Button aria-label="Standard XAML" {disabled} onclick={() => (output1 = 'You clicked: Button1')}
			>Standard XAML button</Button
		>
		{#snippet output()}
			<!-- ButtonPage.xaml:31, FontFamily="Global User Interface". Its text layout takes the
			     name as the default font (TextBlock.cpp:1208-1216), and on the reference guest the
			     glyphs are the label's; its line is not. There its ink sits 17 below the label's,
			     where other lines' pitch is 19, and the example ends two rows above where a line of
			     19 would end it. -->
			<span class="winui-BodyTextBlockStyle output-line global-ui">{output1}</span>
		{/snippet}
		{#snippet options()}
			<!-- ButtonPage.xaml:34-36. -->
			<CheckBox bind:checked={disabled}>Disable button</CheckBox>
		{/snippet}
	</ControlExample>

	<ControlExample headerText={imageSample.header ?? undefined} xaml={imageSample.xaml ?? undefined}>
		<!-- ButtonPage.xaml:48-57: a 50 by 50 Button whose content is the Image, which an
		     Image's default Stretch, Uniform, fits inside the Button's padding. The horizontal
		     StackPanel around it holds nothing else and is not drawn. -->
		<Button
			aria-label="Pie"
			style="width: 50px; height: 50px"
			onclick={() => (output2 = 'You clicked: Button2')}
		>
			<Image source="/Slices.png" alt="Slice" style="width: 100%; height: 100%" />
		</Button>
		{#snippet output()}
			<!-- ButtonPage.xaml:60. -->
			<span class="winui-BodyTextBlockStyle output-line">{output2}</span>
		{/snippet}
	</ControlExample>

	<ControlExample
		headerText={stylesSample.header ?? undefined}
		xaml={stylesSample.xaml ?? undefined}
	>
		<!-- ButtonPage.xaml:76-85: AccentButtonStyle and SubtleButtonStyle, Spacing="16". -->
		<div class="styles">
			<Button aria-label="Accent style" variant="accent">Accent style button</Button>
			<Button aria-label="Subtle style" variant="subtle">Subtle style button</Button>
		</div>
	</ControlExample>

	<ControlExample
		headerText={wrappingSample.header ?? undefined}
		xaml={wrappingSample.xaml ?? undefined}
	>
		<!-- ButtonPage.xaml:91-112. The StackPanel is as wide as its widest child, and the two
		     Stretch buttons span it. Here that holds while no paragraph wraps: once one does,
		     the column takes the width it was offered, where the original's takes its widest
		     wrapped line. CSS has no length for that; fitLines supplies it for the wrapped
		     buttons below, and the column is not fitted. -->
		<div class="wrapping">
			<p class="winui-BodyTextBlockStyle">
				The following buttons' content may get clipped if we don't pay careful attention to their
				layout containers.
			</p>
			<p class="winui-BodyTextBlockStyle">
				One option to mitigate clipped content is to place Buttons underneath each other, allowing
				for more space to grow horizontally:
			</p>
			<Button class="stretch first">This is some text that is too long and will get cut off</Button>
			<Button>This is another text that would result in being cut off</Button>
			<p class="winui-BodyTextBlockStyle another">
				Another option is to explicitly wrap the Button's content
			</p>
			<!-- MaxWidth="240" with a wrapping TextBlock inside. The original's buttons are as
			     wide as their widest wrapped line, 225 and 211 on the reference guest, and
			     fitLines sizes each text to its widest line as the TextBlock does. -->
			<div class="wrapped-row">
				<Button class="wrapped first">
					<span class="wraps" {@attach fitLines}
						>This is some text that is too long and will get cut off without wrapping</span
					>
				</Button>
				<Button class="wrapped">
					<span class="wraps" {@attach fitLines}
						>This is another text that would result in being cut off without wrapping</span
					>
				</Button>
			</div>
		</div>
	</ControlExample>
</ItemPage>

<style>
	/* StackPanel Orientation="Horizontal" Spacing="16" (ButtonPage.xaml:76). */
	.styles {
		display: flex;
		/* c1-allow: ButtonPage.xaml:76, Spacing="16". */
		gap: 16px;
	}

	/* The outer StackPanel (ButtonPage.xaml:91): as wide as its widest child, which the
	   example's left alignment leaves it. */
	.wrapping {
		display: flex;
		flex-direction: column;
	}
	.wrapping p {
		/* c1-allow: ButtonPage.xaml:93 and :97, Margin="0,0,0,8". */
		margin: 0 0 8px;
	}
	/* No TextWrapping on this one (ButtonPage.xaml:103), so it does not wrap. Whether it would
	   otherwise depends on the font: the column is no narrower than a stretched button's
	   unwrapped text with its padding and border, and that is about this line's width. */
	.wrapping p.another {
		/* c1-allow: ButtonPage.xaml:103, Margin="0,8,0,8". */
		margin: 8px 0;
		white-space: nowrap;
	}
	/* The first Stretch button's Margin="0,0,0,5" (ButtonPage.xaml:100). Both stretch across
	   the column as the column's children do (ButtonPage.xaml:100-101). */
	.wrapping :global(.stretch.first) {
		/* c1-allow: ButtonPage.xaml:100, Margin="0,0,0,5". */
		margin-bottom: 5px;
	}
	/* The inner StackPanel, centred (ButtonPage.xaml:104). */
	.wrapped-row {
		display: flex;
		align-self: center;
	}
	.wrapped-row :global(.wrapped) {
		/* c1-allow: ButtonPage.xaml:105 and :108, MaxWidth="240". */
		max-width: 240px;
	}
	.wrapped-row :global(.wrapped.first) {
		/* c1-allow: ButtonPage.xaml:105, Margin="0,0,8,0". */
		margin-right: 8px;
	}
	/* An empty TextBlock is still formatted into one line (TextBlock.cpp:1655-1661), so each
	   output holds a line's height before its first click, as the original's do. */
	.output-line {
		min-height: 1lh;
	}

	/* Both measurements of the "Global User Interface" line on the reference guest: a line box
	   of 17, which puts the example's bottom edge on the original's row, and ink 17 below the
	   label's, which CSS's even split of the leading puts a row lower, so it is lifted by one. */
	.global-ui {
		/* c1-allow: measured on the guest, ButtonPage.xaml:31's line box. */
		line-height: 17px;
		position: relative;
		/* c1-allow: measured on the guest, the ink a row above where the 17 alone puts it. */
		top: -1px;
	}

	/* TextWrapping="WrapWholeWords" against the Button's own nowrap. */
	.wraps {
		white-space: normal;
		text-align: left;
	}
</style>
